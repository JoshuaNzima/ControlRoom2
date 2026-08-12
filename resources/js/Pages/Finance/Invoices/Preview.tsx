import React from 'react';
import { Head, Link } from '@inertiajs/react';
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
  billing_year?: number;
  billing_month?: number;
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
  isPreview?: boolean;
}

export default function PreviewInvoice({ invoice, isPreview = false }: Props) {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      sent: 'bg-coin-100 text-coin-800 dark:bg-coin-900/30 dark:text-coin-200',
      paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
      overdue: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
      cancelled: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const period = React.useMemo(() => {
    if (!invoice.billing_month || !invoice.billing_year) return null;
    return `${String(invoice.billing_month).padStart(2, '0')}/${invoice.billing_year}`;
  }, [invoice.billing_month, invoice.billing_year]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Head title={isPreview ? `Preview Invoice ${invoice.invoice_number}` : `Invoice ${invoice.invoice_number}`} />

      {/* Preview Header */}
      <div className="sticky top-0 z-10 bg-white/90 dark:bg-gray-900/90 backdrop-blur border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isPreview && (
              <span className="px-2 py-1 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 text-xs font-semibold uppercase tracking-wide">
                Preview
              </span>
            )}
            <div className="font-semibold text-gray-900 dark:text-gray-100">
              Invoice {invoice.invoice_number}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={route('finance.invoices.show', invoice.id)}
              className="px-3 py-1.5 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 text-sm font-medium"
            >
              View Details
            </Link>
            <Link
              href={route('finance.invoices.print', invoice.id)}
              target="_blank"
              className="px-3 py-1.5 rounded-md bg-coin-600 text-white hover:bg-coin-700 text-sm font-medium"
            >
              Print
            </Link>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto p-4 md:p-8">
        {/* Invoice Card */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
          {/* Header Section */}
          <div className="p-8 border-b border-gray-200 dark:border-gray-800">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="flex items-center gap-3">
                <img
                  src="/images/Coin-logo.png"
                  alt="Logo"
                  className="h-12 w-auto"
                  onError={(e) => ((e.currentTarget.style.display = 'none'))}
                />
                <div>
                  <div className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
                    Coin Security
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Secure. Reliable. Professional.
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  INVOICE
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  #{invoice.invoice_number}
                </div>
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(invoice.status)}`}>
                  {invoice.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Invoice Details Grid */}
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-gray-200 dark:border-gray-800">
            <div>
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                Billed To
              </h4>
              <div className="bg-coin-50 dark:bg-coin-900/20 p-4 rounded-lg border border-coin-200 dark:border-coin-800">
                <div className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                  {invoice.client_name}
                </div>
                {invoice.client_email && (
                  <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {invoice.client_email}
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                  Invoice Date
                </h4>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {formatDate(invoice.invoice_date)}
                </p>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                  Due Date
                </h4>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {formatDate(invoice.due_date)}
                </p>
              </div>
              {period && (
                <div className="col-span-2">
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                    Billing Period
                  </h4>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {period}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Line Items */}
          <div className="p-8">
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-6 uppercase tracking-wider">
              Line Items
            </h3>

            {/* Mobile View */}
            <div className="md:hidden space-y-3 mb-6">
              {invoice.lineItems?.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 p-4"
                >
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {item.description}
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Qty:</span>{' '}
                      <span className="text-gray-900 dark:text-gray-100">{item.quantity}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Price:</span>{' '}
                      <span className="text-gray-900 dark:text-gray-100">{formatCurrency(item.unit_price)}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {formatCurrency(item.line_total)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-24">
                      Qty
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-32">
                      Unit Price
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-32">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {invoice.lineItems?.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-4 text-sm text-gray-900 dark:text-gray-100">
                        {item.description}
                      </td>
                      <td className="px-4 py-4 text-center text-sm text-gray-700 dark:text-gray-300">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-4 text-right text-sm text-gray-700 dark:text-gray-300">
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td className="px-4 py-4 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {formatCurrency(item.line_total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="mt-8 flex justify-end">
              <div className="w-full md:w-80 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {formatCurrency(invoice.subtotal)}
                  </span>
                </div>
                {invoice.tax_percentage > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Tax ({invoice.tax_percentage}%):
                    </span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {formatCurrency(invoice.tax_amount)}
                    </span>
                  </div>
                )}
                {invoice.discount_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Discount:</span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      -{formatCurrency(invoice.discount_amount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                  <span className="text-gray-900 dark:text-gray-100">Total:</span>
                  <span className="text-coin-700 dark:text-coin-200">
                    {formatCurrency(invoice.total_amount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="px-8 pb-8">
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <h4 className="text-xs font-semibold text-amber-800 dark:text-amber-200 uppercase tracking-wide mb-2">
                  Notes
                </h4>
                <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                  {invoice.notes}
                </p>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-800/50 px-8 py-6 border-t border-gray-200 dark:border-gray-800">
            <div className="text-center text-sm text-gray-500 dark:text-gray-400">
              <p className="font-medium">Thank you for your business.</p>
              <p className="mt-1 text-xs">
                Created by {invoice.user?.name} on {formatDate(invoice.created_at)}
              </p>
            </div>
          </div>
        </div>

        {/* Preview Actions */}
        {isPreview && invoice.status === 'draft' && (
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href={route('finance.invoices.index', { edit: invoice.id })}
              className="px-6 py-3 bg-coin-700 text-white rounded-lg hover:bg-coin-600 font-medium shadow-md"
            >
              Edit Invoice
            </Link>
            <Link
              href={route('finance.invoices.pdf', invoice.id)}
              className="px-6 py-3 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 font-medium"
            >
              Download PDF
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
