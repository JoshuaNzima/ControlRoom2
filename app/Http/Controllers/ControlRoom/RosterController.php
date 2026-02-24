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
use App\Models\Guards\Attendance;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

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

        $sites = ClientSite::query()
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id','name']);

        return Inertia::render('ControlRoom/Roster', [
            'guards' => $guards,
            'sites' => $sites,
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
            'shift_type' => ['nullable','in:day,night,morning,evening,custom'],
        ]);

        $weekStart = Carbon::parse($validated['start'])->startOfWeek(Carbon::MONDAY);
        $weekEnd = $weekStart->copy()->endOfWeek(Carbon::SUNDAY);

        $shiftType = $validated['shift_type'] ?? 'day';

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

        // Scheduled shifts for this week + selected roster type (used as manual roster overlays)
        $shiftRows = GuardShift::with('clientSite:id,name')
            ->whereIn('guard_id', $guardIds)
            ->whereBetween('date', [$weekStart->toDateString(), $weekEnd->toDateString()])
            ->where('shift_type', $shiftType)
            ->where('status', '!=', 'cancelled')
            ->orderByDesc('id')
            ->get();

        $shiftMap = [];
        foreach ($shiftRows as $s) {
            $d = $s->date ? Carbon::parse($s->date)->toDateString() : null;
            if (!$d) {
                continue;
            }
            if (!isset($shiftMap[$s->guard_id][$d])) {
                $shiftMap[$s->guard_id][$d] = [
                    'id' => $s->id,
                    'client_site_id' => $s->client_site_id,
                    'site' => $s->clientSite?->name,
                    'start_time' => $s->start_time ? Carbon::parse($s->start_time)->format('H:i') : null,
                    'end_time' => $s->end_time ? Carbon::parse($s->end_time)->format('H:i') : null,
                ];
            }
        }

        $today = Carbon::today()->toDateString();
        $attendanceRows = Attendance::query()
            ->whereIn('guard_id', $guardIds)
            ->whereDate('date', $today)
            ->orderByDesc('id')
            ->get(['id', 'guard_id', 'client_site_id', 'date', 'check_in_time', 'check_out_time', 'status']);

        $attendanceToday = [];
        foreach ($attendanceRows as $a) {
            if (isset($attendanceToday[$a->guard_id])) {
                continue;
            }
            $attendanceToday[$a->guard_id] = [
                'id' => $a->id,
                'client_site_id' => $a->client_site_id,
                'status' => $a->status,
                'checked_in' => !empty($a->check_in_time),
                'checked_out' => !empty($a->check_out_time),
            ];
        }

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
        $guardDayMeta = [];
        foreach ($guards as $g) {
            $gAssigns = $assignments->get($g->id) ?? collect();
            foreach ($days as $d) {
                // Prefer scheduled shift site (manual roster)
                if (!empty($shiftMap[$g->id][$d])) {
                    $row = $shiftMap[$g->id][$d];
                    $guardDaySites[$g->id][$d] = $row['client_site_id'] ? ['id' => $row['client_site_id'], 'name' => $row['site'] ?? 'Site'] : null;
                    $guardDayMeta[$g->id][$d] = [
                        'source' => 'shift',
                        'shift_id' => $row['id'],
                        'start_time' => $row['start_time'],
                        'end_time' => $row['end_time'],
                    ];
                    continue;
                }

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
                $guardDaySites[$g->id][$d] = $siteName ? ['id' => $siteId, 'name' => $siteName] : null;
                if ($siteName) {
                    $guardDayMeta[$g->id][$d] = ['source' => 'assignment'];
                }
            }
        }

        // Build reliever per-day site mapping from rotations
        $relieverDaySites = [];
        $relieverDayMeta = [];
        foreach ($relievers as $r) {
            $rRots = $rotations->get($r->id) ?? collect();
            $map = [];
            foreach ($rRots as $rot) {
                $map[$rot->date->toDateString()] = ['id'=>$rot->client_site_id, 'name'=>$rot->site?->name];
            }

            $merged = [];
            $meta = [];
            foreach ($days as $d) {
                if (!empty($shiftMap[$r->id][$d])) {
                    $row = $shiftMap[$r->id][$d];
                    $merged[$d] = $row['client_site_id'] ? ['id' => $row['client_site_id'], 'name' => $row['site'] ?? 'Site'] : null;
                    $meta[$d] = [
                        'source' => 'shift',
                        'shift_id' => $row['id'],
                        'start_time' => $row['start_time'],
                        'end_time' => $row['end_time'],
                    ];
                    continue;
                }
                if (!empty($map[$d])) {
                    $merged[$d] = $map[$d];
                    $meta[$d] = ['source' => 'rotation'];
                    continue;
                }
                $merged[$d] = null;
            }

            $relieverDaySites[$r->id] = $merged;
            $relieverDayMeta[$r->id] = $meta;
        }

        // Active sites in this week scope (derived from guard assignments)
        $activeSiteMap = [];
        foreach ($guardDaySites as $gId => $perDay) {
            foreach ($perDay as $d => $site) {
                if ($site) { $activeSiteMap[$site['id']] = $site['name']; }
            }
        }

        return response()->json([
            'shift_type' => $shiftType,
            'today' => $today,
            'days' => $days,
            'guards' => $guards->map(fn($g) => [
                'id' => $g->id,
                'name' => $g->name,
                'employee_id' => $g->employee_id,
                'guard_type' => $g->guard_type,
                'sites' => $guardDaySites[$g->id] ?? [],
                'off' => $offMap[$g->id] ?? [],
                'meta' => $guardDayMeta[$g->id] ?? [],
                'attendance_today' => $attendanceToday[$g->id] ?? null,
            ]),
            'relievers' => $relievers->map(fn($r) => [
                'id' => $r->id,
                'name' => $r->name,
                'employee_id' => $r->employee_id,
                'sites' => $relieverDaySites[$r->id] ?? [],
                'meta' => $relieverDayMeta[$r->id] ?? [],
                'attendance_today' => $attendanceToday[$r->id] ?? null,
            ]),
            'sites' => $sites,
            'active_sites' => collect($activeSiteMap)->map(fn($name,$id)=>['id'=>$id,'name'=>$name])->values(),
        ]);
    }

    public function upsertManualShift(Request $request)
    {
        $data = $request->validate([
            'shift_id' => ['nullable', 'integer', 'exists:shifts,id'],
            'guard_id' => ['required', 'integer', 'exists:guards,id'],
            'client_site_id' => ['required', 'integer', 'exists:client_sites,id'],
            'date' => ['required', 'date'],
            'shift_type' => ['required', 'in:day,night,morning,evening,custom'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $date = Carbon::parse($data['date'])->toDateString();
        $startDt = Carbon::parse($date . ' ' . $data['start_time'] . ':00');
        $endDt = Carbon::parse($date . ' ' . $data['end_time'] . ':00');
        if ($endDt->lessThanOrEqualTo($startDt)) {
            $endDt->addDay();
        }

        $shift = null;
        if (!empty($data['shift_id'])) {
            $shift = GuardShift::where('id', (int) $data['shift_id'])
                ->where('guard_id', (int) $data['guard_id'])
                ->firstOrFail();
        } else {
            $shift = GuardShift::where('guard_id', (int) $data['guard_id'])
                ->whereDate('date', $date)
                ->where('shift_type', $data['shift_type'])
                ->where('status', '!=', 'cancelled')
                ->orderByDesc('id')
                ->first();
        }

        $errors = [];
        $offDay = GuardOffDay::where('guard_id', (int) $data['guard_id'])
            ->whereDate('start_date', '<=', $date)
            ->where(function($q) use ($date) {
                $q->whereNull('end_date')->orWhereDate('end_date', '>=', $date);
            })
            ->exists();
        if ($offDay) {
            $errors['date'] = 'Guard has an off-day on the selected date.';
        }

        $overlap = GuardShift::where('guard_id', (int) $data['guard_id'])
            ->where('status', '!=', 'cancelled')
            ->when($shift, fn($q) => $q->where('id', '!=', $shift->id))
            ->where(function($q) use ($startDt, $endDt) {
                $q->where('start_time', '<', $endDt)
                    ->where('end_time', '>', $startDt);
            })
            ->exists();
        if ($overlap) {
            $errors['start_time'] = 'Overlapping shift exists for this guard at the selected time.';
        }

        if (!empty($errors)) {
            return back()->withErrors($errors)->withInput();
        }

        $payload = [
            'guard_id' => (int) $data['guard_id'],
            'client_site_id' => (int) $data['client_site_id'],
            'assigned_by' => $request->user()?->id,
            'date' => $date,
            'start_time' => $startDt,
            'end_time' => $endDt,
            'shift_type' => $data['shift_type'],
            'instructions' => null,
            'status' => 'scheduled',
            'notes' => $data['notes'] ?? null,
        ];

        if ($shift) {
            $shift->update($payload);
        } else {
            $shift = GuardShift::create($payload);
        }

        if ($request->wantsJson() && !$request->header('X-Inertia')) {
            return response()->json(['saved' => true, 'shift_id' => $shift->id]);
        }

        return back()->with('success', 'Roster shift saved.');
    }

    public function deleteManualShift(Request $request)
    {
        $data = $request->validate([
            'shift_id' => ['required', 'integer', 'exists:shifts,id'],
        ]);

        $shift = GuardShift::findOrFail((int) $data['shift_id']);
        $shift->delete();

        if ($request->wantsJson() && !$request->header('X-Inertia')) {
            return response()->json(['deleted' => true]);
        }

        return back()->with('success', 'Roster shift removed.');
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

    public function reuseWeeklyRelief(Request $request)
    {
        $validated = $request->validate([
            'start' => ['required', 'date'],
            'supervisor_id' => ['nullable', 'integer', 'exists:users,id'],
            'zone_id' => ['nullable', 'integer', 'exists:zones,id'],
            'force' => ['nullable', 'boolean'],
        ]);

        $weekStart = Carbon::parse($validated['start'])->startOfWeek(Carbon::MONDAY);
        $weekEnd = $weekStart->copy()->endOfWeek(Carbon::SUNDAY);

        $relieversQuery = Guard::query()
            ->where('status', 'active')
            ->where('guard_type', 'reliever');

        if (!empty($validated['supervisor_id'])) {
            $relieversQuery->where('supervisor_id', $validated['supervisor_id']);
        }
        if (!empty($validated['zone_id'])) {
            $relieversQuery->where('zone_id', $validated['zone_id']);
        }

        $relieverIds = $relieversQuery->pluck('id');
        if ($relieverIds->isEmpty()) {
            return response()->json([
                'reused' => false,
                'copied' => 0,
                'reason' => 'no_relievers_in_scope',
            ]);
        }

        $existingCount = RelieverRotation::whereIn('guard_id', $relieverIds)
            ->whereBetween('date', [$weekStart->toDateString(), $weekEnd->toDateString()])
            ->count();

        $force = !empty($validated['force']);

        if ($existingCount > 0 && !$force) {
            return response()->json([
                'reused' => false,
                'copied' => 0,
                'reason' => 'week_already_has_data',
            ]);
        }

        if ($existingCount > 0 && $force) {
            RelieverRotation::whereIn('guard_id', $relieverIds)
                ->whereBetween('date', [$weekStart->toDateString(), $weekEnd->toDateString()])
                ->delete();
        }

        $preferredSourceStart = $weekStart->copy()->subWeek()->startOfWeek(Carbon::MONDAY);
        $preferredSourceEnd = $preferredSourceStart->copy()->endOfWeek(Carbon::SUNDAY);

        $sourceHasAny = RelieverRotation::whereIn('guard_id', $relieverIds)
            ->whereBetween('date', [$preferredSourceStart->toDateString(), $preferredSourceEnd->toDateString()])
            ->exists();

        $sourceWeekStart = null;
        if ($sourceHasAny) {
            $sourceWeekStart = $preferredSourceStart;
        } else {
            $lastRotationDate = RelieverRotation::whereIn('guard_id', $relieverIds)
                ->whereDate('date', '<', $weekStart->toDateString())
                ->orderBy('date', 'desc')
                ->value('date');

            if (!$lastRotationDate) {
                return response()->json([
                    'reused' => false,
                    'copied' => 0,
                    'reason' => 'no_source_week_found',
                ]);
            }

            $sourceWeekStart = Carbon::parse($lastRotationDate)->startOfWeek(Carbon::MONDAY);
        }

        $sourceWeekEnd = $sourceWeekStart->copy()->endOfWeek(Carbon::SUNDAY);

        $sourceRotations = RelieverRotation::whereIn('guard_id', $relieverIds)
            ->whereBetween('date', [$sourceWeekStart->toDateString(), $sourceWeekEnd->toDateString()])
            ->get(['guard_id', 'client_site_id', 'date']);

        if ($sourceRotations->isEmpty()) {
            return response()->json([
                'reused' => false,
                'copied' => 0,
                'reason' => 'source_week_empty',
            ]);
        }

        $copied = 0;
        DB::transaction(function () use ($sourceRotations, $sourceWeekStart, $weekStart, $request, &$copied) {
            foreach ($sourceRotations as $rot) {
                $offset = $sourceWeekStart->copy()->startOfDay()->diffInDays(Carbon::parse($rot->date)->startOfDay(), false);
                if ($offset < 0 || $offset > 6) {
                    continue;
                }

                $targetDate = $weekStart->copy()->addDays($offset)->toDateString();

                RelieverRotation::updateOrCreate(
                    ['guard_id' => $rot->guard_id, 'date' => $targetDate],
                    ['client_site_id' => $rot->client_site_id, 'assigned_by' => $request->user()?->id]
                );
                $copied++;
            }
        });

        return response()->json([
            'reused' => $copied > 0,
            'copied' => $copied,
            'source_week_start' => $sourceWeekStart->toDateString(),
        ]);
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

    /**
     * Quick manual roster entry for work times and off-days
     */
    public function manualEntry(Request $request)
    {
        $data = $request->validate([
            'guard_id' => ['required', 'integer', 'exists:guards,id'],
            'date' => ['required', 'date'],
            'entry_type' => ['required', 'in:work,off'],
            // For work entries
            'client_site_id' => ['nullable', 'integer', 'exists:client_sites,id'],
            'start_time' => ['nullable', 'date_format:H:i'],
            'end_time' => ['nullable', 'date_format:H:i'],
            'shift_type' => ['nullable', 'in:day,night,morning,evening,custom'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $guard = Guard::findOrFail($data['guard_id']);
        $date = Carbon::parse($data['date'])->toDateString();

        // Check for dismissed/absconded guards
        if (in_array($guard->status, ['dismissed', 'absconded'], true)) {
            return back()->withErrors(['guard_id' => 'Cannot set roster for dismissed or absconded guards.']);
        }

        if ($data['entry_type'] === 'off') {
            // Create off-day
            $exists = GuardOffDay::where('guard_id', $guard->id)
                ->whereDate('start_date', '<=', $date)
                ->where(function($q) use ($date) {
                    $q->whereNull('end_date')->orWhereDate('end_date', '>=', $date);
                })
                ->exists();

            if ($exists) {
                return back()->withErrors(['date' => 'Guard already has an off-day on this date.']);
            }

            GuardOffDay::create([
                'guard_id' => $guard->id,
                'start_date' => $date,
                'end_date' => $date,
                'reason' => $data['notes'] ?? 'Manual roster entry',
            ]);

            // Cancel any existing shifts for this date
            GuardShift::where('guard_id', $guard->id)
                ->whereDate('date', $date)
                ->whereNotIn('status', ['cancelled', 'missed'])
                ->update(['status' => 'cancelled']);

            return back()->with('success', 'Off-day saved for ' . $guard->name . ' on ' . $date);
        }

        // Work entry validation
        if (empty($data['client_site_id'])) {
            return back()->withErrors(['client_site_id' => 'Site is required for work entry.']);
        }
        if (empty($data['start_time']) || empty($data['end_time'])) {
            return back()->withErrors(['start_time' => 'Start and end times are required for work entry.']);
        }

        // Check for off-day conflict
        $offDay = GuardOffDay::where('guard_id', $guard->id)
            ->whereDate('start_date', '<=', $date)
            ->where(function($q) use ($date) {
                $q->whereNull('end_date')->orWhereDate('end_date', '>=', $date);
            })
            ->exists();

        if ($offDay) {
            return back()->withErrors(['date' => 'Guard has an off-day on the selected date. Remove it first.']);
        }

        $startDt = Carbon::parse($date . ' ' . $data['start_time'] . ':00');
        $endDt = Carbon::parse($date . ' ' . $data['end_time'] . ':00');
        if ($endDt->lessThanOrEqualTo($startDt)) {
            $endDt->addDay();
        }

        // Check for overlapping shifts
        $overlap = GuardShift::where('guard_id', $guard->id)
            ->where('status', '!=', 'cancelled')
            ->where(function($q) use ($startDt, $endDt) {
                $q->where('start_time', '<', $endDt)
                    ->where('end_time', '>', $startDt);
            })
            ->exists();

        if ($overlap) {
            return back()->withErrors(['start_time' => 'Overlapping shift exists for this guard at the selected time.']);
        }

        // Create or update shift
        $shift = GuardShift::where('guard_id', $guard->id)
            ->whereDate('date', $date)
            ->whereNotIn('status', ['cancelled', 'missed'])
            ->first();

        $payload = [
            'guard_id' => $guard->id,
            'client_site_id' => (int) $data['client_site_id'],
            'assigned_by' => $request->user()?->id,
            'date' => $date,
            'start_time' => $startDt,
            'end_time' => $endDt,
            'shift_type' => $data['shift_type'] ?? 'custom',
            'instructions' => null,
            'status' => 'scheduled',
            'notes' => $data['notes'] ?? null,
        ];

        if ($shift) {
            $shift->update($payload);
        } else {
            $shift = GuardShift::create($payload);
        }

        return back()->with('success', 'Work time saved for ' . $guard->name . ' on ' . $date);
    }

    /**
     * Bulk manual roster entry
     */
    public function manualEntryBulk(Request $request)
    {
        $data = $request->validate([
            'guard_ids' => ['required', 'array', 'min:1'],
            'guard_ids.*' => ['integer', 'exists:guards,id'],
            'dates' => ['required', 'array', 'min:1'],
            'dates.*' => ['date'],
            'entry_type' => ['required', 'in:work,off'],
            // For work entries
            'client_site_id' => ['nullable', 'integer', 'exists:client_sites,id'],
            'start_time' => ['nullable', 'date_format:H:i'],
            'end_time' => ['nullable', 'date_format:H:i'],
            'shift_type' => ['nullable', 'in:day,night,morning,evening,custom'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $guardIds = $data['guard_ids'];
        $dates = collect($data['dates'])->map(fn($d) => Carbon::parse($d)->toDateString())->toArray();
        $entryType = $data['entry_type'];

        // Filter out dismissed/absconded guards
        $validGuards = Guard::whereIn('id', $guardIds)
            ->whereNotIn('status', ['dismissed', 'absconded'])
            ->get(['id', 'name']);

        $skipped = 0;
        $created = 0;

        foreach ($validGuards as $guard) {
            foreach ($dates as $date) {
                if ($entryType === 'off') {
                    // Check existing off-day
                    $exists = GuardOffDay::where('guard_id', $guard->id)
                        ->whereDate('start_date', '<=', $date)
                        ->where(function($q) use ($date) {
                            $q->whereNull('end_date')->orWhereDate('end_date', '>=', $date);
                        })
                        ->exists();

                    if (!$exists) {
                        GuardOffDay::create([
                            'guard_id' => $guard->id,
                            'start_date' => $date,
                            'end_date' => $date,
                            'reason' => $data['notes'] ?? 'Bulk roster entry',
                        ]);

                        // Cancel shifts
                        GuardShift::where('guard_id', $guard->id)
                            ->whereDate('date', $date)
                            ->whereNotIn('status', ['cancelled', 'missed'])
                            ->update(['status' => 'cancelled']);

                        $created++;
                    } else {
                        $skipped++;
                    }
                } else {
                    // Work entry - requires site and times
                    if (empty($data['client_site_id']) || empty($data['start_time']) || empty($data['end_time'])) {
                        $skipped++;
                        continue;
                    }

                    $startDt = Carbon::parse($date . ' ' . $data['start_time'] . ':00');
                    $endDt = Carbon::parse($date . ' ' . $data['end_time'] . ':00');
                    if ($endDt->lessThanOrEqualTo($startDt)) {
                        $endDt->addDay();
                    }

                    // Check off-day
                    $offDay = GuardOffDay::where('guard_id', $guard->id)
                        ->whereDate('start_date', '<=', $date)
                        ->where(function($q) use ($date) {
                            $q->whereNull('end_date')->orWhereDate('end_date', '>=', $date);
                        })
                        ->exists();

                    if ($offDay) {
                        $skipped++;
                        continue;
                    }

                    // Check overlap
                    $overlap = GuardShift::where('guard_id', $guard->id)
                        ->where('status', '!=', 'cancelled')
                        ->where(function($q) use ($startDt, $endDt) {
                            $q->where('start_time', '<', $endDt)
                                ->where('end_time', '>', $startDt);
                        })
                        ->exists();

                    if ($overlap) {
                        $skipped++;
                        continue;
                    }

                    GuardShift::create([
                        'guard_id' => $guard->id,
                        'client_site_id' => (int) $data['client_site_id'],
                        'assigned_by' => $request->user()?->id,
                        'date' => $date,
                        'start_time' => $startDt,
                        'end_time' => $endDt,
                        'shift_type' => $data['shift_type'] ?? 'custom',
                        'instructions' => null,
                        'status' => 'scheduled',
                        'notes' => $data['notes'] ?? null,
                    ]);

                    $created++;
                }
            }
        }

        $msg = "Roster entries created: {$created}";
        if ($skipped > 0) {
            $msg .= ", skipped: {$skipped}";
        }

        return back()->with('success', $msg);
    }
}
