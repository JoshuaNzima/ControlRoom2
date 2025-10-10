<?php

namespace App\Http\Controllers\Guards;

use App\Http\Controllers\Controller;
use App\Models\Guards\{Guard, GuardAssignment, ClientSite};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class SupervisorAssignmentController extends Controller
{
    public function index()
    {
        $supervisorId = Auth::id();
        
        // Get guards assigned to this supervisor
        $guards = Guard::forSupervisor($supervisorId)
            ->with(['activeAssignments.clientSite.client'])
            ->orderBy('name')
            ->get()
            ->map(fn($guard) => [
                'id' => $guard->id,
                'employee_id' => $guard->employee_id,
                'name' => $guard->name,
                'phone' => $guard->phone,
                'status' => $guard->status,
                'current_assignment' => $guard->currentAssignment() ? [
                    'id' => $guard->currentAssignment()->id,
                    'site_name' => $guard->currentAssignment()->clientSite->name,
                    'client_name' => $guard->currentAssignment()->clientSite->client->name,
                    'start_date' => $guard->currentAssignment()->start_date->format('M d, Y'),
                    'assignment_type' => $guard->currentAssignment()->assignment_type,
                ] : null,
            ]);

        // Get available sites
        $sites = ClientSite::active()
            ->with('client')
            ->orderBy('name')
            ->get()
            ->map(fn($site) => [
                'id' => $site->id,
                'name' => $site->name,
                'client_name' => $site->client->name,
                'full_name' => $site->client->name . ' - ' . $site->name,
            ]);

        return Inertia::render('Supervisor/Assignments', [
            'guards' => $guards,
            'sites' => $sites,
        ]);
    }

    public function assign(Request $request)
    {
        $validated = $request->validate([
            'guard_id' => 'required|exists:guards,id',
            'client_site_id' => 'required|exists:client_sites,id',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after:start_date',
            'assignment_type' => 'required|in:permanent,temporary,relief',
            'notes' => 'nullable|string|max:500',
        ]);

        $guard = Guard::findOrFail($validated['guard_id']);
        
        // Verify guard belongs to this supervisor
        if ($guard->supervisor_id !== Auth::id()) {
            return back()->with('error', 'You can only assign your own guards.');
        }

        // Deactivate previous assignments
        GuardAssignment::where('guard_id', $validated['guard_id'])
            ->where('is_active', true)
            ->update(['is_active' => false, 'end_date' => today()]);

        // Create new assignment
        GuardAssignment::create([
            'guard_id' => $validated['guard_id'],
            'client_site_id' => $validated['client_site_id'],
            'assigned_by' => Auth::id(),
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'] ?? null,
            'assignment_type' => $validated['assignment_type'],
            'notes' => $validated['notes'] ?? null,
            'is_active' => true,
        ]);

        return back()->with('success', "{$guard->name} assigned successfully.");
    }

    public function unassign(Request $request, $assignmentId)
    {
        $assignment = GuardAssignment::findOrFail($assignmentId);
        
        // Verify guard belongs to this supervisor
        if ($assignment->guard->supervisor_id !== Auth::id()) {
            return back()->with('error', 'Unauthorized action.');
        }

        $assignment->update([
            'is_active' => false,
            'end_date' => today(),
        ]);

        return back()->with('success', 'Guard unassigned from location.');
    }
}