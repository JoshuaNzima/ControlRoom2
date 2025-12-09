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
        $incidents = Incident::with(['reporter', 'assignedTo', 'guardRelation', 'client', 'clientSite'])
            ->latest()
            ->paginate(20);

        return Inertia::render('ControlRoom/Incidents/Index', [
            'incidents' => $incidents,
        ]);
    }

    public function create()
    {
        return Inertia::render('ControlRoom/Incidents/Create');
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
            'guard_id' => 'nullable|exists:guards,id',
            'flag_guard' => 'sometimes|boolean',
            'flag_reason' => 'required_if:flag_guard,1|nullable|string|max:255',
            'flag_details' => 'nullable|string',
        ]);

        if (($validated['client_id'] ?? null) === null && ($validated['client_site_id'] ?? null)) {
            $site = \App\Models\ClientSite::find($validated['client_site_id']);
            if ($site) {
                $validated['client_id'] = $site->client_id;
            }
        }

        $incident = Incident::create([
            ...$validated,
            'reporter_id' => auth()->id(),
            'status' => 'open',
            'escalation_level' => 0,
        ]);

        if ($request->boolean('flag_guard') && ($validated['guard_id'] ?? null)) {
            \App\Models\Flag::create([
                'flaggable_type' => \App\Models\Guards\Guard::class,
                'flaggable_id' => $validated['guard_id'],
                'reason' => $request->input('flag_reason') ?? 'Incident involvement',
                'details' => $request->input('flag_details') ?? ('Guard was linked to incident ID: ' . $incident->id),
                'reported_by' => auth()->id(),
                'status' => 'pending_review',
                'site_id' => $incident->client_site_id,
            ]);
        }

        return redirect()->route('control-room.incidents.show', $incident)
            ->withSuccess('Incident created successfully.');
    }

    public function show(Incident $incident)
    {
        $incident->load(['reporter', 'assignedTo', 'guardRelation', 'client', 'clientSite', 'comments.user']);

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
            ->withSuccess('Incident updated successfully.');
    }

    public function destroy(Incident $incident)
    {
        $incident->delete();

        return redirect()->route('control-room.incidents.index')
            ->withSuccess('Incident deleted successfully.');
    }

    public function escalate(Request $request, Incident $incident)
    {
        $incident->update([
            'escalation_level' => $incident->escalation_level + 1,
            'status' => 'escalated',
        ]);

        return back()->withSuccess('Incident escalated successfully.');
    }

    public function resolve(Request $request, Incident $incident)
    {
        $incident->update([
            'status' => 'resolved',
            'resolved_at' => now(),
            'resolved_by' => auth()->id(),
        ]);

        return back()->withSuccess('Incident resolved successfully.');
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

        return back()->withSuccess('Incident assigned successfully.');
    }
}
