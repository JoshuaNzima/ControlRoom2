import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import PayrollLayout from '@/Layouts/PayrollLayout';

interface Run {
  id: number;
  period_start: string;
  period_end: string;
  status: string;
  gross_total: string;
  deductions_total: string;
  net_total: string;
}

interface Props {
  runs: { 
    data: Run[];
    links?: Array<{ url: string | null; label: string; active: boolean }>;
    meta?: { current_page: number; last_page: number; total?: number };
  };
}

export default function PayrollIndex({ runs }: Props) {
  return (
    <PayrollLayout title="Payroll Runs">
      <Head title="Payroll Runs" />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Payroll Runs</h1>
        <Link href={route('finance.payroll.create')} className="w-full sm:w-auto inline-flex items-center justify-center px-3 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 text-sm">
          New Run
        </Link>
      </div>
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow overflow-x-auto">
        <table className="min-w-[650px] w-full">
          <thead className="bg-red-50 dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Period</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Gross</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Net</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {runs.data.map(run => (
              <tr key={run.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                <td className="px-6 py-3 text-sm text-gray-900 dark:text-gray-100">{run.period_start} → {run.period_end}</td>
                <td className="px-6 py-3 text-sm text-gray-700 dark:text-gray-300">{run.status}</td>
                <td className="px-6 py-3 text-sm text-gray-900 dark:text-gray-100">{run.gross_total}</td>
                <td className="px-6 py-3 text-sm text-gray-900 dark:text-gray-100">{run.net_total}</td>
                <td className="px-6 py-3 text-sm text-right">
                  <Link href={route('finance.payroll.show', run.id)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">Open</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Pagination */}
        {(runs as any)?.links && (runs as any).meta?.last_page > 1 && (
          <div className="p-4 border-t dark:border-gray-700 flex flex-wrap gap-2 items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">Page {(runs as any).meta?.current_page ?? ''} of {(runs as any).meta?.last_page ?? ''}</div>
            <div className="flex flex-wrap gap-2">
              {(runs as any).links?.filter((l: any) => l.url).map((l: any, idx: number) => (
                <button
                  key={idx}
                  className={`px-3 py-1 rounded border dark:border-gray-700 ${l.active ? 'bg-red-600 text-white' : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200'}`}
                  onClick={() => router.get(l.url, {}, { preserveScroll: true, preserveState: true })}
                  dangerouslySetInnerHTML={{ __html: l.label }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </PayrollLayout>
  );
}
