<?php

namespace App\Http\Controllers\Finance;

use App\Models\Invoice;
use App\Models\ClientPayment;
use App\Models\Guards\Client as GuardClient;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

class InvoiceController extends Controller
{
    /**
     * Display a listing of invoices
     */
    public function index(Request $request)
    {
        $query = Invoice::with('user')
            ->orderBy('invoice_date', 'desc');

        // Filter by status
        if ($request->filled('status')) {
            $query->byStatus($request->status);
        }

        // Filter by date range
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->byDateRange($request->start_date, $request->end_date);
        }

        $invoices = $query->paginate(15)->withQueryString();

        // Calculate summary
        $summary = [
            'total' => Invoice::sum('total_amount'),
            'paid' => Invoice::paid()->sum('total_amount'),
            'unpaid' => Invoice::unpaid()->sum('total_amount'),
            'overdue' => Invoice::overdue()->count(),
        ];

        return Inertia::render('Finance/Invoices/Index', [
            'invoices' => $invoices,
            'summary' => $summary,
            'filters' => [
                'status' => $request->status,
                'start_date' => $request->start_date,
                'end_date' => $request->end_date,
            ],
        ]);
    }

    /**
     * Show the form for creating a new invoice
     */
    public function create()
    {
        $clients = GuardClient::select('id', 'name', 'contact_person', 'phone', 'email', 'monthly_rate')
            ->orderBy('name')
            ->get();

        return Inertia::render('Finance/Invoices/Create', [
            'clients' => $clients,
            'defaultBilling' => [
                'year' => now()->year,
                'month' => now()->month,
            ],
        ]);
    }

    /**
     * Store a newly created invoice
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'invoice_number' => 'required|string|unique:invoices',
            'client_id' => 'nullable|exists:clients,id',
            'client_name' => 'required|string|max:255',
            'client_email' => 'nullable|email',
            'billing_year' => 'nullable|integer|min:2000|max:2100',
            'billing_month' => 'nullable|integer|min:1|max:12',
            'subtotal' => 'required|numeric|min:0',
            'tax_percentage' => 'numeric|min:0|max:100',
            'tax_amount' => 'numeric|min:0',
            'discount_amount' => 'numeric|min:0',
            'total_amount' => 'required|numeric|min:0.01',
            'invoice_date' => 'required|date',
            'due_date' => 'required|date|after_or_equal:invoice_date',
            'description' => 'nullable|string',
            'notes' => 'nullable|string',
            'line_items' => 'required|array|min:1',
        ]);

        $issueDate = Carbon::parse($validated['invoice_date']);
        $billingYear = $validated['billing_year'] ?? $issueDate->year;
        $billingMonth = $validated['billing_month'] ?? $issueDate->month;

        $invoice = Invoice::create([
            ...$validated,
            'user_id' => Auth::id(),
            'status' => 'draft',
            'billing_year' => $billingYear,
            'billing_month' => $billingMonth,
        ]);

        // Create line items
        if ($request->has('line_items')) {
            foreach ($request->line_items as $item) {
                $invoice->lineItems()->create([
                    'description' => $item['description'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'line_total' => $item['quantity'] * $item['unit_price'],
                ]);
            }
        }

        return redirect()->route('finance.invoices.show', $invoice)
            ->with('success', 'Invoice created successfully.');
    }

    /**
     * Display a specific invoice
     */
    public function show(Invoice $invoice)
    {
        $invoice->load('user', 'lineItems', 'client');

        return Inertia::render('Finance/Invoices/Show', [
            'invoice' => $invoice,
        ]);
    }

    /**
     * Show the form for editing an invoice
     */
    public function edit(Invoice $invoice)
    {
        $this->authorize('update', $invoice);

        $invoice->load('lineItems', 'client');

        $clients = GuardClient::select('id', 'name', 'contact_person', 'phone', 'email', 'monthly_rate')
            ->orderBy('name')
            ->get();

        return Inertia::render('Finance/Invoices/Edit', [
            'invoice' => $invoice,
            'clients' => $clients,
        ]);
    }

    /**
     * Update an invoice
     */
    public function update(Request $request, Invoice $invoice)
    {
        $this->authorize('update', $invoice);

        $validated = $request->validate([
            'client_id' => 'nullable|exists:clients,id',
            'client_name' => 'required|string|max:255',
            'client_email' => 'nullable|email',
            'billing_year' => 'nullable|integer|min:2000|max:2100',
            'billing_month' => 'nullable|integer|min:1|max:12',
            'subtotal' => 'required|numeric|min:0',
            'tax_percentage' => 'numeric|min:0|max:100',
            'tax_amount' => 'numeric|min:0',
            'discount_amount' => 'numeric|min:0',
            'total_amount' => 'required|numeric|min:0.01',
            'invoice_date' => 'required|date',
            'due_date' => 'required|date|after_or_equal:invoice_date',
            'description' => 'nullable|string',
            'notes' => 'nullable|string',
            'line_items' => 'required|array|min:1',
        ]);

        $issueDate = Carbon::parse($validated['invoice_date']);
        $billingYear = $validated['billing_year'] ?? $invoice->billing_year ?? $issueDate->year;
        $billingMonth = $validated['billing_month'] ?? $invoice->billing_month ?? $issueDate->month;

        $invoice->update($validated + [
            'invoice_date' => $validated['invoice_date'],
            'due_date' => $validated['due_date'],
            'billing_year' => $billingYear,
            'billing_month' => $billingMonth,
        ]);

        // Update line items
        $invoice->lineItems()->delete();
        if ($request->has('line_items')) {
            foreach ($request->line_items as $item) {
                $invoice->lineItems()->create([
                    'description' => $item['description'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'line_total' => $item['quantity'] * $item['unit_price'],
                ]);
            }
        }

        return redirect()->route('finance.invoices.show', $invoice)
            ->with('success', 'Invoice updated successfully.');
    }

    /**
     * Delete an invoice
     */
    public function destroy(Invoice $invoice)
    {
        $this->authorize('delete', $invoice);

        $invoice->delete();

        return redirect()->route('finance.invoices.index')
            ->with('success', 'Invoice deleted successfully.');
    }

    /**
     * Mark invoice as sent
     */
    public function send(Invoice $invoice)
    {
        $this->authorize('update', $invoice);

        $invoice->markAsSent();

        return back()->with('success', 'Invoice marked as sent.');
    }

    /**
     * Mark invoice as paid
     */
    public function markPaid(Invoice $invoice)
    {
        $this->authorize('update', $invoice);

        $wasPaid = $invoice->status === 'paid';

        $invoice->markAsPaid();

        if (! $wasPaid) {
            $this->syncClientPaymentForInvoice($invoice);
        }

        return back()->with('success', 'Invoice marked as paid.');
    }

    /**
     * Cancel an invoice
     */
    public function cancel(Invoice $invoice)
    {
        $this->authorize('update', $invoice);

        $invoice->markAsCancelled();

        return back()->with('success', 'Invoice cancelled.');
    }

    /**
     * One-way sync from Finance invoice payments into the Admin Payment Checker.
     *
     * When an invoice is marked as paid, update or create a ClientPayment row
     * for the inferred client/year/month. This never changes invoice status
     * and does not attempt to reverse payments from the checker side.
     */
    private function syncClientPaymentForInvoice(Invoice $invoice): void
    {
        try {
            // Determine guarding client
            $clientId = $invoice->client_id;

            if (! $clientId && $invoice->client_name) {
                $client = GuardClient::where('name', $invoice->client_name)->first();
                if ($client) {
                    $clientId = $client->id;
                    // Persist back-link for future syncs
                    if (! $invoice->client_id) {
                        $invoice->client_id = $clientId;
                        $invoice->save();
                    }
                }
            }

            if (! $clientId) {
                return; // Cannot map this invoice to a guarding client
            }

            $client = GuardClient::find($clientId);
            if (! $client) {
                return;
            }

            // Determine billing period – prefer explicit fields, fall back to invoice_date
            $date = $invoice->invoice_date ?? now();
            $year = $invoice->billing_year ?: (int) $date->year;
            $month = $invoice->billing_month ?: (int) $date->month;

            if ($year <= 0 || $month < 1 || $month > 12) {
                return;
            }

            $amountDue = $client->getMonthlyDueAmount();

            $payment = ClientPayment::firstOrCreate(
                [
                    'client_id' => $clientId,
                    'year' => $year,
                    'month' => $month,
                ],
                [
                    'paid' => false,
                    'amount_due' => $amountDue,
                    'amount_paid' => 0,
                    'prepaid_amount' => 0,
                ]
            );

            if (! $payment->amount_due) {
                $payment->amount_due = $amountDue;
            }

            $payment->amount_paid = (float) $payment->amount_paid + (float) $invoice->total_amount;

            if ($payment->amount_due > 0 && $payment->amount_paid >= $payment->amount_due) {
                $payment->paid = true;
            }

            $payment->save();
        } catch (\Throwable $e) {
            Log::warning('Failed to sync invoice payment into client payments', [
                'invoice_id' => $invoice->id,
                'message' => $e->getMessage(),
            ]);
        }
    }
}
