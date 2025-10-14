<?php

namespace App\Http\Controllers\ControlRoom;

use App\Http\Controllers\Controller;
use App\Models\Flag;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class FlagController extends Controller
{
    public function index(Request $request)
    {
        $query = Flag::with(['flaggable', 'reporter', 'reviewer'])->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $flags = $query->paginate(20)->withQueryString();

        return Inertia::render('ControlRoom/Flags/Index', [
            'flags' => $flags,
            'statuses' => Flag::STATUSES,
        ]);
    }

    public function create()
    {
        // The UI currently provides a modal create form; keep route in case it's needed
        return Inertia::render('ControlRoom/Flags/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'flaggable_type' => 'required|string',
            'flaggable_id' => 'required|integer',
            'reason' => 'required|string|max:255',
            'details' => 'required|string',
            'client_id' => 'nullable|exists:clients,id',
        ]);

        $flag = Flag::create([
            'flaggable_type' => $validated['flaggable_type'],
            'flaggable_id' => $validated['flaggable_id'],
            'reason' => $validated['reason'],
            'details' => $validated['details'],
            'reported_by' => auth()->id(),
            'status' => 'pending_review',
            'meta' => [],
        ]);

        return redirect()->route('control-room.flags.show', $flag)
            ->with('success', 'Flag created successfully.');
    }

    public function show(Flag $flag)
    {
        $flag->load(['flaggable', 'reporter', 'reviewer']);

        return Inertia::render('ControlRoom/Flags/Show', [
            'flag' => $flag,
            'canReview' => auth()->user() ? auth()->user()->can('review flags') : false,
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
            'status' => ['required', Rule::in(Flag::STATUSES)],
            'review_notes' => 'nullable|string',
            'details' => 'nullable|string',
        ]);

        $data = [
            'status' => $validated['status'],
        ];

        if (isset($validated['review_notes'])) {
            $data['review_notes'] = $validated['review_notes'];
        }

        if (isset($validated['details'])) {
            $data['details'] = $validated['details'];
        }

        // If being reviewed/resolved, record reviewer and date
        if (in_array($validated['status'], ['under_review', 'resolved', 'dismissed'])) {
            $data['reviewed_by'] = auth()->id();
            $data['review_date'] = now();
        }

        $flag->update($data);

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
            'status' => 'under_review',
            'reviewed_by' => auth()->id(),
            'review_date' => now(),
        ]);

        return back()->with('success', 'Flag acknowledged successfully.');
    }

    public function resolve(Request $request, Flag $flag)
    {
        $flag->update([
            'status' => 'resolved',
            'reviewed_by' => auth()->id(),
            'review_date' => now(),
        ]);

        return back()->with('success', 'Flag resolved successfully.');
    }

    public function escalate(Request $request, Flag $flag)
    {
        $meta = $flag->meta ?? [];
        $meta['escalation_level'] = ($meta['escalation_level'] ?? 0) + 1;

        $flag->update([
            'meta' => $meta,
            'status' => 'under_review',
        ]);

        return back()->with('success', 'Flag escalated successfully.');
    }
}