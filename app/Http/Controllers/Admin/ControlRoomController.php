<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Zone;
use App\Models\Guards\Guard;
use App\Models\Ticket;
use Inertia\Inertia;

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

        return Inertia::render('Admin/ControlRoom', [
            'stats' => [
                'zones' => $zoneStats,
                'activeIncidents' => $activeIncidents,
                'flaggedGuards' => $flaggedGuards,
                'overallCoverage' => $zones->avg('coverage_rate'),
            ],
        ]);
    }
}


