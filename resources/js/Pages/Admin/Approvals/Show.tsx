import React from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'

function getStatusBadgeClassName(status: string) {
  switch (status) {
    case 'approved':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200';
    case 'rejected':
      return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200';
    default:
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200';
  }
}

interface ExpenseLite {
  id: number;
  description?: string | null;
  amount?: number | null;
  category?: string | null;
  expense_date?: string | null;
}

interface Approval {
  id: number;
  status: 'pending' | 'approved' | 'rejected';
  stage?: number | null;
  comments?: string | null;
  expense?: ExpenseLite | null;
  approver?: { id: number; name: string } | null;
  created_at?: string;
}

interface Props {
  approval: Approval;
}

export default function AdminApprovalsShow({ approval }: Props) {
  const doApprove = () => {
    if (!confirm('Approve this requisition?')) return;
    router.post(route('admin.approvals.approve', approval.id));
  };
  const doReject = () => {
    const reason = prompt('Reason (optional)') || '';
    if (!confirm('Reject this requisition?')) return;
    router.post(route('admin.approvals.reject', approval.id), { comments: reason });
  };

  return (
    <AuthenticatedLayout header={`Approval #${approval.id}`}>
      <Head title={`Approval #${approval.id}`} />
      <div className="py-6">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm shadow-black/5 overflow-hidden dark:border-gray-800 dark:bg-gray-900/60 dark:shadow-none">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Approval #{approval.id}</h1>
              <a
                href={route('admin.approvals.index')}
                className="text-coin-700 hover:text-coin-800 dark:text-coin-300 dark:hover:text-coin-200 text-sm focus:outline-none focus:ring-2 focus:ring-coin-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950 rounded-md px-2 py-1 -mr-2"
              >
                ← Back
              </a>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500">Status</div>
                  <div className="mt-1 inline-flex items-center gap-2">
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{approval.status}</div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClassName(approval.status)}`}> 
                      {approval.status}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Stage</div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{approval.stage ?? '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Approver</div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{approval.approver?.name ?? '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Amount</div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{approval.expense?.amount ?? '-'}</div>
                </div>
              </div>
              {approval.expense?.description && (
                <div>
                  <div className="text-xs text-gray-500">Description</div>
                  <div className="text-sm text-gray-900 dark:text-gray-100">{approval.expense.description}</div>
                </div>
              )}
              {approval.comments && (
                <div>
                  <div className="text-xs text-gray-500">Comments</div>
                  <div className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{approval.comments}</div>
                </div>
              )}
            </div>
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row justify-end gap-2">
              <a href={route('admin.approvals.index')} className="w-full sm:w-auto px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-coin-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950 text-center">Close</a>
              {approval.status === 'pending' && (
                <>
                  <button onClick={doApprove} className="w-full sm:w-auto px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-coin-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950">Approve</button>
                  <button onClick={doReject} className="w-full sm:w-auto px-4 py-2 rounded bg-rose-600 text-white hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-coin-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950">Reject</button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
