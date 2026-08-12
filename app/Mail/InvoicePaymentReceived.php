<?php

namespace App\Mail;

use App\Models\Invoice;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class InvoicePaymentReceived extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public Invoice $invoice;
    public float $paymentAmount;
    public float $totalPaid;
    public float $balanceDue;

    public function __construct(Invoice $invoice, float $paymentAmount)
    {
        $this->invoice = $invoice;
        $this->paymentAmount = $paymentAmount;
        $this->totalPaid = $invoice->payments->sum('amount');
        $this->balanceDue = max(0, $invoice->total_amount - $this->totalPaid);
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Payment Received - Invoice {$this->invoice->invoice_number}",
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.invoice-payment-received',
            with: [
                'invoice' => $this->invoice,
                'paymentAmount' => $this->paymentAmount,
                'totalPaid' => $this->totalPaid,
                'balanceDue' => $this->balanceDue,
                'url' => route('finance.invoices.show', $this->invoice),
            ],
        );
    }
}
