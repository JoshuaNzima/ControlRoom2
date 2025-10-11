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
use Carbon\Carbon;

class ControlRoomDashboardController extends Controller
{
    use ManagesQRCodes;

    public function index()
    {
        $stats = $this->getDashboardStats();
        
        return Inertia::render('ControlRoom/Dashboard', [
            'stats' => $stats,
            'recentIncidents' => $this->getRecentIncidents(),
            'activeAlerts' => $this->getActiveAlerts(),
            'coverageData' => $this->getCoverageData(),
            'attendanceData' => $this->getAttendanceData(),
            'zones' => $this->getZonesData(),
        ]);
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
        
        $coveredSites = GuardAssignment::whereHas('site', function($query) {
            $query->where('status', 'active');
        })->where('status', 'active')->distinct('client_site_id')->count();
        
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
        
        $coveredSites = GuardAssignment::whereHas('site', function($query) {
            $query->where('status', 'active');
        })->where('status', 'active')
        ->whereDate('start_date', '<=', $date)
        ->where(function($query) use ($date) {
            $query->whereNull('end_date')
                  ->orWhere('end_date', '>=', $date);
        })
        ->distinct('client_site_id')
        ->count();
        
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
        return Zone::withCount(['guards', 'sites'])
            ->get()
            ->map(function($zone) {
                $activeGuards = Guard::whereHas('assignments', function($query) {
                    $query->where('is_active', true)
                        ->where('start_date', '<=', today())
                        ->where(function($q) {
                            $q->whereNull('end_date')->orWhere('end_date', '>=', today());
                        });
                })->where('status', 'active')->count();
                    
                $requiredGuards = $zone->required_guard_count ?? 0;
                $coverage = $requiredGuards > 0 ? round(($activeGuards / $requiredGuards) * 100, 1) : 0;
                
                return [
                    'id' => $zone->id,
                    'name' => $zone->name,
                    'coverage' => $coverage,
                    'guards' => $activeGuards,
                    'required_guards' => $requiredGuards,
                    'sites' => $zone->sites_count,
                ];
            });
    }
}