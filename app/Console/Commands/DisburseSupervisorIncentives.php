<?php

namespace App\Console\Commands;

use App\Services\SupervisorIncentiveBalanceService;
use Carbon\Carbon;
use Illuminate\Console\Command;

class DisburseSupervisorIncentives extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'incentives:disburse-supervisors 
                            {--year= : Year to disburse (default: current year)}
                            {--month= : Month to disburse (default: previous month)}
                            {--dry-run : Show what would be disbursed without actually disbursing}
                            {--user-id=1 : User ID to mark as disburser}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Disburse monthly incentive balances to supervisors and sergeants';

    /**
     * Execute the console command.
     */
    public function handle(SupervisorIncentiveBalanceService $service): int
    {
        // Default to disbursing the PREVIOUS period (the one that just ended on the 14th)
        // when running on the 15th
        if (!$this->option('year') && !$this->option('month')) {
            [$year, $month] = $service->getPreviousPeriod();
        } else {
            $year = $this->option('year') ?? now()->year;
            $month = $this->option('month') ?? now()->month;
        }
        
        $dryRun = $this->option('dry-run');
        $userId = $this->option('user-id');

        $periodLabel = $service->getPeriodLabel($year, $month);
        $this->info("Processing supervisor incentive disbursement for period: {$periodLabel}");
        $this->newLine();

        if ($dryRun) {
            $this->warn('DRY RUN MODE - No actual disbursements will be made');
            $this->newLine();
        }

        // Get all active balances for the period
        $balances = \App\Models\SupervisorIncentiveBalance::forPeriod($year, $month)
            ->where('status', 'active')
            ->with('guard')
            ->get();

        if ($balances->isEmpty()) {
            $this->warn('No active balances found for this period.');
            return 0;
        }

        $this->info("Found {$balances->count()} active balances to process");
        $this->newLine();

        $totalDisbursed = 0;
        $disburseCount = 0;

        foreach ($balances as $balance) {
            $guardName = $balance->guard?->name ?? 'Unknown';
            $amount = $balance->current_balance;

            if ($amount <= 0) {
                $this->warn("Skipping {$guardName} - zero or negative balance (MWK " . number_format($amount, 2) . ")");
                continue;
            }

            $this->info("Processing: {$guardName}");
            $this->info("  Base Amount: MWK " . number_format($balance->base_amount, 2));
            $this->info("  Deductions: MWK " . number_format($balance->total_deductions, 2));
            $this->info("  Final Amount: MWK " . number_format($amount, 2));

            if (!$dryRun) {
                $balance->disburse($userId, $amount);
                $this->info("  Status: DISBURSED");
            } else {
                $this->info("  Status: WOULD DISBURSE (dry run)");
            }

            $totalDisbursed += $amount;
            $disburseCount++;
            $this->newLine();
        }

        $this->newLine();
        $this->info('========================================');
        $this->info('DISBURSEMENT SUMMARY');
        $this->info('========================================');
        $this->info("Period: {$periodLabel}");
        $this->info("Total Supervisors: {$disburseCount}");
        $this->info("Total Amount: MWK " . number_format($totalDisbursed, 2));
        
        if ($dryRun) {
            $this->newLine();
            $this->warn('This was a dry run. No actual disbursements were made.');
            $this->info("Run without --dry-run to execute actual disbursement.");
        }

        return 0;
    }
}
