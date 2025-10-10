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
        $downs = Down::with(['reporter', 'client', 'clientSite'])
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
            'type' => 'required|in:guard_absent,site_unmanned,other',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        Down::create([
            ...$validated,
            'reported_by' => Auth::id(),
            'status' => 'open',
        ]);

        return back()->with('success', 'Down reported.');
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

        return back()->with('success', 'Down escalated.');
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

        return back()->with('success', 'Down marked as resolved.');
    }
}


