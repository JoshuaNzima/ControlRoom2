<?php

namespace App\Http\Controllers\ControlRoom;

use App\Http\Controllers\Controller;
use App\Models\ControlRoomSetting;
use App\Models\CameraAlert;
use App\Models\ClientSite;
use App\Models\Flag;
use App\Models\Guards\Attendance;
use App\Models\Guards\Guard;
use App\Models\Incident;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class MonitoringController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        // Default view uses the last 1 hour window for SLA-related metrics
        $defaultRangeMinutes = 60;

        // Load user map preferences (fallback to defaults)
        $defaults = [
            'monitor.map.showCountsOverlay' => true,
            'monitor.map.scaleByRequired' => true,
        ];
        $settings = ControlRoomSetting::query()
            ->where('user_id', $user?->id)
            ->whereIn('key', array_keys($defaults))
            ->get()
            ->pluck('value', 'key')
            ->toArray();
        $mapped = [
            'showCountsOverlay' => (bool)($settings['monitor.map.showCountsOverlay'] ?? $defaults['monitor.map.showCountsOverlay']),
            'scaleByRequired' => (bool)($settings['monitor.map.scaleByRequired'] ?? $defaults['monitor.map.scaleByRequired']),
        ];

        return Inertia::render('ControlRoom/Monitoring', [
            'auth' => [
                'user' => [
                    'name' => $user?->name,
                ],
            ],
            'metrics' => $this->getMetrics(),
            'liveStatus' => $this->getLiveSiteStatus(),
            'recentActivity' => $this->getRecentActivityFormatted($defaultRangeMinutes),
            'guards' => $this->getActiveGuards(),
            'events' => $this->getRecentEvents($defaultRangeMinutes),
            'sla' => $this->getSlaStats($defaultRangeMinutes),
            'activeRange' => '1h',
            'settings' => $mapped,
        ]);
    }

    public function data()
    {
        $range = request()->query('range');
        $rangeMinutes = $this->resolveRangeMinutes($range);

        return response()->json([
            'metrics' => $this->getMetrics(),
            'liveStatus' => $this->getLiveSiteStatus(),
            'recentActivity' => $this->getRecentActivityFormatted($rangeMinutes),
            'sla' => $this->getSlaStats($rangeMinutes),
            'guards' => $this->getActiveGuards($rangeMinutes),
            'events' => $this->getRecentEvents($rangeMinutes),
        ]);
    }

    public function events()
    {
        $range = request()->query('range');
        $rangeMinutes = $this->resolveRangeMinutes($range);

        return response()->json($this->getRecentEvents($rangeMinutes));
    }

    public function guards()
    {
        $range = request()->query('range');
        $rangeMinutes = $this->resolveRangeMinutes($range);

        return response()->json($this->getActiveGuards($rangeMinutes));
    }

    public function incidents()
    {
        $incidents = Incident::with(['reporter', 'clientSite'])
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
                    'site' => $incident->clientSite?->name,
                    'created_at' => $incident->created_at,
                    'updated_at' => $incident->updated_at,
                ];
            });

        return response()->json($incidents);
    }

    public function siteDetails(ClientSite $site)
    {
        $site->load([
            'client:id,name',
            'guards:id,name,status',
            'attendance' => function ($q) {
                $q->whereDate('date', today());
            },
        ]);

        $required = (int) ($site->required_guards ?? 0);
        $onDuty = (int) $site->getCurrentGuardsCount();
        $coverageStatus = $required > 0
            ? ($onDuty >= $required ? 'full' : ($onDuty > 0 ? 'partial' : 'none'))
            : ($onDuty > 0 ? 'partial' : 'unknown');

        $attendanceSummary = [
            'present' => $site->attendance->where('status', 'present')->count(),
            'late' => $site->attendance->where('status', 'late')->count(),
            'absent' => $site->attendance->where('status', 'absent')->count(),
            'on_duty' => $onDuty,
        ];

        $assignedGuards = $site->guards->map(function ($g) {
            return [
                'id' => $g->id,
                'name' => $g->name,
                'status' => $g->status,
            ];
        })->values();

        return response()->json([
            'id' => $site->id,
            'name' => $site->name,
            'client' => $site->client?->name,
            'address' => $site->address,
            'status' => $site->status,
            'required' => $required,
            'onDuty' => $onDuty,
            'coverageStatus' => $coverageStatus,
            'latitude' => $site->latitude,
            'longitude' => $site->longitude,
            'assignedGuards' => $assignedGuards,
            'attendanceToday' => $site->attendance->map(function ($a) {
                return [
                    'id' => $a->id,
                    'guard_id' => $a->guard_id,
                    'status' => $a->status,
                    'check_in_time' => $a->check_in_time,
                    'check_out_time' => $a->check_out_time,
                ];
            })->values(),
            'attendanceSummary' => $attendanceSummary,
        ]);
    }

    private function getLiveSiteStatus()
    {
        return Cache::remember('monitoring.live_status', 60, function () {
            $onDutyBySite = Attendance::query()
                ->whereDate('date', today())
                ->whereNotNull('check_in_time')
                ->whereNull('check_out_time')
                ->selectRaw('client_site_id, COUNT(*) as c')
                ->groupBy('client_site_id')
                ->pluck('c', 'client_site_id');

            return ClientSite::query()
                ->select(['id', 'name', 'status', 'required_guards', 'latitude', 'longitude', 'updated_at'])
                ->withCount([
                    'cameraAlerts as alerts' => function ($q) {
                        $q->whereNull('resolved_at');
                    }
                ])
                ->get()
                ->map(function ($site) use ($onDutyBySite) {
                    $required = (int) ($site->required_guards ?? 0);
                    $onDuty = (int) ($onDutyBySite[$site->id] ?? 0);
                    $coverageStatus = $required > 0
                        ? ($onDuty >= $required ? 'full' : ($onDuty > 0 ? 'partial' : 'none'))
                        : ($onDuty > 0 ? 'partial' : 'unknown');

                    return [
                        'id' => $site->id,
                        'name' => $site->name,
                        'status' => $site->status,
                        'required' => $required,
                        'onDuty' => $onDuty,
                        'coverageStatus' => $coverageStatus,
                        'lastUpdate' => $site->updated_at?->diffForHumans(),
                        'alerts' => (int) ($site->alerts ?? 0),
                        'location' => [
                            'lat' => $site->latitude ?? -26.2041,
                            'lng' => $site->longitude ?? 28.0473
                        ]
                    ];
                });
        });
    }

    private function getRecentActivityFormatted(?int $rangeMinutes = null)
    {
        $cacheKey = 'monitoring.recent_activity.'.($rangeMinutes ?? 'default');

        return Cache::remember($cacheKey, 30, function () use ($rangeMinutes) {
            $activity = collect();
            
            // Get recent events and format for activity feed
            $this->getRecentEvents($rangeMinutes)->take(10)->each(function ($event) use ($activity) {
                $id = data_get($event, 'id');
                $type = data_get($event, 'type');
                $guardName = data_get($event, 'guard.name') ?? data_get($event, 'reporter') ?? 'System';
                $site = data_get($event, 'site', 'Unknown');
                $timestamp = data_get($event, 'timestamp');
                $time = is_object($timestamp) && method_exists($timestamp, 'diffForHumans')
                    ? $timestamp->diffForHumans()
                    : (string) $timestamp;

                $activity->push([
                    'id' => $id ?? uniqid(),
                    'type' => $type,
                    'guard' => $guardName,
                    'site' => $site,
                    'time' => $time,
                    'status' => $this->getEventStatus($event)
                ]);
            });
            
            return $activity->values();
        });
    }

    private function getEventStatus($event)
    {
        $severityMap = [
            'critical' => 'danger',
            'high' => 'danger',
            'medium' => 'warning',
            'low' => 'info',
            'info' => 'success'
        ];
        
        $sev = data_get($event, 'severity');
        return $severityMap[$sev] ?? 'info';
    }

    private function getMetrics()
    {
        return Cache::remember('monitoring.metrics', 60, function () {
            $onDutyToday = Attendance::query()
                ->whereDate('date', today())
                ->whereNotNull('check_in_time')
                ->whereNull('check_out_time')
                ->count();

            return [
                'activeSites' => ClientSite::where('status', 'active')->count(),
                'guardsOnDuty' => $onDutyToday,
                'activeAlerts' => CameraAlert::whereNull('resolved_at')->count(),
                'activeFlags' => Flag::whereIn('status', ['open', 'in_progress'])->count(),
                'activeIncidents' => Incident::whereIn('status', ['open', 'in_progress'])->count(),
                'systemStatus' => Cache::get('system_status', 'online'),
            ];
        });
    }

    private function getActiveGuards(?int $rangeMinutes = null)
    {
        $cacheKey = 'monitoring.guards.' . ($rangeMinutes ?? 'default');

        return Cache::remember($cacheKey, 15, function () use ($rangeMinutes) {
            $query = Guard::query()
                ->select(['id', 'name', 'status', 'last_known_location', 'current_site_id', 'updated_at'])
                ->with([
                    'currentShift:id,guard_id,status,date,start_time,end_time,actual_start_time,actual_end_time',
                    'currentSite:id,name'
                ])
                ->where('status', 'active');

            if ($rangeMinutes) {
                $from = now()->subMinutes($rangeMinutes);
                $query->where('updated_at', '>=', $from);
            }

            return $query
                ->get()
                ->map(function ($guard) {
                    $loc = is_array($guard->last_known_location) ? $guard->last_known_location : [];
                    $lat = data_get($loc, 'lat', data_get($loc, 'latitude'));
                    $lng = data_get($loc, 'lng', data_get($loc, 'longitude'));
                    if (!is_numeric($lat) || !is_numeric($lng)) {
                        $lat = -26.2041;
                        $lng = 28.0473;
                    }

                    return [
                        'id' => $guard->id,
                        'name' => $guard->name,
                        'status' => $guard->status,
                        'location' => ['lat' => (float) $lat, 'lng' => (float) $lng],
                        'lastCheckIn' => $guard->updated_at,
                        'currentSite' => $guard->currentSite?->name,
                        'currentShift' => [
                            'started_at' => $guard->currentShift?->actual_start_time ?? $guard->currentShift?->start_time,
                            'ends_at' => $guard->currentShift?->actual_end_time ?? $guard->currentShift?->end_time,
                        ],
                        'lastActivity' => $guard->updated_at,
                    ];
                });
        });
    }

    private function getRecentEvents(?int $rangeMinutes = null)
    {
        // Get events from cache or generate new ones
        $cacheKey = 'monitoring.events.' . ($rangeMinutes ?? 'default');

        return Cache::remember($cacheKey, 30, function () use ($rangeMinutes) {
            $events = collect();

            $from = $rangeMinutes ? now()->subMinutes($rangeMinutes) : null;

            // Add incidents
            Incident::with(['reporter', 'clientSite'])
                ->when($from, function ($q) use ($from) {
                    $q->where('created_at', '>=', $from);
                })
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
                        'reporter' => $incident->reporter?->name,
                        'site' => $incident->clientSite?->name,
                        'timestamp' => $incident->created_at,
                    ]);
                });

            // Add flags
            Flag::with(['flaggable', 'site'])
                ->when($from, function ($q) use ($from) {
                    $q->where('created_at', '>=', $from);
                })
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
                ->when($from, function ($q) use ($from) {
                    $q->where('created_at', '>=', $from);
                })
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
                            'lat' => $alert->camera?->latitude,
                            'lng' => $alert->camera?->longitude,
                        ],
                        'site' => $alert->camera?->site?->name,
                        'timestamp' => $alert->created_at,
                    ]);
                });

            // Add guard movements
            Guard::with(['currentSite'])
                ->when($from, function ($q) use ($from) {
                    $q->where('updated_at', '>=', $from);
                }, function ($q) {
                    $q->where('updated_at', '>=', now()->subHours(1));
                })
                ->whereNotNull('last_known_location')
                ->get()
                ->each(function ($guard) use ($events) {
                    $events->push([
                        'type' => 'guard_location',
                        'severity' => 'info',
                        'title' => 'Guard Location Update',
                        'description' => "{$guard->name} location updated",
                        'location' => $guard->last_known_location ?? ['lat' => -26.2041, 'lng' => 28.0473],
                        'site' => $guard->currentSite?->name,
                        'timestamp' => $guard->updated_at,
                        'guard' => [
                            'id' => $guard->id,
                            'name' => $guard->name,
                            'status' => $guard->status,
                        ],
                    ]);
                });

            return $events->sortByDesc('timestamp')->values()->take(50);
        });
    }

    private function getSlaStats(?int $rangeMinutes = null): array
    {
        $from = $rangeMinutes ? now()->subMinutes($rangeMinutes) : null;

        $query = Incident::whereNotNull('resolved_at');
        if ($from) {
            $query->where('created_at', '>=', $from);
        }

        $incidents = $query->get(['severity', 'created_at', 'resolved_at']);

        if ($incidents->isEmpty()) {
            return [
                'averageResponseMinutes' => null,
                'medianResponseMinutes' => null,
                'breachedCount' => 0,
                'totalResolved' => 0,
                'onTimePercent' => null,
            ];
        }

        $durations = [];
        $breached = 0;

        foreach ($incidents as $incident) {
            $minutes = $incident->created_at->diffInMinutes($incident->resolved_at);
            $durations[] = $minutes;

            $target = match (strtolower((string) $incident->severity)) {
                'critical' => 5,
                'high' => 15,
                'medium' => 30,
                default => 60,
            };

            if ($minutes > $target) {
                $breached++;
            }
        }

        sort($durations);
        $count = count($durations);
        $avg = array_sum($durations) / max($count, 1);
        $median = $durations[(int) floor($count / 2)] ?? $durations[0] ?? 0;
        $onTime = $count - $breached;
        $onTimePercent = $count > 0 ? round(($onTime / $count) * 100, 1) : null;

        return [
            'averageResponseMinutes' => round($avg, 1),
            'medianResponseMinutes' => round($median, 1),
            'breachedCount' => $breached,
            'totalResolved' => $count,
            'onTimePercent' => $onTimePercent,
        ];
    }

    private function resolveRangeMinutes(?string $range): ?int
    {
        return match ($range) {
            '15m' => 15,
            '1h' => 60,
            '4h' => 240,
            '24h' => 1440,
            'today' => now()->diffInMinutes(now()->startOfDay()),
            default => null,
        };
    }
}