<?php

namespace App\Http\Controllers\Finance;

use App\Models\Invoice;
use App\Models\InvoiceAuditLog;
use App\Models\ClientPayment;
use App\Models\Guards\Client as GuardClient;
use App\Models\Service;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use App\Mail\InvoiceMailable;
use App\Mail\InvoicePaymentReceived;
use Barryvdh\DomPDF\Facade\Pdf;

class InvoiceController extends Controller
{
    /**
     * Log invoice action to audit log
     */
    private function logInvoiceAction(
        Invoice $invoice,
        string $action,
        ?string $field = null,
        ?string $oldValue = null,
        ?string $newValue = null,
        ?string $notes = null
    ): void {
        InvoiceAuditLog::log(
            $invoice->id,
            Auth::id(),
            $action,
            $field,
            $oldValue,
            $newValue,
            $notes
        );
    }
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

        $clients = GuardClient::select('id', 'name', 'contact_person', 'phone', 'email', 'monthly_rate')
            ->orderBy('name')
            ->get();

        return Inertia::render('Finance/Invoices/Index', [
            'invoices' => $invoices,
            'summary' => $summary,
            'filters' => [
                'status' => $request->status,
                'start_date' => $request->start_date,
                'end_date' => $request->end_date,
            ],
            'clients' => $clients,
            'defaultBilling' => [
                'year' => now()->year,
                'month' => now()->month,
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
            'invoice_number' => 'nullable|string|unique:invoices,invoice_number',
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

        $invoice = DB::transaction(function () use ($validated, $billingYear, $billingMonth, $request) {
            $invoiceNumber = $validated['invoice_number'] ?? $this->generateInvoiceNumber();

            $invoice = Invoice::create(array_merge($validated, [
                'invoice_number' => $invoiceNumber,
                'user_id' => Auth::id(),
                'status' => 'draft',
                'billing_year' => $billingYear,
                'billing_month' => $billingMonth,
            ]));

            if ($request->has('line_items')) {
                foreach ($request->line_items as $item) {
                    if (! isset($item['description']) || $item['description'] === '') {
                        continue;
                    }
                    $qty = (float) ($item['quantity'] ?? 1);
                    $price = (float) ($item['unit_price'] ?? 0);
                    $invoice->lineItems()->create([
                        'description' => e($item['description']), // Sanitize
                        'quantity' => $qty,
                        'unit_price' => $price,
                        'line_total' => $qty * $price,
                    ]);
                }
            }

            return $invoice;
        });

        $this->logInvoiceAction($invoice, 'created', null, null, null, 'Invoice created with total: ' . $invoice->total_amount);

        return redirect()->route('finance.invoices.show', $invoice)
            ->withSuccess('Invoice created successfully.');
    }

    /**
     * Display a specific invoice
     */
    public function show(Request $request, Invoice $invoice)
    {
        $invoice->load('user', 'lineItems', 'client', 'payments.recordedBy');

        $data = $invoice->toArray();
        if (isset($data['line_items'])) {
            $data['lineItems'] = $data['line_items'];
            unset($data['line_items']);
        }

        // Calculate payment totals
        $totalPaid = $invoice->payments->sum('amount');
        $balanceDue = max(0, $invoice->total_amount - $totalPaid);
        $data['paymentSummary'] = [
            'total_paid' => $totalPaid,
            'balance_due' => $balanceDue,
            'payment_count' => $invoice->payments->count(),
        ];

        if (! $request->header('X-Inertia') && ($request->wantsJson() || $request->ajax())) {
            return response()->json($data);
        }

        return Inertia::render('Finance/Invoices/Show', [
            'invoice' => $data,
        ]);
    }

    public function print(Request $request, Invoice $invoice)
    {
        $invoice->load('user', 'lineItems', 'client');

        $data = $invoice->toArray();
        if (isset($data['line_items'])) {
            $data['lineItems'] = $data['line_items'];
            unset($data['line_items']);
        }

        return Inertia::render('Finance/Invoices/Print', [
            'invoice' => $data,
        ]);
    }

    public function preview(Request $request, Invoice $invoice)
    {
        $invoice->load('user', 'lineItems', 'client');

        $data = $invoice->toArray();
        if (isset($data['line_items'])) {
            $data['lineItems'] = $data['line_items'];
            unset($data['line_items']);
        }

        // Always return HTML view - never JSON for preview
        return Inertia::render('Finance/Invoices/Preview', [
            'invoice' => $data,
            'isPreview' => true,
        ]);
    }

    public function pdf(Request $request, Invoice $invoice)
    {
        $invoice->load('user', 'lineItems', 'client');
        $file = sprintf('Invoice-%s.pdf', $invoice->invoice_number ?: $invoice->id);
        $pdf = Pdf::loadView('pdf.invoice', [
            'invoice' => $invoice,
            'appName' => config('app.name'),
        ])->setPaper('a4', 'portrait');
        return $pdf->download($file);
    }

    /**
     * Show the form for editing an invoice
     */
    public function edit(Invoice $invoice)
    {
        $this->authorize('update', $invoice);

        $invoice->load('lineItems', 'client');

        $data = $invoice->toArray();
        if (isset($data['line_items'])) {
            $data['lineItems'] = $data['line_items'];
            unset($data['line_items']);
        }

        $clients = GuardClient::select('id', 'name', 'contact_person', 'phone', 'email', 'monthly_rate')
            ->orderBy('name')
            ->get();

        return Inertia::render('Finance/Invoices/Edit', [
            'invoice' => $data,
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
                    'description' => e($item['description']), // Sanitize
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'line_total' => $item['quantity'] * $item['unit_price'],
                ]);
            }
        }

        $this->logInvoiceAction($invoice, 'updated');

        return redirect()->route('finance.invoices.show', $invoice)
            ->withSuccess('Invoice updated successfully.');
    }

    /**
     * Delete an invoice
     */
    public function destroy(Invoice $invoice)
    {
        $this->authorize('delete', $invoice);

        $this->logInvoiceAction($invoice, 'deleted', null, null, null, 'Invoice deleted by user');

        $invoice->delete();

        return redirect()->route('finance.invoices.index')
            ->withSuccess('Invoice deleted successfully.');
    }

    /**
     * Mark invoice as sent
     */
    public function send(Request $request, Invoice $invoice)
    {
        $this->authorize('update', $invoice);

        $channels = $request->input('channels', ['email', 'whatsapp']);
        if (is_string($channels)) {
            $channels = explode(',', $channels);
        }

        $sentAny = false;
        try {
            if (in_array('email', $channels)) {
                $this->sendInvoiceEmail($invoice);
                $sentAny = true;
            }
        } catch (\Throwable $e) {
            Log::warning('Invoice email send failed', ['invoice_id' => $invoice->id, 'error' => $e->getMessage()]);
        }

        try {
            if (in_array('whatsapp', $channels)) {
                $this->sendInvoiceWhatsApp($invoice);
                $sentAny = true;
            }
        } catch (\Throwable $e) {
            Log::warning('Invoice WhatsApp send failed', ['invoice_id' => $invoice->id, 'error' => $e->getMessage()]);
        }

        if ($sentAny) {
            $oldStatus = $invoice->status;
            $invoice->markAsSent();
            $this->logInvoiceAction($invoice, 'status_changed', 'status', $oldStatus, 'sent', 'Invoice sent via: ' . implode(', ', $channels));
            return back()->withSuccess('Invoice sent.');
        }

        return back()->withWarning('No delivery channels configured or client has no contact details.');
    }

    /**
     * Return next invoice number suggestion.
     */
    public function nextNumber()
    {
        return response()->json(['success' => true, 'invoice_number' => $this->generateInvoiceNumber()]);
    }

    /**
     * Suggest line items from client services (with custom_price fallback).
     */
    public function serviceLineItems(Request $request)
    {
        $request->validate([
            'client_id' => 'required|exists:clients,id',
        ]);

        $client = GuardClient::with(['services' => function ($q) {
            $q->where('active', true);
        }])->find($request->client_id);

        if (! $client) {
            return response()->json(['success' => true, 'items' => []]);
        }

        $items = [];
        foreach ($client->services as $service) {
            $unit = (float) ($service->pivot->custom_price ?? $service->monthly_price ?? 0);
            $qty = (int) ($service->pivot->quantity ?? 1);
            $items[] = [
                'description' => $service->name,
                'quantity' => $qty > 0 ? $qty : 1,
                'unit_price' => $unit,
            ];
        }

        // Always append one empty custom line item slot
        $items[] = [
            'description' => '',
            'quantity' => 1,
            'unit_price' => 0,
        ];

        return response()->json(['success' => true, 'items' => $items]);
    }

    private function generateInvoiceNumber(): string
    {
        $prefix = now()->format('Ym'); // e.g. 202511
        $last = Invoice::whereYear('invoice_date', now()->year)
            ->whereMonth('invoice_date', now()->month)
            ->orderByDesc('id')
            ->first();

        $seq = 0;
        if ($last && $last->invoice_number && preg_match('/INV-' . $prefix . '-(\d{4})/', $last->invoice_number, $m)) {
            $seq = (int) $m[1];
        }
        $seq++;
        return sprintf('INV-%s-%04d', $prefix, $seq);
    }

    private function sendInvoiceEmail(Invoice $invoice): void
    {
        $invoice->loadMissing('user', 'lineItems', 'client');
        $to = $invoice->client_email ?: ($invoice->client->email ?? null);
        if (! $to) {
            return;
        }
        Mail::to($to)->send(new InvoiceMailable($invoice));
    }

    private function sendInvoiceWhatsApp(Invoice $invoice): void
    {
        $invoice->loadMissing('client');
        $toPhone = optional($invoice->client)->phone;
        $token = env('WHATSAPP_TOKEN');
        $phoneId = env('WHATSAPP_PHONE_ID');
        if (! $toPhone || ! $token || ! $phoneId) {
            return;
        }

        $body = sprintf(
            "Invoice %s for %s is %s and due on %s. Total: MWK %s",
            $invoice->invoice_number,
            $invoice->client_name,
            strtoupper($invoice->status),
            optional($invoice->due_date)->format('Y-m-d'),
            number_format((float) $invoice->total_amount, 2)
        );

        // WhatsApp Cloud API simple text template
        $url = sprintf('https://graph.facebook.com/v18.0/%s/messages', $phoneId);
        Http::withToken($token)->post($url, [
            'messaging_product' => 'whatsapp',
            'to' => $toPhone,
            'type' => 'text',
            'text' => ['body' => $body],
        ]);
    }

    /**
     * Mark invoice as paid
     */
    public function markPaid(Invoice $invoice)
    {
        $this->authorize('update', $invoice);

        $wasPaid = $invoice->status === 'paid';
        $oldStatus = $invoice->status;

        $invoice->markAsPaid();

        if (! $wasPaid) {
            $this->syncClientPaymentForInvoice($invoice, 'add');
            $this->logInvoiceAction($invoice, 'status_changed', 'status', $oldStatus, 'paid', 'Invoice marked as paid');
        }

        return back()->withSuccess('Invoice marked as paid.');
    }

    /**
     * Cancel an invoice
     */
    public function cancel(Invoice $invoice)
    {
        $this->authorize('update', $invoice);

        $oldStatus = $invoice->status;

        // Reverse payment sync if invoice was previously paid
        if ($invoice->status === 'paid') {
            $this->syncClientPaymentForInvoice($invoice, 'remove');
        }

        $invoice->markAsCancelled();

        $this->logInvoiceAction($invoice, 'status_changed', 'status', $oldStatus, 'cancelled', 'Invoice cancelled');

        return back()->withSuccess('Invoice cancelled.');
    }

    /**
     * Record a partial payment on an invoice
     */
    public function recordPayment(Request $request, Invoice $invoice)
    {
        $this->authorize('update', $invoice);

        // Prevent payments on cancelled invoices
        if ($invoice->status === 'cancelled') {
            return back()->withError('Cannot record payments on cancelled invoices.');
        }

        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01|max:' . $invoice->total_amount,
            'payment_date' => 'required|date',
            'payment_method' => 'nullable|string|in:cash,bank_transfer,cheque,mobile_money,other',
            'reference' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        // Calculate total payments already recorded
        $existingPayments = (float) ($invoice->payments()->sum('amount') ?? 0);
        $newTotal = $existingPayments + (float) $validated['amount'];

        // Create payment record
        $payment = $invoice->payments()->create([
            'amount' => $validated['amount'],
            'payment_date' => $validated['payment_date'],
            'payment_method' => $validated['payment_method'] ?? 'other',
            'reference' => e($validated['reference'] ?? ''), // Sanitize
            'notes' => e($validated['notes'] ?? ''), // Sanitize
            'recorded_by' => Auth::id(),
        ]);

        $this->logInvoiceAction($invoice, 'payment_recorded', null, null, null, "Payment of {$validated['amount']} recorded via {$validated['payment_method']}");

        // Send payment notification email
        try {
            $to = $invoice->client_email ?: ($invoice->client->email ?? null);
            if ($to) {
                Mail::to($to)->queue(new InvoicePaymentReceived($invoice, $validated['amount']));
            }
        } catch (\Throwable $e) {
            Log::warning('Invoice payment notification email failed', ['invoice_id' => $invoice->id, 'error' => $e->getMessage()]);
        }

        // Auto-update invoice status if fully paid
        if ($newTotal >= $invoice->total_amount) {
            if ($invoice->status !== 'paid') {
                $oldStatus = $invoice->status;
                $invoice->markAsPaid();
                $this->syncClientPaymentForInvoice($invoice, 'add');
                $this->logInvoiceAction($invoice, 'status_changed', 'status', $oldStatus, 'paid', 'Auto-marked as paid after full payment received');
            }
        } elseif ($newTotal > 0 && $invoice->status === 'draft') {
            // Move to sent status if partial payment received
            $oldStatus = $invoice->status;
            $invoice->markAsSent();
            $this->logInvoiceAction($invoice, 'status_changed', 'status', $oldStatus, 'sent', 'Moved to sent after partial payment');
        }

        return back()->withSuccess('Payment recorded successfully.');
    }

    /**
     * One-way sync from Finance invoice payments into the Admin Payment Checker.
     *
     * When an invoice is marked as paid, update or create a ClientPayment row
     * for the inferred client/year/month. When cancelled, remove the payment amount.
     */
    private function syncClientPaymentForInvoice(Invoice $invoice, string $operation = 'add'): void
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

            if ($operation === 'add') {
                $payment->amount_paid = (float) $payment->amount_paid + (float) $invoice->total_amount;
            } elseif ($operation === 'remove') {
                $payment->amount_paid = max(0, (float) $payment->amount_paid - (float) $invoice->total_amount);
            }

            // Recalculate paid status
            if ($payment->amount_due > 0 && $payment->amount_paid >= $payment->amount_due) {
                $payment->paid = true;
            } else {
                $payment->paid = false;
            }

            $payment->save();
        } catch (\Throwable $e) {
            Log::warning('Failed to sync invoice payment into client payments', [
                'invoice_id' => $invoice->id,
                'operation' => $operation,
                'message' => $e->getMessage(),
            ]);
        }
    }
}
