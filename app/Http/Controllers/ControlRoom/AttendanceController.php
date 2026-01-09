<?php

namespace App\Http\Controllers\ControlRoom;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Guards\Attendance;
use App\Models\Guards\Guard;
use App\Models\Guards\ClientSite;
use Carbon\Carbon;

class AttendanceController extends Controller
{
    public function checkIn(Request $request)
    {
        $validated = $request->validate([
            'guard_id' => ['required','integer','exists:guards,id'],
            'client_site_id' => ['nullable','integer','exists:client_sites,id'],
            'notes' => ['nullable','string','max:500'],
            'time' => ['nullable','date_format:H:i'],
            'reason_code' => ['nullable','in:supervisor_unavailable,gps_issue,network_outage,device_failure,emergency,overtime,other'],
            'backdate' => ['nullable','boolean'],
            'backdate_reason' => ['nullable','string','max:255'],
        ]);

        $user = Auth::user();

        $now = now();
        $date = Carbon::today();
        $backdateRequested = (bool) ($validated['backdate'] ?? false);

        if ($backdateRequested && config('attendance.backdate.enabled', true)) {
            $cutoff = config('attendance.backdate.cutoff', '06:00');
            $cutoffTime = Carbon::today()->setTimeFromTimeString($cutoff);

            // Only allow backdating until the configured cutoff time
            if ($now->greaterThan($cutoffTime)) {
                return back()->withErrors([
                    'backdate' => 'Backdating is only allowed until '.$cutoff.' for the previous day.',
                ]);
            }

            // We currently support a maximum of 1 day backdate
            $maxDays = (int) config('attendance.backdate.max_days', 1);
            if ($maxDays < 1) {
                return back()->withErrors([
                    'backdate' => 'Backdating is currently disabled.',
                ]);
            }

            $date = Carbon::yesterday();
        }

        $openAttendance = Attendance::where('guard_id', $validated['guard_id'])
            ->whereDate('date', $date)
            ->whereNull('check_out_time')
            ->orderByDesc('id')
            ->first();

        if ($openAttendance && $openAttendance->check_in_time) {
            return back()->withErrors(['guard_id' => 'Guard already has an active check-in']);
        }

        $hasClosedToday = Attendance::where('guard_id', $validated['guard_id'])
            ->whereDate('date', $date)
            ->whereNotNull('check_out_time')
            ->exists();

        if ($hasClosedToday && ($validated['reason_code'] ?? '') !== 'overtime') {
            return back()->withErrors(['reason_code' => 'Overtime tag is required for an additional check-in today.']);
        }

        $guard = Guard::with('assignments')->findOrFail($validated['guard_id']);
        $currentAssignment = $guard->currentAssignment();
        $siteId = $validated['client_site_id'] ?? null;
        $site = $siteId ? ClientSite::findOrFail($siteId) : null;
        if (!$site) {
            // General (no site) check-in is only allowed for unassigned guards
            if ($currentAssignment) {
                return back()->withErrors(['client_site_id' => 'Guard is currently assigned to a site; select the assigned site.']);
            }
        } else {
            if ($currentAssignment && (int) $currentAssignment->client_site_id !== (int) $site->id) {
                if ($site->site_type !== 'office') {
                    return back()->withErrors(['client_site_id' => 'Selected site does not match guard\'s current assignment.']);
                }
            }
        }

        $timeInput = $request->input('time');
        $checkInTime = $timeInput
            ? Carbon::parse($date->format('Y-m-d') . ' ' . $timeInput)
            : $now;

        $notes = $validated['notes'] ?? null;
        if (!empty($validated['reason_code'])) {
            $notes = '[reason: '.$validated['reason_code'].']'.($notes ? ' '.$notes : '');
        }

        $backdateReason = $validated['backdate_reason'] ?? null;

        if ($openAttendance && !$openAttendance->check_in_time) {
            $attendance = $openAttendance;

            if ($attendance->client_site_id && $site?->id && (int) $attendance->client_site_id !== (int) $site->id) {
                if ($site->site_type !== 'office') {
                    return back()->withErrors(['client_site_id' => 'Existing attendance is for a different site.']);
                }
            }

            $attendance->supervisor_id = $user?->id;
            $attendance->client_site_id = $site?->id;
            $attendance->check_in_time = $checkInTime;
            $attendance->check_in_notes = trim(($attendance->check_in_notes ?: '') . ($notes ? ' ' . $notes : ''));
            $attendance->status = $checkInTime->hour > 8 ? 'late' : 'present';
            $attendance->backdated = $backdateRequested;
            $attendance->backdated_reason = $backdateRequested ? $backdateReason : null;
            $attendance->source = $backdateRequested ? 'control_room_backdate' : ($site ? 'control_room_manual' : 'control_room_general');

            $attendance->save();
        } else {
            $attendance = new Attendance([
                'guard_id' => $validated['guard_id'],
                'supervisor_id' => $user?->id,
                'client_site_id' => $site?->id,
                'date' => $date,
                'check_in_time' => $checkInTime,
                'check_in_notes' => $notes,
                'status' => $checkInTime->hour > 8 ? 'late' : 'present',
                'backdated' => $backdateRequested,
                'backdated_reason' => $backdateRequested ? $backdateReason : null,
                'source' => $backdateRequested ? 'control_room_backdate' : ($site ? 'control_room_manual' : 'control_room_general'),
            ]);

            $attendance->save();
        }

        try {
            event(new \App\Events\AttendanceUpdated($attendance->id, 'Manual check-in from control room', [
                'supervisor_id' => $user?->id,
                'guard_id' => $validated['guard_id'],
                'client_site_id' => $validated['client_site_id'],
                'time' => $attendance->check_in_time?->toIso8601String(),
                'status' => $attendance->status,
                'reason_code' => $validated['reason_code'] ?? null,
                'backdated' => $attendance->backdated,
                'backdated_reason' => $attendance->backdated_reason,
            ]));
        } catch (\Throwable $e) {}

        return back()->with('success', 'Guard checked in successfully');
    }

    public function checkOut(Request $request)
    {
        $validated = $request->validate([
            'guard_id' => ['required','integer','exists:guards,id'],
            'notes' => ['nullable','string','max:500'],
            'time' => ['nullable','date_format:H:i'],
            'reason_code' => ['nullable','in:supervisor_unavailable,gps_issue,network_outage,device_failure,emergency,other'],
        ]);

        $attendance = Attendance::where('guard_id', $validated['guard_id'])
            ->whereDate('date', Carbon::today())
            ->whereNull('check_out_time')
            ->first();

        if (!$attendance || !$attendance->check_in_time) {
            return back()->withErrors(['guard_id' => 'No active check-in found for this guard']);
        }

        $timeInput = $request->input('time');
        $checkOutTime = $timeInput
            ? Carbon::parse(Carbon::today()->format('Y-m-d') . ' ' . $timeInput)
            : now();

        $notes = $validated['notes'] ?? null;
        if (!empty($validated['reason_code'])) {
            $notes = '[reason: '.$validated['reason_code'].']'.($notes ? ' '.$notes : '');
        }

        $attendance->check_out_time = $checkOutTime;
        $attendance->check_out_notes = $notes;

        if (method_exists($attendance, 'calculateHours')) {
            $attendance->calculateHours();
        }

        $attendance->save();

        try {
            event(new \App\Events\AttendanceUpdated($attendance->id, 'Manual check-out from control room', [
                'supervisor_id' => Auth::id(),
                'guard_id' => $validated['guard_id'],
                'client_site_id' => $attendance->client_site_id,
                'time' => $attendance->check_out_time?->toIso8601String(),
                'status' => 'checked_out',
                'reason_code' => $validated['reason_code'] ?? null,
            ]));
        } catch (\Throwable $e) {}

        return back()->with('success', 'Guard checked out successfully');
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
			->whereNull('check_out_time')
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
