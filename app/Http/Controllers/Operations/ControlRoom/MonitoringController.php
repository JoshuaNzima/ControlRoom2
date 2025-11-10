<?php

namespace App\Http\Controllers\Operations\ControlRoom;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use App\Models\Guards\ClientSite;
use App\Models\Guards\GuardAssignment;
use App\Models\Guards\Attendance;
use App\Models\Guards\DownReport;
use App\Models\CameraAlert;
use App\Models\Zone;
use App\Models\Guards\Guard;
use App\Models\Camera;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class MonitoringController extends Controller
{
    /**
     * Return lightweight monitoring data for the control room UI.
     */
    public function index(): JsonResponse
    {
        $today = Carbon::today();

        // Basic stats
        $stats = [
            'activeGuards' => Guard::where('status', 'active')->count(),
            'totalSites' => ClientSite::where('status', 'active')->count(),
            'activeAlerts' => DownReport::where('created_at', '>=', $today)->count(),
            'cameraAlerts' => CameraAlert::where('status', 'active')->count(),
            'systemStatus' => 'online',
        ];

    // Live site summary - limit to 50
    $sites = ClientSite::where('status', 'active')->limit(50)->get();
        $liveStatus = $sites->map(function ($site) {
            $guardsCount = GuardAssignment::where('client_site_id', $site->id)
                ->where('is_active', true)
                ->count();

            // last activity: last down report for site or updated_at
            $lastDown = DownReport::where('client_site_id', $site->id)->orderBy('created_at', 'desc')->first();
            $lastUpdate = $lastDown ? $lastDown->created_at->diffForHumans() : ($site->updated_at?->diffForHumans() ?? 'unknown');

            $alerts = DownReport::where('client_site_id', $site->id)->where('created_at', '>=', Carbon::today()->subDays(7))->count();

            return [
                'id' => $site->id,
                'name' => $site->name,
                'status' => $guardsCount > 0 ? 'active' : 'inactive',
                'guards' => $guardsCount,
                'lastUpdate' => $lastUpdate,
                'alerts' => $alerts,
            ];
        })->values();

        // Recent activity (mix of attendance and down reports)
        $recentDowns = DownReport::with('supervisor', 'clientSite')->orderBy('created_at', 'desc')->limit(6)->get()->map(function ($d) {
            return [
                'id' => $d->id,
                'type' => 'down',
                'guard' => $d->supervisor?->name ?? 'Unknown',
                'site' => $d->clientSite?->name ?? 'Unknown',
                'time' => $d->created_at->diffForHumans(),
                'status' => 'warning',
            ];
        });

        $recentAttendance = Attendance::with('guard', 'clientSite')->orderBy('created_at', 'desc')->limit(6)->get()->map(function ($a) {
            return [
                'id' => 'att-'.$a->id,
                'type' => 'attendance',
                'guard' => $a->guard?->name ?? 'Unknown',
                'site' => $a->clientSite?->name ?? 'Unknown',
                'time' => $a->created_at->diffForHumans(),
                'status' => 'success',
            ];
        });

        $recentActivity = $recentDowns->concat($recentAttendance)->sortByDesc(function ($i) {
            return strtotime($i['time']) ?: 0;
        })->values()->take(8);

        // Zones data
        $zones = Zone::all()->map(function ($zone) {
            $activeGuards = Guard::whereHas('assignments.clientSite', function ($q) use ($zone) {
                $q->where('zone_id', $zone->id);
            })->where('status', 'active')->count();

            $requiredGuards = $zone->required_guard_count ?? 0;
            $coverage = $requiredGuards > 0 ? round(($activeGuards / $requiredGuards) * 100, 1) : 0;

            return [
                'id' => $zone->id,
                'name' => $zone->name,
                'coverage' => $coverage,
                'guards' => $activeGuards,
                'required_guards' => $requiredGuards,
                'sites' => $zone->sites()->count(),
            ];
        });

        // Include a small cameras payload (recent recording thumbnail if available)
        $cameras = Camera::where('status', 'active')->limit(8)->get()->map(function ($cam) {
            $recent = $cam->recordings()->latest()->first();
            $thumbnailEndpoint = null;
            if ($recent) {
                try {
                    // Provide an endpoint that will issue a temporary/signed URL or redirect to a public URL
                    $thumbnailEndpoint = route('control-room.cameras.recordings.thumbnail', ['recording' => $recent->id]);
                } catch (\Throwable $e) {
                    $thumbnailEndpoint = null;
                }
            }

            return [
                'id' => $cam->id,
                'name' => $cam->name,
                'site' => $cam->site?->name ?? null,
                // the client will call the endpoint (img src) which redirects to a signed URL when possible
                'thumbnail' => $thumbnailEndpoint,
                'status' => $cam->status,
            ];
        });

        return response()->json([
            'stats' => $stats,
            'liveStatus' => $liveStatus,
            // include site coords so client can map agent locations to sites
            'sites' => $sites->map(fn($s) => [
                'id' => $s->id,
                'name' => $s->name,
                'latitude' => $s->latitude,
                'longitude' => $s->longitude,
            ])->values(),
            'recentActivity' => $recentActivity,
            'zones' => $zones,
            'cameras' => $cameras,
        ]);
    }

    /**
     * Return only the small stats object (lightweight) for frequent refreshes
     */
    public function stats(): JsonResponse
    {
        $today = Carbon::today();

        $stats = [
            'activeGuards' => Guard::where('status', 'active')->count(),
            'totalSites' => ClientSite::where('status', 'active')->count(),
            'activeAlerts' => DownReport::where('created_at', '>=', $today)->count(),
            'cameraAlerts' => CameraAlert::where('status', 'active')->count(),
            'systemStatus' => 'online',
        ];

        return response()->json(['stats' => $stats]);
    }
}
