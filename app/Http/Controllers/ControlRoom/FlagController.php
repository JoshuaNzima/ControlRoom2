<?php

namespace App\Http\Controllers\ControlRoom;

use App\Http\Controllers\Controller;
use App\Models\Flag;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FlagController extends Controller
{
    public function index()
    {
        $flags = Flag::with(['reporter', 'assignedTo', 'client', 'clientSite'])
            ->latest()
            ->paginate(20);

        return Inertia::render('ControlRoom/Flags/Index', [
            'flags' => $flags,
        ]);
    }

    public function create()
    {
        return Inertia::render('ControlRoom/Flags/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'type' => 'required|in:security_concern,equipment_issue,personnel_issue,client_complaint,other',
            'priority' => 'required|in:low,medium,high,critical',
            'description' => 'required|string',
            'location' => 'required|string|max:255',
            'client_id' => 'nullable|exists:clients,id',
            'client_site_id' => 'nullable|exists:client_sites,id',
        ]);

        $flag = Flag::create([
            ...$validated,
            'reporter_id' => auth()->id(),
            'status' => 'open',
            'escalation_level' => 0,
        ]);

        return redirect()->route('control-room.flags.show', $flag)
            ->with('success', 'Flag created successfully.');
    }

    public function show(Flag $flag)
    {
        $flag->load(['reporter', 'assignedTo', 'client', 'clientSite', 'comments.user']);

        return Inertia::render('ControlRoom/Flags/Show', [
            'flag' => $flag,
        ]);
    }

    public function edit(Flag $flag)
    {
        return Inertia::render('ControlRoom/Flags/Edit', [
            'flag' => $flag,
        ]);
    }

    public function update(Request $request, Flag $flag)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'type' => 'required|in:security_concern,equipment_issue,personnel_issue,client_complaint,other',
            'priority' => 'required|in:low,medium,high,critical',
            'description' => 'required|string',
            'location' => 'required|string|max:255',
            'status' => 'required|in:open,acknowledged,in_progress,resolved,closed',
            'client_id' => 'nullable|exists:clients,id',
            'client_site_id' => 'nullable|exists:client_sites,id',
        ]);

        $flag->update($validated);

        return redirect()->route('control-room.flags.show', $flag)
            ->with('success', 'Flag updated successfully.');
    }

    public function destroy(Flag $flag)
    {
        $flag->delete();

        return redirect()->route('control-room.flags.index')
            ->with('success', 'Flag deleted successfully.');
    }

    public function acknowledge(Request $request, Flag $flag)
    {
        $flag->update([
            'status' => 'acknowledged',
            'acknowledged_by' => auth()->id(),
            'acknowledged_at' => now(),
        ]);

        return back()->with('success', 'Flag acknowledged successfully.');
    }

    public function resolve(Request $request, Flag $flag)
    {
        $flag->update([
            'status' => 'resolved',
            'resolved_at' => now(),
            'resolved_by' => auth()->id(),
        ]);

        return back()->with('success', 'Flag resolved successfully.');
    }

    public function escalate(Request $request, Flag $flag)
    {
        $flag->update([
            'escalation_level' => $flag->escalation_level + 1,
            'status' => 'escalated',
        ]);

        return back()->with('success', 'Flag escalated successfully.');
    }
}