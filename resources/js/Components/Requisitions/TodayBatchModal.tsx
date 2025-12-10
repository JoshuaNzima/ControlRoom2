import React from 'react';
import Modal from '@/Components/Modal';
import { router } from '@inertiajs/react';
import { formatCurrencyMWK } from '@/Components/format';

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
  requested_by: number;
  requestedBy?: UserLite | null;
  approvedBy?: UserLite | null;
};

interface Props {
  open: boolean;
  onClose: () => void;
  isAdmin: boolean;
  isAssetManager: boolean;
}

export default function TodayBatchModal({ open, onClose, isAdmin, isAssetManager }: Props) {
  const [loading, setLoading] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [batch, setBatch] = React.useState<Batch | null>(null);
  const [items, setItems] = React.useState<RequisitionLite[]>([]);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(route('requisitions.batches.today'), {
        headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      });
      const json = await res.json();
      setBatch(json.batch || null);
      setItems(Array.isArray(json.requisitions) ? json.requisitions : []);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (!open) return;
    load();
  }, [open, load]);

  const compileToday = () => {
    router.post(route('requisitions.batches.compile_today'), {}, {
      preserveScroll: true,
      onStart: () => setBusy(true),
      onSuccess: () => load(),
      onFinish: () => setBusy(false),
    });
  };

  const acknowledgeToday = () => {
    router.post(route('requisitions.batches.acknowledge_today'), {}, {
      preserveScroll: true,
      onStart: () => setBusy(true),
      onSuccess: () => load(),
      onFinish: () => setBusy(false),
    });
  };

  return (
    <Modal show={open} onClose={onClose} maxWidth="2xl">
      <div className="p-4 sm:p-6">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">Today's Requisition Batch</h2>
            {batch && (
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                Compiled by {batch.compiledBy?.name || `User #${batch.compiled_by}`} on {new Date(batch.batch_date).toLocaleDateString()} • Status: {batch.status.replace('_', ' ')}
              </p>
            )}
          </div>
          <button onClick={onClose} className="rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">Close</button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-sm text-gray-500">Loading…</div>
        ) : (
          <div className="space-y-4">
            {!batch ? (
              <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-4 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">No batch compiled yet today.</p>
                {isAssetManager && (
                  <button
                    onClick={compileToday}
                    disabled={busy}
                    className="mt-3 inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {busy ? 'Compiling…' : 'Compile today\'s requisitions'}
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <div className="text-gray-800 dark:text-gray-100">
                      <span className="font-medium">{items.length}</span> item{items.length === 1 ? '' : 's'} • Total{' '}
                      <span className="font-semibold">{formatCurrencyMWK(batch.total_amount ?? 0)}</span>
                    </div>
                    <div className="flex gap-2">
                      {isAssetManager && batch.status !== 'acknowledged' && (
                        <button
                          onClick={compileToday}
                          disabled={busy}
                          className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                        >
                          {busy ? 'Updating…' : 'Recompile today'}
                        </button>
                      )}
                      {isAdmin && batch.status === 'pending_ack' && (
                        <button
                          onClick={acknowledgeToday}
                          disabled={busy}
                          className="inline-flex items-center rounded-md bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                        >
                          {busy ? 'Acknowledging…' : 'Acknowledge batch'}
                        </button>
                      )}
                      <a
                        href={route('requisitions.batches.export_today_csv')}
                        className="inline-flex items-center rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        Export CSV
                      </a>
                      <a
                        href={route('requisitions.batches.print_today')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        Print / PDF
                      </a>
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-gray-200 dark:divide-gray-800 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
                  {items.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-500">No requisitions included.</div>
                  ) : (
                    items.map((r) => (
                      <div key={r.id} className="px-3 sm:px-4 py-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{r.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Requested by {r.requestedBy?.name || `User #${r.requested_by}`}</p>
                        </div>
                        {r.amount != null && (
                          <div className="text-sm font-semibold text-gray-900 dark:text-gray-200">{formatCurrencyMWK(r.amount)}</div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
