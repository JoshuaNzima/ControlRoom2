import React from 'react';
import Modal from '@/Components/Modal';
import { Link } from '@inertiajs/react';
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
  requisitions_count?: number;
  compiledBy?: UserLite | null;
  acknowledgedBy?: UserLite | null;
};

type PaginationMeta = { current_page: number; last_page: number };

type PaginationLink = { url: string | null; label: string; active: boolean };

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function BatchesHistoryModal({ open, onClose }: Props) {
  const [loading, setLoading] = React.useState(false);
  const [items, setItems] = React.useState<Batch[]>([]);
  const [meta, setMeta] = React.useState<PaginationMeta | null>(null);
  const [links, setLinks] = React.useState<PaginationLink[] | null>(null);
  const [from, setFrom] = React.useState<string>('');
  const [to, setTo] = React.useState<string>('');
  const [perPage, setPerPage] = React.useState<number>(20);

  const load = React.useCallback(async (url?: string) => {
    setLoading(true);
    try {
      const qs = url ? '' : `?per_page=${perPage}${from ? `&from=${from}` : ''}${to ? `&to=${to}` : ''}`;
      const res = await fetch(url || (route('requisitions.batches.index') + qs), {
        headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      });
      const json = await res.json();
      const data = json?.batches;
      setItems(data?.data || []);
      setMeta(data?.meta || null);
      setLinks(data?.links || null);
    } finally {
      setLoading(false);
    }
  }, [from, to, perPage]);

  React.useEffect(() => {
    if (!open) return;
    load();
  }, [open, load]);

  const statusTone = (status: string) =>
    status === 'acknowledged'
      ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-200 dark:border-emerald-500/40'
      : 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/20 dark:text-amber-200 dark:border-amber-500/40';

  return (
    <Modal show={open} onClose={onClose} maxWidth="2xl">
      <div className="p-4 sm:p-6">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">Requisition Batches</h2>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">View previous compiled batches and export or print summaries.</p>
          </div>
          <button onClick={onClose} className="rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">Close</button>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60 p-3 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 sm:gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">From</label>
              <input type="date" value={from} onChange={(e)=>setFrom(e.target.value)} className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-2.5 py-1.5 text-xs text-gray-900 dark:text-gray-100" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">To</label>
              <input type="date" value={to} onChange={(e)=>setTo(e.target.value)} className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-2.5 py-1.5 text-xs text-gray-900 dark:text-gray-100" />
            </div>
            <div className="sm:col-span-1">
              <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">Per page</label>
              <select value={perPage} onChange={(e)=>setPerPage(parseInt(e.target.value)||20)} className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-2.5 py-1.5 text-xs text-gray-900 dark:text-gray-100">
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
          <div className="mt-3">
            <button onClick={()=>load()} disabled={loading} className="inline-flex items-center rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60">
              {loading ? 'Loading…' : 'Apply Filters'}
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-3 sm:px-4 py-2 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300">Batches</h3>
            <span className="text-xs text-gray-500">{items.length} item{items.length===1?'':'s'}{meta?.last_page && meta.last_page>1 ? ` • Page ${meta.current_page} of ${meta.last_page}` : ''}</span>
          </div>
          {loading ? (
            <div className="p-4 text-center text-sm text-gray-500">Loading…</div>
          ) : items.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">No batches found.</div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {items.map((b) => (
                <div key={b.id} className="px-3 sm:px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{new Date(b.batch_date).toLocaleDateString()}</p>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide border ${statusTone(b.status)}`}>
                          {b.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="mt-0.5 text-[11px] text-gray-600 dark:text-gray-400">
                        <span>Compiled by {b.compiledBy?.name || `User #${b.compiled_by}`}</span>
                        {b.acknowledged_at && (
                          <>
                            <span className="mx-1">•</span>
                            <span>Ack by {b.acknowledgedBy?.name || `User #${b.acknowledged_by}`} on {new Date(b.acknowledged_at).toLocaleString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatCurrencyMWK(b.total_amount ?? 0)}</div>
                      <span className="text-[11px] text-gray-500">{b.requisitions_count ?? 0} items</span>
                      <a href={route('requisitions.batches.export_csv', b.id)} className="inline-flex items-center rounded-md border border-gray-300 dark:border-gray-700 px-2.5 py-1.5 text-[11px] font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">CSV</a>
                      <a href={route('requisitions.batches.print', b.id)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-md border border-gray-300 dark:border-gray-700 px-2.5 py-1.5 text-[11px] font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">Print</a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {links && meta && meta.last_page > 1 && (
            <div className="px-3 sm:px-4 py-2 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/70 flex items-center justify-between">
              <button
                disabled={!links[0]?.url}
                onClick={()=> { if (links && links[0]?.url) load(links[0]!.url as string); }}
                className="px-2 py-1 text-xs rounded-md border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 disabled:opacity-60"
              >
                Prev
              </button>
              <div className="text-[11px] text-gray-500">Page {meta.current_page} of {meta.last_page}</div>
              <button
                disabled={!links[links.length-1]?.url}
                onClick={()=> { if (links && links[links.length-1]?.url) load(links[links.length-1]!.url as string); }}
                className="px-2 py-1 text-xs rounded-md border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 disabled:opacity-60"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
