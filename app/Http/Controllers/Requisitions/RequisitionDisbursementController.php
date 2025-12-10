<?php

namespace App\Http\Controllers\Requisitions;

use App\Http\Controllers\Controller;
use App\Models\Requisition;
use App\Models\RequisitionBatch;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class RequisitionDisbursementController extends Controller
{
    public function disburse(Request $request, Requisition $requisition): RedirectResponse
    {
        $data = $request->validate([
            'notes_disbursement' => ['nullable', 'string'],
        ]);

        $user = $request->user();
        abort_unless($user->hasAnyRole(['asset_manager', 'assets_manager', 'super_admin']), 403);

        if ($requisition->status !== 'pending_disbursement') {
            return back();
        }

        // Enforce acknowledgement before disbursement: must be in a batch and that batch must be acknowledged
        $requisition->loadMissing('batch');
        if (!$requisition->batch || $requisition->batch->status !== 'acknowledged') {
            return back();
        }

        $requisition->status = 'disbursed';
        $requisition->disbursed_by = $user->id;
        $requisition->notes_disbursement = $data['notes_disbursement'] ?? null;
        $requisition->save();

        return back();
    }
}
