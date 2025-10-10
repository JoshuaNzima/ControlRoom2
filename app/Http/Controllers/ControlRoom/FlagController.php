<?php

namespace App\Http\Controllers\ControlRoom;

use App\Http\Controllers\Controller;
use App\Models\Flag;
use App\Models\User;
use App\Models\Guards\Guard;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class FlagController extends Controller
{
    public function index(Request $request)
    {
        $flags = Flag::with(['flaggable', 'reporter', 'reviewer'])
            ->when($request->status, function ($query, $status) {
                return $query->where('status', $status);
            })
            ->when($request->type, function ($query, $type) {
                return $query->where('flaggable_type', $type === 'guard' ? Guard::class : User::class);
            })
            ->latest()
            ->paginate(10);

        return Inertia::render('ControlRoom/Flags/Index', [
            'flags' => $flags,
            'statuses' => Flag::STATUSES,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'flaggable_type' => 'required|in:guard,user',
            'flaggable_id' => 'required|integer',
            'reason' => 'required|string|max:255',
            'details' => 'required|string',
        ]);

        $flaggableType = $validated['flaggable_type'] === 'guard' ? Guard::class : User::class;
        $flaggable = $flaggableType::findOrFail($validated['flaggable_id']);

        $flag = $flaggable->flags()->create([
            'reason' => $validated['reason'],
            'details' => $validated['details'],
            'reported_by' => Auth::id(),
            'status' => 'pending_review'
        ]);

        return back()->with('success', 'Flag created successfully.');
    }

    public function show(Flag $flag)
    {
        $flag->load(['flaggable', 'reporter', 'reviewer']);

        return Inertia::render('ControlRoom/Flags/Show', [
            'flag' => $flag,
            'canReview' => Auth::user()->hasAnyRole(['supervisor', 'manager']),
        ]);
    }

    public function update(Request $request, Flag $flag)
    {
        $this->authorize('review', $flag);

        $validated = $request->validate([
            'status' => 'required|in:' . implode(',', Flag::STATUSES),
            'review_notes' => 'required|string',
        ]);

        $flag->update([
            ...$validated,
            'reviewed_by' => Auth::id(),
            'review_date' => now(),
        ]);

        return back()->with('success', 'Flag updated successfully.');
    }

    public function destroy(Flag $flag)
    {
        $this->authorize('delete', $flag);
        
        $flag->delete();

        return redirect()->route('control-room.flags.index')
            ->with('success', 'Flag deleted successfully.');
    }
}