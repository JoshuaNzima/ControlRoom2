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
    protected function recalcZonesForSiteIds(array $siteIds): void
    {
        $siteIds = array_values(array_unique(array_filter(array_map('intval', $siteIds))));
        if (empty($siteIds)) {
            return;
        }

        $zoneIds = ClientSite::query()
            ->whereIn('id', $siteIds)
            ->pluck('zone_id')
            ->filter()
            ->unique()
            ->values()
            ->all();

        foreach ($zoneIds as $zoneId) {
            ClientSite::recalcZoneRequiredGuards($zoneId);
        }
    }

    public function index(Request $request)
    {
        $search = trim((string) $request->query('search', ''));
        $supervisorId = $request->query('supervisor_id');
        $siteId = (int) $request->query('site_id');
        $zoneId = (int) $request->query('zone_id');
        $dateFrom = $request->query('date_from');
        $dateTo = $request->query('date_to');
        $guardType = $request->query('guard_type');

        $user = $request->user();
        $isZoneCommander = $user && method_exists($user, 'hasRole') ? $user->hasRole('zone_commander') : false;
        $isGuardManager = $user && method_exists($user, 'hasAnyRole') ? $user->hasAnyRole(['supervisor', 'sergeant']) : false;

        $guardShifts = GuardShift::with(['guardRelation', 'clientSite'])
            ->when($isGuardManager, function ($q) use ($user) {
                $q->whereHas('guardRelation', function ($g) use ($user) {
                    $g->where('supervisor_id', $user->id);
                });
            })
            ->when($isZoneCommander, function ($q) use ($user) {
                $q->whereHas('clientSite', function ($s) use ($user) {
                    $s->where('zone_id', $user->zone_id);
                });
            })
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
        $guards = Guard::query()
            ->where('status', 'active')
            ->when($isGuardManager, fn ($q) => $q->where('supervisor_id', $user->id))
            ->when($isZoneCommander, fn ($q) => $q->where('zone_id', $user->zone_id))
            ->orderBy('name')
            ->get(['id', 'name', 'employee_id', 'guard_type', 'zone_id', 'supervisor_id']);
        $sites = ClientSite::select(['id','name'])->orderBy('name')->get();
        $zones = Zone::select(['id','name'])->orderBy('name')->get();

        return Inertia::render('ControlRoom/Shifts/Index', [
            'guardShifts' => $guardShifts,
            'scheduleShifts' => $scheduleShifts,
            'supervisors' => $supervisors,
            'guards' => $guards,
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
        return redirect()->route('control-room.shifts.index', ['create_shift' => 1]);
    }

    public function store(Request $request)
    {
        $rules = [
            'name' => 'required|string|max:255',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i',
            'description' => 'nullable|string',
            'supervisor_id' => 'nullable|exists:users,id',
            'required_guards' => 'nullable|integer|min:0',
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
        $required = array_key_exists('required_guards', $data) ? $data['required_guards'] : null;
        if ($required === null && $siteIds->isNotEmpty()) {
            $required = GuardAssignment::active()->current()->whereIn('client_site_id', $siteIds)->count();
        }

        $shift = Shift::create([
            ...$data,
            'required_guards' => $required,
            'status' => 'active',
            'created_by' => auth()->id(),
            'is_global' => (bool) ($data['is_global'] ?? false),
        ]);

        if (!(bool) ($shift->is_global ?? false)) {
            $this->recalcZonesForSiteIds((array) ($shift->sites ?? []));
        }

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

        return redirect()->route('control-room.shifts.index', ['view_shift' => $shift->id]);
    }

    public function edit(Shift $shift)
    {
        return redirect()->route('control-room.shifts.index', ['edit_shift' => $shift->id]);
    }

    public function update(Request $request, Shift $shift)
    {
        $originalSitesRaw = $shift->getOriginal('sites');
        $originalSites = is_string($originalSitesRaw) ? (json_decode($originalSitesRaw, true) ?: []) : (is_array($originalSitesRaw) ? $originalSitesRaw : []);
        $originalIsGlobal = (bool) $shift->getOriginal('is_global');

        $rules = [
            'name' => 'required|string|max:255',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i',
            'description' => 'nullable|string',
            'supervisor_id' => 'nullable|exists:users,id',
            'status' => 'required|in:active,inactive,completed',
            'required_guards' => 'nullable|integer|min:0',
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
        $required = array_key_exists('required_guards', $data) ? $data['required_guards'] : null;
        if ($required === null && $siteIds->isNotEmpty()) {
            $required = GuardAssignment::active()->current()->whereIn('client_site_id', $siteIds)->count();
        }

        $shift->update([
            ...$data,
            'required_guards' => $required,
            'is_global' => (bool) ($data['is_global'] ?? false),
        ]);

        $newIsGlobal = (bool) ($shift->is_global ?? false);
        if (!$originalIsGlobal || !$newIsGlobal) {
            $siteIds = array_merge((array) $originalSites, (array) ($shift->sites ?? []));
            $this->recalcZonesForSiteIds($siteIds);
        }

        return redirect()->route('control-room.shifts.index')
            ->withSuccess('Shift updated successfully.');
    }

    public function destroy(Shift $shift)
    {
        $sitesRaw = $shift->getOriginal('sites');
        $siteIds = is_string($sitesRaw) ? (json_decode($sitesRaw, true) ?: []) : (is_array($sitesRaw) ? $sitesRaw : []);
        $isGlobal = (bool) $shift->getOriginal('is_global');

        $shift->delete();

        if (!$isGlobal) {
            $this->recalcZonesForSiteIds((array) $siteIds);
        }

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
