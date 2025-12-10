<?php

namespace App\Http\Controllers\Requisitions;

use App\Http\Controllers\Controller;
use App\Models\Requisition;
use App\Models\RequisitionBatch;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use App\Models\User;
use App\Notifications\RequisitionBatchCompiled;
use Inertia\Inertia;
use Inertia\Response;

class RequisitionBatchController extends Controller
{
    public function compileToday(Request $request): RedirectResponse|JsonResponse
    {
        $user = $request->user();
        abort_unless($user->hasAnyRole(['asset_manager', 'assets_manager', 'super_admin']), 403);

        $today = Carbon::today();

        $batch = RequisitionBatch::firstOrCreate(
            ['batch_date' => $today],
            ['compiled_by' => $user->id, 'status' => 'pending_ack']
        );

        $now = now();

        Requisition::where('status', 'pending_disbursement')
            ->whereNull('batch_id')
            ->whereDate('updated_at', $today)
            ->update([
                'batch_id' => $batch->id,
                'batched_at' => $now,
            ]);

        $total = Requisition::where('batch_id', $batch->id)->sum('amount');
        $batch->total_amount = $total ?? 0;
        $batch->save();

        // Notify admins that a batch is ready for acknowledgement
        $admins = User::role(['admin', 'super_admin'])->get();
        foreach ($admins as $admin) {
            $admin->notify(new RequisitionBatchCompiled($batch));
        }

        if ($request->wantsJson()) {
            return response()->json(['ok' => true, 'batch_id' => $batch->id]);
        }

        return back();
    }

    public function today(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->hasAnyRole(['admin', 'super_admin', 'asset_manager', 'assets_manager']), 403);

        $today = Carbon::today();

        $batch = RequisitionBatch::with(['compiledBy:id,name', 'acknowledgedBy:id,name'])
            ->whereDate('batch_date', $today)
            ->latest('id')
            ->first();

        if (!$batch) {
            return response()->json([
                'batch' => null,
                'requisitions' => [],
            ]);
        }

        $requisitions = Requisition::with(['requestedBy:id,name', 'approvedBy:id,name'])
            ->where('batch_id', $batch->id)
            ->orderBy('created_at')
            ->get();

        return response()->json([
            'batch' => $batch,
            'requisitions' => $requisitions,
        ]);
    }

    public function acknowledgeToday(Request $request): RedirectResponse|JsonResponse
    {
        $user = $request->user();
        abort_unless($user->hasAnyRole(['admin', 'super_admin']), 403);

        $today = Carbon::today();

        $batch = RequisitionBatch::whereDate('batch_date', $today)
            ->where('status', 'pending_ack')
            ->latest('id')
            ->first();

        if ($batch) {
            $batch->status = 'acknowledged';
            $batch->acknowledged_by = $user->id;
            $batch->acknowledged_at = now();
            $batch->save();
        }

        if ($request->wantsJson()) {
            return response()->json(['ok' => true, 'batch_id' => $batch?->id]);
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
            return response('No batch compiled today', 404);
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

        return response()->json([
            'batches' => $batches,
        ]);
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

        return response()->json([
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

    public function print(Request $request, RequisitionBatch $batch): Response
    {
        $user = $request->user();
        abort_unless($user->hasAnyRole(['admin', 'super_admin', 'asset_manager', 'assets_manager']), 403);

        $batch->load(['compiledBy:id,name','acknowledgedBy:id,name']);
        $requisitions = Requisition::with(['requestedBy:id,name','approvedBy:id,name'])
            ->where('batch_id', $batch->id)
            ->orderBy('created_at')
            ->get();

        return Inertia::render('Requisitions/BatchPrint', [
            'batch' => $batch,
            'requisitions' => $requisitions,
        ]);
    }
}
