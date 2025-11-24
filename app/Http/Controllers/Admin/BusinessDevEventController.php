<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ClientEvent;
use Illuminate\Http\Request;
use App\Models\Invoice;
use Illuminate\Support\Carbon;

class BusinessDevEventController extends Controller
{
    public function index()
    {
        return redirect()->route('admin.business-dev');
    }

    public function store(Request $request)
    {
        $validated = $this->validateData($request);

        $validated['expected_amount'] = ($validated['rate'] ?? 0) * ($validated['quantity'] ?? 1);

        ClientEvent::create($validated);

        return redirect()->route('admin.business-dev')
            ->withSuccess('Event created successfully.');
    }

    public function update(Request $request, ClientEvent $event)
    {
        $validated = $this->validateData($request);

        $validated['expected_amount'] = ($validated['rate'] ?? 0) * ($validated['quantity'] ?? 1);

        $event->update($validated);

        return redirect()->route('admin.business-dev')
            ->withSuccess('Event updated successfully.');
    }

    public function destroy(ClientEvent $event)
    {
        $event->delete();

        return redirect()->route('admin.business-dev')
            ->withSuccess('Event deleted successfully.');
    }

    public function showJson(ClientEvent $event)
    {
        return response()->json($event->load('client'));
    }

    public function createInvoice(Request $request, ClientEvent $event)
    {
        $event->loadMissing('client');
        $client = $event->client;

        if (! $client) {
            return redirect()->route('admin.business-dev')
                ->withErrors(['event' => 'This event is not linked to a client.']);
        }

        $data = $request->validate([
            'billing_mode' => ['required', 'in:immediate,monthly'],
            'invoice_date' => ['required', 'date'],
            'due_date' => ['required', 'date', 'after_or_equal:invoice_date'],
            'tax_percentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'tax_amount' => ['nullable', 'numeric', 'min:0'],
            'discount_amount' => ['nullable', 'numeric', 'min:0'],
            'billing_year' => ['nullable', 'integer', 'min:2000', 'max:2100'],
            'billing_month' => ['nullable', 'integer', 'min:1', 'max:12'],
        ]);

        $subtotal = (float) ($event->expected_amount ?? (($event->rate ?? 0) * ($event->quantity ?? 1)));
        $taxPercentage = (float) ($data['tax_percentage'] ?? 0);

        $taxAmount = array_key_exists('tax_amount', $data) && $data['tax_amount'] !== null
            ? (float) $data['tax_amount']
            : round($subtotal * $taxPercentage / 100, 2);

        $discountAmount = (float) ($data['discount_amount'] ?? 0);
        $totalAmount = $subtotal + $taxAmount - $discountAmount;

        $issueDate = Carbon::parse($data['invoice_date']);

        if ($data['billing_mode'] === 'monthly') {
            $billingYear = (int) ($data['billing_year'] ?? $issueDate->year);
            $billingMonth = (int) ($data['billing_month'] ?? $issueDate->month);
        } else {
            $billingYear = (int) $issueDate->year;
            $billingMonth = (int) $issueDate->month;
        }

        $invoiceNumber = sprintf('EVT-%s-%d', $issueDate->format('Ymd'), $event->id);

        $invoice = Invoice::create([
            'invoice_number' => $invoiceNumber,
            'user_id' => $request->user()->id,
            'client_id' => $client->id,
            'client_name' => $client->name,
            'client_email' => $client->email,
            'subtotal' => $subtotal,
            'tax_amount' => $taxAmount,
            'tax_percentage' => $taxPercentage,
            'discount_amount' => $discountAmount,
            'total_amount' => $totalAmount,
            'invoice_date' => $data['invoice_date'],
            'due_date' => $data['due_date'],
            'billing_year' => $billingYear,
            'billing_month' => $billingMonth,
            'description' => $event->title,
            'status' => 'draft',
            'notes' => $event->notes,
        ]);

        $qty = (float) ($event->quantity ?? 1);
        $unitPrice = (float) ($event->rate ?? 0);

        $invoice->lineItems()->create([
            'description' => $event->title,
            'quantity' => $qty,
            'unit_price' => $unitPrice,
            'line_total' => $qty * $unitPrice,
        ]);

        return redirect()->route('admin.business-dev')
            ->withSuccess('Invoice created for this event.');
    }

    protected function validateData(Request $request): array
    {
        $categories = ClientEvent::CATEGORIES;
        $statuses = ClientEvent::STATUSES;
        $billingTypes = ClientEvent::BILLING_TYPES;

        return $request->validate([
            'client_id' => ['required', 'integer', 'exists:clients,id'],
            'title' => ['required', 'string', 'max:255'],
            'event_date' => ['required', 'date'],
            'start_time' => ['nullable', 'date_format:H:i'],
            'end_time' => ['nullable', 'date_format:H:i', 'after_or_equal:start_time'],
            'location' => ['nullable', 'string', 'max:255'],
            'category' => ['required', 'string', 'in:' . implode(',', $categories)],
            'billing_type' => ['required', 'string', 'in:' . implode(',', $billingTypes)],
            'rate' => ['required', 'numeric', 'min:0'],
            'quantity' => ['required', 'integer', 'min:1'],
            'status' => ['required', 'string', 'in:' . implode(',', $statuses)],
            'k9_units' => ['nullable', 'integer', 'min:0'],
            'notes' => ['nullable', 'string'],
        ]);
    }
}
