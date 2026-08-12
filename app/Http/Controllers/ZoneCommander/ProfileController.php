<?php

namespace App\Http\Controllers\ZoneCommander;

use App\Http\Controllers\Controller;
use App\Models\Zone;
use App\Models\Down;
use App\Models\Supervisor;
use App\Models\Guard;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        // Get zones assigned to this zone commander
        $zones = Zone::where('commander_id', $user->id)
            ->with(['supervisors', 'guards'])
            ->get()
            ->map(function ($zone) {
                return [
                    'id' => $zone->id,
                    'name' => $zone->name,
                    'supervisor_count' => $zone->supervisors->count(),
                    'guard_count' => $zone->guards->count(),
                    'status' => $zone->status ?? 'active',
                ];
            });

        // Get recent down resolutions
        $recentResolutions = Down::whereIn('zone_id', $zones->pluck('id'))
            ->whereNotNull('resolved_at')
            ->orderByDesc('resolved_at')
            ->limit(10)
            ->with(['guard', 'site'])
            ->get()
            ->map(function ($down) {
                return [
                    'id' => $down->id,
                    'guard_name' => $down->guard?->name ?? 'Unknown',
                    'site_name' => $down->site?->name ?? 'Unknown',
                    'resolved_at' => $down->resolved_at->toISOString(),
                    'incentive_preserved' => $down->incentive_preserved ?? false,
                ];
            });

        // Get stats
        $stats = [
            'total_zones' => $zones->count(),
            'active_supervisors' => Supervisor::whereIn('zone_id', $zones->pluck('id'))->where('status', 'active')->count(),
            'total_guards' => Guard::whereIn('zone_id', $zones->pluck('id'))->count(),
            'downs_resolved_today' => Down::whereIn('zone_id', $zones->pluck('id'))
                ->whereDate('resolved_at', today())
                ->count(),
            'incentives_preserved' => Down::whereIn('zone_id', $zones->pluck('id'))
                ->whereDate('resolved_at', today())
                ->where('incentive_preserved', true)
                ->count(),
        ];

        return Inertia::render('ZoneCommander/Profile', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'avatar_url' => $user->avatar_path ? asset('storage/' . ltrim($user->avatar_path, '/')) : null,
                'role' => 'zone_commander',
                'created_at' => $user->created_at->toISOString(),
            ],
            'zones' => $zones,
            'recent_resolutions' => $recentResolutions,
            'stats' => $stats,
        ]);
    }
}
