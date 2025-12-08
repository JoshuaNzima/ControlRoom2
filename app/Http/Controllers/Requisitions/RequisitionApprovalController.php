<?php

namespace App\Http\Controllers\Requisitions;

use App\Http\Controllers\Controller;
use App\Models\Requisition;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class RequisitionApprovalController extends Controller
{
    public function approve(Request $request, Requisition $requisition): RedirectResponse
    {
        $request->validate([
            'notes_admin' => ['nullable', 'string'],
        ]);

        $user = $request->user();
        abort_unless($user->hasAnyRole(['admin', 'super_admin']), 403);

        if ($requisition->status !== 'pending_admin') {
            return back();
        }

        $requisition->status = 'pending_disbursement';
        $requisition->approved_by = $user->id;
        $requisition->notes_admin = $request->input('notes_admin');
        $requisition->save();

        return back();
    }

    public function decline(Request $request, Requisition $requisition): RedirectResponse
    {
        $data = $request->validate([
            'notes_admin' => ['nullable', 'string'],
        ]);

        $user = $request->user();
        abort_unless($user->hasAnyRole(['admin', 'super_admin']), 403);

        if ($requisition->status !== 'pending_admin') {
            return back();
        }

        $requisition->status = 'needs_revision';
        $requisition->approved_by = $user->id;
        $requisition->notes_admin = $data['notes_admin'] ?? null;
        $requisition->save();

        return back();
    }
}
