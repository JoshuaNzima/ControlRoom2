<?php

namespace App\Http\Controllers\ControlRoom;

use App\Http\Controllers\Controller;
use App\Models\Camera;
use App\Models\CameraAlert;
use App\Models\ClientSite;
use App\Models\Guards\Guard;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MonitoringController extends Controller
{
    public function index()
    {
        return Inertia::render('ControlRoom/Monitoring', [
            'metrics' => $this->getMetrics(),
            'liveStatus' => $this->getLiveStatus(),
            'recentActivity' => $this->getRecentActivity(),
        ]);
    }

    public function data()
    {
        return response()->json([
            'metrics' => $this->getMetrics(),
            'liveStatus' => $this->getLiveStatus(),
            'recentActivity' => $this->getRecentActivity(),
        ]);
    }

    private function getMetrics()
    {
        return [
            'activeSites' => ClientSite::where('status', 'active')->count(),
            'guardsOnDuty' => Guard::where('status', 'active')->count(),
            'activeAlerts' => CameraAlert::whereNull('resolved_at')->count(),
            'systemStatus' => 'online',
        ];
    }

    private function getLiveStatus()
    {
        return ClientSite::with(['cameras.alerts' => function($query) {
                $query->whereIn('status', ['open', 'unacknowledged']);
            }, 'guards'])
            ->withCount('guards')
            ->get()
            ->map(function($site) {
                return [
                    'id' => $site->id,
                    'name' => $site->name,
                    'status' => $site->status ?? 'active',
                    'guards' => $site->guards_count,
                    'lastUpdate' => now()->subMinutes(rand(1, 30))->diffForHumans(),
                    'alerts' => $site->cameras->flatMap->alerts->count()
                ];
            });
    }

    private function getRecentActivity()
    {
        $activities = collect();

        // Add camera alerts
        CameraAlert::with(['camera.site'])
            ->whereNull('resolved_at')
            ->latest()
            ->limit(5)
            ->get()
            ->each(function($alert) use ($activities) {
                $activities->push([
                    'id' => "alert_{$alert->id}",
                    'type' => 'Camera Alert',
                    'guard' => 'System',
                    'site' => $alert->camera->site->name ?? 'Unknown Site',
                    'time' => $alert->created_at->diffForHumans(),
                    'status' => $alert->priority === 'high' ? 'danger' : 'warning'
                ]);
            });

        return $activities->values();
    }
}