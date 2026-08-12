<?php

namespace App\Services;

use App\Models\IncentiveType;
use App\Models\IncentiveRule;
use App\Models\IncentiveEntry;
use App\Models\GuardIncentiveProfile;
use App\Models\Guards\Guard;
use App\Models\AttendanceRecord;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class IncentiveCalculator
{
    public function calculateForPeriod(Carbon $start, Carbon $end, ?int $typeId = null, ?array $guardIds = null): array
    {
        $types = $typeId
            ? IncentiveType::active()->where('id', $typeId)->get()
            : IncentiveType::active()->get();

        $guards = $guardIds
            ? Guard::whereIn('id', $guardIds)->where('status', 'active')->get()
            : Guard::where('status', 'active')->get();

        $created = 0;
        $updated = 0;
        $errors = [];

        foreach ($types as $type) {
            $rules = IncentiveRule::active()
                ->where('incentive_type_id', $type->id)
                ->get();

            foreach ($guards as $guard) {
                // Check if guard is eligible for this incentive type
                if (!$this->isEligible($guard, $type)) {
                    continue;
                }

                foreach ($rules as $rule) {
                    try {
                        $result = $this->applyRule($guard, $type, $rule, $start, $end);

                        if ($result) {
                            $entry = IncentiveEntry::updateOrCreate(
                                [
                                    'guard_id' => $guard->id,
                                    'incentive_type_id' => $type->id,
                                    'incentive_rule_id' => $rule->id,
                                    'period_start' => $start,
                                    'period_end' => $end,
                                ],
                                [
                                    'base_amount' => $result['base_amount'],
                                    'calculated_amount' => $result['calculated_amount'],
                                    'final_amount' => $result['final_amount'],
                                    'status' => $type->requires_approval ? 'pending' : 'approved',
                                    'calculation_details' => $result['details'],
                                    'calculated_by' => auth()->id(),
                                    'calculated_at' => now(),
                                ]
                            );

                            if ($entry->wasRecentlyCreated) {
                                $created++;
                            } else {
                                $updated++;
                            }
                        }
                    } catch (\Exception $e) {
                        $errors[] = "Error calculating {$type->name} for {$guard->name}: {$e->getMessage()}";
                    }
                }
            }
        }

        return [
            'count' => $created + $updated,
            'created' => $created,
            'updated' => $updated,
            'errors' => $errors,
        ];
    }

    private function isEligible(Guard $guard, IncentiveType $type): bool
    {
        // Check applies_to filter
        if ($type->applies_to !== 'all') {
            $positionMap = [
                'supervisor' => ['supervisor', 'sergeant'],
                'guard' => ['guard'],
                'driver' => ['driver'],
                'staff' => ['staff', 'admin', 'hr', 'finance'],
            ];

            $allowedPositions = $positionMap[$type->applies_to] ?? [];
            if (!in_array($guard->position, $allowedPositions)) {
                return false;
            }
        }

        // Check for custom profile
        $profile = GuardIncentiveProfile::active()
            ->where('guard_id', $guard->id)
            ->where('incentive_type_id', $type->id)
            ->first();

        if ($profile && !$profile->is_active) {
            return false;
        }

        return true;
    }

    private function applyRule(Guard $guard, IncentiveType $type, IncentiveRule $rule, Carbon $start, Carbon $end): ?array
    {
        // Check if condition is met
        $conditionMet = $this->evaluateCondition($guard, $rule->condition_type, $rule->condition_config, $start, $end);

        if (!$conditionMet) {
            return null;
        }

        // Calculate amount
        $baseAmount = $this->getBaseAmount($guard, $type);
        $calculatedAmount = $this->calculateAmount($baseAmount, $rule->calculation_type, $rule->calculation_config, $guard, $start, $end);

        // Apply min/max constraints
        if ($rule->min_amount !== null && $calculatedAmount < $rule->min_amount) {
            $calculatedAmount = $rule->min_amount;
        }
        if ($rule->max_amount !== null && $calculatedAmount > $rule->max_amount) {
            $calculatedAmount = $rule->max_amount;
        }

        return [
            'base_amount' => $baseAmount,
            'calculated_amount' => $calculatedAmount,
            'final_amount' => $calculatedAmount,
            'details' => [
                'condition_type' => $rule->condition_type,
                'condition_config' => $rule->condition_config,
                'calculation_type' => $rule->calculation_type,
                'calculation_config' => $rule->calculation_config,
                'period_start' => $start->toDateString(),
                'period_end' => $end->toDateString(),
                'guard_position' => $guard->position,
                'guard_id' => $guard->id,
            ],
        ];
    }

    private function evaluateCondition(Guard $guard, string $conditionType, array $config, Carbon $start, Carbon $end): bool
    {
        return match ($conditionType) {
            'attendance_threshold' => $this->checkAttendanceThreshold($guard, $config, $start, $end),
            'performance_score' => $this->checkPerformanceScore($guard, $config, $start, $end),
            'referral_count' => $this->checkReferralCount($guard, $config, $start, $end),
            'safety_incident_free' => $this->checkSafetyIncidentFree($guard, $config, $start, $end),
            'tenure_years' => $this->checkTenureYears($guard, $config),
            'no_absences' => $this->checkNoAbsences($guard, $start, $end),
            'no_lates' => $this->checkNoLates($guard, $start, $end),
            'perfect_attendance' => $this->checkPerfectAttendance($guard, $start, $end),
            'always' => true,
            default => false,
        };
    }

    private function calculateAmount(float $baseAmount, string $calculationType, array $config, Guard $guard, Carbon $start, Carbon $end): float
    {
        return match ($calculationType) {
            'fixed' => $config['amount'] ?? 0,
            'percentage_of_base' => $baseAmount * (($config['percentage'] ?? 0) / 100),
            'per_unit' => ($config['unit_amount'] ?? 0) * $this->getUnitCount($guard, $config['unit_type'] ?? 'day', $start, $end),
            'tiered' => $this->calculateTiered($baseAmount, $config['tiers'] ?? [], $guard, $start, $end),
            default => 0,
        };
    }

    private function checkAttendanceThreshold(Guard $guard, array $config, Carbon $start, Carbon $end): bool
    {
        $threshold = $config['threshold'] ?? 95;
        $metric = $config['metric'] ?? 'attendance_rate';

        $totalDays = $start->diffInDays($end) + 1;

        $presentDays = AttendanceRecord::where('guard_id', $guard->id)
            ->whereBetween('date', [$start, $end])
            ->whereIn('status', ['present', 'checked_in'])
            ->count();

        $rate = ($presentDays / $totalDays) * 100;

        return $rate >= $threshold;
    }

    private function checkNoAbsences(Guard $guard, Carbon $start, Carbon $end): bool
    {
        return AttendanceRecord::where('guard_id', $guard->id)
            ->whereBetween('date', [$start, $end])
            ->where('status', 'absent')
            ->doesntExist();
    }

    private function checkNoLates(Guard $guard, Carbon $start, Carbon $end): bool
    {
        return AttendanceRecord::where('guard_id', $guard->id)
            ->whereBetween('date', [$start, $end])
            ->where('is_late', true)
            ->doesntExist();
    }

    private function checkPerfectAttendance(Guard $guard, Carbon $start, Carbon $end): bool
    {
        return $this->checkNoAbsences($guard, $start, $end) &&
               $this->checkNoLates($guard, $start, $end);
    }

    private function checkPerformanceScore(Guard $guard, array $config, Carbon $start, Carbon $end): bool
    {
        // Placeholder for performance score check
        // Would integrate with performance review system
        $minScore = $config['min_score'] ?? 80;
        return true; // Simplified - would check actual performance data
    }

    private function checkReferralCount(Guard $guard, array $config, Carbon $start, Carbon $end): bool
    {
        $minReferrals = $config['min_count'] ?? 1;
        // Placeholder - would check referral records
        return false; // Not implemented in this version
    }

    private function checkSafetyIncidentFree(Guard $guard, array $config, Carbon $start, Carbon $end): bool
    {
        // Check if guard has no safety incidents in period
        return DB::table('safety_incidents')
            ->where('guard_id', $guard->id)
            ->whereBetween('incident_date', [$start, $end])
            ->doesntExist();
    }

    private function checkTenureYears(Guard $guard, array $config): bool
    {
        $minYears = $config['min_years'] ?? 1;
        $joinDate = $guard->created_at;
        $years = $joinDate->diffInYears(now());
        return $years >= $minYears;
    }

    private function getBaseAmount(Guard $guard, IncentiveType $type): float
    {
        // Check for custom profile config
        $profile = GuardIncentiveProfile::active()
            ->where('guard_id', $guard->id)
            ->where('incentive_type_id', $type->id)
            ->first();

        if ($profile && isset($profile->custom_config['base_amount'])) {
            return (float) $profile->custom_config['base_amount'];
        }

        // Use type default config
        if (isset($type->default_config['base_amount'])) {
            return (float) $type->default_config['base_amount'];
        }

        return 0;
    }

    private function getUnitCount(Guard $guard, string $unitType, Carbon $start, Carbon $end): int
    {
        return match ($unitType) {
            'day' => $start->diffInDays($end) + 1,
            'present_day' => AttendanceRecord::where('guard_id', $guard->id)
                ->whereBetween('date', [$start, $end])
                ->whereIn('status', ['present', 'checked_in'])
                ->count(),
            'week' => $start->diffInWeeks($end) + 1,
            'month' => $start->diffInMonths($end) + 1,
            'guard_supervised' => Guard::where('reports_to_guard_id', $guard->id)
                ->where('status', 'active')
                ->count(),
            default => 1,
        };
    }

    private function calculateTiered(float $baseAmount, array $tiers, Guard $guard, Carbon $start, Carbon $end): float
    {
        // Sort tiers by threshold
        usort($tiers, fn($a, $b) => $a['threshold'] <=> $b['threshold']);

        // Find applicable tier
        foreach (array_reverse($tiers) as $tier) {
            $metric = $tier['metric'] ?? 'days_worked';
            $threshold = $tier['threshold'] ?? 0;
            $value = $this->getUnitCount($guard, $metric, $start, $end);

            if ($value >= $threshold) {
                return match ($tier['type'] ?? 'fixed') {
                    'fixed' => $tier['amount'] ?? 0,
                    'percentage' => $baseAmount * (($tier['percentage'] ?? 0) / 100),
                    default => 0,
                };
            }
        }

        return 0;
    }
}
