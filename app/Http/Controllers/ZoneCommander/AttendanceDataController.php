<?php

namespace App\Http\Controllers\ZoneCommander;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Guards\Attendance;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;

class AttendanceDataController extends Controller
{
    public function weeklyAttendance()
    {
        $user = Auth::user();
        if (!$user->zone_id) {
            return response()->json([
                'error' => 'No zone assigned',
            ], 400);
        }

        $dates = [];
        $attendanceData = [];
        
        // Get the last 7 days including today
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i);
            $dates[] = $date->format('D'); // Short day name
            
            // Get total guards in the zone for that day
            $totalGuards = \App\Models\Guards\Guard::whereHas('assignments.clientSite', function($query) use ($user) {
                $query->where('zone_id', $user->zone_id);
            })
            ->whereDate('created_at', '<=', $date)
            ->count();

            if ($totalGuards === 0) {
                $attendanceData[] = 0;
                continue;
            }

            // Get attendance for that day
            $presentGuards = Attendance::whereDate('date', $date)
                ->whereHas('guardRelation.assignments.clientSite', function($query) use ($user) {
                    $query->where('zone_id', $user->zone_id);
                })
                ->count();

            // Calculate attendance rate
            $attendanceRate = ($presentGuards / $totalGuards) * 100;
            $attendanceData[] = round($attendanceRate, 1);
        }

        return response()->json([
            'labels' => $dates,
            'data' => $attendanceData,
        ]);
    }

    public function riskDistribution()
    {
        $user = Auth::user();
        if (!$user->zone_id) {
            return response()->json([
                'error' => 'No zone assigned',
            ], 400);
        }

        $guards = \App\Models\Guards\Guard::whereHas('assignments.clientSite', function($query) use ($user) {
            $query->where('zone_id', $user->zone_id);
        })->get();

        $distribution = [
            'normal' => 0,
            'warning' => 0,
            'high' => 0,
        ];

        foreach ($guards as $guard) {
            $distribution[$guard->risk_level]++;
        }

        return response()->json([
            'labels' => ['Normal', 'Warning', 'High Risk'],
            'data' => array_values($distribution),
        ]);
    }
}