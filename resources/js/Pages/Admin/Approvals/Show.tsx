import React from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

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
    <AdminLayout title={`Approval #${approval.id}`}>
      <Head title={`Approval #${approval.id}`} />
      <div className="py-6">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow border">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h1 className="text-lg font-semibold text-gray-900">Approval #{approval.id}</h1>
              <a href={route('admin.approvals.index')} className="text-indigo-600 hover:text-indigo-800 text-sm">← Back</a>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500">Status</div>
                  <div className="text-sm font-semibold text-gray-900">{approval.status}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Stage</div>
                  <div className="text-sm font-semibold text-gray-900">{approval.stage ?? '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Approver</div>
                  <div className="text-sm font-semibold text-gray-900">{approval.approver?.name ?? '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Amount</div>
                  <div className="text-sm font-semibold text-gray-900">{approval.expense?.amount ?? '-'}</div>
                </div>
              </div>
              {approval.expense?.description && (
                <div>
                  <div className="text-xs text-gray-500">Description</div>
                  <div className="text-sm text-gray-900">{approval.expense.description}</div>
                </div>
              )}
              {approval.comments && (
                <div>
                  <div className="text-xs text-gray-500">Comments</div>
                  <div className="text-sm text-gray-900 whitespace-pre-wrap">{approval.comments}</div>
                </div>
              )}
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-2">
              <a href={route('admin.approvals.index')} className="px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300">Close</a>
              {approval.status === 'pending' && (
                <>
                  <button onClick={doApprove} className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700">Approve</button>
                  <button onClick={doReject} className="px-4 py-2 rounded bg-rose-600 text-white hover:bg-rose-700">Reject</button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
