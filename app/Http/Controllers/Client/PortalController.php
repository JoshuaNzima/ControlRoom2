<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\Guards\Client;
use App\Models\Incident;
use App\Models\Invoice;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PortalController extends Controller
{
    /**
     * Get the client's linked client ID
     */
    private function getClientId(): ?int
    {
        $user = auth()->user();
        $linkedClientIds = DB::table('client_user')
            ->where('user_id', $user->id)
            ->pluck('client_id');
        
        return $linkedClientIds->first();
    }

    /**
     * Client sites page
     */
    public function sites()
    {
        $user = auth()->user();
        $clientId = $this->getClientId();

        if (!$clientId) {
            return Inertia::render('Client/Sites', [
                'auth' => ['user' => ['id' => $user->id, 'name' => $user->name, 'email' => $user->email]],
                'client' => null,
                'sites' => [],
            ]);
        }

        $client = Client::find($clientId);
        $sites = $client->sites()
            ->with(['zone:id,name'])
            ->orderBy('name')
            ->get();

        return Inertia::render('Client/Sites', [
            'auth' => ['user' => ['id' => $user->id, 'name' => $user->name, 'email' => $user->email]],
            'client' => ['id' => $client->id, 'name' => $client->name],
            'sites' => $sites->map(fn($site) => [
                'id' => $site->id,
                'name' => $site->name,
                'address' => $site->address,
                'contact_person' => $site->contact_person,
                'phone' => $site->phone,
                'required_guards' => $site->required_guards,
                'status' => $site->status,
                'site_type' => $site->site_type,
                'zone_name' => $site->zone?->name,
                'checkpoints_count' => $site->checkpoints()->count(),
            ]),
        ]);
    }

    /**
     * Client reports/incidents page
     */
    public function reports()
    {
        $user = auth()->user();
        $clientId = $this->getClientId();

        if (!$clientId) {
            return Inertia::render('Client/Reports', [
                'auth' => ['user' => ['id' => $user->id, 'name' => $user->name, 'email' => $user->email]],
                'client' => null,
                'incidents' => [],
            ]);
        }

        $client = Client::find($clientId);
        $siteIds = $client->sites()->pluck('id');

        $incidents = Incident::with(['clientSite:id,name', 'guardRelation:id,name'])
            ->whereIn('client_site_id', $siteIds)
            ->orderBy('created_at', 'desc')
            ->get([
                'id', 'title', 'description', 'type', 'severity', 'status',
                'client_site_id', 'guard_id', 'created_at', 'resolved_at'
            ]);

        return Inertia::render('Client/Reports', [
            'auth' => ['user' => ['id' => $user->id, 'name' => $user->name, 'email' => $user->email]],
            'client' => ['id' => $client->id, 'name' => $client->name],
            'incidents' => $incidents->map(fn($incident) => [
                'id' => $incident->id,
                'title' => $incident->title,
                'description' => $incident->description,
                'type' => $incident->type,
                'severity' => $incident->severity,
                'status' => $incident->status,
                'site_name' => $incident->clientSite?->name,
                'guard_name' => $incident->guardRelation?->name,
                'created_at' => $incident->created_at,
                'resolved_at' => $incident->resolved_at,
            ]),
        ]);
    }

    /**
     * Client invoices page
     */
    public function invoices()
    {
        $user = auth()->user();
        $clientId = $this->getClientId();

        if (!$clientId) {
            return Inertia::render('Client/Invoices', [
                'auth' => ['user' => ['id' => $user->id, 'name' => $user->name, 'email' => $user->email]],
                'client' => null,
                'invoices' => [],
                'paymentSummary' => null,
            ]);
        }

        $client = Client::find($clientId);

        $invoices = Invoice::where('client_id', $client->id)
            ->orderBy('created_at', 'desc')
            ->get([
                'id', 'invoice_number', 'total_amount', 'status',
                'due_date', 'billing_month', 'billing_year', 'paid_date', 'created_at'
            ]);

        $paymentSummary = $client->getPaymentSummary(now()->year);

        return Inertia::render('Client/Invoices', [
            'auth' => ['user' => ['id' => $user->id, 'name' => $user->name, 'email' => $user->email]],
            'client' => [
                'id' => $client->id,
                'name' => $client->name,
                'monthly_rate' => $client->monthly_rate,
            ],
            'invoices' => $invoices->map(fn($invoice) => [
                'id' => $invoice->id,
                'invoice_number' => $invoice->invoice_number,
                'total_amount' => $invoice->total_amount,
                'status' => $invoice->status,
                'due_date' => $invoice->due_date,
                'billing_month' => $invoice->billing_month,
                'billing_year' => $invoice->billing_year,
                'billing_period' => $invoice->billing_month && $invoice->billing_year
                    ? "{$invoice->billing_month}/{$invoice->billing_year}"
                    : null,
                'paid_date' => $invoice->paid_date,
                'created_at' => $invoice->created_at,
            ]),
            'paymentSummary' => $paymentSummary ? [
                'expected_amount' => $paymentSummary['expected_amount'] ?? 0,
                'total_due' => $paymentSummary['total_due'] ?? 0,
                'total_paid' => $paymentSummary['total_paid'] ?? 0,
                'outstanding_amount' => $paymentSummary['outstanding_amount'] ?? 0,
                'outstanding_months' => $paymentSummary['outstanding_months'] ?? 0,
                'is_overdue' => $paymentSummary['is_overdue'] ?? false,
            ] : null,
        ]);
    }
}
