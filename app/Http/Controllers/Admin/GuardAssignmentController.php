<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Guards\Guard;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class GuardAssignmentController extends Controller
{
    public function index()
    {
        $guards = Guard::with(['supervisor', 'currentAssignment.clientSite.client'])
            ->orderBy('name')
            ->paginate(20);

        $supervisors = User::role(['supervisor', 'manager'])
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
        
        // Verify supervisor has correct role
        if (!$supervisor->hasRole(['supervisor', 'manager'])) {
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
}