import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import FinanceLayout from '@/Layouts/FinanceLayout';
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
}

const statuses = ['active', 'inactive', 'archived'];

export default function BudgetIndex({ budgets, summary, filters, years }: Props) {
  const [filterYear, setFilterYear] = useState(filters.fiscal_year || new Date().getFullYear());
  const [filterStatus, setFilterStatus] = useState(filters.status || '');

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
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      archived: 'bg-blue-100 text-blue-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <FinanceLayout title="Budgets">
      <Head title="Budgets" />

      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Budgets</h1>
            <Link
              href={route('finance.budgets.create')}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              + New Budget
            </Link>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 mb-2">Total Budgeted</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(summary.total_budgeted)}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 mb-2">Total Spent</p>
              <p className="text-3xl font-bold text-blue-600">
                {formatCurrency(summary.total_spent)}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 mb-2">Budgets Exceeded</p>
              <p className="text-3xl font-bold text-red-600">
                {summary.budgets_exceeded}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fiscal Year
                </label>
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
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
              <div className="flex items-end gap-2">
                <button
                  onClick={handleFilter}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
                >
                  Apply Filters
                </button>
                <button
                  onClick={handleClearFilters}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm font-medium"
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
                  className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{budget.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">
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
                        <span className="text-sm text-gray-600">Budget Amount</span>
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(budget.budgeted_amount)}
                        </span>
                      </div>
                    </div>

                    {budget.description && (
                      <p className="text-sm text-gray-500 line-clamp-2">{budget.description}</p>
                    )}

                    <div className="text-xs text-gray-500 pt-2 border-t">
                      Created by {budget.user.name}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-500 mb-4">No budgets found for the selected year.</p>
              <Link
                href={route('finance.budgets.create')}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                + Create First Budget
              </Link>
            </div>
          )}

          {/* Pagination */}
          {budgets.meta.last_page > 1 && (
            <div className="flex justify-center gap-2">
              {budgets.links.map((link: any, index: number) => (
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
        </div>
      </div>
    </FinanceLayout>
  );
}
