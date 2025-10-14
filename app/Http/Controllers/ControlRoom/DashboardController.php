<?php

namespace App\Http\Controllers\ControlRoom;

use App\Http\Controllers\Controller;
use App\Models\Zone;
use App\Models\Guards\Guard;
use App\Models\Ticket;
use App\Models\Camera;
use App\Models\CameraAlert;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $zones = Zone::with(['sites', 'guards'])->get();
        $zoneStats = $zones->map(function ($zone) {
            return [
                'id' => $zone->id,
                'name' => $zone->name,
                'coverage' => (float) ($zone->coverage_rate ?? 0),
                'guards' => (int) ($zone->active_guard_count ?? 0),
                'required_guards' => (int) ($zone->required_guard_count ?? 0),
                'sites' => $zone->sites->count(),
            ];
        })->values();

        $activeIncidents = Ticket::whereIn('status', ['open','pending'])->count();
        $flaggedGuards = Guard::whereHas('flags', function($query) {
            $query->whereIn('status', ['pending_review','open']);
        })->count();

        // Additional top-level stats
        $totalSites = $zones->sum(fn($z) => $z->sites->count());
        $totalClients = method_exists(\App\Models\Client::class, 'count') ? \App\Models\Client::count() : 0;
        $totalCameras = Camera::count();
        $todayAttendance = method_exists(\App\Models\Guards\Attendance::class, 'count') ? \App\Models\Guards\Attendance::whereDate('date', now())->count() : 0;
        $pendingIncidents = Ticket::where('status', 'pending')->count();
        $resolvedIncidents = Ticket::whereDate('updated_at', now())->where('status', 'resolved')->count();

        // Alerts summary
        $activeAlerts = [
            'high_priority' => CameraAlert::where('priority', 'high')->whereNull('resolved_at')->count(),
            'medium_priority' => CameraAlert::where('priority', 'medium')->whereNull('resolved_at')->count(),
            'low_priority' => CameraAlert::where('priority', 'low')->whereNull('resolved_at')->count(),
            'attendance_alerts' => 0, // hook into attendance anomalies if available
            'camera_alerts' => CameraAlert::whereNull('resolved_at')->count(),
        ];

        // Coverage and attendance trend placeholders (7 days)
        $coverageData = collect(range(6,0))->map(function($i) use ($zones) {
            $date = now()->subDays($i);
            return [
                'date' => $date->format('M d'),
                'coverage' => (float) round($zones->avg('coverage_rate') ?? 0, 1),
            ];
        });

        $attendanceData = collect(range(6,0))->map(function($i) {
            $date = now()->subDays($i);
            $count = method_exists(\App\Models\Guards\Attendance::class, 'count') ? \App\Models\Guards\Attendance::whereDate('date', $date)->count() : 0;
            return [
                'date' => $date->format('M d'),
                'attendance' => (int) $count,
            ];
        });

        // Recent incidents
        $recentIncidents = Ticket::latest()->limit(10)->get()->map(function($t) {
            return [
                'id' => $t->id,
                'title' => $t->title ?? ('Ticket #' . $t->id),
                'type' => $t->type ?? 'incident',
                'status' => $t->status ?? 'open',
                'severity' => $t->priority ?? 'medium',
                'guard_name' => optional($t->guard)->name ?? 'Unknown',
                'site_name' => optional($t->site)->name ?? 'Unknown',
                'client_name' => optional(optional($t->site)->client)->name ?? 'Unknown',
                'created_at' => optional($t->created_at)->format('M d, H:i'),
                'escalation_level' => (int) ($t->escalation_level ?? 0),
            ];
        })->values();

        return Inertia::render('ControlRoom/Dashboard', [
            'stats' => [
                'overallCoverage' => (float) round($zones->avg('coverage_rate') ?? 0, 1),
                'activeGuards' => (int) Guard::where('status', 'active')->count(),
                'totalSites' => (int) $totalSites,
                'activeIncidents' => (int) $activeIncidents,
                'flaggedGuards' => (int) $flaggedGuards,
                'totalClients' => (int) $totalClients,
                'totalCameras' => (int) $totalCameras,
                'todayAttendance' => (int) $todayAttendance,
                'pendingIncidents' => (int) $pendingIncidents,
                'resolvedIncidents' => (int) $resolvedIncidents,
            ],
            'zones' => $zoneStats,
            'recentIncidents' => $recentIncidents,
            'activeAlerts' => $activeAlerts,
            'coverageData' => $coverageData,
            'attendanceData' => $attendanceData,
        ]);
    }
}
