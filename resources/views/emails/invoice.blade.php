<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice {{ $invoice->invoice_number }}</title>
  <style>
    body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: #111827; }
    .container { max-width: 640px; margin: 0 auto; padding: 24px; }
    .brand { display: flex; align-items: center; gap: 12px; border-bottom: 1px solid #E5E7EB; padding-bottom: 12px; margin-bottom: 16px; }
    .brand-name { color: #047857; font-weight: 700; font-size: 18px; }
    .muted { color: #6B7280; }
    .card { border: 1px solid #E5E7EB; border-radius: 12px; padding: 16px; }
    .table { width: 100%; border-collapse: collapse; }
    .table th { text-align: left; padding: 10px; background: #F3F4F6; border-bottom: 2px solid #E5E7EB; font-size: 12px; text-transform: uppercase; letter-spacing: .04em; }
    .table td { padding: 10px; border-bottom: 1px solid #F3F4F6; font-size: 14px; }
    .right { text-align: right; }
    .total { font-weight: 700; color: #1F2937; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; }
    .status-draft { background: #F3F4F6; color: #374151; }
    .status-sent { background: #DBEAFE; color: #1E40AF; }
    .status-paid { background: #D1FAE5; color: #065F46; }
    .status-overdue { background: #FEE2E2; color: #991B1B; }
    .status-cancelled { background: #FEF3C7; color: #92400E; }
  </style>
</head>
<body>
  <div class="container">
    <div class="brand">
      <img src="{{ asset('images/coin-logo.png') }}" alt="Logo" style="height:36px" onerror="this.style.display='none'"/>
      <div class="brand-name">{{ config('app.name') }}</div>
    </div>

    <h1 style="margin: 0 0 8px 0;">Invoice {{ $invoice->invoice_number }}</h1>
    <div class="muted" style="margin-bottom: 12px;">Issued {{ optional($invoice->invoice_date)->format('Y-m-d') }}, due {{ optional($invoice->due_date)->format('Y-m-d') }}</div>

    <div class="card" style="margin-bottom:16px;">
      <div style="display:flex; gap:16px;">
        <div style="flex:1;">
          <div class="muted" style="font-size:12px; text-transform:uppercase;">Billed To</div>
          <div style="font-weight:600;">{{ $invoice->client_name }}</div>
          @if($invoice->client_email)
          <div class="muted">{{ $invoice->client_email }}</div>
          @endif
        </div>
        <div style="text-align:right;">
          <div class="muted" style="font-size:12px; text-transform:uppercase;">Status</div>
          <div class="badge status-{{ $invoice->status }}">{{ strtoupper($invoice->status) }}</div>
        </div>
      </div>
    </div>

    <table class="table" style="margin-top: 12px;">
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
            <td class="right">{{ number_format($item->quantity, 0) }}</td>
            <td class="right">MWK {{ number_format((float)$item->unit_price, 2) }}</td>
            <td class="right">MWK {{ number_format((float)$item->line_total, 2) }}</td>
          </tr>
        @endforeach
      </tbody>
    </table>

    <div style="display:flex; justify-content:flex-end; margin-top:16px;">
      <div style="width: 280px;" class="card">
        <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
          <div class="muted">Subtotal</div>
          <div>MWK {{ number_format((float)$invoice->subtotal, 2) }}</div>
        </div>
        @if((float)$invoice->tax_percentage > 0)
        <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
          <div class="muted">Tax ({{ number_format((float)$invoice->tax_percentage, 2) }}%)</div>
          <div>MWK {{ number_format((float)$invoice->tax_amount, 2) }}</div>
        </div>
        @endif
        @if((float)$invoice->discount_amount > 0)
        <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
          <div class="muted">Discount</div>
          <div>- MWK {{ number_format((float)$invoice->discount_amount, 2) }}</div>
        </div>
        @endif
        <div style="border-top:1px solid #E5E7EB; padding-top:8px; display:flex; justify-content:space-between;" class="total">
          <div>Total</div>
          <div>MWK {{ number_format((float)$invoice->total_amount, 2) }}</div>
        </div>
      </div>
    </div>

    @if($invoice->notes)
    <div class="card" style="margin-top:16px;">
      <div class="muted" style="font-size:12px; text-transform:uppercase; margin-bottom:6px;">Notes</div>
      <div>{{ $invoice->notes }}</div>
    </div>
    @endif

    <p class="muted" style="margin-top:16px; font-size:12px;">Thank you for your business.</p>
  </div>
</body>
</html>
