<?php

namespace App\Http\Controllers\ControlRoom;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Guards\Attendance;
use App\Models\Guards\Guard;
use App\Models\Guards\ClientSite;
use App\Models\Guards\Shift as GuardShift;
use Carbon\Carbon;

class AttendanceController extends Controller
{
    public function markPresent(Request $request)
    {
        $validated = $request->validate([
            'guard_id' => ['required','integer','exists:guards,id'],
            'client_site_id' => ['nullable','integer','exists:client_sites,id'],
            'notes' => ['nullable','string','max:500'],
        ]);

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
}
