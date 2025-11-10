<?php

namespace App\Services\Operations;

use App\Models\Alert;
use App\Models\Incident;
use App\Models\Flag;
use App\Models\Ticket;
use App\Models\ClientSite;
use App\Models\Guards\Guard;
use App\Models\Guards\GuardAssignment;
use Illuminate\Support\Facades\Cache;

class DashboardStatsService
{
    const CACHE_KEY_STATS = 'operations_manager_stats';
    const CACHE_KEY_REPORT = 'operations_manager_report';
    const CACHE_TTL = 300; // 5 minutes

    public function getStats()
    {
        return Cache::remember(self::CACHE_KEY_STATS, self::CACHE_TTL, function () {
            return [
                'active_sites' => ClientSite::where('status', 'active')->count(),
                'total_guards' => Guard::count(),
                'active_alerts' => Alert::where('status', 'active')->count(),
                'pending_assignments' => GuardAssignment::where('is_active', false)->count(),
                'open_tickets' => Ticket::where('status', 'open')->count(),
            ];
        });
    }

    public function getReportSummary()
    {
        return Cache::remember(self::CACHE_KEY_REPORT, self::CACHE_TTL, function () {
            return [
                'incidents_last_7_days' => Incident::where('created_at', '>=', now()->subDays(7))->count(),
                'flags_last_7_days' => Flag::where('created_at', '>=', now()->subDays(7))->count(),
            ];
        });
    }

    public function clearCache()
    {
        Cache::forget(self::CACHE_KEY_STATS);
        Cache::forget(self::CACHE_KEY_REPORT);
    }
}