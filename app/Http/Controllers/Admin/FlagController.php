<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Flag;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Events\NotificationEvent;

class FlagController extends Controller
{
    public function index(Request $request)
    {
        $perPage = (int) ($request->input('per_page') ?: 20);

        $flags = Flag::with(['flaggable', 'reporter', 'reviewer'])
            ->when($request->input('status'), function ($q, $status) {
                $q->where('status', $status);
            })
            ->latest()
            ->paginate($perPage)
            ->appends($request->all());

        return Inertia::render('Admin/Flags/Index', [
            'flags' => $flags,
            'filters' => $request->only(['status', 'per_page']),
        ]);
    }

    public function show(Request $request, Flag $flag)
    {
        $this->authorize('view', $flag);
        $flag->load(['flaggable', 'reporter', 'reviewer']);

        return Inertia::render('Admin/Flags/Show', [
            'can' => [
                'escalate_flags' => $request->user()->can('escalate', $flag),
                'resolve_flags' => $request->user()->can('resolve', $flag),
            ],
            'flag' => $flag,
        ]);
    }

    /**
     * API show for fetching flag details via AJAX for modals
     */
    public function apiShow(Request $request, Flag $flag)
    {
        $flag->load(['flaggable', 'reporter', 'reviewer']);

        return response()->json($flag);
    }

    public function escalate(Request $request, Flag $flag)
    {
        $this->authorize('escalate', $flag);

        $validated = $request->validate([
            'reason' => 'required|string',
            'assigned_to' => 'required|exists:users,id',
        ]);

        // mark as escalated
        $flag->update(['status' => 'escalated']);

        event(new NotificationEvent('flag_escalated', ['flag_id' => $flag->id, 'reason' => $validated['reason']]));

        return back()->with('success', 'Flag escalated.');
    }

    public function resolve(Request $request, Flag $flag)
    {
        $this->authorize('resolve', $flag);
        
        $flag->update(['status' => 'resolved']);

        event(new NotificationEvent('flag_resolved', ['flag_id' => $flag->id]));

        return back()->with('success', 'Flag resolved.');
    }
}
