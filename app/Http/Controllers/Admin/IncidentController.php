<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Incident;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Events\NotificationEvent;

class IncidentController extends Controller
{
    public function index(Request $request)
    {
        $perPage = (int) ($request->input('per_page') ?: 20);

        $incidents = Incident::with(['reporter', 'assignedTo', 'client', 'clientSite'])
            ->when($request->input('status'), function ($q, $status) {
                $q->where('status', $status);
            })
            ->latest()
            ->paginate($perPage)
            ->appends($request->all());

        return Inertia::render('Admin/Incidents/Index', [
            'incidents' => $incidents,
            'filters' => $request->only(['status', 'per_page']),
        ]);
    }

    public function show(Incident $incident)
    {
        $incident->load(['reporter', 'assignedTo', 'client', 'clientSite', 'comments.user']);

        return Inertia::render('Admin/Incidents/Show', [
            'incident' => $incident,
        ]);
    }

    /**
     * API show for fetching incident details via AJAX for modals
     */
    public function apiShow(Request $request, Incident $incident)
    {
        $incident->load(['reporter', 'assignedTo', 'client', 'clientSite', 'comments.user']);

        return response()->json($incident);
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

        event(new NotificationEvent('incident_assigned', ['incident_id' => $incident->id, 'assigned_to' => $validated['assigned_to']]));

        return back()->with('success', 'Incident assigned successfully.');
    }

    public function escalate(Request $request, Incident $incident)
    {
        $validated = $request->validate([
            'assigned_to' => 'required|exists:users,id',
            'reason' => 'required|string',
        ]);

        $incident->comments()->create([
            'user_id' => auth()->id(),
            'comment' => "Escalation: {$validated['reason']}",
            'is_internal' => true,
        ]);

        $incident->update([
            'escalation_level' => $incident->escalation_level + 1,
            'status' => 'escalated',
            'assigned_to' => $validated['assigned_to'],
        ]);

        event(new NotificationEvent('incident_escalated', [
            'incident_id' => $incident->id,
            'assigned_to' => $validated['assigned_to'],
            'reason' => $validated['reason'],
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

        event(new NotificationEvent('incident_resolved', ['incident_id' => $incident->id]));

        return back()->with('success', 'Incident resolved successfully.');
    }
}
