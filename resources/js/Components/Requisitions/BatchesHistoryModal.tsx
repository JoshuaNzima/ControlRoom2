import React from 'react';
import Modal from '@/Components/Modal';
import { Link } from '@inertiajs/react';
import { formatCurrencyMWK } from '@/Components/format';
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
  requisitions_count?: number;
  compiledBy?: UserLite | null;
  acknowledgedBy?: UserLite | null;
  // Funding stats from backend
  funded_count?: number;
  pending_funding_count?: number;
  pending_disbursement_count?: number;
};

type PaginationMeta = { current_page: number; last_page: number };

type PaginationLink = { url: string | null; label: string; active: boolean };

interface Props {
  open: boolean;
  onClose: () => void;
  isAdmin?: boolean;
  isAssetManager?: boolean;
  onViewBatch?: (batchId: number) => void;
}

export default function BatchesHistoryModal({ open, onClose, isAdmin, isAssetManager, onViewBatch }: Props) {
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
      const baseUrl = route('requisitions.batches.index');
      // Only apply date filters if explicitly set
      const hasDateFilter = from || to;
      const qs = url ? '' : `?per_page=${perPage}${from ? `&from=${from}` : ''}${to ? `&to=${to}` : ''}`;
      const fetchUrl = url || `${baseUrl}${qs}`;

      const res = await fetch(fetchUrl, {
        headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch batches: ${res.status}`);
      }

      const json = await res.json();
      const data = json?.batches;
      setItems(data?.data || []);
      setMeta(data?.meta || null);
      setLinks(data?.links || null);
    } catch (err) {
      console.error('Error loading batches:', err);
      setItems([]);
      setMeta(null);
      setLinks(null);
    } finally {
      setLoading(false);
    }
  }, [from, to, perPage]);

  React.useEffect(() => {
    if (!open) return;
    load();
  }, [open, load]);

  const statusTone = (status: string, pendingFundingCount?: number) => {
    if (status === 'acknowledged') {
      // If there are pending funding items, show as partially funded
      if (pendingFundingCount && pendingFundingCount > 0) {
        return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/20 dark:text-amber-200 dark:border-amber-500/40';
      }
      return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-200 dark:border-emerald-500/40';
    }
    return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-200 dark:border-yellow-500/40';
  };

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
          <div className="mt-3 flex items-center gap-2">
            <button onClick={()=>load()} disabled={loading} className="inline-flex items-center rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60">
              {loading ? 'Loading…' : 'Apply Filters'}
            </button>
            {(from || to) && (
              <button 
                onClick={()=> { setFrom(''); setTo(''); load(`${route('requisitions.batches.index')}?per_page=${perPage}`); }} 
                disabled={loading} 
                className="inline-flex items-center rounded-md border border-gray-300 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Clear Filters
              </button>
            )}
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
                <div key={b.id} className="px-3 sm:px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{new Date(b.batch_date).toLocaleDateString()}</p>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide border ${statusTone(b.status, b.pending_funding_count)}`}>
                          {b.status.replace('_', ' ')}
                        </span>
                        {b.pending_funding_count && b.pending_funding_count > 0 && (
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
                            <IconMapper name="Clock" size={10} className="mr-1" />
                            {b.pending_funding_count} unfunded
                          </span>
                        )}
                        {b.funded_count && b.funded_count > 0 && (
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                            <IconMapper name="CheckCircle" size={10} className="mr-1" />
                            {b.funded_count} funded
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-[11px] text-gray-600 dark:text-gray-400">
                        <span>Compiled by {b.compiledBy?.name || `User #${b.compiled_by}`}</span>
                        {b.acknowledged_at && (
                          <>
                            <span className="mx-1">•</span>
                            <span>Ack by {b.acknowledgedBy?.name || `User #${b.acknowledged_by}`} on {new Date(b.acknowledged_at).toLocaleString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatCurrencyMWK(b.total_amount ?? 0)}</div>
                      <span className="text-[11px] text-gray-500">{b.requisitions_count ?? 0} items</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewBatch?.(b.id)}
                        className="text-xs"
                      >
                        <IconMapper name="Eye" size={12} className="mr-1" />
                        View Details
                      </Button>
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
                disabled={!meta?.current_page || meta.current_page <= 1}
                onClick={()=> { if (meta?.current_page && meta.current_page > 1) load(links?.find(l => l.label?.includes('Previous'))?.url || `${route('requisitions.batches.index')}?page=${meta.current_page - 1}`); }}
                className="px-2 py-1 text-xs rounded-md border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 disabled:opacity-60"
              >
                Prev
              </button>
              <div className="text-[11px] text-gray-500">Page {meta.current_page} of {meta.last_page}</div>
              <button
                disabled={!meta?.current_page || meta.current_page >= meta.last_page}
                onClick={()=> { if (meta?.current_page && meta.current_page < meta.last_page) load(links?.find(l => l.label?.includes('Next'))?.url || `${route('requisitions.batches.index')}?page=${meta.current_page + 1}`); }}
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
