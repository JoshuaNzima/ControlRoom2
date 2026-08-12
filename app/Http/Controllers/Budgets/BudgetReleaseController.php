<?php

namespace App\Http\Controllers\Budgets;

use App\Http\Controllers\Controller;
use App\Models\BudgetRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class BudgetReleaseController extends Controller
{
    public function release(Request $request, BudgetRequest $budget): RedirectResponse
    {
        $data = $request->validate([
            'notes_release' => ['nullable', 'string'],
        ]);

        $user = $request->user();
        abort_unless($user->hasAnyRole(['finance_officer','accountant','finance','accounting','super_admin']), 403);

        if ($budget->status !== 'pending_release') {
            return back();
        }

        $budget->status = 'released';
        $budget->released_by = $user->id;
        $budget->notes_release = $data['notes_release'] ?? null;
        $budget->save();

        return back();
    }
}
