<?php

namespace App\Http\Controllers\ControlRoom;

use App\Http\Controllers\Controller;
use App\Models\Guards\{CheckpointScan, Attendance};
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class LiveMonitoringController extends Controller
{
    /**
     * Get recent QR scans for live monitoring
     */
    public function getRecentScans(Request $request): JsonResponse
    {
        $scans = CheckpointScan::with(['checkpoint.clientSite.client', 'supervisor'])
            ->where('scanned_at', '>=', Carbon::now()->subHours(2))
            ->orderBy('scanned_at', 'desc')
            ->limit(20)
            ->get()
            ->map(function ($scan) {
                return [
                    'id' => $scan->id,
                    'supervisor_name' => $scan->supervisor?->name ?? 'Unknown',
                    'site_name' => $scan->checkpoint?->clientSite?->name ?? 'Unknown',
                    'client_name' => $scan->checkpoint?->clientSite?->client?->name ?? 'Unknown',
                    'scanned_at' => $scan->scanned_at ? $scan->scanned_at->toIso8601String() : $scan->updated_at?->toIso8601String(),
                    'location_verified' => $scan->location_verified,
                ];
            });

        return response()->json($scans);
    }

    /**
     * Get recent attendance updates for live monitoring
     */
    public function getRecentAttendance(Request $request): JsonResponse
    {
        $updates = Attendance::with(['guardRelation', 'clientSite.client', 'supervisor'])
            ->where('updated_at', '>=', Carbon::now()->subHours(2))
            ->orderBy('updated_at', 'desc')
            ->limit(20)
            ->get()
            ->map(function ($attendance) {
                $action = 'check_in';
                $timestamp = $attendance->check_in_time ? $attendance->check_in_time->toIso8601String() : $attendance->updated_at?->toIso8601String();

                // If there's a check out time and a check in baseline, prefer the later event
                if ($attendance->check_out_time && $attendance->check_in_time && $attendance->check_out_time->gt($attendance->check_in_time)) {
                    $action = 'check_out';
                    $timestamp = $attendance->check_out_time->toIso8601String();
                }

                return [
                    'id' => $attendance->id,
                    'guard_name' => $attendance->guardRelation?->name ?? 'Unknown',
                    'site_name' => $attendance->clientSite?->name ?? 'Unknown',
                    'client_name' => $attendance->clientSite?->client?->name ?? 'Unknown',
                    'action' => $action,
                    'timestamp' => $timestamp,
                    'status' => $attendance->status,
                ];
            });

        return response()->json($updates);
    }

    /**
     * Get live statistics summary
     */
    public function getLiveStats(Request $request): JsonResponse
    {
        $oneHourAgo = Carbon::now()->subHour();

        $stats = [
            'qr_scans_last_hour' => CheckpointScan::where('scanned_at', '>=', $oneHourAgo)->count(),
            'check_ins_last_hour' => Attendance::where('check_in_time', '>=', $oneHourAgo)->count(),
            'check_outs_last_hour' => Attendance::where('check_out_time', '>=', $oneHourAgo)->count(),
            'late_arrivals_last_hour' => Attendance::where('status', 'late')
                ->where('updated_at', '>=', $oneHourAgo)
                ->count(),
            'active_scans_now' => CheckpointScan::where('scanned_at', '>=', Carbon::now()->subHours(2))
                ->count(),
            'guards_on_duty' => Attendance::whereDate('date', Carbon::today())
                ->whereNotNull('check_in_time')
                ->whereNull('check_out_time')
                ->count(),
        ];

        return response()->json($stats);
    }

    /**
     * Get real-time guard locations (based on recent scans)
     */
    public function getGuardLocations(Request $request): JsonResponse
    {
        $locations = CheckpointScan::with(['checkpoint.clientSite.client', 'supervisor'])
            ->where('scanned_at', '>=', Carbon::now()->subHours(4))
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->orderBy('scanned_at', 'desc')
            ->limit(50)
            ->get()
            ->map(function ($scan) {
                return [
                    'id' => $scan->id,
                    'supervisor_name' => $scan->supervisor?->name ?? 'Unknown',
                    'site_name' => $scan->checkpoint?->clientSite?->name ?? 'Unknown',
                    'client_name' => $scan->checkpoint?->clientSite?->client?->name ?? 'Unknown',
                    'latitude' => $scan->latitude,
                    'longitude' => $scan->longitude,
                    'location_verified' => $scan->location_verified,
                    'scanned_at' => $scan->scanned_at ? $scan->scanned_at->toIso8601String() : $scan->updated_at?->toIso8601String(),
                ];
            });

        return response()->json($locations);
    }

    /**
     * Get attendance alerts (guards who haven't checked out, etc.)
     */
    public function getAttendanceAlerts(Request $request): JsonResponse
    {
        $alerts = collect();

        $overdueHours = (int) config('attendance.alerts.overdue_checkout_hours', 12);

        // Guards who checked in but haven't checked out after the configured number of hours
        $overdueCheckouts = Attendance::with(['guardRelation', 'clientSite.client'])
            ->whereDate('date', Carbon::today())
            ->whereNotNull('check_in_time')
            ->whereNull('check_out_time')
            ->where('check_in_time', '<', Carbon::now()->subHours($overdueHours))
            ->get()
            ->map(function ($attendance) {
                return [
                    'type' => 'overdue_checkout',
                    'guard_name' => $attendance->guardRelation?->name ?? 'Unknown',
                    'site_name' => $attendance->clientSite?->name ?? 'Unknown',
                    'client_name' => $attendance->clientSite?->client?->name ?? 'Unknown',
                    'check_in_time' => $attendance->check_in_time ? $attendance->check_in_time->toIso8601String() : null,
                    'hours_on_duty' => $attendance->check_in_time->diffInHours(Carbon::now()),
                ];
            });

        $alerts = $alerts->merge($overdueCheckouts);

        // Guards expected but no attendance record
        $expectedGuards = Attendance::with(['guardRelation', 'clientSite.client'])
            ->whereDate('date', Carbon::today())
            ->where('status', 'absent')
            ->get()
            ->map(function ($attendance) {
                return [
                    'type' => 'no_show',
                    'guard_name' => $attendance->guardRelation?->name ?? 'Unknown',
                    'site_name' => $attendance->clientSite?->name ?? 'Unknown',
                    'client_name' => $attendance->clientSite?->client?->name ?? 'Unknown',
                ];
            });

        $alerts = $alerts->merge($expectedGuards);

        return response()->json($alerts);
    }
}
