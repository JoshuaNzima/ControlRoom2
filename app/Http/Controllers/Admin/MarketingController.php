<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MarketingCampaign;
use Inertia\Inertia;

class MarketingController extends Controller
{
    public function index()
    {
        $summary = [
            'total_campaigns' => (int) MarketingCampaign::count(),
            'active_campaigns' => (int) MarketingCampaign::where('status', 'active')->count(),
            'planned_campaigns' => (int) MarketingCampaign::where('status', 'planned')->count(),
            'completed_campaigns' => (int) MarketingCampaign::where('status', 'completed')->count(),
            'total_budget' => (float) MarketingCampaign::sum('budget'),
        ];

        $byChannel = MarketingCampaign::selectRaw('channel, COUNT(*) as count, SUM(budget) as budget')
            ->groupBy('channel')
            ->orderByDesc('count')
            ->get();

        $recent = MarketingCampaign::orderByDesc('created_at')
            ->limit(8)
            ->get();

        $campaigns = MarketingCampaign::orderByDesc('created_at')
            ->paginate(10);

        $user = auth()->user();

        return Inertia::render('Admin/Marketing', [
            'summary' => $summary,
            'byChannel' => $byChannel,
            'recent' => $recent,
            'campaigns' => $campaigns,
            'channels' => MarketingCampaign::CHANNELS,
            'statuses' => MarketingCampaign::STATUSES,
            'auth' => [
                'user' => [
                    'name' => $user?->name,
                    'roles' => $user?->roles ?? ['admin'],
                    'permissions' => $user?->permissions ?? [],
                ],
            ],
        ]);
    }
}
