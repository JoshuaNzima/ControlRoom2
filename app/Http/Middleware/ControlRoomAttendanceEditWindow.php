<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Carbon\Carbon;

class ControlRoomAttendanceEditWindow
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        // Super admins can always edit
        if ($user && $user->hasRole('super_admin')) {
            return $next($request);
        }

        // Check if today is Tuesday
        $today = Carbon::today();
        $isTuesday = $today->isTuesday();

        if (!$isTuesday) {
            if ($request->wantsJson() || $request->ajax()) {
                return response()->json([
                    'message' => 'Attendance records can only be edited on Tuesdays. Please contact a Super Admin for emergency edits.'
                ], 403);
            }
            return redirect()->back()->withErrors(['edit_window' => 'Attendance records can only be edited on Tuesdays. Please contact a Super Admin for emergency edits.']);
        }

        // For edit/update actions, check if the record is from the previous week
        $attendance = $request->route('attendance');
        if ($attendance) {
            $recordDate = Carbon::parse($attendance->date);
            $lastWeekStart = $today->copy()->subWeek()->startOfWeek();
            $lastWeekEnd = $today->copy()->subWeek()->endOfWeek();

            // Only allow editing records from the previous week
            if ($recordDate->lt($lastWeekStart) || $recordDate->gt($lastWeekEnd)) {
                if ($request->wantsJson() || $request->ajax()) {
                    return response()->json([
                        'message' => 'Control Room can only edit attendance records from the previous week (Monday-Sunday). This record is outside that window.'
                    ], 403);
                }
                return redirect()->back()->withErrors(['edit_window' => 'Control Room can only edit attendance records from the previous week (Monday-Sunday).']);
            }
        }

        return $next($request);
    }
}
