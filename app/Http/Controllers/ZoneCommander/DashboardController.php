<?php

namespace App\Http\Controllers\ZoneCommander;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Models\Zone;
use App\Models\Guards\Guard;
use App\Models\Guards\Attendance;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $zone = Zone::with(['sites.guards', 'sites.client'])->findOrFail($user->zone_id);

        // Calculate zone statistics
        $totalGuards = $zone->sites->sum(fn($site) => $site->guards->count());
        $totalPresent = Attendance::whereDate('date', today())
            ->whereHas('guard.site.zone', fn($q) => $q->where('id', $zone->id))
            ->count();

        $attendanceRate = $totalGuards > 0 
            ? round(($totalPresent / $totalGuards) * 100, 1)
            : 0;

        // Prepare site data
        $sites = $zone->sites->map(function($site) {
            return [
                'id' => $site->id,
                'name' => $site->name,
                'client_name' => $site->client->name,
                'guard_count' => $site->guards->count(),
                'attendance_today' => $site->guards()
                    ->whereHas('attendance', fn($q) => $q->whereDate('date', today()))
                    ->count(),
            ];
        });

        // Get at-risk guards
        $atRiskGuards = Guard::whereHas('site.zone', fn($q) => $q->where('id', $zone->id))
            ->where(function($query) {
                $query->where('risk_level', 'high')
                    ->orWhere('risk_level', 'warning');
            })
            ->with(['currentAssignment.site.client'])
            ->get()
            ->map(function($guard) {
                return [
                    'id' => $guard->id,
                    'name' => $guard->name,
                    'risk_level' => $guard->risk_level,
                    'infraction_count' => $guard->infraction_count,
                    'current_site' => $guard->currentAssignment ? [
                        'name' => $guard->currentAssignment->site->name,
                        'client_name' => $guard->currentAssignment->site->client->name,
                    ] : null,
                ];
            });

        // Get recent alerts (example - you might want to create an Alerts table)
        $recentAlerts = collect([
            // Sample alerts - replace with real data from your alerts system
            [
                'type' => 'Multiple Absences',
                'message' => 'Guard John Doe has missed 3 shifts this week',
                'severity' => 'high',
                'created_at' => now()->subHours(2),
            ],
            [
                'type' => 'Late Arrival Pattern',
                'message' => '5 guards reported late at Client Site A this week',
                'severity' => 'medium',
                'created_at' => now()->subHours(5),
            ],
        ]);

        return Inertia::render('ZoneCommander/Dashboard', [
            'zone' => [
                'id' => $zone->id,
                'name' => $zone->name,
                'code' => $zone->code,
                'total_sites' => $zone->sites->count(),
                'total_guards' => $totalGuards,
                'attendance_rate' => $attendanceRate,
            ],
            'sites' => $sites,
            'at_risk_guards' => $atRiskGuards,
            'recent_alerts' => $recentAlerts,
        ]);
    }
}