import React from 'react';

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
    <div className="fixed right-0 top-0 bottom-0 z-50 w-full md:w-1/3 bg-white dark:bg-gray-800 shadow-lg overflow-auto">
      <div className="p-4 border-b flex items-center justify-between">
        <div>
          <div className="font-semibold">{title || 'Details'}</div>
          <div className="text-xs text-gray-500">{data?.totals ? `Invoices: ${formatCurrency(data.totals.invoices_total || 0)} • Requisitions: ${formatCurrency(data.totals.expenses_total || 0)}` : ''}</div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => downloadCSV(`${title || 'drilldown'}-invoices.csv`, data?.invoices ?? [])} className="text-sm px-2 py-1 bg-gray-100 rounded">CSV Invoices</button>
          <button onClick={() => downloadCSV(`${title || 'drilldown'}-requisitions.csv`, data?.expenses ?? [])} className="text-sm px-2 py-1 bg-gray-100 rounded">CSV Requisitions</button>
          <button onClick={onClose} className="text-sm px-2 py-1 bg-red-100 text-red-800 rounded">Close</button>
        </div>
      </div>

      <div className="p-4">
        <div className="flex gap-2 mb-3">
          <button className={`px-3 py-1 rounded ${tab === 'invoices' ? 'bg-red-800 text-white' : 'bg-gray-100'}`} onClick={() => { setTab('invoices'); setPage(1); }}>Invoices ({invoices.length})</button>
          <button className={`px-3 py-1 rounded ${tab === 'expenses' ? 'bg-red-800 text-white' : 'bg-gray-100'}`} onClick={() => { setTab('expenses'); setPage(1); }}>Requisitions ({expenses.length})</button>
        </div>

        <div className="mb-3 flex items-center gap-2">
          <div className="text-sm text-gray-600">Sort by:</div>
          <select value={sortKey} onChange={(e) => setSortKey(e.target.value)} className="px-2 py-1 border rounded">
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
          <button onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')} className="px-2 py-1 border rounded">{sortDir === 'asc' ? 'Asc' : 'Desc'}</button>
        </div>

        <div>
          <ul className="divide-y">
            {visible.map((r: any) => (
              <li key={r.id} className="py-2 flex justify-between">
                <div>
                  <div className="text-sm font-medium">{tab === 'invoices' ? `#${r.invoice_number ?? r.id}` : r.category ?? 'Requisition'}</div>
                  <div className="text-xs text-gray-500">{r.date} • {r.user ?? '—'}</div>
                </div>
                <div className="text-sm font-medium">{formatCurrency(r.amount)}</div>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">Page {page} / {totalPages}</div>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-2 py-1 border rounded disabled:opacity-50">Prev</button>
            <button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="px-2 py-1 border rounded disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
