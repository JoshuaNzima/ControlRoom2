<?php

namespace App\Http\Controllers\ControlRoom\Operations;

use App\Http\Controllers\Controller;
use App\Http\Middleware\OperationsOfficerAccess;
use App\Models\Alert;
use App\Models\Camera;
use App\Models\CameraAlert;
use App\Models\Flag;
use App\Models\Incident;
use App\Models\Shift;
use App\Models\Ticket;
use App\Models\Zone;
use App\Models\ClientSite;
use App\Models\Guards\Guard;
use App\Models\Guards\DownReport;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class OperationsOfficerController extends Controller
{
    public function __construct()
    {
        // Ensure legacy access middleware still applies to the consolidated controller
        $this->middleware(\App\Http\Middleware\OperationsOfficerAccess::class);
    }

    /**
     * Display the operations officer dashboard
     *
     * @return \Inertia\Response
     */
    public function index()
    {
        // Merge legacy dashboard data and new stats
        // Legacy: zones summary
        $zones = Zone::with(['sites', 'guards'])->get()->map(function ($zone) {
            $activeGuards = $zone->guards()->where('status', 'active')->count();
            $requiredGuards = $zone->sites->sum('required_guards');
            $coverage = $requiredGuards > 0 ? round(($activeGuards / $requiredGuards) * 100, 1) : 0;

            return [
                'id' => $zone->id,
                'name' => $zone->name,
                'coverage' => $coverage,
                'guards' => $activeGuards,
                'required_guards' => $requiredGuards,
                'sites' => $zone->sites->count(),
                'site_list' => $zone->sites->map(function ($site) {
                    return [
                        'id' => $site->id,
                        'name' => $site->name,
                        'guards' => $site->active_guard_count ?? 0,
                        'required_guards' => $site->required_guards ?? 0,
                        'status' => $site->status ?? null,
                        'alerts' => $site->active_alerts_count ?? 0
                    ];
                })
            ];
        });

        // New: high-level stats
        $stats = [
            'active_alerts' => Alert::where('status', 'active')->count(),
            'pending_tickets' => Ticket::where('status', 'pending')->count(),
            'active_incidents' => Incident::where('status', 'active')->count(),
            'camera_alerts' => CameraAlert::where('status', 'active')->count(),
            'active_flags' => Flag::where('status', 'active')->count(),
            'active_shifts' => Shift::where('status', 'active')->count(),
        ];

        // Recent alerts
        $recentAlerts = Alert::with(['source', 'acknowledgedBy', 'resolvedBy'])
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        // Live site status
        $liveStatus = ClientSite::with(['activeGuards', 'activeAlerts'])
            ->where('status', 'active')
            ->get()
            ->map(function ($site) {
                return [
                    'id' => $site->id,
                    'name' => $site->name,
                    'status' => $site->status,
                    'guards' => $site->activeGuards->count() ?? 0,
                    'alerts' => $site->activeAlerts->count() ?? 0,
                    'lastUpdate' => $site->last_activity_at ? Carbon::parse($site->last_activity_at)->diffForHumans() : 'N/A'
                ];
            });

        // Recent activity placeholder
        $recentActivity = collect([]);

        // Cameras preview
        $cameras = Camera::where('status', 'active')
            ->limit(8)
            ->get()
            ->map(function ($camera) {
                $recent = $camera->recordings()->latest()->first();
                return [
                    'id' => $camera->id,
                    'name' => $camera->name,
                    'site' => $camera->site?->name,
                    'thumbnail' => $recent ? route('control-room.cameras.recordings.thumbnail', ['recording' => $recent->id]) : null,
                    'status' => $camera->status
                ];
            });

        return Inertia::render('ControlRoom/OperationsOfficer', [
            'zones' => $zones,
            'stats' => $stats,
            'liveStatus' => $liveStatus,
            'recentActivity' => $recentActivity,
            'cameras' => $cameras,
            'recentAlerts' => $recentAlerts,
        ]);
    }

    /**
     * Operations Manager dashboard - higher level controls and reports
     *
     * @return \Inertia\Response
     */
    public function manager()
    {
        // Manager dashboard moved to OperationsManagerController. Keep this method for BC for a short time
        // but redirect to the new controller's route.
        return redirect()->route('control-room.operations.manager.dashboard');
    }

    /**
     * Show the operations officer's alerts panel
     *
     * @return \Inertia\Response
     */
    public function alerts()
    {
        $alerts = Alert::with(['source', 'acknowledgedBy', 'resolvedBy'])
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return Inertia::render('ControlRoom/Alerts', [
            'alerts' => $alerts
        ]);
    }

    /**
     * Show the operations officer's camera monitoring panel
     *
     * @return \Inertia\Response
     */
    public function cameras()
    {
        $cameras = Camera::with(['site', 'alerts' => function ($query) {
                $query->where('status', 'active');
            }])
            ->orderBy('status')
            ->paginate(15);

        return Inertia::render('ControlRoom/Cameras/Index', [
            'cameras' => $cameras
        ]);
    }

    /**
     * Show the operations officer's zone monitoring panel
     *
     * @return \Inertia\Response
     */
    public function zones()
    {
        $zones = Zone::with(['commander'])
            ->orderBy('name')
            ->paginate(15);

        return Inertia::render('ControlRoom/Zones', [
            'zones' => $zones
        ]);
    }

    /**
     * Show the operations officer's shift management panel
     *
     * @return \Inertia\Response
     */
    public function shifts()
    {
        // Shift model exposes guards() (many-to-many) and supervisor()
        $shifts = Shift::with(['guards', 'supervisor'])
            ->where('status', 'active')
            ->orderBy('start_time')
            ->paginate(15);

        return Inertia::render('ControlRoom/Shifts/Index', [
            'shifts' => $shifts
        ]);
    }
}