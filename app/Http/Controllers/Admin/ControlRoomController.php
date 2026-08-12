<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Zone;
use App\Models\Guards\Guard;
use App\Models\Guards\CheckpointScan;
use App\Models\Ticket;
use Inertia\Inertia;
use Carbon\Carbon;

class ControlRoomController extends Controller
{
    public function dashboard()
    {
        $zones = Zone::with(['sites', 'guards'])->get();
        $zoneStats = $zones->map(function ($zone) {
            return [
                'id' => $zone->id,
                'name' => $zone->name,
                'coverage' => $zone->coverage_rate,
                'activeGuards' => $zone->active_guard_count,
                'requiredGuards' => $zone->required_guard_count,
                'sites' => $zone->sites->count(),
                'weeklyStats' => $zone->getZoneCoverageStats(7),
            ];
        });

        $activeIncidents = Ticket::where('status', 'open')
            ->where('priority', 'high')
            ->count();

        $flaggedGuards = Guard::whereHas('flags', function ($query) {
            $query->where('status', 'pending_review');
        })->count();

        // Recent checkpoint scans (last 24 hours)
        $recentScans = CheckpointScan::with(['checkpoint.clientSite.client', 'supervisor'])
            ->where('scanned_at', '>=', Carbon::now()->subHours(24))
            ->orderBy('scanned_at', 'desc')
            ->take(50)
            ->get()
            ->map(function ($scan) {
                return [
                    'id' => $scan->id,
                    'supervisor_name' => $scan->supervisor?->name ?? 'Unknown',
                    'site_name' => $scan->checkpoint?->clientSite?->name ?? 'Unknown Site',
                    'client_name' => $scan->checkpoint?->clientSite?->client?->name ?? 'Unknown Client',
                    'checkpoint_name' => $scan->checkpoint?->name ?? 'Unknown Checkpoint',
                    'scanned_at' => $scan->scanned_at?->toIso8601String(),
                    'location_verified' => $scan->location_verified,
                    'latitude' => $scan->latitude,
                    'longitude' => $scan->longitude,
                ];
            });

        $scansCount24h = CheckpointScan::where('scanned_at', '>=', Carbon::now()->subHours(24))->count();

        return Inertia::render('Admin/ControlRoom', [
            'stats' => [
                'zones' => $zoneStats,
                'activeIncidents' => $activeIncidents,
                'flaggedGuards' => $flaggedGuards,
                'overallCoverage' => $zones->avg('coverage_rate'),
            ],
            'recentScans' => $recentScans,
            'scansCount24h' => $scansCount24h,
        ]);
    }
}


