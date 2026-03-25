<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Traits\ManagesQRCodes;
use App\Models\Guards\Guard;
use App\Models\Guards\ClientSite;
use App\Models\Guards\GuardAssignment;
use App\Models\Guards\Attendance;
use App\Models\Guards\DownReport;
use App\Models\Camera;
use App\Models\CameraAlert;
use App\Models\Zone;
use App\Models\Guards\Client;
use App\Models\Incident;
use App\Models\Down;
use App\Models\ScanTag;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class ControlRoomDashboardController extends Controller
{
    use ManagesQRCodes;

    public function index()
    {
        $stats = $this->getDashboardStats();

        $basePayload = [
            'stats' => $stats,
            'recentIncidents' => $this->getRecentIncidents(),
            'activeAlerts' => $this->getActiveAlerts(),
            'coverageData' => $this->getCoverageData(),
            'attendanceData' => $this->getAttendanceData(),
            'zones' => $this->getZonesData(),
            'recentScans' => $this->getRecentScans(),
        ];

        $user = auth()->user();

        if ($user && $user->hasRole('operations_officer')) {
            return Inertia::render('ControlRoom/OperationsDashboard', array_merge($basePayload, [
                'escalatedIncidents' => $this->getEscalatedIncidents(),
                'escalatedDowns' => $this->getEscalatedDowns(),
                'personnel' => $this->getPersonnelSummary(),
            ]));
        }

        return Inertia::render('ControlRoom/Dashboard', $basePayload);
    }

    private function getDashboardStats(): array
    {
        try {
            $today = Carbon::today();

            return [
                'overallCoverage' => $this->calculateOverallCoverage(),
                'activeGuards' => Guard::where('status', 'active')->count(),
                'totalSites' => ClientSite::where('status', 'active')->count(),
                'activeIncidents' => DownReport::where('created_at', '>=', $today)->count(),
                'flaggedGuards' => Guard::where('risk_level', 'high')->count(),
                'totalClients' => Client::where('status', 'active')->count(),
                'totalCameras' => Camera::where('status', 'active')->count(),
                'todayAttendance' => Attendance::whereDate('date', $today)->count(),
                'pendingIncidents' => DownReport::where('created_at', '>=', $today->copy()->subDays(3))->count(),
                'resolvedIncidents' => DownReport::where('created_at', '>=', $today->copy()->subDays(7))
                    ->where('created_at', '<', $today->copy()->subDays(3))->count(),
                'todayScans' => ScanTag::whereDate('created_at', $today)->count(),
            ];
        } catch (\Throwable $e) {
            Log::error('Control room dashboard stats failed: ' . $e->getMessage());
            return [
                'overallCoverage' => 0,
                'activeGuards' => 0,
                'totalSites' => 0,
                'activeIncidents' => 0,
                'flaggedGuards' => 0,
                'totalClients' => 0,
                'totalCameras' => 0,
                'todayAttendance' => 0,
                'pendingIncidents' => 0,
                'resolvedIncidents' => 0,
                'todayScans' => 0,
            ];
        }
    }

    private function calculateOverallCoverage(): float
    {
        try {
            $totalSites = ClientSite::where('status', 'active')->count();
            if ($totalSites === 0) return 0;

            $coveredSites = GuardAssignment::whereHas('clientSite', function ($query) {
                $query->where('status', 'active');
            })->where('is_active', true)->distinct()->count('client_site_id');

            return round(($coveredSites / $totalSites) * 100, 1);
        } catch (\Throwable $e) {
            Log::warning('Coverage calculation failed: ' . $e->getMessage());
            return 0;
        }
    }

    private function getRecentIncidents(): array
    {
        try {
            return DownReport::with(['supervisor', 'clientSite.client'])
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get()
                ->map(function ($incident) {
                    return [
                        'id' => $incident->id,
                        'title' => $incident->reason ?? 'Down Report',
                        'type' => 'down_report',
                        'status' => 'open',
                        'severity' => 'medium',
                        'guard_name' => $incident->supervisor?->name ?? 'Unknown',
                        'site_name' => $incident->clientSite?->name ?? 'Unknown',
                        'client_name' => $incident->clientSite?->client?->name ?? 'Unknown',
                        'created_at' => $incident->created_at?->format('Y-m-d H:i') ?? '',
                        'escalation_level' => 0,
                    ];
                })
                ->toArray();
        } catch (\Throwable $e) {
            Log::warning('Failed to load recent incidents: ' . $e->getMessage());
            return [];
        }
    }

    private function getActiveAlerts(): array
    {
        try {
            $overdueHours = (int) config('attendance.alerts.overdue_checkout_hours', 12);
            $now = Carbon::now();
            $today = Carbon::today();

            $overdueCount = Attendance::whereDate('date', $today)
                ->whereNotNull('check_in_time')
                ->whereNull('check_out_time')
                ->get(['id', 'date', 'check_in_time'])
                ->filter(function ($attendance) use ($now, $overdueHours) {
                    $dateString = $attendance->date?->toDateString() ?: (string) $attendance->getRawOriginal('date');
                    $rawCheckIn = $attendance->getRawOriginal('check_in_time') ?: null;
                    if (!$dateString || !$rawCheckIn) return false;
                    try {
                        $checkInAt = Carbon::parse($dateString . ' ' . $rawCheckIn);
                    } catch (\Throwable $e) {
                        return false;
                    }
                    return $now->greaterThanOrEqualTo($checkInAt->copy()->addHours($overdueHours));
                })
                ->count();

            return [
                'high_priority' => DownReport::where('created_at', '>=', $today)->count(),
                'medium_priority' => DownReport::where('created_at', '>=', $today->copy()->subDays(3))
                    ->where('created_at', '<', $today)->count(),
                'low_priority' => DownReport::where('created_at', '>=', $today->copy()->subDays(7))
                    ->where('created_at', '<', $today->copy()->subDays(3))->count(),
                'attendance_alerts' => $overdueCount,
                'camera_alerts' => CameraAlert::where('status', 'active')->count(),
            ];
        } catch (\Throwable $e) {
            Log::warning('Failed to load active alerts: ' . $e->getMessage());
            return [
                'high_priority' => 0,
                'medium_priority' => 0,
                'low_priority' => 0,
                'attendance_alerts' => 0,
                'camera_alerts' => 0,
            ];
        }
    }

    private function getCoverageData(): array
    {
        try {
            $last7Days = [];
            for ($i = 6; $i >= 0; $i--) {
                $date = Carbon::today()->subDays($i);
                $last7Days[] = [
                    'date' => $date->format('M d'),
                    'coverage' => $this->calculateCoverageForDate($date),
                ];
            }
            return $last7Days;
        } catch (\Throwable $e) {
            Log::warning('Failed to load coverage data: ' . $e->getMessage());
            return [];
        }
    }

    private function calculateCoverageForDate($date): float
    {
        $totalSites = ClientSite::where('status', 'active')->count();
        if ($totalSites === 0) return 0;

        $coveredSites = GuardAssignment::whereHas('clientSite', function ($query) {
            $query->where('status', 'active');
        })->where('is_active', true)
            ->whereDate('start_date', '<=', $date)
            ->where(function ($query) use ($date) {
                $query->whereNull('end_date')
                    ->orWhere('end_date', '>=', $date);
            })
            ->distinct()
            ->count('client_site_id');

        return round(($coveredSites / $totalSites) * 100, 1);
    }

    private function getAttendanceData(): array
    {
        try {
            $last7Days = [];
            for ($i = 6; $i >= 0; $i--) {
                $date = Carbon::today()->subDays($i);
                $last7Days[] = [
                    'date' => $date->format('M d'),
                    'attendance' => Attendance::whereDate('date', $date)->count(),
                ];
            }
            return $last7Days;
        } catch (\Throwable $e) {
            Log::warning('Failed to load attendance data: ' . $e->getMessage());
            return [];
        }
    }

    private function getZonesData(): array
    {
        try {
            return Zone::query()
                ->withCount(['sites'])
                ->get()
                ->map(function ($zone) {
                    $activeGuards = Guard::where('status', 'active')
                        ->whereHas('assignments', function ($query) use ($zone) {
                            $query->where('is_active', true)
                                ->where('start_date', '<=', today())
                                ->where(function ($q) {
                                    $q->whereNull('end_date')->orWhere('end_date', '>=', today());
                                })
                                ->whereHas('clientSite', function ($q) use ($zone) {
                                    $q->where('zone_id', $zone->id);
                                });
                        })
                        ->count();

                    $requiredGuards = $zone->required_guard_count ?? 0;
                    $coverage = $requiredGuards > 0 ? round(($activeGuards / $requiredGuards) * 100, 1) : 0;

                    return [
                        'id' => $zone->id,
                        'name' => $zone->name,
                        'coverage' => $coverage,
                        'guards' => $activeGuards,
                        'required_guards' => $requiredGuards,
                        'sites' => $zone->sites_count ?? 0,
                    ];
                })
                ->toArray();
        } catch (\Throwable $e) {
            Log::warning('Failed to load zones data: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Get recent scan tags for the dashboard feed
     */
    private function getRecentScans(): array
    {
        try {
            return ScanTag::with(['checkpointScan.supervisor'])
                ->orderBy('created_at', 'desc')
                ->limit(8)
                ->get()
                ->map(function ($tag) {
                    $tags = $tag->tags ?? [];
                    return [
                        'id' => $tag->id,
                        'supervisor_name' => $tags['supervisor_name']
                            ?? $tag->checkpointScan?->supervisor?->name
                            ?? 'Unknown',
                        'site_name' => $tags['site_name'] ?? 'Unknown',
                        'client_name' => $tags['client_name'] ?? '',
                        'scanned_at' => $tags['scanned_at'] ?? $tag->created_at?->toIso8601String(),
                        'location_quality' => $tags['location_quality'] ?? 'unknown',
                        'location_verified' => $tags['location_verified'] ?? false,
                    ];
                })
                ->toArray();
        } catch (\Throwable $e) {
            Log::warning('Failed to load recent scans: ' . $e->getMessage());
            return [];
        }
    }

    private function getEscalatedIncidents(): array
    {
        try {
            return Incident::with(['reporter', 'client', 'clientSite'])
                ->where('status', 'escalated')
                ->orderByDesc('updated_at')
                ->limit(10)
                ->get()
                ->map(function ($incident) {
                    return [
                        'id' => $incident->id,
                        'title' => $incident->title,
                        'severity' => $incident->severity,
                        'status' => $incident->status,
                        'escalation_level' => $incident->escalation_level,
                        'reported_by' => $incident->reporter?->name ?? 'Unknown',
                        'client_name' => $incident->client?->name ?? 'Unknown',
                        'site_name' => $incident->clientSite?->name ?? 'Unknown',
                        'updated_at' => optional($incident->updated_at ?? $incident->created_at)->format('Y-m-d H:i'),
                    ];
                })
                ->toArray();
        } catch (\Throwable $e) {
            Log::warning('Failed to load escalated incidents: ' . $e->getMessage());
            return [];
        }
    }

    private function getEscalatedDowns(): array
    {
        try {
            return Down::with(['reporter', 'client', 'clientSite'])
                ->where('status', 'escalated')
                ->orderByDesc('updated_at')
                ->limit(10)
                ->get()
                ->map(function ($down) {
                    return [
                        'id' => $down->id,
                        'title' => $down->title,
                        'type' => $down->type,
                        'status' => $down->status,
                        'escalation_level' => $down->escalation_level,
                        'reported_by' => $down->reporter?->name ?? 'Unknown',
                        'client_name' => $down->client?->name ?? 'Unknown',
                        'site_name' => $down->clientSite?->name ?? 'Unknown',
                        'updated_at' => optional($down->updated_at ?? $down->created_at)->format('Y-m-d H:i'),
                    ];
                })
                ->toArray();
        } catch (\Throwable $e) {
            Log::warning('Failed to load escalated downs: ' . $e->getMessage());
            return [];
        }
    }

    private function getPersonnelSummary(): array
    {
        try {
            $guardsTotal = Guard::count();
            $guardsActive = Guard::where('status', 'active')->count();
            $guardsOnDuty = Guard::onDuty()->count();

            $supervisorsTotal = User::role('supervisor')->count();
            $zoneCommandersTotal = User::role('zone_commander')->count();

            $zonesTotal = Zone::count();
            $zonesWithCommander = Zone::whereHas('commander')->count();

            return [
                'guards' => [
                    'total' => $guardsTotal,
                    'active' => $guardsActive,
                    'on_duty' => $guardsOnDuty,
                ],
                'supervisors' => [
                    'total' => $supervisorsTotal,
                ],
                'zone_commanders' => [
                    'total' => $zoneCommandersTotal,
                    'zones_with_commander' => $zonesWithCommander,
                    'zones_total' => $zonesTotal,
                ],
            ];
        } catch (\Throwable $e) {
            Log::warning('Failed to load personnel summary: ' . $e->getMessage());
            return [
                'guards' => ['total' => 0, 'active' => 0, 'on_duty' => 0],
                'supervisors' => ['total' => 0],
                'zone_commanders' => ['total' => 0, 'zones_with_commander' => 0, 'zones_total' => 0],
            ];
        }
    }
}
