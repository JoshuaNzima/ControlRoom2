import React from 'react';
import Modal from '@/Components/Modal';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import { formatCurrencyMWK } from '@/Components/format';
import IconMapper from '@/Components/IconMapper';

type Props = {
  requisitionId: number | null;
  open: boolean;
  onClose: () => void;
  initialEdit?: boolean;
};

export default function RequisitionViewModal({ requisitionId, open, onClose, initialEdit }: Props) {
  const page = usePage() as any;
  const auth = page?.props?.auth;
  const roles: string[] = Array.isArray(auth?.user?.roles) ? auth.user.roles : [];
  const isAdmin = roles.includes('admin') || roles.includes('super_admin');
  const isAssetManager = roles.includes('asset_manager') || roles.includes('assets_manager');
  const userId = auth?.user?.id;

  const [loading, setLoading] = React.useState(false);
  const [req, setReq] = React.useState<any | null>(null);
  const [showResubmit, setShowResubmit] = React.useState(false);
  const [showEdit, setShowEdit] = React.useState(false);

  const adminForm = useForm<any>({ notes_admin: '' });
  const disburseForm = useForm<any>({ notes_disbursement: '' });
  const resubmitForm = useForm<any>({ title: '', description: '', needed_by: '', amount: '' });
  const editForm = useForm<any>({ title: '', description: '', needed_by: '', amount: '', category: 'general' });
  const attachForm = useForm<any>({ attachments: [] as any });

  React.useEffect(() => {
    if (!open || !requisitionId) return;
    let active = true;
    setLoading(true);
    fetch(route('requisitions.show', requisitionId), {
      headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
    })
      .then(async (res) => {
        if (!active) return;
        const data = await res.json();
        setReq(data);
        (resubmitForm as any).setData({
          title: data?.title ?? '',
          description: data?.description ?? '',
          needed_by: data?.needed_by ? String(data.needed_by).slice(0, 10) : '',
          amount: data?.amount != null ? String(data.amount) : '',
        });
        (editForm as any).setData({
          title: data?.title ?? '',
          description: data?.description ?? '',
          needed_by: data?.needed_by ? String(data.needed_by).slice(0, 10) : '',
          amount: data?.amount != null ? String(data.amount) : '',
          category: data?.category ?? 'general',
        });
        if (initialEdit && userId && data?.requested_by === userId && data?.status === 'pending_admin') {
          setShowEdit(true);
        }
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, requisitionId, initialEdit]);

  const requestedByCandidate = (req: any) => {
    const snake = (req?.requested_by && typeof req?.requested_by === 'object') ? req?.requested_by?.id : req?.requested_by;
    const camel = req?.requestedBy?.id;
    return snake ?? camel ?? '';
  };
  const isOwner = !!req && String(userId) === String(requestedByCandidate(req));
  const statusIs = (s: string) => String(s || '').toLowerCase();

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
    setShowEdit(false);
    (adminForm as any).reset();
    (disburseForm as any).reset();
    (resubmitForm as any).reset();
    (editForm as any).reset();
    (attachForm as any).reset();
    onClose();
  };

  return (
    <Modal show={open} onClose={close} maxWidth="2xl">
      <div className="p-4 sm:p-6">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">{req?.title || 'Requisition'}</h2>
            {!!req && (
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span>Requested by {requestedByLabel(req)}</span>
                <span className="hidden sm:inline">•</span>
                <span>Created {req.created_at ? new Date(req.created_at).toLocaleString() : '-'}</span>
                {req.needed_by && (
                  <>
                    <span className="hidden sm:inline">•</span>
                    <span>Needed by {new Date(req.needed_by).toLocaleDateString()}</span>
                  </>
                )}
                {relName(req, 'approvedBy', 'approved_by') && (
                  <>
                    <span className="hidden sm:inline">•</span>
                    <span>Approved by {relName(req, 'approvedBy', 'approved_by')}</span>
                  </>
                )}
                {req.status === 'disbursed' && relName(req, 'disbursedBy', 'disbursed_by') && (
                  <>
                    <span className="hidden sm:inline">•</span>
                    <span>Disbursed by {relName(req, 'disbursedBy', 'disbursed_by')} on {req.updated_at ? new Date(req.updated_at).toLocaleString() : '-'}</span>
                  </>
                )}
              </div>
            )}
          </div>
          <button onClick={close} className="rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">Close</button>
        </div>

        {loading && <div className="py-8 text-center text-sm text-gray-500">Loading…</div>}

        {!loading && req && (
          <div className="space-y-4">
            <section className="bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-lg p-3 sm:p-4">
              <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Details</h3>
              <div className="space-y-2 text-sm text-gray-800 dark:text-gray-200">
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Description</div>
                  <div className="whitespace-pre-wrap break-words">{req.description || 'No description provided.'}</div>
                </div>
                {req.category && (
                  <div>
                    <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Category</div>
                    <div className="capitalize">{String(req.category).replace('_', ' ')}</div>
                  </div>
                )}
                {req.amount != null && (
                  <div>
                    <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Amount</div>
                    <div>{formatCurrencyMWK(req.amount)}</div>
                  </div>
                )}
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Attachments</div>
                  {Array.isArray((req as any)?.attachments) && (req as any).attachments.length > 0 ? (
                    <ul className="mt-1 space-y-1">
                      {(req as any).attachments.map((a: any) => (
                        <li key={a.id} className="flex items-center justify-between gap-2">
                          <div className="min-w-0 text-xs text-gray-700 dark:text-gray-300 truncate">{a.original_name}</div>
                          <a
                            href={route('requisitions.attachments.download', [req.id, a.id])}
                            className="inline-flex items-center rounded-md border border-gray-300 dark:border-gray-700 px-2 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
                          >
                            Download
                          </a>
                          {isOwner && statusIs(req.status) === 'pending_admin' && (
                            <button
                              type="button"
                              onClick={() => {
                                router.delete(route('requisitions.attachments.destroy', [req.id, a.id]), {
                                  preserveScroll: true,
                                  onSuccess: () => router.reload(),
                                });
                              }}
                              className="inline-flex items-center rounded-md border border-gray-300 dark:border-gray-700 px-2 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
                            >
                              Delete
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-xs text-gray-500 dark:text-gray-400">No attachments</div>
                  )}
                  {isOwner && statusIs(req.status) === 'pending_admin' && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        (attachForm as any).post(route('requisitions.attachments.store', req.id), {
                          preserveScroll: true,
                          forceFormData: true,
                          onSuccess: () => { (attachForm as any).reset(); router.reload(); },
                        });
                      }}
                      className="mt-2 flex flex-col sm:flex-row items-start sm:items-center gap-2"
                    >
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                        onChange={(e) => (attachForm as any).setData('attachments', Array.from(e.target.files || []))}
                        className="block w-full text-xs text-gray-700 dark:text-gray-300 file:mr-2 file:py-1.5 file:px-2 file:rounded-md file:border file:border-gray-300 dark:file:border-gray-700 file:text-xs file:font-medium file:bg-white dark:file:bg-gray-900 file:text-gray-700 dark:file:text-gray-200"
                      />
                      <button
                        type="submit"
                        disabled={(attachForm as any).processing}
                        className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
                      >
                        {(attachForm as any).processing ? 'Uploading…' : 'Upload'}
                      </button>
                    </form>
                  )}
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Batch</div>
                  {req.batch ? (
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide border ${
                        req.batch.status === 'acknowledged'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-200 dark:border-emerald-500/40'
                          : 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/20 dark:text-amber-200 dark:border-amber-500/40'
                      }`}
                    >
                      {req.batch.status === 'acknowledged' ? (
                        <>
                          <IconMapper name="check-circle" className="h-3 w-3 mr-1" /> Acknowledged
                        </>
                      ) : (
                        <>Pending ack</>
                      )}
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide border bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800/60 dark:text-gray-300 dark:border-gray-700">
                      No batch
                    </span>
                  )}
                </div>
              </div>
            </section>

            {(req.notes_admin || req.notes_disbursement) && (
              <section className="bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-lg p-3 sm:p-4">
                <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Workflow notes</h3>
                {req.notes_admin && (
                  <div className="text-sm text-gray-800 dark:text-gray-200">
                    <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Admin notes</div>
                    <div className="whitespace-pre-wrap break-words">{req.notes_admin}</div>
                  </div>
                )}
                {req.notes_disbursement && (
                  <div className="text-sm text-gray-800 dark:text-gray-200">
                    <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Disbursement notes</div>
                    <div className="whitespace-pre-wrap break-words">{req.notes_disbursement}</div>
                  </div>
                )}
              </section>
            )}

            <section className="bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-lg p-3 sm:p-4">
              <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3">Actions</h3>
              <div className="space-y-4">
                {isOwner && statusIs(req.status) === 'needs_revision' && (
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
                          (resubmitForm as any).post(route('requisitions.resubmit', req.id), {
                            preserveScroll: true,
                            onSuccess: () => {
                              setShowResubmit(false);
                              close();
                              router.reload();
                            },
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

                {isOwner && statusIs(req.status) === 'pending_admin' && (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setShowEdit((v) => !v)}
                        className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700"
                      >
                        {showEdit ? 'Cancel edit' : 'Edit'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!req) return;
                          if (window.confirm('Delete this requisition? This cannot be undone.')) {
                            router.delete(route('requisitions.destroy', req.id), {
                              preserveScroll: true,
                              onSuccess: () => { close(); router.reload(); },
                            });
                          }
                        }}
                        className="inline-flex items-center rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
                      >
                        Delete
                      </button>
                    </div>
                    {showEdit && (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          (editForm as any).put(route('requisitions.update', req.id), {
                            preserveScroll: true,
                            onSuccess: () => { setShowEdit(false); close(); router.reload(); },
                          });
                        }}
                        className="mt-2 space-y-2"
                      >
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                          <select
                            value={editForm.data.category}
                            onChange={(e) => (editForm as any).setData('category', e.target.value)}
                            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                          >
                            <option value="general">General</option>
                            <option value="fuel">Fuel</option>
                            <option value="airtime">Airtime</option>
                            <option value="vehicle_hire">Vehicle hire</option>
                            <option value="events">Events</option>
                            <option value="k9">K9</option>
                            <option value="utilities">Utilities</option>
                            <option value="office_supplies">Office supplies</option>
                            <option value="allowance">Allowance</option>

                          </select>
                          {(editForm.errors as any)?.category && (
                            <p className="mt-1 text-xs text-red-500">{(editForm.errors as any).category}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                          <input
                            type="text"
                            value={editForm.data.title}
                            onChange={(e) => (editForm as any).setData('title', e.target.value)}
                            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                            required
                          />
                          {(editForm.errors as any)?.title && (
                            <p className="mt-1 text-xs text-red-500">{(editForm.errors as any).title}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                          <textarea
                            value={editForm.data.description}
                            onChange={(e) => (editForm as any).setData('description', e.target.value)}
                            rows={3}
                            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                          />
                          {(editForm.errors as any)?.description && (
                            <p className="mt-1 text-xs text-red-500">{(editForm.errors as any).description}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Needed by</label>
                          <input
                            type="date"
                            value={editForm.data.needed_by}
                            onChange={(e) => (editForm as any).setData('needed_by', e.target.value)}
                            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                          />
                          {(editForm.errors as any)?.needed_by && (
                            <p className="mt-1 text-xs text-red-500">{(editForm.errors as any).needed_by}</p>
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
                            value={editForm.data.amount}
                            onChange={(e) => (editForm as any).setData('amount', e.target.value)}
                            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                            required
                          />
                          {(editForm.errors as any)?.amount && (
                            <p className="mt-1 text-xs text-red-500">{(editForm.errors as any).amount}</p>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button type="submit" disabled={editForm.processing} className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60">
                            {editForm.processing ? 'Saving…' : 'Save changes'}
                          </button>
                          <button type="button" onClick={() => setShowEdit(false)} className="inline-flex items-center rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800">
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                {isAdmin && statusIs(req.status) === 'pending_admin' && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                    }}
                    className="space-y-2"
                  >
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Admin notes (optional)</label>
                      <textarea
                        value={adminForm.data.notes_admin}
                        onChange={(e) => (adminForm as any).setData('notes_admin', e.target.value)}
                        rows={3}
                        className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="Add a note for the requester (optional)"
                      />
                      {(adminForm.errors as any)?.notes_admin && (
                        <p className="mt-1 text-xs text-red-500">{(adminForm.errors as any).notes_admin}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          (adminForm as any).post(route('requisitions.approve', req.id), {
                            preserveScroll: true,
                            onSuccess: () => { close(); router.reload(); },
                          })
                        }
                        disabled={adminForm.processing}
                        className="inline-flex items-center rounded-md bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                      >
                        {adminForm.processing ? 'Processing…' : 'Approve'}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          (adminForm as any).post(route('requisitions.decline', req.id), {
                            preserveScroll: true,
                            onSuccess: () => { close(); router.reload(); },
                          })
                        }
                        disabled={adminForm.processing}
                        className="inline-flex items-center rounded-md bg-rose-600 px-3 py-2 text-xs font-medium text-white hover:bg-rose-700 disabled:opacity-60"
                      >
                        {adminForm.processing ? 'Processing…' : 'Decline'}
                      </button>
                    </div>
                  </form>
                )}

                {isAssetManager && statusIs(req.status) === 'pending_disbursement' && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      (disburseForm as any).post(route('requisitions.disburse', req.id), {
                        preserveScroll: true,
                        onSuccess: () => { close(); router.reload(); },
                      });
                    }}
                    className="space-y-2"
                  >
                    {(!req?.batch || req?.batch?.status !== 'acknowledged') && (
                      <div className="text-xs text-amber-600 dark:text-amber-300">
                        Waiting for admin acknowledgement of today's batch before disbursement.
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Disbursement notes (optional)</label>
                      <textarea
                        value={disburseForm.data.notes_disbursement}
                        onChange={(e) => (disburseForm as any).setData('notes_disbursement', e.target.value)}
                        rows={3}
                        className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="Add a note about what was disbursed (optional)"
                      />
                      {(disburseForm.errors as any)?.notes_disbursement && (
                        <p className="mt-1 text-xs text-red-500">{(disburseForm.errors as any).notes_disbursement}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="submit"
                        disabled={disburseForm.processing || !req?.batch || req?.batch?.status !== 'acknowledged'}
                        className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                      >
                        {disburseForm.processing ? 'Marking…' : 'Mark as disbursed'}
                      </button>
                    </div>
                  </form>
                )}

                {!isOwner && !isAdmin && !isAssetManager && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">No actions available for your role.</p>
                )}
              </div>
            </section>

            <div className="flex items-center justify-end gap-2">
              <Link href={route('requisitions.index')} className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">Go to list</Link>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
