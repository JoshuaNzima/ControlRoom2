import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import RequisitionsLayout from '@/Layouts/RequisitionsLayout';
import { formatCurrencyMWK } from '@/Components/format';

interface UserLite { id: number; name: string }

interface Batch {
  id: number;
  batch_date?: string | null;
  compiled_by: number;
  acknowledged_by?: number | null;
  acknowledged_at?: string | null;
  status: 'pending_ack' | 'acknowledged' | string;
  total_amount?: number | string | null;
  compiledBy?: UserLite | null;
  acknowledgedBy?: UserLite | null;
}

interface Item {
  id: number;
  title: string;
  amount?: number | string | null;
  requested_by: number;
  requestedBy?: UserLite | null;
  approvedBy?: UserLite | null;
  created_at?: string;
}

type PagePropsT = {
  batch: Batch | null;
  requisitions: Item[];
};

export default function BatchPrintPage() {
  const { props } = usePage<{ batch: Batch | null; requisitions: Item[] }>();
  const batch = props.batch;
  const items = props.requisitions || [];

  React.useEffect(() => {
    // Give layout a tick, then open print dialog for convenience
    const t = setTimeout(() => window.print(), 200);
    return () => clearTimeout(t);
  }, []);

  return (
    <RequisitionsLayout title="Today's Batch Summary">
      <Head title="Requisitions • Today's Batch" />
      <div className="py-4 sm:py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100">Today's Batch Summary</h1>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700"
            >
              Print
            </button>
          </div>

          {!batch ? (
            <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-4 text-center text-sm text-gray-600 dark:text-gray-300">
              No batch compiled today.
            </div>
          ) : (
            <div className="space-y-4">
              <section className="bg-white dark:bg-gray-900/70 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Batch Date</div>
                    <div className="text-gray-900 dark:text-gray-100">{batch.batch_date ? new Date(batch.batch_date).toLocaleDateString() : '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Compiled By</div>
                    <div className="text-gray-900 dark:text-gray-100">{batch.compiledBy?.name || `User #${batch.compiled_by}`}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Status</div>
                    <div className="text-gray-900 dark:text-gray-100 capitalize">{batch.status.replace('_', ' ')}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Total Amount</div>
                    <div className="text-gray-900 dark:text-gray-100 font-semibold">{formatCurrencyMWK(batch.total_amount ?? 0)}</div>
                  </div>
                  {batch.acknowledged_at && (
                    <div className="sm:col-span-2">
                      <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Acknowledged</div>
                      <div className="text-gray-900 dark:text-gray-100">By {batch.acknowledgedBy?.name || `User #${batch.acknowledged_by}`} on {new Date(batch.acknowledged_at).toLocaleString()}</div>
                    </div>
                  )}
                </div>
              </section>

              <section className="bg-white dark:bg-gray-900/70 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                  <h2 className="text-sm font-medium text-gray-900 dark:text-gray-100">Items</h2>
                  <span className="text-xs text-gray-500">{items.length} item{items.length === 1 ? '' : 's'}</span>
                </div>
                {items.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">No items.</div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-800">
                    {items.map((r) => (
                      <div key={r.id} className="px-4 py-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{r.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Requested by {r.requestedBy?.name || `User #${r.requested_by}`}</p>
                        </div>
                        {r.amount != null && (
                          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatCurrencyMWK(r.amount)}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </div>
    </RequisitionsLayout>
  );
}
