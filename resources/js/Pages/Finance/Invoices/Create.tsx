import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
}

export default function CreateInvoice() {
  const { data, setData, post, processing, errors } = useForm({
    invoice_number: '',
    client_name: '',
    client_email: '',
    subtotal: 0,
    tax_percentage: 0,
    tax_amount: 0,
    discount_amount: 0,
    total_amount: 0,
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: '',
    notes: '',
    line_items: [{ description: '', quantity: 1, unit_price: 0 }] as LineItem[],
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: '', quantity: 1, unit_price: 0 },
  ]);

  const addLineItem = () => {
    const newItems = [...lineItems, { description: '', quantity: 1, unit_price: 0 }];
    setLineItems(newItems);
    setData('line_items', newItems);
  };

  const removeLineItem = (index: number) => {
    const newItems = lineItems.filter((_, i) => i !== index);
    setLineItems(newItems);
    setData('line_items', newItems);
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
    const newItems = [...lineItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setLineItems(newItems);
    setData('line_items', newItems);
    updateTotals(newItems);
  };

  const updateTotals = (items: LineItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
    const taxAmount = subtotal * (parseFloat(data.tax_percentage as any) / 100);
    const total = subtotal + taxAmount - (parseFloat(data.discount_amount as any) || 0);

    setData({
      ...data,
      subtotal,
      tax_amount: taxAmount,
      total_amount: total,
      line_items: items,
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
    post(route('finance.invoices.store'));
  };

  return (
    <AdminLayout title="Create Invoice">
      <Head title="Create Invoice" />

      <div className="py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Invoice</h1>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Invoice Header */}
              <div className="border-b pb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Invoice Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={data.invoice_number}
                      onChange={(e) => setData('invoice_number', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="INV-001"
                    />
                    {errors.invoice_number && (
                      <p className="mt-1 text-sm text-red-600">{errors.invoice_number}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Invoice Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={data.invoice_date}
                      onChange={(e) => setData('invoice_date', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Due Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={data.due_date}
                      onChange={(e) => setData('due_date', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Client Details */}
              <div className="border-b pb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Client Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Client Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={data.client_name}
                      onChange={(e) => setData('client_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Client Name"
                    />
                    {errors.client_name && (
                      <p className="mt-1 text-sm text-red-600">{errors.client_name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Client Email
                    </label>
                    <input
                      type="email"
                      value={data.client_email}
                      onChange={(e) => setData('client_email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="client@example.com"
                    />
                  </div>
                </div>
              </div>

              {/* Line Items */}
              <div className="border-b pb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Line Items</h2>
                  <button
                    type="button"
                    onClick={addLineItem}
                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                  >
                    + Add Item
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">
                          Description
                        </th>
                        <th className="px-4 py-2 text-right font-semibold text-gray-700 w-24">
                          Qty
                        </th>
                        <th className="px-4 py-2 text-right font-semibold text-gray-700 w-32">
                          Unit Price
                        </th>
                        <th className="px-4 py-2 text-right font-semibold text-gray-700 w-32">
                          Total
                        </th>
                        <th className="px-4 py-2 text-center font-semibold text-gray-700 w-16">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {lineItems.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) =>
                                updateLineItem(index, 'description', e.target.value)
                              }
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              placeholder="Item description"
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
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-right"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <div className="relative">
                              <span className="absolute left-2 top-1 text-gray-500 text-sm">
                                $
                              </span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.unit_price}
                                onChange={(e) =>
                                  updateLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)
                                }
                                className="w-full pl-6 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-right"
                              />
                            </div>
                          </td>
                          <td className="px-4 py-2 text-right font-semibold text-gray-900">
                            ${(item.quantity * item.unit_price).toFixed(2)}
                          </td>
                          <td className="px-4 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeLineItem(index)}
                              className="text-red-600 hover:text-red-900 font-medium text-sm"
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
              <div className="border-b pb-6">
                <div className="flex justify-end">
                  <div className="w-full md:w-72 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-semibold">${parseFloat(data.subtotal as any).toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between text-sm border-t pt-2">
                      <div>
                        <label className="text-gray-600">Tax Percentage:</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={data.tax_percentage}
                          onChange={handleTaxChange}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                        %
                      </div>
                      <span className="font-semibold">
                        ${parseFloat(data.tax_amount as any).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <div>
                        <label className="text-gray-600">Discount:</label>
                        <div className="relative">
                          <span className="absolute left-2 top-1 text-gray-500">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={data.discount_amount}
                            onChange={handleDiscountChange}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm pl-6"
                          />
                        </div>
                      </div>
                      <span className="font-semibold">
                        -${parseFloat(data.discount_amount as any).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total:</span>
                      <span className="text-indigo-600">
                        ${parseFloat(data.total_amount as any).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={data.notes}
                  onChange={(e) => setData('notes', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Add any additional notes or payment terms"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-6 border-t">
                <button
                  type="submit"
                  disabled={processing}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition font-medium"
                >
                  {processing ? 'Creating...' : 'Create Invoice'}
                </button>
                <a
                  href={route('finance.invoices.index')}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium text-center"
                >
                  Cancel
                </a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
