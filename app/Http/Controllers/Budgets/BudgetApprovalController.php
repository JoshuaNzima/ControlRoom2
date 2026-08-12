<?php

namespace App\Http\Controllers\Budgets;

use App\Http\Controllers\Controller;
use App\Models\BudgetRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class BudgetApprovalController extends Controller
{
    public function approve(Request $request, BudgetRequest $budget): RedirectResponse
    {
        $request->validate([
            'notes_admin' => ['nullable', 'string'],
        ]);

        $user = $request->user();
        abort_unless($user->hasAnyRole(['admin', 'super_admin']), 403);

        if ($budget->status !== 'pending_admin') {
            return back();
        }

        $budget->status = 'pending_release';
        $budget->approved_by = $user->id;
        $budget->notes_admin = $request->input('notes_admin');
        $budget->save();

        return back();
    }

    public function decline(Request $request, BudgetRequest $budget): RedirectResponse
    {
        $data = $request->validate([
            'notes_admin' => ['nullable', 'string'],
        ]);

        $user = $request->user();
        abort_unless($user->hasAnyRole(['admin', 'super_admin']), 403);

        if ($budget->status !== 'pending_admin') {
            return back();
        }

        $budget->status = 'needs_revision';
        $budget->approved_by = $user->id;
        $budget->notes_admin = $data['notes_admin'] ?? null;
        $budget->save();

        return back();
    }
}
