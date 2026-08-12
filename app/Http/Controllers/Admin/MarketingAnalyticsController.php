<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MarketingCampaign;
use App\Models\Lead;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class MarketingAnalyticsController extends Controller
{
    public function index()
    {
        $campaignsByStatus = MarketingCampaign::select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status')->get();

        $leadsBySource = Lead::select('source', DB::raw('COUNT(*) as count'))
            ->groupBy('source')->get();

        $conversions = Lead::where('status', 'converted')->count();

        $budgetByMonth = MarketingCampaign::selectRaw('DATE_FORMAT(start_date, "%Y-%m") as ym, SUM(budget) as total')
            ->groupBy('ym')->orderBy('ym')->get();

        $user = auth()->user();

        return Inertia::render('Admin/MarketingAnalytics', [
            'campaignsByStatus' => $campaignsByStatus,
            'leadsBySource' => $leadsBySource,
            'conversions' => $conversions,
            'budgetByMonth' => $budgetByMonth,
            'auth' => [
                'user' => [
                    'name' => $user?->name,
                ],
            ],
        ]);
    }
}
