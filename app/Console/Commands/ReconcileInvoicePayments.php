<?php

namespace App\Console\Commands;

use App\Models\Invoice;
use App\Models\ClientPayment;
use App\Models\Guards\Client as GuardClient;
use Illuminate\Console\Command;

class ReconcileInvoicePayments extends Command
{
    protected $signature = 'invoices:reconcile-payments';
    protected $description = 'Reconcile invoice payments with client payment records';

    public function handle(): int
    {
        $this->info('Starting invoice payment reconciliation...');

        $reconciled = 0;
        $errors = 0;

        // Get all paid invoices
        $paidInvoices = Invoice::where('status', 'paid')
            ->whereNotNull('client_id')
            ->get();

        $this->info("Found {$paidInvoices->count()} paid invoices to reconcile.");

        foreach ($paidInvoices as $invoice) {
            try {
                $client = GuardClient::find($invoice->client_id);
                if (! $client) {
                    $this->warn("Client not found for invoice {$invoice->id}");
                    continue;
                }

                $date = $invoice->invoice_date ?? now();
                $year = $invoice->billing_year ?: (int) $date->year;
                $month = $invoice->billing_month ?: (int) $date->month;

                if ($year <= 0 || $month < 1 || $month > 12) {
                    $this->warn("Invalid billing period for invoice {$invoice->id}");
                    continue;
                }

                $amountDue = $client->getMonthlyDueAmount();

                $payment = ClientPayment::firstOrCreate(
                    [
                        'client_id' => $invoice->client_id,
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

                // Calculate what amount_paid should be
                $expectedPaid = Invoice::where('client_id', $invoice->client_id)
                    ->where('billing_year', $year)
                    ->where('billing_month', $month)
                    ->where('status', 'paid')
                    ->sum('total_amount');

                $oldAmount = $payment->amount_paid;

                if ((float) $payment->amount_paid !== (float) $expectedPaid) {
                    $payment->amount_paid = $expectedPaid;
                    $payment->paid = $payment->amount_due > 0 && $payment->amount_paid >= $payment->amount_due;
                    $payment->save();

                    $this->info("Reconciled: Client {$client->name} - {$year}/{$month}: {$oldAmount} -> {$expectedPaid}");
                    $reconciled++;
                }
            } catch (\Throwable $e) {
                $this->error("Error reconciling invoice {$invoice->id}: {$e->getMessage()}");
                $errors++;
            }
        }

        $this->info("Reconciliation complete: {$reconciled} records updated, {$errors} errors.");

        return $errors > 0 ? self::FAILURE : self::SUCCESS;
    }
}
