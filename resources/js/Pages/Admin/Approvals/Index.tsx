import React, { useEffect, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { formatCurrencyMWK, formatDateMW } from '@/Components/format';
import RequisitionViewModal from '@/Components/Requisitions/RequisitionViewModal';
import PageHeader from '@/Components/ui/page-header';
import EmptyState from '@/Components/ui/empty-state';

interface BudgetLite {
  id: number;
  fiscal_year: number;
  fiscal_month: number;
  user?: { id: number; name: string };
}

interface Props {
  budgets: { data: BudgetLite[]; meta?: any } | BudgetLite[];
  selectedTab?: 'requisitions' | 'budgets';
  requisitionsPending?: RequisitionLite[];
  requisitionsExpired?: RequisitionLite[];
  reqFilter?: 'pending' | 'expired';
}

interface RequisitionLite {
  id: number;
  title: string;
  amount?: number | string | null;
  status: 'pending_admin' | 'needs_revision' | 'pending_disbursement' | 'pending_funding' | 'disbursed' | 'expired';
  requested_by?: number;
  requestedBy?: { id: number; name: string } | null;
  created_at?: string;
  needed_by?: string | null;
}

export default function AdminApprovalsIndex({ budgets, selectedTab = 'requisitions', requisitionsPending = [], requisitionsExpired = [], reqFilter = 'pending' }: Props) {
  const [tab, setTab] = useState<'requisitions' | 'budgets'>(selectedTab);
  const [reqOpen, setReqOpen] = useState(false);
  const [reqId, setReqId] = useState<number | null>(null);

  useEffect(() => {
    if (tab !== selectedTab) {
      router.get(route('admin.approvals.index'), { tab }, { preserveState: true, replace: true });
    }
  }, [tab, selectedTab]);

  useEffect(() => {
    setTab(selectedTab);
  }, [selectedTab]);

  const approveReq = (r: RequisitionLite) => {
    if (!confirm('Approve this requisition?')) return;
    router.post(route('requisitions.approve', r.id), {}, { preserveScroll: true });
  };

  const declineReq = (r: RequisitionLite) => {
    const reason = prompt('Reason (optional)') || '';
    if (!confirm('Decline this requisition?')) return;
    router.post(route('requisitions.decline', r.id), { notes_admin: reason }, { preserveScroll: true });
  };

  const requestedByLabel = (r: RequisitionLite) => {
    return r.requestedBy?.name
      ?? (typeof (r as any).requested_by === 'object'
        ? ((r as any).requested_by?.name ?? '-')
        : ((r as any).requested_by ? `User #${(r as any).requested_by}` : '-'));
  };

  const reqStatusColors: Record<string, string> = {
    pending_admin: 'px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-200 border border-yellow-500/30',
    needs_revision: 'px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-300 border border-red-500/30',
    pending_disbursement: 'px-2 py-1 rounded text-xs font-medium bg-coin-100 text-coin-800 dark:bg-coin-900/30 dark:text-coin-200 border border-coin-500/30',
    pending_funding: 'px-2 py-1 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200 border border-amber-500/30',
    disbursed: 'px-2 py-1 rounded text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200 border border-emerald-500/30',
    expired: 'px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700/40 dark:text-gray-300 border border-gray-300 dark:border-gray-600',
  };

  const reqs = reqFilter === 'expired' ? (requisitionsExpired || []) : (requisitionsPending || []);

  const budgetsArr: BudgetLite[] = Array.isArray(budgets) ? budgets : (budgets?.data || []);

  return (
    <AdminLayout title="Approvals">
      <Head title="Approvals" />
      <div className="py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <PageHeader
            title="Approvals"
            description="Review requisitions and budgets awaiting action."
            actions={(
              <div className="inline-flex w-full sm:w-auto rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
                <button
                  onClick={() => setTab('requisitions')}
                  className={`flex-1 sm:flex-none px-4 py-2 text-xs sm:text-sm ${tab === 'requisitions'
                    ? 'bg-coin-700 text-white hover:bg-coin-600'
                    : 'bg-white text-gray-700 hover:bg-coin-50 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-gray-900'} focus:outline-none focus:ring-2 focus:ring-coin-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950`}
                >
                  Requisitions
                </button>
                <button
                  onClick={() => setTab('budgets')}
                  className={`flex-1 sm:flex-none px-4 py-2 text-xs sm:text-sm ${tab === 'budgets'
                    ? 'bg-coin-700 text-white hover:bg-coin-600'
                    : 'bg-white text-gray-700 hover:bg-coin-50 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-gray-900'} focus:outline-none focus:ring-2 focus:ring-coin-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950`}
                >
                  Budgets
                </button>
              </div>
            )}
          />

          {tab === 'requisitions' && (
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm shadow-black/5 overflow-hidden dark:border-gray-800 dark:bg-gray-900/60 dark:shadow-none">
              <div className="px-4 py-3 border-b dark:border-gray-800 flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Requisitions awaiting admin</div>
                <div className="inline-flex rounded-full bg-gray-100 dark:bg-gray-800/60 p-1">
                  <button
                    onClick={() => router.get(route('admin.approvals.index'), { tab: 'requisitions', req_filter: 'pending' }, { preserveState: true, replace: true })}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium ${reqFilter === 'pending' ? 'bg-coin-700 text-white' : 'text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700/60'} focus:outline-none focus:ring-2 focus:ring-coin-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950`}
                  >
                    Pending
                  </button>
                  <button
                    onClick={() => router.get(route('admin.approvals.index'), { tab: 'requisitions', req_filter: 'expired' }, { preserveState: true, replace: true })}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium ${reqFilter === 'expired' ? 'bg-gray-700 text-white dark:bg-gray-600' : 'text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700/60'} focus:outline-none focus:ring-2 focus:ring-coin-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950`}
                  >
                    Expired
                  </button>
                </div>
              </div>
              {reqs.length === 0 ? (
                <EmptyState
                  title={reqFilter === 'expired' ? 'No expired requisitions' : 'No pending requisitions'}
                  description={reqFilter === 'expired'
                    ? 'You have no expired requisitions to review right now.'
                    : 'When requisitions need admin approval, they will show up here.'}
                />
              ) : (
                <>
                  <div className="lg:hidden divide-y divide-gray-200 dark:divide-gray-800">
                    {reqs.map((r) => (
                      <div key={r.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/60">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-medium text-gray-900 dark:text-gray-100 break-words">{r.title}</div>
                            <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">#{r.id}</div>
                          </div>
                          <span className={reqStatusColors[String(r.status)] || ''}>{String(r.status).replace('_', ' ')}</span>
                        </div>

                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Amount</div>
                            <div className="font-semibold text-gray-900 dark:text-gray-100">{r.amount != null ? formatCurrencyMWK(r.amount) : '-'}</div>
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs text-gray-500 dark:text-gray-400">Requested By</div>
                            <div className="text-gray-700 dark:text-gray-200 break-words">{requestedByLabel(r)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Requested</div>
                            <div className="text-gray-700 dark:text-gray-200">{r.created_at ? formatDateMW(undefined, r.created_at) : '-'}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Needed By</div>
                            <div className="text-gray-700 dark:text-gray-200">{r.needed_by ? formatDateMW(undefined, r.needed_by) : '-'}</div>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={() => { setReqId(r.id); setReqOpen(true); }}
                            className="w-full rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-coin-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950"
                          >
                            View Details
                          </button>

                          {reqFilter === 'pending' && (
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => approveReq(r)}
                                className="w-full rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-coin-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => declineReq(r)}
                                className="w-full rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-coin-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950"
                              >
                                Decline
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="hidden lg:block overflow-x-auto">
                    <table className="min-w-[900px] w-full">
                      <thead className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-800">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase dark:text-gray-300">Requisition</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase dark:text-gray-300">Amount</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase dark:text-gray-300">Requested By</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase dark:text-gray-300">Requested</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase dark:text-gray-300">Needed By</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase dark:text-gray-300">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase dark:text-gray-300">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                        {reqs.map((r) => (
                          <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                            <td className="px-6 py-3 text-sm text-gray-900 dark:text-gray-100">
                              <div className="flex flex-col">
                                <span className="font-medium">{r.title}</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">#{r.id}</span>
                              </div>
                            </td>
                            <td className="px-6 py-3 text-sm text-gray-900 dark:text-gray-100">{r.amount != null ? formatCurrencyMWK(r.amount) : '-'}</td>
                            <td className="px-6 py-3 text-sm text-gray-700 dark:text-gray-300">{requestedByLabel(r)}</td>
                            <td className="px-6 py-3 text-sm text-gray-700 dark:text-gray-300">{r.created_at ? formatDateMW(undefined, r.created_at) : '-'}</td>
                            <td className="px-6 py-3 text-sm text-gray-700 dark:text-gray-300">{r.needed_by ? formatDateMW(undefined, r.needed_by) : '-'}</td>
                            <td className="px-6 py-3 text-sm">
                              <span className={reqStatusColors[String(r.status)] || ''}>{String(r.status).replace('_', ' ')}</span>
                            </td>
                            <td className="px-6 py-3 text-sm">
                              <div className="flex flex-wrap items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => { setReqId(r.id); setReqOpen(true); }}
                                  className="text-coin-700 hover:text-coin-800 dark:text-coin-300 dark:hover:text-coin-200 focus:outline-none focus:ring-2 focus:ring-coin-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950 rounded-md px-2 py-1 -ml-2"
                                >
                                  View
                                </button>
                                {reqFilter === 'pending' && (
                                  <>
                                    <button onClick={() => approveReq(r)} className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 focus:outline-none focus:ring-2 focus:ring-coin-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950 rounded-md px-2 py-1">Approve</button>
                                    <button onClick={() => declineReq(r)} className="text-rose-600 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-300 focus:outline-none focus:ring-2 focus:ring-coin-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950 rounded-md px-2 py-1">Decline</button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {tab === 'budgets' && (
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm shadow-black/5 overflow-hidden dark:border-gray-800 dark:bg-gray-900/60 dark:shadow-none">
              {budgetsArr.length === 0 ? (
                <EmptyState
                  title="No budgets found"
                  description="Budgets will appear here when they are available."
                />
              ) : (
                <>
                  <div className="sm:hidden divide-y divide-gray-200 dark:divide-gray-800">
                    {budgetsArr.map((b) => (
                      <div key={b.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/60">
                        <div className="text-xs text-gray-500 dark:text-gray-400">Period</div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{String(b.fiscal_month).padStart(2, '0')}/{b.fiscal_year}</div>
                        <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">Owner</div>
                        <div className="text-sm text-gray-700 dark:text-gray-200 break-words">{b.user?.name ?? '-'}</div>
                      </div>
                    ))}
                  </div>

                  <div className="hidden sm:block overflow-x-auto">
                    <table className="min-w-full w-full">
                      <thead className="bg-gray-50 dark:bg-gray-800/60">
                        <tr>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase dark:text-gray-300">Period</th>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase dark:text-gray-300">Owner</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                        {budgetsArr.map((b) => (
                          <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                            <td className="px-4 sm:px-6 py-3 text-sm text-gray-900 dark:text-gray-100">{String(b.fiscal_month).padStart(2, '0')}/{b.fiscal_year}</td>
                            <td className="px-4 sm:px-6 py-3 text-sm text-gray-700 dark:text-gray-200">{b.user?.name ?? '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          <RequisitionViewModal open={reqOpen} requisitionId={reqId} onClose={() => setReqOpen(false)} />
        </div>
      </div>
    </AdminLayout>
  );
}
