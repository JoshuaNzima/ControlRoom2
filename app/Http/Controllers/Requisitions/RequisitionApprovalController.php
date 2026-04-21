<?php

namespace App\Http\Controllers\Requisitions;

use App\Http\Controllers\Controller;
use App\Models\Requisition;
use App\Models\User;
use App\Notifications\GenericDbNotification;
use App\Events\RequisitionUpdated;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;

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

        $previousStatus = $requisition->status;
        $requisition->status = 'pending_disbursement';
        $requisition->approved_by = $user->id;
        $requisition->notes_admin = $request->input('notes_admin');
        $requisition->save();

        // Dispatch event for push notification
        RequisitionUpdated::dispatch($requisition, 'approved', $previousStatus);

        // Send push notification to requester
        try {
            $requester = User::find($requisition->requested_by);
            if ($requester) {
                $requester->notify(new GenericDbNotification([
                    'title' => 'Requisition Approved',
                    'message' => sprintf('Your requisition "%s" has been approved.', $requisition->title),
                    'url' => route('requisitions.show', $requisition->id),
                ]));
            }
        } catch (\Throwable $e) {
            // swallow notification errors
        }

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

        $previousStatus = $requisition->status;
        $requisition->status = 'needs_revision';
        $requisition->approved_by = $user->id;
        $requisition->notes_admin = $data['notes_admin'] ?? null;
        $requisition->save();

        // Dispatch event for push notification
        RequisitionUpdated::dispatch($requisition, 'rejected', $previousStatus);

        // Send push notification to requester
        try {
            $requester = User::find($requisition->requested_by);
            if ($requester) {
                $requester->notify(new GenericDbNotification([
                    'title' => 'Requisition Declined',
                    'message' => sprintf('Your requisition "%s" needs revision.', $requisition->title),
                    'url' => route('requisitions.show', $requisition->id),
                ]));
            }
        } catch (\Throwable $e) {
            // swallow notification errors
        }

        return back();
    }
}
