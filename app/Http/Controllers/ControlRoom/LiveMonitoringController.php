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
        $hours = (int) config('scanner.recent_scans_hours', 24);
        $scans = CheckpointScan::with(['checkpoint.clientSite.client', 'supervisor'])
            ->where('scanned_at', '>=', Carbon::now()->subHours($hours))
            ->orderBy('scanned_at', 'desc')
            ->limit(20)
            ->get()
            ->map(function ($scan) {
                return [
                    'id' => $scan->id,
                    'supervisor_name' => $scan->supervisor?->name ?? 'Unknown',
                    'site_name' => $scan->checkpoint?->clientSite?->name ?? 'Unknown',
                    'checkpoint_name' => $scan->checkpoint?->name ?? 'Unknown',
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
                $timestamp = $attendance->updated_at?->toIso8601String();

                $dateString = $attendance->date?->toDateString() ?: (string) $attendance->getRawOriginal('date');
                $rawIn = $attendance->getRawOriginal('check_in_time') ?: null;
                $rawOut = $attendance->getRawOriginal('check_out_time') ?: null;

                try {
                    $checkInAt = ($dateString && $rawIn) ? Carbon::parse($dateString.' '.$rawIn) : null;
                    $checkOutAt = ($dateString && $rawOut) ? Carbon::parse($dateString.' '.$rawOut) : null;

                    if ($checkInAt) {
                        $timestamp = $checkInAt->toIso8601String();
                    }

                    if ($checkInAt && $checkOutAt) {
                        if ($checkOutAt->lessThanOrEqualTo($checkInAt)) {
                            $checkOutAt = $checkOutAt->addDay();
                        }

                        $action = 'check_out';
                        $timestamp = $checkOutAt->toIso8601String();
                    }
                } catch (\Throwable $e) {
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
        $hours = (int) config('scanner.recent_scans_hours', 24);

        $stats = [
            'qr_scans_last_hour' => CheckpointScan::where('scanned_at', '>=', $oneHourAgo)->count(),
            'check_ins_last_hour' => Attendance::whereNotNull('check_in_time')->where('updated_at', '>=', $oneHourAgo)->count(),
            'check_outs_last_hour' => Attendance::whereNotNull('check_out_time')->where('updated_at', '>=', $oneHourAgo)->count(),
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
        $hours = (int) config('scanner.recent_scans_hours', 24);
        $locations = CheckpointScan::with(['checkpoint.clientSite.client', 'supervisor'])
            ->where('scanned_at', '>=', Carbon::now()->subHours($hours))
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

        $now = Carbon::now();

        // Guards who checked in but haven't checked out after the configured number of hours
        $overdueCheckouts = Attendance::with(['guardRelation', 'clientSite.client'])
            ->whereDate('date', Carbon::today())
            ->whereNotNull('check_in_time')
            ->whereNull('check_out_time')
            ->get()
            ->map(function ($attendance) {
                $dateString = $attendance->date?->toDateString() ?: (string) $attendance->getRawOriginal('date');
                $rawIn = $attendance->getRawOriginal('check_in_time') ?: null;
                $checkInIso = null;
                $hoursOnDuty = null;

                if ($dateString && $rawIn) {
                    try {
                        $checkInAt = Carbon::parse($dateString.' '.$rawIn);
                        $checkInIso = $checkInAt->toIso8601String();
                        $hoursOnDuty = $checkInAt->diffInHours(Carbon::now());
                    } catch (\Throwable $e) {
                    }
                }

                return [
                    'type' => 'overdue_checkout',
                    'guard_name' => $attendance->guardRelation?->name ?? 'Unknown',
                    'site_name' => $attendance->clientSite?->name ?? 'Unknown',
                    'client_name' => $attendance->clientSite?->client?->name ?? 'Unknown',
                    'check_in_time' => $checkInIso,
                    'hours_on_duty' => $hoursOnDuty,
                ];
            });

        $overdueCheckouts = $overdueCheckouts->filter(function ($row) use ($now, $overdueHours) {
            $checkInIso = $row['check_in_time'] ?? null;
            if (!$checkInIso) {
                return false;
            }
            try {
                $checkInAt = Carbon::parse($checkInIso);
            } catch (\Throwable $e) {
                return false;
            }
            return $now->greaterThanOrEqualTo($checkInAt->copy()->addHours($overdueHours));
        })->values();

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
