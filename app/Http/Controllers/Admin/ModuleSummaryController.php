<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ModuleSummaryController extends Controller
{
    public function show(string $module)
    {
        $key = strtolower($module);
        $summary = [];
        switch ($key) {
            case 'hr':
                $summary = [
                    'employees_total' => (int) \App\Models\User::count(),
                    'guards_total' => (int) (\App\Models\Guards\Guard::count() ?? 0),
                    'jobs_open' => (int) (\App\Models\JobPosting::where('status', 'published')->count() ?? 0),
                    'leave_requests_pending' => 0,
                    'training_sessions_month' => 0,
                ];
                break;
            case 'control_room':
                $today = now()->toDateString();
                // Attendance
                $attendanceToday = (int) (\App\Models\Guards\Attendance::whereDate('date', $today)->count() ?? 0);
                $checkedInNow = (int) (\App\Models\Guards\Attendance::whereDate('date', $today)
                    ->whereNotNull('check_in_time')->whereNull('check_out_time')->count() ?? 0);

                // Incidents
                $incidentsOpen = (int) (\App\Models\Incident::where('status', 'open')->count() ?? 0);
                $incidentsInProgress = (int) (\App\Models\Incident::where('status', 'in_progress')->count() ?? 0);
                $incidentsEscalated = (int) (\App\Models\Incident::where('status', 'escalated')->count() ?? 0);
                $incidentsResolvedToday = (int) (\App\Models\Incident::where('status', 'resolved')->whereDate('resolved_at', $today)->count() ?? 0);

                // Flags
                $flagsPending = (int) (\App\Models\Flag::where('status', 'pending_review')->count() ?? 0);
                $flagsUnderReview = (int) (\App\Models\Flag::where('status', 'under_review')->count() ?? 0);
                $flagsResolvedToday = (int) (\App\Models\Flag::where('status', 'resolved')->whereDate('review_date', $today)->count() ?? 0);

                // Downs
                $downsOpen = (int) (\App\Models\Down::where('status', 'open')->count() ?? 0);
                $downsEscalated = (int) (\App\Models\Down::where('status', 'escalated')->count() ?? 0);
                $downsAbsconding = (int) (\App\Models\Down::where('status', 'absconding')->count() ?? 0);
                $downsResolvedToday = (int) (\App\Models\Down::where('status', 'resolved')->whereDate('resolved_at', $today)->count() ?? 0);

                $summary = [
                    // Totals
                    'guards_total' => (int) (\App\Models\Guards\Guard::count() ?? 0),
                    'sites_total' => (int) (\App\Models\Guards\ClientSite::count() ?? 0),
                    // Attendance
                    'attendance_today' => $attendanceToday,
                    'checked_in_now' => $checkedInNow,
                    // Incidents
                    'incidents_open' => $incidentsOpen,
                    'incidents_in_progress' => $incidentsInProgress,
                    'incidents_escalated' => $incidentsEscalated,
                    'incidents_resolved_today' => $incidentsResolvedToday,
                    // Flags
                    'flags_pending_review' => $flagsPending,
                    'flags_under_review' => $flagsUnderReview,
                    'flags_resolved_today' => $flagsResolvedToday,
                    // Downs
                    'downs_open' => $downsOpen,
                    'downs_escalated' => $downsEscalated,
                    'downs_absconding' => $downsAbsconding,
                    'downs_resolved_today' => $downsResolvedToday,
                ];
                break;
            case 'guards':
                $summary = [
                    'guards_total' => (int) (\App\Models\Guards\Guard::count() ?? 0),
                    'active_guards' => (int) (\App\Models\Guards\Guard::active()->count() ?? 0),
                    'on_duty_now' => (int) (\App\Models\Guards\Attendance::whereDate('date', now()->toDateString())
                        ->whereNotNull('check_in_time')->whereNull('check_out_time')->count() ?? 0),
                    'sites_active' => (int) (\App\Models\Guards\ClientSite::where('status','active')->count() ?? 0),
                ];
                break;
            case 'clients':
                $summary = [
                    'clients_total' => (int) (\App\Models\Client::count() ?? 0),
                    'sites_total' => (int) (\App\Models\Guards\ClientSite::count() ?? 0),
                    'active_sites' => (int) (\App\Models\Guards\ClientSite::where('status','active')->count() ?? 0),
                ];
                break;
            case 'k9':
                $summary = [
                    'active_k9s' => 0,
                    'handlers' => 0,
                    'deployments_today' => 0,
                    'medical_checks_pending' => 0,
                ];
                break;
            case 'marketing':
                $summary = [
                    'campaigns_total' => (int) (\App\Models\MarketingCampaign::count() ?? 0),
                    'campaigns_active' => (int) (\App\Models\MarketingCampaign::where('status', 'active')->count() ?? 0),
                    'leads_total' => (int) (\App\Models\Lead::count() ?? 0),
                    'budget_total' => (float) (\App\Models\MarketingCampaign::sum('budget') ?? 0),
                ];
                break;
            case 'assets':
                $summary = [
                    'vehicles_total' => (int) (\App\Models\Vehicle::count() ?? 0),
                    'equipment_total' => (int) (\App\Models\Equipment::count() ?? 0),
                    'in_service_vehicles' => 0,
                    'in_service_equipment' => 0,
                ];
                break;
            case 'business_dev':
                $today = now();
                $monthStart = $today->copy()->startOfMonth();
                $monthEnd = $today->copy()->endOfMonth();
                $summary = [
                    'upcoming_events' => (int) (\App\Models\ClientEvent::whereDate('event_date', '>=', $today->toDateString())
                        ->whereIn('status', ['planned', 'confirmed'])->count() ?? 0),
                    'month_event_revenue' => (float) (\App\Models\ClientEvent::whereBetween('event_date', [$monthStart->toDateString(), $monthEnd->toDateString()])
                        ->whereIn('status', ['planned', 'confirmed', 'completed'])->sum('expected_amount') ?? 0),
                    'k9_events_month' => (int) (\App\Models\ClientEvent::whereBetween('event_date', [$monthStart->toDateString(), $monthEnd->toDateString()])
                        ->where('category', 'k9')->count() ?? 0),
                    'k9_units_month' => (int) (\App\Models\ClientEvent::whereBetween('event_date', [$monthStart->toDateString(), $monthEnd->toDateString()])
                        ->sum('k9_units') ?? 0),
                    'active_clients_with_events' => (int) (\App\Models\ClientEvent::distinct('client_id')->count('client_id') ?? 0),
                    'active_sites' => (int) (\App\Models\Guards\ClientSite::where('status', 'active')->count() ?? 0),
                    'total_clients' => (int) (\App\Models\Client::count() ?? 0),
                    'contracts_active' => (int) (\App\Models\Contract::where('status', 'active')->count() ?? 0),
                    'contracts_draft' => (int) (\App\Models\Contract::where('status', 'draft')->count() ?? 0),
                    'contracts_expired' => (int) (\App\Models\Contract::where('status', 'expired')->count() ?? 0),
                ];
                break;
            default:
                $summary = [];
        }

        $user = auth()->user();

        return Inertia::render('Admin/Modules/Summary', [
            'module' => $key,
            'summary' => $summary,
            'auth' => [
                'user' => [
                    'name' => $user?->name,
                ],
            ],
        ]);
    }
}
