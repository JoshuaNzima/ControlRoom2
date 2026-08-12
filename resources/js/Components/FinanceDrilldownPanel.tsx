import React from 'react';
import Skeleton from '@/Components/ui/skeleton';
import EmptyState from '@/Components/ui/empty-state';

type Invoice = { id: number; invoice_number?: string | null; amount: number; status?: string; date?: string; user?: string | null };
type Expense = { id: number; amount: number; category?: string; status?: string; date?: string; user?: string | null; notes?: string | null };

type Props = {
  open: boolean;
  title?: string;
  data?: {
    invoices?: Invoice[];
    expenses?: Expense[];
    totals?: { invoices_total?: number; expenses_total?: number };
    budget?: any;
  } | null;
  onClose: () => void;
};

function downloadCSV(filename: string, rows: any[]) {
  if (!rows || rows.length === 0) return;
  const keys = Object.keys(rows[0]);
  const csv = [keys.join(',')].concat(rows.map(r => keys.map(k => `"${String(r[k] ?? '')}"`).join(','))).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function FinanceDrilldownPanel({ open, title, data, onClose }: Props) {
  const [tab, setTab] = React.useState<'invoices' | 'expenses'>('invoices');
  const [sortKey, setSortKey] = React.useState<string>('date');
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('desc');
  const [page, setPage] = React.useState(1);
  const pageSize = 10;

  React.useEffect(() => {
    if (!open) {
      setPage(1);
      setSortKey('date');
      setSortDir('desc');
      setTab('invoices');
    }
  }, [open]);

  if (!open) return null;

  const isLoading = data == null;

  const invoices = (data?.invoices ?? []).slice();
  const expenses = (data?.expenses ?? []).slice();

  const sortRows = (rows: any[]) => {
    return rows.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av;
      }
      return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
  };

  const rows = tab === 'invoices' ? sortRows(invoices) : sortRows(expenses);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const visible = rows.slice((page - 1) * pageSize, page * pageSize);

  const formatCurrency = (v: number) => {
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'MWK' }).format(v || 0);
    } catch (e) {
      return `MWK ${Number(v || 0).toFixed(2)}`;
    }
  };

  return (
    <div className="fixed right-0 top-0 bottom-0 z-50 w-full md:w-1/3 overflow-auto border-l border-gray-200 bg-white shadow-xl shadow-black/10 dark:border-gray-800 dark:bg-gray-950 dark:shadow-black/40">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-white/80 backdrop-blur-sm dark:bg-gray-950/80 flex items-center justify-between">
        <div>
          <div className="font-semibold text-gray-900 dark:text-gray-100">{title || 'Details'}</div>
          {isLoading ? (
            <div className="mt-1 flex gap-2">
              <Skeleton className="h-3 w-40" />
            </div>
          ) : (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {data?.totals ? `Invoices: ${formatCurrency(data.totals.invoices_total || 0)} • Requisitions: ${formatCurrency(data.totals.expenses_total || 0)}` : ''}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={isLoading || (data?.invoices?.length ?? 0) === 0}
            onClick={() => downloadCSV(`${title || 'drilldown'}-invoices.csv`, data?.invoices ?? [])}
            className="text-sm px-2 py-1 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-gray-900"
          >
            CSV Invoices
          </button>
          <button
            disabled={isLoading || (data?.expenses?.length ?? 0) === 0}
            onClick={() => downloadCSV(`${title || 'drilldown'}-requisitions.csv`, data?.expenses ?? [])}
            className="text-sm px-2 py-1 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-gray-900"
          >
            CSV Requisitions
          </button>
          <button
            onClick={onClose}
            className="text-sm px-2 py-1 rounded-lg bg-coin-700 text-white hover:bg-coin-600"
          >
            Close
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="flex gap-2 mb-3">
          <button
            disabled={isLoading}
            className={`px-3 py-1 rounded-lg text-sm font-medium disabled:opacity-50 ${tab === 'invoices'
              ? 'bg-coin-700 text-white'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800'}`}
            onClick={() => { setTab('invoices'); setPage(1); }}
          >
            Invoices ({isLoading ? '—' : invoices.length})
          </button>
          <button
            disabled={isLoading}
            className={`px-3 py-1 rounded-lg text-sm font-medium disabled:opacity-50 ${tab === 'expenses'
              ? 'bg-coin-700 text-white'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800'}`}
            onClick={() => { setTab('expenses'); setPage(1); }}
          >
            Requisitions ({isLoading ? '—' : expenses.length})
          </button>
        </div>

        <div className="mb-3 flex items-center gap-2">
          <div className="text-sm text-gray-600 dark:text-gray-300">Sort by:</div>
          <select
            disabled={isLoading}
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
            className="px-2 py-1 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 shadow-sm shadow-black/5 disabled:opacity-50 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100 dark:shadow-none"
          >
            {tab === 'invoices' ? (
              <>
                <option value="date">Date</option>
                <option value="amount">Amount</option>
                <option value="invoice_number">Invoice #</option>
              </>
            ) : (
              <>
                <option value="date">Date</option>
                <option value="amount">Amount</option>
                <option value="category">Category</option>
              </>
            )}
          </select>
          <button
            disabled={isLoading}
            onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')}
            className="px-2 py-1 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-gray-900"
          >
            {sortDir === 'asc' ? 'Asc' : 'Desc'}
          </button>
        </div>

        <div>
          {isLoading ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ) : visible.length === 0 ? (
            <EmptyState
              title={tab === 'invoices' ? 'No invoices found' : 'No requisitions found'}
              description={tab === 'invoices'
                ? 'There are no invoices for this selection.'
                : 'There are no requisitions for this selection.'}
            />
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-800">
              {visible.map((r: any) => (
                <li key={r.id} className="py-3 flex justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 break-words">
                      {tab === 'invoices' ? `#${r.invoice_number ?? r.id}` : r.category ?? 'Requisition'}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 break-words">{r.date} • {r.user ?? '—'}</div>
                  </div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">{formatCurrency(r.amount)}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-300">Page {page} / {totalPages}</div>
          <div className="flex items-center gap-2">
            <button
              disabled={isLoading || page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="px-2 py-1 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-gray-900"
            >
              Prev
            </button>
            <button
              disabled={isLoading || page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="px-2 py-1 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-gray-900"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
