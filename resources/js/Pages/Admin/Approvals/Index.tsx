import React, { useEffect, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import Modal from '@/Components/Modal';
import { formatCurrencyMWK } from '@/Components/format';
import RequisitionViewModal from '@/Components/Requisitions/RequisitionViewModal';

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

interface BudgetLite {
  id: number;
  fiscal_year: number;
  fiscal_month: number;
  user?: { id: number; name: string };
}

interface Props {
  approvals: Approval[];
  budgets: { data: BudgetLite[]; meta?: any } | BudgetLite[];
  selectedTab?: 'requisitions' | 'budgets';
  requisitionsPending?: RequisitionLite[];
}

interface RequisitionLite {
  id: number;
  title: string;
  amount?: number | string | null;
  status: 'pending_admin' | 'needs_revision' | 'pending_disbursement' | 'disbursed';
  requested_by?: number;
  requestedBy?: { id: number; name: string } | null;
  created_at?: string;
  needed_by?: string | null;
}

export default function AdminApprovalsIndex({ approvals = [], budgets, selectedTab = 'requisitions', requisitionsPending = [] }: Props) {
  const [tab, setTab] = useState<'requisitions' | 'budgets'>(selectedTab);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewing, setViewing] = useState<Approval | null>(null);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [reqOpen, setReqOpen] = useState(false);
  const [reqId, setReqId] = useState<number | null>(null);

  useEffect(() => {
    if (tab !== selectedTab) {
      router.get(route('admin.approvals.index'), { tab }, { preserveState: true, replace: true });
    }
  }, [tab]);

  const openView = async (id: number) => {
    setLoadingId(id);
    try {
      const res = await fetch(route('admin.approvals.show', id), {
        headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      });
      if (res.ok) {
        const json = await res.json();
        setViewing(json as Approval);
        setViewOpen(true);
      } else {
        router.visit(route('admin.approvals.show', id));
      }
    } finally {
      setLoadingId(null);
    }
  };

  const approveReq = (r: RequisitionLite) => {
    if (!confirm('Approve this requisition?')) return;
    router.post(route('requisitions.approve', r.id), {}, { preserveScroll: true });
  };

  const declineReq = (r: RequisitionLite) => {
    const reason = prompt('Reason (optional)') || '';
    if (!confirm('Decline this requisition?')) return;
    router.post(route('requisitions.decline', r.id), { notes_admin: reason }, { preserveScroll: true });
  };

  const doApprove = async (a: Approval) => {
    if (!confirm('Approve this requisition?')) return;
    router.post(route('admin.approvals.approve', a.id), {}, { preserveScroll: true });
  };

  const doReject = async (a: Approval) => {
    const reason = prompt('Reason (optional)') || '';
    if (!confirm('Reject this requisition?')) return;
    router.post(route('admin.approvals.reject', a.id), { comments: reason }, { preserveScroll: true });
  };

  const budgetsArr: BudgetLite[] = Array.isArray(budgets) ? budgets : (budgets?.data || []);

  return (
    <AdminLayout title="Approvals">
      <Head title="Approvals" />
      <div className="py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Approvals</h1>
            <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => setTab('requisitions')}
                className={`px-4 py-2 text-sm ${tab === 'requisitions' ? 'bg-red-600 text-white' : 'bg-white text-gray-700'}`}
              >
                Requisitions
              </button>
              <button
                onClick={() => setTab('budgets')}
                className={`px-4 py-2 text-sm ${tab === 'budgets' ? 'bg-red-600 text-white' : 'bg-white text-gray-700'}`}
              >
                Budgets
              </button>
            </div>
          </div>

          {tab === 'requisitions' && (
            <div className="bg-white rounded-xl shadow overflow-hidden dark:bg-gray-900 dark:border dark:border-gray-800">
              <table className="min-w-full">
                <thead className="bg-gray-50 dark:bg-gray-800/60">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase dark:text-gray-300">Requisition</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase dark:text-gray-300">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase dark:text-gray-300">Requested By</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase dark:text-gray-300">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {requisitionsPending.length > 0 ? requisitionsPending.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                      <td className="px-6 py-3 text-sm text-gray-900 dark:text-gray-100">
                        <div className="flex flex-col">
                          <span className="font-medium">{r.title}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">#{r.id}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-900 dark:text-gray-100">{r.amount != null ? formatCurrencyMWK(r.amount) : '-'}</td>
                      <td className="px-6 py-3 text-sm text-gray-700 dark:text-gray-300">{r.requestedBy?.name ?? (r.requested_by ? `User #${r.requested_by}` : '-')}</td>
                      <td className="px-6 py-3 text-sm">
                        <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-200 border border-yellow-500/30">
                          {String(r.status).replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm">
                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            onClick={() => { setReqId(r.id); setReqOpen(true); }}
                            className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                          >
                            View
                          </button>
                          <button onClick={() => approveReq(r)} className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300">Approve</button>
                          <button onClick={() => declineReq(r)} className="text-rose-600 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-300">Decline</button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">No requisitions pending admin approval.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'budgets' && (
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Period</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Owner</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {budgetsArr.length > 0 ? budgetsArr.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm text-gray-900">{String(b.fiscal_month).padStart(2, '0')}/{b.fiscal_year}</td>
                      <td className="px-6 py-3 text-sm text-gray-700">{b.user?.name ?? '-'}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={2} className="px-6 py-8 text-center text-gray-500">No budgets found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {viewing && (
            <Modal show={viewOpen} onClose={() => setViewOpen(false)} maxWidth="2xl">
              <div className="px-6 py-4 border-b flex items-center justify-between bg-white">
                <h2 className="text-lg font-semibold text-gray-900">Approval #{viewing.id}</h2>
                <button onClick={() => setViewOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              <div className="px-6 py-4 bg-white space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500">Status</div>
                    <div className="text-sm font-semibold text-gray-900">{viewing.status}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Stage</div>
                    <div className="text-sm font-semibold text-gray-900">{viewing.stage ?? '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Approver</div>
                    <div className="text-sm font-semibold text-gray-900">{viewing.approver?.name ?? '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Amount</div>
                    <div className="text-sm font-semibold text-gray-900">{viewing.expense?.amount ?? '-'}</div>
                  </div>
                </div>
                {viewing.expense?.description && (
                  <div>
                    <div className="text-xs text-gray-500">Description</div>
                    <div className="text-sm text-gray-900">{viewing.expense.description}</div>
                  </div>
                )}
                {viewing.comments && (
                  <div>
                    <div className="text-xs text-gray-500">Comments</div>
                    <div className="text-sm text-gray-900 whitespace-pre-wrap">{viewing.comments}</div>
                  </div>
                )}
              </div>
              <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-2">
                <button onClick={() => setViewOpen(false)} className="px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300">Close</button>
                {viewing.status === 'pending' && (
                  <>
                    <button onClick={() => doApprove(viewing)} className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700">Approve</button>
                    <button onClick={() => doReject(viewing)} className="px-4 py-2 rounded bg-rose-600 text-white hover:bg-rose-700">Reject</button>
                  </>
                )}
              </div>
            </Modal>
          )}
          <RequisitionViewModal open={reqOpen} requisitionId={reqId} onClose={() => setReqOpen(false)} />
        </div>
      </div>
    </AdminLayout>
  );
}
