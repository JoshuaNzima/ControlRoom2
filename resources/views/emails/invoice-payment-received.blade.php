<x-mail::message>
# Payment Received

Hello,

We have received a payment for Invoice **{{ $invoice->invoice_number }}**.

## Payment Details

| | Amount |
| --- | --- |
| **Payment Received** | MWK {{ number_format($paymentAmount, 2) }} |
| **Total Paid** | MWK {{ number_format($totalPaid, 2) }} |
| **Invoice Total** | MWK {{ number_format($invoice->total_amount, 2) }} |
| **Balance Due** | MWK {{ number_format($balanceDue, 2) }} |

@if ($balanceDue <= 0)
**This invoice has been fully paid. Thank you!**
@endif

<x-mail::button :url="$url">
View Invoice
</x-mail::button>

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>
