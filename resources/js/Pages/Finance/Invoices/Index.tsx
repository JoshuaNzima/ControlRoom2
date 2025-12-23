import React, { useState, useEffect } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import FinanceLayout from '@/Layouts/FinanceLayout';
import { formatCurrency, formatDate } from '@/utils/formatters';
import Modal from '@/Components/Modal';

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
  total_amount: number;
  invoice_date: string;
  due_date: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  user: {
    id: number;
    name: string;
  };
  lineItems?: InvoiceLineItem[];
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
  invoices: {
    data: Invoice[];
    links: any;
    meta: any;
  };
  summary: {
    total: number;
    paid: number;
    unpaid: number;
    overdue: number;
  };
  filters: {
    status?: string;
    start_date?: string;
    end_date?: string;
  };
  clients: ClientOption[];
  defaultBilling?: { year: number; month: number };
}

const statuses = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];

function downloadCSV(filename: string, rows: any[]) {
  if (!rows || rows.length === 0) return;
  const keys = Object.keys(rows[0]);
  const csv = [keys.join(',')].concat(
    rows.map((r) => keys.map((k) => `"${String(r[k] ?? '')}"`).join(','))
  ).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function InvoiceIndex({ invoices, summary, filters, clients, defaultBilling }: Props) {
  const [filterStatus, setFilterStatus] = useState(filters.status || '');
  const [startDate, setStartDate] = useState(filters.start_date || '');
  const [endDate, setEndDate] = useState(filters.end_date || '');

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const { url } = usePage<any>();

  const handleExportCsv = () => {
    if (!invoices || !invoices.data || invoices.data.length === 0) return;
    const rows = invoices.data.map((invoice) => ({
      invoice_number: invoice.invoice_number,
      client_name: invoice.client_name,
      total_amount: invoice.total_amount,
      status: invoice.status,
      invoice_date: invoice.invoice_date,
      due_date: invoice.due_date,
      user: invoice.user?.name,
    }));
    downloadCSV('invoices-export.csv', rows);
  };

  const handleFilter = () => {
    const params: any = {};
    if (filterStatus) params.status = filterStatus;
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    router.get(route('finance.invoices.index'), params);
  };

  const handleClearFilters = () => {
    setFilterStatus('');
    setStartDate('');
    setEndDate('');
    router.get(route('finance.invoices.index'));
  };

  const setStatusAndFetch = (s: string) => {
    setFilterStatus(s);
    const params: any = {};
    if (s) params.status = s;
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    router.get(route('finance.invoices.index'), params);
  };

  const openEdit = async (id: number) => {
    setLoadingId(id);
    try {
      const res = await fetch(route('finance.invoices.show', id), {
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
      if (res.ok) {
        const json = await res.json();
        setEditing(json);
        setEditOpen(true);
      } else {
        router.visit(route('finance.invoices.edit', id));
      }
    } catch (e) {
      router.visit(route('finance.invoices.edit', id));
    } finally {
      setLoadingId(null);
    }
  };

  useEffect(() => {
    const search = typeof url === 'string' ? (url.split('?')[1] ?? '') : '';
    if (!search) return;
    const params = new URLSearchParams(search);
    const editId = params.get('edit');
    if (editId && !editing && !editOpen) {
      openEdit(Number(editId));
    }
  }, [url]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-yellow-100 text-yellow-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <FinanceLayout title="Invoices">
      <Head title="Invoices" />

      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              + New Invoice
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {['', ...statuses].map((s) => {
              const active = (s === '' && !filterStatus) || s === filterStatus;
              const label = s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1);
              return (
                <button
                  key={s || 'all'}
                  onClick={() => setStatusAndFetch(s)}
                  className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap ${active ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700'}`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 mb-2">Total Invoiced</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(summary.total)}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 mb-2">Paid</p>
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(summary.paid)}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 mb-2">Unpaid</p>
              <p className="text-3xl font-bold text-yellow-600">
                {formatCurrency(summary.unpaid)}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 mb-2">Overdue</p>
              <p className="text-3xl font-bold text-red-600">
                {summary.overdue} invoices
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Status</option>
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleFilter}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm"
              >
                Apply Filters
              </button>
              <button
                onClick={handleClearFilters}
                className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm"
              >
                Clear Filters
              </button>
              <button
                onClick={handleExportCsv}
                className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-sm"
              >
                Export CSV
              </button>
            </div>
          </div>

          {/* Invoices Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Invoice #
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Created By
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {invoices.data.length > 0 ? (
                  invoices.data.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm font-medium text-indigo-600">
                        {invoice.invoice_number}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {invoice.client_name}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {formatCurrency(invoice.total_amount)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(invoice.due_date)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                            invoice.status
                          )}`}
                        >
                          {invoice.status.charAt(0).toUpperCase() +
                            invoice.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {invoice.user.name}
                      </td>
                      <td className="px-6 py-4 text-sm space-x-2">
                        <Link
                          href={route('finance.invoices.show', invoice.id)}
                          className="text-indigo-600 hover:text-indigo-900 font-medium"
                        >
                          View
                        </Link>
                        {invoice.status === 'draft' && (
                          <button
                            type="button"
                            onClick={() => openEdit(invoice.id)}
                            className="text-blue-600 hover:text-blue-900 font-medium disabled:opacity-50"
                            disabled={loadingId === invoice.id}
                          >
                            {loadingId === invoice.id ? 'Opening…' : 'Edit'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No invoices found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {invoices.meta && invoices.meta.last_page > 1 && (
            <div className="flex justify-center gap-2">
              {invoices.links && invoices.links.map((link: any, index: number) => (
                <Link
                  key={index}
                  href={link.url}
                  className={`px-3 py-2 rounded ${
                    link.active
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                  dangerouslySetInnerHTML={{ __html: link.label }}
                />
              ))}
            </div>
          )}
          <CreateInvoiceModal
            open={createOpen}
            onClose={() => setCreateOpen(false)}
            clients={clients}
            defaultBilling={defaultBilling}
          />
          {editing && (
            <EditInvoiceModal
              open={editOpen}
              onClose={() => { setEditOpen(false); setEditing(null); }}
              invoice={editing}
            />
          )}
        </div>
      </div>
    </FinanceLayout>
  );
}

function CreateInvoiceModal({ open, onClose, clients, defaultBilling }: { open: boolean; onClose: () => void; clients: ClientOption[]; defaultBilling?: { year: number; month: number } }) {
  type LineItem = { description: string; quantity: number; unit_price: number };
  const initialYear = defaultBilling?.year ?? new Date().getFullYear();
  const initialMonth = defaultBilling?.month ?? new Date().getMonth() + 1;

  const { data, setData, post, processing, errors } = useForm({
    invoice_number: '',
    client_id: '' as string | number | '',
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

  const [lineItems, setLineItems] = useState<LineItem[]>(data.line_items as LineItem[]);
  const [servicesLoading, setServicesLoading] = useState(false);

  useEffect(() => {
    if (!open || (data.invoice_number as string)) return;
    try {
      fetch(route('finance.invoices.next-number'))
        .then((r) => r.json())
        .then((j) => {
          if ((j as any)?.invoice_number) setData('invoice_number', (j as any).invoice_number);
        })
        .catch(() => {});
    } catch {}
  }, [open]);

  const updateTotals = (items: LineItem[], taxPercentage: number | string, discountAmount: number | string) => {
    const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0), 0);
    const taxAmount = subtotal * ((Number(taxPercentage) || 0) / 100);
    const total = subtotal + taxAmount - (Number(discountAmount) || 0);
    setData('subtotal', subtotal);
    setData('tax_amount', taxAmount);
    setData('total_amount', total);
  };

  const loadClientServices = async () => {
    const cid = Number(data.client_id);
    if (!cid) return;
    try {
      setServicesLoading(true);
      const url = `${route('finance.invoices.service-line-items')}?client_id=${encodeURIComponent(String(cid))}`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) return;
      const json = await res.json();
      const items = Array.isArray(json.items) ? json.items : [];
      setLineItems(items);
      setData('line_items', items as any);
      updateTotals(items, data.tax_percentage as number, data.discount_amount as number);
    } finally {
      setServicesLoading(false);
    }
  };

  const addItem = () => {
    const items = [...lineItems, { description: '', quantity: 1, unit_price: 0 }];
    setLineItems(items);
    setData('line_items', items as any);
    updateTotals(items, data.tax_percentage as number, data.discount_amount as number);
  };

  const removeItem = (index: number) => {
    const items = lineItems.filter((_, i) => i !== index);
    setLineItems(items);
    setData('line_items', items as any);
    updateTotals(items, data.tax_percentage as number, data.discount_amount as number);
  };

  const updateItem = (index: number, field: keyof LineItem, value: string) => {
    const items = [...lineItems];
    const next: LineItem = { ...items[index], [field]: field === 'description' ? value : Number(value) || 0 } as any;
    items[index] = next;
    setLineItems(items);
    setData('line_items', items as any);
    updateTotals(items, data.tax_percentage as number, data.discount_amount as number);
  };

  const handleClientSelect = (val: string) => {
    const id = val ? Number(val) : '';
    setData('client_id', id as any);
    const c = id ? clients.find((cl) => Number(cl.id) === id) : undefined;
    setData('client_name', c?.name || '');
    setData('client_email', c?.email || '');
  };

  const handleTaxChange = (v: string) => {
    const tax = Number(v) || 0;
    setData('tax_percentage', tax as any);
    updateTotals(lineItems, tax, data.discount_amount as number);
  };

  const handleDiscountChange = (v: string) => {
    const disc = Number(v) || 0;
    setData('discount_amount', disc as any);
    updateTotals(lineItems, data.tax_percentage as number, disc);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('finance.invoices.store'), {
      onSuccess: () => onClose(),
    });
  };

  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  return (
    <Modal show={open} onClose={onClose} maxWidth="2xl">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white dark:bg-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">New Invoice</h2>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200">✕</button>
      </div>
      <form onSubmit={handleSubmit} className="px-6 py-4 bg-white dark:bg-gray-800 space-y-6">
        <div className="grid lg:grid-cols-[2fr,1fr] gap-6">
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 shadow p-6 space-y-4 bg-white dark:bg-gray-900">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Invoice Number</label>
                  <div className="mt-1 flex gap-2">
                    <input
                      value={data.invoice_number as string}
                      onChange={(e) => setData('invoice_number', e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const r = await fetch(route('finance.invoices.next-number'));
                          const j = await r.json();
                          if ((j as any)?.invoice_number) setData('invoice_number', (j as any).invoice_number);
                        } catch {}
                      }}
                      className="px-3 py-2 rounded-lg border text-sm bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                      title="Auto-generate"
                    >
                      Auto
                    </button>
                  </div>
                  {errors.invoice_number && <p className="text-xs text-red-600 mt-1">{errors.invoice_number as any}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Client *</label>
                  <select
                    value={String(data.client_id || '')}
                    onChange={(e) => handleClientSelect(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">Select client</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  {errors.client_id && <p className="text-xs text-red-600 mt-1">{errors.client_id as any}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Client Name *</label>
                  <input
                    required
                    value={data.client_name as string}
                    onChange={(e) => setData('client_name', e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  />
                  {errors.client_name && <p className="text-xs text-red-600 mt-1">{errors.client_name as any}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Client Email</label>
                  <input
                    type="email"
                    value={data.client_email as string}
                    onChange={(e) => setData('client_email', e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Invoice Date *</label>
                  <input
                    type="date"
                    required
                    value={data.invoice_date as string}
                    onChange={(e) => setData('invoice_date', e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={data.due_date as string}
                    onChange={(e) => setData('due_date', e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Billing Year *</label>
                  <input
                    type="number"
                    min={2000}
                    max={2100}
                    value={Number(data.billing_year)}
                    onChange={(e) => setData('billing_year', Number(e.target.value))}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Billing Month *</label>
                  <select
                    value={Number(data.billing_month)}
                    onChange={(e) => setData('billing_month', Number(e.target.value))}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  >
                    {months.map((m, i) => (<option key={m} value={i + 1}>{m}</option>))}
                  </select>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 shadow p-6 space-y-3 bg-white dark:bg-gray-900">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Line Items</h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={loadClientServices}
                    disabled={!data.client_id || servicesLoading}
                    className={`px-3 py-1.5 rounded-full text-sm border ${(!data.client_id || servicesLoading) ? 'bg-gray-200 text-gray-500 border-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700' : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'}`}
                  >
                    {servicesLoading ? 'Loading…' : 'Load Client Services'}
                  </button>
                  <button type="button" onClick={addItem} className="px-3 py-1.5 bg-emerald-600 text-white rounded-full text-sm hover:bg-emerald-700">+ Add Item</button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-3 py-2 text-left text-gray-700 dark:text-gray-300">Description</th>
                      <th className="px-3 py-2 text-right text-gray-700 dark:text-gray-300 w-24">Qty</th>
                      <th className="px-3 py-2 text-right text-gray-700 dark:text-gray-300 w-32">Unit Price</th>
                      <th className="px-3 py-2 text-right text-gray-700 dark:text-gray-300 w-32">Total</th>
                      <th className="px-3 py-2 text-center text-gray-700 dark:text-gray-300 w-16">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {lineItems.map((item, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2">
                          <input
                            value={item.description}
                            onChange={(e) => updateItem(i, 'description', e.target.value)}
                            className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                            placeholder="Describe the service or product"
                          />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                            className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-right text-gray-900 dark:text-gray-100"
                          />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={item.unit_price}
                            onChange={(e) => updateItem(i, 'unit_price', e.target.value)}
                            className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-right text-gray-900 dark:text-gray-100"
                          />
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-gray-900 dark:text-gray-100">{formatCurrency((Number(item.quantity) || 0) * (Number(item.unit_price) || 0))}</td>
                        <td className="px-3 py-2 text-center">
                          <button type="button" onClick={() => removeItem(i)} className="text-red-600 hover:text-red-800 text-xs font-medium">Remove</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 shadow p-6 space-y-3 bg-white dark:bg-gray-900">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">Subtotal</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(Number(data.subtotal as any))}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 dark:text-gray-300">Tax (%)</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.01}
                    value={Number(data.tax_percentage as any)}
                    onChange={(e) => handleTaxChange(e.target.value)}
                    className="w-24 px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(Number(data.tax_amount as any))}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 dark:text-gray-300">Discount</span>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={Number(data.discount_amount as any)}
                    onChange={(e) => handleDiscountChange(e.target.value)}
                    className="w-32 px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <span className="font-semibold text-gray-900 dark:text-gray-100">- {formatCurrency(Number(data.discount_amount as any))}</span>
              </div>
              <div className="flex justify-between items-center border-t pt-4 text-lg font-bold">
                <span className="text-gray-900 dark:text-gray-100">Total Due</span>
                <span className="text-indigo-600">{formatCurrency(Number(data.total_amount as any))}</span>
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 shadow p-6 bg-white dark:bg-gray-900">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
              <textarea
                rows={4}
                value={data.notes as string}
                onChange={(e) => setData('notes', e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                placeholder="Add payment terms or notes"
              />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-3 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200">Cancel</button>
              <button type="submit" disabled={processing} className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white hover:bg-red-700">{processing ? 'Saving…' : 'Save Invoice'}</button>
            </div>
          </aside>
        </div>
      </form>
    </Modal>
  );
}

function EditInvoiceModal({ open, onClose, invoice }: { open: boolean; onClose: () => void; invoice: any }) {
  type LineItem = { id?: number; description: string; quantity: number; unit_price: number };
  const { data, setData, put, processing, errors } = useForm<any>({
    client_name: invoice.client_name || '',
    client_email: invoice.client_email || '',
    subtotal: Number(invoice.subtotal) || 0,
    tax_percentage: Number(invoice.tax_percentage ?? 0),
    tax_amount: Number(invoice.tax_amount ?? 0),
    discount_amount: Number(invoice.discount_amount ?? 0),
    total_amount: Number(invoice.total_amount ?? 0),
    invoice_date: (invoice.invoice_date || '').slice(0, 10),
    due_date: (invoice.due_date || '').slice(0, 10),
    description: invoice.description || '',
    notes: invoice.notes || '',
    line_items: (invoice.lineItems || []).map((it: any) => ({ id: it.id, description: it.description, quantity: it.quantity, unit_price: it.unit_price })) as LineItem[],
  });

  const [lineItems, setLineItems] = useState<LineItem[]>(data.line_items as LineItem[]);
  const [servicesLoading, setServicesLoading] = useState(false);

  const updateTotals = (items: LineItem[], taxPercentage: number | string, discountAmount: number | string) => {
    const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0), 0);
    const taxAmount = subtotal * ((Number(taxPercentage) || 0) / 100);
    const total = subtotal + taxAmount - (Number(discountAmount) || 0);
    const sd = setData as any;
    sd('subtotal', subtotal);
    sd('tax_amount', taxAmount);
    sd('total_amount', total);
    sd('line_items', items);
  };

  const loadClientServices = async () => {
    const cid = Number((invoice as any).client_id || 0);
    if (!cid) return;
    try {
      setServicesLoading(true);
      const url = `${route('finance.invoices.service-line-items')}?client_id=${encodeURIComponent(String(cid))}`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) return;
      const json = await res.json();
      const items = Array.isArray(json.items) ? json.items : [];
      setLineItems(items as any);
      const sd = setData as any;
      sd('line_items', items);
      updateTotals(items as any, data.tax_percentage as any, data.discount_amount as any);
    } finally {
      setServicesLoading(false);
    }
  };

  const addItem = () => {
    const items = [...lineItems, { description: '', quantity: 1, unit_price: 0 }];
    setLineItems(items);
    updateTotals(items, data.tax_percentage as any, data.discount_amount as any);
  };

  const removeItem = (index: number) => {
    const items = lineItems.filter((_, i) => i !== index);
    setLineItems(items);
    updateTotals(items, data.tax_percentage as any, data.discount_amount as any);
  };

  const updateItem = (index: number, field: keyof LineItem, value: string) => {
    const items = [...lineItems];
    const next: LineItem = { ...items[index], [field]: field === 'description' ? value : Number(value) || 0 } as any;
    items[index] = next;
    setLineItems(items);
    updateTotals(items, data.tax_percentage as any, data.discount_amount as any);
  };

  const handleTaxChange = (v: string) => {
    const tax = Number(v) || 0;
    (setData as any)('tax_percentage', tax);
    updateTotals(lineItems, tax, data.discount_amount as any);
  };

  const handleDiscountChange = (v: string) => {
    const disc = Number(v) || 0;
    (setData as any)('discount_amount', disc);
    updateTotals(lineItems, data.tax_percentage as any, disc);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    put(route('finance.invoices.update', invoice.id), {
      onSuccess: () => onClose(),
    });
  };

  return (
    <Modal show={open} onClose={onClose} maxWidth="2xl">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white dark:bg-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit Invoice {invoice.invoice_number}</h2>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200">✕</button>
      </div>
      <form onSubmit={handleSubmit} className="px-6 py-4 bg-white dark:bg-gray-800 space-y-6">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 shadow p-6 space-y-4 bg-white dark:bg-gray-900">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Client Name *</label>
              <input
                required
                value={data.client_name as string}
                onChange={(e) => (setData as any)('client_name', e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
              {errors.client_name && <p className="text-xs text-red-600 mt-1">{errors.client_name as any}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Client Email</label>
              <input
                type="email"
                value={data.client_email as string}
                onChange={(e) => (setData as any)('client_email', e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Invoice Date *</label>
              <input
                type="date"
                required
                value={data.invoice_date as string}
                onChange={(e) => (setData as any)('invoice_date', e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Due Date *</label>
              <input
                type="date"
                required
                value={data.due_date as string}
                onChange={(e) => (setData as any)('due_date', e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 shadow p-6 space-y-3 bg-white dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Line Items</h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadClientServices}
                disabled={!((invoice as any)?.client_id) || servicesLoading}
                className={`px-3 py-1.5 rounded-full text-sm border ${(!((invoice as any)?.client_id) || servicesLoading) ? 'bg-gray-200 text-gray-500 border-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700' : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'}`}
              >
                {servicesLoading ? 'Loading…' : 'Load Client Services'}
              </button>
              <button type="button" onClick={addItem} className="px-3 py-1.5 bg-emerald-600 text-white rounded-full text-sm hover:bg-emerald-700">+ Add Item</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-3 py-2 text-left text-gray-700 dark:text-gray-300">Description</th>
                  <th className="px-3 py-2 text-right text-gray-700 dark:text-gray-300 w-24">Qty</th>
                  <th className="px-3 py-2 text-right text-gray-700 dark:text-gray-300 w-32">Unit Price</th>
                  <th className="px-3 py-2 text-right text-gray-700 dark:text-gray-300 w-32">Total</th>
                  <th className="px-3 py-2 text-center text-gray-700 dark:text-gray-300 w-16">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {lineItems.map((item, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2">
                      <input
                        value={item.description}
                        onChange={(e) => updateItem(i, 'description', e.target.value)}
                        className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                        placeholder="Describe the service or product"
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                        className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-right text-gray-900 dark:text-gray-100"
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => updateItem(i, 'unit_price', e.target.value)}
                        className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-right text-gray-900 dark:text-gray-100"
                      />
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-gray-900 dark:text-gray-100">{formatCurrency((Number(item.quantity) || 0) * (Number(item.unit_price) || 0))}</td>
                    <td className="px-3 py-2 text-center">
                      <button type="button" onClick={() => removeItem(i)} className="text-red-600 hover:text-red-800 text-xs font-medium">Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 shadow p-6 space-y-3 bg-white dark:bg-gray-900">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-300">Subtotal</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(Number(data.subtotal as any))}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-600 dark:text-gray-300">Tax (%)</span>
              <input
                type="number"
                min={0}
                max={100}
                step={0.01}
                value={Number(data.tax_percentage as any)}
                onChange={(e) => handleTaxChange(e.target.value)}
                className="w-24 px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
            </div>
            <span className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(Number(data.tax_amount as any))}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-600 dark:text-gray-300">Discount</span>
              <input
                type="number"
                min={0}
                step={0.01}
                value={Number(data.discount_amount as any)}
                onChange={(e) => handleDiscountChange(e.target.value)}
                className="w-32 px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
            </div>
            <span className="font-semibold text-gray-900 dark:text-gray-100">- {formatCurrency(Number(data.discount_amount as any))}</span>
          </div>
          <div className="flex justify-between items-center border-t pt-4 text-lg font-bold">
            <span className="text-gray-900 dark:text-gray-100">Total Due</span>
            <span className="text-indigo-600">{formatCurrency(Number(data.total_amount as any))}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-3 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200">Cancel</button>
          <button type="submit" disabled={processing} className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white hover:bg-red-700">{processing ? 'Saving…' : 'Save Changes'}</button>
        </div>
      </form>
    </Modal>
  );
}
