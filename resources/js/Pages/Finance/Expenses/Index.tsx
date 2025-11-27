import React, { useState } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import FinanceLayout from '@/Layouts/FinanceLayout';
import AdminLayout from '@/Layouts/AdminLayout';
import Modal from '@/Components/Modal';
import { formatCurrency, formatDate } from '@/utils/formatters';

interface Expense {
  id: number;
  amount: number;
  category: string;
  description: string | null;
  expense_date: string;
  payment_method: string;
  status: 'pending' | 'approved' | 'rejected';
  account_id?: number | null;
  notes?: string | null;
  user?: {
    id: number;
    name: string;
  };
}

interface Props {
  expenses: {
    data: Expense[];
    links: any;
    meta: any;
  };
  totals: {
    total: number;
    approved: number;
    pending: number;
    by_category: Array<{ category: string; total: number }>;
  };
  filters: {
    category?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
    payment_method?: string;
  };
}

const categories = [
  'general',
  'office_supplies',
  'travel',
  'meals',
  'utilities',
  'maintenance',
  'marketing',
  'equipment',
  'other',
];

const statuses = ['pending', 'approved', 'rejected'];
const paymentMethods = ['cash', 'card', 'transfer', 'check'];

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

export default function ExpenseIndex({ expenses, totals, filters }: Props) {
  const [filterCategory, setFilterCategory] = useState(filters.category || '');
  const [filterStatus, setFilterStatus] = useState(filters.status || '');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState(
    filters.payment_method || ''
  );
  const [startDate, setStartDate] = useState(filters.start_date || '');
  const [endDate, setEndDate] = useState(filters.end_date || '');

  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const { url } = usePage();
  const isAdminRoute = typeof url === 'string' && url.startsWith('/admin/');
  const Layout = isAdminRoute ? AdminLayout : FinanceLayout;
  const listRouteName = isAdminRoute ? 'admin.requisitions.index' : 'finance.expenses.index';
  const showRouteName = isAdminRoute ? 'admin.requisitions.show' : 'finance.expenses.show';
  const updateRouteName = isAdminRoute ? 'admin.requisitions.update' : 'finance.expenses.update';
  const storeRouteName = isAdminRoute ? 'admin.requisitions.store' : 'finance.expenses.store';

  const openViewModal = async (id: number) => {
    setLoadingId(id);
    try {
      const response = await fetch(route(showRouteName, id), {
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load requisition');
      }

      const json = (await response.json()) as Expense;
      setViewingExpense(json);
      setViewModalOpen(true);
    } catch (e) {
      router.visit(route(showRouteName, id));
    } finally {
      setLoadingId(null);
    }
  };

  const openEditModal = (expense: Expense) => {
    setEditingExpense(expense);
    setEditModalOpen(true);
  };

  const handleExportCsv = () => {
    if (!expenses || !expenses.data || expenses.data.length === 0) return;
    const rows = expenses.data.map((expense) => ({
      date: expense.expense_date,
      description: expense.description,
      category: expense.category,
      amount: expense.amount,
      payment_method: expense.payment_method,
      status: expense.status,
      user: expense.user?.name,
    }));
    downloadCSV('requisitions-export.csv', rows);
  };

  const handleFilter = () => {
    const params: any = {};
    if (filterCategory) params.category = filterCategory;
    if (filterStatus) params.status = filterStatus;
    if (filterPaymentMethod) params.payment_method = filterPaymentMethod;
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    router.get(route(listRouteName), params);
  };

  const handleClearFilters = () => {
    setFilterCategory('');
    setFilterStatus('');
    setFilterPaymentMethod('');
    setStartDate('');
    setEndDate('');
    router.get(route(listRouteName));
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Layout title="Requisitions">
      <Head title="Requisitions" />
      
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Requisitions</h1>
            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
            >
              New Requisition
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 mb-2">Total Requisitions</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(totals.total)}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 mb-2">Approved</p>
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(totals.approved)}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 mb-2">Pending Approval</p>
              <p className="text-3xl font-bold text-yellow-600">
                {formatCurrency(totals.pending)}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>
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
                  Payment Method
                </label>
                <select
                  value={filterPaymentMethod}
                  onChange={(e) => setFilterPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Methods</option>
                  {paymentMethods.map((method) => (
                    <option key={method} value={method}>
                      {method.charAt(0).toUpperCase() + method.slice(1)}
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

          {/* Expenses Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {expenses.data.length > 0 ? (
                  expenses.data.map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(expense.expense_date)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {expense.description || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                          {expense.category.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {expense.payment_method}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(
                            expense.status
                          )}`}
                        >
                          {expense.status.charAt(0).toUpperCase() +
                            expense.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {expense.user?.name}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => openViewModal(expense.id)}
                            className="text-indigo-600 hover:text-indigo-900 font-medium disabled:opacity-50"
                            disabled={loadingId === expense.id}
                          >
                            {loadingId === expense.id ? 'Opening…' : 'View'}
                          </button>
                          {expense.status === 'pending' && (
                            <button
                              type="button"
                              onClick={() => openEditModal(expense)}
                              className="text-red-600 hover:text-red-800 font-medium"
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      No requisitions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {expenses.meta && expenses.meta.last_page > 1 && (
            <div className="flex justify-center gap-2">
              {expenses.links && expenses.links.map((link: any, index: number) => (
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

          <CreateExpenseModal
            open={createModalOpen}
            onClose={() => setCreateModalOpen(false)}
            categories={categories}
            paymentMethods={paymentMethods}
            storeRouteName={storeRouteName}
          />

          {editingExpense && (
            <EditExpenseModal
              key={editingExpense.id}
              open={editModalOpen}
              onClose={() => {
                setEditModalOpen(false);
                setEditingExpense(null);
              }}
              expense={editingExpense}
              categories={categories}
              paymentMethods={paymentMethods}
              updateRouteName={updateRouteName}
              showRouteName={showRouteName}
            />
          )}

          {viewingExpense && (
            <Modal
              show={viewModalOpen}
              onClose={() => setViewModalOpen(false)}
              maxWidth="2xl"
            >
              <div className="px-6 py-4 border-b flex items-center justify-between bg-white">
                <h2 className="text-lg font-semibold text-gray-900">
                  Requisition #{viewingExpense.id}
                </h2>
                <button
                  type="button"
                  onClick={() => setViewModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
              <div className="px-6 py-4 bg-white space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Amount</p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(viewingExpense.amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Status</p>
                    <span
                      className={`inline-flex mt-1 px-2 py-1 rounded text-xs font-medium ${getStatusBadge(
                        viewingExpense.status
                      )}`}
                    >
                      {viewingExpense.status.charAt(0).toUpperCase() +
                        viewingExpense.status.slice(1)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Category</p>
                    <p className="text-sm text-gray-900">
                      {viewingExpense.category.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Date</p>
                    <p className="text-sm text-gray-900">
                      {formatDate(viewingExpense.expense_date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Payment Method</p>
                    <p className="text-sm text-gray-900">
                      {viewingExpense.payment_method.charAt(0).toUpperCase() +
                        viewingExpense.payment_method.slice(1)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Submitted By</p>
                    <p className="text-sm text-gray-900">
                      {viewingExpense.user?.name}
                    </p>
                  </div>
                </div>

                {viewingExpense.description && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Description</p>
                    <p className="text-sm text-gray-900 bg-gray-50 rounded px-3 py-2">
                      {viewingExpense.description}
                    </p>
                  </div>
                )}

                {viewingExpense.notes && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Notes</p>
                    <p className="text-sm text-gray-900 bg-gray-50 rounded px-3 py-2 whitespace-pre-wrap">
                      {viewingExpense.notes}
                    </p>
                  </div>
                )}
              </div>
              <div className="px-6 py-3 bg-gray-50 border-t text-xs text-gray-500 flex justify-between">
                <span>
                  Status:{' '}
                  {viewingExpense.status === 'pending'
                    ? 'Pending approval'
                    : viewingExpense.status === 'approved'
                    ? 'Approved'
                    : 'Rejected'}
                </span>
                <button
                  type="button"
                  onClick={() => setViewModalOpen(false)}
                  className="text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Close
                </button>
              </div>
            </Modal>
          )}
        </div>
      </div>
    </Layout>
  );
}

interface CreateExpenseModalProps {
  open: boolean;
  onClose: () => void;
  categories: string[];
  paymentMethods: string[];
  storeRouteName: string;
}

function CreateExpenseModal({ open, onClose, categories, paymentMethods, storeRouteName }: CreateExpenseModalProps) {
  const { data, setData, post, processing, errors, reset } = useForm({
    amount: '',
    category: categories[0] || 'general',
    description: '',
    expense_date: new Date().toISOString().slice(0, 10),
    account_id: '',
    payment_method: paymentMethods[0] || 'cash',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route(storeRouteName), {
      onSuccess: () => {
        reset();
        onClose();
      },
    });
  };

  const handleClose = () => {
    if (!processing) {
      onClose();
    }
  };

  return (
    <Modal show={open} onClose={handleClose} maxWidth="2xl">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white">
        <h2 className="text-lg font-semibold text-gray-900">New Requisition</h2>
        <button
          type="button"
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <span className="sr-only">Close</span>
          <svg
            className="h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
      <form onSubmit={handleSubmit} className="px-6 py-4 bg-white space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">MWK</span>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={data.amount}
              onChange={(e) => setData('amount', e.target.value)}
              className="w-full pl-12 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="0.00"
            />
          </div>
          {errors.amount && (
            <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category *
          </label>
          <select
            value={data.category}
            onChange={(e) => setData('category', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="mt-1 text-sm text-red-600">{errors.category}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <input
            type="text"
            value={data.description}
            onChange={(e) => setData('description', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="e.g., Office supplies from Staples"
            maxLength={255}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Expense Date *
          </label>
          <input
            type="date"
            required
            value={data.expense_date}
            onChange={(e) => setData('expense_date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {errors.expense_date && (
            <p className="mt-1 text-sm text-red-600">{errors.expense_date}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Method *
          </label>
          <select
            value={data.payment_method}
            onChange={(e) => setData('payment_method', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {paymentMethods.map((method) => (
              <option key={method} value={method}>
                {method.charAt(0).toUpperCase() + method.slice(1)}
              </option>
            ))}
          </select>
          {errors.payment_method && (
            <p className="mt-1 text-sm text-red-600">{errors.payment_method}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes
          </label>
          <textarea
            value={data.notes}
            onChange={(e) => setData('notes', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Additional details or comments about this expense"
          />
          {errors.notes && (
            <p className="mt-1 text-sm text-red-600">{errors.notes}</p>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            Your requisition will be submitted for approval. Once approved, it will appear in the system.
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={processing}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition font-medium"
          >
            {processing ? 'Submitting...' : 'Submit Requisition'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

interface EditExpenseModalProps {
  open: boolean;
  onClose: () => void;
  expense: Expense;
  categories: string[];
  paymentMethods: string[];
  updateRouteName: string;
  showRouteName: string;
}

function EditExpenseModal({ open, onClose, expense, categories, paymentMethods, updateRouteName, showRouteName }: EditExpenseModalProps) {
  const { data, setData, put, processing, errors, reset } = useForm({
    amount: expense.amount.toString(),
    category: expense.category,
    description: expense.description || '',
    expense_date: (expense.expense_date || '').slice(0, 10),
    account_id: expense.account_id ? String(expense.account_id) : '',
    payment_method: expense.payment_method,
    notes: expense.notes || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    put(route(updateRouteName, expense.id), {
      onSuccess: () => {
        reset();
        onClose();
      },
    });
  };

  const handleClose = () => {
    if (!processing) {
      onClose();
    }
  };

  return (
    <Modal show={open} onClose={handleClose} maxWidth="2xl">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white">
        <h2 className="text-lg font-semibold text-gray-900">
          Edit Requisition #{expense.id}
        </h2>
        <button
          type="button"
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <span className="sr-only">Close</span>
          <svg
            className="h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
      <form onSubmit={handleSubmit} className="px-6 py-4 bg-white space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">MWK</span>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={data.amount}
              onChange={(e) => setData('amount', e.target.value)}
              className="w-full pl-12 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {errors.amount && (
            <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category *
          </label>
          <select
            value={data.category}
            onChange={(e) => setData('category', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="mt-1 text-sm text-red-600">{errors.category}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <input
            type="text"
            value={data.description}
            onChange={(e) => setData('description', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            maxLength={255}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Expense Date *
          </label>
          <input
            type="date"
            required
            value={data.expense_date}
            onChange={(e) => setData('expense_date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {errors.expense_date && (
            <p className="mt-1 text-sm text-red-600">{errors.expense_date}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Method *
          </label>
          <select
            value={data.payment_method}
            onChange={(e) => setData('payment_method', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {paymentMethods.map((method) => (
              <option key={method} value={method}>
                {method.charAt(0).toUpperCase() + method.slice(1)}
              </option>
            ))}
          </select>
          {errors.payment_method && (
            <p className="mt-1 text-sm text-red-600">{errors.payment_method}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes
          </label>
          <textarea
            value={data.notes}
            onChange={(e) => setData('notes', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {errors.notes && (
            <p className="mt-1 text-sm text-red-600">{errors.notes}</p>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            Changes to this requisition may require re-approval depending on your workflow.
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={processing}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition font-medium"
          >
            {processing ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
