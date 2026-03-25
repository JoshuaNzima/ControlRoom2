<?php

namespace App\Http\Controllers;

use App\Models\Guards\Client;
use App\Models\ClientSite;
use App\Models\ClientPayment;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ClientDashboardController extends Controller
{
    public function index()
    {
        $stats = [
            'total_clients' => Client::count(),
            'active_clients' => Client::active()->count(),
            'inactive_clients' => Client::where('status', 'inactive')->count(),
            'total_sites' => ClientSite::count(),
            'total_monthly_revenue' => Client::active()->sum('monthly_rate'),
            'contracts_expiring_soon' => Client::where('contract_end_date', '<=', now()->addDays(30))
                ->where('contract_end_date', '>=', now())
                ->count(),
        ];

        $recentClients = Client::with(['sites', 'supervisor'])
            ->latest()
            ->limit(5)
            ->get();

        $clientsByStatus = Client::selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        $upcomingPayments = ClientPayment::with('client')
            ->whereBetween('payment_date', [now(), now()->addDays(30)])
            ->latest()
            ->limit(10)
            ->get();

        return Inertia::render('Clients/Dashboard', [
            'stats' => $stats,
            'recentClients' => $recentClients,
            'clientsByStatus' => $clientsByStatus,
            'upcomingPayments' => $upcomingPayments,
        ]);
    }
}
