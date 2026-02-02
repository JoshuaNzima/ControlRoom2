<?php

namespace App\Http\Controllers\ZoneCommander;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Models\Zone;
use App\Models\Guards\Guard;
use App\Models\Guards\GuardAssignment;
use App\Models\Guards\ClientSite;
use App\Models\Guards\Attendance;
use App\Models\Down;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        if (!$user->zone_id) {
            // Prevent 404 when a zone commander has no zone assigned.
            return redirect()->route('dashboard')->with('error', 'No zone assigned to your account. Please contact an administrator.');
        }

        $zone = Zone::with(['sites.client'])->findOrFail($user->zone_id);

        $siteIds = $zone->sites->pluck('id')->filter()->values()->all();
        $requiredBySite = !empty($siteIds)
            ? ClientSite::requiredGuardsBySiteFromScheduleShifts($siteIds)
            : [];

        // Calculate zone statistics
        $totalGuards = (int) $zone->active_guard_count;
        $totalPresent = Attendance::query()
            ->whereDate('date', today())
            ->whereNotNull('check_in_time')
            ->whereHas('clientSite', fn($q) => $q->where('zone_id', $zone->id))
            ->count();

        $attendanceRate = $totalGuards > 0 
            ? round(($totalPresent / $totalGuards) * 100, 1)
            : 0;

        // Prepare site data
        $sites = $zone->sites->map(function($site) use ($requiredBySite) {
            $guardCount = GuardAssignment::query()
                ->where('client_site_id', $site->id)
                ->where('start_date', '<=', today())
                ->where(function ($q) {
                    $q->whereNull('end_date')->orWhere('end_date', '>=', today());
                })
                ->where('is_active', true)
                ->whereHas('assignedGuard', fn($q) => $q->where('status', 'active'))
                ->distinct('guard_id')
                ->count('guard_id');

            $attendanceToday = Attendance::query()
                ->whereDate('date', today())
                ->where('client_site_id', $site->id)
                ->whereNotNull('check_in_time')
                ->count();

            return [
                'id' => $site->id,
                'name' => $site->name,
                'client_name' => $site->client->name,
                'required_guards' => (int) (($requiredBySite[$site->id] ?? 0) ?: ($site->required_guards ?? 0)),
                'guard_count' => $guardCount,
                'attendance_today' => $attendanceToday,
            ];
        });

        // Get at-risk guards
        $atRiskGuards = Guard::whereHas('assignments', function ($q) use ($zone) {
                $q->whereHas('clientSite', fn($q2) => $q2->where('zone_id', $zone->id))
                    ->where('start_date', '<=', today())
                    ->where(function ($q3) {
                        $q3->whereNull('end_date')->orWhere('end_date', '>=', today());
                    })
                    ->where('is_active', true);
            })
            ->where(function($query) {
                $query->where('risk_level', 'high')
                    ->orWhere('risk_level', 'warning');
            })
            ->get()
            ->map(function($guard) {
                $assignment = $guard->currentAssignment();
                if ($assignment) {
                    $assignment->loadMissing('clientSite.client');
                }

                return [
                    'id' => $guard->id,
                    'name' => $guard->name,
                    'risk_level' => $guard->risk_level,
                    'infraction_count' => $guard->infraction_count,
                    'current_site' => $assignment ? [
                        'name' => $assignment->clientSite->name,
                        'client_name' => $assignment->clientSite->client->name,
                    ] : null,
                ];
            });

        $recentAlerts = Down::query()
            ->with(['clientSite:id,name,zone_id,client_id', 'clientSite.client:id,name', 'guardRelation:id,name'])
            ->whereIn('status', ['open', 'escalated'])
            ->whereHas('clientSite', fn($q) => $q->where('zone_id', $zone->id))
            ->latest()
            ->limit(10)
            ->get()
            ->map(function (Down $down) {
                $siteName = (string) (optional($down->clientSite)->name ?? 'Site');
                $clientName = (string) (optional(optional($down->clientSite)->client)->name ?? 'Client');
                $guardName = (string) (optional($down->guardRelation)->name ?? 'Guard');

                $severity = $down->status === 'escalated' ? 'high' : 'medium';
                if ($down->type === 'guard_absent') {
                    $severity = $down->status === 'escalated' ? 'high' : 'high';
                }

                $typeLabel = match ($down->type) {
                    'guard_absent' => 'Guard Absent',
                    'site_unmanned' => 'Site Unmanned',
                    default => 'Down',
                };

                $message = $down->type === 'guard_absent'
                    ? "{$guardName} absent at {$clientName} • {$siteName}"
                    : (string) ($down->title ?: "{$clientName} • {$siteName}");

                return [
                    'type' => $typeLabel,
                    'message' => $message,
                    'severity' => $severity,
                    'created_at' => $down->created_at,
                    'down_id' => $down->id,
                    'client_site_id' => $down->client_site_id,
                    'guard_id' => $down->guard_id,
                ];
            });

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