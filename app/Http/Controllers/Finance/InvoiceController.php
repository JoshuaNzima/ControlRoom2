<?php

namespace App\Http\Controllers\Finance;

use App\Models\Invoice;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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

        $invoices = $query->paginate(15);

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
        return Inertia::render('Finance/Invoices/Create');
    }

    /**
     * Store a newly created invoice
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'invoice_number' => 'required|string|unique:invoices',
            'client_name' => 'required|string|max:255',
            'client_email' => 'nullable|email',
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

        $invoice = Invoice::create([
            ...$validated,
            'user_id' => Auth::id(),
            'status' => 'draft',
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
        $invoice->load('user', 'lineItems');

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

        $invoice->load('lineItems');

        return Inertia::render('Finance/Invoices/Edit', [
            'invoice' => $invoice,
        ]);
    }

    /**
     * Update an invoice
     */
    public function update(Request $request, Invoice $invoice)
    {
        $this->authorize('update', $invoice);

        $validated = $request->validate([
            'client_name' => 'required|string|max:255',
            'client_email' => 'nullable|email',
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

        $invoice->update($validated);

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

        $invoice->markAsPaid();

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
}
