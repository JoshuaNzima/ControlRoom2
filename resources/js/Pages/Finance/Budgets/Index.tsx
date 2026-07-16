import React, { useState, useEffect } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import Modal from '@/Components/Modal';
import { formatCurrency } from '@/utils/formatters';

interface Budget {
  id: number;
  name: string;
  category: string;
  budgeted_amount: number;
  fiscal_year: number;
  fiscal_month: number | null;
  status: 'active' | 'inactive' | 'archived';
  description?: string;
  user: {
    id: number;
    name: string;
  };
}

interface Props {
  budgets: {
    data: Budget[];
    links: any;
    meta: any;
  };
  summary: {
    total_budgeted: number;
    total_spent: number;
    budgets_exceeded: number;
  };
  filters: {
    fiscal_year: number;
    status?: string;
  };
  years: number[];
  categories: string[];
  currentYear: number;
  show_add?: number;
}

const statuses = ['active', 'inactive', 'archived'];

const months = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

export default function BudgetIndex({ budgets, summary, filters, years, categories, currentYear, show_add }: Props) {
  const [filterYear, setFilterYear] = useState(filters.fiscal_year || new Date().getFullYear());
  const [filterStatus, setFilterStatus] = useState(filters.status || '');
  const [showAddModal, setShowAddModal] = useState(false);

  const { data, setData, post, processing, errors, reset } = useForm({
    name: '',
    category: categories[0] || 'general',
    budgeted_amount: '',
    fiscal_year: currentYear.toString(),
    fiscal_month: '',
    description: '',
  });

  // Open add modal if show_add query param is present
  useEffect(() => {
    if (show_add) {
      setShowAddModal(true);
    }
  }, [show_add]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('finance.budgets.store'), {
      onSuccess: () => {
        setShowAddModal(false);
        reset();
      },
    });
  };

  const handleFilter = () => {
    const params: any = { fiscal_year: filterYear };
    if (filterStatus) params.status = filterStatus;
    router.get(route('finance.budgets.index'), params);
  };

  const handleClearFilters = () => {
    setFilterYear(new Date().getFullYear());
    setFilterStatus('');
    router.get(route('finance.budgets.index'));
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200',
      inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      archived: 'bg-coin-100 text-coin-800 dark:bg-coin-900/30 dark:text-coin-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  };

  return (
    <AuthenticatedLayout header="Budgets">
      <Head title="Budgets" />

      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Budgets</h1>
            <button
              onClick={() => setShowAddModal(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-coin-600 text-white rounded-lg hover:bg-coin-700 transition"
            >
              + New Budget
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Budgeted</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(summary.total_budgeted)}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Spent</p>
              <p className="text-3xl font-bold text-coin-600 dark:text-coin-300">
                {formatCurrency(summary.total_spent)}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Budgets Exceeded</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                {summary.budgets_exceeded}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Filters</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fiscal Year
                </label>
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-coin-500 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-coin-500 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
                >
                  <option value="">All Status</option>
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-end gap-2">
                <button
                  onClick={handleFilter}
                  className="w-full sm:flex-1 px-4 py-2 bg-coin-600 text-white rounded-lg hover:bg-coin-700 transition text-sm font-medium"
                >
                  Apply Filters
                </button>
                <button
                  onClick={handleClearFilters}
                  className="w-full sm:flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm font-medium dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* Budgets Grid */}
          {budgets.data.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {budgets.data.map((budget) => (
                <Link
                  key={budget.id}
                  href={route('finance.budgets.show', budget.id)}
                  className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{budget.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {budget.category.replace(/_/g, ' ')} · {budget.fiscal_year}
                        {budget.fiscal_month && ` · Month ${budget.fiscal_month}`}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                        budget.status
                      )}`}
                    >
                      {budget.status.charAt(0).toUpperCase() + budget.status.slice(1)}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Budget Amount</span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {formatCurrency(budget.budgeted_amount)}
                        </span>
                      </div>
                    </div>

                    {budget.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{budget.description}</p>
                    )}

                    <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-800">
                      Created by {budget.user.name}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow p-12 text-center">
              <p className="text-gray-500 dark:text-gray-400 mb-4">No budgets found for the selected year.</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-4 py-2 bg-coin-600 text-white rounded-lg hover:bg-coin-700 transition"
              >
                + Create First Budget
              </button>
            </div>
          )}

          {/* Pagination */}
          {budgets.meta && budgets.meta.last_page > 1 && (
            <div className="flex flex-wrap justify-center gap-2">
              {budgets.links && budgets.links.map((link: any, index: number) => (
                <Link
                  key={index}
                  href={link.url}
                  className={`px-3 py-2 rounded ${
                    link.active
                      ? 'bg-coin-600 text-white'
                      : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                  dangerouslySetInnerHTML={{ __html: link.label }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Budget Modal */}
      <Modal show={showAddModal} onClose={() => setShowAddModal(false)} maxWidth="2xl">
        <div className="p-4 sm:p-6 bg-white dark:bg-gray-950">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Create New Budget</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Budget Name *
              </label>
              <input
                type="text"
                required
                value={data.name}
                onChange={(e) => setData('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-coin-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                placeholder="e.g., Marketing Q1 2025"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category *
                </label>
                <select
                  value={data.category}
                  onChange={(e) => setData('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-coin-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
                {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Budgeted Amount *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500 dark:text-gray-400">MWK</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={data.budgeted_amount}
                    onChange={(e) => setData('budgeted_amount', e.target.value)}
                    className="w-full pl-14 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-coin-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    placeholder="0.00"
                  />
                </div>
                {errors.budgeted_amount && <p className="mt-1 text-sm text-red-600">{errors.budgeted_amount}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fiscal Year *
                </label>
                <select
                  value={data.fiscal_year}
                  onChange={(e) => setData('fiscal_year', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-coin-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                {errors.fiscal_year && <p className="mt-1 text-sm text-red-600">{errors.fiscal_year}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fiscal Month (Optional)
                </label>
                <select
                  value={data.fiscal_month}
                  onChange={(e) => setData('fiscal_month', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-coin-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Annual Budget</option>
                  {months.map((month) => (
                    <option key={month.value} value={month.value.toString()}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={data.description}
                onChange={(e) => setData('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-coin-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                placeholder="Add notes about this budget..."
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-full sm:w-auto px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={processing}
                className="w-full sm:w-auto px-4 py-2 bg-coin-600 text-white rounded-lg hover:bg-coin-700 disabled:bg-gray-400 transition font-medium"
              >
                {processing ? 'Creating...' : 'Create Budget'}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </AuthenticatedLayout>
  );
}
