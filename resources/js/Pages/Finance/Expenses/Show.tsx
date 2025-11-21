import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import FinanceLayout from '@/Layouts/FinanceLayout';
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
  const getStatusColor = (status: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      approved: { bg: 'bg-green-100', text: 'text-green-800' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800' },
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
    <FinanceLayout title={`Requisition #${expense.id}`}>
      <Head title={`Requisition #${expense.id}`} />
      
      <div className="py-6">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Requisition #{expense.id}
              </h1>
              <p className="text-gray-600">
                Created on {formatDate(expense.created_at)}
              </p>
            </div>
            <Link
              href={route('finance.expenses.index')}
              className="text-indigo-600 hover:text-indigo-900 font-medium"
            >
              ← Back to Requisitions
            </Link>
          </div>

          {/* Main Card */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className={`${statusColor.bg} ${statusColor.text} px-6 py-4 border-b`}>
              <div className="flex justify-between items-center">
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
            <div className="p-6 space-y-6">
              {/* Main Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Category
                  </label>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium inline-block">
                    {expense.category.replace(/_/g, ' ')}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Payment Method
                  </label>
                  <p className="text-gray-900">
                    {expense.payment_method.charAt(0).toUpperCase() +
                      expense.payment_method.slice(1)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Requisition Date
                  </label>
                  <p className="text-gray-900">{formatDate(expense.expense_date)}</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Submitted By
                  </label>
                  <p className="text-gray-900">{expense.user.name}</p>
                </div>
              </div>

              {/* Description */}
              {expense.description && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded">
                    {expense.description}
                  </p>
                </div>
              )}

              {/* Account */}
              {expense.account && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Account
                  </label>
                  <p className="text-gray-900">{expense.account.name}</p>
                </div>
              )}

              {/* Notes */}
              {expense.notes && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Notes
                  </label>
                  <div className="text-gray-900 bg-gray-50 p-3 rounded whitespace-pre-wrap">
                    {expense.notes}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
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

            <div className="bg-gray-50 px-6 py-4 border-t flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="text-xs text-gray-500">
                {canModify
                  ? 'Pending requisitions can be edited or deleted until a finance approver takes action.'
                  : 'This requisition is final and cannot be modified directly.'}
              </div>
              {canModify && (
                <div className="flex gap-3">
                  <Link
                    href={route('finance.expenses.edit', expense.id)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium text-sm"
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
                        router.delete(route('finance.expenses.destroy', expense.id));
                      }
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium text-sm"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </FinanceLayout>
  );
}
