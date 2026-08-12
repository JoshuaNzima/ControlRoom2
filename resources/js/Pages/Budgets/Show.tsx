import React from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import RequisitionsLayout from '@/Layouts/RequisitionsLayout';
import { formatCurrencyMWK } from '@/Components/format';

type UserLite = { id: number; name: string };

type BudgetShowProps = {
  budget: {
    id: number;
    title: string;
    description?: string | null;
    category?: string | null;
    status: 'pending_admin' | 'needs_revision' | 'pending_release' | 'released';
    needed_by?: string | null;
    amount?: number | string | null;
    created_at: string;
    updated_at: string;
    requested_by: number;
    requestedBy?: UserLite | null;
    approvedBy?: UserLite | null;
    releasedBy?: UserLite | null;
  };
  auth: { user: { id: number; roles?: string[] } };
};

export default function BudgetShow({ budget, auth }: BudgetShowProps) {
  const roles = (auth?.user?.roles ?? []) as string[];
  const isAdmin = roles.includes('admin') || roles.includes('super_admin');
  const isFinance = roles.some((r) => ['finance_officer','accountant','finance','accounting'].includes(r)) || roles.includes('super_admin');
  const isOwner = auth?.user?.id === budget.requested_by;

  const adminForm = useForm<any>({ notes_admin: '' });
  const releaseForm = useForm<any>({ notes_release: '' });
  const resubmitForm = useForm<any>({
    title: budget?.title ?? '',
    description: budget?.description ?? '',
    needed_by: budget?.needed_by ? String(budget.needed_by).slice(0, 10) : '',
    amount: budget?.amount != null ? String(budget.amount) : '',
  });

  const relName = (obj: any, camel: string, snake: string) => obj?.[camel]?.name || (typeof obj?.[snake] === 'object' ? obj?.[snake]?.name : '') || '';

  return (
    <RequisitionsLayout title={`Budget • ${budget.title}`}> 
      <Head title={`Budget • ${budget.title}`} />
      <div className="py-4 sm:py-6">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="bg-gray-900/70 border border-gray-700/70 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-800/80 flex items-center justify-between">
              <h1 className="text-lg font-semibold text-gray-100">{budget.title}</h1>
              <Link href={route('budgets.index')} className="text-xs text-gray-400 hover:text-gray-200">Back to list</Link>
            </div>

            <div className="p-4 space-y-4">
              <section className="space-y-2">
                <div className="text-sm text-gray-300 whitespace-pre-wrap">{budget.description || 'No description provided.'}</div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                  <span>Created {new Date(budget.created_at).toLocaleString()}</span>
                  {budget.needed_by && (
                    <>
                      <span>•</span>
                      <span>Needed by {new Date(budget.needed_by).toLocaleDateString()}</span>
                    </>
                  )}
                  {budget.category && (
                    <>
                      <span>•</span>
                      <span className="capitalize">Category: {String(budget.category).replace('_', ' ')}</span>
                    </>
                  )}
                  {budget.amount != null && (
                    <>
                      <span>•</span>
                      <span>Amount {formatCurrencyMWK(budget.amount)}</span>
                    </>
                  )}
                </div>
              </section>

              <section className="space-y-1 text-xs text-gray-400">
                <div>Requested by {relName(budget as any, 'requestedBy', 'requested_by') || `User #${budget.requested_by}`}</div>
                {relName(budget as any, 'approvedBy', 'approved_by') && (
                  <div>Approved by {relName(budget as any, 'approvedBy', 'approved_by')}</div>
                )}
                {budget.status === 'released' && relName(budget as any, 'releasedBy', 'released_by') && (
                  <div>Released by {relName(budget as any, 'releasedBy', 'released_by')} on {new Date(budget.updated_at).toLocaleString()}</div>
                )}
              </section>

              <section className="mt-2 border-t border-gray-800/80 pt-3">
                <h3 className="text-xs font-semibold text-gray-300 mb-2">Actions</h3>
                <div className="space-y-4">
                  {isOwner && budget.status === 'needs_revision' && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        (resubmitForm as any).post(route('budgets.resubmit', budget.id), {
                          preserveScroll: true,
                          onSuccess: () => router.visit(route('budgets.index')),
                        });
                      }}
                      className="space-y-2"
                    >
                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">Title</label>
                        <input
                          type="text"
                          value={resubmitForm.data.title}
                          onChange={(e) => (resubmitForm as any).setData('title', e.target.value)}
                          className="w-full rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">Description</label>
                        <textarea
                          value={resubmitForm.data.description}
                          onChange={(e) => (resubmitForm as any).setData('description', e.target.value)}
                          rows={3}
                          className="w-full rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-300 mb-1">Needed by</label>
                          <input
                            type="date"
                            value={resubmitForm.data.needed_by}
                            onChange={(e) => (resubmitForm as any).setData('needed_by', e.target.value)}
                            className="w-full rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-300 mb-1">Amount</label>
                          <input
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={resubmitForm.data.amount}
                            onChange={(e) => (resubmitForm as any).setData('amount', e.target.value)}
                            className="w-full rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                            required
                          />
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button type="submit" className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700">Submit for approval</button>
                        <Link href={route('budgets.index')} className="inline-flex items-center rounded-md border border-gray-700 px-3 py-2 text-xs font-medium text-gray-200 hover:bg-gray-800">Cancel</Link>
                      </div>
                    </form>
                  )}

                  {isAdmin && budget.status === 'pending_admin' && (
                    <form onSubmit={(e) => e.preventDefault()} className="space-y-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">Admin notes (optional)</label>
                        <textarea
                          value={adminForm.data.notes_admin}
                          onChange={(e) => (adminForm as any).setData('notes_admin', e.target.value)}
                          rows={3}
                          className="w-full rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                          placeholder="Add a note for the requester (optional)"
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => (adminForm as any).post(route('budgets.approve', budget.id), { preserveScroll: true, onSuccess: () => router.visit(route('budgets.index')) })} className="inline-flex items-center rounded-md bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-700">Approve</button>
                        <button type="button" onClick={() => (adminForm as any).post(route('budgets.decline', budget.id), { preserveScroll: true, onSuccess: () => router.visit(route('budgets.index')) })} className="inline-flex items-center rounded-md bg-rose-600 px-3 py-2 text-xs font-medium text-white hover:bg-rose-700">Decline</button>
                      </div>
                    </form>
                  )}

                  {isFinance && budget.status === 'pending_release' && (
                    <form onSubmit={(e) => { e.preventDefault(); (releaseForm as any).post(route('budgets.release', budget.id), { preserveScroll: true, onSuccess: () => router.visit(route('budgets.index')) }); }} className="space-y-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">Release notes (optional)</label>
                        <textarea
                          value={releaseForm.data.notes_release}
                          onChange={(e) => (releaseForm as any).setData('notes_release', e.target.value)}
                          rows={3}
                          className="w-full rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                          placeholder="Add a note about the release (optional)"
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button type="submit" className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-700">Mark as released</button>
                      </div>
                    </form>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </RequisitionsLayout>
  );
}
