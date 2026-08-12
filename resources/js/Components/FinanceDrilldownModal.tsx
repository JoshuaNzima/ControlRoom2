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

export default function FinanceDrilldownModal({ open, title, data, onClose }: Props) {
  if (!open) return null;

  const invoices = data?.invoices ?? [];
  const expenses = data?.expenses ?? [];

  const formatCurrency = (v: number) => {
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'MWK' }).format(v || 0);
    } catch (e) {
      return `MWK ${Number(v || 0).toFixed(2)}`;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-40" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg w-11/12 max-w-3xl p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-lg">{title || 'Details'}</h4>
          <button onClick={onClose} className="text-sm text-gray-600 hover:text-gray-900">Close</button>
        </div>

        <div className="space-y-3 max-h-96 overflow-auto">
          {data?.budget && (
            <div className="p-2 border rounded bg-gray-50">
              <div className="text-sm font-medium">{data.budget.name} — {data.budget.category}</div>
              <div className="text-xs text-gray-600">Budgeted: {formatCurrency(data.budget.budgeted_amount || 0)} • Spent: {formatCurrency(data.budget.spent || 0)} • Remaining: {formatCurrency(data.budget.remaining || 0)}</div>
            </div>
          )}

          {data?.totals && (
            <div className="p-2 border rounded bg-gray-50">
              <div className="text-sm">Totals</div>
              <div className="text-xs text-gray-600">Invoices: {formatCurrency(data.totals.invoices_total || 0)} • Expenses: {formatCurrency(data.totals.expenses_total || 0)}</div>
            </div>
          )}

          {invoices.length > 0 && (
            <div>
              <div className="text-sm font-medium">Invoices</div>
              <ul className="mt-1 divide-y">
                {invoices.map((inv) => (
                  <li key={inv.id} className="py-2 flex justify-between">
                    <div>
                      <div className="text-sm">#{inv.invoice_number ?? inv.id} — {inv.user ?? '—'}</div>
                      <div className="text-xs text-gray-500">{inv.date} • {inv.status}</div>
                    </div>
                    <div className="text-sm font-medium">{formatCurrency(inv.amount)}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {expenses.length > 0 && (
            <div>
              <div className="text-sm font-medium">Expenses</div>
              <ul className="mt-1 divide-y">
                {expenses.map((ex) => (
                  <li key={ex.id} className="py-2 flex justify-between">
                    <div>
                      <div className="text-sm">{ex.category ?? 'Expense'} — {ex.user ?? '—'}</div>
                      <div className="text-xs text-gray-500">{ex.date} • {ex.notes ?? ''}</div>
                    </div>
                    <div className="text-sm font-medium">{formatCurrency(ex.amount)}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {invoices.length === 0 && expenses.length === 0 && <div className="text-sm text-gray-500">No records to display.</div>}
        </div>
      </div>
    </div>
  );
}
