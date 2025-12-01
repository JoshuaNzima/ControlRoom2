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
