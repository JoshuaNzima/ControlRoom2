import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
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

  const handleStatusChange = (action: string) => {
    if (window.confirm(`Are you sure you want to ${action} this invoice?`)) {
      router.post(route(`finance.invoices.${action}`, invoice.id));
    }
  };

  return (
    <AdminLayout title={`Invoice ${invoice.invoice_number}`}>
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
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {/* Status Banner */}
            <div className={`${statusColor.bg} ${statusColor.text} px-6 py-4 border-b`}>
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">
                  Status: {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                </span>
                <span className="text-2xl font-bold">{formatCurrency(invoice.total_amount)}</span>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Invoice and Client Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Invoice Details */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                    Invoice Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-gray-600">Invoice Number:</span>
                      <span className="font-semibold ml-2">{invoice.invoice_number}</span>
                    </p>
                    <p>
                      <span className="text-gray-600">Invoice Date:</span>
                      <span className="font-semibold ml-2">{formatDate(invoice.invoice_date)}</span>
                    </p>
                    <p>
                      <span className="text-gray-600">Due Date:</span>
                      <span className="font-semibold ml-2">{formatDate(invoice.due_date)}</span>
                    </p>
                    <p>
                      <span className="text-gray-600">Created By:</span>
                      <span className="font-semibold ml-2">{invoice.user.name}</span>
                    </p>
                  </div>
                </div>

                {/* Client Details */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                    Client Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-gray-600">Name:</span>
                      <span className="font-semibold ml-2">{invoice.client_name}</span>
                    </p>
                    {invoice.client_email && (
                      <p>
                        <span className="text-gray-600">Email:</span>
                        <span className="font-semibold ml-2">{invoice.client_email}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Line Items */}
              <div className="border-t pt-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                  Line Items
                </h3>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700">
                        Description
                      </th>
                      <th className="px-4 py-2 text-right font-semibold text-gray-700 w-16">
                        Qty
                      </th>
                      <th className="px-4 py-2 text-right font-semibold text-gray-700 w-24">
                        Unit Price
                      </th>
                      <th className="px-4 py-2 text-right font-semibold text-gray-700 w-24">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {invoice.lineItems.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-2">{item.description}</td>
                        <td className="px-4 py-2 text-right">{item.quantity}</td>
                        <td className="px-4 py-2 text-right">
                          {formatCurrency(item.unit_price)}
                        </td>
                        <td className="px-4 py-2 text-right font-semibold">
                          {formatCurrency(item.line_total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="border-t pt-6">
                <div className="flex justify-end">
                  <div className="w-full md:w-72 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-semibold">{formatCurrency(invoice.subtotal)}</span>
                    </div>
                    {invoice.tax_percentage > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          Tax ({invoice.tax_percentage}%):
                        </span>
                        <span className="font-semibold">{formatCurrency(invoice.tax_amount)}</span>
                      </div>
                    )}
                    {invoice.discount_amount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Discount:</span>
                        <span className="font-semibold">
                          -{formatCurrency(invoice.discount_amount)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total:</span>
                      <span className="text-indigo-600">{formatCurrency(invoice.total_amount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {invoice.notes && (
                <div className="border-t pt-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    Notes
                  </h3>
                  <div className="text-gray-900 bg-gray-50 p-3 rounded whitespace-pre-wrap text-sm">
                    {invoice.notes}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="bg-gray-50 px-6 py-4 border-t flex flex-wrap gap-2">
              {invoice.status === 'draft' && (
                <>
                  <Link
                    href={route('finance.invoices.edit', invoice.id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleStatusChange('send')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium text-sm"
                  >
                    Send Invoice
                  </button>
                </>
              )}

              {invoice.status === 'sent' && (
                <>
                  <button
                    onClick={() => handleStatusChange('mark-paid')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium text-sm"
                  >
                    Mark as Paid
                  </button>
                  <button
                    onClick={() => handleStatusChange('cancel')}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium text-sm"
                  >
                    Cancel Invoice
                  </button>
                </>
              )}

              {invoice.status === 'overdue' && (
                <>
                  <button
                    onClick={() => handleStatusChange('mark-paid')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium text-sm"
                  >
                    Mark as Paid
                  </button>
                  <button
                    onClick={() => handleStatusChange('cancel')}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium text-sm"
                  >
                    Cancel Invoice
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
