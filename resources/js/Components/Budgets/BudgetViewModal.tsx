import React from 'react';
import Modal from '@/Components/Modal';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import { formatCurrencyMWK } from '@/Components/format';

type Props = {
  budgetId: number | null;
  open: boolean;
  onClose: () => void;
};

export default function BudgetViewModal({ budgetId, open, onClose }: Props) {
  const page = usePage() as any;
  const auth = page?.props?.auth;
  const roles: string[] = Array.isArray(auth?.user?.roles) ? auth.user.roles : [];
  const isAdmin = roles.includes('admin') || roles.includes('super_admin');
  const isFinance = roles.some((r) => ['finance_officer','accountant','finance','accounting'].includes(r)) || roles.includes('super_admin');
  const userId = auth?.user?.id;

  const [loading, setLoading] = React.useState(false);
  const [item, setItem] = React.useState<any | null>(null);
  const [showResubmit, setShowResubmit] = React.useState(false);

  const adminForm = useForm<any>({ notes_admin: '' });
  const releaseForm = useForm<any>({ notes_release: '' });
  const resubmitForm = useForm<any>({ title: '', description: '', needed_by: '', amount: '' });

  React.useEffect(() => {
    if (!open || !budgetId) return;
    let active = true;
    setLoading(true);
    fetch(route('budgets.show', budgetId), {
      headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
    })
      .then(async (res) => {
        if (!active) return;
        const data = await res.json();
        setItem(data);
        (resubmitForm as any).setData({
          title: data?.title ?? '',
          description: data?.description ?? '',
          needed_by: data?.needed_by ? String(data.needed_by).slice(0, 10) : '',
          amount: data?.amount != null ? String(data.amount) : '',
        });
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, budgetId]);

  const isOwner = !!item && userId === item.requested_by;

  const relName = (obj: any, camel: string, snake: string): string => {
    return obj?.[camel]?.name || obj?.[snake]?.name || '';
  };
  const requestedByLabel = (obj: any): string => {
    const name = relName(obj, 'requestedBy', 'requested_by');
    if (name) return name;
    const idVal = obj?.requested_by;
    return (typeof idVal === 'number' || typeof idVal === 'string') ? `User #${String(idVal)}` : 'User';
  };

  const close = () => {
    setShowResubmit(false);
    (adminForm as any).reset();
    (releaseForm as any).reset();
    (resubmitForm as any).reset();
    onClose();
  };

  return (
    <Modal show={open} onClose={close} maxWidth="2xl">
      <div className="p-4 sm:p-6">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">{item?.title || 'Budget request'}</h2>
            {!!item && (
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span>Requested by {requestedByLabel(item)}</span>
                <span className="hidden sm:inline">•</span>
                <span>Created {item.created_at ? new Date(item.created_at).toLocaleString() : '-'}</span>
                {item.needed_by && (
                  <>
                    <span className="hidden sm:inline">•</span>
                    <span>Needed by {new Date(item.needed_by).toLocaleDateString()}</span>
                  </>
                )}
                {relName(item, 'approvedBy', 'approved_by') && (
                  <>
                    <span className="hidden sm:inline">•</span>
                    <span>Approved by {relName(item, 'approvedBy', 'approved_by')}</span>
                  </>
                )}
                {item.status === 'released' && relName(item, 'releasedBy', 'released_by') && (
                  <>
                    <span className="hidden sm:inline">•</span>
                    <span>Released by {relName(item, 'releasedBy', 'released_by')} on {item.updated_at ? new Date(item.updated_at).toLocaleString() : '-'}</span>
                  </>
                )}
              </div>
            )}
          </div>
          <button onClick={close} className="rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">Close</button>
        </div>

        {loading && <div className="py-8 text-center text-sm text-gray-500">Loading…</div>}

        {!loading && item && (
          <div className="space-y-4">
            <section className="bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-lg p-3 sm:p-4">
              <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Details</h3>
              <div className="space-y-2 text-sm text-gray-800 dark:text-gray-200">
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Description</div>
                  <div className="whitespace-pre-wrap break-words">{item.description || 'No description provided.'}</div>
                </div>
                {item.category && (
                  <div>
                    <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Category</div>
                    <div className="capitalize">{String(item.category).replace('_', ' ')}</div>
                  </div>
                )}
                {item.amount != null && (
                  <div>
                    <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Amount</div>
                    <div>{formatCurrencyMWK(item.amount)}</div>
                  </div>
                )}
              </div>
            </section>

            {(item.notes_admin || item.notes_release) && (
              <section className="bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-lg p-3 sm:p-4">
                <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Workflow notes</h3>
                {item.notes_admin && (
                  <div className="text-sm text-gray-800 dark:text-gray-200">
                    <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Admin notes</div>
                    <div className="whitespace-pre-wrap break-words">{item.notes_admin}</div>
                  </div>
                )}
                {item.notes_release && (
                  <div className="text-sm text-gray-800 dark:text-gray-200">
                    <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Release notes</div>
                    <div className="whitespace-pre-wrap break-words">{item.notes_release}</div>
                  </div>
                )}
              </section>
            )}

            <section className="bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-lg p-3 sm:p-4">
              <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3">Actions</h3>
              <div className="space-y-4">
                {isOwner && item.status === 'needs_revision' && (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setShowResubmit((v) => !v)}
                      className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700"
                    >
                      {showResubmit ? 'Cancel edit' : 'Edit & resubmit'}
                    </button>
                    {showResubmit && (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          (resubmitForm as any).post(route('budgets.resubmit', item.id), {
                            preserveScroll: true,
                            onSuccess: () => { setShowResubmit(false); close(); router.reload(); },
                          });
                        }}
                        className="mt-2 space-y-2"
                      >
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                          <input
                            type="text"
                            value={resubmitForm.data.title}
                            onChange={(e) => (resubmitForm as any).setData('title', e.target.value)}
                            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                            required
                          />
                          {(resubmitForm.errors as any)?.title && (
                            <p className="mt-1 text-xs text-red-500">{(resubmitForm.errors as any).title}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                          <textarea
                            value={resubmitForm.data.description}
                            onChange={(e) => (resubmitForm as any).setData('description', e.target.value)}
                            rows={3}
                            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                          />
                          {(resubmitForm.errors as any)?.description && (
                            <p className="mt-1 text-xs text-red-500">{(resubmitForm.errors as any).description}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Needed by</label>
                          <input
                            type="date"
                            value={resubmitForm.data.needed_by}
                            onChange={(e) => (resubmitForm as any).setData('needed_by', e.target.value)}
                            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                          />
                          {(resubmitForm.errors as any)?.needed_by && (
                            <p className="mt-1 text-xs text-red-500">{(resubmitForm.errors as any).needed_by}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
                          <input
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={resubmitForm.data.amount}
                            onChange={(e) => (resubmitForm as any).setData('amount', e.target.value)}
                            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                            required
                          />
                          {(resubmitForm.errors as any)?.amount && (
                            <p className="mt-1 text-xs text-red-500">{(resubmitForm.errors as any).amount}</p>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button type="submit" disabled={resubmitForm.processing} className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60">
                            {resubmitForm.processing ? 'Submitting…' : 'Submit for approval'}
                          </button>
                          <button type="button" onClick={() => setShowResubmit(false)} className="inline-flex items-center rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800">
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                {isAdmin && item.status === 'pending_admin' && (
                  <form onSubmit={(e) => e.preventDefault()} className="space-y-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Admin notes (optional)</label>
                      <textarea
                        value={adminForm.data.notes_admin}
                        onChange={(e) => (adminForm as any).setData('notes_admin', e.target.value)}
                        rows={3}
                        className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="Add a note for the requester (optional)"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => (adminForm as any).post(route('budgets.approve', item.id), { preserveScroll: true, onSuccess: () => { close(); router.reload(); } })}
                        disabled={adminForm.processing}
                        className="inline-flex items-center rounded-md bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                      >
                        {adminForm.processing ? 'Processing…' : 'Approve'}
                      </button>
                      <button
                        type="button"
                        onClick={() => (adminForm as any).post(route('budgets.decline', item.id), { preserveScroll: true, onSuccess: () => { close(); router.reload(); } })}
                        disabled={adminForm.processing}
                        className="inline-flex items-center rounded-md bg-rose-600 px-3 py-2 text-xs font-medium text-white hover:bg-rose-700 disabled:opacity-60"
                      >
                        {adminForm.processing ? 'Processing…' : 'Decline'}
                      </button>
                    </div>
                  </form>
                )}

                {isFinance && item.status === 'pending_release' && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      (releaseForm as any).post(route('budgets.release', item.id), {
                        preserveScroll: true,
                        onSuccess: () => { close(); router.reload(); },
                      });
                    }}
                    className="space-y-2"
                  >
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Release notes (optional)</label>
                      <textarea
                        value={releaseForm.data.notes_release}
                        onChange={(e) => (releaseForm as any).setData('notes_release', e.target.value)}
                        rows={3}
                        className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="Add a note about the release (optional)"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="submit" disabled={releaseForm.processing} className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
                        {releaseForm.processing ? 'Releasing…' : 'Mark as released'}
                      </button>
                    </div>
                  </form>
                )}

                {!isOwner && !isAdmin && !isFinance && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">No actions available for your role.</p>
                )}
              </div>
            </section>

            <div className="flex items-center justify-end gap-2">
              <Link href={route('budgets.index')} className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">Go to list</Link>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
