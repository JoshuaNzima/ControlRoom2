<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice {{ $invoice->invoice_number }}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Gill Sans MT', 'Calibri', Arial, Helvetica, sans-serif;
      font-size: 11pt;
      color: #000;
      background: #fff;
      line-height: 1.4;
    }
    .container {
      width: 100%;
      max-width: 750px;
      margin: 0 auto;
      padding: 20px 30px;
    }
    /* Header Section */
    .header {
      display: table;
      width: 100%;
      margin-bottom: 10px;
    }
    .header-left {
      display: table-cell;
      vertical-align: top;
      width: 60%;
    }
    .header-right {
      display: table-cell;
      vertical-align: top;
      text-align: right;
      width: 40%;
    }
    .company-name {
      color: #DC2626;
      font-family: 'Bookman Old Style', Georgia, serif;
      font-size: 20pt;
      font-weight: bold;
    }
    .tagline {
      color: #DC2626;
      font-family: 'Brush Script MT', cursive;
      font-size: 16pt;
      font-weight: bold;
      margin-top: 5px;
    }
    .logo-img {
      max-height: 100px;
      max-width: 180px;
    }
    /* Contact Info */
    .contact-section {
      display: table;
      width: 100%;
      margin-bottom: 20px;
    }
    .contact-left {
      display: table-cell;
      vertical-align: top;
      width: 50%;
      padding-left: 10px;
    }
    .contact-right {
      display: table-cell;
      vertical-align: top;
      width: 50%;
      text-align: left;
      padding-left: 30px;
    }
    .contact-label {
      color: #969696;
      font-weight: bold;
      font-size: 10pt;
      text-align: right;
      padding-right: 10px;
    }
    .contact-value {
      font-size: 10pt;
      color: #000;
    }
    .contact-row {
      margin-bottom: 3px;
    }
    /* Invoice Title */
    .invoice-title-section {
      margin: 25px 0 15px 0;
      padding-left: 10px;
    }
    .invoice-label {
      color: #969696;
      font-weight: bold;
      font-style: italic;
      font-size: 14pt;
      display: inline-block;
      margin-right: 15px;
    }
    .invoice-number {
      font-family: 'Arial Rounded MT Bold', Arial, sans-serif;
      font-size: 16pt;
      font-weight: bold;
      color: #000;
      display: inline-block;
    }
    /* Invoice Details Grid */
    .details-section {
      display: table;
      width: 100%;
      margin-bottom: 20px;
    }
    .details-left {
      display: table-cell;
      vertical-align: top;
      width: 50%;
      padding-left: 10px;
    }
    .details-right {
      display: table-cell;
      vertical-align: top;
      width: 50%;
      padding-left: 20px;
    }
    .detail-row {
      margin-bottom: 5px;
    }
    .detail-label {
      color: #969696;
      font-weight: bold;
      font-size: 10pt;
      display: inline-block;
      width: 100px;
    }
    .detail-value {
      font-size: 10pt;
      color: #000;
    }
    .detail-value-bold {
      font-family: 'Arial Rounded MT Bold', Arial, sans-serif;
      font-size: 12pt;
      font-weight: bold;
      color: #000;
    }
    /* Bill To Section */
    .bill-to-label {
      color: #969696;
      font-weight: bold;
      font-size: 10pt;
      margin-bottom: 3px;
    }
    .bill-to-name {
      font-family: 'Calibri', Arial, sans-serif;
      font-size: 12pt;
      font-weight: bold;
      color: #000;
    }
    .bill-to-address {
      font-size: 10pt;
      color: #000;
      font-weight: bold;
      line-height: 1.5;
    }
    /* Line Items Table */
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
      margin-bottom: 10px;
    }
    .items-table th {
      background-color: #fff;
      color: #000;
      font-size: 10pt;
      font-weight: normal;
      padding: 8px 5px;
      text-align: left;
      border-bottom: none;
    }
    .items-table th.qty-col { width: 10%; }
    .items-table th.type-col { width: 20%; }
    .items-table th.desc-col { width: 40%; }
    .items-table th.unit-col { width: 15%; text-align: right; }
    .items-table th.amount-col { width: 15%; text-align: right; }

    .items-table td {
      padding: 6px 5px;
      font-size: 10pt;
      border: none;
      vertical-align: top;
    }
    .items-table td.qty-cell {
      text-align: left;
    }
    .items-table td.unit-cell,
    .items-table td.amount-cell {
      text-align: right;
    }
    /* Totals Section */
    .totals-section {
      width: 100%;
      margin-top: 15px;
    }
    .totals-table {
      width: 100%;
      border-collapse: collapse;
    }
    .totals-table td {
      padding: 6px 5px;
      font-size: 11pt;
    }
    .totals-label {
      text-align: right;
      font-style: italic;
      background-color: #D8E2EA;
      border: 1px solid #C6D1D4;
      width: 60%;
    }
    .totals-value {
      text-align: right;
      background-color: #D8E2EA;
      border: 1px solid #C6D1D4;
      width: 20%;
    }
    .totals-total-label {
      text-align: right;
      font-weight: bold;
      background-color: #EBF0F4;
      border: 1px solid #C6D1D4;
    }
    .totals-total-value {
      text-align: right;
      font-weight: bold;
      background-color: #EBF0F4;
      border: 1px solid #C6D1D4;
    }
    .note-cell {
      background-color: #D8E2EA;
      border: 1px solid #C6D1D4;
      padding: 6px 5px;
      font-style: italic;
      font-size: 10pt;
    }
    /* Footer Notes */
    .footer-notes {
      margin-top: 15px;
      padding-left: 10px;
    }
    .footer-note {
      color: #969696;
      font-weight: bold;
      font-size: 10pt;
      margin-bottom: 5px;
    }
    .footer-note span {
      color: #969696;
      font-weight: normal;
    }
    /* Payment Section */
    .payment-section {
      margin-top: 25px;
      width: 100%;
    }
    .payment-header {
      background-color: #C5D4E0;
      color: #fff;
      font-weight: bold;
      font-size: 11pt;
      padding: 8px;
      text-align: center;
    }
    .payment-table {
      width: 100%;
      border-collapse: collapse;
    }
    .payment-table td {
      padding: 6px 10px;
      font-size: 10pt;
      border: 1px solid #DDE9EC;
    }
    .payment-label {
      font-weight: bold;
      font-style: italic;
      color: #969696;
      border-left: 1px solid #DDE9EC;
      border-bottom: 1px solid #C0C0C0;
    }
    .payment-value {
      font-weight: bold;
      color: #000;
      border-bottom: 1px solid #DDE9EC;
    }
    .payment-bank-header {
      font-weight: bold;
      color: #000;
      border-top: 1px solid #BFBFBF;
      border-bottom: 1px solid #BFBFBF;
    }
    /* Signature Section */
    .signature-section {
      margin-top: 30px;
      padding-left: 10px;
    }
    .signature-line {
      color: #969696;
      font-weight: bold;
      font-style: italic;
      font-size: 11pt;
      margin-bottom: 25px;
    }
    .page-break { page-break-after: always; }
    .text-right { text-align: right; }
    .text-left { text-align: left; }
    .status-footer {
      margin-top: 30px;
      text-align: center;
      font-size: 10pt;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header with Logo -->
    <div class="header">
      <div class="header-left">
        <div class="company-name">COIN SECURITY SERVICES</div>
        <div class="tagline">Prevent | Respond | Protect</div>
      </div>
      <div class="header-right">
        <img src="{{ public_path('images/Coin-logo.png') }}" alt="Coin Security Logo" class="logo-img" />
      </div>
    </div>

    <!-- Contact Information -->
    <div class="contact-section">
      <div class="contact-left">
        <div class="contact-row">P.O. Box 30450</div>
        <div class="contact-row">Area 47 Sector 4, Viphya Street</div>
        <div class="contact-row">Lilongwe</div>
      </div>
      <div class="contact-right">
        <table style="width: 100%;">
          <tr>
            <td class="contact-label">Phone:</td>
            <td class="contact-value">(265) 0999 611 711</td>
          </tr>
          <tr>
            <td class="contact-label">Head Office:</td>
            <td class="contact-value">(265) 0999 611 712</td>
          </tr>
          <tr>
            <td class="contact-label">Off Hours:</td>
            <td class="contact-value">(265) 0999 958 589</td>
          </tr>
          <tr>
            <td class="contact-label">E-mail:</td>
            <td class="contact-value" style="text-decoration: underline; color: #A599AE;">coinsec9@gmail.com</td>
          </tr>
        </table>
      </div>
    </div>

    <!-- Invoice Title -->
    <div class="invoice-title-section">
      <span class="invoice-label">INVOICE</span>
      <span class="invoice-number">{{ $invoice->invoice_number }}</span>
    </div>

    <!-- Invoice Details & Bill To -->
    <div class="details-section">
      <div class="details-left">
        <table style="width: 100%;">
          <tr>
            <td class="detail-label">Account #:</td>
            <td class="detail-value-bold">{{ $invoice->client ? '2025/' . strtoupper(substr($invoice->client_name, 0, 3)) . '/' . str_pad($invoice->client->id, 2, '0', STR_PAD_LEFT) : 'N/A' }}</td>
          </tr>
          <tr>
            <td class="detail-label">Date:</td>
            <td class="detail-value">{{ optional($invoice->invoice_date)->format('F d, Y') }}</td>
          </tr>
          <tr>
            <td class="detail-label">Customer ID:</td>
            <td class="detail-value">{{ $invoice->client_id ?? '' }}</td>
          </tr>
        </table>
      </div>
      <div class="details-right">
        <div class="bill-to-label">Bill To:</div>
        <div class="bill-to-name">{{ $invoice->client_name }}</div>
        @if($invoice->client)
        <div class="bill-to-address">
          {{ $invoice->client->address ?? 'Residence' }}<br>
          {{ $invoice->client->phone ?? '' }}
        </div>
        @endif
      </div>
    </div>

    <!-- Line Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th class="qty-col">Qty</th>
          <th class="type-col">Type</th>
          <th class="desc-col">Description</th>
          <th class="unit-col">Unit</th>
          <th class="amount-col">Amount</th>
        </tr>
      </thead>
      <tbody>
        @foreach($invoice->lineItems as $item)
        <tr>
          <td class="qty-cell">{{ number_format((float)$item->quantity, 0) }}</td>
          <td>Standard Security Guard</td>
          <td>{{ $item->description }}</td>
          <td class="unit-cell">{{ number_format((float)$item->unit_price, 2) }}</td>
          <td class="amount-cell">{{ number_format((float)$item->line_total, 2) }}</td>
        </tr>
        @endforeach
        @for($i = count($invoice->lineItems); $i < 10; $i++)
        <tr>
          <td class="qty-cell">&nbsp;</td>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
          <td class="unit-cell">&nbsp;</td>
          <td class="amount-cell">0</td>
        </tr>
        @endfor
      </tbody>
    </table>

    <!-- Totals Section -->
    <div class="totals-section">
      <table class="totals-table">
        <tr>
          <td style="width: 40%;">&nbsp;</td>
          <td style="width: 20%;">&nbsp;</td>
          <td class="totals-label">SubTotal</td>
          <td class="totals-value">{{ number_format((float)$invoice->subtotal, 2) }}</td>
        </tr>
        @if((float)$invoice->tax_amount > 0)
        <tr>
          <td>&nbsp;</td>
          <td class="note-cell">Tax ({{ $invoice->tax_percentage }}%)</td>
          <td style="background-color: #D8E2EA; border: 1px solid #C6D1D4; text-align: right; font-style: italic;">&nbsp;</td>
          <td class="totals-value">{{ number_format((float)$invoice->tax_amount, 2) }}</td>
        </tr>
        @endif
        @if((float)$invoice->discount_amount > 0)
        <tr>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
          <td style="background-color: #D8E2EA; border: 1px solid #C6D1D4; text-align: center; font-style: italic;">Credit Note</td>
          <td style="background-color: #D8E2EA; border: 1px solid #C6D1D4;">&nbsp;</td>
        </tr>
        @endif
        <tr>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
          <td class="totals-total-label">TOTAL</td>
          <td class="totals-total-value">{{ number_format((float)$invoice->total_amount, 2) }}</td>
        </tr>
      </table>
    </div>

    <!-- Footer Notes -->
    <div class="footer-notes">
      <div class="footer-note">Reminder: <span>Please include the statement number on your cheque.</span></div>
      <div class="footer-note">Terms: Payment<span> due on {{ optional($invoice->due_date)->format('F d, Y') }}.</span></div>
    </div>

    <!-- Payment Section -->
    <div class="payment-section">
      <div class="payment-header">MODE OF PAYMENT</div>
      <table class="payment-table">
        <tr>
          <td class="payment-label">Cheque:</td>
          <td class="payment-value" style="border-right: 1px solid #DDE9EC;">Coin Security Services</td>
          <td class="payment-value">Coin Security Services</td>
        </tr>
        <tr>
          <td class="payment-label">Bank Transfer:</td>
          <td class="payment-value" style="border-right: 1px solid #DDE9EC;">First Capital Bank, Capital City Branch</td>
          <td class="payment-value payment-bank-header">Standard Bank Malawi</td>
        </tr>
        <tr>
          <td class="payment-label">Account #:</td>
          <td class="payment-value" style="border-right: 1px solid #DDE9EC;">0635168006</td>
          <td class="payment-value">9100005509979</td>
        </tr>
        <tr>
          <td class="payment-label">Branch:</td>
          <td class="payment-value" style="border-right: 1px solid #DDE9EC;">City Centre</td>
          <td class="payment-value">City Centre</td>
        </tr>
        <tr>
          <td class="payment-label">Due Date:</td>
          <td class="payment-value" colspan="2">{{ optional($invoice->due_date)->format('F d, Y') }}</td>
        </tr>
      </table>
    </div>

    <!-- Signature Section -->
    <div class="signature-section">
      <div class="signature-line">Authorised By</div>
      <div class="signature-line">Signature</div>
    </div>

    <!-- Status Footer -->
    <div class="status-footer">
      Status: <strong>{{ strtoupper($invoice->status) }}</strong>
      @if($invoice->notes)
      <br><br>Notes: {{ $invoice->notes }}
      @endif
    </div>
  </div>
</body>
</html>
