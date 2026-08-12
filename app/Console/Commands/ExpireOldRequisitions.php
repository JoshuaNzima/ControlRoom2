<?php

namespace App\Console\Commands;

use App\Models\Requisition;
use Illuminate\Console\Command;

class ExpireOldRequisitions extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'requisitions:expire-pending';

    /**
     * The console command description.
     */
    protected $description = 'Mark pending requisitions as expired if they are more than 5 days past the needed_by date';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $cutoffDate = now()->subDays(5)->toDateString();

        $affected = Requisition::query()
            ->whereIn('status', ['pending_admin', 'pending_disbursement', 'pending_funding'])
            ->whereNotNull('needed_by')
            ->whereDate('needed_by', '<=', $cutoffDate)
            ->update([
                'status' => 'expired',
            ]);

        $this->info("Expired {$affected} requisitions.");

        return self::SUCCESS;
    }
}
