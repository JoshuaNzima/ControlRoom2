<![CDATA<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice {{ $invoice->invoice_number }}</title>
  <style>
    body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: #111827; background:#f9fafb; }
    .container { max-width: 720px; margin: 0 auto; padding: 0 16px; }
    .header { background: linear-gradient(to bottom right, #7f1d1d 0%, #b91c1c 40%, #9f1239 100%); color:#fff; padding: 24px 0; border-radius: 0; }
    .row { display:flex; align-items:center; justify-content:space-between; gap:12px; }
    .title-wrap { display:flex; align-items:center; gap:12px; }
    .icon-pill { width:40px; height:40px; display:flex; align-items:center; justify-content:center; background: rgba(255,255,255,0.10); border-radius: 10px; backdrop-filter: blur(4px); }
    .h1 { margin:0; font-size: 30px; line-height: 1.1; font-weight: 800; }
    .sub { margin:0; font-size: 12px; color: rgba(255,255,255,0.85); }
    .section { padding: 24px 0; }
    .card { background:#ffffff; border:1px solid #e5e7eb; border-radius: 12px; padding:16px; }
    .muted { color:#6b7280; }
    .badge { display:inline-block; padding:4px 10px; border-radius:9999px; font-size:12px; font-weight:700; }
    .status-draft { background:#f3f4f6; color:#374151; }
    .status-sent { background:#dbeafe; color:#1e40af; }
    .status-paid { background:#d1fae5; color:#065f46; }
    .status-overdue { background:#fee2e2; color:#991b1b; }
    .status-cancelled { background:#fef3c7; color:#92400e; }

    .grid2 { display:grid; grid-template-columns: 1fr 1fr; gap:12px; }
    .grid3 { display:grid; grid-template-columns: 1fr 1fr 1fr; gap:12px; }
    .pill-card { background:#f9fafb; border:1px solid #f3f4f6; border-radius: 12px; padding: 14px; }

    table { width:100%; border-collapse: collapse; margin-top: 14px; }
    thead th { text-align:left; padding: 10px 12px; background:#f3f4f6; border-bottom: 2px solid #e5e7eb; font-size: 12px; text-transform: uppercase; letter-spacing:.04em; color:#6b7280; }
    tbody td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; font-size: 14px; vertical-align: top; }
    .right { text-align:right; }

    .amount-box { background:#fef2f2; border-radius:12px; padding: 14px; border: 1px solid #fee2e2; text-align:center; }
    .footer-note { margin-top: 16px; font-size: 12px; color:#6b7280; }
    .close-btn { display:inline-block; padding:10px 14px; border-radius:10px; border:1px solid #d1d5db; background:#fff; color:#374151; font-weight:700; font-size:14px; }
    .btn-pay { display:inline-block; padding:10px 14px; border-radius:10px; background:#dc2626; color:#fff; font-weight:700; font-size:14px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="container">
      <div class="row">
        <div class="title-wrap">
          <div class="icon-pill" aria-hidden="true">
            <img src="{{ asset('images/coin-logo.png') }}" alt="" style="height:18px; display:none;" onerror="this.style.display='none'"/>
            <span style="font-size:18px; font-weight:900;">🧾</span>
          </div>
          <div>
            <h1 class="h1">Invoices &amp; Billing</h1>
            <p class="sub">View your billing history and payment status</p>
          </div>
        </div>

        <span class="badge status-{{ $invoice->status }}">{{ strtoupper($invoice->status) }}</span>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="container">
      <!-- Invoice header card (mirrors the client modal: number/status/amount) -->
      <div class="grid2">
        <div class="pill-card">
          <div class="muted" style="font-size:12px; text-transform:uppercase; margin-bottom:6px;">Invoice</div>
          <div style="font-size:18px; font-weight:800; color:#111827;">{{ $invoice->invoice_number }}</div>
          <div class="muted" style="font-size:12px; margin-top:6px;">
            Issued {{ optional($invoice->invoice_date)->format('Y-m-d') }}, due {{ optional($invoice->due_date)->format('Y-m-d') }}
          </div>
        </div>

        <div class="pill-card" style="text-align:right;">
          <div class="muted" style="font-size:12px; text-transform:uppercase; margin-bottom:6px;">Billed To</div>
          <div style="font-weight:800; color:#111827;">{{ $invoice->client_name }}</div>
          @if($invoice->client_email)
            <div class="muted" style="margin-top:4px;">{{ $invoice->client_email }}</div>
          @endif
        </div>
      </div>

      <div class="amount-box" style="margin-top:14px;">
        <div class="muted" style="font-size:12px; margin-bottom:6px;">Amount</div>
        <div style="font-size:28px; font-weight:900; color:#dc2626;">
          MWK {{ number_format((float)$invoice->total_amount, 2) }}
        </div>
      </div>

      <table aria-label="Invoice line items">
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

      <div class="grid2" style="margin-top:14px;">
        <div class="pill-card">
          <div class="muted" style="font-size:12px; margin-bottom:6px;">Billing Period</div>
          <div style="font-weight:700; color:#111827;">
            {{ $invoice->billing_period ?? ($invoice->billing_month && $invoice->billing_year
              ? date('F', mktime(0,0,0,$invoice->billing_month,1)).' '.$invoice->billing_year
              : 'N/A') }}
          </div>
        </div>
        <div class="pill-card">
          <div class="muted" style="font-size:12px; margin-bottom:6px;">Due Date</div>
          <div style="font-weight:700; color:#111827;">
            {{ $invoice->due_date ? optional($invoice->due_date)->format('d M Y') : 'N/A' }}
          </div>
        </div>
        <div class="pill-card">
          <div class="muted" style="font-size:12px; margin-bottom:6px;">Created</div>
          <div style="font-weight:700; color:#111827;">
            {{ $invoice->created_at ? optional($invoice->created_at)->format('d M Y') : 'N/A' }}
          </div>
        </div>
        <div class="pill-card" style="{{ $invoice->paid_date ? 'background:#ecfdf5;' : '' }}">
          <div class="muted" style="font-size:12px; margin-bottom:6px;">Paid Date</div>
          <div style="font-weight:700; color:#111827;">
            {{ $invoice->paid_date ? optional($invoice->paid_date)->format('d M Y') : 'N/A' }}
          </div>
        </div>
      </div>

      <!-- Totals (mirrors React modal totals card style conceptually) -->
      <div class="card" style="margin-top:14px; background:#ffffff; border:1px solid #e5e7eb;">
        <div style="display:flex; justify-content:space-between; gap:12px; margin-bottom:8px;">
          <div class="muted" style="font-size:12px;">Subtotal</div>
          <div style="font-size:14px; font-weight:800; color:#111827;">MWK {{ number_format((float)$invoice->subtotal, 2) }}</div>
        </div>

        @if((float)$invoice->tax_percentage > 0)
          <div style="display:flex; justify-content:space-between; gap:12px; margin-bottom:8px;">
            <div class="muted" style="font-size:12px;">Tax ({{ number_format((float)$invoice->tax_percentage, 2) }}%)</div>
            <div style="font-size:14px; font-weight:800; color:#111827;">MWK {{ number_format((float)$invoice->tax_amount, 2) }}</div>
          </div>
        @endif

        @if((float)$invoice->discount_amount > 0)
          <div style="display:flex; justify-content:space-between; gap:12px; margin-bottom:8px;">
            <div class="muted" style="font-size:12px;">Discount</div>
            <div style="font-size:14px; font-weight:800; color:#111827;">- MWK {{ number_format((float)$invoice->discount_amount, 2) }}</div>
          </div>
        @endif

        <div style="border-top:1px solid #E5E7EB; padding-top:10px; display:flex; justify-content:space-between;">
          <div style="font-weight:800; color:#111827;">Total</div>
          <div style="font-weight:900; color:#111827;">MWK {{ number_format((float)$invoice->total_amount, 2) }}</div>
        </div>
      </div>

      @if($invoice->notes)
        <div class="card" style="margin-top:16px;">
          <div class="muted" style="font-size:12px; text-transform:uppercase; margin-bottom:6px;">Notes</div>
          <div style="white-space:pre-line;">{{ $invoice->notes }}</div>
        </div>
      @endif

      <p class="footer-note">Thank you for your business.</p>

      @if($invoice->status !== 'paid')
        <div style="display:flex; gap:12px; margin-top:12px;">
          <span class="close-btn" style="flex:1; text-align:center;">Close</span>
          <span class="btn-pay" style="flex:1; text-align:center;">
            Pay Now
          </span>
        </div>
      @endif
    </div>
  </div>
</body>
</html>
]]>
