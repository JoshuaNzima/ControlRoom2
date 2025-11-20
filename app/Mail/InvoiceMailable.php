<?php

namespace App\Mail;

use App\Models\Invoice;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class InvoiceMailable extends Mailable
{
    use Queueable, SerializesModels;

    public Invoice $invoice;

    public function __construct(Invoice $invoice)
    {
        $this->invoice = $invoice->loadMissing('user', 'lineItems', 'client');
    }

    public function build()
    {
        $subject = 'Invoice ' . $this->invoice->invoice_number . ' from ' . config('app.name');

        return $this->subject($subject)
            ->view('emails.invoice', [
                'invoice' => $this->invoice,
                'appName' => config('app.name'),
            ]);
    }
}
