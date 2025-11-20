import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import FinanceLayout from '@/Layouts/FinanceLayout';
import { formatCurrency, formatDate } from '@/utils/formatters';

type Expense = {
  id: number;
  amount: number;
  category?: string | null;
  description?: string | null;
  expense_date?: string | null;
  payment_method?: string | null;
  status?: string | null;
};

type Approver = {
  id: number;
  name: string;
} | null;

type Approval = {
  id: number;
  status: string;
  stage?: number | null;
  comments?: string | null;
  expense?: Expense | null;
  approver?: Approver;
  created_at?: string | null;
  updated_at?: string | null;
};

interface Props {
  approval: Approval;
}

function getStatusClasses(status: string): { banner: string; badge: string } {
  switch (status) {
    case 'approved':
      return {
        banner: 'bg-emerald-50 border-emerald-100 text-emerald-800',
        badge: 'bg-emerald-100 text-emerald-800',
      };
    case 'rejected':
      return {
        banner: 'bg-red-50 border-red-100 text-red-800',
        badge: 'bg-red-100 text-red-800',
      };
    default:
      return {
        banner: 'bg-yellow-50 border-yellow-100 text-yellow-800',
        badge: 'bg-yellow-100 text-yellow-800',
      };
  }
}

export default function ApprovalShow({ approval }: Props) {
  const [comments, setComments] = useState<string>(approval.comments || '');

  const expense = approval.expense || null;
  const isPending = approval.status === 'pending';
  const statusClasses = getStatusClasses(approval.status);

  const handleAction = (action: 'approve' | 'reject') => {
    if (!isPending) return;
    if (!window.confirm('Are you sure you want to ' + action + ' this expense?')) return;

    router.post(route('finance.approvals.' + action, { approval: approval.id }), {
      comments,
    });
  };

  return (
    <FinanceLayout title="Approval">
      <Head title="Approval" />
      <div className="py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Expense approval</h1>
              <p className="mt-1 text-sm text-gray-600">
                {expense ? 'Expense #' + expense.id : 'Approval #' + approval.id}
                {' '}
                {'(' + approval.status + ')'}
                {typeof approval.stage === 'number' && ' - Stage ' + approval.stage}
              </p>
            </div>
            <Link
              href={route('finance.approvals.index')}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
            >
              Back to approvals
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div
              className={
                'px-6 py-4 border-b flex items-center justify-between ' + statusClasses.banner
              }
            >
              <div>
                <div className="text-xs font-semibold uppercase">Status</div>
                <div className="mt-1 inline-flex items-center gap-2">
                  <span className="text-lg font-semibold capitalize">{approval.status}</span>
                  <span className={
                    'px-2 py-0.5 rounded-full text-xs font-medium ' + statusClasses.badge
                  }>
                    {isPending ? 'Waiting for your decision' : 'Completed'}
                  </span>
                </div>
                {approval.approver && (
                  <div className="mt-1 text-xs text-gray-700">
                    Assigned to {approval.approver.name}
                  </div>
                )}
              </div>
              {expense && (
                <div className="text-right">
                  <div className="text-xs text-gray-600 uppercase">Amount</div>
                  <div className="mt-1 text-2xl font-bold text-emerald-600">
                    {formatCurrency(expense.amount)}
                  </div>
                  {expense.status && (
                    <div className="mt-1 text-xs text-gray-700">
                      Expense status: {expense.status}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 space-y-6">
              {expense && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">Description</div>
                    <div className="text-sm text-gray-900 bg-gray-50 rounded-lg px-3 py-2">
                      {expense.description || 'Expense #' + expense.id}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">Category</div>
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-xs font-medium">
                      {expense.category
                        ? String(expense.category).replace(/_/g, ' ')
                        : 'Uncategorised'}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">Expense date</div>
                    <div className="text-sm text-gray-900">
                      {expense.expense_date ? formatDate(expense.expense_date) : 'Not set'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">Payment method</div>
                    <div className="text-sm text-gray-900">
                      {expense.payment_method || 'Not specified'}
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Approval stage</div>
                  <div className="text-sm text-gray-900">
                    {typeof approval.stage === 'number' ? 'Stage ' + approval.stage : 'Not set'}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Approval ID</div>
                  <div className="text-sm text-gray-900">{approval.id}</div>
                </div>
              </div>

              <div className="border-t pt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-700">Comments</div>
                  {!isPending && (
                    <div className="text-xs text-gray-500">This approval has already been processed.</div>
                  )}
                </div>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  rows={4}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  disabled={!isPending}
                />
              </div>

              {(approval.created_at || approval.updated_at) && (
                <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-600">
                  {approval.created_at && (
                    <div>
                      <div className="font-medium">Created</div>
                      <div>{formatDate(approval.created_at)}</div>
                    </div>
                  )}
                  {approval.updated_at && (
                    <div>
                      <div className="font-medium">Last updated</div>
                      <div>{formatDate(approval.updated_at)}</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t bg-gray-50 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="text-xs text-gray-500">
                {isPending
                  ? 'Review the expense details, add an optional comment, then approve or reject.'
                  : 'No further action is required on this approval.'}
              </div>
              {isPending && (
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleAction('reject')}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAction('approve')}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    Approve
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


