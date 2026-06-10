<?php

namespace App\Http\Controllers\Requisitions;

use App\Http\Controllers\Controller;
use App\Models\Requisition;
use App\Models\RequisitionBatch;
use App\Models\RequisitionItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use App\Models\User;
use App\Notifications\RequisitionBatchCompiled;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Validation\ValidationException;
use Throwable;

class RequisitionBatchController extends Controller
{
    public function compileToday(Request $request): RedirectResponse|JsonResponse
    {
        $user = $request->user();
        abort_unless($user->hasAnyRole(['asset_manager', 'assets_manager', 'super_admin']), 403);

        try {
            $today = Carbon::today();

            $batch = RequisitionBatch::firstOrCreate(
                ['batch_date' => $today],
                ['compiled_by' => $user->id, 'status' => 'pending_ack']
            );

            $now = now();

            // Count requisitions BEFORE update for logging
            $beforeCount = Requisition::where('status', 'pending_disbursement')
                ->whereNull('batch_id')
                ->count();

            // Include all pending_disbursement requisitions not yet batched
            // Remove the restrictive updated_at filter to allow previous requisitions to be compiled
            $updateResult = Requisition::where('status', 'pending_disbursement')
                ->whereNull('batch_id')
                ->update([
                    'batch_id' => $batch->id,
                    'batched_at' => $now,
                ]);

            // Get the new total including any previously batched requisitions
            $total = Requisition::where('batch_id', $batch->id)->sum('amount');
            $batch->total_amount = $total ?? 0;
            $batch->save();

            Log::info('Batch compiled successfully', [
                'batch_id' => $batch->id,
                'user_id' => $user->id,
                'requisitions_added' => $updateResult,
                'total_before_count' => $beforeCount,
                'total_amount' => $batch->total_amount,
                'batch_date' => $batch->batch_date,
            ]);

            // Notify admins that a batch is ready for acknowledgement
            $admins = User::query()
                ->whereHas('roles', function ($query) {
                    $query->whereIn('name', ['admin', 'super_admin']);
                })
                ->get();
            $mailFailures = [];
            foreach ($admins as $admin) {
                $admin->notify(new RequisitionBatchCompiled($batch, ['database']));

                try {
                    $admin->notify(new RequisitionBatchCompiled($batch, ['mail']));
                } catch (Throwable $e) {
                    $mailFailures[] = [
                        'user_id' => $admin->id,
                        'email' => $admin->email,
                        'message' => $e->getMessage(),
                    ];

                    Log::warning('Requisition batch mail notification failed', [
                        'batch_id' => $batch->id,
                        'admin_user_id' => $admin->id,
                        'admin_email' => $admin->email,
                        'exception_class' => $e::class,
                        'exception_message' => $e->getMessage(),
                    ]);
                }
            }

            if ($request->wantsJson()) {
                return $this->successResponse([
                    'batch_id' => $batch->id,
                    'requisitions_compiled' => $updateResult,
                    'mail_failures' => $mailFailures,
                ], 'Batch compiled successfully.');
            }

            return back();
        } catch (\Throwable $e) {
            Log::error('Batch compilation failed', [
                'user_id' => $user->id,
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            if ($request->wantsJson()) {
                return $this->errorResponse('Failed to compile batch: ' . $e->getMessage(), 500);
            }

            return back()->withErrors(['batch' => 'Failed to compile batch: ' . $e->getMessage()]);
        }
    }

    public function fund(Request $request, RequisitionBatch $batch): RedirectResponse|JsonResponse
    {
        $user = $request->user();
        abort_unless($user->hasAnyRole(['admin', 'super_admin']), 403);

        $data = $request->validate([
            'requisition_ids' => ['required', 'array', 'min:1'],
            'requisition_ids.*' => ['integer'],
        ]);

        if ($batch->status !== 'acknowledged') {
            throw ValidationException::withMessages([
                'batch' => 'Batch must be acknowledged before funding items later.',
            ]);
        }

        $selectedIds = array_values($data['requisition_ids']);
        $count = Requisition::where('batch_id', $batch->id)
            ->whereIn('id', $selectedIds)
            ->count();

        if ($count !== count($selectedIds)) {
            throw ValidationException::withMessages([
                'requisition_ids' => 'One or more selected requisitions are not part of this batch.',
            ]);
        }

        Requisition::where('batch_id', $batch->id)
            ->whereIn('id', $selectedIds)
            ->where('status', 'pending_funding')
            ->update([
                'status' => 'pending_disbursement',
            ]);

        if ($request->wantsJson()) {
            return $this->successResponse(['batch_id' => $batch->id], 'Batch funded successfully.');
        }

        return back();
    }

    public function today(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->hasAnyRole(['admin', 'super_admin', 'asset_manager', 'assets_manager']), 403);

        try {
            $today = Carbon::today();

            $batch = RequisitionBatch::with(['compiledBy:id,name', 'acknowledgedBy:id,name'])
                ->whereDate('batch_date', $today)
                ->latest('id')
                ->first();

            if (!$batch) {
                Log::info('No batch found for today', ['date' => $today]);
                return $this->successResponse([
                    'batch' => null,
                    'requisitions' => [],
                ]);
            }

            $requisitions = Requisition::with(['requestedBy:id,name', 'approvedBy:id,name'])
                ->where('batch_id', $batch->id)
                ->orderBy('created_at')
                ->get();

            Log::info('Today batch retrieved', [
                'batch_id' => $batch->id,
                'requisitions_count' => $requisitions->count(),
                'batch_total' => $batch->total_amount,
                'batch_status' => $batch->status,
            ]);

            return $this->successResponse([
                'batch' => $batch,
                'requisitions' => $requisitions,
            ]);
        } catch (\Throwable $e) {
            Log::error('Error fetching today batch', [
                'user_id' => $user->id,
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse('Failed to fetch batch: ' . $e->getMessage(), 500);
        }
    }

    public function acknowledgeToday(Request $request): RedirectResponse|JsonResponse
    {
        $user = $request->user();
        abort_unless($user->hasAnyRole(['admin', 'super_admin']), 403);

        $data = $request->validate([
            'requisition_ids' => ['nullable', 'array', 'min:1'],
            'requisition_ids.*' => ['integer', 'distinct'],
        ]);

        $today = Carbon::today();

        $batch = RequisitionBatch::whereDate('batch_date', $today)
            ->where('status', 'pending_ack')
            ->latest('id')
            ->first();

        if ($batch) {
            $allIds = Requisition::where('batch_id', $batch->id)->pluck('id')->all();
            $selectedIds = array_values($data['requisition_ids'] ?? $allIds);

            if ($data['requisition_ids'] !== null) {
                $count = Requisition::where('batch_id', $batch->id)
                    ->whereIn('id', $selectedIds)
                    ->count();

                if ($count !== count($selectedIds)) {
                    throw ValidationException::withMessages([
                        'requisition_ids' => 'One or more selected requisitions are not part of today\'s batch.',
                    ]);
                }
            }

            DB::transaction(function () use ($batch, $user, $selectedIds) {
                // Update selected requisitions to pending_disbursement
                Requisition::where('batch_id', $batch->id)
                    ->whereIn('id', $selectedIds)
                    ->update([
                        'status' => 'pending_disbursement',
                    ]);

                // Update unselected requisitions to pending_funding
                Requisition::where('batch_id', $batch->id)
                    ->whereNotIn('id', $selectedIds)
                    ->where('status', 'pending_disbursement')
                    ->update([
                        'status' => 'pending_funding',
                    ]);

                // Also update inline items - approved items become funded (for unselected)
                // or stay approved (for selected, ready for disbursement)
                foreach ($selectedIds as $reqId) {
                    // For selected requisitions: approved items remain approved
                    RequisitionItem::where('requisition_id', $reqId)
                        ->where('status', 'pending')
                        ->update([
                            'status' => 'approved',
                            'approved_by' => $user->id,
                            'approved_at' => now(),
                        ]);
                }

                // For unselected requisitions: approved items become funded
                $unselectedIds = array_diff(
                    Requisition::where('batch_id', $batch->id)->pluck('id')->all(),
                    $selectedIds
                );

                foreach ($unselectedIds as $reqId) {
                    RequisitionItem::where('requisition_id', $reqId)
                        ->where('status', 'approved')
                        ->update([
                            'status' => 'funded',
                        ]);
                }

                $batch->status = 'acknowledged';
                $batch->acknowledged_by = $user->id;
                $batch->acknowledged_at = now();
                $batch->save();
            });
        }

        if ($request->wantsJson()) {
            return $this->successResponse(['batch_id' => $batch?->id], 'Batch acknowledged successfully.');
        }

        return back();
    }

    public function exportTodayCsv(Request $request)
    {
        $user = $request->user();
        abort_unless($user->hasAnyRole(['admin', 'super_admin', 'asset_manager', 'assets_manager']), 403);

        $today = Carbon::today();
        $batch = RequisitionBatch::whereDate('batch_date', $today)->latest('id')->first();
        if (!$batch) {
            return $this->errorResponse('No batch compiled today.', 404);
        }

        $rows = Requisition::with(['requestedBy:id,name','approvedBy:id,name'])
            ->where('batch_id', $batch->id)
            ->orderBy('created_at')
            ->get(['id','title','description','amount','requested_by','approved_by','created_at']);

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="requisitions-batch-'. $today->format('Y-m-d') .'.csv"',
        ];

        $callback = function () use ($rows, $batch) {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['Batch Date', optional($batch->batch_date)->format('Y-m-d')]);
            fputcsv($out, ['Total Amount', (string) $batch->total_amount]);
            fputcsv($out, []);
            fputcsv($out, ['ID','Title','Amount','Requested By','Approved By','Created At']);
            foreach ($rows as $r) {
                fputcsv($out, [
                    $r->id,
                    $r->title,
                    (string) $r->amount,
                    optional($r->requestedBy)->name ?: $r->requested_by,
                    optional($r->approvedBy)->name ?: $r->approved_by,
                    optional($r->created_at)?->format('Y-m-d H:i'),
                ]);
            }
            fclose($out);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function printToday(Request $request): Response
    {
        $user = $request->user();
        abort_unless($user->hasAnyRole(['admin', 'super_admin', 'asset_manager', 'assets_manager']), 403);

        $today = Carbon::today();
        $batch = RequisitionBatch::with(['compiledBy:id,name','acknowledgedBy:id,name'])
            ->whereDate('batch_date', $today)
            ->latest('id')
            ->first();

        $requisitions = [];
        if ($batch) {
            $requisitions = Requisition::with(['requestedBy:id,name','approvedBy:id,name'])
                ->where('batch_id', $batch->id)
                ->orderBy('created_at')
                ->get();
        }

        return Inertia::render('Requisitions/BatchPrint', [
            'batch' => $batch,
            'requisitions' => $requisitions,
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->hasAnyRole(['admin', 'super_admin', 'asset_manager', 'assets_manager']), 403);

        $perPage = max(1, (int) $request->query('per_page', 20));
        $from = $request->query('from');
        $to = $request->query('to');

        $q = RequisitionBatch::with(['compiledBy:id,name', 'acknowledgedBy:id,name'])
            ->withCount('requisitions')
            ->orderByDesc('batch_date')
            ->orderByDesc('id');

        if ($from) {
            $q->whereDate('batch_date', '>=', $from);
        }
        if ($to) {
            $q->whereDate('batch_date', '<=', $to);
        }

        $batches = $q->paginate($perPage);

        // Add funding stats to each batch
        $batches->getCollection()->transform(function ($batch) {
            $stats = Requisition::where('batch_id', $batch->id)
                ->selectRaw("
                    SUM(CASE WHEN status = 'disbursed' THEN 1 ELSE 0 END) as funded_count,
                    SUM(CASE WHEN status = 'pending_funding' THEN 1 ELSE 0 END) as pending_funding_count,
                    SUM(CASE WHEN status = 'pending_disbursement' THEN 1 ELSE 0 END) as pending_disbursement_count
                ")
                ->first();

            $batch->funded_count = (int) ($stats->funded_count ?? 0);
            $batch->pending_funding_count = (int) ($stats->pending_funding_count ?? 0);
            $batch->pending_disbursement_count = (int) ($stats->pending_disbursement_count ?? 0);

            return $batch;
        });

        return $this->successResponse(['batches' => $batches]);
    }

    public function show(Request $request, RequisitionBatch $batch): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->hasAnyRole(['admin', 'super_admin', 'asset_manager', 'assets_manager']), 403);

        $batch->load(['compiledBy:id,name', 'acknowledgedBy:id,name']);
        $requisitions = Requisition::with(['requestedBy:id,name', 'approvedBy:id,name'])
            ->where('batch_id', $batch->id)
            ->orderBy('created_at')
            ->get();

        return $this->successResponse([
            'batch' => $batch,
            'requisitions' => $requisitions,
        ]);
    }

    public function exportCsv(Request $request, RequisitionBatch $batch)
    {
        $user = $request->user();
        abort_unless($user->hasAnyRole(['admin', 'super_admin', 'asset_manager', 'assets_manager']), 403);

        $rows = Requisition::with(['requestedBy:id,name','approvedBy:id,name'])
            ->where('batch_id', $batch->id)
            ->orderBy('created_at')
            ->get(['id','title','description','amount','requested_by','approved_by','created_at']);

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="requisitions-batch-'. optional($batch->batch_date)->format('Y-m-d') .'-'. $batch->id .'.csv"',
        ];

        $callback = function () use ($rows, $batch) {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['Batch Date', optional($batch->batch_date)->format('Y-m-d')]);
            fputcsv($out, ['Total Amount', (string) $batch->total_amount]);
            fputcsv($out, []);
            fputcsv($out, ['ID','Title','Amount','Requested By','Approved By','Created At']);
            foreach ($rows as $r) {
                fputcsv($out, [
                    $r->id,
                    $r->title,
                    (string) $r->amount,
                    optional($r->requestedBy)->name ?: $r->requested_by,
                    optional($r->approvedBy)->name ?: $r->approved_by,
                    optional($r->created_at)?->format('Y-m-d H:i'),
                ]);
            }
            fclose($out);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function generateReport(Request $request): JsonResponse|StreamedResponse
    {
        $user = $request->user();
        abort_unless($user->hasAnyRole(['admin', 'super_admin']), 403);

        $data = $request->validate([
            'month' => ['required', 'integer', 'min:1', 'max:12'],
            'year' => ['required', 'integer', 'min:2020'],
            'format' => ['required', 'string', 'in:csv,json'],
        ]);

        $month = $data['month'];
        $year = $data['year'];
        $format = $data['format'];

        $startDate = Carbon::create($year, $month, 1)->startOfMonth();
        $endDate = $startDate->copy()->endOfMonth();

        // Get summary statistics
        $stats = [
            'total_requisitions' => Requisition::whereBetween('created_at', [$startDate, $endDate])->count(),
            'total_amount' => Requisition::whereBetween('created_at', [$startDate, $endDate])->sum('amount') ?? 0,
            'pending_admin' => Requisition::whereBetween('created_at', [$startDate, $endDate])->where('status', 'pending_admin')->count(),
            'needs_revision' => Requisition::whereBetween('created_at', [$startDate, $endDate])->where('status', 'needs_revision')->count(),
            'pending_disbursement' => Requisition::whereBetween('created_at', [$startDate, $endDate])->where('status', 'pending_disbursement')->count(),
            'pending_funding' => Requisition::whereBetween('created_at', [$startDate, $endDate])->where('status', 'pending_funding')->count(),
            'disbursed' => Requisition::whereBetween('created_at', [$startDate, $endDate])->where('status', 'disbursed')->count(),
            'expired' => Requisition::whereBetween('created_at', [$startDate, $endDate])->where('status', 'expired')->count(),
            'total_batches' => RequisitionBatch::whereBetween('batch_date', [$startDate, $endDate])->count(),
        ];

        $filename = "requisitions-report-{$year}-".str_pad($month, 2, '0', STR_PAD_LEFT);

        if ($format === 'json') {
            $requisitions = Requisition::with(['requestedBy:id,name', 'approvedBy:id,name'])
                ->whereBetween('created_at', [$startDate, $endDate])
                ->get();

            $batches = RequisitionBatch::with(['compiledBy:id,name', 'acknowledgedBy:id,name'])
                ->whereBetween('batch_date', [$startDate, $endDate])
                ->get();

            return $this->successResponse([
                'period' => $startDate->format('F Y'),
                'summary' => $stats,
                'requisitions' => $requisitions,
                'batches' => $batches,
            ]);
        }

        // CSV download
        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}.csv\"",
        ];

        $callback = function () use ($startDate, $endDate, $stats) {
            $out = fopen('php://output', 'w');

            fputcsv($out, ['REQUISITION REPORT', $startDate->format('F Y')]);
            fputcsv($out, []);
            fputcsv($out, ['SUMMARY']);
            foreach ($stats as $key => $value) {
                fputcsv($out, [str_replace('_', ' ', ucfirst($key)), $value]);
            }
            fputcsv($out, []);

            // Batches
            $batches = RequisitionBatch::with(['compiledBy:id,name'])
                ->whereBetween('batch_date', [$startDate, $endDate])
                ->get();

            fputcsv($out, ['BATCHES']);
            fputcsv($out, ['ID', 'Date', 'Status', 'Total Amount', 'Compiled By']);
            foreach ($batches as $b) {
                fputcsv($out, [
                    $b->id,
                    $b->batch_date?->format('Y-m-d'),
                    $b->status,
                    $b->total_amount,
                    $b->compiledBy?->name ?? "User #{$b->compiled_by}",
                ]);
            }
            fputcsv($out, []);

            // Requisitions
            $requisitions = Requisition::with(['requestedBy:id,name'])
                ->whereBetween('created_at', [$startDate, $endDate])
                ->get();

            fputcsv($out, ['REQUISITIONS']);
            fputcsv($out, ['ID', 'Title', 'Amount', 'Status', 'Requested By', 'Created At']);
            foreach ($requisitions as $r) {
                fputcsv($out, [
                    $r->id,
                    $r->title,
                    $r->amount,
                    $r->status,
                    $r->requestedBy?->name ?? "User #{$r->requested_by}",
                    $r->created_at?->format('Y-m-d H:i'),
                ]);
            }

            fclose($out);
        };

        return response()->stream($callback, 200, $headers);
    }
}
