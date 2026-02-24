<?php

namespace App\Http\Controllers\Guards;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Guards\ClientSite;
use App\Models\Guards\Guard;
use App\Models\Guards\GuardAssignment;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class AssignmentController extends Controller
{
    public function index()
    {
        $supervisor = Auth::user();
        $guards = Guard::with('currentAssignmentRelation.site.client')
            ->where('supervisor_id', $supervisor->id)
            ->get()
            ->map(function ($guard) {
                $assignment = $guard->currentAssignmentRelation;
                if ($assignment) {
                    $guard->current_assignment = [
                        'id' => $assignment->id,
                        'site_name' => $assignment->site?->name,
                        'client_name' => $assignment->site?->client?->name,
                        'start_date' => $assignment->start_date,
                        'end_date' => $assignment->end_date,
                        'assignment_type' => $assignment->assignment_type,
                    ];
                } else {
                    $guard->current_assignment = null;
                }
                return $guard;
            });

        $sites = ClientSite::with('client')->whereHas('client', function ($query) {
            $query->where('status', 'active');
        })->get()->map(function ($site) {
            $site->full_name = $site->client->name . ' - ' . $site->name;
            return $site;
        });

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
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'assignment_type' => 'required|in:permanent,temporary',
        ]);

        // End previous assignment if any
        GuardAssignment::where('guard_id', $validated['guard_id'])
            ->where('is_active', true)
            ->whereNull('end_date')
            ->update([
                'end_date' => $validated['start_date'],
                'is_active' => false,
                'active' => false,
            ]);

        GuardAssignment::create([
            'guard_id' => $validated['guard_id'],
            'client_site_id' => $validated['client_site_id'],
            'assigned_by' => auth()->id(),
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'] ?? null,
            'assignment_type' => $validated['assignment_type'],
            'is_active' => true,
            'active' => true,
        ]);

        return redirect()->back()->with('success', 'Guard assigned successfully.');
    }

    public function unassign(GuardAssignment $assignment)
    {
        $assignment->update([
            'end_date' => now()->toDateString(),
            'is_active' => false,
            'active' => false,
        ]);

        return redirect()->back()->with('success', 'Guard unassigned successfully.');
    }
}
