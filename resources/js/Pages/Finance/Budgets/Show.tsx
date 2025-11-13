import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { formatCurrency, formatPercent } from '@/utils/formatters';

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
  created_at: string;
  updated_at: string;
}

interface Props {
  budget: Budget;
  spent: number;
  remaining: number;
  percentageSpent: number;
  isExceeded: boolean;
  isCriticallyLow: boolean;
}

export default function ShowBudget({
  budget,
  spent,
  remaining,
  percentageSpent,
  isExceeded,
  isCriticallyLow,
}: Props) {
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this budget? This action cannot be undone.')) {
      router.delete(route('finance.budgets.destroy', budget.id));
    }
  };

  const getProgressColor = () => {
    if (isExceeded) return 'bg-red-500';
    if (isCriticallyLow) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getProgressTextColor = () => {
    if (isExceeded) return 'text-red-600';
    if (isCriticallyLow) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <AdminLayout title={budget.name}>
      <Head title={budget.name} />

      <div className="py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{budget.name}</h1>
              <p className="text-gray-600">
                {budget.category.replace(/_/g, ' ')} · {budget.fiscal_year}
                {budget.fiscal_month && ` · Month ${budget.fiscal_month}`}
              </p>
            </div>
            <Link
              href={route('finance.budgets.index')}
              className="text-indigo-600 hover:text-indigo-900 font-medium"
            >
              ← Back to Budgets
            </Link>
          </div>

          {/* Main Card */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {/* Status Banner */}
            <div className={`${getProgressColor()} bg-opacity-10 px-6 py-4 border-b border-gray-200`}>
              <div className="flex justify-between items-center mb-4">
                <span className={`text-lg font-semibold ${getProgressTextColor()}`}>
                  {isExceeded && '⚠️ Budget Exceeded'}
                  {!isExceeded && isCriticallyLow && '⚠️ Budget Critical (80%+)'}
                  {!isExceeded && !isCriticallyLow && '✓ Budget On Track'}
                </span>
                <span className="text-2xl font-bold text-gray-900">
                  {formatPercent(percentageSpent)}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full ${getProgressColor()} transition-all duration-300`}
                  style={{ width: `${Math.min(percentageSpent, 100)}%` }}
                />
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Budget Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Budgeted Amount</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(budget.budgeted_amount)}
                  </p>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Amount Spent</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(spent)}</p>
                </div>

                <div
                  className={`${remaining < 0 ? 'bg-red-50' : 'bg-green-50'} rounded-lg p-4`}
                >
                  <p className="text-sm text-gray-600 mb-1">Remaining</p>
                  <p className={`text-2xl font-bold ${remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(remaining)}
                  </p>
                </div>
              </div>

              {/* Budget Details */}
              <div className="border-t pt-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
                  Budget Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Category</p>
                    <p className="font-semibold text-gray-900">{budget.category.replace(/_/g, ' ')}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Fiscal Period</p>
                    <p className="font-semibold text-gray-900">
                      {budget.fiscal_month ? `${budget.fiscal_month}/${budget.fiscal_year}` : budget.fiscal_year}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Status</p>
                    <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                      {budget.status.charAt(0).toUpperCase() + budget.status.slice(1)}
                    </span>
                  </div>
                  <div>
                    <p className="text-gray-600">Created By</p>
                    <p className="font-semibold text-gray-900">{budget.user.name}</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              {budget.description && (
                <div className="border-t pt-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    Description
                  </h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{budget.description}</p>
                </div>
              )}

              {/* Metadata */}
              {budget.created_at && (
                <div className="border-t pt-4">
                  <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                    <div>
                      <p className="font-medium">Created</p>
                      <p>{new Date(budget.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="font-medium">Updated</p>
                      <p>{new Date(budget.updated_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="bg-gray-50 px-6 py-4 border-t flex gap-3 flex-wrap">
              <Link
                href={route('finance.budgets.edit', budget.id)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
              >
                Edit
              </Link>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
              >
                Delete
              </button>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              💡 This budget tracks approved expenses in the <strong>{budget.category.replace(/_/g, ' ')}</strong>{' '}
              category. Only approved expenses count towards the budget total.
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
