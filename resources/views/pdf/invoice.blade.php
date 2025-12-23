<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice {{ $invoice->invoice_number }}</title>
  <style>
    body { font-family: DejaVu Sans, Arial, Helvetica, sans-serif; color: #111; font-size: 12px; }
    .container { width: 100%; max-width: 800px; margin: 0 auto; }
    .header { border-bottom: 2px solid #ef4444; padding-bottom: 12px; margin-bottom: 16px; }
    .brand { display: table; width: 100%; }
    .brand-left { display: table-cell; vertical-align: middle; }
    .brand-right { display: table-cell; vertical-align: middle; text-align: right; }
    .brand-name { color: #ef4444; font-weight: 700; font-size: 18px; }
    .muted { color: #555; }
    .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 8px; background: #f3f4f6; border-bottom: 2px solid #e5e7eb; font-size: 11px; text-transform: uppercase; }
    td { padding: 8px; border-bottom: 1px solid #f3f4f6; }
    .right { text-align: right; }
    .total { font-weight: 700; color: #111827; }
    .status { display: inline-block; padding: 3px 8px; border-radius: 9999px; font-size: 11px; font-weight: 600; border: 1px solid #e5e7eb; }
    .footer { margin-top: 18px; color: #666; font-size: 11px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">
        <div class="brand-left">
          <div style="display:inline-block; vertical-align:middle;">
            <img src="{{ public_path('images/Coin-logo.png') }}" alt="Logo" style="height:38px;" />
          </div>
          <div style="display:inline-block; margin-left:10px; vertical-align:middle;" class="brand-name">{{ config('app.name', 'Coin Security') }}</div>
        </div>
        <div class="brand-right">
          <div style="font-weight:700; font-size:16px;">Invoice</div>
          <div class="muted">#{{ $invoice->invoice_number }}</div>
          <div class="muted">Issued: {{ optional($invoice->invoice_date)->format('Y-m-d') }}</div>
          <div class="muted">Due: {{ optional($invoice->due_date)->format('Y-m-d') }}</div>
          @php($bm = $invoice->billing_month ?? null)
          @php($by = $invoice->billing_year ?? null)
          @if($bm && $by)
            <div class="muted">Period: {{ str_pad((string)$bm, 2, '0', STR_PAD_LEFT) }}/{{ $by }}</div>
          @endif
        </div>
      </div>
    </div>

    <div class="card" style="margin-bottom:12px;">
      <div style="display: table; width: 100%;">
        <div style="display: table-cell; vertical-align: top;">
          <div class="muted" style="font-size:11px; text-transform:uppercase;">Billed To</div>
          <div style="font-weight:600;">{{ $invoice->client_name }}</div>
          @if($invoice->client_email)
          <div class="muted">{{ $invoice->client_email }}</div>
          @endif
        </div>
        <div style="display: table-cell; vertical-align: top; text-align:right;">
          <div class="muted" style="font-size:11px; text-transform:uppercase;">Status</div>
          <div class="status">{{ strtoupper($invoice->status) }}</div>
        </div>
      </div>
    </div>

    <table style="margin-top: 8px;">
      <thead>
        <tr>
          <th>Description</th>
          <th class="right">Qty</th>
          <th class="right">Unit Price</th>
          <th class="right">Line Total</th>
        </tr>
      </thead>
      <tbody>
        @foreach($invoice->lineItems as $item)
          <tr>
            <td>{{ $item->description }}</td>
            <td class="right">{{ number_format((float)$item->quantity, 0) }}</td>
            <td class="right">MWK {{ number_format((float)$item->unit_price, 2) }}</td>
            <td class="right">MWK {{ number_format((float)$item->line_total, 2) }}</td>
          </tr>
        @endforeach
      </tbody>
    </table>

    <div style="display:flex; justify-content:flex-end; margin-top:12px;">
      <div style="width: 280px;" class="card">
        <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
          <div class="muted">Subtotal</div>
          <div>MWK {{ number_format((float)$invoice->subtotal, 2) }}</div>
        </div>
        @if((float)$invoice->tax_percentage > 0)
        <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
          <div class="muted">Tax ({{ number_format((float)$invoice->tax_percentage, 2) }}%)</div>
          <div>MWK {{ number_format((float)$invoice->tax_amount, 2) }}</div>
        </div>
        @endif
        @if((float)$invoice->discount_amount > 0)
        <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
          <div class="muted">Discount</div>
          <div>- MWK {{ number_format((float)$invoice->discount_amount, 2) }}</div>
        </div>
        @endif
        <div style="border-top:1px solid #E5E7EB; padding-top:6px; display:flex; justify-content:space-between;" class="total">
          <div>Total</div>
          <div>MWK {{ number_format((float)$invoice->total_amount, 2) }}</div>
        </div>
      </div>
    </div>

    @if($invoice->notes)
    <div class="card" style="margin-top:12px;">
      <div class="muted" style="font-size:11px; text-transform:uppercase; margin-bottom:4px;">Notes</div>
      <div>{{ $invoice->notes }}</div>
    </div>
    @endif

    <div class="footer">
      Thank you for your business.
    </div>
  </div>
</body>
</html>
