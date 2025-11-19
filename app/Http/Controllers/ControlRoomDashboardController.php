<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Traits\ManagesQRCodes;
use App\Models\Guards\Guard;
use App\Models\Guards\ClientSite;
use App\Models\Guards\GuardAssignment;
use App\Models\Guards\Attendance;
use App\Models\Guards\DownReport;
use App\Models\Guards\GuardInfraction;
use App\Models\Communication\Conversation;
use App\Models\Camera;
use App\Models\CameraAlert;
use App\Models\Zone;
use App\Models\Guards\Client;
use App\Models\Incident;
use App\Models\Down;
use App\Models\User;
use Carbon\Carbon;

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

    private function getDashboardStats()
    {
        $today = Carbon::today();
        
        return [
            'overallCoverage' => $this->calculateOverallCoverage(),
            'activeGuards' => Guard::where('status', 'active')->count(),
            'totalSites' => ClientSite::where('status', 'active')->count(),
            'activeIncidents' => DownReport::where('created_at', '>=', Carbon::today())->count(),
            'flaggedGuards' => Guard::where('risk_level', 'high')->count(),
            'totalClients' => Client::where('status', 'active')->count(),
            'totalCameras' => Camera::where('status', 'active')->count(),
            'todayAttendance' => Attendance::whereDate('date', $today)->count(),
            'pendingIncidents' => DownReport::where('created_at', '>=', Carbon::today()->subDays(3))->count(),
            'resolvedIncidents' => DownReport::where('created_at', '>=', Carbon::today()->subDays(7))
                ->where('created_at', '<', Carbon::today()->subDays(3))->count(),
        ];
    }

    private function calculateOverallCoverage()
    {
        $totalSites = ClientSite::where('status', 'active')->count();
        if ($totalSites === 0) return 0;
        
        $coveredSites = GuardAssignment::whereHas('clientSite', function($query) {
            $query->where('status', 'active');
        })->where('is_active', true)->distinct()->count('client_site_id');
        
        return round(($coveredSites / $totalSites) * 100, 1);
    }

    private function getRecentIncidents()
    {
        return DownReport::with(['supervisor', 'clientSite.client'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function($incident) {
                return [
                    'id' => $incident->id,
                    'title' => $incident->reason ?? 'Down Report',
                    'type' => 'down_report',
                    'status' => 'open',
                    'severity' => 'medium',
                    'guard_name' => $incident->supervisor?->name ?? 'Unknown',
                    'site_name' => $incident->clientSite?->name ?? 'Unknown',
                    'client_name' => $incident->clientSite?->client?->name ?? 'Unknown',
                    'created_at' => $incident->created_at->format('Y-m-d H:i'),
                    'escalation_level' => 0,
                ];
            });
    }

    private function getActiveAlerts()
    {
        return [
            'high_priority' => DownReport::where('created_at', '>=', Carbon::today())
                ->count(),
            'medium_priority' => DownReport::where('created_at', '>=', Carbon::today()->subDays(3))
                ->where('created_at', '<', Carbon::today())
                ->count(),
            'low_priority' => DownReport::where('created_at', '>=', Carbon::today()->subDays(7))
                ->where('created_at', '<', Carbon::today()->subDays(3))
                ->count(),
            'attendance_alerts' => Attendance::whereDate('date', Carbon::today())
                ->whereNull('check_out_time')
                ->where('check_in_time', '<', Carbon::now()->subHours(12))
                ->count(),
            'camera_alerts' => CameraAlert::where('status', 'active')->count(),
        ];
    }

    private function getCoverageData()
    {
        $last7Days = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i);
            $coverage = $this->calculateCoverageForDate($date);
            $last7Days[] = [
                'date' => $date->format('M d'),
                'coverage' => $coverage,
            ];
        }
        
        return $last7Days;
    }

    private function calculateCoverageForDate($date)
    {
        $totalSites = ClientSite::where('status', 'active')->count();
        if ($totalSites === 0) return 0;
        
        $coveredSites = GuardAssignment::whereHas('clientSite', function($query) {
            $query->where('status', 'active');
        })->where('is_active', true)
        ->whereDate('start_date', '<=', $date)
        ->where(function($query) use ($date) {
            $query->whereNull('end_date')
                  ->orWhere('end_date', '>=', $date);
        })
        ->distinct()
        ->count('client_site_id');
        
        return round(($coveredSites / $totalSites) * 100, 1);
    }

    private function getAttendanceData()
    {
        $last7Days = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i);
            $attendance = Attendance::whereDate('date', $date)->count();
            $last7Days[] = [
                'date' => $date->format('M d'),
                'attendance' => $attendance,
            ];
        }
        
        return $last7Days;
    }

    private function getZonesData()
    {
        return Zone::query()
            ->get()
            ->map(function($zone) {
                $activeGuards = Guard::where('status', 'active')
                    ->whereHas('assignments.clientSite', function($q) use ($zone) {
                        $q->where('zone_id', $zone->id);
                    })
                    ->whereHas('assignments', function($query) {
                        $query->where('is_active', true)
                            ->where('start_date', '<=', today())
                            ->where(function($q) {
                                $q->whereNull('end_date')->orWhere('end_date', '>=', today());
                            });
                    })
                    ->count();

                $requiredGuards = $zone->required_guard_count ?? 0;
                $coverage = $requiredGuards > 0 ? round(($activeGuards / $requiredGuards) * 100, 1) : 0;

                $sitesCount = $zone->sites()->count();

                return [
                    'id' => $zone->id,
                    'name' => $zone->name,
                    'coverage' => $coverage,
                    'guards' => $activeGuards,
                    'required_guards' => $requiredGuards,
                    'sites' => $sitesCount,
                ];
            });
    }

    private function getEscalatedIncidents()
    {
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
            });
    }

    private function getEscalatedDowns()
    {
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
            });
    }

    private function getPersonnelSummary()
    {
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
    }
}