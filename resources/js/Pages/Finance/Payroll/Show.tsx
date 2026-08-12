import React from 'react';
import { Head, router } from '@inertiajs/react';
import { formatCurrency } from '@/utils/formatters';
import PayrollLayout from '@/Layouts/PayrollLayout';

interface Entry {
  id: number;
  payee_type: 'user' | 'guard';
  payee_id: number;
  base_amount: string;
  allowances?: { task_allowances?: any; overtime?: number } | null;
  gross: string;
  net: string;
  notes?: string;
}

interface Run {
  id: number;
  period_start: string;
  period_end: string;
  status: string;
  gross_total: string;
  deductions_total: string;
  net_total: string;
  entries: Entry[];
}

interface Props {
  run: Run;
}

export default function PayrollShow({ run }: Props) {
  const process = () => {
    router.post(route('finance.payroll.process', run.id));
  };

  const updateEntry = (e: Entry, form: HTMLFormElement) => {
    const formData = new FormData(form);
    const overtime = Number(formData.get('overtime_amount') || 0);
    const notes = String(formData.get('notes') || '');
    router.put(route('finance.payroll.entries.update', e.id), { overtime_amount: overtime, notes }, { preserveScroll: true });
  };

  return (
    <PayrollLayout title={`Payroll ${run.period_start} → ${run.period_end}`}>
      <Head title="Payroll Run" />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Payroll Run</h1>
        {run.status !== 'processed' && (
          <button onClick={process} className="w-full sm:w-auto inline-flex items-center justify-center px-3 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 text-sm">Process</button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Status</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{run.status}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Gross Total</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(Number(run.gross_total || 0))}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Net Total</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(Number(run.net_total || 0))}</div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow overflow-x-auto">
        <table className="min-w-[900px] w-full">
          <thead className="bg-red-50 dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Payee</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Base</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Overtime</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Gross</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Net</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {run.entries.map(e => {
              const currentOT = Number((e.allowances as any)?.overtime ?? 0);
              return (
                <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                  <td className="px-6 py-3 text-sm text-gray-900 dark:text-gray-100">{e.payee_type} #{e.payee_id}</td>
                  <td className="px-6 py-3 text-sm text-gray-900 dark:text-gray-100">{formatCurrency(Number(e.base_amount || 0))}</td>
                  <td className="px-6 py-3 text-sm text-gray-900 dark:text-gray-100">
                    <form onSubmit={(ev)=>{ev.preventDefault(); updateEntry(e, ev.currentTarget);}} className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <input name="overtime_amount" type="number" step="0.01" defaultValue={currentOT}
                        className="w-full sm:w-28 rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 px-2 py-1 text-sm" />
                      <input name="notes" type="text" placeholder="Notes" defaultValue={e.notes || ''}
                        className="w-full sm:flex-1 rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 px-2 py-1 text-sm" />
                      <button type="submit" className="w-full sm:w-auto px-3 py-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 text-xs">Save</button>
                    </form>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-900 dark:text-gray-100">{formatCurrency(Number(e.gross || 0))}</td>
                  <td className="px-6 py-3 text-sm text-gray-900 dark:text-gray-100">{formatCurrency(Number(e.net || 0))}</td>
                  <td className="px-6 py-3 text-sm text-right"></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </PayrollLayout>
  );
}
