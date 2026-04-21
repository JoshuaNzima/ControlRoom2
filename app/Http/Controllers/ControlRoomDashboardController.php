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

        // Operations Manager gets elevated dashboard with full QR analytics
        if ($user && $user->hasRole('operations_manager')) {
            return Inertia::render('ControlRoom/OperationsManagerDashboard', array_merge($basePayload, [
                'escalatedIncidents' => $this->getEscalatedIncidents(),
                'escalatedDowns' => $this->getEscalatedDowns(),
                'personnel' => $this->getPersonnelSummary(),
                'sites' => $this->getSitesData(),
                'deployments' => $this->getDeploymentsData(),
                'qrAnalytics' => $this->getQrAnalytics(),
                'stats' => array_merge($stats, [
                    'understaffedSites' => $this->getUnderstaffedSitesCount(),
                    'pendingReplacements' => $this->getPendingReplacementsCount(),
                ]),
            ]));
        }

        // Operations Officer gets field-focused dashboard with QR summary
        if ($user && $user->hasRole('operations_officer')) {
            return Inertia::render('ControlRoom/OperationsDashboard', array_merge($basePayload, [
                'escalatedIncidents' => $this->getEscalatedIncidents(),
                'escalatedDowns' => $this->getEscalatedDowns(),
                'personnel' => $this->getPersonnelSummary(),
                'sites' => $this->getSitesData(),
                'deployments' => $this->getDeploymentsData(),
                'qrScanSummary' => $this->getQrScanSummary(),
                'stats' => array_merge($stats, [
                    'understaffedSites' => $this->getUnderstaffedSitesCount(),
                    'pendingReplacements' => $this->getPendingReplacementsCount(),
                ]),
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
            $today = Carbon::today();

            $guardsTotal = Guard::count();
            $guardsActive = Guard::where('status', 'active')->count();
            $guardsOnDuty = Guard::onDuty()->count();
            $guardsUnassigned = Guard::where('status', 'active')
                ->whereDoesntHave('assignments', function ($q) use ($today) {
                    $q->where('is_active', true)
                        ->where('start_date', '<=', $today)
                        ->where(function ($q2) use ($today) {
                            $q2->whereNull('end_date')->orWhere('end_date', '>=', $today);
                        });
                })
                ->count();

            $supervisorsTotal = User::role('supervisor')->count();
            $supervisorsActiveToday = Attendance::whereDate('date', $today)
                ->whereHas('supervisor', function ($q) {
                    $q->role('supervisor');
                })
                ->distinct('supervisor_id')
                ->count('supervisor_id');

            $zoneCommandersTotal = User::role('zone_commander')->count();

            $zonesTotal = Zone::count();
            $zonesWithCommander = Zone::whereHas('commander')->count();

            return [
                'guards' => [
                    'total' => $guardsTotal,
                    'active' => $guardsActive,
                    'on_duty' => $guardsOnDuty,
                    'unassigned' => $guardsUnassigned,
                ],
                'supervisors' => [
                    'total' => $supervisorsTotal,
                    'active_today' => $supervisorsActiveToday,
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
                'guards' => ['total' => 0, 'active' => 0, 'on_duty' => 0, 'unassigned' => 0],
                'supervisors' => ['total' => 0, 'active_today' => 0],
                'zone_commanders' => ['total' => 0, 'zones_with_commander' => 0, 'zones_total' => 0],
            ];
        }
    }

    /**
     * Get detailed site data for field operations
     */
    private function getSitesData(): array
    {
        try {
            $today = Carbon::today();

            return ClientSite::with(['client', 'zone', 'guardAssignments'])
                ->where('status', 'active')
                ->get()
                ->map(function ($site) use ($today) {
                    $guardCount = $site->guardAssignments
                        ->where('is_active', true)
                        ->where('start_date', '<=', $today)
                        ->where(function ($assignment) use ($today) {
                            return $assignment->end_date === null || $assignment->end_date >= $today;
                        })
                        ->count();

                    $requiredGuards = $site->required_guard_count ?? 1;
                    $attendanceToday = Attendance::where('client_site_id', $site->id)
                        ->whereDate('date', $today)
                        ->count();

                    // Determine site status
                    $status = 'active';
                    if ($guardCount < $requiredGuards) {
                        $status = 'understaffed';
                    }

                    // Get last incident
                    $lastIncident = Down::where('client_site_id', $site->id)
                        ->orderByDesc('created_at')
                        ->first();

                    return [
                        'id' => $site->id,
                        'name' => $site->name,
                        'client_name' => $site->client?->name ?? 'Unknown',
                        'zone_name' => $site->zone?->name ?? 'No Zone',
                        'guard_count' => $guardCount,
                        'required_guards' => $requiredGuards,
                        'attendance_today' => $attendanceToday,
                        'status' => $status,
                        'last_incident' => $lastIncident?->created_at?->toIso8601String(),
                    ];
                })
                ->toArray();
        } catch (\Throwable $e) {
            Log::warning('Failed to load sites data: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Get deployment data by zone
     */
    private function getDeploymentsData(): array
    {
        try {
            $today = Carbon::today();

            return Zone::with(['sites', 'sites.guardAssignments'])
                ->get()
                ->map(function ($zone) use ($today) {
                    $totalSites = $zone->sites->count();
                    $coveredSites = $zone->sites->filter(function ($site) use ($today) {
                        return $site->guardAssignments
                            ->where('is_active', true)
                            ->where('start_date', '<=', $today)
                            ->where(function ($assignment) use ($today) {
                                return $assignment->end_date === null || $assignment->end_date >= $today;
                            })
                            ->isNotEmpty();
                    })->count();

                    $totalGuards = Guard::where('zone_id', $zone->id)->count();
                    $activeGuards = Guard::where('zone_id', $zone->id)
                        ->where('status', 'active')
                        ->count();

                    $coveragePercentage = $totalSites > 0 ? round(($coveredSites / $totalSites) * 100, 1) : 0;

                    return [
                        'zone_name' => $zone->name,
                        'total_sites' => $totalSites,
                        'covered_sites' => $coveredSites,
                        'total_guards' => $totalGuards,
                        'active_guards' => $activeGuards,
                        'coverage_percentage' => $coveragePercentage,
                    ];
                })
                ->toArray();
        } catch (\Throwable $e) {
            Log::warning('Failed to load deployments data: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Count understaffed sites
     */
    private function getUnderstaffedSitesCount(): int
    {
        try {
            $today = Carbon::today();

            return ClientSite::where('status', 'active')
                ->whereHas('guardAssignments', function ($query) use ($today) {
                    $query->where('is_active', true)
                        ->where('start_date', '<=', $today)
                        ->where(function ($q) use ($today) {
                            $q->whereNull('end_date')->orWhere('end_date', '>=', $today);
                        });
                }, '<', 1)
                ->orWhereDoesntHave('guardAssignments')
                ->count();
        } catch (\Throwable $e) {
            Log::warning('Failed to count understaffed sites: ' . $e->getMessage());
            return 0;
        }
    }

    /**
     * Count guards needing replacement (downs, absences, etc.)
     */
    private function getPendingReplacementsCount(): int
    {
        try {
            $today = Carbon::today();

            // Count active downs that need guard replacement
            return Down::whereIn('status', ['open', 'escalated'])
                ->whereDate('created_at', '>=', $today->copy()->subDays(7))
                ->count();
        } catch (\Throwable $e) {
            Log::warning('Failed to count pending replacements: ' . $e->getMessage());
            return 0;
        }
    }

    /**
     * Get QR scan summary for Operations Officer dashboard
     */
    private function getQrScanSummary(): array
    {
        try {
            $today = Carbon::today();

            // Get today's scans from checkpoint_scans via ScanTag
            $todayScans = ScanTag::with(['checkpointScan.supervisor'])
                ->whereDate('created_at', $today)
                ->orderByDesc('created_at')
                ->get();

            // Count successful vs failed based on location_verified
            $successful = $todayScans->filter(function ($scan) {
                return ($scan->tags['location_verified'] ?? false) || ($scan->checkpointScan?->location_verified ?? false);
            })->count();
            $failed = $todayScans->count() - $successful;

            // Group by site from tags
            $bySite = $todayScans
                ->groupBy(function ($scan) {
                    return $scan->tags['site_name'] ?? 'Unknown Site';
                })
                ->map(function ($scans, $siteName) {
                    return [
                        'site_name' => $siteName,
                        'scan_count' => $scans->count(),
                        'last_scan' => $scans->first()?->created_at?->toIso8601String(),
                    ];
                })
                ->sortByDesc('scan_count')
                ->values()
                ->toArray();

            // Group by hour
            $byHour = collect(range(0, 23))->map(function ($hour) use ($todayScans) {
                $count = $todayScans->filter(function ($scan) use ($hour) {
                    return $scan->created_at->hour === $hour;
                })->count();
                return [
                    'hour' => sprintf('%02d:00', $hour),
                    'count' => $count,
                ];
            })->toArray();

            // Recent scans
            $recentScans = $todayScans->take(20)->map(function ($scan) {
                $tags = $scan->tags ?? [];
                return [
                    'id' => $scan->id,
                    'guard_name' => $tags['guard_name'] 
                        ?? $tags['supervisor_name'] 
                        ?? $scan->checkpointScan?->supervisor?->name 
                        ?? 'Unknown',
                    'site_name' => $tags['site_name'] ?? 'Unknown',
                    'type' => $tags['scan_type'] ?? 'check_in',
                    'status' => ($tags['location_verified'] ?? false) || ($scan->checkpointScan?->location_verified ?? false) ? 'success' : 'failed',
                    'scanned_at' => $scan->created_at->toIso8601String(),
                ];
            })->toArray();

            return [
                'totalToday' => $todayScans->count(),
                'successful' => $successful,
                'failed' => $failed,
                'bySite' => $bySite,
                'byHour' => $byHour,
                'recentScans' => $recentScans,
            ];
        } catch (\Throwable $e) {
            Log::warning('Failed to load QR scan summary: ' . $e->getMessage());
            return [
                'totalToday' => 0,
                'successful' => 0,
                'failed' => 0,
                'bySite' => [],
                'byHour' => [],
                'recentScans' => [],
            ];
        }
    }

    /**
     * Get comprehensive QR analytics for Operations Manager dashboard
     */
    private function getQrAnalytics(): array
    {
        try {
            $today = Carbon::today();
            $weekStart = $today->copy()->subDays(6);

            // Today's scans
            $todayScans = ScanTag::with(['checkpointScan.supervisor'])
                ->whereDate('created_at', $today)
                ->get();

            // Determine success based on location_verified in tags or checkpointScan
            $todaySuccessful = $todayScans->filter(function ($scan) {
                return ($scan->tags['location_verified'] ?? false) || ($scan->checkpointScan?->location_verified ?? false);
            })->count();
            $todayFailed = $todayScans->count() - $todaySuccessful;

            // By type today - extract from tags
            $byType = $todayScans
                ->filter(function ($scan) {
                    return ($scan->tags['location_verified'] ?? false) || ($scan->checkpointScan?->location_verified ?? false);
                })
                ->groupBy(function ($scan) {
                    return $scan->tags['scan_type'] ?? 'check_in';
                })
                ->map(function ($scans, $type) {
                    return [
                        'type' => $type ?: 'check_in',
                        'count' => $scans->count(),
                    ];
                })
                ->values()
                ->toArray();

            // By site today
            $bySiteToday = $todayScans
                ->filter(function ($scan) {
                    return ($scan->tags['location_verified'] ?? false) || ($scan->checkpointScan?->location_verified ?? false);
                })
                ->groupBy(function ($scan) {
                    return $scan->tags['site_name'] ?? 'Unknown Site';
                })
                ->map(function ($scans, $siteName) {
                    return [
                        'site_name' => $siteName,
                        'count' => $scans->count(),
                        'last_scan' => $scans->first()?->created_at?->toIso8601String(),
                    ];
                })
                ->sortByDesc('count')
                ->values()
                ->toArray();

            // By hour today
            $byHourToday = collect(range(0, 23))->map(function ($hour) use ($todayScans) {
                $count = $todayScans->filter(function ($scan) use ($hour) {
                    return $scan->created_at->hour === $hour;
                })->count();
                return [
                    'hour' => sprintf('%02d:00', $hour),
                    'count' => $count,
                ];
            })->toArray();

            // Week data - successful scans only
            $weekScans = ScanTag::with(['checkpointScan.supervisor'])
                ->whereDate('created_at', '>=', $weekStart)
                ->get()
                ->filter(function ($scan) {
                    return ($scan->tags['location_verified'] ?? false) || ($scan->checkpointScan?->location_verified ?? false);
                });

            // Daily trend for week
            $dailyTrend = collect(range(0, 6))->map(function ($dayOffset) use ($today, $weekScans) {
                $date = $today->copy()->subDays($dayOffset);
                $count = $weekScans->filter(function ($scan) use ($date) {
                    return $scan->created_at->toDateString() === $date->toDateString();
                })->count();
                return [
                    'date' => $date->toDateString(),
                    'count' => $count,
                ];
            })->reverse()->values()->toArray();

            // Top guards for week - extract from tags
            $byGuardWeek = $weekScans
                ->groupBy(function ($scan) {
                    return $scan->tags['guard_name'] 
                        ?? $scan->tags['supervisor_name'] 
                        ?? $scan->checkpointScan?->supervisor?->name 
                        ?? 'Unknown';
                })
                ->map(function ($scans, $guardName) {
                    return [
                        'guard_name' => $guardName,
                        'scan_count' => $scans->count(),
                        'site_name' => $scans->first()?->tags['site_name'] ?? 'Unknown',
                    ];
                })
                ->sortByDesc('scan_count')
                ->take(10)
                ->values()
                ->toArray();

            // Issues - count failed scans (not location verified)
            $failedScans = $todayScans->filter(function ($scan) {
                return !($scan->tags['location_verified'] ?? false) && !($scan->checkpointScan?->location_verified ?? false);
            })->count();

            // GPS mismatches from tags
            $gpsMismatches = $todayScans->filter(function ($scan) {
                return ($scan->tags['location_quality'] ?? '') === 'poor' 
                    || ($scan->tags['gps_mismatch'] ?? false);
            })->count();

            // Duplicate scans (same guard name in tags, same site, within 5 minutes)
            $duplicateScans = $todayScans
                ->groupBy(function ($scan) {
                    $guardName = $scan->tags['guard_name'] ?? $scan->tags['supervisor_name'] ?? 'Unknown';
                    $siteName = $scan->tags['site_name'] ?? 'Unknown';
                    $hourMinute = $scan->created_at->format('Y-m-d H:i'); // Group by minute
                    return $guardName . '|' . $siteName . '|' . $hourMinute;
                })
                ->filter(function ($group) {
                    return $group->count() > 1;
                })
                ->count();

            // Suspicious activity (guards with unusual scan patterns)
            $suspiciousActivity = [];
            $guardScanCounts = $todayScans
                ->filter(function ($scan) {
                    return ($scan->tags['location_verified'] ?? false) || ($scan->checkpointScan?->location_verified ?? false);
                })
                ->groupBy(function ($scan) {
                    return $scan->tags['guard_name'] ?? $scan->tags['supervisor_name'] ?? 'Unknown';
                });

            foreach ($guardScanCounts as $guardName => $scans) {
                if ($scans->count() > 20) {
                    $suspiciousActivity[] = [
                        'guard_name' => $guardName,
                        'issue' => 'Excessive scan activity',
                        'count' => $scans->count(),
                        'site_name' => $scans->first()?->tags['site_name'] ?? 'Unknown',
                    ];
                }
            }

            return [
                'today' => [
                    'total' => $todayScans->count(),
                    'successful' => $todaySuccessful,
                    'failed' => $todayFailed,
                    'bySite' => $bySiteToday,
                    'byHour' => $byHourToday,
                    'byType' => $byType,
                ],
                'week' => [
                    'total' => $weekScans->count(),
                    'dailyTrend' => $dailyTrend,
                    'byGuard' => $byGuardWeek,
                ],
                'issues' => [
                    'failedScans' => $failedScans,
                    'gpsMismatches' => $gpsMismatches,
                    'duplicateScans' => $duplicateScans,
                    'suspiciousActivity' => $suspiciousActivity,
                ],
            ];
        } catch (\Throwable $e) {
            Log::warning('Failed to load QR analytics: ' . $e->getMessage());
            return [
                'today' => ['total' => 0, 'successful' => 0, 'failed' => 0, 'bySite' => [], 'byHour' => [], 'byType' => []],
                'week' => ['total' => 0, 'dailyTrend' => [], 'byGuard' => []],
                'issues' => ['failedScans' => 0, 'gpsMismatches' => 0, 'duplicateScans' => 0, 'suspiciousActivity' => []],
            ];
        }
    }
}
