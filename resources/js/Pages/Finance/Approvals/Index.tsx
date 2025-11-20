import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import FinanceLayout from '@/Layouts/FinanceLayout';
import { formatCurrency, formatDate } from '@/utils/formatters';

interface Props {
  approvals: any[];
}

export default function ApprovalsIndex({ approvals }: Props) {
  const handleApprove = (id: number) => {
    router.post(route('finance.approvals.approve', { approval: id }), {});
  };

  const handleReject = (id: number) => {
    router.post(route('finance.approvals.reject', { approval: id }), {});
  };

  const pendingCount = approvals.length;

  return (
    <FinanceLayout title="Approvals">
      <Head title="Approvals" />
      <div className="py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Approvals</h1>
              <p className="mt-1 text-sm text-gray-600">
                {pendingCount === 0
                  ? 'No pending approvals assigned to you.'
                  : `You have ${pendingCount} pending expense approval${pendingCount === 1 ? '' : 's'}.`}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            {approvals.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500 mb-3">
                  There are currently no expenses waiting for your approval.
                </p>
                <Link
                  href={route('finance.expenses.index')}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  View all expenses
                </Link>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Expense
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Stage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Approver
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {approvals.map((a: any) => (
                    <tr key={a.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm">
                        <Link
                          href={route('finance.expenses.show', a.expense.id)}
                          className="font-medium text-indigo-600 hover:text-indigo-800"
                        >
                          {a.expense.description || `Expense #${a.expense.id}`}
                        </Link>
                        <div className="mt-1 text-xs text-gray-500">
                          {a.expense.category && (
                            <span className="inline-block mr-2">
                              {String(a.expense.category).replace(/_/g, ' ')}
                            </span>
                          )}
                          {a.expense.expense_date && (
                            <span>{formatDate(a.expense.expense_date)}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {formatCurrency(a.expense.amount)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {a.expense.expense_date ? formatDate(a.expense.expense_date) : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {a.stage ?? '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {a.approver?.name || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-right space-x-2">
                        <Link
                          href={route('finance.approvals.show', a.id)}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                        >
                          Details
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleApprove(a.id)}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(a.id)}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </FinanceLayout>
  );
}
