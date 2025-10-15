<?php

namespace App\Http\Controllers\ControlRoom;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreZoneRequest;
use App\Http\Requests\UpdateZoneRequest;
use App\Models\Zone;
use Inertia\Inertia;

class ZoneController extends Controller
{
    public function index()
    {
        $zones = Zone::query()
            ->select(['id', 'name', 'code', 'description', 'status', 'required_guard_count', 'target_sites_count'])
            ->get()
            ->map(function (Zone $zone) {
                return [
                    'id' => $zone->id,
                    'name' => $zone->name,
                    'code' => $zone->code,
                    'description' => $zone->description,
                    'status' => $zone->status,
                    'required_guard_count' => $zone->required_guard_count,
                    'target_sites_count' => $zone->target_sites_count,
                    'coverage_rate' => $zone->coverage_rate,
                    'active_guard_count' => $zone->active_guard_count,
                    'sites_count' => $zone->sites()->where('status', 'active')->count(),
                ];
            });

        $commanders = \App\Models\User::role('zone_commander')->select(['id','name'])->orderBy('name')->get();
        $sites = \App\Models\Guards\ClientSite::select(['id','name','zone_id'])->orderBy('name')->get();

        return Inertia::render('ControlRoom/Zones', [
            'zones' => $zones,
            'commanders' => $commanders,
            'sites' => $sites,
        ]);
    }

    public function store(StoreZoneRequest $request)
    {
        $data = $request->validated();
        if (empty($data['code'])) {
            $prefix = strtoupper(collect(explode(' ', $data['name']))->map(fn($w) => substr($w,0,1))->implode(''));
            $data['code'] = $prefix . '-' . strtoupper(str_pad(dechex(random_int(0, 0xFFFF)), 4, '0', STR_PAD_LEFT));
        }

        $zone = Zone::create($data);

        if (!empty($data['commander_id'])) {
            \App\Models\User::where('id', $data['commander_id'])->update(['zone_id' => $zone->id]);
        }

        if (!empty($data['site_ids'])) {
            \App\Models\Guards\ClientSite::whereIn('id', $data['site_ids'])->update(['zone_id' => $zone->id]);
        }

        return redirect()->route('control-room.zones.index')
            ->with('success', 'Zone created successfully');
    }

    public function update(UpdateZoneRequest $request, Zone $zone)
    {
        $data = $request->validated();
        if (empty($data['code'])) {
            $prefix = strtoupper(collect(explode(' ', $data['name']))->map(fn($w) => substr($w,0,1))->implode(''));
            $data['code'] = $prefix . '-' . strtoupper(str_pad(dechex(random_int(0, 0xFFFF)), 4, '0', STR_PAD_LEFT));
        }

        $zone->update($data);

        if (array_key_exists('commander_id', $data) && $data['commander_id']) {
            \App\Models\User::where('id', $data['commander_id'])->update(['zone_id' => $zone->id]);
        }

        if (!empty($data['site_ids'])) {
            \App\Models\Guards\ClientSite::whereIn('id', $data['site_ids'])->update(['zone_id' => $zone->id]);
        }

        return redirect()->route('control-room.zones.index')
            ->with('success', 'Zone updated successfully');
    }

    public function destroy(Zone $zone)
    {
        $zone->delete();
        return redirect()->route('control-room.zones.index')
            ->with('success', 'Zone deleted successfully');
    }

    public function assign(Zone $zone)
    {
        $sites = $zone->sites()->select(['id','name','status'])->orderBy('name')->get();
        $guards = \App\Models\Guards\Guard::select(['id','name','status'])->where('status','active')->orderBy('name')->get();
        $assignments = \App\Models\Guards\GuardAssignment::with(['clientSite:id,name,zone_id','assignedGuard:id,name'])
            ->whereHas('clientSite', function($q) use ($zone) { $q->where('zone_id', $zone->id); })
            ->where('is_active', true)
            ->get()
            ->map(function($a){
                return [
                    'id' => $a->id,
                    'guard' => $a->assignedGuard?->only(['id','name']),
                    'site' => $a->clientSite?->only(['id','name']),
                    'start_date' => optional($a->start_date)->format('Y-m-d'),
                ];
            });

        return Inertia::render('ControlRoom/Zones/Assign', [
            'zone' => $zone->only(['id','name','code']),
            'sites' => $sites,
            'guards' => $guards,
            'assignments' => $assignments,
        ]);
    }

    public function reports(Zone $zone)
    {
        return Inertia::render('ControlRoom/Zones/Reports', [
            'zone' => $zone,
            'stats' => $zone->getZoneCoverageStats(),
        ]);
    }

    public function map(Zone $zone)
    {
        return Inertia::render('ControlRoom/Zones/Map', [
            'zone' => $zone,
            'sites' => $zone->sites()->select(['id','name','latitude','longitude','status'])->get(),
        ]);
    }

    public function storeAssignment(\Illuminate\Http\Request $request, Zone $zone)
    {
        $data = $request->validate([
            'guard_id' => ['required','exists:guards,id'],
            'client_site_id' => ['required','exists:client_sites,id'],
            'start_date' => ['nullable','date'],
        ]);

        // Ensure site belongs to the zone
        $siteBelongs = $zone->sites()->where('id', $data['client_site_id'])->exists();
        if (!$siteBelongs) {
            return back()->with('error', 'Selected site does not belong to this zone.');
        }

        \App\Models\Guards\GuardAssignment::create([
            'guard_id' => $data['guard_id'],
            'client_site_id' => $data['client_site_id'],
            'assigned_by' => $request->user()?->id,
            'start_date' => $data['start_date'] ?? now()->startOfDay(),
            'is_active' => true,
        ]);

        return back()->with('success', 'Guard assigned to site.');
    }

    public function unassign(Zone $zone, \App\Models\Guards\GuardAssignment $assignment)
    {
        // Only allow if assignment site is in this zone
        if ($assignment->clientSite?->zone_id !== $zone->id) {
            return back()->with('error', 'Assignment not in this zone.');
        }

        $assignment->update([
            'is_active' => false,
            'end_date' => now()->startOfDay(),
        ]);

        return back()->with('success', 'Guard unassigned from site.');
    }
}


