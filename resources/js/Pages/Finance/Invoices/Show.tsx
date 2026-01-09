import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import FinanceLayout from '@/Layouts/FinanceLayout';
import { formatCurrency, formatDate } from '@/utils/formatters';

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
  created_at: string;
  updated_at: string;
}

interface Props {
  invoice: Invoice;
}

export default function ShowInvoice({ invoice }: Props) {
  const [channels, setChannels] = React.useState<{ email: boolean; whatsapp: boolean }>({ email: true, whatsapp: true });
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

  return (
    <FinanceLayout title={`Invoice ${invoice.invoice_number}`}>
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
            </div>
          </div>

          {/* Main Card */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg overflow-hidden">
            <div className={`${statusColor.bg} ${statusColor.text} px-8 py-6 border-b border-gray-200 dark:border-gray-800`}>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div>
                  <span className="text-xl font-bold">
                    Status: {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                  </span>
                  {statusDescription[invoice.status] && (
                    <p className="text-sm mt-2 opacity-90 max-w-lg">
                      {statusDescription[invoice.status]}
                    </p>
                  )}
                </div>
                <div className="text-right sm:text-right">
                  <span className="text-3xl font-bold">{formatCurrency(invoice.total_amount)}</span>
                  <p className="text-sm mt-1 opacity-75">Invoice Total</p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-800">
                <img src="/images/Coin-logo.png" alt="Logo" className="h-9 w-auto" onError={(e) => ((e.currentTarget.style.display='none'))} />
                <div className="text-emerald-700 dark:text-emerald-400 font-semibold text-lg">Coin Security</div>
              </div>
              {/* Invoice and Client Details */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Invoice Details */}
                <div className="lg:col-span-2">
                  <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-4 uppercase tracking-wider border-b border-gray-200 dark:border-gray-800 pb-2">
                    Invoice Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Invoice Number</p>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{invoice.invoice_number}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Invoice Date</p>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{formatDate(invoice.invoice_date)}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Due Date</p>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{formatDate(invoice.due_date)}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Billing Period</p>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{invoice.billing_month}/{invoice.billing_year}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg sm:col-span-2">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Created By</p>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{invoice.user.name}</p>
                    </div>
                  </div>
                </div>

                {/* Client Details */}
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-4 uppercase tracking-wider border-b border-gray-200 dark:border-gray-800 pb-2">
                    Client Information
                  </h3>
                  <div className="bg-coin-50 dark:bg-coin-900/20 p-4 rounded-lg border border-coin-200 dark:border-coin-800">
                    <p className="text-xs font-semibold text-coin-700 dark:text-coin-200 uppercase tracking-wide mb-1">Client Name</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-lg mb-3">{invoice.client_name}</p>
                    {invoice.client_email && (
                      <>
                        <p className="text-xs font-semibold text-coin-700 dark:text-coin-200 uppercase tracking-wide mb-1">Email</p>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{invoice.client_email}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Line Items */}
              <div className="border-t pt-8">
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-6 uppercase tracking-wider border-b border-gray-200 dark:border-gray-800 pb-2">
                  Line Items
                </h3>
                <div className="md:hidden space-y-3">
                  {invoice.lineItems.map((item) => (
                    <div key={item.id} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
                      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{item.description}</div>
                      <div className="mt-3 grid grid-cols-1 gap-2 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-gray-500 dark:text-gray-400">Qty</span>
                          <span className="text-gray-900 dark:text-gray-100">{item.quantity}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-gray-500 dark:text-gray-400">Unit price</span>
                          <span className="text-gray-900 dark:text-gray-100">{formatCurrency(item.unit_price)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-gray-500 dark:text-gray-400">Total</span>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(item.line_total)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-[700px] w-full">
                    <thead className="bg-gray-100 dark:bg-gray-950 border-y-2 border-gray-200 dark:border-gray-800">
                      <tr>
                        <th className="px-6 py-4 text-left font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider text-sm">
                          Description
                        </th>
                        <th className="px-6 py-4 text-center font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider text-sm w-20">
                          Qty
                        </th>
                        <th className="px-6 py-4 text-right font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider text-sm w-32">
                          Unit Price
                        </th>
                        <th className="px-6 py-4 text-right font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider text-sm w-32">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {invoice.lineItems.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                          <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">{item.description}</td>
                          <td className="px-6 py-4 text-center text-gray-700 dark:text-gray-300">{item.quantity}</td>
                          <td className="px-6 py-4 text-right text-gray-700 dark:text-gray-300">
                            {formatCurrency(item.unit_price)}
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-gray-100">
                            {formatCurrency(item.line_total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div className="border-t-2 border-gray-200 dark:border-gray-800 pt-8">
                <div className="flex justify-end">
                  <div className="w-full lg:w-96">
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-300 font-medium">Subtotal:</span>
                          <span className="font-bold text-gray-900 dark:text-gray-100">{formatCurrency(invoice.subtotal)}</span>
                        </div>
                        {invoice.tax_percentage > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-300 font-medium">
                              Tax ({invoice.tax_percentage}%):
                            </span>
                            <span className="font-bold text-gray-900 dark:text-gray-100">{formatCurrency(invoice.tax_amount)}</span>
                          </div>
                        )}
                        {invoice.discount_amount > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-300 font-medium">Discount:</span>
                            <span className="font-bold text-green-600">
                              -{formatCurrency(invoice.discount_amount)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between items-center text-xl font-bold border-t-2 border-gray-300 dark:border-gray-700 pt-4">
                          <span className="text-gray-900 dark:text-gray-100">Total:</span>
                          <span className="text-coin-700 dark:text-coin-200">{formatCurrency(invoice.total_amount)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

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

            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-8 py-6 border-t border-gray-200 dark:border-gray-800">
              <div className="flex flex-wrap gap-3 justify-center">
                {invoice.status === 'draft' && (
                  <>
                    <Link
                      href={route('finance.invoices.index', { edit: invoice.id })}
                      className="w-full sm:w-auto px-6 py-3 bg-coin-700 text-white rounded-lg hover:bg-coin-600 transition-all font-medium shadow-md hover:shadow-lg"
                    >
                      Edit Invoice
                    </Link>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
                      <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                        <input className="rounded border-gray-300 dark:border-gray-600 dark:bg-gray-900" type="checkbox" checked={channels.email} onChange={(e) => setChannels((c) => ({ ...c, email: e.target.checked }))} />
                        Email
                      </label>
                      <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                        <input className="rounded border-gray-300 dark:border-gray-600 dark:bg-gray-900" type="checkbox" checked={channels.whatsapp} onChange={(e) => setChannels((c) => ({ ...c, whatsapp: e.target.checked }))} />
                        WhatsApp
                      </label>
                      <button
                        onClick={handleSend}
                        className="w-full sm:w-auto px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium shadow-md hover:shadow-lg"
                      >
                        Send Selected
                      </button>
                    </div>
                  </>
                )}

                {invoice.status === 'sent' && (
                  <>
                    <button
                      onClick={() => handleStatusChange('mark-paid')}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium shadow-md hover:shadow-lg"
                    >
                      Mark as Paid
                    </button>
                    <button
                      onClick={() => handleStatusChange('cancel')}
                      className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-medium shadow-md hover:shadow-lg"
                    >
                      Cancel Invoice
                    </button>
                  </>
                )}

                {invoice.status === 'overdue' && (
                  <>
                    <button
                      onClick={() => handleStatusChange('mark-paid')}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium shadow-md hover:shadow-lg"
                    >
                      Mark as Paid
                    </button>
                    <button
                      onClick={() => handleStatusChange('cancel')}
                      className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-medium shadow-md hover:shadow-lg"
                    >
                      Cancel Invoice
                    </button>
                  </>
                )}

                {(invoice.status === 'paid' || invoice.status === 'cancelled') && (
                  <div className="text-center">
                    <p className="text-gray-500 dark:text-gray-400 font-medium">
                      {invoice.status === 'paid' ? 'Invoice has been paid and is closed.' : 'Invoice has been cancelled.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </FinanceLayout>
  );
}
