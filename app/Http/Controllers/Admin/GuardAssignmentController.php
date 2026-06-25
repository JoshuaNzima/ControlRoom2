<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Guards\Guard;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Validation\Rule;

class GuardAssignmentController extends Controller
{
    public function index()
    {
        $guards = Guard::with(['supervisor', 'currentAssignment.clientSite.client'])
            ->where('status', 'active')
            ->orderBy('name')
            ->paginate(20);

        $supervisors = User::role(['supervisor', 'sergeant', 'zone_commander'])
            ->where('status', 'active')
            ->orderBy('name')
            ->get();

        return Inertia::render('Admin/GuardAssignments', [
            'guards' => $guards,
            'supervisors' => $supervisors,
        ]);
    }

    public function assignToSupervisor(Request $request)
    {
        $validated = $request->validate([
            'guard_ids' => 'required|array',
            'guard_ids.*' => 'exists:guards,id',
            'supervisor_id' => 'required|exists:users,id',
        ]);

        $supervisor = User::findOrFail($validated['supervisor_id']);
        
        // Verify supervisor has an allowed supervisory role
        if (!$supervisor->hasRole(['supervisor', 'sergeant', 'zone_commander'])) {
            return back()->with('error', 'Selected user is not a supervisor.');
        }

        Guard::whereIn('id', $validated['guard_ids'])
            ->update(['supervisor_id' => $validated['supervisor_id']]);

        $count = count($validated['guard_ids']);
        
        return back()->with('success', "{$count} guard(s) assigned to {$supervisor->name}.");
    }

    public function unassignFromSupervisor(Request $request)
    {
        $validated = $request->validate([
            'guard_ids' => 'required|array',
            'guard_ids.*' => 'exists:guards,id',
        ]);

        Guard::whereIn('id', $validated['guard_ids'])
            ->update(['supervisor_id' => null]);

        $count = count($validated['guard_ids']);
        
        return back()->with('success', "{$count} guard(s) unassigned from supervisor.");
    }

    public function assignToSite(Request $request)
    {
        $validated = $request->validate([
            'guard_id' => 'required|exists:guards,id',
            'client_site_id' => ['required', Rule::exists('client_sites', 'id')->whereNull('deleted_at')],
            'start_date' => 'nullable|date',
            'assignment_type' => 'nullable|in:permanent,temporary',
            'notes' => 'nullable|string',
        ]);

        // Verify guard is active before assigning
        $guard = Guard::findOrFail($validated['guard_id']);
        if ($guard->status !== 'active') {
            return back()->with('error', 'Cannot assign an inactive guard to a site.');
        }

        $startDate = $validated['start_date'] ?? now()->toDateString();

        \App\Models\Guards\GuardAssignment::where('guard_id', $validated['guard_id'])
            ->whereNull('end_date')
            ->update(['end_date' => now()->toDateString(), 'is_active' => false]);

        \App\Models\Guards\GuardAssignment::create([
            'guard_id' => $validated['guard_id'],
            'client_site_id' => $validated['client_site_id'],
            'assigned_by' => auth()->id(),
            'start_date' => $startDate,
            'end_date' => null,
            'assignment_type' => $validated['assignment_type'] ?? 'permanent',
            'notes' => $validated['notes'] ?? null,
            'is_active' => true,
        ]);

        return back()->with('success', 'Guard assigned to site.');
    }

    public function unassignFromSite(Request $request)
    {
        $validated = $request->validate([
            'guard_id' => 'required|exists:guards,id',
        ]);

        \App\Models\Guards\GuardAssignment::where('guard_id', $validated['guard_id'])
            ->whereNull('end_date')
            ->update(['end_date' => now()->toDateString(), 'is_active' => false]);

        return back()->with('success', 'Guard unassigned from site.');
    }
}
