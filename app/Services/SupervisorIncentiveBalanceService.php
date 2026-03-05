<?php

namespace App\Services;

use App\Models\Down;
use App\Models\SupervisorIncentiveBalance;
use App\Models\SupervisorIncentiveDeduction;
use App\Models\SupervisorIncentiveProfile;
use App\Models\Guards\Guard;
use App\Models\IncentiveSetting;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Service for managing supervisor/sergeant incentive balances
 * Handles balance initialization, deductions for unresolved issues, and monthly disbursement
 * Uses a 15th-to-15th monthly cycle
 */
class SupervisorIncentiveBalanceService
{
    /**
     * Get the deduction amount per unresolved issue from settings
     */
    public function getDeductionAmount(): float
    {
        $setting = IncentiveSetting::where('key', 'incentives.supervisor_deduction_amount')->first();
        return $setting ? (float) $setting->value : 5000.00;
    }

    /**
     * Get the current period based on 15th-to-15th cycle
     * Returns [year, month] where month represents the period ending month
     * Example: Jan 15 - Feb 14 = period month 2 (February)
     */
    public function getCurrentPeriod(): array
    {
        $now = now();
        $day = $now->day;
        
        if ($day >= 15) {
            // We're in the period that ends next month
            // e.g., Jan 15 - we're in Jan 15 to Feb 14 period, which "belongs" to Feb
            $periodMonth = $now->copy()->addMonth()->month;
            $periodYear = $now->copy()->addMonth()->year;
        } else {
            // We're in the period that ends this month
            // e.g., Feb 10 - we're in Jan 15 to Feb 14 period, which "belongs" to Feb
            $periodMonth = $now->month;
            $periodYear = $now->year;
        }
        
        return [$periodYear, $periodMonth];
    }

    /**
     * Get period label for display (e.g., "Jan 15 - Feb 14, 2026")
     */
    public function getPeriodLabel(int $year, int $month): string
    {
        $endDate = Carbon::createFromDate($year, $month, 14);
        $startDate = $endDate->copy()->subMonth()->addDay(); // 15th of previous month
        
        return $startDate->format('M j') . ' - ' . $endDate->format('M j, Y');
    }

    /**
     * Check if today is the last day of the period (14th)
     */
    public function isLastDayOfPeriod(): bool
    {
        return now()->day === 14;
    }

    /**
     * Check if today is within the disbursement window (8th-12th of the month)
     * Disbursement happens for the previous period during this window
     */
    public function isDisbursementWindow(): bool
    {
        $day = now()->day;
        return $day >= 8 && $day <= 12;
    }

    /**
     * Get the period to disburse (the one that ended before the current window)
     * If we're in 8-12th window, we disburse the period that ended on the 14th of previous month
     */
    public function getPeriodToDisburse(): array
    {
        $now = now();
        $day = $now->day;
        
        // During disbursement window (8-12th), we're paying out the period
        // that ended on the 14th of the PREVIOUS month
        // e.g., on Feb 8-12, we pay out the Jan 15 - Feb 14 period
        if ($day >= 8 && $day <= 12) {
            // Period ending month is the previous month
            $endDate = $now->copy()->subMonth();
            return [$endDate->year, $endDate->month];
        }
        
        // Outside disbursement window, no disbursement should happen
        return [null, null];
    }

    /**
     * Get or create balance for a supervisor/sergeant for the current period
     */
    public function getOrCreateBalance(int $guardId, ?int $year = null, ?int $month = null): SupervisorIncentiveBalance
    {
        if ($year === null || $month === null) {
            [$year, $month] = $this->getCurrentPeriod();
        }

        $balance = SupervisorIncentiveBalance::forGuard($guardId)
            ->forPeriod($year, $month)
            ->first();

        if (!$balance) {
            $profile = SupervisorIncentiveProfile::where('guard_id', $guardId)
                ->where('is_active', true)
                ->first();

            $baseAmount = $profile?->base_amount ?? $this->getDefaultBaseAmount($guardId);

            $balance = SupervisorIncentiveBalance::create([
                'guard_id' => $guardId,
                'year' => $year,
                'month' => $month,
                'base_amount' => $baseAmount,
                'current_balance' => $baseAmount,
                'total_deductions' => 0,
                'status' => 'active',
            ]);
        }

        return $balance;
    }

    /**
     * Get default base amount based on role
     */
    protected function getDefaultBaseAmount(int $guardId): float
    {
        $guard = Guard::find($guardId);
        
        if (!$guard) {
            return 50000.00; // Default fallback
        }

        // Check if sergeant or supervisor
        if (str_contains(strtolower($guard->employee_role ?? ''), 'sergeant')) {
            return 40000.00;
        }

        return 50000.00; // Supervisor default
    }

    /**
     * Process a down/issue for incentive deduction
     * Called when a down is resolved or at end of day
     */
    public function processDown(Down $down, array $resolutionData): ?SupervisorIncentiveDeduction
    {
        // Skip if doesn't affect incentive
        if (!$down->affects_incentive) {
            return null;
        }

        // Skip if already processed
        if ($down->incentive_deducted_at) {
            return null;
        }

        $supervisorId = $down->supervisor_id ?? $this->findResponsibleSupervisor($down);
        
        if (!$supervisorId) {
            return null;
        }

        $balance = $this->getOrCreateBalance($supervisorId);
        $resolutionType = $resolutionData['resolution_type'] ?? 'unresolved';

        // Determine deduction amount based on resolution
        $deductionAmount = $this->calculateDeduction($down, $resolutionType);

        // If self-resolved, no deduction
        if ($resolutionType === 'self_resolved') {
            $this->markDownAsProcessed($down, 0, $resolutionData);
            return null;
        }

        // Apply deduction for control_room_resolved or unresolved
        if ($deductionAmount > 0) {
            $reason = $this->buildDeductionReason($down, $resolutionType, $resolutionData);
            
            $deduction = $balance->applyDeduction(
                $deductionAmount,
                $down->id,
                $reason,
                $resolutionData
            );

            $this->markDownAsProcessed($down, $deductionAmount, $resolutionData);

            return $deduction;
        }

        return null;
    }

    /**
     * Calculate deduction amount based on resolution type
     */
    protected function calculateDeduction(Down $down, string $resolutionType): float
    {
        // Self-resolved: no deduction
        if ($resolutionType === 'self_resolved') {
            return 0;
        }

        // Get custom amount if set, otherwise use default from settings
        $baseAmount = $down->incentive_deduction_amount ?? $this->getDeductionAmount();

        // Control room resolved: partial deduction (50%)
        if ($resolutionType === 'control_room_resolved') {
            return $baseAmount * 0.5;
        }

        // Escalated or unresolved: full deduction
        return $baseAmount;
    }

    /**
     * Build human-readable deduction reason
     */
    protected function buildDeductionReason(Down $down, string $resolutionType, array $resolutionData): string
    {
        $reason = "Down #{$down->id}: ";
        
        switch ($resolutionType) {
            case 'control_room_resolved':
                $resolver = $resolutionData['resolved_by_name'] ?? 'Control Room';
                $method = $resolutionData['resolution_method'] ?? 'intervention';
                $reason .= "Resolved by {$resolver} via {$method} (not self-resolved)";
                break;
            case 'escalated':
                $reason .= "Issue was escalated - not resolved at supervisor level";
                break;
            case 'unresolved':
                $reason .= "Issue remained unresolved at end of day";
                break;
            default:
                $reason .= "Issue not resolved by supervisor";
        }

        return $reason;
    }

    /**
     * Mark down as processed for incentives
     */
    protected function markDownAsProcessed(Down $down, float $amount, array $resolutionData): void
    {
        $down->incentive_deduction_amount = $amount;
        $down->incentive_deducted_at = now();
        $down->resolution_type = $resolutionData['resolution_type'] ?? 'unresolved';
        $down->resolved_by_user_id = $resolutionData['resolved_by'] ?? null;
        $down->save();
    }

    /**
     * Find responsible supervisor for a down
     */
    protected function findResponsibleSupervisor(Down $down): ?int
    {
        // If guard has a supervisor assigned
        if ($down->guard?->supervisor_id) {
            return $down->guard->supervisor_id;
        }

        // If site has a supervisor
        if ($down->site?->supervisor_id) {
            return $down->site->supervisor_id;
        }

        return null;
    }

    /**
     * Process all pending downs at end of period (14th)
     * Deduct for any unresolved issues
     */
    public function processEndOfDayDeductions(): array
    {
        $results = [
            'processed' => 0,
            'deductions' => 0,
            'amount' => 0,
        ];

        // Find downs from this period that haven't been processed for incentives
        // Period is 15th to 14th
        [$periodYear, $periodMonth] = $this->getCurrentPeriod();
        $periodEnd = Carbon::createFromDate($periodYear, $periodMonth, 14);
        $periodStart = $periodEnd->copy()->subMonth()->addDay(); // 15th of previous month

        $pendingDowns = Down::whereBetween('created_at', [$periodStart->startOfDay(), $periodEnd->endOfDay()])
            ->where('affects_incentive', true)
            ->whereNull('incentive_deducted_at')
            ->where(function ($q) {
                $q->whereNull('status')
                  ->orWhere('status', '!=', 'resolved');
            })
            ->get();

        foreach ($pendingDowns as $down) {
            $deduction = $this->processDown($down, [
                'resolution_type' => 'unresolved',
                'resolved_by' => null,
            ]);

            if ($deduction) {
                $results['deductions']++;
                $results['amount'] += $deduction->deduction_amount;
            }
            $results['processed']++;
        }

        return $results;
    }

    /**
     * Disburse all active balances for a period
     */
    public function disburseMonthlyBalances(int $year, int $month, int $disbursedBy): array
    {
        $results = [
            'disbursed' => 0,
            'total_amount' => 0,
        ];

        $balances = SupervisorIncentiveBalance::forPeriod($year, $month)
            ->where('status', 'active')
            ->get();

        foreach ($balances as $balance) {
            $amount = $balance->getAvailableBalance();
            
            if ($amount > 0) {
                $balance->disburse($disbursedBy, $amount);
                
                $results['disbursed']++;
                $results['total_amount'] += $amount;
            }
        }

        return $results;
    }

    /**
     * Disburse balances for the current period (convenience method)
     */
    public function disburseCurrentPeriod(int $disbursedBy): array
    {
        [$year, $month] = $this->getCurrentPeriod();
        return $this->disburseMonthlyBalances($year, $month, $disbursedBy);
    }

    /**
     * Get the previous period (for disbursement on 8-12th)
     * During 8-12th, returns the period that just ended (to be disbursed)
     */
    public function getPreviousPeriod(): array
    {
        $now = now();
        $day = $now->day;
        
        if ($day >= 8 && $day <= 12) {
            // We're in disbursement window, previous period ended last month
            $endDate = $now->copy()->subMonth();
            return [$endDate->year, $endDate->month];
        } elseif ($day > 12) {
            // After disbursement window, previous period ended this month on 14th
            return [$now->year, $now->month];
        } else {
            // Before disbursement window (day 1-7), previous period ended 2 months ago
            $endDate = $now->copy()->subMonths(2);
            return [$endDate->year, $endDate->month];
        }
    }

    /**
     * Get balance summary for a supervisor
     */
    public function getBalanceSummary(int $guardId, ?int $year = null, ?int $month = null): array
    {
        $year = $year ?? now()->year;
        $month = $month ?? now()->month;

        $balance = SupervisorIncentiveBalance::forGuard($guardId)
            ->forPeriod($year, $month)
            ->with('deductions')
            ->first();

        if (!$balance) {
            return [
                'guard_id' => $guardId,
                'year' => $year,
                'month' => $month,
                'base_amount' => 0,
                'current_balance' => 0,
                'total_deductions' => 0,
                'deduction_count' => 0,
                'status' => 'no_balance',
            ];
        }

        return [
            'guard_id' => $guardId,
            'year' => $year,
            'month' => $month,
            'base_amount' => $balance->base_amount,
            'current_balance' => $balance->current_balance,
            'total_deductions' => $balance->total_deductions,
            'deduction_count' => $balance->deductions->count(),
            'status' => $balance->status,
            'disbursed_amount' => $balance->final_disbursed_amount,
        ];
    }

    /**
     * Get pending downs for a supervisor
     */
    public function getPendingDownsForSupervisor(int $guardId): array
    {
        $downs = Down::where('supervisor_id', $guardId)
            ->whereDate('created_at', today())
            ->where('affects_incentive', true)
            ->whereNull('incentive_deducted_at')
            ->with(['guard', 'site'])
            ->get();

        return [
            'count' => $downs->count(),
            'potential_deduction' => $downs->count() * $this->getDeductionAmount(),
            'downs' => $downs,
        ];
    }
}
