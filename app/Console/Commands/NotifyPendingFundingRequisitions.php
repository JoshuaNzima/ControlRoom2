<?php

namespace App\Console\Commands;

use App\Models\Requisition;
use App\Models\User;
use App\Notifications\GenericDbNotification;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class NotifyPendingFundingRequisitions extends Command
{
    protected $signature = 'requisitions:notify-pending-funding {--hours=12 : Only notify for pending funding requisitions older than this many hours}';

    protected $description = 'Notify admins about requisitions pending funding within acknowledged batches';

    public function handle(): int
    {
        $hours = max(1, (int) $this->option('hours'));
        $cutoff = now()->subHours($hours);

        $pending = Requisition::query()
            ->where('status', 'pending_funding')
            ->whereNotNull('batch_id')
            ->where('updated_at', '<=', $cutoff)
            ->get(['id', 'batch_id', 'amount']);

        if ($pending->isEmpty()) {
            $this->info('No pending funding requisitions found.');
            return self::SUCCESS;
        }

        $admins = User::role(['admin', 'super_admin'])->get();
        if ($admins->isEmpty()) {
            $this->info('No admins found to notify.');
            return self::SUCCESS;
        }

        $notifiedBatches = 0;

        foreach ($pending->groupBy('batch_id') as $batchId => $items) {
            $batchId = (int) $batchId;
            $cacheKey = 'requisitions:pending_funding_notified:' . $batchId . ':' . now()->format('Y-m-d');

            if (Cache::has($cacheKey)) {
                continue;
            }

            $count = $items->count();
            $total = (float) $items->sum(function ($r) {
                return (float) $r->amount;
            });

            $payload = [
                'type' => 'requisitions_pending_funding',
                'title' => 'Requisitions pending funding',
                'message' => "Batch #{$batchId} has {$count} requisition" . ($count === 1 ? '' : 's') . " pending funding (MWK " . number_format($total, 2) . ").",
                'url' => route('requisitions.index'),
                'batch' => [
                    'id' => $batchId,
                    'pending_count' => $count,
                    'pending_total' => $total,
                ],
            ];

            foreach ($admins as $admin) {
                $admin->notify(new GenericDbNotification($payload));
            }

            Cache::put($cacheKey, true, now()->addDay());
            $notifiedBatches++;
        }

        $this->info("Notified for {$notifiedBatches} batch" . ($notifiedBatches === 1 ? '' : 'es') . '.');

        return self::SUCCESS;
    }
}
