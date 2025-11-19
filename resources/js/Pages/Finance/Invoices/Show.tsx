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
  const getStatusColor = (status: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      draft: { bg: 'bg-gray-100', text: 'text-gray-800' },
      sent: { bg: 'bg-blue-100', text: 'text-blue-800' },
      paid: { bg: 'bg-green-100', text: 'text-green-800' },
      overdue: { bg: 'bg-red-100', text: 'text-red-800' },
      cancelled: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
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

  return (
    <FinanceLayout title={`Invoice ${invoice.invoice_number}`}>
      <Head title={`Invoice ${invoice.invoice_number}`} />

      <div className="py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Invoice {invoice.invoice_number}
              </h1>
              <p className="text-gray-600">
                Created on {formatDate(invoice.created_at)}
              </p>
            </div>
            <Link
              href={route('finance.invoices.index')}
              className="text-indigo-600 hover:text-indigo-900 font-medium"
            >
              ← Back to Invoices
            </Link>
          </div>

          {/* Main Card */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className={`${statusColor.bg} ${statusColor.text} px-8 py-6 border-b`}>
              <div className="flex justify-between items-center">
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
                <div className="text-right">
                  <span className="text-3xl font-bold">{formatCurrency(invoice.total_amount)}</span>
                  <p className="text-sm mt-1 opacity-75">Invoice Total</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-8 space-y-8">
              {/* Invoice and Client Details */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Invoice Details */}
                <div className="lg:col-span-2">
                  <h3 className="text-base font-bold text-gray-900 mb-4 uppercase tracking-wider border-b pb-2">
                    Invoice Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Invoice Number</p>
                      <p className="font-semibold text-gray-900">{invoice.invoice_number}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Invoice Date</p>
                      <p className="font-semibold text-gray-900">{formatDate(invoice.invoice_date)}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Due Date</p>
                      <p className="font-semibold text-gray-900">{formatDate(invoice.due_date)}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Billing Period</p>
                      <p className="font-semibold text-gray-900">{invoice.billing_month}/{invoice.billing_year}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg sm:col-span-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Created By</p>
                      <p className="font-semibold text-gray-900">{invoice.user.name}</p>
                    </div>
                  </div>
                </div>

                {/* Client Details */}
                <div>
                  <h3 className="text-base font-bold text-gray-900 mb-4 uppercase tracking-wider border-b pb-2">
                    Client Information
                  </h3>
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Client Name</p>
                    <p className="font-semibold text-gray-900 text-lg mb-3">{invoice.client_name}</p>
                    {invoice.client_email && (
                      <>
                        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Email</p>
                        <p className="font-semibold text-gray-900">{invoice.client_email}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Line Items */}
              <div className="border-t pt-8">
                <h3 className="text-base font-bold text-gray-900 mb-6 uppercase tracking-wider border-b pb-2">
                  Line Items
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100 border-y-2 border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left font-bold text-gray-900 uppercase tracking-wider text-sm">
                          Description
                        </th>
                        <th className="px-6 py-4 text-center font-bold text-gray-900 uppercase tracking-wider text-sm w-20">
                          Qty
                        </th>
                        <th className="px-6 py-4 text-right font-bold text-gray-900 uppercase tracking-wider text-sm w-32">
                          Unit Price
                        </th>
                        <th className="px-6 py-4 text-right font-bold text-gray-900 uppercase tracking-wider text-sm w-32">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {invoice.lineItems.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium text-gray-900">{item.description}</td>
                          <td className="px-6 py-4 text-center text-gray-700">{item.quantity}</td>
                          <td className="px-6 py-4 text-right text-gray-700">
                            {formatCurrency(item.unit_price)}
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-gray-900">
                            {formatCurrency(item.line_total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div className="border-t-2 border-gray-200 pt-8">
                <div className="flex justify-end">
                  <div className="w-full lg:w-96">
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 font-medium">Subtotal:</span>
                          <span className="font-bold text-gray-900">{formatCurrency(invoice.subtotal)}</span>
                        </div>
                        {invoice.tax_percentage > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 font-medium">
                              Tax ({invoice.tax_percentage}%):
                            </span>
                            <span className="font-bold text-gray-900">{formatCurrency(invoice.tax_amount)}</span>
                          </div>
                        )}
                        {invoice.discount_amount > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 font-medium">Discount:</span>
                            <span className="font-bold text-green-600">
                              -{formatCurrency(invoice.discount_amount)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between items-center text-xl font-bold border-t-2 border-gray-300 pt-4">
                          <span className="text-gray-900">Total:</span>
                          <span className="text-indigo-600">{formatCurrency(invoice.total_amount)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {invoice.notes && (
                <div className="border-t pt-8">
                  <h3 className="text-base font-bold text-gray-900 mb-4 uppercase tracking-wider border-b pb-2">
                    Notes
                  </h3>
                  <div className="bg-amber-50 border border-amber-200 p-6 rounded-xl">
                    <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                      {invoice.notes}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 border-t border-gray-200">
              <div className="flex flex-wrap gap-3 justify-center">
                {invoice.status === 'draft' && (
                  <>
                    <Link
                      href={route('finance.invoices.edit', invoice.id)}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium shadow-md hover:shadow-lg"
                    >
                      Edit Invoice
                    </Link>
                    <button
                      onClick={() => handleStatusChange('send')}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium shadow-md hover:shadow-lg"
                    >
                      Send Invoice
                    </button>
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
                    <p className="text-gray-500 font-medium">
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
