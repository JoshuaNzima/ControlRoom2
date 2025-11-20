import React, { useEffect, useMemo, useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import FinanceLayout from '@/Layouts/FinanceLayout';
import { formatCurrency } from '@/utils/formatters';
import { useNotification } from '@/Providers/NotificationProvider';

interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
}

interface ClientOption {
  id: number;
  name: string;
  contact_person?: string | null;
  phone?: string | null;
  email?: string | null;
  monthly_rate?: number | null;
}

interface Props {
  clients: ClientOption[];
  defaultBilling?: {
    year: number;
    month: number;
  };
}

interface FormData {
  invoice_number: string;
  client_id: number | null;
  client_name: string;
  client_email: string;
  billing_year: number;
  billing_month: number;
  subtotal: number;
  tax_percentage: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  invoice_date: string;
  due_date: string;
  description: string;
  notes: string;
  line_items: LineItem[];
}

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export default function CreateInvoice({ clients = [], defaultBilling }: Props) {
  const initialYear = defaultBilling?.year ?? new Date().getFullYear();
  const initialMonth = defaultBilling?.month ?? new Date().getMonth() + 1;

  const { data, setData, post, processing, errors } = useForm<FormData>({
    invoice_number: '',
    client_id: null,
    client_name: '',
    client_email: '',
    billing_year: initialYear,
    billing_month: initialMonth,
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

  const [lineItems, setLineItems] = useState<LineItem[]>(data.line_items);
  const [documentMode, setDocumentMode] = useState<'invoice' | 'quotation'>('invoice');
  const [loadingServices, setLoadingServices] = useState(false);
  const [serviceError, setServiceError] = useState<string | null>(null);
  const { push } = useNotification();

  // Auto-generate invoice number on mount if empty
  useEffect(() => {
    if (!data.invoice_number) {
      try {
        fetch(route('finance.invoices.next-number'))
          .then((r) => r.json())
          .then((j) => {
            if (j?.invoice_number) setData('invoice_number', j.invoice_number);
          })
          .catch(() => {});
      } catch {}
    }
  }, []);

  const activeClient = useMemo(() => {
    if (!data.client_id) return null;
    return clients.find((client) => String(client.id) === String(data.client_id)) ?? null;
  }, [clients, data.client_id]);

  const addLineItem = () => {
    const newItems = [...lineItems, { description: '', quantity: 1, unit_price: 0 }];
    setLineItems(newItems);
    setData('line_items', newItems);
    updateTotals(newItems, data.tax_percentage, data.discount_amount);
  };

  const removeLineItem = (index: number) => {
    const newItems = lineItems.filter((_, i) => i !== index);
    setLineItems(newItems);
    setData('line_items', newItems);
    updateTotals(newItems, data.tax_percentage, data.discount_amount);
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: number | string) => {
    const newItems = [...lineItems];
    newItems[index] = {
      ...newItems[index],
      [field]: field === 'description' ? value : Number(value) || 0,
    } as LineItem;
    setLineItems(newItems);
    setData('line_items', newItems);
    updateTotals(newItems, data.tax_percentage, data.discount_amount);
  };

  const updateTotals = (
    items: LineItem[],
    taxPercentage: number | string,
    discountAmount: number | string
  ) => {
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
    const taxAmount = subtotal * ((Number(taxPercentage) || 0) / 100);
    const total = subtotal + taxAmount - (Number(discountAmount) || 0);

    setData('subtotal', subtotal);
    setData('tax_amount', taxAmount);
    setData('total_amount', total);
  };

  const handleClientChange = (value: string) => {
    const clientId = value ? Number(value) : null;
    setData('client_id', clientId);
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      setData('client_name', client.name);
      setData('client_email', client.email ?? '');
    } else {
      setData('client_name', '');
      setData('client_email', '');
    }
  };

  const handleTaxChange = (value: string) => {
    const tax = Number(value) || 0;
    setData('tax_percentage', tax);
    updateTotals(lineItems, tax, data.discount_amount);
  };

  const handleDiscountChange = (value: string) => {
    const discount = Number(value) || 0;
    setData('discount_amount', discount);
    updateTotals(lineItems, data.tax_percentage, discount);
  };

  const regenerateNumber = () => {
    try {
      fetch(route('finance.invoices.next-number'))
        .then((r) => r.json())
        .then((j) => {
          if (j?.invoice_number) setData('invoice_number', j.invoice_number);
        })
        .catch(() => {});
    } catch {}
  };

  const loadServiceLineItems = async () => {
    if (!data.client_id) return;
    try {
      setLoadingServices(true);
      setServiceError(null);
      const url = `${route('finance.invoices.service-line-items')}?client_id=${data.client_id}`;
      const res = await fetch(url);
      const json = await res.json();
      if (Array.isArray(json?.items)) {
        setLineItems(json.items as LineItem[]);
        setData('line_items', json.items as LineItem[]);
        updateTotals(json.items as LineItem[], data.tax_percentage, data.discount_amount);
        if ((json.items as LineItem[]).filter(i => i.description).length === 0) {
          push('No active services found for this client', 'info');
        } else {
          push('Loaded services for client', 'success');
        }
      }
    } catch (e) {
      setServiceError('Failed to load services. Please try again.');
      push('Failed to load services', 'error');
    } finally {
      setLoadingServices(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('finance.invoices.store'));
  };

  const resetItems = () => {
    const items: LineItem[] = [{ description: '', quantity: 1, unit_price: 0 }];
    setLineItems(items);
    setData('line_items', items);
    updateTotals(items, data.tax_percentage, data.discount_amount);
  };

  const hasValidItem = useMemo(() => lineItems.some(i => (i.description || '').trim().length > 0 && (i.quantity ?? 0) > 0), [lineItems]);

  return (
    <FinanceLayout title="Create Invoice">
      <Head title="Create Invoice" />

      <div className="py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Finance &gt; Invoices</p>
              <h1 className="text-3xl font-bold text-gray-900">Create {documentMode === 'invoice' ? 'Invoice' : 'Quotation'}</h1>
            </div>
            <div className="flex gap-2">
              {(['invoice', 'quotation'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setDocumentMode(mode)}
                  className={`px-4 py-2 text-sm rounded-full border ${
                    documentMode === mode
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {mode === 'invoice' ? 'Invoice Mode' : 'Quotation Mode'}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid lg:grid-cols-[2fr,1fr] gap-6">
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Invoice Number *</label>
                      <div className="mt-1 flex gap-2">
                        <input
                          type="text"
                          value={data.invoice_number}
                          onChange={(e) => setData('invoice_number', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="INV-202511-0001"
                        />
                        <button
                          type="button"
                          onClick={regenerateNumber}
                          className="px-3 py-2 rounded-lg border text-sm bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                          title="Auto-generate"
                        >
                          Auto
                        </button>
                      </div>
                      {errors.invoice_number && (
                        <p className="mt-1 text-xs text-red-600">{errors.invoice_number}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Client *</label>
                      <div className="flex gap-2">
                        <select
                          value={data.client_id ?? ''}
                          onChange={(e) => handleClientChange(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">Select client</option>
                          {clients.map((client) => (
                            <option key={client.id} value={client.id}>
                              {client.name}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={loadServiceLineItems}
                          disabled={!data.client_id}
                          className="px-3 py-2 rounded-lg border text-sm bg-emerald-50 text-emerald-700 border-emerald-200 disabled:opacity-50 hover:bg-emerald-100"
                          title="Load line items from client services"
                        >
                          Load Services
                        </button>
                      </div>
                      {errors.client_id && (
                        <p className="mt-1 text-xs text-red-600">{errors.client_id}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Client Name *</label>
                      <input
                        type="text"
                        required
                        value={data.client_name}
                        onChange={(e) => setData('client_name', e.target.value)}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      {errors.client_name && (
                        <p className="mt-1 text-xs text-red-600">{errors.client_name}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Client Email</label>
                      <input
                        type="email"
                        value={data.client_email}
                        onChange={(e) => setData('client_email', e.target.value)}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Invoice Date *</label>
                      <input
                        type="date"
                        required
                        value={data.invoice_date}
                        onChange={(e) => setData('invoice_date', e.target.value)}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Due Date *</label>
                      <input
                        type="date"
                        required
                        value={data.due_date}
                        onChange={(e) => setData('due_date', e.target.value)}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Billing Year *</label>
                      <input
                        type="number"
                        min={2000}
                        max={2100}
                        value={data.billing_year}
                        onChange={(e) => setData('billing_year', Number(e.target.value))}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Billing Month *</label>
                      <select
                        value={data.billing_month}
                        onChange={(e) => setData('billing_month', Number(e.target.value))}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {months.map((label, index) => (
                          <option key={label} value={index + 1}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {activeClient && (
                  <div className="bg-white rounded-2xl border shadow-sm p-4 text-sm text-gray-600">
                    <p className="font-semibold text-gray-900">Client Snapshot</p>
                    <p>{activeClient.contact_person}</p>
                    <p>{activeClient.phone ?? 'No phone on file'}</p>
                    <p>{activeClient.email ?? 'No email on file'}</p>
                    <p className="mt-2 text-xs text-gray-500">
                      Monthly rate: {activeClient.monthly_rate ? `MWK ${activeClient.monthly_rate.toLocaleString()}` : '—'}
                    </p>
                  </div>
                )}

                <div className="bg-white rounded-2xl shadow p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Line Items</h2>
                    <button
                      type="button"
                      onClick={addLineItem}
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-full text-sm hover:bg-emerald-700"
                    >
                      + Add Item
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={loadServiceLineItems}
                      disabled={!data.client_id || loadingServices}
                      className={`px-3 py-2 rounded-lg border text-sm ${loadingServices ? 'opacity-60 cursor-not-allowed' : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'}`}
                      title="Load line items from client services"
                    >
                      {loadingServices ? 'Loading…' : 'Load Services'}
                    </button>
                    <button
                      type="button"
                      onClick={resetItems}
                      className="px-3 py-2 rounded-lg border text-sm bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                    >
                      Reset
                    </button>
                    {serviceError && (
                      <span className="text-sm text-red-600">{serviceError}</span>
                    )}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left">Description</th>
                          <th className="px-4 py-2 text-right w-24">Qty</th>
                          <th className="px-4 py-2 text-right w-32">Unit Price</th>
                          <th className="px-4 py-2 text-right w-32">Total</th>
                          <th className="px-4 py-2 text-center w-16">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {lineItems.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2">
                              <input
                                type="text"
                                value={item.description}
                                onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="Describe the service or product"
                              />
                            </td>
                            <td className="px-4 py-2 text-right">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateLineItem(index, 'quantity', Number(e.target.value) || 1)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-right"
                              />
                            </td>
                            <td className="px-4 py-2 text-right">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.unit_price}
                                onChange={(e) => updateLineItem(index, 'unit_price', Number(e.target.value) || 0)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-right"
                              />
                            </td>
                            <td className="px-4 py-2 text-right font-semibold">
                              {formatCurrency(item.quantity * item.unit_price)}
                            </td>
                            <td className="px-4 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => removeLineItem(index)}
                                className="text-red-500 hover:text-red-700 text-xs font-medium"
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

                <div className="bg-white rounded-2xl shadow p-6 space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold">{formatCurrency(Number(data.subtotal))}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Tax (%)</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={data.tax_percentage}
                        onChange={(e) => handleTaxChange(e.target.value)}
                        className="w-24 px-2 py-1 border border-gray-300 rounded"
                      />
                    </div>
                    <span className="font-semibold">{formatCurrency(Number(data.tax_amount))}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Discount</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={data.discount_amount}
                        onChange={(e) => handleDiscountChange(e.target.value)}
                        className="w-32 px-2 py-1 border border-gray-300 rounded"
                      />
                    </div>
                    <span className="font-semibold">- {formatCurrency(Number(data.discount_amount))}</span>
                  </div>
                  <div className="flex justify-between items-center border-t pt-4 text-lg font-bold">
                    <span>Total Due</span>
                    <span className="text-indigo-600">{formatCurrency(Number(data.total_amount))}</span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow p-6 space-y-2">
                  <label className="text-sm font-medium text-gray-700">Notes / Payment Terms</label>
                  <textarea
                    rows={4}
                    value={data.notes}
                    onChange={(e) => setData('notes', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Add any additional notes, terms, or instructions for the client"
                  />
                </div>
              </div>

              <aside className="space-y-6">
                <div className="bg-white rounded-2xl shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-gray-700">Preview</span>
                    <span className="text-xs text-gray-400 uppercase tracking-wide">{documentMode}</span>
                  </div>
                  <div className="border rounded-xl p-4 text-sm space-y-3">
                    {/* Brand header */}
                    <div className="flex items-center gap-3 pb-3 border-b">
                      <img src="/images/coin-logo.png" alt="Logo" className="h-8 w-auto" onError={(e) => ((e.currentTarget.style.display='none'))} />
                      <div className="text-emerald-700 font-semibold">{import.meta.env.VITE_APP_NAME || 'Coin Security'}</div>
                    </div>
                    <div>
                      <p className="text-gray-500">Recipient</p>
                      <p className="font-semibold text-gray-900">{data.client_name || '—'}</p>
                      <p className="text-gray-500">{data.client_email || 'No email provided'}</p>
                    </div>
                    <div className="flex justify-between text-gray-600 text-xs border-t pt-3">
                      <div>
                        <p className="font-semibold text-gray-900">Invoice Date</p>
                        <p>{data.invoice_date}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Due Date</p>
                        <p>{data.due_date}</p>
                      </div>
                    </div>
                    <div className="border rounded-lg bg-gray-50 p-3 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>{formatCurrency(Number(data.subtotal))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax</span>
                        <span>{formatCurrency(Number(data.tax_amount))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Discount</span>
                        <span>- {formatCurrency(Number(data.discount_amount))}</span>
                      </div>
                      <div className="flex justify-between font-semibold border-t pt-2">
                        <span>Total</span>
                        <span>{formatCurrency(Number(data.total_amount))}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow p-6 space-y-3">
                  <button
                    type="submit"
                    disabled={processing || !hasValidItem}
                    className="w-full px-4 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:bg-gray-400"
                  >
                    {processing ? 'Saving...' : (!hasValidItem ? 'Add a line item to save' : `Save ${documentMode === 'invoice' ? 'Invoice' : 'Quotation'}`)}
                  </button>
                  <a
                    href={route('finance.invoices.index')}
                    className="w-full inline-flex justify-center px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200"
                  >
                    Cancel
                  </a>
                </div>
              </aside>
            </div>
          </form>
        </div>
      </div>
    </FinanceLayout>
  );
}
