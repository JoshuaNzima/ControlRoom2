<?php

namespace App\Http\Controllers\ControlRoom;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Guards\Guard;
use App\Models\Guards\GuardAssignment;
use App\Models\Guards\GuardOffDay;
use App\Models\RelieverRotation;
use App\Models\Guards\ClientSite;
use App\Models\Zone;
use App\Models\User;
use App\Models\ReliefBundle;
use App\Models\ReliefBundleSite;
use App\Models\Guards\Shift as GuardShift;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class RosterController extends Controller
{
    public function index(Request $request)
    {
        $today = Carbon::today();

        $guards = Guard::active()
            ->orderBy('name')
            ->get(['id','name','employee_id'])
            ->map(fn($g) => [
                'id' => $g->id,
                'name' => $g->name,
                'employee_id' => $g->employee_id,
            ]);

        return Inertia::render('ControlRoom/Roster', [
            'guards' => $guards,
            'initial_month' => $today->format('Y-m-01'),
        ]);
    }

    public function weekly(Request $request)
    {
        $today = Carbon::today();
        $weekStart = Carbon::parse($request->query('start', $today->copy()->startOfWeek(Carbon::MONDAY)))->startOfWeek(Carbon::MONDAY);

        $zones = Zone::orderBy('name')->get(['id','name']);
        $supervisors = User::role(['supervisor','manager'])->where('status','active')->orderBy('name')->get(['id','name']);

        return Inertia::render('ControlRoom/RosterWeekly', [
            'initial_week_start' => $weekStart->toDateString(),
            'zones' => $zones,
            'supervisors' => $supervisors,
        ]);
    }

    public function weeklyData(Request $request)
    {
        $validated = $request->validate([
            'start' => ['required','date'],
            'supervisor_id' => ['nullable','integer','exists:users,id'],
            'zone_id' => ['nullable','integer','exists:zones,id'],
        ]);

        $weekStart = Carbon::parse($validated['start'])->startOfWeek(Carbon::MONDAY);
        $weekEnd = $weekStart->copy()->endOfWeek(Carbon::SUNDAY);

        $days = collect(range(0,6))->map(fn($i) => $weekStart->copy()->addDays($i)->toDateString());

        $guardsQuery = Guard::query()->where('status', 'active');
        if (!empty($validated['supervisor_id'])) {
            $guardsQuery->where('supervisor_id', $validated['supervisor_id']);
        }
        if (!empty($validated['zone_id'])) {
            $guardsQuery->where('zone_id', $validated['zone_id']);
        }

        $guards = $guardsQuery
            ->orderBy('name')
            ->get(['id','name','employee_id','guard_type','supervisor_id','zone_id']);

        $guardIds = $guards->pluck('id');

        // Prefetch assignments covering the week
        $assignments = GuardAssignment::with('clientSite:id,name')
            ->whereIn('guard_id', $guardIds)
            ->where('start_date', '<=', $weekEnd->toDateString())
            ->where(function($q) use ($weekStart) {
                $q->whereNull('end_date')->orWhere('end_date', '>=', $weekStart->toDateString());
            })
            ->where('is_active', true)
            ->get()
            ->groupBy('guard_id');

        // Off-days overlapping the week
        $offDays = GuardOffDay::whereIn('guard_id', $guardIds)
            ->whereDate('start_date', '<=', $weekEnd->toDateString())
            ->where(function($q) use ($weekStart) {
                $q->whereNull('end_date')->orWhereDate('end_date', '>=', $weekStart->toDateString());
            })
            ->get();

        $offMap = [];
        foreach ($offDays as $off) {
            $start = Carbon::parse($off->start_date)->toDateString();
            $end = $off->end_date ? Carbon::parse($off->end_date)->toDateString() : $start;
            foreach ($days as $d) {
                if ($d >= $start && $d <= $end) {
                    $offMap[$off->guard_id][$d] = true;
                }
            }
        }

        // Relievers for this scope
        $relievers = $guards->where('guard_type', 'reliever');
        $relieverIds = $relievers->pluck('id');

        $rotations = RelieverRotation::with('site:id,name')
            ->whereIn('guard_id', $relieverIds)
            ->whereBetween('date', [$weekStart->toDateString(), $weekEnd->toDateString()])
            ->get()
            ->groupBy('guard_id');

        // Sites (for selection lists)
        $sites = ClientSite::query()->orderBy('name')->get(['id','name']);

        // Build per-day site mapping per guard from assignments
        $guardDaySites = [];
        foreach ($guards as $g) {
            $gAssigns = $assignments->get($g->id) ?? collect();
            foreach ($days as $d) {
                $siteName = null; $siteId = null;
                foreach ($gAssigns as $a) {
                    $aStart = Carbon::parse($a->start_date)->toDateString();
                    $aEnd = $a->end_date ? Carbon::parse($a->end_date)->toDateString() : '9999-12-31';
                    if ($d >= $aStart && $d <= $aEnd) {
                        $siteName = $a->clientSite?->name;
                        $siteId = $a->client_site_id;
                        break;
                    }
                }
                $guardDaySites[$g->id][$d] = $siteName ? ['id'=>$siteId,'name'=>$siteName] : null;
            }
        }

        // Build reliever per-day site mapping from rotations
        $relieverDaySites = [];
        foreach ($relievers as $r) {
            $rRots = $rotations->get($r->id) ?? collect();
            $map = [];
            foreach ($rRots as $rot) {
                $map[$rot->date->toDateString()] = ['id'=>$rot->client_site_id, 'name'=>$rot->site?->name];
            }
            $relieverDaySites[$r->id] = $map;
        }

        // Active sites in this week scope (derived from guard assignments)
        $activeSiteMap = [];
        foreach ($guardDaySites as $gId => $perDay) {
            foreach ($perDay as $d => $site) {
                if ($site) { $activeSiteMap[$site['id']] = $site['name']; }
            }
        }

        return response()->json([
            'days' => $days,
            'guards' => $guards->map(fn($g) => [
                'id' => $g->id,
                'name' => $g->name,
                'employee_id' => $g->employee_id,
                'guard_type' => $g->guard_type,
                'sites' => $guardDaySites[$g->id] ?? [],
                'off' => $offMap[$g->id] ?? [],
            ]),
            'relievers' => $relievers->map(fn($r) => [
                'id' => $r->id,
                'name' => $r->name,
                'employee_id' => $r->employee_id,
                'sites' => $relieverDaySites[$r->id] ?? [],
            ]),
            'sites' => $sites,
            'active_sites' => collect($activeSiteMap)->map(fn($name,$id)=>['id'=>$id,'name'=>$name])->values(),
        ]);
    }

    public function assignRelief(Request $request)
    {
        $data = $request->validate([
            'guard_id' => ['required','exists:guards,id'],
            'client_site_id' => ['required','exists:client_sites,id'],
            'date' => ['required','date'],
            'notes' => ['nullable','string','max:255'],
        ]);

        // Ensure the guard is a reliever (if guard_type column exists)
        $guard = Guard::findOrFail($data['guard_id']);
        if (($guard->guard_type ?? null) !== 'reliever') {
            return back()->with('error', 'Selected guard is not a reliever.');
        }

        RelieverRotation::updateOrCreate(
            ['guard_id' => $data['guard_id'], 'date' => Carbon::parse($data['date'])->toDateString()],
            ['client_site_id' => $data['client_site_id'], 'assigned_by' => $request->user()?->id, 'notes' => $data['notes'] ?? null]
        );

        return back()->with('success', 'Reliever assignment saved.');
    }

    public function deleteRelief(Request $request)
    {
        $data = $request->validate([
            'rotation_id' => ['nullable','integer','exists:reliever_rotations,id'],
            'guard_id' => ['nullable','integer','exists:guards,id'],
            'date' => ['nullable','date'],
        ]);

        if (!empty($data['rotation_id'])) {
            RelieverRotation::where('id', $data['rotation_id'])->delete();
            return back()->with('success', 'Reliever assignment removed.');
        }

        if (!empty($data['guard_id']) && !empty($data['date'])) {
            RelieverRotation::where('guard_id', $data['guard_id'])
                ->whereDate('date', Carbon::parse($data['date'])->toDateString())
                ->delete();
            return back()->with('success', 'Reliever assignment removed.');
        }

        return back()->with('error', 'Invalid relief delete request.');
    }

    public function assignReliefBulk(Request $request)
    {
        $data = $request->validate([
            'guard_id' => ['required','exists:guards,id'],
            'day_site_map' => ['required','array'], // ['YYYY-MM-DD' => client_site_id]
        ]);

        $guard = Guard::findOrFail($data['guard_id']);
        if (($guard->guard_type ?? null) !== 'reliever') {
            return back()->with('error', 'Selected guard is not a reliever.');
        }

        foreach ($data['day_site_map'] as $date => $siteId) {
            if (!$siteId) { continue; }
            RelieverRotation::updateOrCreate(
                ['guard_id' => $guard->id, 'date' => Carbon::parse($date)->toDateString()],
                ['client_site_id' => (int)$siteId, 'assigned_by' => $request->user()?->id]
            );
        }

        return back()->with('success', 'Reliever assignments saved.');
    }

    public function offDaysBulk(Request $request)
    {
        $data = $request->validate([
            'guard_ids' => ['required','array'],
            'guard_ids.*' => ['integer','exists:guards,id'],
            'date' => ['required','date'],
            'reason' => ['nullable','string','max:255'],
        ]);

        $date = Carbon::parse($data['date'])->toDateString();

        foreach ($data['guard_ids'] as $gid) {
            // Skip if an off-day already covers this date
            $exists = GuardOffDay::where('guard_id', $gid)
                ->whereDate('start_date', '<=', $date)
                ->where(function($q) use ($date) {
                    $q->whereNull('end_date')->orWhereDate('end_date', '>=', $date);
                })->exists();
            if ($exists) { continue; }
            GuardOffDay::create([
                'guard_id' => $gid,
                'start_date' => $date,
                'end_date' => null,
                'reason' => $data['reason'] ?? null,
            ]);
        }

        return back()->with('success', 'Off days saved.');
    }

    public function generateShifts(Request $request)
    {
        $data = $request->validate([
            'start' => ['required','date'],
            'start_time' => ['required','date_format:H:i'],
            'end_time' => ['required','date_format:H:i'],
            'shift_type' => ['nullable','in:day,night'],
            'include_relievers' => ['nullable','boolean'],
            'include_standby' => ['nullable','boolean'],
            'zone_id' => ['nullable','integer','exists:zones,id'],
            'supervisor_id' => ['nullable','integer','exists:users,id'],
        ]);

        $weekStart = Carbon::parse($data['start'])->startOfWeek(Carbon::MONDAY);
        $weekEnd = $weekStart->copy()->endOfWeek(Carbon::SUNDAY);
        $days = collect(range(0,6))->map(fn($i) => $weekStart->copy()->addDays($i)->toDateString());

        $guardsQuery = Guard::query()->where('status', 'active');
        if (!empty($data['supervisor_id'])) {
            $guardsQuery->where('supervisor_id', $data['supervisor_id']);
        }
        if (!empty($data['zone_id'])) {
            $guardsQuery->where('zone_id', $data['zone_id']);
        }

        $guards = $guardsQuery->orderBy('name')->get(['id','name','employee_id','guard_type']);

        $includeRelievers = !empty($data['include_relievers']);
        $includeStandby = array_key_exists('include_standby', $data) ? (bool) $data['include_standby'] : true;

        $guardIds = $guards->pluck('id');

        $assignments = GuardAssignment::with('clientSite:id,name')
            ->whereIn('guard_id', $guardIds)
            ->where('start_date', '<=', $weekEnd->toDateString())
            ->where(function($q) use ($weekStart) {
                $q->whereNull('end_date')->orWhere('end_date', '>=', $weekStart->toDateString());
            })
            ->where('is_active', true)
            ->get()
            ->groupBy('guard_id');

        $offDays = GuardOffDay::whereIn('guard_id', $guardIds)
            ->whereDate('start_date', '<=', $weekEnd->toDateString())
            ->where(function($q) use ($weekStart) {
                $q->whereNull('end_date')->orWhereDate('end_date', '>=', $weekStart->toDateString());
            })
            ->get();

        $offMap = [];
        foreach ($offDays as $off) {
            $start = Carbon::parse($off->start_date)->toDateString();
            $end = $off->end_date ? Carbon::parse($off->end_date)->toDateString() : $start;
            foreach ($days as $d) {
                if ($d >= $start && $d <= $end) {
                    $offMap[$off->guard_id][$d] = true;
                }
            }
        }

        $created = 0; $skipped = 0;
        $offdaySkips = 0; $overlapSkips = 0; $noSiteSkips = 0; $duplicateSkips = 0;
        foreach ($guards as $g) {
            if (!$includeRelievers && ($g->guard_type === 'reliever')) {
                continue;
            }
            if (!$includeStandby && ($g->guard_type === 'standby')) {
                continue;
            }
            $gAssigns = $assignments->get($g->id) ?? collect();
            foreach ($days as $d) {
                if (!empty($offMap[$g->id][$d])) { $skipped++; $offdaySkips++; continue; }
                // Find site covering day
                $siteId = null;
                foreach ($gAssigns as $a) {
                    $aStart = Carbon::parse($a->start_date)->toDateString();
                    $aEnd = $a->end_date ? Carbon::parse($a->end_date)->toDateString() : '9999-12-31';
                    if ($d >= $aStart && $d <= $aEnd) { $siteId = $a->client_site_id; break; }
                }
                if (!$siteId) { $skipped++; $noSiteSkips++; continue; }

                $startDt = Carbon::parse($d.' '.$data['start_time'].':00');
                $endDt = Carbon::parse($d.' '.$data['end_time'].':00');
                if ($endDt->lessThanOrEqualTo($startDt)) {
                    // Overnight shift crosses into next day
                    $endDt->addDay();
                }

                $overlap = GuardShift::where('guard_id', $g->id)
                    ->whereDate('date', $d)
                    ->where(function($q) use ($startDt, $endDt) {
                        $q->where('start_time', '<', $endDt)
                          ->where('end_time', '>', $startDt);
                    })
                    ->exists();
                if ($overlap) { $skipped++; $overlapSkips++; continue; }

                $exists = GuardShift::where('guard_id', $g->id)
                    ->where('client_site_id', $siteId)
                    ->whereDate('date', $d)
                    ->whereTime('start_time', $startDt->format('H:i:s'))
                    ->exists();
                if ($exists) { $skipped++; $duplicateSkips++; continue; }

                GuardShift::create([
                    'guard_id' => $g->id,
                    'client_site_id' => $siteId,
                    'assigned_by' => $request->user()?->id,
                    'date' => $d,
                    'start_time' => $startDt,
                    'end_time' => $endDt,
                    'shift_type' => $data['shift_type'] ?? 'day',
                    'instructions' => null,
                    'status' => 'scheduled',
                ]);
                $created++;
            }
        }

        return back()->with('success', "Shifts generated: {$created}, skipped: {$skipped} (Off-days: {$offdaySkips}, Overlaps: {$overlapSkips}, No assignment: {$noSiteSkips}, Duplicates: {$duplicateSkips}).");
    }

    // Bundles API
    public function bundles(Request $request)
    {
        $validated = $request->validate([
            'zone_id' => ['nullable','integer','exists:zones,id'],
            'supervisor_id' => ['nullable','integer','exists:users,id'],
        ]);

        $q = ReliefBundle::with(['reliever:id,name,employee_id', 'sites.site:id,name'])
            ->orderBy('name');

        if (!empty($validated['zone_id'])) {
            $q->where('zone_id', $validated['zone_id']);
        }
        if (!empty($validated['supervisor_id'])) {
            $q->where('supervisor_id', $validated['supervisor_id']);
        }

        $bundles = $q->get()->map(function($b) {
            return [
                'id' => $b->id,
                'name' => $b->name,
                'reliever' => $b->reliever ? ['id'=>$b->reliever->id, 'name'=>$b->reliever->name, 'employee_id'=>$b->reliever->employee_id] : null,
                'sites' => $b->sites->map(fn($s) => ['id'=>$s->site?->id, 'name'=>$s->site?->name])->filter()->values(),
            ];
        });

        return response()->json(['bundles' => $bundles]);
    }

    public function storeBundle(Request $request)
    {
        $data = $request->validate([
            'name' => ['required','string','max:100'],
            'reliever_guard_id' => ['required','integer','exists:guards,id'],
            'zone_id' => ['nullable','integer','exists:zones,id'],
            'supervisor_id' => ['nullable','integer','exists:users,id'],
            'site_ids' => ['required','array','min:1','max:6'],
            'site_ids.*' => ['integer','exists:client_sites,id'],
        ]);

        $guard = Guard::findOrFail($data['reliever_guard_id']);
        if (($guard->guard_type ?? null) !== 'reliever') {
            return back()->with('error', 'Selected guard is not a reliever.');
        }

        $bundle = ReliefBundle::create([
            'name' => $data['name'],
            'reliever_guard_id' => $data['reliever_guard_id'],
            'zone_id' => $data['zone_id'] ?? null,
            'supervisor_id' => $data['supervisor_id'] ?? null,
            'created_by' => $request->user()?->id,
        ]);

        $pos = 1;
        foreach ($data['site_ids'] as $sid) {
            ReliefBundleSite::create([
                'relief_bundle_id' => $bundle->id,
                'client_site_id' => $sid,
                'position' => $pos++,
            ]);
        }

        return back()->with('success', 'Bundle created.');
    }

    public function updateBundle(Request $request, ReliefBundle $bundle)
    {
        $data = $request->validate([
            'name' => ['required','string','max:100'],
            'reliever_guard_id' => ['required','integer','exists:guards,id'],
            'zone_id' => ['nullable','integer','exists:zones,id'],
            'supervisor_id' => ['nullable','integer','exists:users,id'],
            'site_ids' => ['required','array','min:1','max:6'],
            'site_ids.*' => ['integer','exists:client_sites,id'],
        ]);

        $guard = Guard::findOrFail($data['reliever_guard_id']);
        if (($guard->guard_type ?? null) !== 'reliever') {
            return back()->with('error', 'Selected guard is not a reliever.');
        }

        $bundle->update([
            'name' => $data['name'],
            'reliever_guard_id' => $data['reliever_guard_id'],
            'zone_id' => $data['zone_id'] ?? null,
            'supervisor_id' => $data['supervisor_id'] ?? null,
        ]);

        // Sync sites
        ReliefBundleSite::where('relief_bundle_id', $bundle->id)->delete();
        $pos = 1;
        foreach ($data['site_ids'] as $sid) {
            ReliefBundleSite::create([
                'relief_bundle_id' => $bundle->id,
                'client_site_id' => $sid,
                'position' => $pos++,
            ]);
        }

        return back()->with('success', 'Bundle updated.');
    }

    public function destroyBundle(ReliefBundle $bundle)
    {
        $bundle->delete();
        return back()->with('success', 'Bundle deleted.');
    }

    public function applyBundleWeek(Request $request, ReliefBundle $bundle)
    {
        $data = $request->validate([
            'start' => ['required','date'],
        ]);

        $weekStart = Carbon::parse($data['start'])->startOfWeek(Carbon::MONDAY);
        $days = collect(range(0,6))->map(fn($i) => $weekStart->copy()->addDays($i)->toDateString());
        $siteIds = $bundle->sites()->orderBy('position')->pluck('client_site_id')->values();
        $count = $siteIds->count();
        if ($count === 0) {
            return back()->with('error', 'Bundle has no sites.');
        }

        foreach ($days as $idx => $d) {
            $siteId = $siteIds[$idx % $count];
            RelieverRotation::updateOrCreate(
                ['guard_id' => $bundle->reliever_guard_id, 'date' => $d],
                ['client_site_id' => $siteId, 'assigned_by' => $request->user()?->id]
            );
        }

        return back()->with('success', 'Bundle rotation applied for the week.');
    }
}
