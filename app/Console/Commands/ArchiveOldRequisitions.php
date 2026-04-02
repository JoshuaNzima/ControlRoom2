<?php

namespace App\Console\Commands;

use App\Models\Requisition;
use App\Models\RequisitionBatch;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ArchiveOldRequisitions extends Command
{
    protected $signature = 'requisitions:archive-old {--month=} {--year=}';

    protected $description = 'Archive requisitions from previous months (keeps current month active)';

    public function handle(): int
    {
        $month = $this->option('month') ?? now()->subMonth()->format('m');
        $year = $this->option('year') ?? now()->subMonth()->format('Y');

        // Archive up to end of previous month
        $archiveBefore = Carbon::create($year, $month, 1)->endOfMonth();

        $this->info("Archiving requisitions created before {$archiveBefore->format('F Y')}...");

        // Find requisitions to archive (not already archived and older than cutoff)
        $query = Requisition::whereNull('archived_at')
            ->whereDate('created_at', '<=', $archiveBefore);

        $count = $query->count();

        if ($count === 0) {
            $this->info('No requisitions to archive.');
            return self::SUCCESS;
        }

        // Generate archive report before archiving
        $this->generateArchiveReport($archiveBefore);

        // Archive the requisitions
        $query->update(['archived_at' => now()]);

        $this->info("Archived {$count} requisitions.");

        // Also archive old batches (older than 2 months)
        $batchCutoff = now()->subMonths(2)->endOfMonth();
        $batchCount = RequisitionBatch::whereNull('archived_at')
            ->whereDate('batch_date', '<=', $batchCutoff)
            ->update(['archived_at' => now()]);

        $this->info("Archived {$batchCount} batches older than 2 months.");

        return self::SUCCESS;
    }

    private function generateArchiveReport(Carbon $archiveBefore): void
    {
        $stats = [
            'total' => Requisition::whereNull('archived_at')
                ->whereDate('created_at', '<=', $archiveBefore)
                ->count(),
            'by_status' => Requisition::whereNull('archived_at')
                ->whereDate('created_at', '<=', $archiveBefore)
                ->select('status', DB::raw('count(*) as count'))
                ->groupBy('status')
                ->pluck('count', 'status')
                ->toArray(),
            'total_amount' => Requisition::whereNull('archived_at')
                ->whereDate('created_at', '<=', $archiveBefore)
                ->sum('amount') ?? 0,
        ];

        $filename = 'archive-report-' . now()->format('Y-m-d_His') . '.json';
        Storage::disk('local')->put("reports/{$filename}", json_encode($stats, JSON_PRETTY_PRINT));

        $this->info("Archive report saved: storage/app/reports/{$filename}");
        $this->table(
            ['Status', 'Count'],
            collect($stats['by_status'])->map(fn ($v, $k) => [ucfirst(str_replace('_', ' ', $k)), $v])->toArray()
        );
    }
}
