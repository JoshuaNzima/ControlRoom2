import React from 'react';
import { Head, Link } from '@inertiajs/react';
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
  runs: { data: Run[] };
}

export default function PayrollIndex({ runs }: Props) {
  return (
    <PayrollLayout title="Payroll Runs">
      <Head title="Payroll Runs" />
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Payroll Runs</h1>
        <Link href={route('finance.payroll.create')} className="inline-flex items-center px-3 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 text-sm">
          New Run
        </Link>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-red-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Period</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Gross</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Net</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {runs.data.map(run => (
              <tr key={run.id} className="hover:bg-gray-50">
                <td className="px-6 py-3 text-sm text-gray-900">{run.period_start} → {run.period_end}</td>
                <td className="px-6 py-3 text-sm text-gray-700">{run.status}</td>
                <td className="px-6 py-3 text-sm text-gray-900">{run.gross_total}</td>
                <td className="px-6 py-3 text-sm text-gray-900">{run.net_total}</td>
                <td className="px-6 py-3 text-sm text-right">
                  <Link href={route('finance.payroll.show', run.id)} className="text-red-600 hover:text-red-800">Open</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PayrollLayout>
  );
}
