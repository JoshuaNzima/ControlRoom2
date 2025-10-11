<?php

namespace App\Http\Controllers\ControlRoom;

use App\Http\Controllers\Controller;
use App\Models\Shift;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ShiftController extends Controller
{
    public function index()
    {
        $shifts = Shift::with(['guards', 'supervisor'])
            ->latest()
            ->paginate(20);

        return Inertia::render('ControlRoom/Shifts/Index', [
            'shifts' => $shifts,
        ]);
    }

    public function create()
    {
        $guards = User::where('role', 'guard')->get();
        $supervisors = User::where('role', 'supervisor')->get();

        return Inertia::render('ControlRoom/Shifts/Create', [
            'guards' => $guards,
            'supervisors' => $supervisors,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'description' => 'nullable|string',
            'supervisor_id' => 'required|exists:users,id',
            'required_guards' => 'required|integer|min:1',
            'sites' => 'required|array|min:1',
            'sites.*' => 'string|max:255',
        ]);

        $shift = Shift::create([
            ...$validated,
            'status' => 'active',
            'created_by' => auth()->id(),
        ]);

        return redirect()->route('control-room.shifts.show', $shift)
            ->with('success', 'Shift created successfully.');
    }

    public function show(Shift $shift)
    {
        $shift->load(['guards', 'supervisor', 'createdBy']);
        $availableGuards = User::where('role', 'guard')
            ->whereDoesntHave('shifts', function ($query) use ($shift) {
                $query->where('shift_id', $shift->id);
            })
            ->get();

        return Inertia::render('ControlRoom/Shifts/Show', [
            'shift' => $shift,
            'availableGuards' => $availableGuards,
        ]);
    }

    public function edit(Shift $shift)
    {
        $guards = User::where('role', 'guard')->get();
        $supervisors = User::where('role', 'supervisor')->get();

        return Inertia::render('ControlRoom/Shifts/Edit', [
            'shift' => $shift,
            'guards' => $guards,
            'supervisors' => $supervisors,
        ]);
    }

    public function update(Request $request, Shift $shift)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'description' => 'nullable|string',
            'supervisor_id' => 'required|exists:users,id',
            'required_guards' => 'required|integer|min:1',
            'sites' => 'required|array|min:1',
            'sites.*' => 'string|max:255',
            'status' => 'required|in:active,inactive,completed',
        ]);

        $shift->update($validated);

        return redirect()->route('control-room.shifts.show', $shift)
            ->with('success', 'Shift updated successfully.');
    }

    public function destroy(Shift $shift)
    {
        $shift->delete();

        return redirect()->route('control-room.shifts.index')
            ->with('success', 'Shift deleted successfully.');
    }

    public function assignGuard(Request $request, Shift $shift)
    {
        $validated = $request->validate([
            'guard_id' => 'required|exists:users,id',
        ]);

        // Check if guard is already assigned to this shift
        if ($shift->guards()->where('user_id', $validated['guard_id'])->exists()) {
            return back()->with('error', 'Guard is already assigned to this shift.');
        }

        $shift->guards()->attach($validated['guard_id']);

        return back()->with('success', 'Guard assigned to shift successfully.');
    }

    public function unassignGuard(Shift $shift, User $guard)
    {
        $shift->guards()->detach($guard->id);

        return back()->with('success', 'Guard unassigned from shift successfully.');
    }

    public function schedule(Shift $shift)
    {
        $shift->load(['guards', 'supervisor']);
        
        return Inertia::render('ControlRoom/Shifts/Schedule', [
            'shift' => $shift,
        ]);
    }
}
