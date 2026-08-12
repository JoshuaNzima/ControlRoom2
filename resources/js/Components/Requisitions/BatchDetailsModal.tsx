import React from 'react';
import Modal from '@/Components/Modal';
import { router } from '@inertiajs/react';
import { formatCurrencyMWK } from '@/Components/format';
import { useNotification } from '@/Providers/NotificationProvider';
import IconMapper from '@/Components/IconMapper';
import { Button } from '@/Components/ui/button';

type UserLite = { id: number; name: string };

type Batch = {
  id: number;
  batch_date: string;
  compiled_by: number;
  status: 'pending_ack' | 'acknowledged' | string;
  acknowledged_by?: number | null;
  acknowledged_at?: string | null;
  total_amount?: number | string | null;
  compiledBy?: UserLite | null;
  acknowledgedBy?: UserLite | null;
};

type RequisitionLite = {
  id: number;
  title: string;
  amount?: number | string | null;
  status?: string;
  requested_by: number;
  requestedBy?: UserLite | null;
  approvedBy?: UserLite | null;
  category?: string;
  description?: string | null;
  created_at?: string;
};

interface Props {
  open: boolean;
  onClose: () => void;
  batchId: number | null;
  isAdmin: boolean;
  isAssetManager: boolean;
}

export default function BatchDetailsModal({ open, onClose, batchId, isAdmin, isAssetManager }: Props) {
  const [loading, setLoading] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [batch, setBatch] = React.useState<Batch | null>(null);
  const [requisitions, setRequisitions] = React.useState<RequisitionLite[]>([]);
  const [selected, setSelected] = React.useState<Record<number, boolean>>({});
  const { push } = useNotification();

  const load = React.useCallback(async () => {
    if (!batchId) return;
    setLoading(true);
    try {
      const res = await fetch(route('requisitions.batches.show', batchId), {
        headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      });
      const json = await res.json();
      const payload = json.data || json;
      setBatch(payload.batch || null);
      const reqs = Array.isArray(payload.requisitions) ? payload.requisitions : [];
      setRequisitions(reqs);

      // Auto-select pending_funding items for admin
      const nextSelected: Record<number, boolean> = {};
      if (isAdmin) {
        reqs
          .filter((r: any) => String(r?.status) === 'pending_funding')
          .forEach((r: any) => {
            nextSelected[Number(r.id)] = true;
          });
      }
      setSelected(nextSelected);
    } catch (e) {
      push('Failed to load batch details', 'error');
    } finally {
      setLoading(false);
    }
  }, [batchId, isAdmin, push]);

  React.useEffect(() => {
    if (!open || !batchId) return;
    load();
  }, [open, batchId, load]);

  const fundSelected = () => {
    if (!batch) return;
    const ids = requisitions
      .filter((r) => String(r?.status) === 'pending_funding' && !!selected[r.id])
      .map((r) => r.id);

    if (ids.length === 0) {
      push('No unfunded requisitions selected', 'error');
      return;
    }

    router.post(route('requisitions.batches.fund', batch.id), { requisition_ids: ids }, {
      preserveScroll: true,
      onStart: () => setBusy(true),
      onSuccess: () => {
        push(`Funded ${ids.length} requisition(s)`, 'success');
        load();
      },
      onError: () => push('Failed to fund requisitions', 'error'),
      onFinish: () => setBusy(false),
    });
  };

  const toAmount = (v: any) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const selectedIds = React.useMemo(() => {
    return requisitions.filter((r) => !!selected[r.id]).map((r) => r.id);
  }, [requisitions, selected]);

  const selectedTotal = React.useMemo(() => {
    return requisitions
      .filter((r) => String(r?.status) === 'pending_funding' && !!selected[r.id])
      .reduce((sum, r) => sum + toAmount(r.amount), 0);
  }, [requisitions, selected]);

  const statusConfig: Record<string, { color: string; bgColor: string; borderColor: string; icon: string; label: string }> = {
    pending_funding: {
      color: 'text-amber-700 dark:text-amber-200',
      bgColor: 'bg-amber-100 dark:bg-amber-500/20',
      borderColor: 'border-amber-300 dark:border-amber-500/40',
      icon: 'Clock',
      label: 'Pending Funding',
    },
    pending_disbursement: {
      color: 'text-indigo-700 dark:text-indigo-200',
      bgColor: 'bg-indigo-100 dark:bg-indigo-500/20',
      borderColor: 'border-indigo-300 dark:border-indigo-500/40',
      icon: 'Wallet',
      label: 'Pending Disbursement',
    },
    disbursed: {
      color: 'text-emerald-700 dark:text-emerald-200',
      bgColor: 'bg-emerald-100 dark:bg-emerald-500/20',
      borderColor: 'border-emerald-300 dark:border-emerald-500/40',
      icon: 'CheckCircle',
      label: 'Disbursed',
    },
    pending_admin: {
      color: 'text-yellow-700 dark:text-yellow-200',
      bgColor: 'bg-yellow-100 dark:bg-yellow-500/20',
      borderColor: 'border-yellow-300 dark:border-yellow-500/40',
      icon: 'AlertCircle',
      label: 'Pending Admin',
    },
    needs_revision: {
      color: 'text-red-700 dark:text-red-200',
      bgColor: 'bg-red-100 dark:bg-red-500/20',
      borderColor: 'border-red-300 dark:border-red-500/40',
      icon: 'XCircle',
      label: 'Needs Revision',
    },
    expired: {
      color: 'text-gray-700 dark:text-gray-300',
      bgColor: 'bg-gray-100 dark:bg-gray-700/40',
      borderColor: 'border-gray-300 dark:border-gray-600',
      icon: 'Trash2',
      label: 'Expired',
    },
  };

  const getStatus = (status: string | undefined) => {
    return statusConfig[status || ''] || statusConfig.pending_admin;
  };

  const fundedCount = requisitions.filter((r) => String(r.status) === 'disbursed').length;
  const pendingFundingCount = requisitions.filter((r) => String(r.status) === 'pending_funding').length;
  const pendingDisbursementCount = requisitions.filter((r) => String(r.status) === 'pending_disbursement').length;

  return (
    <Modal show={open} onClose={onClose} maxWidth="2xl">
      <div className="p-4 sm:p-6 max-h-[80vh] overflow-y-auto">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
              Batch Details
            </h2>
            {batch && (
              <div className="mt-1 space-y-0.5 text-xs text-gray-600 dark:text-gray-400">
                <p>
                  <span className="font-medium">Date:</span>{' '}
                  {new Date(batch.batch_date).toLocaleDateString()}
                </p>
                <p>
                  <span className="font-medium">Compiled by:</span>{' '}
                  {batch.compiledBy?.name || `User #${batch.compiled_by}`}
                </p>
                {batch.acknowledged_at && (
                  <p>
                    <span className="font-medium">Acknowledged by:</span>{' '}
                    {batch.acknowledgedBy?.name || `User #${batch.acknowledged_by}`} on{' '}
                    {new Date(batch.acknowledged_at).toLocaleString()}
                  </p>
                )}
              </div>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-sm text-gray-500">Loading…</div>
        ) : !batch ? (
          <div className="py-8 text-center text-sm text-gray-500">Batch not found.</div>
        ) : (
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60 p-3">
                <p className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Total Items</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{requisitions.length}</p>
              </div>
              <div className="rounded-lg border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 p-3">
                <p className="text-[10px] uppercase tracking-wide text-emerald-600 dark:text-emerald-300">Funded</p>
                <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-200">{fundedCount}</p>
              </div>
              <div className="rounded-lg border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-3">
                <p className="text-[10px] uppercase tracking-wide text-amber-600 dark:text-amber-300">Unfunded</p>
                <p className="text-lg font-semibold text-amber-700 dark:text-amber-200">{pendingFundingCount}</p>
              </div>
              <div className="rounded-lg border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 p-3">
                <p className="text-[10px] uppercase tracking-wide text-indigo-600 dark:text-indigo-300">To Disburse</p>
                <p className="text-lg font-semibold text-indigo-700 dark:text-indigo-200">{pendingDisbursementCount}</p>
              </div>
            </div>

            {/* Funding Action Bar */}
            {isAdmin && batch.status === 'acknowledged' && pendingFundingCount > 0 && (
              <div className="rounded-lg border border-amber-200 dark:border-amber-500/30 bg-amber-50/50 dark:bg-amber-500/5 p-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Fund Unfunded Requisitions
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Selected: {selectedIds.length} items • Total: {formatCurrencyMWK(selectedTotal)}
                    </p>
                  </div>
                  <Button
                    onClick={fundSelected}
                    disabled={busy || selectedIds.length === 0}
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                    size="sm"
                  >
                    {busy ? 'Funding…' : (
                      <>
                        <IconMapper name="Banknote" size={14} className="mr-1.5" />
                        Fund Selected
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Requisitions List */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="px-3 sm:px-4 py-2 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40">
                <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Requisitions in this Batch
                </h3>
              </div>

              {requisitions.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">No requisitions in this batch.</div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-800">
                  {requisitions.map((r) => {
                    const cfg = getStatus(r.status);
                    const canSelect = isAdmin && String(r.status) === 'pending_funding';

                    return (
                      <div
                        key={r.id}
                        className={`px-3 sm:px-4 py-3 ${
                          canSelect ? 'hover:bg-gray-50 dark:hover:bg-gray-800/40' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {canSelect ? (
                            <input
                              type="checkbox"
                              checked={!!selected[r.id]}
                              onChange={(e) =>
                                setSelected((prev) => ({ ...prev, [r.id]: e.target.checked }))
                              }
                              className="mt-1 h-4 w-4 rounded border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950"
                            />
                          ) : (
                            <div className="mt-1 flex items-center justify-center w-4 h-4">
                              <IconMapper
                                name={cfg.icon}
                                size={14}
                                className={cfg.color}
                              />
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-3">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                  {r.title}
                                </p>
                                <div className="mt-0.5 flex flex-wrap items-center gap-2">
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    #{r.id} • Requested by {r.requestedBy?.name || `User #${r.requested_by}`}
                                  </span>
                                  {r.category && r.category !== 'general' && (
                                    <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 text-[10px] text-gray-600 dark:text-gray-400">
                                      {r.category.replace(/_/g, ' ')}
                                    </span>
                                  )}
                                </div>
                                {r.description && (
                                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                                    {r.description}
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center gap-2 sm:gap-3">
                                <span className="text-sm font-semibold text-gray-900 dark:text-gray-200">
                                  {formatCurrencyMWK(r.amount ?? 0)}
                                </span>
                                <span
                                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide border ${cfg.bgColor} ${cfg.color} ${cfg.borderColor}`}
                                >
                                  {cfg.label}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="text-gray-500 dark:text-gray-400">Status:</span>
              {Object.values(statusConfig).map((cfg) => (
                <span key={cfg.label} className="inline-flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${cfg.bgColor} ${cfg.borderColor} border`} />
                  <span className="text-gray-600 dark:text-gray-400">{cfg.label}</span>
                </span>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-800">
              <a
                href={route('requisitions.batches.export_csv', batch.id)}
                className="inline-flex items-center rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <IconMapper name="Download" size={14} className="mr-1.5" />
                Export CSV
              </a>
              <a
                href={route('requisitions.batches.print', batch.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <IconMapper name="Printer" size={14} className="mr-1.5" />
                Print
              </a>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
