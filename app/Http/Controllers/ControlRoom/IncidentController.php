<?php

namespace App\Http\Controllers\ControlRoom;

use App\Http\Controllers\Controller;
use App\Models\Incident;
use Illuminate\Http\Request;
use Inertia\Inertia;

class IncidentController extends Controller
{
    public function index()
    {
        $incidents = Incident::with(['reporter', 'assignedTo', 'client', 'clientSite'])
            ->latest()
            ->paginate(20);

        return Inertia::render('ControlRoom/Incidents/Index', [
            'incidents' => $incidents,
        ]);
    }

    public function create()
    {
        $clients = \App\Models\Client::select('id', 'name')->with(['sites' => function($query) {
            $query->select('id', 'client_id', 'name', 'address');
        }])->get();
        
        $users = \App\Models\User::whereHas('roles', function($query) {
            $query->whereIn('name', ['admin', 'supervisor', 'manager']);
        })->select('id', 'name')->get();

        return Inertia::render('ControlRoom/Incidents/Create', [
            'clients' => $clients,
            'users' => $users,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'type' => 'required|in:security_breach,equipment_failure,personnel_issue,other',
            'severity' => 'required|in:low,medium,high,critical',
            'description' => 'required|string',
            'location' => 'required|string|max:255',
            'client_id' => 'nullable|exists:clients,id',
            'client_site_id' => 'nullable|exists:client_sites,id',
        ]);

        $incident = Incident::create([
            ...$validated,
            'reporter_id' => auth()->id(),
            'status' => 'open',
            'escalation_level' => 0,
        ]);

        return redirect()->route('control-room.incidents.show', $incident)
            ->with('success', 'Incident created successfully.');
    }

    public function show(Incident $incident)
    {
        $incident->load(['reporter', 'assignedTo', 'client', 'clientSite', 'comments.user']);

        return Inertia::render('ControlRoom/Incidents/Show', [
            'incident' => $incident,
        ]);
    }

    public function edit(Incident $incident)
    {
        return Inertia::render('ControlRoom/Incidents/Edit', [
            'incident' => $incident,
        ]);
    }

    public function update(Request $request, Incident $incident)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'type' => 'required|in:security_breach,equipment_failure,personnel_issue,other',
            'severity' => 'required|in:low,medium,high,critical',
            'description' => 'required|string',
            'location' => 'required|string|max:255',
            'status' => 'required|in:open,in_progress,resolved,closed',
            'client_id' => 'nullable|exists:clients,id',
            'client_site_id' => 'nullable|exists:client_sites,id',
        ]);

        $incident->update($validated);

        return redirect()->route('control-room.incidents.show', $incident)
            ->with('success', 'Incident updated successfully.');
    }

    public function destroy(Incident $incident)
    {
        $incident->delete();

        return redirect()->route('control-room.incidents.index')
            ->with('success', 'Incident deleted successfully.');
    }

    public function escalate(Request $request, Incident $incident)
    {
        $validated = $request->validate([
            'assigned_to' => 'required|exists:users,id',
            'reason' => 'required|string',
        ]);

        // Create an escalation comment
        $incident->comments()->create([
            'user_id' => auth()->id(),
            'comment' => "Incident escalated: {$validated['reason']}",
            'is_internal' => true,
        ]);

        // Update incident
        $incident->update([
            'escalation_level' => $incident->escalation_level + 1,
            'status' => 'escalated',
            'assigned_to' => $validated['assigned_to']
        ]);

        // Notify relevant parties
        event(new NotificationEvent('incident_escalated', [
            'incident_id' => $incident->id,
            'escalation_level' => $incident->escalation_level,
            'assigned_to' => $validated['assigned_to'],
            'reason' => $validated['reason']
        ]));

        return back()->with('success', 'Incident escalated successfully.');
    }

    public function resolve(Request $request, Incident $incident)
    {
        $incident->update([
            'status' => 'resolved',
            'resolved_at' => now(),
            'resolved_by' => auth()->id(),
        ]);

        return back()->with('success', 'Incident resolved successfully.');
    }

    public function assign(Request $request, Incident $incident)
    {
        $validated = $request->validate([
            'assigned_to' => 'required|exists:users,id',
        ]);

        $incident->update([
            'assigned_to' => $validated['assigned_to'],
            'status' => 'in_progress',
        ]);

        return back()->with('success', 'Incident assigned successfully.');
    }
}
