import React, { useState } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
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
  approval_stage?: 'admin_pending' | 'asset_pending' | 'complete' | 'rejected';
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
    petty_cash: number;
    requisitions_total: number;
    requisitions_count: number;
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

  // Loading states for view modal actions
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [actionError, setActionError] = useState<string>('');

  const setActionLoadingState = (key: string, value: boolean) => {
    setActionLoading(prev => ({ ...prev, [key]: value }));
  };

  const { url, props } = usePage<any>();
  const currentUserId = props?.auth?.user?.id as number | undefined;
  const isAdminRoute = typeof url === 'string' && url.startsWith('/admin/');
  const Layout = AuthenticatedLayout;
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
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
      approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
    };
    return badges[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  };

  return (
    <Layout header="Requisitions">
      <Head title="Requisitions" />
      
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Requisitions</h1>
            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-coin-700 text-white rounded-lg hover:bg-coin-600 transition text-sm font-medium"
            >
              New Requisition
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Expenses</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(totals.total)}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Petty Cash</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(totals.petty_cash)}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Requisitions</p>
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {formatCurrency(totals.requisitions_total)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{totals.requisitions_count} items</p>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Pending Approval</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {formatCurrency(totals.pending)}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Filters</h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-coin-500"
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-coin-500"
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Payment Method
                </label>
                <select
                  value={filterPaymentMethod}
                  onChange={(e) => setFilterPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-coin-500"
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-coin-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-coin-500"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleFilter}
                className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-coin-700 text-white rounded-lg hover:bg-coin-600 transition text-sm"
              >
                Apply Filters
              </button>
              <button
                onClick={handleClearFilters}
                className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
              >
                Clear Filters
              </button>
              <button
                onClick={handleExportCsv}
                className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-sm"
              >
                Export CSV
              </button>
            </div>
          </div>

          {/* Expenses Table */}
          <div className="md:hidden space-y-3">
            {expenses.data.length > 0 ? (
              expenses.data.map((expense) => (
                <div key={expense.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {expense.description || `Requisition #${expense.id}`}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {formatDate(expense.expense_date)}
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(expense.status)}`}>
                      {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-2 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-gray-500 dark:text-gray-400">Amount</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(expense.amount)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-gray-500 dark:text-gray-400">Category</span>
                      <span className="px-2 py-0.5 rounded bg-coin-100 text-coin-800 dark:bg-coin-900/30 dark:text-coin-200 text-xs font-medium">
                        {expense.category.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-gray-500 dark:text-gray-400">Method</span>
                      <span className="text-gray-700 dark:text-gray-200">{expense.payment_method}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-gray-500 dark:text-gray-400">User</span>
                      <span className="text-gray-700 dark:text-gray-200 truncate">{expense.user?.name || '-'}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => openViewModal(expense.id)}
                      className="px-3 py-1.5 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={loadingId === expense.id}
                    >
                      {loadingId === expense.id ? 'Opening…' : 'View'}
                    </button>
                    {expense.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => openEditModal(expense)}
                        className="px-3 py-1.5 rounded-md bg-coin-700 text-white hover:bg-coin-600"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow p-6 text-center text-gray-500 dark:text-gray-400">
                No requisitions found.
              </div>
            )}
          </div>

          <div className="hidden md:block bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow overflow-x-auto">
            <table className="min-w-[950px] w-full">
              <thead className="bg-gray-50 dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {expenses.data.length > 0 ? (
                  expenses.data.map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60 transition">
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {formatDate(expense.expense_date)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                        {expense.description || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-2 py-1 bg-coin-100 text-coin-800 dark:bg-coin-900/30 dark:text-coin-200 rounded text-xs font-medium">
                          {expense.category.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {expense.payment_method}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(expense.status)}`}>
                          {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {expense.user?.name}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => openViewModal(expense.id)}
                            className="text-coin-700 hover:text-coin-800 dark:text-coin-200 dark:hover:text-coin-100 font-medium disabled:opacity-50"
                            disabled={loadingId === expense.id}
                          >
                            {loadingId === expense.id ? 'Opening…' : 'View'}
                          </button>
                          {expense.status === 'pending' && (
                            <button
                              type="button"
                              onClick={() => openEditModal(expense)}
                              className="text-coin-700 hover:text-coin-800 dark:text-coin-200 dark:hover:text-coin-100 font-medium"
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
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      No requisitions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {expenses.meta && expenses.meta.last_page > 1 && (
            <div className="flex flex-wrap justify-center gap-2">
              {expenses.links && expenses.links.map((link: any, index: number) => (
                <Link
                  key={index}
                  href={link.url}
                  className={`px-3 py-2 rounded ${
                    link.active
                      ? 'bg-coin-700 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-800'
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
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Requisition #{viewingExpense.id}
                </h2>
                <button
                  type="button"
                  onClick={() => setViewModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
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
              <div className="px-6 py-4 bg-white dark:bg-gray-900 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Amount</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {formatCurrency(viewingExpense.amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Status</p>
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
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Category</p>
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {viewingExpense.category.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Date</p>
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {formatDate(viewingExpense.expense_date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Payment Method</p>
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {viewingExpense.payment_method.charAt(0).toUpperCase() +
                        viewingExpense.payment_method.slice(1)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Submitted By</p>
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {viewingExpense.user?.name}
                    </p>
                  </div>
                </div>

                {viewingExpense.description && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Description</p>
                    <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 rounded px-3 py-2">
                      {viewingExpense.description}
                    </p>
                  </div>
                )}

                {viewingExpense.notes && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Notes</p>
                    <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 rounded px-3 py-2 whitespace-pre-wrap">
                      {viewingExpense.notes}
                    </p>
                  </div>
                )}
              </div>
              <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-600 dark:text-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span>
                    Status:{' '}
                    {viewingExpense.status === 'pending'
                      ? 'Pending approval'
                      : viewingExpense.status === 'approved'
                      ? 'Approved'
                      : 'Rejected'}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-900 text-gray-700 dark:text-gray-200">
                    Stage: {viewingExpense.approval_stage === 'asset_pending' ? 'Assets approval' : viewingExpense.approval_stage === 'complete' ? 'Complete' : viewingExpense.approval_stage === 'rejected' ? 'Rejected' : 'Admin approval'}
                  </span>
                </div>
                {actionError && (
                  <div className="text-xs text-red-600 dark:text-red-400">{actionError}</div>
                )}
                <div className="flex items-center gap-2">
                  {viewingExpense.status === 'pending' && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setActionLoadingState('approve', true);
                          setActionError('');
                          router.post(route('finance.expenses.approve', viewingExpense.id), {}, {
                            onSuccess: () => setViewModalOpen(false),
                            onFinish: () => setActionLoadingState('approve', false),
                            onError: (errs: any) => setActionError(Object.values(errs)[0] as string || 'Failed to approve'),
                          });
                        }}
                        disabled={actionLoading.approve}
                        className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-medium disabled:opacity-60 flex items-center gap-2"
                      >
                        {actionLoading.approve && (
                          <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        )}
                        {actionLoading.approve ? 'Approving...' : 'Approve'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const reason = prompt('Rejection reason (optional)') || '';
                          setActionLoadingState('reject', true);
                          setActionError('');
                          router.post(route('finance.expenses.reject', viewingExpense.id), { reason }, {
                            onSuccess: () => setViewModalOpen(false),
                            onFinish: () => setActionLoadingState('reject', false),
                            onError: (errs: any) => setActionError(Object.values(errs)[0] as string || 'Failed to reject'),
                          });
                        }}
                        disabled={actionLoading.reject}
                        className="px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-700 text-white font-medium disabled:opacity-60 flex items-center gap-2"
                      >
                        {actionLoading.reject && (
                          <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        )}
                        {actionLoading.reject ? 'Rejecting...' : 'Reject'}
                      </button>
                    </>
                  )}
                  {viewingExpense.status === 'rejected' && viewingExpense.user?.id && currentUserId === viewingExpense.user.id && (
                    <button
                      type="button"
                      onClick={() => {
                        setActionLoadingState('resubmit', true);
                        setActionError('');
                        router.post(route('finance.expenses.resubmit', viewingExpense.id), {}, {
                          onSuccess: () => setViewModalOpen(false),
                          onFinish: () => setActionLoadingState('resubmit', false),
                          onError: (errs: any) => setActionError(Object.values(errs)[0] as string || 'Failed to resubmit'),
                        });
                      }}
                      disabled={actionLoading.resubmit}
                      className="px-3 py-1.5 rounded bg-coin-700 hover:bg-coin-600 text-white font-medium disabled:opacity-60 flex items-center gap-2"
                    >
                      {actionLoading.resubmit && (
                        <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      )}
                      {actionLoading.resubmit ? 'Resubmitting...' : 'Resubmit'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setViewModalOpen(false)}
                    disabled={Object.values(actionLoading).some(Boolean)}
                    className="px-3 py-1.5 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100 disabled:opacity-60"
                  >
                    Close
                  </button>
                </div>
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
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">New Requisition</h2>
        <button
          type="button"
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
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
      <form onSubmit={handleSubmit} className="px-6 py-4 bg-white dark:bg-gray-900 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Amount *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500 dark:text-gray-400">MWK</span>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={data.amount}
              onChange={(e) => setData('amount', e.target.value)}
              className="w-full pl-12 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-coin-500"
              placeholder="0.00"
            />
          </div>
          {errors.amount && (
            <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Category *
          </label>
          <select
            value={data.category}
            onChange={(e) => setData('category', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-coin-500"
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description
          </label>
          <input
            type="text"
            value={data.description}
            onChange={(e) => setData('description', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-coin-500"
            placeholder="e.g., Office supplies from Staples"
            maxLength={255}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Expense Date *
          </label>
          <input
            type="date"
            required
            value={data.expense_date}
            onChange={(e) => setData('expense_date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-coin-500"
          />
          {errors.expense_date && (
            <p className="mt-1 text-sm text-red-600">{errors.expense_date}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Payment Method *
          </label>
          <select
            value={data.payment_method}
            onChange={(e) => setData('payment_method', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-coin-500"
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Notes
          </label>
          <textarea
            value={data.notes}
            onChange={(e) => setData('notes', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-coin-500"
            placeholder="Additional details or comments about this expense"
          />
          {errors.notes && (
            <p className="mt-1 text-sm text-red-600">{errors.notes}</p>
          )}
        </div>

        <div className="bg-coin-50 dark:bg-coin-900/20 border border-coin-200 dark:border-coin-800 rounded-lg p-4">
          <p className="text-sm text-coin-800 dark:text-coin-200">
            Your requisition will be submitted for approval. Once approved, it will appear in the system.
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={processing}
            className="flex-1 px-4 py-2 bg-coin-700 text-white rounded-lg hover:bg-coin-600 disabled:bg-gray-400 dark:disabled:bg-gray-700 transition font-medium"
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
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Edit Requisition #{expense.id}
        </h2>
        <button
          type="button"
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
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
      <form onSubmit={handleSubmit} className="px-6 py-4 bg-white dark:bg-gray-900 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Amount *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500 dark:text-gray-400">MWK</span>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={data.amount}
              onChange={(e) => setData('amount', e.target.value)}
              className="w-full pl-12 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-coin-500"
            />
          </div>
          {errors.amount && (
            <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Category *
          </label>
          <select
            value={data.category}
            onChange={(e) => setData('category', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-coin-500"
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description
          </label>
          <input
            type="text"
            value={data.description}
            onChange={(e) => setData('description', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-coin-500"
            maxLength={255}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Expense Date *
          </label>
          <input
            type="date"
            required
            value={data.expense_date}
            onChange={(e) => setData('expense_date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-coin-500"
          />
          {errors.expense_date && (
            <p className="mt-1 text-sm text-red-600">{errors.expense_date}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Payment Method *
          </label>
          <select
            value={data.payment_method}
            onChange={(e) => setData('payment_method', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-coin-500"
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Notes
          </label>
          <textarea
            value={data.notes}
            onChange={(e) => setData('notes', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-coin-500"
          />
          {errors.notes && (
            <p className="mt-1 text-sm text-red-600">{errors.notes}</p>
          )}
        </div>

        <div className="bg-coin-50 dark:bg-coin-900/20 border border-coin-200 dark:border-coin-800 rounded-lg p-4">
          <p className="text-sm text-coin-800 dark:text-coin-200">
            Changes to this requisition may require re-approval depending on your workflow.
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={processing}
            className="flex-1 px-4 py-2 bg-coin-700 text-white rounded-lg hover:bg-coin-600 disabled:bg-gray-400 dark:disabled:bg-gray-700 transition font-medium"
          >
            {processing ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
