import React from 'react';
import Modal from '@/Components/Modal';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import { formatCurrencyMWK } from '@/Components/format';
import IconMapper from '@/Components/IconMapper';
import { CheckCircle, XCircle, DollarSign, Loader2 } from 'lucide-react';

type RequisitionItem = {
  id: number;
  description: string;
  category: string;
  quantity: number;
  unit_price: number | null;
  amount: number;
  status: 'pending' | 'approved' | 'declined' | 'funded' | 'disbursed';
  approved_by?: number | null;
  approved_at?: string | null;
  disbursed_by?: number | null;
  disbursed_at?: string | null;
  notes_admin?: string | null;
  notes_disbursement?: string | null;
  approvedBy?: { id: number; name: string } | null;
  disbursedBy?: { id: number; name: string } | null;
};

type Props = {
  requisitionId: number | null;
  open: boolean;
  onClose: () => void;
  initialEdit?: boolean;
};

export default function RequisitionViewModal({ requisitionId, open, onClose, initialEdit }: Props) {
  const page = usePage() as any;
  const auth = page?.props?.auth;
  const rawRoles = (auth?.user?.roles ?? []) as (string | { id: number; name: string })[];
  const roles = rawRoles.map((r) => (typeof r === 'string' ? r : r.name));
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
  const [processingItems, setProcessingItems] = React.useState<Record<number, boolean>>({});

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
        if (initialEdit && userId && data?.requested_by === userId) {
          if (data?.status === 'pending_admin') {
            setShowEdit(true);
          }
          if (data?.status === 'needs_revision') {
            setShowResubmit(true);
          }
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
    setProcessingItems({});
    onClose();
  };

  const handleItemAction = async (itemId: number, action: 'approve' | 'decline' | 'disburse', notes?: string) => {
    if (!req) return;
    setProcessingItems(prev => ({ ...prev, [itemId]: true }));

    try {
      const response = await fetch(route(`requisitions.items.${action}`, [req.id, itemId]), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
        },
        body: JSON.stringify({ [`notes_${action === 'disburse' ? 'disbursement' : 'admin'}`]: notes }),
      });

      if (response.ok) {
        // Refresh requisition data
        const refreshed = await fetch(route('requisitions.show', req.id), {
          headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        }).then(r => r.json());
        setReq(refreshed);
        router.reload();
      }
    } catch (error) {
      console.error('Item action failed:', error);
    } finally {
      setProcessingItems(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const getItemStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-300 dark:border-yellow-500/40';
      case 'approved':
      case 'funded':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40';
      case 'declined':
        return 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40';
      case 'disbursed':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/40';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700/40 dark:text-gray-300 dark:border-gray-600';
    }
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

            {/* Inline Items Section */}
            {Array.isArray(req?.items) && req.items.length > 0 && (
              <section className="bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-lg p-3 sm:p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300">Line Items ({req.items.length})</h3>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Total: {formatCurrencyMWK(req.items.reduce((sum: number, item: RequisitionItem) => sum + (Number(item.amount) || 0), 0))}
                  </span>
                </div>
                <div className="space-y-2">
                  {req.items.map((item: RequisitionItem) => (
                    <div
                      key={item.id}
                      className="rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {item.description}
                            </p>
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide border ${getItemStatusColor(item.status)}`}
                            >
                              {item.status}
                            </span>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                            <span className="capitalize">{item.category.replace('_', ' ')}</span>
                            <span>•</span>
                            <span>Qty: {item.quantity}</span>
                            {item.unit_price != null && (
                              <>
                                <span>•</span>
                                <span>Unit: {formatCurrencyMWK(item.unit_price)}</span>
                              </>
                            )}
                            <span>•</span>
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                              {formatCurrencyMWK(item.amount)}
                            </span>
                          </div>
                          {(item.notes_admin || item.notes_disbursement) && (
                            <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1">
                              {item.notes_admin && (
                                <p><span className="font-medium">Admin note:</span> {item.notes_admin}</p>
                              )}
                              {item.notes_disbursement && (
                                <p><span className="font-medium">Disbursement note:</span> {item.notes_disbursement}</p>
                              )}
                            </div>
                          )}
                          {(item.approvedBy || item.disbursedBy) && (
                            <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-500">
                              {item.approvedBy && (
                                <span>Approved by {item.approvedBy.name}</span>
                              )}
                              {item.approvedBy && item.disbursedBy && <span> • </span>}
                              {item.disbursedBy && (
                                <span>Disbursed by {item.disbursedBy.name}</span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Item Actions */}
                        <div className="flex flex-col items-end gap-1">
                          {/* Admin Actions */}
                          {isAdmin && item.status === 'pending' && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleItemAction(item.id, 'approve')}
                                disabled={processingItems[item.id]}
                                className="inline-flex items-center rounded-md bg-emerald-600/10 p-1.5 text-emerald-600 hover:bg-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 disabled:opacity-60"
                                title="Approve item"
                              >
                                {processingItems[item.id] ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-3.5 w-3.5" />
                                )}
                              </button>
                              <button
                                onClick={() => handleItemAction(item.id, 'decline')}
                                disabled={processingItems[item.id]}
                                className="inline-flex items-center rounded-md bg-rose-600/10 p-1.5 text-rose-600 hover:bg-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20 disabled:opacity-60"
                                title="Decline item"
                              >
                                {processingItems[item.id] ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <XCircle className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                          )}

                          {/* Asset Manager Disburse Action */}
                          {isAssetManager && (item.status === 'approved' || item.status === 'funded') && req?.batch?.status === 'acknowledged' && (
                            <button
                              onClick={() => handleItemAction(item.id, 'disburse')}
                              disabled={processingItems[item.id]}
                              className="inline-flex items-center gap-1 rounded-md bg-indigo-600/10 px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-600/20 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20 disabled:opacity-60"
                              title="Mark as disbursed"
                            >
                              {processingItems[item.id] ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <DollarSign className="h-3 w-3" />
                              )}
                              Disburse
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

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
