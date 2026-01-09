import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import FinanceLayout from '@/Layouts/FinanceLayout';
import AdminLayout from '@/Layouts/AdminLayout';
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
        banner: 'bg-emerald-50 border-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-100',
        badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
      };
    case 'rejected':
      return {
        banner: 'bg-red-50 border-red-100 text-red-800 dark:bg-red-900/30 dark:border-red-800 dark:text-red-100',
        badge: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
      };
    default:
      return {
        banner: 'bg-amber-50 border-amber-100 text-amber-800 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-100',
        badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
      };
  }
}

export default function ApprovalShow({ approval }: Props) {
  const [comments, setComments] = useState<string>(approval.comments || '');
  const { url } = usePage();
  const isAdminRoute = typeof url === 'string' && url.startsWith('/admin/');
  const prefix = isAdminRoute ? 'admin' : 'finance';
  const Layout = isAdminRoute ? AdminLayout : FinanceLayout;

  const expense = approval.expense || null;
  const isPending = approval.status === 'pending';
  const statusClasses = getStatusClasses(approval.status);

  const handleAction = (action: 'approve' | 'reject') => {
    if (!isPending) return;
    if (!window.confirm('Are you sure you want to ' + action + ' this expense?')) return;

    router.post(route(prefix + '.approvals.' + action, { approval: approval.id }), {
      comments,
    });
  };

  return (
    <Layout title="Approval">
      <Head title="Approval" />
      <div className="py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Requisition approval</h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                {expense ? 'Requisition #' + expense.id : 'Approval #' + approval.id}
                {' '}
                {'(' + approval.status + ')'}
                {typeof approval.stage === 'number' && ' - Stage ' + approval.stage}
              </p>
            </div>
            <Link
              href={route(prefix + '.approvals.index')}
              className="w-full sm:w-auto inline-flex items-center justify-center text-sm font-medium text-coin-700 hover:text-coin-800 dark:text-coin-300 dark:hover:text-coin-200"
            >
              Back to approvals
            </Link>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm shadow-black/5 overflow-hidden dark:border-gray-800 dark:bg-gray-900/60 dark:shadow-none">
            <div
              className={
                'px-4 sm:px-6 py-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ' + statusClasses.banner
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
                  <div className="mt-1 text-xs text-gray-700 dark:text-gray-300">
                    Assigned to {approval.approver.name}
                  </div>
                )}
              </div>
              {expense && (
                <div className="text-right">
                  <div className="text-xs text-gray-600 dark:text-gray-300 uppercase">Amount</div>
                  <div className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-300">
                    {formatCurrency(expense.amount)}
                  </div>
                  {expense.status && (
                    <div className="mt-1 text-xs text-gray-700 dark:text-gray-300">
                      Requisition status: {expense.status}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 space-y-6">
              {expense && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</div>
                    <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-900 rounded-lg px-3 py-2">
                      {expense.description || 'Requisition #' + expense.id}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</div>
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-coin-100 dark:bg-coin-900/30 text-coin-800 dark:text-coin-200 text-xs font-medium">
                      {expense.category
                        ? String(expense.category).replace(/_/g, ' ')
                        : 'Uncategorised'}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Requisition date</div>
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      {expense.expense_date ? formatDate(expense.expense_date) : 'Not set'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment method</div>
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      {expense.payment_method || 'Not specified'}
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t border-gray-200 dark:border-gray-800 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Approval stage</div>
                  <div className="text-sm text-gray-900 dark:text-gray-100">
                    {typeof approval.stage === 'number' ? 'Stage ' + approval.stage : 'Not set'}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Approval ID</div>
                  <div className="text-sm text-gray-900 dark:text-gray-100">{approval.id}</div>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-800 pt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Comments</div>
                  {!isPending && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">This approval has already been processed.</div>
                  )}
                </div>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-coin-500 dark:bg-gray-900 dark:text-gray-100"
                  rows={4}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  disabled={!isPending}
                />
              </div>

              {(approval.created_at || approval.updated_at) && (
                <div className="border-t border-gray-200 dark:border-gray-800 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-600 dark:text-gray-400">
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

            <div className="px-4 sm:px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {isPending
                  ? 'Review the expense details, add an optional comment, then approve or reject.'
                  : 'No further action is required on this approval.'}
              </div>
              {isPending && (
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  <button
                    type="button"
                    onClick={() => handleAction('reject')}
                    className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAction('approve')}
                    className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    Approve
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


