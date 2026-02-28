import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { formatCurrencyMWK } from '@/Components/format';
import RequisitionsLayout from '@/Layouts/RequisitionsLayout';
import type { PageProps } from '@/types';
import QuickRequisitionButton from '@/Components/Requisitions/QuickRequisitionButton';
import RequisitionViewModal from '@/Components/Requisitions/RequisitionViewModal';
import { useNotification } from '@/Providers/NotificationProvider';
import TodayBatchModal from '@/Components/Requisitions/TodayBatchModal';
import BatchesHistoryModal from '@/Components/Requisitions/BatchesHistoryModal';
import IconMapper from '@/Components/IconMapper';

interface RequisitionUser {
  id: number;
  name: string;
}

export interface Requisition {
  id: number;
  title: string;
  description?: string | null;
  category?: 'general' | 'fuel' | 'vehicle_hire' | 'events' | 'k9' | 'utilities' | 'office_supplies' | 'stationery' | 'cleaning_supplies' | 'security_equipment' | 'uniforms' | 'training_materials' | 'vehicle_maintenance' | 'communications' | 'it_equipment' | 'medical_supplies' | string;
  status: 'pending_admin' | 'needs_revision' | 'pending_disbursement' | 'pending_funding' | 'disbursed' | 'expired';
  needed_by?: string | null;
  amount?: number | string | null;
  created_at: string;
  updated_at: string;
  requested_by: number;
  requestedBy?: RequisitionUser;
  approvedBy?: RequisitionUser | null;
  disbursedBy?: RequisitionUser | null;
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
}

interface PaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

type RequisitionsIndexProps = PageProps<{
  requisitions: {
    data: Requisition[];
    meta?: PaginationMeta;
    links?: PaginationLink[];
  };
  mode?: 'disburse' | 'mine' | string;
  filter?: 'all' | 'pending' | 'expired' | string;
}>;

const statusColors: Record<string, string> = {
  pending_admin:
    'bg-yellow-100 text-yellow-800 border border-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-300 dark:border-yellow-500/40',
  needs_revision:
    'bg-red-100 text-red-800 border border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/40',
  pending_disbursement:
    'bg-indigo-100 text-indigo-800 border border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-200 dark:border-indigo-500/40',
  pending_funding:
    'bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-200 dark:border-amber-500/40',
  disbursed:
    'bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-200 dark:border-emerald-500/40',
  expired:
    'bg-gray-100 text-gray-800 border border-gray-200 dark:bg-gray-700/40 dark:text-gray-300 dark:border-gray-600',
};

export default function RequisitionsIndex({ requisitions, auth, mode: initialMode, filter: initialFilter }: RequisitionsIndexProps) {
  const roles = (auth.user.roles ?? []) as string[];
  const isAdmin = roles.includes('admin') || roles.includes('super_admin');
  const isAssetManager = roles.includes('asset_manager') || roles.includes('assets_manager');
  const userId = (auth.user.id as number);
  const [open, setOpen] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState<number | null>(null);
  const [openEdit, setOpenEdit] = React.useState(false);
  const { push } = useNotification();
  const mode: 'disburse' | 'mine' = (initialMode === 'mine' ? 'mine' : 'disburse');
  const selectedFilter: 'all' | 'pending' | 'expired' = (initialFilter === 'expired' ? 'expired' : (initialFilter === 'pending' ? 'pending' : 'all'));
  const [showBatch, setShowBatch] = React.useState(false);
  const [showHistory, setShowHistory] = React.useState(false);

  const getRelationName = (obj: any, camel: string, snake: string) => {
    return obj?.[camel]?.name || obj?.[snake]?.name || '';
  };
  const getRequestedByLabel = (req: any) => {
    const name = getRelationName(req, 'requestedBy', 'requested_by');
    if (name) return name;
    const idVal = req?.requested_by;
    return (typeof idVal === 'number' || typeof idVal === 'string') ? `User #${String(idVal)}` : 'User';
  };
  const isMine = (req: any) => String(userId) === String(req?.requested_by ?? '');

  return (
    <RequisitionsLayout title="Requisitions">
      <Head title="Requisitions" />

      <div className="py-4 sm:py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100">Requisitions</h1>
              <p className="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                {isAdmin
                  ? 'Review and route requisitions for approval or revision.'
                  : isAssetManager
                  ? (mode === 'disburse' ? 'Requisitions pending disbursement.' : 'Your submitted requisitions.')
                  : 'Track your submitted requisitions and their status.'}
              </p>
              {isAssetManager && (
                <div className="mt-2 inline-flex rounded-full bg-gray-100 dark:bg-gray-800/40 p-1">
                  <Link
                    href={route('requisitions.index', { mode: 'disburse' })}
                    className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium ${mode === 'disburse' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/60'}`}
                    preserveScroll
                    preserveState
                  >
                    Needs Disbursement
                  </Link>
                  <Link
                    href={route('requisitions.index', { mode: 'mine' })}
                    className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium ${mode === 'mine' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/60'}`}
                    preserveScroll
                    preserveState
                  >
                    My Requests
                  </Link>
                </div>
              )}
              {(isAdmin || !isAssetManager || (isAssetManager && mode === 'mine')) && (
                <div className="mt-2 inline-flex rounded-full bg-gray-100 dark:bg-gray-800/40 p-1">
                  <Link
                    href={route('requisitions.index', (isAssetManager ? { mode, filter: 'all' } : { filter: 'all' }))}
                    className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium ${selectedFilter === 'all' ? 'bg-gray-900 text-white dark:bg-gray-700' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/60'}`}
                    preserveScroll
                    preserveState
                  >
                    All
                  </Link>
                  <Link
                    href={route('requisitions.index', (isAssetManager ? { mode, filter: 'pending' } : { filter: 'pending' }))}
                    className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium ${selectedFilter === 'pending' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/60'}`}
                    preserveScroll
                    preserveState
                  >
                    Pending
                  </Link>
                  <Link
                    href={route('requisitions.index', (isAssetManager ? { mode, filter: 'expired' } : { filter: 'expired' }))}
                    className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium ${selectedFilter === 'expired' ? 'bg-gray-700 text-white dark:bg-gray-600' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/60'}`}
                    preserveScroll
                    preserveState
                  >
                    Expired
                  </Link>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <QuickRequisitionButton />
              {(isAdmin || isAssetManager) && (
                <button
                  type="button"
                  onClick={() => setShowBatch(true)}
                  className="inline-flex items-center justify-center rounded-lg border border-indigo-500/40 bg-indigo-600/20 px-3 py-2 text-xs sm:text-sm font-medium text-indigo-800 dark:text-indigo-200 hover:bg-indigo-600/30 transition"
                >
                  Today's Batch
                </button>
              )}
              {(isAdmin || isAssetManager) && (
                <button
                  type="button"
                  onClick={() => setShowHistory(true)}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-400/40 bg-gray-200/50 dark:bg-gray-800/50 px-3 py-2 text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 transition"
                >
                  History
                </button>
              )}
              <Link
                href={route('dashboard')}
                className="inline-flex items-center justify-center rounded-lg border border-red-500/50 bg-red-600/20 px-3 py-2 text-xs sm:text-sm font-medium text-red-100 hover:bg-red-600/30 transition"
              >
                Back to dashboard
              </Link>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700/70 rounded-xl shadow-sm overflow-hidden">
            <div className="p-3 sm:p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-800/80">
              <h2 className="text-sm font-medium text-gray-900 dark:text-gray-200">All requisitions</h2>
              <span className="text-xs text-gray-500">
                {requisitions.data.length} record{requisitions.data.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="divide-y divide-gray-200 dark:divide-gray-800/80">
              {requisitions.data.length === 0 && (
                <div className="p-4 text-center text-sm text-gray-500">No requisitions found.</div>
              )}

              {requisitions.data.map((req) => (
                <div key={req.id} className="">
                  <button
                    type="button"
                    onClick={() => { setSelectedId(req.id); setOpen(true); }}
                    className="w-full text-left px-3 sm:px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-colors"
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{req.title}</p>
                          {req.category && req.category !== 'general' && (
                            <span className="mt-1 inline-flex items-center rounded-full bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-200 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide">
                              {req.category.replace('_', ' ')}
                            </span>
                          )}
                          {(req as any)?.batch ? (
                            <span
                              className={`mt-1 ml-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide border ${
                                (req as any)?.batch?.status === 'acknowledged'
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-200 dark:border-emerald-500/40'
                                  : 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/20 dark:text-amber-200 dark:border-amber-500/40'
                              }`}
                            >
                              {(req as any)?.batch?.status === 'acknowledged' ? (
                                <>
                                  <IconMapper name="check-circle" className="h-3 w-3 mr-1" />
                                  Acknowledged
                                </>
                              ) : (
                                <>Batch: pending ack</>
                              )}
                            </span>
                          ) : (
                            <span className="mt-1 ml-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide border bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800/60 dark:text-gray-300 dark:border-gray-700">
                              No batch
                            </span>
                          )}
                          {req.description && (
                            <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{req.description}</p>
                          )}
                        </div>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide ${
                            statusColors[req.status] ?? 'bg-gray-100 text-gray-700 border border-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600'
                          }`}
                        >
                          {req.status.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-500">
                        <span>
                          Created {new Date(req.created_at).toLocaleDateString()} • Needed by{' '}
                          {req.needed_by ? new Date(req.needed_by).toLocaleDateString() : 'Not set'}
                        </span>
                        <span className="flex flex-wrap items-center gap-2">
                          {req.amount != null && (
                            <span className="text-gray-900 dark:text-gray-300">{formatCurrencyMWK(req.amount)}</span>
                          )}
                          <span>Requested by {getRequestedByLabel(req as any)}</span>
                          {(getRelationName(req as any, 'approvedBy', 'approved_by')) && (
                            <>
                              <span>•</span>
                              <span>Approved by {getRelationName(req as any, 'approvedBy', 'approved_by')}</span>
                            </>
                          )}
                          {(req.status === 'disbursed' && getRelationName(req as any, 'disbursedBy', 'disbursed_by')) && (
                            <>
                              <span>•</span>
                              <span>Disbursed by {getRelationName(req as any, 'disbursedBy', 'disbursed_by')} on {new Date(req.updated_at).toLocaleString()}</span>
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  </button>

                  {isAssetManager && req.status === 'pending_disbursement' && ((req as any)?.batch?.status === 'acknowledged') && (
                    <div className="px-3 sm:px-4 pb-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          router.post(route('requisitions.disburse', req.id), { notes_disbursement: '' }, {
                            preserveScroll: true,
                            onSuccess: () => {
                              push('Requisition marked as disbursed', 'success');
                              router.reload();
                            },
                          });
                        }}
                        className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-700"
                      >
                        Mark as disbursed
                      </button>
                    </div>
                  )}

                  {(isMine(req) && req.status === 'pending_admin') && (
                    <div className="px-3 sm:px-4 pb-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedId(req.id);
                          setOpenEdit(true);
                          setOpen(true);
                        }}
                        className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          if (window.confirm('Delete this requisition? This cannot be undone.')) {
                            router.delete(route('requisitions.destroy', req.id), {
                              preserveScroll: true,
                              onSuccess: () => router.reload(),
                            });
                          }
                        }}
                        className="inline-flex items-center rounded-md border border-gray-400/40 bg-gray-200/50 dark:bg-gray-800/50 px-3 py-2 text-xs font-medium text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {requisitions.meta && requisitions.links && requisitions.meta.last_page > 1 && (
              <div className="px-3 sm:px-4 py-3 flex flex-wrap items-center justify-center gap-1 border-t border-gray-200 dark:border-gray-800/80 bg-white dark:bg-gray-950/60">
                {requisitions.links.map((link, index) => (
                  <button
                    key={index}
                    disabled={!link.url}
                    onClick={() => {
                      if (link.url) {
                        window.location.href = link.url;
                      }
                    }}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                      link.active
                        ? 'bg-red-600 text-white shadow-sm'
                        : link.url
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800/80 dark:text-gray-300 dark:hover:bg-gray-700'
                        : 'bg-transparent text-gray-600 cursor-default'
                    }`}
                    dangerouslySetInnerHTML={{ __html: link.label }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <RequisitionViewModal open={open} requisitionId={selectedId} initialEdit={openEdit} onClose={() => { setOpen(false); setOpenEdit(false); }} />
      <TodayBatchModal open={showBatch} onClose={() => setShowBatch(false)} isAdmin={isAdmin} isAssetManager={isAssetManager} />
      <BatchesHistoryModal open={showHistory} onClose={() => setShowHistory(false)} />
    </RequisitionsLayout>
  );
}
