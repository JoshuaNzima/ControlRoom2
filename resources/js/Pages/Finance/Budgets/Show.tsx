import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import FinanceLayout from '@/Layouts/FinanceLayout';
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
    if (isExceeded) return 'text-red-600 dark:text-red-400';
    if (isCriticallyLow) return 'text-yellow-700 dark:text-yellow-300';
    return 'text-emerald-700 dark:text-emerald-300';
  };

  return (
    <FinanceLayout title={budget.name}>
      <Head title={budget.name} />

      <div className="py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">{budget.name}</h1>
              <p className="text-gray-600 dark:text-gray-400">
                {budget.category.replace(/_/g, ' ')} · {budget.fiscal_year}
                {budget.fiscal_month && ` · Month ${budget.fiscal_month}`}
              </p>
            </div>
            <Link
              href={route('finance.budgets.index')}
              className="w-full sm:w-auto text-coin-600 hover:text-coin-700 dark:text-coin-300 dark:hover:text-coin-200 font-medium"
            >
              ← Back to Budgets
            </Link>
          </div>

          {/* Main Card */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow overflow-hidden">
            {/* Status Banner */}
            <div className={`${getProgressColor()} bg-opacity-10 dark:bg-opacity-20 px-6 py-4 border-b border-gray-200 dark:border-gray-800`}>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
                <span className={`text-lg font-semibold ${getProgressTextColor()}`}>
                  {isExceeded && '⚠️ Budget Exceeded'}
                  {!isExceeded && isCriticallyLow && '⚠️ Budget Critical (80%+)'}
                  {!isExceeded && !isCriticallyLow && '✓ Budget On Track'}
                </span>
                <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {formatPercent(percentageSpent)}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-3 overflow-hidden">
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
                <div className="bg-gray-50 dark:bg-gray-950/40 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Budgeted Amount</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(budget.budgeted_amount)}
                  </p>
                </div>

                <div className="bg-coin-50 dark:bg-coin-900/20 border border-coin-200 dark:border-coin-800 rounded-lg p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Amount Spent</p>
                  <p className="text-2xl font-bold text-coin-600 dark:text-coin-300">{formatCurrency(spent)}</p>
                </div>

                <div
                  className={`${remaining < 0 ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' : 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'} rounded-lg p-4`}
                >
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Remaining</p>
                  <p className={`text-2xl font-bold ${remaining < 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-300'}`}>
                    {formatCurrency(remaining)}
                  </p>
                </div>
              </div>

              {/* Budget Details */}
              <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4 uppercase tracking-wide">
                  Budget Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Category</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{budget.category.replace(/_/g, ' ')}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Fiscal Period</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {budget.fiscal_month ? `${budget.fiscal_month}/${budget.fiscal_year}` : budget.fiscal_year}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Status</p>
                    <span className="inline-block px-2 py-1 bg-green-100 text-green-800 dark:bg-emerald-900/30 dark:text-emerald-200 rounded text-xs font-medium">
                      {budget.status.charAt(0).toUpperCase() + budget.status.slice(1)}
                    </span>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Created By</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{budget.user.name}</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              {budget.description && (
                <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 uppercase tracking-wide">
                    Description
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{budget.description}</p>
                </div>
              )}

              {/* Metadata */}
              {budget.created_at && (
                <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-600 dark:text-gray-400">
                    <div>
                      <p className="font-medium text-gray-700 dark:text-gray-300">Created</p>
                      <p>{new Date(budget.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700 dark:text-gray-300">Updated</p>
                      <p>{new Date(budget.updated_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="bg-gray-50 dark:bg-gray-950/40 px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row gap-3">
              <Link
                href={route('finance.budgets.edit', budget.id)}
                className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-coin-600 text-white rounded-lg hover:bg-coin-700 transition font-medium"
              >
                Edit
              </Link>
              <button
                onClick={handleDelete}
                className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
              >
                Delete
              </button>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-6 bg-coin-50 border border-coin-200 dark:bg-coin-900/20 dark:border-coin-800 rounded-lg p-4">
            <p className="text-sm text-coin-800 dark:text-coin-200">
              💡 This budget tracks approved expenses in the <strong>{budget.category.replace(/_/g, ' ')}</strong>{' '}
              category. Only approved expenses count towards the budget total.
            </p>
          </div>
        </div>
      </div>
    </FinanceLayout>
  );
}
