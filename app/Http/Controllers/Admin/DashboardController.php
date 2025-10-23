<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Guards\{Guard, Attendance, Client, ClientSite, Shift};
use App\Models\User;
use App\Models\Core\Module;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index()
    {
        $today = today();
        
        // Overall Statistics
        $stats = [
            'total_guards' => Guard::count(),
            'active_guards' => Guard::where('status', 'active')->count(),
            'on_duty_today' => Attendance::whereDate('date', $today)
                ->whereNotNull('check_in_time')
                ->whereNull('check_out_time')
                ->count(),
            'total_users' => User::count(),
            'active_clients' => Client::where('status', 'active')->count(),
            'total_sites' => ClientSite::count(),
            'shifts_today' => Shift::whereDate('date', $today)->count(),
            'attendance_rate' => $this->calculateAttendanceRate($today),
        ];

        // Module Status
        $modules = Module::orderBy('sort_order')->get()->map(fn($m) => [
            'name' => $m->name,
            'display_name' => $m->display_name,
            'is_active' => $m->is_active,
            'color' => $m->color,
            'icon' => $m->icon,
        ]);

        // Recent Activity
        $recentActivity = $this->getRecentActivity();

        // Guards Statistics by Status
        $guardStats = [
            'active' => Guard::where('status', 'active')->count(),
            'inactive' => Guard::where('status', 'inactive')->count(),
            'suspended' => Guard::where('status', 'suspended')->count(),
        ];

        // Attendance Trend (Last 7 days)
        $attendanceTrend = $this->getAttendanceTrend();

        // Zone coverage series (7 days) - aggregate for all zones
        $zoneCoverage = $this->getZoneCoverageSeries();

        // Top Performing Guards
        $topGuards = $this->getTopGuards();

        // Zone coverage summary across all zones
        $totalRequiredGuards = (int) (\App\Models\Zone::sum('required_guard_count'));
        $guardsDeployedToday = (int) (\App\Models\Guards\Attendance::whereDate('date', $today)
            ->whereNotNull('check_in_time')
            ->distinct('guard_id')
            ->count('guard_id'));

        $totalSites = (int) (\App\Models\Guards\ClientSite::count());
        $sitesCoveredToday = (int) (\App\Models\Guards\Attendance::whereDate('date', $today)
            ->whereNotNull('check_in_time')
            ->whereNotNull('client_site_id')
            ->distinct('client_site_id')
            ->count('client_site_id'));

        $coverageSummary = [
            'guards_deployed_today' => $guardsDeployedToday,
            'guards_required_total' => $totalRequiredGuards,
            'sites_covered_today' => $sitesCoveredToday,
            'sites_total' => $totalSites,
            'guards_coverage_pct' => $totalRequiredGuards > 0 ? round(($guardsDeployedToday / $totalRequiredGuards) * 100, 1) : 0,
            'sites_coverage_pct' => $totalSites > 0 ? round(($sitesCoveredToday / $totalSites) * 100, 1) : 0,
        ];

        // Payments summary (top-level): total_clients_due, total_clients_outstanding_value
        $paymentsSummary = [
            'total_clients' => \App\Models\Guards\Client::count(),
            'clients_with_outstanding' => 0,
            'outstanding_value' => 0.0,
        ];
        try {
            $year = now()->year;
            $clientPayments = \App\Models\ClientPayment::where('year', $year)->get();
            $grouped = $clientPayments->groupBy('client_id');
            foreach ($grouped as $clientId => $rows) {
                $due = $rows->sum('amount_due');
                $paid = $rows->sum('amount_paid');
                if ($due > $paid) {
                    $paymentsSummary['clients_with_outstanding']++;
                    $paymentsSummary['outstanding_value'] += ($due - $paid);
                }
            }
            $paymentsSummary['outstanding_value'] = round($paymentsSummary['outstanding_value'], 2);
        } catch (\Throwable $e) {
            // ignore if table missing during early dev
        }

        // High-level KPIs grouped by module (safe defaults where specific models are not present)
        $kpis = [
            'hr_users' => [
                'total_users' => User::count(),
                'active_users' => (int) (User::where('status', 'active')->count() ?? 0),
                'inactive_users' => (int) (User::where('status', 'inactive')->count() ?? 0),
                'new_hires_this_month' => (int) User::whereMonth('created_at', now()->month)->count(),
                'turnover_rate' => 0,
                'pending_leave_requests' => 0,
                'training_compliance' => 0,
            ],
            'hr_guards' => [
                'total_guards' => Guard::count(),
                'active_guards' => Guard::where('status', 'active')->count(),
                'inactive_guards' => Guard::where('status', 'inactive')->count(),
                'suspended_guards' => Guard::where('status', 'suspended')->count(),
                'new_guards_this_month' => Guard::whereMonth('created_at', now()->month)->count(),
                'turnover_rate' => 0,
                'pending_leave_requests' => 0,
                'training_compliance' => 0,
            ],
            'finance' => [
                'outstanding_payroll' => 0,
                'mtd_expenses' => 0,
                'mtd_budget' => 0,
                'unpaid_invoices_count' => 0,
                'unpaid_invoices_value' => 0,
                'cash_flow_indicator' => 'neutral',
            ],
            'it' => [
                'uptime_30d' => 99.9,
                'open_tickets' => 0,
                'critical_alerts' => 0,
                'pending_updates' => 0,
                'suspicious_logins' => 0,
            ],
            'control_room' => [
                'active_incidents' => 0,
                'resolved_incidents' => 0,
                'guards_on_duty' => $stats['on_duty_today'] ?? 0,
                'cameras_online' => 0,
                'cameras_offline' => 0,
                'dispatches_today' => 0,
                'avg_response_time_min' => 0,
            ],
            'operations' => [
                'active_contracts' => 0,
                'expired_contracts' => 0,
                'shift_coverage_pct' => $stats['attendance_rate'] ?? 0,
                'guards_on_duty' => $stats['on_duty_today'] ?? 0,
                'field_reports_pending' => 0,
                'operational_incidents_today' => 0,
            ],
            'k9' => [
                'active_k9s' => 0,
                'k9_on_patrol' => 0,
                'training_sessions_month' => 0,
                'medical_checkups_pending' => 0,
                'k9_incidents_month' => 0,
            ],
            'administration' => [
                'assets_active' => 0,
                'assets_depreciated' => 0,
                'pending_approvals' => 0,
                'system_users_total' => $stats['total_users'] ?? 0,
                'system_users_active' => 0,
                'system_users_inactive' => 0,
                'documents_new_month' => 0,
                'compliance_updates_pending' => 0,
            ],
            'cross_module' => [
                'critical_alerts_today' => 0,
                'overall_incident_trend' => 'stable',
                'financial_health' => 'neutral',
                'employee_utilization_pct' => $stats['active_guards'] > 0 ? round((($stats['on_duty_today'] ?? 0) / max(1, $stats['active_guards'])) * 100, 1) : 0,
                'resource_utilization' => 0,
                'security_status_open_incidents' => 0,
            ],
        ];

        return Inertia::render('Admin/Dashboard', [
            'stats' => $stats,
            'modules' => $modules,
            'recentActivity' => $recentActivity,
            'guardStats' => $guardStats,
            'attendanceTrend' => $attendanceTrend,
            'topGuards' => $topGuards,
            'zoneCoverage' => $zoneCoverage,
            'coverageSummary' => $coverageSummary,
            'kpis' => $kpis,
            'paymentsSummary' => $paymentsSummary,
            'auth' => [
            'user' => [
                'name' => auth()->user()->name,
                'roles' => auth()->user()->roles ?? ['admin'], // Ensure roles array exists
                'permissions' => auth()->user()->permissions ?? [], // Ensure permissions exist
                    ]
            ]
        ]);
    }

    private function calculateAttendanceRate($date): float
    {
        $totalActive = Guard::where('status', 'active')->count();
        if ($totalActive === 0) return 0;
        
        $present = Attendance::whereDate('date', $date)->count();
        return round(($present / $totalActive) * 100, 1);
    }

    private function getRecentActivity(): array
    {
        $activities = [];

        // Recent Check-ins
        $recentCheckIns = Attendance::whereDate('created_at', today())
            ->with('guard')
            ->latest()
            ->take(5)
            ->get();

        foreach ($recentCheckIns as $attendance) {
            $activities[] = [
                'id' => 'check-in-' . $attendance->id,
                'type' => 'check_in',
                'message' => "{$attendance->guard->name} checked in",
                'time' => $attendance->created_at->diffForHumans(),
                'icon' => 'LogIn',
                'color' => 'green',
            ];
        }

        // Recent User Logins (if you track this)
        // Add more activity types as needed

        return collect($activities)->sortByDesc('time')->take(10)->values()->toArray();
    }

    private function getAttendanceTrend(): array
    {
        $trend = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = today()->subDays($i);
            $trend[] = [
                'date' => $date->format('M d'),
                'present' => Attendance::whereDate('date', $date)->count(),
                'absent' => Guard::active()->count() - Attendance::whereDate('date', $date)->count(),
            ];
        }
        return $trend;
    }

    private function getTopGuards(): array
    {
        return Guard::active()
            ->withCount(['attendance' => function($q) {
                $q->whereMonth('date', now()->month);
            }])
            ->orderBy('attendance_count', 'desc')
            ->take(5)
            ->get()
            ->map(fn($guard) => [
                'name' => $guard->name,
                'employee_id' => $guard->employee_id,
                'attendance_count' => $guard->attendance_count,
                'attendance_rate' => round(($guard->attendance_count / now()->day) * 100, 1),
            ])
            ->toArray();
    }

    private function getZoneCoverageSeries(): array
    {
        // Placeholder aggregate coverage; replace with real zone stats if available
        $series = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = today()->subDays($i);
            $present = \App\Models\Guards\Attendance::whereDate('date', $date)->count();
            $active = \App\Models\Guards\Guard::active()->count();
            $coverage = $active > 0 ? round(($present / $active) * 100, 1) : 0;
            $series[] = [
                'date' => $date->format('M d'),
                'coverage' => $coverage,
            ];
        }
        return $series;
    }
}