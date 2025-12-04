<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\Guards\Guard;
use Illuminate\Http\Request;

class GuardHRController extends Controller
{
    public function suspend(Request $request, Guard $guard)
    {
        $this->authorizeAction();
        $guard->update(['status' => 'suspended']);
        return back()->with('success', 'Guard suspended.');
    }

    public function reinstate(Request $request, Guard $guard)
    {
        $this->authorizeAction();
        $guard->update(['status' => 'active']);
        return back()->with('success', 'Guard reinstated.');
    }

    public function dismiss(Request $request, Guard $guard)
    {
        $this->authorizeAction();
        $request->validate([
            'reason' => ['nullable','string','max:500'],
        ]);
        $guard->update(['status' => 'inactive', 'notes' => trim(($guard->notes ? ($guard->notes."\n") : '') . 'Dismissed: ' . ($request->input('reason') ?? ''))]);
        return back()->with('success', 'Guard dismissed.');
    }

    public function setRole(Request $request, Guard $guard)
    {
        $this->authorizeAction();
        $data = $request->validate([
            'employee_role' => ['required','in:guard,driver'],
        ]);
        $guard->update(['employee_role' => $data['employee_role']]);
        return back()->with('success', 'Role updated to ' . $data['employee_role'] . '.');
    }

    protected function authorizeAction(): void
    {
        if (!auth()->check()) abort(403);
        if (!auth()->user()->hasAnyRole(['hr','hr_manager','super_admin']) && !auth()->user()->can('hr.employees.manage')) {
            abort(403);
        }
    }
}
