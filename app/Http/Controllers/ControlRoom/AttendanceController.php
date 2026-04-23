<?php

namespace App\Http\Controllers\ControlRoom;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Guards\Attendance;
use App\Models\Guards\Guard;
use App\Models\Guards\ClientSite;
use App\Models\Guards\Shift as GuardShift;
use App\Models\User;
use Carbon\Carbon;
use Inertia\Inertia;

class AttendanceController extends Controller
{
    public function markPresent(Request $request)
    {
        $validated = $request->validate([
            'guard_id' => ['required','integer','exists:guards,id'],
            'client_site_id' => ['nullable','integer','exists:client_sites,id'],
            'notes' => ['nullable','string','max:500'],
        ]);

        $guard = Guard::findOrFail($validated['guard_id']);
        if (in_array($guard->status, ['dismissed', 'absconded'], true)) {
            return back()->withErrors(['guard_id' => 'Cannot mark attendance for dismissed or absconded guards.']);
        }

        $date = Carbon::today();
        $notes = $validated['notes'] ?? null;

        $attendance = Attendance::where('guard_id', $validated['guard_id'])
            ->whereDate('date', $date)
            ->orderByDesc('id')
            ->first();

        $siteId = $validated['client_site_id'] ?? null;

        if ($attendance) {
            // If the guard was actually checked in via supervisor/biometrics flow, do not override.
            if ($attendance->check_in_time) {
                return back()->with('success', 'Guard already checked in.');
            }

            if ($attendance->status === 'present') {
                return back()->with('success', 'Guard already marked present.');
            }

            $attendance->status = 'present';
            $attendance->supervisor_id = Auth::id();
            if (!$attendance->client_site_id && $siteId) {
                $attendance->client_site_id = $siteId;
            }
            $attendance->check_in_notes = trim(($attendance->check_in_notes ?: '') . ' Marked present by control room.' . ($notes ? ' ' . $notes : ''));
            $attendance->source = 'control_room_mark_present';
            $attendance->save();
        } else {
            $guard = Guard::with('assignments')->findOrFail($validated['guard_id']);
            $currentAssignment = $guard->currentAssignment();
            $attendance = new Attendance([
                'guard_id' => $validated['guard_id'],
                'supervisor_id' => Auth::id(),
                'client_site_id' => $siteId ?: $currentAssignment?->client_site_id,
                'date' => $date,
                'check_in_time' => null,
                'check_out_time' => null,
                'hours_worked' => null,
                'overtime_hours' => 0,
                'status' => 'present',
                'check_in_notes' => trim('Marked present by control room.' . ($notes ? ' ' . $notes : '')),
                'check_out_notes' => null,
                'backdated' => false,
                'backdated_reason' => null,
                'source' => 'control_room_mark_present',
            ]);
            $attendance->save();
        }

        try {
            event(new \App\Events\AttendanceUpdated($attendance->id, 'Marked present by control room', [
                'supervisor_id' => Auth::id(),
                'guard_id' => $attendance->guard_id,
                'client_site_id' => $attendance->client_site_id,
                'date' => $attendance->date?->toDateString(),
                'status' => $attendance->status,
                'source' => $attendance->source,
            ]));
        } catch (\Throwable $e) {}

        return back()->with('success', 'Guard marked present.');
    }

    public function markCovered(Request $request)
    {
        $validated = $request->validate([
            'client_id' => ['nullable','integer','exists:clients,id'],
            'zone_id' => ['nullable','integer','exists:zones,id'],
            'notes' => ['nullable','string','max:500'],
        ]);

        $clientId = $validated['client_id'] ?? null;
        $zoneId = $validated['zone_id'] ?? null;
        $notes = $validated['notes'] ?? null;

        if (!$clientId && !$zoneId) {
            return back()->withErrors(['client_id' => 'Select a client and/or zone to mark covered.']);
        }

        $siteIds = ClientSite::query()
            ->where('status', 'active')
            ->when($clientId, fn ($q) => $q->where('client_id', $clientId))
            ->when($zoneId, fn ($q) => $q->where('zone_id', $zoneId))
            ->pluck('id');

        if ($siteIds->isEmpty()) {
            return back()->withErrors(['client_id' => 'No active sites found for the selected filters.']);
        }

        $date = Carbon::today();
        $dateString = $date->toDateString();
        $now = now();

        $createdCount = 0;
        $updatedCount = 0;
        $skippedCount = 0;

        GuardShift::query()
            ->whereDate('date', $dateString)
            ->whereIn('client_site_id', $siteIds)
            ->whereNotIn('status', ['cancelled', 'missed'])
            ->orderBy('id')
            ->chunkById(200, function ($shifts) use ($dateString, $now, $notes, &$createdCount, &$updatedCount, &$skippedCount) {
                $guardIds = $shifts->pluck('guard_id')->filter()->unique()->values();
                if ($guardIds->isEmpty()) {
                    return;
                }

                // Filter out dismissed/absconded guards
                $validGuardIds = Guard::whereIn('id', $guardIds)
                    ->whereNotIn('status', ['dismissed', 'absconded'])
                    ->pluck('id')
                    ->flip();

                $existing = Attendance::query()
                    ->whereIn('guard_id', $guardIds)
                    ->whereDate('date', $dateString)
                    ->get()
                    ->keyBy('guard_id');

                $processed = [];

                foreach ($shifts as $shift) {
                    $guardId = (int) ($shift->guard_id ?? 0);
                    if (!$guardId) {
                        continue;
                    }
                    // Skip dismissed/absconded guards
                    if (!$validGuardIds->has($guardId)) {
                        $skippedCount++;
                        $processed[$guardId] = true;
                        continue;
                    }
                    if (isset($processed[$guardId])) {
                        continue;
                    }

                    $rawStart = $shift->getRawOriginal('start_time') ?? $shift->start_time;
                    $rawEnd = $shift->getRawOriginal('end_time') ?? $shift->end_time;
                    if (!$rawStart || !$rawEnd) {
                        $skippedCount++;
                        $processed[$guardId] = true;
                        continue;
                    }

                    try {
                        $startAt = Carbon::parse($dateString . ' ' . $rawStart);
                        $endAt = Carbon::parse($dateString . ' ' . $rawEnd);
                        if ($endAt->lessThanOrEqualTo($startAt)) {
                            $endAt = $endAt->addDay();
                        }
                    } catch (\Throwable $e) {
                        $skippedCount++;
                        $processed[$guardId] = true;
                        continue;
                    }

                    // Only mark covered for guards currently on shift
                    if ($now->lessThan($startAt) || $now->greaterThan($endAt)) {
                        $processed[$guardId] = true;
                        continue;
                    }

                    $attendance = $existing->get($guardId);

                    if ($attendance) {
                        // Do not override a true check-in/out record.
                        if ($attendance->check_in_time) {
                            $skippedCount++;
                            $processed[$guardId] = true;
                            continue;
                        }

                        if ($attendance->status === 'present') {
                            $processed[$guardId] = true;
                            continue;
                        }

                        $attendance->status = 'present';
                        if (!$attendance->client_site_id) {
                            $attendance->client_site_id = $shift->client_site_id;
                        }
                        $attendance->supervisor_id = Auth::id();
                        $attendance->check_in_notes = trim(($attendance->check_in_notes ?: '') . ' Marked covered by control room.' . ($notes ? ' ' . $notes : ''));
                        $attendance->source = 'control_room_mark_covered';
                        $attendance->save();
                        $updatedCount++;
                    } else {
                        $attendance = new Attendance([
                            'guard_id' => $guardId,
                            'supervisor_id' => Auth::id(),
                            'client_site_id' => $shift->client_site_id,
                            'date' => $dateString,
                            'check_in_time' => null,
                            'check_out_time' => null,
                            'hours_worked' => null,
                            'overtime_hours' => 0,
                            'status' => 'present',
                            'check_in_notes' => trim('Marked covered by control room.' . ($notes ? ' ' . $notes : '')),
                            'check_out_notes' => null,
                            'backdated' => false,
                            'backdated_reason' => null,
                            'source' => 'control_room_mark_covered',
                        ]);
                        $attendance->save();
                        $createdCount++;
                    }

                    try {
                        event(new \App\Events\AttendanceUpdated($attendance->id, 'Marked covered by control room', [
                            'supervisor_id' => Auth::id(),
                            'guard_id' => $attendance->guard_id,
                            'client_site_id' => $attendance->client_site_id,
                            'date' => $attendance->date?->toDateString(),
                            'status' => $attendance->status,
                            'source' => $attendance->source,
                        ]));
                    } catch (\Throwable $e) {}

                    $processed[$guardId] = true;
                }
            });

        $msg = "Marked covered: {$createdCount} created, {$updatedCount} updated";
        if ($skippedCount > 0) {
            $msg .= ", {$skippedCount} skipped";
        }
        $msg .= '.';

        return back()->with('success', $msg);
    }

	public function markAbsent(Request $request)
	{
		$validated = $request->validate([
			'guard_id' => ['required','integer','exists:guards,id'],
			'notes' => ['nullable','string','max:500'],
		]);

		$guard = Guard::findOrFail($validated['guard_id']);
		if (in_array($guard->status, ['dismissed', 'absconded'], true)) {
			return back()->withErrors(['guard_id' => 'Cannot mark attendance for dismissed or absconded guards.']);
		}

		$date = Carbon::today();
		$attendance = Attendance::where('guard_id', $validated['guard_id'])
			->whereDate('date', $date)
			->orderByDesc('id')
			->first();

		$notes = $validated['notes'] ?? null;

		if ($attendance) {
			if ($attendance->check_in_time) {
				return back()->withErrors(['guard_id' => 'Guard is already checked in; cannot mark absent.']);
			}

			$attendance->status = 'absent';
			$attendance->supervisor_id = Auth::id();
			$attendance->check_in_notes = trim(($attendance->check_in_notes ?: '') . ' Marked absent by control room.' . ($notes ? ' ' . $notes : ''));
			$attendance->source = 'control_room_mark_absent';
			$attendance->save();
		} else {
			$guard = Guard::with('assignments')->findOrFail($validated['guard_id']);
			$currentAssignment = $guard->currentAssignment();
			$attendance = new Attendance([
				'guard_id' => $validated['guard_id'],
				'supervisor_id' => Auth::id(),
				'client_site_id' => $currentAssignment?->client_site_id,
				'date' => $date,
				'check_in_time' => null,
				'check_out_time' => null,
				'hours_worked' => 0,
				'overtime_hours' => 0,
				'status' => 'absent',
				'check_in_notes' => trim('Marked absent by control room.' . ($notes ? ' ' . $notes : '')),
				'backdated' => false,
				'backdated_reason' => null,
				'source' => 'control_room_mark_absent',
			]);
			$attendance->save();
		}

		try {
			event(new \App\Events\AttendanceUpdated($attendance->id, 'Marked absent by control room', [
				'supervisor_id' => Auth::id(),
				'guard_id' => $attendance->guard_id,
				'client_site_id' => $attendance->client_site_id,
				'date' => $attendance->date?->toDateString(),
				'status' => $attendance->status,
				'source' => $attendance->source,
			]));
		} catch (\Throwable $e) {}

		return back()->with('success', 'Guard marked absent.');
	}

    /**
     * Check out a guard who is currently on duty.
     */
    public function checkOut(Request $request)
    {
        $validated = $request->validate([
            'guard_id' => ['required', 'integer', 'exists:guards,id'],
            'notes' => ['nullable', 'string', 'max:500'],
            'time' => ['nullable', 'date_format:H:i'],
            'reason_code' => ['nullable', 'string', 'max:100'],
        ]);

        $guard = Guard::findOrFail($validated['guard_id']);

        // Find today's attendance record with check-in but no check-out
        $attendance = Attendance::where('guard_id', $validated['guard_id'])
            ->whereDate('date', Carbon::today())
            ->whereNotNull('check_in_time')
            ->whereNull('check_out_time')
            ->first();

        if (!$attendance) {
            return back()->withErrors(['guard_id' => 'No active check-in found for this guard today.']);
        }

        // Determine check-out time
        $checkOutTime = $validated['time']
            ? Carbon::parse(Carbon::today()->format('Y-m-d') . ' ' . $validated['time'])
            : now();

        // Update attendance record
        $attendance->check_out_time = $checkOutTime;
        $attendance->check_out_notes = trim(($validated['notes'] ?? '') . ($validated['reason_code'] ? ' [Reason: ' . $validated['reason_code'] . ']' : ''));
        $attendance->source = $attendance->source ?: 'control_room_manual_checkout';

        // Calculate hours
        if (method_exists($attendance, 'calculateHours')) {
            $attendance->calculateHours();
        }

        $attendance->save();

        // Dispatch event for real-time updates
        try {
            event(new \App\Events\AttendanceUpdated($attendance->id, 'Checked out by control room', [
                'supervisor_id' => Auth::id(),
                'guard_id' => $attendance->guard_id,
                'client_site_id' => $attendance->client_site_id,
                'date' => $attendance->date?->toDateString(),
                'status' => $attendance->status,
                'source' => $attendance->source,
                'check_out_time' => $checkOutTime->toIsoString(),
            ]));
        } catch (\Throwable $e) {}

        return back()->with('success', 'Guard checked out successfully.');
    }

    /**
     * Display previous week's attendance records for Control Room editing.
     * Only shows records from the previous week (Mon-Sun).
     */
    public function index(Request $request)
    {
        $today = Carbon::today();
        $isTuesday = $today->isTuesday();

        // Calculate previous week range (Monday-Sunday)
        $lastWeekStart = $today->copy()->subWeek()->startOfWeek();
        $lastWeekEnd = $today->copy()->subWeek()->endOfWeek();

        $perPage = (int) $request->input('per_page', 20);
        $perPage = max(5, min($perPage, 100));

        $attendance = Attendance::with(['guardRelation', 'clientSite.client', 'supervisor'])
            ->whereBetween('date', [$lastWeekStart->toDateString(), $lastWeekEnd->toDateString()])
            ->when($request->input('search'), function ($q, $search) {
                $q->whereHas('guardRelation', function ($qq) use ($search) {
                    $qq->where('name', 'like', "%{$search}%")
                       ->orWhere('employee_id', 'like', "%{$search}%");
                });
            })
            ->when($request->input('status'), function ($q, $status) {
                $q->where('status', $status);
            })
            ->when($request->input('site_id'), function ($q, $siteId) {
                $q->where('client_site_id', (int) $siteId);
            })
            ->when($request->input('date'), function ($q, $date) {
                $q->whereDate('date', $date);
            })
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->paginate($perPage)
            ->withQueryString();

        $sites = ClientSite::with('client')
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name', 'client_id']);

        $user = Auth::user();
        $isSuperAdmin = $user && $user->hasRole('super_admin');

        return Inertia::render('ControlRoom/Attendance/Index', [
            'attendance' => $attendance,
            'filters' => $request->only(['search', 'status', 'site_id', 'date', 'per_page']),
            'sites' => $sites,
            'isTuesday' => $isTuesday,
            'isSuperAdmin' => $isSuperAdmin,
            'lastWeekRange' => [
                'start' => $lastWeekStart->toDateString(),
                'end' => $lastWeekEnd->toDateString(),
                'display' => $lastWeekStart->format('M d') . ' - ' . $lastWeekEnd->format('M d, Y'),
            ],
            'canEdit' => $isSuperAdmin || $isTuesday,
        ]);
    }

    /**
     * Show edit form for an attendance record.
     * Control Room can only edit on Tuesdays and only previous week's records.
     */
    public function edit(Attendance $attendance)
    {
        $user = Auth::user();
        $isSuperAdmin = $user && $user->hasRole('super_admin');

        if (!$isSuperAdmin) {
            $today = Carbon::today();

            // Must be Tuesday
            if (!$today->isTuesday()) {
                return redirect()->route('control-room.attendance.index')
                    ->withErrors(['edit_window' => 'Attendance records can only be edited on Tuesdays.']);
            }

            // Must be from previous week
            $recordDate = Carbon::parse($attendance->date);
            $lastWeekStart = $today->copy()->subWeek()->startOfWeek();
            $lastWeekEnd = $today->copy()->subWeek()->endOfWeek();

            if ($recordDate->lt($lastWeekStart) || $recordDate->gt($lastWeekEnd)) {
                return redirect()->route('control-room.attendance.index')
                    ->withErrors(['edit_window' => 'Control Room can only edit attendance records from the previous week.']);
            }
        }

        $attendance->load(['guardRelation', 'clientSite.client']);

        $sites = ClientSite::with('client')
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name', 'client_id']);

        $guards = Guard::where('status', 'active')
            ->whereNotIn('status', ['dismissed', 'absconded'])
            ->orderBy('name')
            ->get(['id', 'name', 'employee_id']);

        return Inertia::render('ControlRoom/Attendance/Edit', [
            'attendance' => $attendance,
            'sites' => $sites,
            'guards' => $guards,
            'isSuperAdmin' => $isSuperAdmin,
        ]);
    }

    /**
     * Update an attendance record.
     * Control Room can only update on Tuesdays and only previous week's records.
     */
    public function update(Request $request, Attendance $attendance)
    {
        $user = Auth::user();
        $isSuperAdmin = $user && $user->hasRole('super_admin');

        if (!$isSuperAdmin) {
            $today = Carbon::today();

            // Must be Tuesday
            if (!$today->isTuesday()) {
                return redirect()->route('control-room.attendance.index')
                    ->withErrors(['edit_window' => 'Attendance records can only be edited on Tuesdays.']);
            }

            // Must be from previous week
            $recordDate = Carbon::parse($attendance->date);
            $lastWeekStart = $today->copy()->subWeek()->startOfWeek();
            $lastWeekEnd = $today->copy()->subWeek()->endOfWeek();

            if ($recordDate->lt($lastWeekStart) || $recordDate->gt($lastWeekEnd)) {
                return redirect()->route('control-room.attendance.index')
                    ->withErrors(['edit_window' => 'Control Room can only edit attendance records from the previous week.']);
            }
        }

        $validated = $request->validate([
            'guard_id' => 'required|exists:guards,id',
            'client_site_id' => 'required|exists:client_sites,id',
            'date' => 'required|date',
            'check_in_time' => 'nullable|date_format:H:i',
            'check_out_time' => 'nullable|date_format:H:i|after_or_equal:check_in_time',
            'status' => 'required|in:present,absent,late,half_day,leave',
            'check_in_notes' => 'nullable|string|max:500',
            'check_out_notes' => 'nullable|string|max:500',
            'edit_reason' => $isSuperAdmin ? 'nullable|string|max:500' : 'required|string|max:500',
        ]);

        // Build edit notes with reason
        $editNote = '';
        if (!$isSuperAdmin) {
            $editNote = '[Control Room Edit - Tuesday Window] ' . ($validated['edit_reason'] ?? '');
        } else {
            $editNote = '[Super Admin Edit] ' . ($validated['edit_reason'] ?? '');
        }

        // Combine date and times
        $checkInDateTime = $validated['check_in_time']
            ? Carbon::parse($validated['date'] . ' ' . $validated['check_in_time'])
            : null;
        $checkOutDateTime = $validated['check_out_time']
            ? Carbon::parse($validated['date'] . ' ' . $validated['check_out_time'])
            : null;

        // Append edit note to existing notes
        $checkInNotes = $validated['check_in_notes'] ?? $attendance->check_in_notes ?? '';
        if ($editNote) {
            $checkInNotes = trim($checkInNotes . ' ' . $editNote);
        }

        $attendance->update([
            'guard_id' => $validated['guard_id'],
            'client_site_id' => $validated['client_site_id'],
            'date' => $validated['date'],
            'check_in_time' => $checkInDateTime,
            'check_out_time' => $checkOutDateTime,
            'status' => $validated['status'],
            'check_in_notes' => $checkInNotes,
            'check_out_notes' => $validated['check_out_notes'] ?? $attendance->check_out_notes,
            'source' => $attendance->source ?? 'manual_edit',
        ]);

        // Calculate hours if both times are present
        if ($checkInDateTime && $checkOutDateTime) {
            $attendance->calculateHours();
        }

        // Dispatch event for real-time notifications
        $guard = Guard::find($validated['guard_id']);
        $site = ClientSite::find($validated['client_site_id']);

        try {
            event(new \App\Events\AttendanceUpdated(
                $attendance->id,
                "Attendance record updated by " . ($isSuperAdmin ? 'Super Admin' : 'Control Room'),
                [
                    'id' => $attendance->id,
                    'guard_name' => $guard?->name ?? 'Unknown',
                    'site_name' => $site?->name ?? 'Unknown',
                    'client_name' => $site?->client?->name ?? 'Unknown',
                    'action' => 'manual_edit',
                    'timestamp' => now()->toISOString(),
                    'status' => $validated['status'],
                    'supervisor_id' => Auth::id(),
                    'edited_by_role' => $isSuperAdmin ? 'super_admin' : 'control_room',
                ]
            ));
        } catch (\Throwable $e) {}

        return redirect()->route('control-room.attendance.index')
            ->with('success', 'Attendance record updated successfully.');
    }
}
