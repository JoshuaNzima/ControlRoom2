import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { formatCurrency } from '@/utils/formatters';

interface InvoiceLineItem {
  id?: number;
  description: string;
  quantity: number;
  unit_price: number;
  line_total?: number;
}

interface Invoice {
  id: number;
  invoice_number: string;
  client_name: string;
  client_email?: string;
  subtotal: number;
  tax_percentage: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  invoice_date: string;
  due_date: string;
  description?: string;
  notes?: string;
  lineItems: InvoiceLineItem[];
}

interface Props {
  invoice: Invoice;
}

export default function EditInvoice({ invoice }: Props) {
  const { data, setData, put, processing, errors } = useForm({
    client_name: invoice.client_name,
    client_email: invoice.client_email || '',
    subtotal: invoice.subtotal,
    tax_percentage: invoice.tax_percentage,
    tax_amount: invoice.tax_amount,
    discount_amount: invoice.discount_amount,
    total_amount: invoice.total_amount,
    invoice_date: invoice.invoice_date.split('T')[0],
    due_date: invoice.due_date.split('T')[0],
    description: invoice.description || '',
    notes: invoice.notes || '',
    line_items: invoice.lineItems.map((item) => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
    })),
  });

  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>(
    invoice.lineItems.map((item) => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
    }))
  );

  const addLineItem = () => {
    const newItems = [...lineItems, { description: '', quantity: 1, unit_price: 0 }];
    setLineItems(newItems);
    setData('line_items', newItems as any);
  };

  const removeLineItem = (index: number) => {
    const newItems = lineItems.filter((_, i) => i !== index);
    setLineItems(newItems);
    setData('line_items', newItems as any);
  };

  const updateLineItem = (index: number, field: keyof InvoiceLineItem, value: any) => {
    const newItems = [...lineItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setLineItems(newItems);
    setData('line_items', newItems as any);
    updateTotals(newItems);
  };

  const updateTotals = (items: InvoiceLineItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
    const taxAmount = subtotal * (parseFloat(data.tax_percentage as any) / 100);
    const total = subtotal + taxAmount - (parseFloat(data.discount_amount as any) || 0);

    setData({
      ...data,
      subtotal,
      tax_amount: taxAmount,
      total_amount: total,
      line_items: items as any,
    });
  };

  const handleTaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const taxPerc = parseFloat(e.target.value) || 0;
    const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
    const taxAmount = subtotal * (taxPerc / 100);
    const total = subtotal + taxAmount - (parseFloat(data.discount_amount as any) || 0);

    setData({
      ...data,
      tax_percentage: taxPerc,
      tax_amount: taxAmount,
      total_amount: total,
    });
  };

  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const discount = parseFloat(e.target.value) || 0;
    const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
    const total = subtotal + (parseFloat(data.tax_amount as any) || 0) - discount;

    setData({
      ...data,
      discount_amount: discount,
      total_amount: total,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    put(route('finance.invoices.update', invoice.id));
  };

  return (
    <AuthenticatedLayout header="Edit Invoice">
      <Head title="Edit Invoice" />

      <div className="py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm shadow-black/5 p-4 sm:p-6 dark:border-gray-800 dark:bg-gray-900/60 dark:shadow-none">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              Edit Invoice {invoice.invoice_number}
            </h1>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Invoice Header */}
              <div className="border-b border-gray-200 dark:border-gray-800 pb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Invoice Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Invoice Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={data.invoice_date}
                      onChange={(e) => setData('invoice_date', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-coin-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Due Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={data.due_date}
                      onChange={(e) => setData('due_date', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-coin-500"
                    />
                  </div>
                </div>
              </div>

              {/* Client Details */}
              <div className="border-b border-gray-200 dark:border-gray-800 pb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Client Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Client Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={data.client_name}
                      onChange={(e) => setData('client_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-coin-500"
                    />
                    {errors.client_name && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-300">{errors.client_name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Client Email
                    </label>
                    <input
                      type="email"
                      value={data.client_email}
                      onChange={(e) => setData('client_email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-coin-500"
                    />
                  </div>
                </div>
              </div>

              {/* Line Items */}
              <div className="border-b border-gray-200 dark:border-gray-800 pb-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Line Items</h2>
                  <button
                    type="button"
                    onClick={addLineItem}
                    className="w-full sm:w-auto inline-flex items-center justify-center px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700"
                  >
                    + Add Item
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-[820px] w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">
                          Description
                        </th>
                        <th className="px-4 py-2 text-right font-semibold text-gray-700 dark:text-gray-200 w-24">
                          Qty
                        </th>
                        <th className="px-4 py-2 text-right font-semibold text-gray-700 dark:text-gray-200 w-32">
                          Unit Price
                        </th>
                        <th className="px-4 py-2 text-right font-semibold text-gray-700 dark:text-gray-200 w-32">
                          Total
                        </th>
                        <th className="px-4 py-2 text-center font-semibold text-gray-700 dark:text-gray-200 w-16">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                      {lineItems.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) =>
                                updateLineItem(index, 'description', e.target.value)
                              }
                              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded text-sm focus:outline-none focus:ring-2 focus:ring-coin-500"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                updateLineItem(index, 'quantity', parseInt(e.target.value) || 1)
                              }
                              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded text-sm focus:outline-none focus:ring-2 focus:ring-coin-500 text-right"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <div className="relative">
                              <span className="absolute left-2 top-1 text-gray-500 text-sm">
                                MWK
                              </span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.unit_price}
                                onChange={(e) =>
                                  updateLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)
                                }
                                className="w-full pl-10 px-2 py-1 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded text-sm focus:outline-none focus:ring-2 focus:ring-coin-500 text-right"
                              />
                            </div>
                          </td>
                          <td className="px-4 py-2 text-right font-semibold text-gray-900 dark:text-gray-100">
                            {formatCurrency(item.quantity * item.unit_price)}
                          </td>
                          <td className="px-4 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeLineItem(index)}
                              className="text-red-600 hover:text-red-800 dark:text-red-300 dark:hover:text-red-200 font-medium text-sm"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div className="border-b border-gray-200 dark:border-gray-800 pb-6">
                <div className="flex justify-end">
                  <div className="w-full md:w-72 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">Subtotal:</span>
                      <span className="font-semibold">{formatCurrency(parseFloat(data.subtotal as any))}</span>
                    </div>

                    <div className="flex justify-between text-sm border-t pt-2">
                      <div>
                        <label className="text-gray-600 dark:text-gray-300">Tax Percentage:</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={data.tax_percentage}
                          onChange={handleTaxChange}
                          className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded text-sm"
                        />
                        %
                      </div>
                      <span className="font-semibold">
                        {formatCurrency(parseFloat(data.tax_amount as any))}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <div>
                        <label className="text-gray-600 dark:text-gray-300">Discount:</label>
                        <div className="relative">
                          <span className="absolute left-2 top-1 text-gray-500 dark:text-gray-400">MWK</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={data.discount_amount}
                            onChange={handleDiscountChange}
                            className="w-28 px-2 py-1 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded text-sm pl-10"
                          />
                        </div>
                      </div>
                      <span className="font-semibold">
                        - {formatCurrency(parseFloat(data.discount_amount as any))}
                      </span>
                    </div>

                    <div className="flex justify-between text-lg font-bold border-t border-gray-200 dark:border-gray-800 pt-2">
                      <span>Total:</span>
                      <span className="text-coin-700 dark:text-coin-200">
                        {formatCurrency(parseFloat(data.total_amount as any))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                <textarea
                  value={data.notes}
                  onChange={(e) => setData('notes', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-coin-500"
                />
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200 dark:border-gray-800">
                <button
                  type="submit"
                  disabled={processing}
                  className="w-full sm:flex-1 inline-flex items-center justify-center px-4 py-2 bg-coin-600 text-white rounded-lg hover:bg-coin-700 disabled:bg-gray-400 dark:disabled:bg-gray-700 transition font-medium"
                >
                  {processing ? 'Saving...' : 'Save Changes'}
                </button>
                <a
                  href={route('finance.invoices.show', invoice.id)}
                  className="w-full sm:flex-1 inline-flex items-center justify-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 transition font-medium text-center"
                >
                  Cancel
                </a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
