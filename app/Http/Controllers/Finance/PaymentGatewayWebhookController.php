<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\InvoicePayment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PaymentGatewayWebhookController extends Controller
{
    /**
     * Handle gateway webhook/callback.
     *
     * Idempotency:
     * - Use gateway_name + gateway_transaction_id to find existing payment.
     * - If already marked succeeded/paid, return 200 without side effects.
     */
    public function handle(Request $request, string $gateway)
    {
        // TODO (follow-up): verify signature per gateway using env secrets.
        // For now, accept payload.
        $payload = $request->all();

        // Expected common fields (we'll map whatever each gateway sends in a normalized way later)
        $gatewayTransactionId = $payload['transaction_id'] ?? $payload['id'] ?? null;
        $gatewayReference = $payload['reference'] ?? $payload['order_id'] ?? null;
        $gatewayStatus = $payload['status'] ?? $payload['payment_status'] ?? null;

        // Prefer invoice id/number mapping.
        $invoiceId = $payload['invoice_id'] ?? null;
        $invoiceNumber = $payload['invoice_number'] ?? null;

        if (! $invoiceId && ! $invoiceNumber) {
            Log::warning('Payment webhook missing invoice identifiers', [
                'gateway' => $gateway,
                'payload' => $payload,
            ]);
            return response()->json(['success' => false, 'error' => 'Missing invoice identifier'], 422);
        }

        /** @var Invoice|null $invoice */
        $invoice = $invoiceId
            ? Invoice::find($invoiceId)
            : Invoice::where('invoice_number', $invoiceNumber)->first();

        if (! $invoice) {
            Log::warning('Payment webhook invoice not found', [
                'gateway' => $gateway,
                'invoice_id' => $invoiceId,
                'invoice_number' => $invoiceNumber,
            ]);
            return response()->json(['success' => false, 'error' => 'Invoice not found'], 404);
        }

        $gatewayTransactionId = (string) ($gatewayTransactionId ?? '');
        if ($gatewayTransactionId === '') {
            Log::warning('Payment webhook missing transaction id', [
                'gateway' => $gateway,
                'invoice_id' => $invoice->id,
                'invoice_number' => $invoice->invoice_number,
                'payload' => $payload,
            ]);
            return response()->json(['success' => false, 'error' => 'Missing transaction id'], 422);
        }

        $normalizedStatus = is_string($gatewayStatus) ? strtolower($gatewayStatus) : '';
        $isSucceeded = in_array($normalizedStatus, ['succeeded', 'success', 'paid', 'completed'], true);

        // Create or update payment record for idempotency.
        $payment = InvoicePayment::firstOrCreate(
            [
                'invoice_id' => $invoice->id,
                'gateway_name' => $gateway,
                'gateway_transaction_id' => $gatewayTransactionId,
            ],
            [
                'amount' => (float) ($payload['amount'] ?? 0),
                'payment_date' => now(),
                'payment_method' => 'other',
                'reference' => $gatewayReference ? (string) $gatewayReference : null,
                'notes' => null,
                'gateway_status' => $normalizedStatus ?: null,
                'gateway_reference' => $gatewayReference ? (string) $gatewayReference : null,
                'gateway_payload' => json_encode($payload),
                'gateway_paid_at' => null,
                'recorded_by' => null,
            ]
        );

        if ($isSucceeded && $invoice->status !== 'paid') {
            $invoice->markAsPaid();

            if (! $payment->gateway_paid_at) {
                $payment->gateway_paid_at = now();
                $payment->gateway_status = $normalizedStatus ?: 'succeeded';
                $payment->gateway_payload = json_encode($payload);

                if ($gatewayReference) {
                    $payment->gateway_reference = (string) $gatewayReference;
                }

                $payment->save();

                // Sync client payment ledger once for the first successful webhook.
                app(\App\Http\Controllers\Finance\InvoiceController::class)
                    ->syncClientPaymentForInvoicePublic($invoice, 'add');
            }
        } else {
            // Update status/payload (idempotent update).
            $payment->gateway_status = $normalizedStatus ?: ($payment->gateway_status ?: null);
            if ($gatewayReference) {
                $payment->gateway_reference = (string) $gatewayReference;
            }
            $payment->gateway_payload = json_encode($payload);
            $payment->save();
        }

        Log::info('Payment webhook processed', [
            'gateway' => $gateway,
            'invoice_id' => $invoice->id,
            'transaction_id' => $gatewayTransactionId,
            'status' => $normalizedStatus,
        ]);

        return response()->json(['success' => true]);
    }
}



