<?php

namespace App\Http\Controllers\ControlRoom;

use App\Http\Controllers\Controller;
use App\Models\Down;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DownController extends Controller
{
    public function index(Request $request)
    {
        $downs = Down::with(['reporter', 'client', 'clientSite', 'guardRelation'])
            ->when($request->status, fn($q, $s) => $q->where('status', $s))
            ->latest()
            ->paginate(10);

        return Inertia::render('ControlRoom/Downs/Index', [
            'downs' => $downs,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'client_id' => 'nullable|exists:clients,id',
            'client_site_id' => 'nullable|exists:client_sites,id',
            'guard_id' => 'nullable|exists:guards,id',
            'type' => 'required|in:guard_absent,site_unmanned,other',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
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

        $down = Down::create([
            ...$validated,
            'reported_by' => Auth::id(),
            'status' => 'open',
        ]);

        if ($request->boolean('flag_guard') && ($validated['guard_id'] ?? null)) {
            \App\Models\Flag::create([
                'flaggable_type' => \App\Models\Guards\Guard::class,
                'flaggable_id' => $validated['guard_id'],
                'reason' => $request->input('flag_reason') ?? 'Down report involvement',
                'details' => $request->input('flag_details') ?? ('Guard linked to down ID: ' . $down->id),
                'reported_by' => Auth::id(),
                'status' => 'pending_review',
                'site_id' => $down->client_site_id,
            ]);
        }

        return back()->withSuccess('Down reported.');
    }

    public function escalate(Down $down)
    {
        if ($down->status === 'resolved') {
            return back();
        }
        $down->update([
            'status' => 'escalated',
            'escalation_level' => $down->escalation_level + 1,
        ]);

        // TODO: notifications to stakeholders

        return back()->withSuccess('Down escalated.');
    }

    public function resolve(Request $request, Down $down)
    {
        $validated = $request->validate([
            'resolution_notes' => 'nullable|string',
        ]);

        $down->update([
            'status' => 'resolved',
            'resolved_at' => now(),
            'resolved_by' => Auth::id(),
            ...$validated,
        ]);

        return back()->withSuccess('Down marked as resolved.');
    }

    public function show(Down $down)
    {
        $down->load(['reporter', 'client', 'clientSite', 'guardRelation']);

        return Inertia::render('ControlRoom/Downs/Show', [
            'down' => $down,
        ]);
    }

    public function edit(Down $down)
    {
        return Inertia::render('ControlRoom/Downs/Edit', [
            'down' => $down,
        ]);
    }

    public function update(Request $request, Down $down)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'type' => 'required|in:guard_absent,site_unmanned,other',
            'description' => 'nullable|string',
            'status' => 'required|in:open,escalated,resolved,closed,absconding',
        ]);

        $down->update($validated);

        return redirect()->route('control-room.downs.index')->withSuccess('Down updated successfully.');
    }

    public function destroy(Down $down)
    {
        $down->delete();

        return redirect()->route('control-room.downs.index')->withSuccess('Down deleted successfully.');
    }

    public function abscond(Down $down)
    {
        if ($down->status === 'resolved') {
            return back();
        }

        $down->update([
            'status' => 'absconding',
        ]);

        // Optionally create a flag for the guard if present
        if ($down->guard_id) {
            \App\Models\Flag::create([
                'flaggable_type' => \App\Models\Guards\Guard::class,
                'flaggable_id' => $down->guard_id,
                'reason' => 'Absconding',
                'details' => 'Marked as absconding via Down ID: ' . $down->id,
                'reported_by' => Auth::id(),
                'status' => 'pending_review',
                'site_id' => $down->client_site_id,
            ]);
        }

        return back()->withSuccess('Down marked as absconding.');
    }
}


