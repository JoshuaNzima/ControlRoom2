import React from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import type { PageProps } from '@/types';
import { formatCurrencyMWK } from '@/Components/format';

type RequisitionShowProps = PageProps<{
  requisition: any;
}>;

const badgeColors: Record<string, string> = {
  pending_admin: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40',
  needs_revision: 'bg-red-500/10 text-red-300 border border-red-500/40',
  pending_disbursement: 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/40',
  disbursed: 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40',
};

export default function RequisitionShow({ requisition }: RequisitionShowProps) {
  const { auth } = (usePage().props as any);
  const roles = (auth.user.roles ?? []) as string[];
  const isAdmin = roles.includes('admin') || roles.includes('super_admin');
  const isAssetManager = roles.includes('asset_manager') || roles.includes('assets_manager');
  const isOwner = auth?.user?.id === requisition.requested_by;

  const [showResubmitForm, setShowResubmitForm] = React.useState(false);

  const resubmitForm = useForm<any>({
    title: requisition.title ?? '',
    description: requisition.description ?? '',
    needed_by: requisition.needed_by ? new Date(requisition.needed_by).toISOString().slice(0, 10) : '',
    amount: requisition.amount != null ? String(requisition.amount) : '',
  });

  const adminForm = useForm<any>({
    notes_admin: '',
  });

  const disburseForm = useForm<any>({
    notes_disbursement: '',
  });

  return (
    <AuthenticatedLayout
      header={
        <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-100">
          {requisition.title || 'Requisition'}
        </h2>
      }
    >
      <Head title={requisition.title || 'Requisition'} />

      <div className="py-4 sm:py-6">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-100 break-words">
                {requisition.title}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                <span>
                  Requested by {'User #' + requisition.requested_by}
                </span>
                <span className="hidden sm:inline">•</span>
                <span>Created {new Date(requisition.created_at).toLocaleString()}</span>
                {requisition.needed_by && (
                  <>
                    <span className="hidden sm:inline">•</span>
                    <span>Needed by {new Date(requisition.needed_by).toLocaleDateString()}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide ${
                  badgeColors[requisition.status] ?? 'bg-gray-700 text-gray-200 border border-gray-600'
                }`}
              >
                {requisition.status.replace('_', ' ')}
              </span>
              <Link
                href={route('requisitions.index')}
                className="inline-flex items-center rounded-lg border border-gray-700 bg-gray-900/60 px-2.5 py-1.5 text-[11px] font-medium text-gray-200 hover:bg-gray-800/80"
              >
                Back to list
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <section className="bg-gray-900/80 border border-gray-800/80 rounded-xl p-4 sm:p-5">
              <h2 className="text-sm font-semibold text-gray-200 mb-3">Details</h2>
              <div className="space-y-3 text-sm text-gray-300">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Description</p>
                  <p className="whitespace-pre-wrap break-words">
                    {requisition.description || 'No description provided.'}
                  </p>
                </div>
                {requisition.category && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Category</p>
                    <p className="break-words capitalize">{String(requisition.category).replace('_', ' ')}</p>
                  </div>
                )}
                {requisition.amount != null && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Amount</p>
                    <p className="break-words">{formatCurrencyMWK(requisition.amount)}</p>
                  </div>
                )}
              </div>
            </section>

            {(requisition.notes_admin || requisition.notes_disbursement) && (
              <section className="bg-gray-900/80 border border-gray-800/80 rounded-xl p-4 sm:p-5 space-y-4">
                <h2 className="text-sm font-semibold text-gray-200">Workflow notes</h2>

                {requisition.notes_admin && (
                  <div className="text-sm text-gray-300">
                    <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                      Admin notes
                    </p>
                    <p className="whitespace-pre-wrap break-words">{requisition.notes_admin}</p>
                  </div>
                )}

                {requisition.notes_disbursement && (
                  <div className="text-sm text-gray-300">
                    <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                      Disbursement notes
                    </p>
                    <p className="whitespace-pre-wrap break-words">{requisition.notes_disbursement}</p>
                  </div>
                )}
              </section>
            )}

            <section className="bg-gray-900/80 border border-gray-800/80 rounded-xl p-4 sm:p-5">
              <h2 className="text-sm font-semibold text-gray-200 mb-3">Actions</h2>
              <div className="space-y-4">
                {isOwner && requisition.status === 'needs_revision' && (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setShowResubmitForm((v) => !v)}
                      className="inline-flex items-center rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700"
                    >
                      {showResubmitForm ? 'Cancel edit' : 'Edit & resubmit'}
                    </button>

                    {showResubmitForm && (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          resubmitForm.post(route('requisitions.resubmit', requisition.id), {
                            preserveScroll: true,
                            onSuccess: () => setShowResubmitForm(false),
                          });
                        }}
                        className="mt-3 space-y-3 text-sm"
                      >
                        <div>
                          <label className="block text-xs font-medium text-gray-300 mb-1">Title</label>
                          <input
                            type="text"
                            value={resubmitForm.data.title}
                            onChange={(e) => (resubmitForm as any).setData('title', e.target.value)}
                            className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                            required
                          />
                          {(resubmitForm.errors as any)?.title && (
                            <p className="mt-1 text-xs text-red-400">{(resubmitForm.errors as any).title}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-300 mb-1">Description</label>
                          <textarea
                            value={resubmitForm.data.description}
                            onChange={(e) => (resubmitForm as any).setData('description', e.target.value)}
                            rows={3}
                            className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                          />
                          {(resubmitForm.errors as any)?.description && (
                            <p className="mt-1 text-xs text-red-400">{(resubmitForm.errors as any).description}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-300 mb-1">Needed by</label>
                          <input
                            type="date"
                            value={resubmitForm.data.needed_by}
                            onChange={(e) => (resubmitForm as any).setData('needed_by', e.target.value)}
                            className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                          />
                          {(resubmitForm.errors as any)?.needed_by && (
                            <p className="mt-1 text-xs text-red-400">{(resubmitForm.errors as any).needed_by}</p>
                          )}
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
                            className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                            required
                          />
                          {(resubmitForm.errors as any)?.amount && (
                            <p className="mt-1 text-xs text-red-400">{(resubmitForm.errors as any).amount}</p>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="submit"
                            disabled={resubmitForm.processing}
                            className="inline-flex items-center rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
                          >
                            {resubmitForm.processing ? 'Submitting…' : 'Submit for approval'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowResubmitForm(false)}
                            className="inline-flex items-center rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-xs font-medium text-gray-200 hover:bg-gray-800"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                {isAdmin && requisition.status === 'pending_admin' && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                    }}
                    className="space-y-3 text-sm"
                  >
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">Admin notes (optional)</label>
                      <textarea
                        value={adminForm.data.notes_admin}
                        onChange={(e) => (adminForm as any).setData('notes_admin', e.target.value)}
                        rows={3}
                        className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                        placeholder="Add a note for the requester (optional)"
                      />
                      {(adminForm.errors as any)?.notes_admin && (
                        <p className="mt-1 text-xs text-red-400">{(adminForm.errors as any).notes_admin}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          adminForm.post(route('requisitions.approve', requisition.id), {
                            preserveScroll: true,
                          })
                        }
                        disabled={adminForm.processing}
                        className="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                      >
                        {adminForm.processing ? 'Processing…' : 'Approve'}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          adminForm.post(route('requisitions.decline', requisition.id), {
                            preserveScroll: true,
                          })
                        }
                        disabled={adminForm.processing}
                        className="inline-flex items-center rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
                      >
                        {adminForm.processing ? 'Processing…' : 'Decline'}
                      </button>
                    </div>
                  </form>
                )}

                {isAssetManager && requisition.status === 'pending_disbursement' && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      disburseForm.post(route('requisitions.disburse', requisition.id), {
                        preserveScroll: true,
                      });
                    }}
                    className="space-y-3 text-sm"
                  >
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">Disbursement notes (optional)</label>
                      <textarea
                        value={disburseForm.data.notes_disbursement}
                        onChange={(e) => (disburseForm as any).setData('notes_disbursement', e.target.value)}
                        rows={3}
                        className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                        placeholder="Add a note about what was disbursed (optional)"
                      />
                      {(disburseForm.errors as any)?.notes_disbursement && (
                        <p className="mt-1 text-xs text-red-400">{(disburseForm.errors as any).notes_disbursement}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="submit"
                        disabled={disburseForm.processing}
                        className="inline-flex items-center rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                      >
                        {disburseForm.processing ? 'Marking…' : 'Mark as disbursed'}
                      </button>
                    </div>
                  </form>
                )}

                {!isOwner && !isAdmin && !isAssetManager && (
                  <p className="text-xs text-gray-500">
                    No actions available for your role on this requisition.
                  </p>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
