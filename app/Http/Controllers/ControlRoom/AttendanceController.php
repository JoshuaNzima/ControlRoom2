<?php

namespace App\Http\Controllers\ControlRoom;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Guards\Attendance;
use App\Models\Guards\Guard;
use Carbon\Carbon;

class AttendanceController extends Controller
{
    public function checkIn(Request $request)
    {
        $validated = $request->validate([
            'guard_id' => ['required','integer','exists:guards,id'],
            'client_site_id' => ['required','integer','exists:client_sites,id'],
            'notes' => ['nullable','string','max:500'],
            'time' => ['nullable','date_format:H:i'],
            'reason_code' => ['nullable','in:supervisor_unavailable,gps_issue,network_outage,device_failure,emergency,overtime,other'],
        ]);

        $user = Auth::user();

        $openAttendance = Attendance::where('guard_id', $validated['guard_id'])
            ->whereDate('date', Carbon::today())
            ->whereNull('check_out_time')
            ->first();

        if ($openAttendance) {
            return back()->withErrors(['guard_id' => 'Guard already has an active check-in']);
        }

        $hasClosedToday = Attendance::where('guard_id', $validated['guard_id'])
            ->whereDate('date', Carbon::today())
            ->whereNotNull('check_out_time')
            ->exists();

        if ($hasClosedToday && ($validated['reason_code'] ?? '') !== 'overtime') {
            return back()->withErrors(['reason_code' => 'Overtime tag is required for an additional check-in today.']);
        }

        $guard = Guard::with('assignments')->findOrFail($validated['guard_id']);
        $currentAssignment = $guard->currentAssignment();
        if ($currentAssignment && (int) $currentAssignment->client_site_id !== (int) $validated['client_site_id']) {
            return back()->withErrors(['client_site_id' => 'Selected site does not match guard\'s current assignment.']);
        }

        $timeInput = $request->input('time');
        $checkInTime = $timeInput
            ? Carbon::parse(Carbon::today()->format('Y-m-d') . ' ' . $timeInput)
            : now();

        $notes = $validated['notes'] ?? null;
        if (!empty($validated['reason_code'])) {
            $notes = '[reason: '.$validated['reason_code'].']'.($notes ? ' '.$notes : '');
        }

        $attendance = new Attendance([
            'guard_id' => $validated['guard_id'],
            'supervisor_id' => $user?->id,
            'client_site_id' => $validated['client_site_id'],
            'date' => Carbon::today(),
            'check_in_time' => $checkInTime,
            'check_in_notes' => $notes,
            'status' => $checkInTime->hour > 8 ? 'late' : 'present',
        ]);

        $attendance->save();

        try {
            event(new \App\Events\AttendanceUpdated($attendance->id, 'Manual check-in from control room', [
                'supervisor_id' => $user?->id,
                'guard_id' => $validated['guard_id'],
                'client_site_id' => $validated['client_site_id'],
                'time' => $attendance->check_in_time?->toIso8601String(),
                'status' => $attendance->status,
                'reason_code' => $validated['reason_code'] ?? null,
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

        if (!$attendance) {
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
}
