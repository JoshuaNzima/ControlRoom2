<?php

namespace App\Http\Controllers\ControlRoom;

use App\Http\Controllers\Controller;
use App\Models\Camera;
use App\Models\CameraAlert;
use App\Models\ClientSite;
use App\Models\Flag;
use App\Models\Guards\Guard;
use App\Models\Incident;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class MonitoringController extends Controller
{
    public function index()
    {
        return Inertia::render('Monitoring', [
            'metrics' => $this->getMetrics(),
            'events' => $this->getRecentEvents(),
            'guards' => $this->getActiveGuards(),
        ]);
    }

    public function events()
    {
        return response()->json($this->getRecentEvents());
    }

    public function guards()
    {
        return response()->json($this->getActiveGuards());
    }

    public function incidents()
    {
        $incidents = Incident::with(['reporter', 'site'])
            ->orderBy('created_at', 'desc')
            ->take(50)
            ->get()
            ->map(function ($incident) {
                return [
                    'id' => $incident->id,
                    'type' => $incident->type,
                    'description' => $incident->description,
                    'severity' => $incident->severity,
                    'status' => $incident->status,
                    'location' => $incident->location,
                    'reporter' => $incident->reporter->name,
                    'site' => $incident->site?->name,
                    'created_at' => $incident->created_at,
                    'updated_at' => $incident->updated_at,
                ];
            });

        return response()->json($incidents);
    }

    private function getMetrics()
    {
        return Cache::remember('monitoring.metrics', 60, function () {
            return [
                'activeSites' => ClientSite::where('status', 'active')->count(),
                'guardsOnDuty' => Guard::where('status', 'active')->count(),
                'activeAlerts' => CameraAlert::whereNull('resolved_at')->count(),
                'activeFlags' => Flag::whereIn('status', ['open', 'in_progress'])->count(),
                'activeIncidents' => Incident::whereIn('status', ['open', 'in_progress'])->count(),
                'systemStatus' => Cache::get('system_status', 'online'),
            ];
        });
    }

    private function getActiveGuards()
    {
        return Guard::with(['currentShift', 'currentSite', 'user'])
            ->where('status', 'active')
            ->get()
            ->map(function ($guard) {
                return [
                    'id' => $guard->id,
                    'name' => $guard->user->name,
                    'status' => $guard->status,
                    'location' => $guard->last_known_location,
                    'lastCheckIn' => $guard->last_check_in,
                    'currentSite' => $guard->currentSite?->name,
                    'currentShift' => [
                        'started_at' => $guard->currentShift?->started_at,
                        'ends_at' => $guard->currentShift?->ends_at,
                    ],
                    'lastActivity' => $guard->updated_at
                ];
            });
    }

    private function getRecentEvents()
    {
        // Get events from cache or generate new ones
        return Cache::remember('monitoring.events', 30, function () {
            $events = collect();

            // Add incidents
            Incident::with(['reporter', 'site'])
                ->latest()
                ->take(20)
                ->get()
                ->each(function ($incident) use ($events) {
                    $events->push([
                        'type' => 'incident',
                        'severity' => $incident->severity,
                        'title' => $incident->type,
                        'description' => $incident->description,
                        'location' => $incident->location,
                        'reporter' => $incident->reporter->name,
                        'site' => $incident->site?->name,
                        'timestamp' => $incident->created_at,
                    ]);
                });

            // Add flags
            Flag::with(['flaggable', 'site'])
                ->latest()
                ->take(20)
                ->get()
                ->each(function ($flag) use ($events) {
                    $events->push([
                        'type' => 'flag',
                        'severity' => $flag->priority,
                        'title' => $flag->title,
                        'description' => $flag->description,
                        'location' => $flag->location,
                        'category' => $flag->category,
                        'site' => $flag->site?->name,
                        'timestamp' => $flag->created_at,
                    ]);
                });

            // Add camera alerts
            CameraAlert::with(['camera.site'])
                ->whereNull('resolved_at')
                ->latest()
                ->take(20)
                ->get()
                ->each(function ($alert) use ($events) {
                    $events->push([
                        'type' => 'camera_alert',
                        'severity' => $alert->priority,
                        'title' => 'Camera Alert',
                        'description' => $alert->description,
                        'location' => [
                            'lat' => $alert->camera->latitude,
                            'lng' => $alert->camera->longitude,
                        ],
                        'site' => $alert->camera->site->name,
                        'timestamp' => $alert->created_at,
                    ]);
                });

            // Add guard movements
            Guard::with(['user', 'currentSite'])
                ->where('updated_at', '>=', now()->subHours(1))
                ->whereNotNull('last_known_location')
                ->get()
                ->each(function ($guard) use ($events) {
                    $events->push([
                        'type' => 'guard_location',
                        'severity' => 'info',
                        'title' => 'Guard Location Update',
                        'description' => "{$guard->user->name} location updated",
                        'location' => $guard->last_known_location,
                        'site' => $guard->currentSite?->name,
                        'timestamp' => $guard->updated_at,
                        'guard' => [
                            'id' => $guard->id,
                            'name' => $guard->user->name,
                            'status' => $guard->status
                        ]
                    ]);
                });

            return $events->sortByDesc('timestamp')->values()->take(50);
        });
    }
}