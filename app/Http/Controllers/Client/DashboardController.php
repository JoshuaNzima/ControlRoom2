<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\Guards\Client;
use App\Models\Guards\Attendance;
use App\Models\Guards\Shift;
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
                    'guardsOnDuty' => 0,
                    'monthlyReports' => 0,
                    'activeAlerts' => 0,
                ],
                'sites' => [],
                'recentIncidents' => [],
                'invoices' => [],
                'contractStatus' => null,
                'guardsOnDuty' => [],
                'todayShifts' => [],
                'activityFeed' => [],
                'notifications' => [],
            ]);
        }

        // Load primary client (first linked client for now)
        $primaryClientId = $linkedClientIds->first();
        $client = Client::with(['sites' => function ($query) {
            $query->where('status', 'active');
        }, 'services', 'supervisor:id,name', 'sergeant:id,name'])
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

        // Get guards currently on duty (checked in today, not checked out)
        $guardsOnDuty = Attendance::with(['guardRelation:id,name,phone,position', 'clientSite:id,name'])
            ->whereIn('client_site_id', $siteIds)
            ->whereDate('date', today())
            ->whereNotNull('check_in_time')
            ->whereNull('check_out_time')
            ->get()
            ->map(fn($att) => [
                'id' => $att->id,
                'guard_id' => $att->guard_id,
                'guard_name' => $att->guardRelation?->name,
                'guard_phone' => $att->guardRelation?->phone,
                'position' => $att->guardRelation?->position,
                'site_id' => $att->client_site_id,
                'site_name' => $att->clientSite?->name,
                'check_in_time' => $att->check_in_time?->toISOString(),
                'status' => $att->status,
                'hours_worked' => $att->hours_worked,
            ]);

        // Get today's shifts
        $todayShifts = Shift::with(['guardRelation:id,name,phone', 'clientSite:id,name'])
            ->whereIn('client_site_id', $siteIds)
            ->whereDate('date', today())
            ->orderBy('start_time')
            ->get()
            ->map(fn($shift) => [
                'id' => $shift->id,
                'guard_id' => $shift->guard_id,
                'guard_name' => $shift->guardRelation?->name,
                'site_id' => $shift->client_site_id,
                'site_name' => $shift->clientSite?->name,
                'start_time' => $shift->start_time?->format('H:i'),
                'end_time' => $shift->end_time?->format('H:i'),
                'status' => $shift->status,
                'status_color' => $shift->status_color,
                'shift_type' => $shift->shift_type,
                'is_late' => $shift->is_late,
            ]);

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

        // Build activity feed (recent attendance + incidents)
        $activityFeed = collect();

        // Recent check-ins
        $recentAttendance = Attendance::with(['guardRelation:id,name', 'clientSite:id,name'])
            ->whereIn('client_site_id', $siteIds)
            ->whereNotNull('check_in_time')
            ->orderBy('check_in_time', 'desc')
            ->limit(10)
            ->get();

        foreach ($recentAttendance as $att) {
            $activityFeed->push([
                'id' => 'att_' . $att->id,
                'type' => 'check_in',
                'title' => $att->check_out_time ? 'Shift Completed' : 'Checked In',
                'description' => $att->guardRelation?->name . ' at ' . $att->clientSite?->name,
                'timestamp' => ($att->check_out_time ?? $att->check_in_time)?->toISOString(),
                'icon' => $att->check_out_time ? 'LogOut' : 'LogIn',
                'color' => $att->check_out_time ? 'blue' : 'green',
            ]);
        }

        // Recent incidents
        foreach ($recentIncidents as $incident) {
            $activityFeed->push([
                'id' => 'inc_' . $incident->id,
                'type' => 'incident',
                'title' => $incident->title,
                'description' => $incident->clientSite?->name . ' - ' . ucfirst($incident->severity),
                'timestamp' => $incident->created_at->toISOString(),
                'icon' => 'AlertTriangle',
                'color' => $incident->severity === 'critical' ? 'red' : 'amber',
            ]);
        }

        // Sort by timestamp
        $activityFeed = $activityFeed->sortByDesc('timestamp')->take(15)->values();

        // Build notifications
        $notifications = collect();

        // Contract expiry notification
        $contractStatus = $this->getContractStatus($client);
        if ($contractStatus['status'] === 'expiring' || $contractStatus['status'] === 'expired') {
            $notifications->push([
                'id' => 'contract',
                'type' => 'warning',
                'title' => 'Contract ' . ($contractStatus['status'] === 'expired' ? 'Expired' : 'Expiring Soon'),
                'message' => $contractStatus['message'],
                'icon' => 'FileWarning',
                'action_url' => route('client.invoices'),
            ]);
        }

        // Overdue invoices
        $overdueInvoices = Invoice::where('client_id', $client->id)
            ->where('status', 'overdue')
            ->count();
        if ($overdueInvoices > 0) {
            $notifications->push([
                'id' => 'overdue',
                'type' => 'error',
                'title' => 'Overdue Invoices',
                'message' => "You have {$overdueInvoices} overdue invoice(s)",
                'icon' => 'CreditCard',
                'action_url' => route('client.invoices'),
            ]);
        }

        // Open incidents
        if ($activeAlerts > 0) {
            $notifications->push([
                'id' => 'incidents',
                'type' => 'warning',
                'title' => 'Open Incidents',
                'message' => "{$activeAlerts} unresolved incident(s) require attention",
                'icon' => 'AlertCircle',
                'action_url' => route('client.reports'),
            ]);
        }

        // Payment summary for current year
        $paymentSummary = $client->getPaymentSummary(now()->year);

        // Add payment overdue notification
        if ($paymentSummary && $paymentSummary['is_overdue']) {
            $notifications->push([
                'id' => 'payment',
                'type' => 'error',
                'title' => 'Payment Overdue',
                'message' => 'Outstanding balance: ' . number_format($paymentSummary['outstanding_amount'], 2) . ' MWK',
                'icon' => 'Wallet',
                'action_url' => route('client.invoices'),
            ]);
        }

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
                'supervisor_name' => $client->supervisor?->name,
                'sergeant_name' => $client->sergeant?->name,
            ],
            'stats' => [
                'activeSites' => $client->sites->count(),
                'totalGuards' => $activeGuards,
                'guardsOnDuty' => $guardsOnDuty->count(),
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
            'guardsOnDuty' => $guardsOnDuty,
            'todayShifts' => $todayShifts,
            'activityFeed' => $activityFeed,
            'notifications' => $notifications,
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


