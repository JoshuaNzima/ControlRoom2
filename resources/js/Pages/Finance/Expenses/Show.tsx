import React from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import FinanceLayout from '@/Layouts/FinanceLayout';
import AdminLayout from '@/Layouts/AdminLayout';
import { formatCurrency, formatDate } from '@/utils/formatters';

interface Expense {
  id: number;
  amount: number;
  category: string;
  description: string | null;
  expense_date: string;
  payment_method: string;
  status: 'pending' | 'approved' | 'rejected';
  notes: string | null;
  user: {
    id: number;
    name: string;
  };
  account?: {
    id: number;
    name: string;
  };
  created_at: string;
  updated_at: string;
}

interface Props {
  expense: Expense;
}

export default function ShowExpense({ expense }: Props) {
  const { url } = usePage();
  const isAdminRoute = typeof url === 'string' && url.startsWith('/admin/');
  const Layout = isAdminRoute ? AdminLayout : FinanceLayout;
  const listRouteName = isAdminRoute ? 'admin.requisitions.index' : 'finance.expenses.index';
  const editRouteName = isAdminRoute ? 'admin.requisitions.edit' : 'finance.expenses.edit';
  const destroyRouteName = isAdminRoute ? 'admin.requisitions.destroy' : 'finance.expenses.destroy';
  const getStatusColor = (status: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      pending: { bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-800 dark:text-amber-100' },
      approved: { bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-800 dark:text-emerald-100' },
      rejected: { bg: 'bg-red-50 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-100' },
    };
    return colors[status] || { bg: 'bg-gray-100', text: 'text-gray-800' };
  };

  const statusColor = getStatusColor(expense.status);
  const statusDescription: Record<string, string> = {
    pending: 'Pending approval. This requisition can still be edited or withdrawn until it is approved or rejected.',
    approved: 'Approved and included in financial totals. Further edits should go through finance.',
    rejected: 'Rejected. Review the notes for rejection details.',
  };
  const canModify = expense.status === 'pending';

  return (
    <Layout title={`Requisition #${expense.id}`}>
      <Head title={`Requisition #${expense.id}`} />
      
      <div className="py-6">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Requisition #{expense.id}
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Created on {formatDate(expense.created_at)}
              </p>
            </div>
            <Link
              href={route(listRouteName)}
              className="w-full sm:w-auto inline-flex items-center justify-center text-coin-700 hover:text-coin-800 dark:text-coin-300 dark:hover:text-coin-200 font-medium"
            >
              ← Back to Requisitions
            </Link>
          </div>

          {/* Main Card */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm shadow-black/5 overflow-hidden dark:border-gray-800 dark:bg-gray-900/60 dark:shadow-none">
            <div className={`${statusColor.bg} ${statusColor.text} px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-800`}>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div>
                  <span className="text-lg font-semibold">
                    Status: {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                  </span>
                  {statusDescription[expense.status] && (
                    <p className="text-xs mt-1 opacity-80 max-w-md">
                      {statusDescription[expense.status]}
                    </p>
                  )}
                </div>
                <span className="text-2xl font-bold">{formatCurrency(expense.amount)}</span>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 space-y-6">
              {/* Main Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <span className="px-3 py-1 rounded text-sm font-medium inline-block bg-coin-50 text-coin-800 border border-coin-200 dark:bg-coin-900/20 dark:text-coin-200 dark:border-coin-800">
                    {expense.category.replace(/_/g, ' ')}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Payment Method
                  </label>
                  <p className="text-gray-900 dark:text-gray-100">
                    {expense.payment_method.charAt(0).toUpperCase() +
                      expense.payment_method.slice(1)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Requisition Date
                  </label>
                  <p className="text-gray-900 dark:text-gray-100">{formatDate(expense.expense_date)}</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Submitted By
                  </label>
                  <p className="text-gray-900 dark:text-gray-100">{expense.user.name}</p>
                </div>
              </div>

              {/* Description */}
              {expense.description && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <p className="text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-800">
                    {expense.description}
                  </p>
                </div>
              )}

              {/* Account */}
              {expense.account && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Account
                  </label>
                  <p className="text-gray-900 dark:text-gray-100">{expense.account.name}</p>
                </div>
              )}

              {/* Notes */}
              {expense.notes && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Notes
                  </label>
                  <div className="text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-900 p-3 rounded whitespace-pre-wrap border border-gray-200 dark:border-gray-800">
                    {expense.notes}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div>
                    <p className="font-medium">Created</p>
                    <p>{formatDate(expense.created_at)}</p>
                  </div>
                  <div>
                    <p className="font-medium">Updated</p>
                    <p>{formatDate(expense.updated_at)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {canModify
                  ? 'Pending requisitions can be edited or deleted until a finance approver takes action.'
                  : 'This requisition is final and cannot be modified directly.'}
              </div>
              {canModify && (
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  <Link
                    href={route(editRouteName, expense.id)}
                    className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-coin-600 text-white rounded-lg hover:bg-coin-700 transition font-medium text-sm"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          'Are you sure you want to delete this expense? This action cannot be undone.'
                        )
                      ) {
                        router.delete(route(destroyRouteName, expense.id));
                      }
                    }}
                    className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium text-sm"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
