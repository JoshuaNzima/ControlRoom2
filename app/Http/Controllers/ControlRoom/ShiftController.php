<?php

namespace App\Http\Controllers\ControlRoom;

use App\Http\Controllers\Controller;
use App\Models\Guards\Shift as GuardShift;
use App\Models\Shift as ScheduleShift;
use App\Models\User;
use App\Models\Guards\Guard;
use App\Models\Guards\ClientSite;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ShiftController extends Controller
{
    public function index()
    {
        // Guard shifts (daily per-guard)
        $guardShifts = GuardShift::with(['guardRelation', 'clientSite'])
            ->orderByDesc('date')
            ->paginate(20);

        // Schedule shifts (template/group shifts)
        $scheduleShifts = ScheduleShift::latest()->paginate(20);

        $supervisors = User::role('supervisor')->select(['id','name'])->orderBy('name')->get();
        $sites = ClientSite::select(['id','name'])->orderBy('name')->get();

        return Inertia::render('ControlRoom/Shifts/Index', [
            'guardShifts' => $guardShifts,
            'scheduleShifts' => $scheduleShifts,
            'supervisors' => $supervisors,
            'sites' => $sites,
        ]);
    }

    public function create()
    {
        $guards = Guard::select(['id','name'])->orderBy('name')->get();
        $supervisors = User::role('supervisor')->select(['id','name'])->orderBy('name')->get();
        $sites = ClientSite::select(['id','name'])->orderBy('name')->get();

        return Inertia::render('ControlRoom/Shifts/Create', [
            'guards' => $guards,
            'supervisors' => $supervisors,
            'sites' => $sites,
        ]);
    }

    public function store(Request $request)
    {
        $rules = [
            'name' => 'required|string|max:255',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'description' => 'nullable|string',
            'supervisor_id' => 'required|exists:users,id',
            'required_guards' => 'required|integer|min:1',
            'is_global' => 'sometimes|boolean',
        ];

        // When not global, require sites
        if (!$request->boolean('is_global')) {
            $rules['sites'] = 'required|array|min:1';
            $rules['sites.*'] = 'integer|exists:client_sites,id';
        } else {
            $rules['sites'] = 'nullable|array';
            $rules['sites.*'] = 'integer|exists:client_sites,id';
        }

        $validated = $request->validate($rules);

        $shift = Shift::create([
            ...$validated,
            'status' => 'active',
            'created_by' => auth()->id(),
            'is_global' => (bool) ($validated['is_global'] ?? false),
        ]);

        return redirect()->route('control-room.shifts.index')
            ->withSuccess('Shift created successfully.');
    }

    public function show(Request $request, Shift $shift)
    {
        $shift->load(['guards', 'supervisor', 'createdBy']);
        $availableGuards = Guard::select(['id','name'])
            ->whereNotIn('id', $shift->guards->pluck('id'))
            ->orderBy('name')
            ->get();
        $sitesMap = ClientSite::whereIn('id', (array) $shift->sites)
            ->pluck('name','id');

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'shift' => $shift,
                'availableGuards' => $availableGuards,
                'sitesMap' => $sitesMap,
            ]);
        }

        return Inertia::render('ControlRoom/Shifts/Show', [
            'shift' => $shift,
            'availableGuards' => $availableGuards,
            'sitesMap' => $sitesMap,
        ]);
    }

    public function edit(Shift $shift)
    {
        $guards = Guard::select(['id','name'])->orderBy('name')->get();
        $supervisors = User::role('supervisor')->select(['id','name'])->orderBy('name')->get();
        $sites = ClientSite::select(['id','name'])->orderBy('name')->get();

        return Inertia::render('ControlRoom/Shifts/Edit', [
            'shift' => $shift,
            'guards' => $guards,
            'supervisors' => $supervisors,
            'sites' => $sites,
        ]);
    }

    public function update(Request $request, Shift $shift)
    {
        $rules = [
            'name' => 'required|string|max:255',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'description' => 'nullable|string',
            'supervisor_id' => 'required|exists:users,id',
            'required_guards' => 'required|integer|min:1',
            'status' => 'required|in:active,inactive,completed',
            'is_global' => 'sometimes|boolean',
        ];
        if (!$request->boolean('is_global')) {
            $rules['sites'] = 'required|array|min:1';
            $rules['sites.*'] = 'integer|exists:client_sites,id';
        } else {
            $rules['sites'] = 'nullable|array';
            $rules['sites.*'] = 'integer|exists:client_sites,id';
        }
        $validated = $request->validate($rules);

        $shift->update([
            ...$validated,
            'is_global' => (bool) ($validated['is_global'] ?? false),
        ]);

        return redirect()->route('control-room.shifts.index')
            ->withSuccess('Shift updated successfully.');
    }

    public function destroy(Shift $shift)
    {
        $shift->delete();

        return redirect()->route('control-room.shifts.index')
            ->withSuccess('Shift deleted successfully.');
    }

    public function assignGuard(Request $request, Shift $shift)
    {
        $validated = $request->validate([
            'guard_id' => 'required|exists:users,id',
        ]);

        // Check if guard is already assigned to this shift
        if ($shift->guards()->where('user_id', $validated['guard_id'])->exists()) {
            return back()->withError('Guard is already assigned to this shift.');
        }

        $shift->guards()->attach($validated['guard_id']);

        return back()->withSuccess('Guard assigned to shift successfully.');
    }

    public function unassignGuard(Shift $shift, User $guard)
    {
        $shift->guards()->detach($guard->id);

        return back()->withSuccess('Guard unassigned from shift successfully.');
    }

    public function schedule(Shift $shift)
    {
        $shift->load(['guards', 'supervisor']);
        
        return Inertia::render('ControlRoom/Shifts/Schedule', [
            'shift' => $shift,
        ]);
    }
}
