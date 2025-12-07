import React, { useEffect, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import Modal from '@/Components/Modal';

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
}

export default function AdminApprovalsIndex({ approvals = [], budgets, selectedTab = 'requisitions' }: Props) {
  const [tab, setTab] = useState<'requisitions' | 'budgets'>(selectedTab);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewing, setViewing] = useState<Approval | null>(null);
  const [loadingId, setLoadingId] = useState<number | null>(null);

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
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Requisition</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Stage</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Approver</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {approvals.length > 0 ? approvals.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm text-gray-900">{a.expense?.description || `Expense #${a.expense?.id ?? '-'}`}</td>
                      <td className="px-6 py-3 text-sm text-gray-900">{a.expense?.amount ?? '-'}</td>
                      <td className="px-6 py-3 text-sm text-gray-700">{a.stage ?? '-'}</td>
                      <td className="px-6 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          a.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : a.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-700">{a.approver?.name ?? '-'}</td>
                      <td className="px-6 py-3 text-sm">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => openView(a.id)}
                            className="text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                            disabled={loadingId === a.id}
                          >
                            {loadingId === a.id ? 'Opening…' : 'View'}
                          </button>
                          {a.status === 'pending' && (
                            <>
                              <button onClick={() => doApprove(a)} className="text-emerald-600 hover:text-emerald-800">Approve</button>
                              <button onClick={() => doReject(a)} className="text-rose-600 hover:text-rose-800">Reject</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No approvals pending.</td>
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
        </div>
      </div>
    </AdminLayout>
  );
}
