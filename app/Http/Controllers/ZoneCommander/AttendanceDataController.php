<?php

namespace App\Http\Controllers\ZoneCommander;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Guards\Attendance;
use App\Models\Guards\GuardAssignment;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;

class AttendanceDataController extends Controller
{
    public function weeklyAttendance()
    {
        $user = Auth::user();
        if (!$user->zone_id) {
            return $this->errorResponse('No zone assigned.', 400);
        }

        $dates = [];
        $attendanceData = [];
        
        // Get the last 7 days including today
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i);
            $dates[] = $date->format('D');

            $totalGuards = GuardAssignment::query()
                ->whereHas('clientSite', function ($q) use ($user) {
                    $q->where('zone_id', $user->zone_id);
                })
                ->where('start_date', '<=', $date)
                ->where(function ($q) use ($date) {
                    $q->whereNull('end_date')->orWhere('end_date', '>=', $date);
                })
                ->where('is_active', true)
                ->whereHas('assignedGuard', fn($q) => $q->where('status', 'active'))
                ->distinct('guard_id')
                ->count('guard_id');

            if ($totalGuards === 0) {
                $attendanceData[] = 0;
                continue;
            }

            $presentGuards = Attendance::query()
                ->whereDate('date', $date)
                ->whereNotNull('check_in_time')
                ->whereHas('clientSite', function ($q) use ($user) {
                    $q->where('zone_id', $user->zone_id);
                })
                ->distinct('guard_id')
                ->count('guard_id');

            $attendanceRate = ($presentGuards / $totalGuards) * 100;
            $attendanceData[] = round($attendanceRate, 1);
        }

        return response()->json([
            'success' => true,
            'labels' => $dates,
            'data' => $attendanceData,
        ]);
    }

    public function riskDistribution()
    {
        $user = Auth::user();
        if (!$user->zone_id) {
            return $this->errorResponse('No zone assigned.', 400);
        }

        $guards = \App\Models\Guards\Guard::query()
            ->whereHas('assignments', function ($q) use ($user) {
                $q->whereHas('clientSite', fn($q2) => $q2->where('zone_id', $user->zone_id))
                    ->where('start_date', '<=', today())
                    ->where(function ($q3) {
                        $q3->whereNull('end_date')->orWhere('end_date', '>=', today());
                    })
                    ->where('is_active', true)
                    ;
            })
            ->where('status', 'active')
            ->get();

        $distribution = [
            'normal' => 0,
            'warning' => 0,
            'high' => 0,
        ];

        foreach ($guards as $guard) {
            $distribution[$guard->risk_level]++;
        }

        return response()->json([
            'success' => true,
            'labels' => ['Normal', 'Warning', 'High Risk'],
            'data' => array_values($distribution),
        ]);
    }
}