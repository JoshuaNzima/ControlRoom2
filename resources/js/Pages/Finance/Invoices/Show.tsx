import React from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { formatCurrency, formatDate } from '@/utils/formatters';

interface InvoicePayment {
  id: number;
  amount: number;
  payment_date: string;
  payment_method: string | null;
  reference: string | null;
  notes: string | null;
  recorded_by: {
    id: number;
    name: string;
  };
  created_at: string;
}

interface InvoiceLineItem {
  id: number;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

interface Invoice {
  id: number;
  invoice_number: string;
  client_name: string;
  client_email?: string;
  billing_year: number;
  billing_month: number;
  subtotal: number;
  tax_amount: number;
  tax_percentage: number;
  discount_amount: number;
  total_amount: number;
  invoice_date: string;
  due_date: string;
  description?: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  notes?: string;
  user: {
    id: number;
    name: string;
  };
  lineItems: InvoiceLineItem[];
  payments: InvoicePayment[];
  paymentSummary?: {
    total_paid: number;
    balance_due: number;
    payment_count: number;
  };
  created_at: string;
  updated_at: string;
}

interface Props {
  invoice: Invoice;
}

export default function ShowInvoice({ invoice }: Props) {
  const [channels, setChannels] = React.useState<{ email: boolean; whatsapp: boolean }>({ email: true, whatsapp: true });
  const [paymentModalOpen, setPaymentModalOpen] = React.useState(false);
  const { data, setData, post, processing, reset, errors } = useForm({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    reference: '',
    notes: '',
  });
  const getStatusColor = (status: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      draft: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-800 dark:text-gray-200' },
      sent: { bg: 'bg-coin-100 dark:bg-coin-900/30', text: 'text-coin-800 dark:text-coin-200' },
      paid: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-200' },
      overdue: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-200' },
      cancelled: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-200' },
    };
    return colors[status] || { bg: 'bg-gray-100', text: 'text-gray-800' };
  };

  const statusColor = getStatusColor(invoice.status);
  const statusDescription: Record<string, string> = {
    draft: 'Draft invoice. Not yet sent to the client.',
    sent: 'Sent to the client and awaiting payment.',
    paid: 'Payment received. This invoice is settled.',
    overdue: 'Payment is overdue based on the due date.',
    cancelled: 'Invoice has been cancelled and should not be collected.',
  };

  const handleStatusChange = (action: string) => {
    if (window.confirm(`Are you sure you want to ${action} this invoice?`)) {
      router.post(route(`finance.invoices.${action}`, invoice.id));
    }
  };

  const handleSend = () => {
    const selected = Object.entries(channels)
      .filter(([, v]) => v)
      .map(([k]) => k);
    router.post(route('finance.invoices.send', invoice.id), { channels: selected });
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('finance.invoices.record-payment', invoice.id), {
      onSuccess: () => {
        setPaymentModalOpen(false);
        reset();
      },
    });
  };

  const totalPaid = invoice.paymentSummary?.total_paid ?? 0;
  const balanceDue = invoice.paymentSummary?.balance_due ?? invoice.total_amount;
  const hasPartialPayments = (invoice.paymentSummary?.payment_count ?? 0) > 0;

  return (
    <AuthenticatedLayout header={`Invoice ${invoice.invoice_number}`}>
      <Head title={`Invoice ${invoice.invoice_number}`} />

      <div className="py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Invoice {invoice.invoice_number}
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Created on {formatDate(invoice.created_at)}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <Link
                href={route('finance.invoices.index')}
                className="text-coin-700 hover:text-coin-800 dark:text-coin-200 dark:hover:text-coin-100 font-medium"
              >
                ← Back to Invoices
              </Link>
              <Link
                href={route('finance.invoices.print', invoice.id)}
                className="w-full sm:w-auto px-3 py-1.5 rounded-md bg-coin-700 text-white hover:bg-coin-600 font-medium"
                target="_blank"
                rel="noopener"
              >
                Print
              </Link>
              <Link
                href={route('finance.invoices.pdf', invoice.id)}
                className="w-full sm:w-auto px-3 py-1.5 rounded-md bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 font-medium"
              >
                Download PDF
              </Link>
              <Link
                href={route('finance.invoices.preview', invoice.id)}
                className="w-full sm:w-auto px-3 py-1.5 rounded-md bg-coin-100 text-coin-800 hover:bg-coin-200 dark:bg-coin-900/30 dark:text-coin-200 font-medium"
              >
                Preview
              </Link>
            </div>
          </div>

          {/* Main Card */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg overflow-hidden">
            {/* Compact Status Banner */}
            <div className={`${statusColor.bg} ${statusColor.text} px-4 py-3 border-b border-gray-200 dark:border-gray-800`}>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">
                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                  </span>
                  {statusDescription[invoice.status] && (
                    <span className="text-xs opacity-75 hidden sm:inline">- {statusDescription[invoice.status]}</span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  {hasPartialPayments && (
                    <div className="text-xs">
                      <span className="text-green-600 dark:text-green-400 font-medium">Paid: {formatCurrency(totalPaid)}</span>
                      {balanceDue > 0 && (
                        <span className="ml-2 text-red-600 dark:text-red-400 font-medium">Balance: {formatCurrency(balanceDue)}</span>
                      )}
                    </div>
                  )}
                  <span className="text-xl font-bold">{formatCurrency(invoice.total_amount)}</span>
                </div>
              </div>
            </div>

            {/* Zingani Invoice Preview */}
            <div className="p-8 bg-white" style={{ fontFamily: "'Gill Sans MT', Calibri, Arial, sans-serif" }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <colgroup>
                  <col style={{ width: '2%' }} />
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '28%' }} />
                  <col style={{ width: '18%' }} />
                  <col style={{ width: '20%' }} />
                  <col style={{ width: '1%' }} />
                  <col style={{ width: '1%' }} />
                </colgroup>
                <tbody>
                  {/* Row 0: Company Name + Logo */}
                  <tr>
                    <td>&nbsp;</td>
                    <td colSpan={2} style={{ fontFamily: "'Bookman Old Style', Georgia, serif", fontSize: '18pt', fontWeight: 'bold', color: '#FF0000', verticalAlign: 'middle' }}>
                      COIN SECURITY SERVICES
                    </td>
                    <td></td>
                    <td colSpan={4}>
                      <img src="/images/Coin-logo.png" alt="Coin Security Logo" style={{ width: '120px', height: 'auto', marginLeft: 'auto', display: 'block' }} />
                    </td>
                  </tr>
                  {/* Row 1: Tagline */}
                  <tr>
                    <td>&nbsp;</td>
                    <td colSpan={3} style={{ fontFamily: "'Brush Script MT', cursive", fontSize: '14pt', fontWeight: 'bold', color: '#FF0000', textAlign: 'center' }}>
                      Prevent | Respond | Protect
                    </td>
                    <td colSpan={4}></td>
                  </tr>
                  {/* Row 2-5: Address & Contact */}
                  <tr>
                    <td>&nbsp;</td>
                    <td style={{ fontSize: '9pt', paddingLeft: '9px' }}>P.O. Box 30450</td>
                    <td></td><td></td>
                    <td style={{ fontSize: '9pt', fontWeight: 'bold', color: '#969696', textAlign: 'right', paddingRight: '8px' }}>Phone:</td>
                    <td style={{ fontSize: '9pt' }}>(265) 0999 611 711</td>
                    <td>&nbsp;</td><td></td>
                  </tr>
                  <tr>
                    <td>&nbsp;</td>
                    <td style={{ fontSize: '9pt', paddingLeft: '9px' }}>Area 47 Sector 4, Viphya Street</td>
                    <td></td><td></td>
                    <td style={{ fontSize: '9pt', fontWeight: 'bold', color: '#969696', textAlign: 'right', paddingRight: '8px' }}>Head Office:</td>
                    <td style={{ fontSize: '9pt' }}>(265) 0999 611 712</td>
                    <td>&nbsp;</td><td></td>
                  </tr>
                  <tr>
                    <td>&nbsp;</td>
                    <td style={{ fontSize: '9pt', paddingLeft: '9px' }}>Lilongwe</td>
                    <td></td><td></td>
                    <td style={{ fontSize: '9pt', fontWeight: 'bold', color: '#969696', textAlign: 'right', paddingRight: '8px' }}>Off Hours:</td>
                    <td style={{ fontSize: '9pt' }}>(265) 0999 958 589</td>
                    <td>&nbsp;</td><td></td>
                  </tr>
                  <tr>
                    <td>&nbsp;</td>
                    <td></td><td></td><td></td>
                    <td style={{ fontSize: '9pt', fontWeight: 'bold', color: '#969696', textAlign: 'right', paddingRight: '8px' }}>E-mail:</td>
                    <td style={{ fontSize: '9pt', textDecoration: 'underline', color: '#A599AE' }}>coinsec9@gmail.com</td>
                    <td></td><td></td>
                  </tr>
                  {/* Empty row */}
                  <tr><td>&nbsp;</td><td colSpan={6}>&nbsp;</td><td>&nbsp;</td></tr>
                  {/* Invoice # */}
                  <tr>
                    <td>&nbsp;</td>
                    <td style={{ fontSize: '12pt', fontWeight: 'bold', fontStyle: 'italic', color: '#969696' }}>INVOICE</td>
                    <td colSpan={2} style={{ fontFamily: "'Arial Rounded MT Bold', Arial, sans-serif", fontSize: '14pt', fontWeight: 'bold' }}>
                      {invoice.invoice_number}
                    </td>
                    <td colSpan={4}></td>
                  </tr>
                  <tr><td>&nbsp;</td><td colSpan={6}>&nbsp;</td><td>&nbsp;</td></tr>
                  {/* Account & Bill To */}
                  <tr>
                    <td>&nbsp;</td>
                    <td style={{ fontSize: '9pt', fontWeight: 'bold', color: '#969696', textAlign: 'right', paddingRight: '8px' }}>Account #:</td>
                    <td style={{ fontFamily: "'Arial Rounded MT Bold', Arial, sans-serif", fontSize: '11pt', fontWeight: 'bold' }}>
                      {invoice.billing_year || new Date().getFullYear()}/{invoice.client_name.substring(0, 3).toUpperCase()}/{String(invoice.id).padStart(2, '0')}
                    </td>
                    <td></td>
                    <td style={{ fontSize: '9pt', fontWeight: 'bold', color: '#969696', textAlign: 'right', paddingRight: '8px' }}>Bill To:</td>
                    <td style={{ fontFamily: "'Calibri', Arial, sans-serif", fontSize: '11pt', fontWeight: 'bold' }}>{invoice.client_name}</td>
                    <td>&nbsp;</td><td></td>
                  </tr>
                  <tr>
                    <td>&nbsp;</td>
                    <td style={{ fontSize: '9pt', fontWeight: 'bold', color: '#969696', textAlign: 'right', paddingRight: '8px' }}>Date:</td>
                    <td style={{ fontSize: '9pt' }}>{formatDate(invoice.invoice_date)}</td>
                    <td></td><td></td>
                    <td style={{ fontSize: '9pt', fontWeight: 'bold' }}>{invoice.client_email || 'Lilongwe'}</td>
                    <td>&nbsp;</td><td></td>
                  </tr>
                  <tr>
                    <td>&nbsp;</td>
                    <td style={{ fontSize: '9pt', fontWeight: 'bold', color: '#969696', textAlign: 'right', paddingRight: '8px' }}>Customer ID:</td>
                    <td style={{ fontSize: '9pt' }}>{invoice.id}</td>
                    <td colSpan={5}></td>
                  </tr>
                  {/* Empty rows */}
                  <tr><td>&nbsp;</td><td colSpan={6}>&nbsp;</td><td>&nbsp;</td></tr>
                  <tr><td>&nbsp;</td><td colSpan={6}>&nbsp;</td><td>&nbsp;</td></tr>
                  {/* Column Headers */}
                  <tr>
                    <td>&nbsp;</td>
                    <td style={{ fontSize: '9pt' }}>Qty</td>
                    <td style={{ fontSize: '9pt' }}>Type</td>
                    <td style={{ fontSize: '9pt' }}>Description</td>
                    <td style={{ fontSize: '9pt' }}>Unit</td>
                    <td style={{ fontSize: '9pt' }}>Amount</td>
                    <td>&nbsp;</td><td>&nbsp;</td>
                  </tr>
                  {/* Line Items */}
                  {invoice.lineItems.map((item) => (
                    <tr key={item.id}>
                      <td>&nbsp;</td>
                      <td style={{ fontSize: '9pt' }}>{item.quantity}</td>
                      <td style={{ fontSize: '9pt' }}>Security Service</td>
                      <td style={{ fontSize: '9pt' }}>{item.description}</td>
                      <td style={{ fontSize: '9pt', textAlign: 'right' }}>{formatCurrency(item.unit_price)}</td>
                      <td style={{ fontSize: '9pt', textAlign: 'right' }}>{formatCurrency(item.line_total)}</td>
                      <td>&nbsp;</td><td>&nbsp;</td>
                    </tr>
                  ))}
                  {/* Empty rows padding */}
                  {invoice.lineItems.length < 5 && Array.from({ length: 5 - invoice.lineItems.length }).map((_, i) => (
                    <tr key={`empty-${i}`}><td>&nbsp;</td><td colSpan={4}>&nbsp;</td><td style={{ textAlign: 'right' }}>0</td><td>&nbsp;</td><td>&nbsp;</td></tr>
                  ))}
                  <tr><td>&nbsp;</td><td colSpan={4}>&nbsp;</td><td style={{ textAlign: 'right' }}>0</td><td>&nbsp;</td><td>&nbsp;</td></tr>
                  {/* SubTotal */}
                  <tr>
                    <td>&nbsp;</td>
                    <td colSpan={3}></td>
                    <td style={{ fontSize: '10pt', fontStyle: 'italic', backgroundColor: '#D8E2EA', border: '1px solid #C6D1D4', textAlign: 'center' }}>SubTotal</td>
                    <td style={{ fontSize: '10pt', backgroundColor: '#D8E2EA', border: '1px solid #C6D1D4', textAlign: 'right', paddingRight: '8px' }}>{formatCurrency(invoice.subtotal)}</td>
                    <td>&nbsp;</td><td>&nbsp;</td>
                  </tr>
                  {/* Public Holidays placeholder */}
                  <tr>
                    <td>&nbsp;</td>
                    <td></td>
                    <td style={{ fontSize: '10pt', backgroundColor: '#D8E2EA' }}>Public Holidays</td>
                    <td style={{ backgroundColor: '#D8E2EA', borderTop: '1px solid #C6D1D4', borderBottom: '1px solid #C6D1D4', borderRight: '1px solid #C6D1D4' }}></td>
                    <td style={{ backgroundColor: '#D8E2EA', border: '1px solid #C6D1D4' }}></td>
                    <td style={{ fontSize: '10pt', backgroundColor: '#D8E2EA', textAlign: 'right' }}>0</td>
                    <td>&nbsp;</td><td>&nbsp;</td>
                  </tr>
                  {/* TOTAL */}
                  <tr>
                    <td>&nbsp;</td>
                    <td colSpan={3}></td>
                    <td style={{ fontSize: '10pt', fontWeight: 'bold', backgroundColor: '#EBF0F4', border: '1px solid #C6D1D4', textAlign: 'right', paddingRight: '8px' }}>TOTAL</td>
                    <td style={{ fontSize: '10pt', fontWeight: 'bold', backgroundColor: '#EBF0F4', border: '1px solid #C6D1D4', textAlign: 'right', paddingRight: '8px' }}>{formatCurrency(invoice.total_amount)}</td>
                    <td>&nbsp;</td><td>&nbsp;</td>
                  </tr>
                  {/* Reminder & Terms */}
                  <tr>
                    <td>&nbsp;</td>
                    <td colSpan={3} style={{ fontSize: '9pt' }}>
                      <span style={{ fontWeight: 'bold', color: '#969696' }}>Reminder:</span>
                      <span style={{ color: '#969696' }}> Please include the statement number on your cheque.</span>
                    </td>
                    <td colSpan={4}></td>
                  </tr>
                  <tr>
                    <td>&nbsp;</td>
                    <td colSpan={3} style={{ fontSize: '9pt' }}>
                      <span style={{ fontWeight: 'bold', color: '#969696' }}>Terms:</span>
                      <span style={{ color: '#969696' }}> Payment due on {formatDate(invoice.due_date)}.</span>
                    </td>
                    <td colSpan={4}></td>
                  </tr>
                  <tr><td>&nbsp;</td><td colSpan={6}>&nbsp;</td><td>&nbsp;</td></tr>
                  {/* Mode of Payment */}
                  <tr>
                    <td>&nbsp;</td>
                    <td colSpan={5} style={{ fontSize: '10pt', fontWeight: 'bold', color: '#FFFFFF', backgroundColor: '#C5D4E0', textAlign: 'center', borderLeft: '1px solid #DDE9EC' }}>MODE OF PAYMENT</td>
                    <td>&nbsp;</td><td>&nbsp;</td>
                  </tr>
                  <tr>
                    <td>&nbsp;</td>
                    <td style={{ fontSize: '10pt', fontWeight: 'bold', fontStyle: 'italic', color: '#969696', borderBottom: '1px solid #C0C0C0', borderLeft: '1px solid #DDE9EC' }}>Cheque:</td>
                    <td colSpan={2} style={{ fontSize: '9pt', fontWeight: 'bold', border: '1px solid #DDE9EC' }}>Coin Security Services</td>
                    <td style={{ fontSize: '9pt', fontWeight: 'bold', border: '1px solid #BFBFBF' }}>Coin Security Services</td>
                    <td style={{ border: '1px solid #BFBFBF' }}></td>
                    <td>&nbsp;</td><td>&nbsp;</td>
                  </tr>
                  <tr>
                    <td>&nbsp;</td>
                    <td style={{ fontSize: '10pt', fontWeight: 'bold', fontStyle: 'italic', color: '#969696', borderBottom: '1px solid #C0C0C0', borderLeft: '1px solid #DDE9EC' }}>Bank Transfer:</td>
                    <td colSpan={2} style={{ fontSize: '9pt', fontWeight: 'bold', border: '1px solid #DDE9EC' }}>First Capital Bank</td>
                    <td style={{ fontSize: '9pt', fontWeight: 'bold', border: '1px solid #BFBFBF' }}>Standard Bank Malawi</td>
                    <td style={{ border: '1px solid #BFBFBF' }}></td>
                    <td>&nbsp;</td><td>&nbsp;</td>
                  </tr>
                  <tr>
                    <td>&nbsp;</td>
                    <td style={{ fontSize: '10pt', fontWeight: 'bold', fontStyle: 'italic', color: '#969696', border: '1px solid #C0C0C0' }}>Account #:</td>
                    <td colSpan={2} style={{ fontSize: '9pt', border: '1px solid #DDE9EC' }}>0635168006</td>
                    <td style={{ fontSize: '9pt', border: '1px solid #BFBFBF' }}>9100005509979</td>
                    <td style={{ border: '1px solid #BFBFBF' }}></td>
                    <td>&nbsp;</td><td>&nbsp;</td>
                  </tr>
                  <tr>
                    <td>&nbsp;</td>
                    <td style={{ fontSize: '10pt', fontWeight: 'bold', fontStyle: 'italic', color: '#969696', border: '1px solid #C0C0C0' }}>Branch:</td>
                    <td colSpan={2} style={{ fontSize: '9pt', border: '1px solid #DDE9EC' }}>City Centre</td>
                    <td style={{ fontSize: '9pt', border: '1px solid #BFBFBF' }}>City Centre</td>
                    <td style={{ border: '1px solid #BFBFBF' }}></td>
                    <td>&nbsp;</td><td>&nbsp;</td>
                  </tr>
                  <tr>
                    <td>&nbsp;</td>
                    <td style={{ fontSize: '10pt', fontWeight: 'bold', fontStyle: 'italic', color: '#969696', border: '1px solid #C0C0C0' }}>Due Date:</td>
                    <td colSpan={2} style={{ fontSize: '9pt', border: '1px solid #DDE9EC' }}>{formatDate(invoice.due_date)}</td>
                    <td style={{ border: '1px solid #BFBFBF' }}></td>
                    <td style={{ border: '1px solid #BFBFBF' }}></td>
                    <td>&nbsp;</td><td>&nbsp;</td>
                  </tr>
                  <tr><td>&nbsp;</td><td colSpan={6}>&nbsp;</td><td>&nbsp;</td></tr>
                  {/* Signature */}
                  <tr>
                    <td>&nbsp;</td>
                    <td style={{ fontSize: '10pt', fontWeight: 'bold', fontStyle: 'italic', color: '#969696' }}>Authorised By</td>
                    <td colSpan={6}>&nbsp;</td>
                  </tr>
                  <tr><td>&nbsp;</td><td colSpan={6}>&nbsp;</td><td>&nbsp;</td></tr>
                  <tr>
                    <td>&nbsp;</td>
                    <td style={{ fontSize: '10pt', fontWeight: 'bold', fontStyle: 'italic', color: '#969696' }}>Signature</td>
                    <td colSpan={6}>&nbsp;</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Invoice Content Area */}
            <div className="p-8 space-y-8">
              {/* Payments */}
              {hasPartialPayments && (
                <div className="border-t pt-8">
                  <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-4 uppercase tracking-wider border-b border-gray-200 dark:border-gray-800 pb-2">
                    Payments ({invoice.paymentSummary?.payment_count})
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Date</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Method</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Reference</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Recorded By</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {invoice.payments.map((payment) => (
                          <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{formatDate(payment.payment_date)}</td>
                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 capitalize">{payment.payment_method?.replace('_', ' ') || 'Other'}</td>
                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{payment.reference || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{payment.recorded_by?.name || '-'}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-green-600 dark:text-green-400 text-right">{formatCurrency(payment.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50 dark:bg-gray-900/50 border-t-2 border-gray-200 dark:border-gray-700">
                        <tr>
                          <td colSpan={4} className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100 text-right">Total Paid:</td>
                          <td className="px-4 py-3 text-sm font-bold text-green-600 dark:text-green-400 text-right">{formatCurrency(totalPaid)}</td>
                        </tr>
                        {balanceDue > 0 && (
                          <tr>
                            <td colSpan={4} className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100 text-right">Balance Due:</td>
                            <td className="px-4 py-3 text-sm font-bold text-red-600 dark:text-red-400 text-right">{formatCurrency(balanceDue)}</td>
                          </tr>
                        )}
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* Notes */}
              {invoice.notes && (
                <div className="border-t pt-8">
                  <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-4 uppercase tracking-wider border-b border-gray-200 dark:border-gray-800 pb-2">
                    Notes
                  </h3>
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-6 rounded-xl">
                    <div className="whitespace-pre-wrap text-gray-800 dark:text-gray-100 leading-relaxed">
                      {invoice.notes}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Compact Action Buttons */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-800">
              <div className="flex flex-wrap gap-2 justify-center">
                {invoice.status === 'draft' && (
                  <>
                    <Link
                      href={route('finance.invoices.index', { edit: invoice.id })}
                      className="px-4 py-2 bg-coin-700 text-white rounded-lg hover:bg-coin-600 text-sm font-medium"
                    >
                      Edit
                    </Link>
                    <div className="flex items-center gap-2">
                      <label className="inline-flex items-center gap-1 text-sm text-gray-700 dark:text-gray-200">
                        <input className="rounded border-gray-300 dark:border-gray-600 dark:bg-gray-900" type="checkbox" checked={channels.email} onChange={(e) => setChannels((c) => ({ ...c, email: e.target.checked }))} />
                        Email
                      </label>
                      <label className="inline-flex items-center gap-1 text-sm text-gray-700 dark:text-gray-200">
                        <input className="rounded border-gray-300 dark:border-gray-600 dark:bg-gray-900" type="checkbox" checked={channels.whatsapp} onChange={(e) => setChannels((c) => ({ ...c, whatsapp: e.target.checked }))} />
                        WhatsApp
                      </label>
                      <button
                        onClick={handleSend}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                      >
                        Send
                      </button>
                    </div>
                  </>
                )}

                {invoice.status === 'sent' && (
                  <>
                    <button
                      onClick={() => setPaymentModalOpen(true)}
                      className="px-4 py-2 bg-coin-600 text-white rounded-lg hover:bg-coin-700 text-sm font-medium"
                    >
                      Record Payment
                    </button>
                    <button
                      onClick={() => handleStatusChange('mark-paid')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                    >
                      Mark Paid
                    </button>
                    <button
                      onClick={() => handleStatusChange('cancel')}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </>
                )}

                {invoice.status === 'overdue' && (
                  <>
                    <button
                      onClick={() => setPaymentModalOpen(true)}
                      className="px-4 py-2 bg-coin-600 text-white rounded-lg hover:bg-coin-700 text-sm font-medium"
                    >
                      Record Payment
                    </button>
                    <button
                      onClick={() => handleStatusChange('mark-paid')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                    >
                      Mark Paid
                    </button>
                    <button
                      onClick={() => handleStatusChange('cancel')}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </>
                )}

                {(invoice.status === 'paid' || invoice.status === 'cancelled') && (
                  <div className="text-center">
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                      {invoice.status === 'paid' ? 'Invoice paid and closed.' : 'Invoice cancelled.'}
                    </p>
                    {hasPartialPayments && invoice.status === 'paid' && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Paid via {invoice.paymentSummary?.payment_count} payment{invoice.paymentSummary?.payment_count !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Record Payment Modal */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Record Payment</h2>
              <button
                onClick={() => setPaymentModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Invoice Total:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(invoice.total_amount)}</span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Already Paid:</span>
                  <span className="font-medium text-green-600 dark:text-green-400">{formatCurrency(totalPaid)}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                  <span className="text-gray-600 dark:text-gray-400">Balance Due:</span>
                  <span className="font-bold text-coin-700 dark:text-coin-200">{formatCurrency(balanceDue)}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={balanceDue}
                  required
                  value={data.amount}
                  onChange={(e) => setData('amount', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-coin-500 focus:border-coin-500"
                  placeholder="0.00"
                />
                {errors.amount && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.amount}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Date *</label>
                <input
                  type="date"
                  required
                  value={data.payment_date}
                  onChange={(e) => setData('payment_date', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-coin-500 focus:border-coin-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Method</label>
                <select
                  value={data.payment_method}
                  onChange={(e) => setData('payment_method', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-coin-500 focus:border-coin-500"
                >
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                  <option value="mobile_money">Mobile Money</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reference / Receipt #</label>
                <input
                  type="text"
                  value={data.reference}
                  onChange={(e) => setData('reference', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-coin-500 focus:border-coin-500"
                  placeholder="Optional reference number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={data.notes}
                  onChange={(e) => setData('notes', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-coin-500 focus:border-coin-500"
                  placeholder="Optional notes about this payment"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AuthenticatedLayout>
  );
}
