<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\Guards\Client;
use App\Models\Incident;
use App\Models\Invoice;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        // Get client's linked clients (a user can be linked to multiple clients)
        $linkedClientIds = DB::table('client_user')
            ->where('user_id', $user->id)
            ->pluck('client_id');

        // If no linked clients, show empty dashboard
        if ($linkedClientIds->isEmpty()) {
            return Inertia::render('Client/Dashboard', [
                'auth' => [
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                    ]
                ],
                'client' => null,
                'stats' => [
                    'activeSites' => 0,
                    'totalGuards' => 0,
                    'monthlyReports' => 0,
                    'activeAlerts' => 0,
                ],
                'sites' => [],
                'recentIncidents' => [],
                'invoices' => [],
                'contractStatus' => null,
            ]);
        }

        // Load primary client (first linked client for now)
        $primaryClientId = $linkedClientIds->first();
        $client = Client::with(['sites' => function ($query) {
            $query->where('status', 'active');
        }, 'services'])
            ->find($primaryClientId);

        // Get all client site IDs
        $siteIds = $client->sites->pluck('id');

        // Count active guards across all sites
        $activeGuards = DB::table('guard_assignments')
            ->whereIn('client_site_id', $siteIds)
            ->where('is_active', true)
            ->where('start_date', '<=', today())
            ->where(function ($q) {
                $q->whereNull('end_date')
                    ->orWhere('end_date', '>=', today());
            })
            ->distinct('guard_id')
            ->count('guard_id');

        // Get monthly incident count
        $monthlyIncidents = Incident::whereIn('client_site_id', $siteIds)
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();

        // Get active/open incidents count
        $activeAlerts = Incident::whereIn('client_site_id', $siteIds)
            ->where('status', 'open')
            ->count();

        // Get recent incidents (last 5)
        $recentIncidents = Incident::with(['clientSite:id,name', 'guardRelation:id,name'])
            ->whereIn('client_site_id', $siteIds)
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get(['id', 'title', 'type', 'severity', 'status', 'client_site_id', 'guard_id', 'created_at']);

        // Get recent invoices for this client
        $invoices = Invoice::where('client_id', $client->id)
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get(['id', 'invoice_number', 'total_amount', 'status', 'due_date', 'billing_month', 'billing_year']);

        // Calculate contract status
        $contractStatus = $this->getContractStatus($client);

        // Payment summary for current year
        $paymentSummary = $client->getPaymentSummary(now()->year);

        return Inertia::render('Client/Dashboard', [
            'auth' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                ]
            ],
            'client' => [
                'id' => $client->id,
                'name' => $client->name,
                'contact_person' => $client->contact_person,
                'email' => $client->email,
                'phone' => $client->phone,
                'contract_start_date' => $client->contract_start_date?->toDateString(),
                'contract_end_date' => $client->contract_end_date?->toDateString(),
                'monthly_rate' => $client->getMonthlyDueAmount(),
                'status' => $client->status,
            ],
            'stats' => [
                'activeSites' => $client->sites->count(),
                'totalGuards' => $activeGuards,
                'monthlyReports' => $monthlyIncidents,
                'activeAlerts' => $activeAlerts,
            ],
            'sites' => $client->sites->map(fn($site) => [
                'id' => $site->id,
                'name' => $site->name,
                'address' => $site->address,
                'contact_person' => $site->contact_person,
                'phone' => $site->phone,
                'required_guards' => $site->required_guards,
                'status' => $site->status,
                'site_type' => $site->site_type,
            ]),
            'recentIncidents' => $recentIncidents->map(fn($incident) => [
                'id' => $incident->id,
                'title' => $incident->title,
                'type' => $incident->type,
                'severity' => $incident->severity,
                'status' => $incident->status,
                'site_name' => $incident->clientSite?->name,
                'guard_name' => $incident->guardRelation?->name,
                'created_at' => $incident->created_at->toISOString(),
            ]),
            'invoices' => $invoices->map(fn($invoice) => [
                'id' => $invoice->id,
                'invoice_number' => $invoice->invoice_number,
                'total_amount' => $invoice->total_amount,
                'status' => $invoice->status,
                'due_date' => $invoice->due_date?->toDateString(),
                'billing_period' => $invoice->billing_month
                    ? now()->month($invoice->billing_month)->format('F Y')
                    : null,
            ]),
            'contractStatus' => $contractStatus,
            'paymentSummary' => $paymentSummary,
        ]);
    }

    private function getContractStatus(Client $client): array
    {
        if (!$client->contract_end_date) {
            return [
                'status' => 'active',
                'message' => 'Contract active (no end date)',
                'days_remaining' => null,
                'is_expiring_soon' => false,
            ];
        }

        $daysRemaining = now()->diffInDays($client->contract_end_date, false);
        $isExpiringSoon = $daysRemaining <= 30 && $daysRemaining > 0;
        $isExpired = $daysRemaining < 0;

        if ($isExpired) {
            return [
                'status' => 'expired',
                'message' => 'Contract expired ' . abs($daysRemaining) . ' days ago',
                'days_remaining' => $daysRemaining,
                'is_expiring_soon' => false,
            ];
        }

        if ($isExpiringSoon) {
            return [
                'status' => 'expiring',
                'message' => 'Contract expires in ' . $daysRemaining . ' days',
                'days_remaining' => $daysRemaining,
                'is_expiring_soon' => true,
            ];
        }

        return [
            'status' => 'active',
            'message' => 'Contract active - ' . $daysRemaining . ' days remaining',
            'days_remaining' => $daysRemaining,
            'is_expiring_soon' => false,
        ];
    }
}


