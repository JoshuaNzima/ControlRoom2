<?php

namespace App\Http\Controllers\ControlRoom;

use App\Http\Controllers\Controller;
use App\Models\Guards\Shift as GuardShift;
use App\Models\Shift;
use App\Models\User;
use App\Models\Guards\Guard;
use App\Models\Guards\ClientSite;
use App\Models\Guards\GuardAssignment;
use App\Models\Zone;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ShiftController extends Controller
{
    public function index(Request $request)
    {
        $search = trim((string) $request->query('search', ''));
        $supervisorId = $request->query('supervisor_id');
        $siteId = (int) $request->query('site_id');
        $zoneId = (int) $request->query('zone_id');
        $dateFrom = $request->query('date_from');
        $dateTo = $request->query('date_to');
        $guardType = $request->query('guard_type');

        $guardShifts = GuardShift::with(['guardRelation', 'clientSite'])
            ->when($zoneId, function ($q) use ($zoneId) {
                $q->whereHas('clientSite', function ($qq) use ($zoneId) {
                    $qq->where('zone_id', $zoneId);
                });
            })
            ->when($guardType, function ($q) use ($guardType) {
                $q->whereHas('guardRelation', function ($g) use ($guardType) {
                    $g->where('guard_type', $guardType);
                });
            })
            ->when($siteId, fn ($q) => $q->where('client_site_id', $siteId))
            ->when($dateFrom, fn ($q) => $q->whereDate('date', '>=', $dateFrom))
            ->when($dateTo, fn ($q) => $q->whereDate('date', '<=', $dateTo))
            ->when($search, function ($q) use ($search) {
                $q->where(function ($qq) use ($search) {
                    $qq->whereHas('guardRelation', function ($g) use ($search) {
                        $g->where('name', 'like', "%{$search}%");
                    })->orWhereHas('clientSite', function ($s) use ($search) {
                        $s->where('name', 'like', "%{$search}%");
                    });
                });
            })
            ->orderByDesc('date')
            ->paginate(20)
            ->withQueryString();

        $scheduleShifts = Shift::query()
            ->when($search, fn ($q) => $q->where('name', 'like', "%{$search}%"))
            ->when($supervisorId, fn ($q) => $q->where('supervisor_id', $supervisorId))
            ->when($siteId, fn ($q) => $q->whereJsonContains('sites', (int) $siteId))
            ->latest()
            ->paginate(20)
            ->withQueryString();

        $supervisors = User::whereHas('roles', function ($q) {
                $q->where('name', 'supervisor')->where('guard_name', 'web');
            })
            ->select(['id','name'])
            ->orderBy('name')
            ->get();
        $sites = ClientSite::select(['id','name'])->orderBy('name')->get();
        $zones = Zone::select(['id','name'])->orderBy('name')->get();

        return Inertia::render('ControlRoom/Shifts/Index', [
            'guardShifts' => $guardShifts,
            'scheduleShifts' => $scheduleShifts,
            'supervisors' => $supervisors,
            'sites' => $sites,
            'zones' => $zones,
            'filters' => [
                'search' => $search ?: null,
                'supervisor_id' => $supervisorId ?: null,
                'site_id' => $siteId ?: null,
                'zone_id' => $zoneId ?: null,
                'date_from' => $dateFrom ?: null,
                'date_to' => $dateTo ?: null,
                'guard_type' => $guardType ?: null,
            ],
        ]);
    }

    public function create()
    {
        $guards = Guard::select(['id','name'])->orderBy('name')->get();
        $supervisors = User::whereHas('roles', function ($q) {
                $q->where('name', 'supervisor')->where('guard_name', 'web');
            })
            ->select(['id','name'])
            ->orderBy('name')
            ->get();
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
            'end_time' => 'required|date_format:H:i',
            'description' => 'nullable|string',
            'supervisor_id' => 'nullable|exists:users,id',
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
        $data = $validated;
        if (empty($data['supervisor_id'])) {
            $data['supervisor_id'] = auth()->id();
        }

        $siteIds = collect($data['sites'] ?? [])->filter()->values();
        $required = null;
        if ($siteIds->isNotEmpty()) {
            $required = GuardAssignment::active()->current()->whereIn('client_site_id', $siteIds)->count();
        }

        $shift = Shift::create([
            ...$data,
            'required_guards' => $required,
            'status' => 'scheduled',
            'created_by' => auth()->id(),
            'is_global' => (bool) ($data['is_global'] ?? false),
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
        $supervisors = User::whereHas('roles', function ($q) {
                $q->where('name', 'supervisor')->where('guard_name', 'web');
            })
            ->select(['id','name'])
            ->orderBy('name')
            ->get();
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
            'end_time' => 'required|date_format:H:i',
            'description' => 'nullable|string',
            'supervisor_id' => 'nullable|exists:users,id',
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
        $data = $validated;
        if (empty($data['supervisor_id'])) {
            $data['supervisor_id'] = auth()->id();
        }

        $siteIds = collect($data['sites'] ?? [])->filter()->values();
        $required = null;
        if ($siteIds->isNotEmpty()) {
            $required = GuardAssignment::active()->current()->whereIn('client_site_id', $siteIds)->count();
        }

        $shift->update([
            ...$data,
            'required_guards' => $required,
            'is_global' => (bool) ($data['is_global'] ?? false),
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

    public function requiredGuards(Request $request)
    {
        $data = $request->validate([
            'sites' => ['nullable','array'],
            'sites.*' => ['integer','exists:client_sites,id'],
        ]);

        $siteIds = collect($data['sites'] ?? [])->filter()->values();
        $count = 0;
        if ($siteIds->isNotEmpty()) {
            $count = GuardAssignment::active()->current()->whereIn('client_site_id', $siteIds)->count();
        }

        return response()->json(['required_guards' => (int) $count]);
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
