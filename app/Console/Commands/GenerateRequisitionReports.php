<?php

namespace App\Console\Commands;

use App\Models\Requisition;
use App\Models\RequisitionBatch;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class GenerateRequisitionReports extends Command
{
    protected $signature = 'requisitions:generate-reports {--month=} {--year=} {--format=csv : Output format (csv, json)}';

    protected $description = 'Generate monthly requisition reports with summary statistics';

    public function handle(): int
    {
        $month = $this->option('month') ?? now()->format('m');
        $year = $this->option('year') ?? now()->format('Y');
        $format = $this->option('format');

        $startDate = Carbon::create($year, $month, 1)->startOfMonth();
        $endDate = $startDate->copy()->endOfMonth();

        $this->info("Generating report for {$startDate->format('F Y')}...");

        // Get summary statistics
        $stats = $this->getMonthlyStats($startDate, $endDate);

        // Get detailed requisitions
        $requisitions = $this->getMonthlyRequisitions($startDate, $endDate);

        // Get batch data
        $batches = $this->getMonthlyBatches($startDate, $endDate);

        $report = [
            'period' => $startDate->format('F Y'),
            'generated_at' => now()->toDateTimeString(),
            'summary' => $stats,
            'batches' => $batches,
            'requisitions' => $requisitions,
        ];

        $filename = "requisitions-report-{$year}-{$month}";

        if ($format === 'json') {
            $path = "reports/{$filename}.json";
            Storage::disk('local')->put($path, json_encode($report, JSON_PRETTY_PRINT));
            $this->info("Report saved to: storage/app/{$path}");
        } else {
            $path = $this->generateCsvReport($report, $filename);
            $this->info("Report saved to: {$path}");
        }

        $this->displaySummary($stats);

        return self::SUCCESS;
    }

    private function getMonthlyStats(Carbon $start, Carbon $end): array
    {
        return [
            'total_requisitions' => Requisition::whereBetween('created_at', [$start, $end])->count(),
            'total_amount' => Requisition::whereBetween('created_at', [$start, $end])->sum('amount') ?? 0,
            'pending_admin' => Requisition::whereBetween('created_at', [$start, $end])->where('status', 'pending_admin')->count(),
            'needs_revision' => Requisition::whereBetween('created_at', [$start, $end])->where('status', 'needs_revision')->count(),
            'pending_disbursement' => Requisition::whereBetween('created_at', [$start, $end])->where('status', 'pending_disbursement')->count(),
            'pending_funding' => Requisition::whereBetween('created_at', [$start, $end])->where('status', 'pending_funding')->count(),
            'disbursed' => Requisition::whereBetween('created_at', [$start, $end])->where('status', 'disbursed')->count(),
            'expired' => Requisition::whereBetween('created_at', [$start, $end])->where('status', 'expired')->count(),
            'total_batches' => RequisitionBatch::whereBetween('batch_date', [$start, $end])->count(),
            'acknowledged_batches' => RequisitionBatch::whereBetween('batch_date', [$start, $end])->where('status', 'acknowledged')->count(),
        ];
    }

    private function getMonthlyRequisitions(Carbon $start, Carbon $end): array
    {
        return Requisition::with(['requestedBy:id,name', 'approvedBy:id,name'])
            ->whereBetween('created_at', [$start, $end])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($r) => [
                'id' => $r->id,
                'title' => $r->title,
                'amount' => $r->amount,
                'status' => $r->status,
                'requested_by' => $r->requestedBy?->name ?? "User #{$r->requested_by}",
                'approved_by' => $r->approvedBy?->name ?? ($r->approved_by ? "User #{$r->approved_by}" : null),
                'created_at' => $r->created_at?->format('Y-m-d H:i:s'),
                'needed_by' => $r->needed_by?->format('Y-m-d'),
            ])
            ->toArray();
    }

    private function getMonthlyBatches(Carbon $start, Carbon $end): array
    {
        return RequisitionBatch::with(['compiledBy:id,name', 'acknowledgedBy:id,name'])
            ->whereBetween('batch_date', [$start, $end])
            ->orderByDesc('batch_date')
            ->get()
            ->map(fn ($b) => [
                'id' => $b->id,
                'batch_date' => $b->batch_date?->format('Y-m-d'),
                'status' => $b->status,
                'total_amount' => $b->total_amount,
                'compiled_by' => $b->compiledBy?->name ?? "User #{$b->compiled_by}",
                'acknowledged_by' => $b->acknowledgedBy?->name ?? ($b->acknowledged_by ? "User #{$b->acknowledged_by}" : null),
                'acknowledged_at' => $b->acknowledged_at?->format('Y-m-d H:i:s'),
            ])
            ->toArray();
    }

    private function generateCsvReport(array $report, string $filename): string
    {
        $path = storage_path("app/reports/{$filename}.csv");
        
        if (!is_dir(dirname($path))) {
            mkdir(dirname($path), 0755, true);
        }

        $out = fopen($path, 'w');

        // Summary section
        fputcsv($out, ['REQUISITION REPORT', $report['period']]);
        fputcsv($out, ['Generated At', $report['generated_at']]);
        fputcsv($out, []);
        
        fputcsv($out, ['SUMMARY']);
        foreach ($report['summary'] as $key => $value) {
            fputcsv($out, [str_replace('_', ' ', ucfirst($key)), $value]);
        }
        fputcsv($out, []);

        // Batches section
        fputcsv($out, ['BATCHES']);
        if (count($report['batches']) > 0) {
            fputcsv($out, ['ID', 'Date', 'Status', 'Total Amount', 'Compiled By', 'Acknowledged By', 'Acknowledged At']);
            foreach ($report['batches'] as $b) {
                fputcsv($out, [
                    $b['id'],
                    $b['batch_date'],
                    $b['status'],
                    $b['total_amount'],
                    $b['compiled_by'],
                    $b['acknowledged_by'] ?? '',
                    $b['acknowledged_at'] ?? '',
                ]);
            }
        } else {
            fputcsv($out, ['No batches in this period']);
        }
        fputcsv($out, []);

        // Requisitions section
        fputcsv($out, ['REQUISITIONS']);
        if (count($report['requisitions']) > 0) {
            fputcsv($out, ['ID', 'Title', 'Amount', 'Status', 'Requested By', 'Approved By', 'Created At', 'Needed By']);
            foreach ($report['requisitions'] as $r) {
                fputcsv($out, [
                    $r['id'],
                    $r['title'],
                    $r['amount'],
                    $r['status'],
                    $r['requested_by'],
                    $r['approved_by'] ?? '',
                    $r['created_at'],
                    $r['needed_by'] ?? '',
                ]);
            }
        } else {
            fputcsv($out, ['No requisitions in this period']);
        }

        fclose($out);

        return $path;
    }

    private function displaySummary(array $stats): void
    {
        $this->newLine();
        $this->info('=== Monthly Summary ===');
        $this->table(
            ['Metric', 'Value'],
            collect($stats)->map(fn ($v, $k) => [str_replace('_', ' ', ucfirst($k)), $v])->toArray()
        );
    }
}
