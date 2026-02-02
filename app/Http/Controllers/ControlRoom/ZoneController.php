<?php

namespace App\Http\Controllers\ControlRoom;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreZoneRequest;
use App\Http\Requests\UpdateZoneRequest;
use App\Models\Guards\ClientSite;
use App\Models\User;
use App\Models\Zone;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ZoneController extends Controller
{
    public function index()
    {
        $zones = Zone::query()
            ->select(['id', 'name', 'code', 'description', 'status', 'required_guard_count', 'target_sites_count'])
            ->get()
            ->map(function (Zone $zone) {
                $commander = User::role('zone_commander')
                    ->select(['id', 'name'])
                    ->where('zone_id', $zone->id)
                    ->first();

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
                    'commander_id' => $commander?->id,
                    'commander_name' => $commander?->name,
                ];
            });

        $commanders = User::role('zone_commander')->select(['id','name'])->orderBy('name')->get();
        $sites = ClientSite::select(['id','name','zone_id'])->orderBy('name')->get();
        $guards = \App\Models\Guards\Guard::select(['id','name','status'])->where('status','active')->orderBy('name')->get();

        return Inertia::render('ControlRoom/Zones', [
            'zones' => $zones,
            'commanders' => $commanders,
            'sites' => $sites,
            'guards' => $guards,
        ]);
    }

    public function store(StoreZoneRequest $request)
    {
        $data = $request->validated();
        // Always generate a new code
        $prefix = strtoupper(collect(explode(' ', $data['name']))->map(fn($w) => substr($w,0,1))->implode(''));
        $data['code'] = $prefix . '-' . strtoupper(str_pad(dechex(random_int(0, 0xFFFF)), 4, '0', STR_PAD_LEFT));

        $commanderId = $data['commander_id'] ?? null;
        $siteIds = $data['site_ids'] ?? null;
        unset($data['commander_id'], $data['site_ids']);

        $affectedZoneIds = [];
        $zone = DB::transaction(function () use ($data, $commanderId, $siteIds, &$affectedZoneIds) {
            $zone = Zone::create($data);

            $this->syncZoneCommander($zone, $commanderId);

            if (is_array($siteIds)) {
                $affectedZoneIds = array_merge($affectedZoneIds, $this->syncZoneSites($zone, $siteIds));
            }

            $affectedZoneIds[] = $zone->id;
            $this->recalcRequiredGuardsForZones(array_unique(array_filter($affectedZoneIds)));

            return $zone;
        });

        return redirect()->route('control-room.zones.index')->withSuccess('Zone created successfully');
    }

    public function update(UpdateZoneRequest $request, Zone $zone)
    {
        $data = $request->validated();
        if (empty($data['code'])) {
            $prefix = strtoupper(collect(explode(' ', $data['name']))->map(fn($w) => substr($w,0,1))->implode(''));
            $data['code'] = $prefix . '-' . strtoupper(str_pad(dechex(random_int(0, 0xFFFF)), 4, '0', STR_PAD_LEFT));
        }

        $commanderId = array_key_exists('commander_id', $data) ? ($data['commander_id'] ?: null) : null;
        $hasCommanderKey = array_key_exists('commander_id', $data);
        $siteIds = $data['site_ids'] ?? null;
        $hasSiteIdsKey = array_key_exists('site_ids', $data);
        unset($data['commander_id'], $data['site_ids']);

        DB::transaction(function () use ($zone, $data, $hasCommanderKey, $commanderId, $hasSiteIdsKey, $siteIds) {
            $zone->update($data);

            if ($hasCommanderKey) {
                $this->syncZoneCommander($zone, $commanderId);
            }

            $affectedZoneIds = [$zone->id];
            if ($hasSiteIdsKey && is_array($siteIds)) {
                $affectedZoneIds = array_merge($affectedZoneIds, $this->syncZoneSites($zone, $siteIds));
            }

            $this->recalcRequiredGuardsForZones(array_unique(array_filter($affectedZoneIds)));
        });

        return redirect()->route('control-room.zones.index')->withSuccess('Zone updated successfully');
    }

    protected function syncZoneCommander(Zone $zone, ?int $commanderId): void
    {
        $query = User::role('zone_commander')->where('zone_id', $zone->id);

        if ($commanderId) {
            $query->where('id', '!=', $commanderId)->update(['zone_id' => null]);
            User::whereKey($commanderId)->update(['zone_id' => $zone->id]);
            return;
        }

        $query->update(['zone_id' => null]);
    }

    protected function syncZoneSites(Zone $zone, array $siteIds): array
    {
        $siteIds = array_values(array_unique(array_filter(array_map('intval', $siteIds))));

        $currentSiteIds = ClientSite::query()
            ->where('zone_id', $zone->id)
            ->pluck('id')
            ->all();

        $toDetach = array_values(array_diff($currentSiteIds, $siteIds));
        $toAttach = array_values(array_diff($siteIds, $currentSiteIds));

        $affectedZoneIds = [$zone->id];

        if (!empty($toAttach)) {
            $movedFromZoneIds = ClientSite::query()
                ->whereIn('id', $toAttach)
                ->pluck('zone_id')
                ->filter()
                ->unique()
                ->all();

            $affectedZoneIds = array_merge($affectedZoneIds, $movedFromZoneIds);
        }

        if (!empty($toDetach)) {
            ClientSite::query()->whereIn('id', $toDetach)->update(['zone_id' => null]);
        }

        if (!empty($toAttach)) {
            ClientSite::query()->whereIn('id', $toAttach)->update(['zone_id' => $zone->id]);
        }

        return array_unique($affectedZoneIds);
    }

    protected function recalcRequiredGuardsForZones(array $zoneIds): void
    {
        if (empty($zoneIds)) {
            return;
        }

        foreach ($zoneIds as $zoneId) {
            ClientSite::recalcZoneRequiredGuards($zoneId);
        }
    }

    public function destroy(Zone $zone)
    {
        $zone->delete();
        return redirect()->route('control-room.zones.index')
            ->withSuccess('Zone deleted successfully');
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
            return back()->withError('Selected site does not belong to this zone.');
        }

        $startDate = $data['start_date'] ?? now()->toDateString();

        // If already actively assigned to the same site, do nothing
        $alreadyAssigned = \App\Models\Guards\GuardAssignment::where('guard_id', $data['guard_id'])
            ->where('client_site_id', $data['client_site_id'])
            ->where('is_active', true)
            ->whereNull('end_date')
            ->exists();
        if ($alreadyAssigned) {
            return back()->withSuccess('Guard already assigned to this site.');
        }

        // End any other active assignments for this guard
        \App\Models\Guards\GuardAssignment::where('guard_id', $data['guard_id'])
            ->where('is_active', true)
            ->whereNull('end_date')
            ->update(['end_date' => $startDate, 'is_active' => false, 'active' => false]);

        \App\Models\Guards\GuardAssignment::create([
            'guard_id' => $data['guard_id'],
            'client_site_id' => $data['client_site_id'],
            'assigned_by' => $request->user()?->id,
            'start_date' => $startDate,
            'end_date' => null,
            'is_active' => true,
            'active' => true,
        ]);

        return back()->withSuccess('Guard assigned to site.');
    }

    public function unassign(Zone $zone, \App\Models\Guards\GuardAssignment $assignment)
    {
        // Only allow if assignment site is in this zone
        if ($assignment->clientSite?->zone_id !== $zone->id) {
            return back()->withError('Assignment not in this zone.');
        }

        $assignment->update([
            'is_active' => false,
            'end_date' => now()->startOfDay(),
            'active' => false,
        ]);

        return back()->withSuccess('Guard unassigned from site.');
    }

    public function endAssignment(Request $request, Zone $zone, \App\Models\Guards\GuardAssignment $assignment)
    {
        // Ensure the assignment belongs to this zone
        if ($assignment->clientSite?->zone_id !== $zone->id) {
            return back()->withError('Assignment not in this zone.');
        }

        $data = $request->validate([
            'end_date' => ['required','date'],
        ]);

        // Prevent ending before start date when known
        if ($assignment->start_date && \Carbon\Carbon::parse($data['end_date'])->lt($assignment->start_date)) {
            return back()->withError('End date cannot be before the start date.');
        }

        $assignment->update([
            'end_date' => $data['end_date'],
            'is_active' => false,
            'active' => false,
        ]);

        return back()->withSuccess('Assignment ended successfully.');
    }
}


