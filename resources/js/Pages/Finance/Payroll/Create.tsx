import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import PayrollLayout from '@/Layouts/PayrollLayout';

export default function PayrollCreate() {
  const { data, setData, post, processing, errors } = useForm({
    period_start: '',
    period_end: '',
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('finance.payroll.store'));
  };

  return (
    <PayrollLayout title="New Payroll Run">
      <Head title="New Payroll Run" />
      <div className="max-w-xl w-full">
        <form onSubmit={submit} className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm shadow-black/5 space-y-4 dark:border-gray-800 dark:bg-gray-900/60 dark:shadow-none">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Period Start *</label>
            <input type="date" value={data.period_start} onChange={e => setData('period_start', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coin-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" />
            {errors.period_start && <p className="mt-1 text-sm text-red-600 dark:text-red-300">{errors.period_start}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Period End *</label>
            <input type="date" value={data.period_end} onChange={e => setData('period_end', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coin-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" />
            {errors.period_end && <p className="mt-1 text-sm text-red-600 dark:text-red-300">{errors.period_end}</p>}
          </div>
          <div className="pt-2">
            <button type="submit" disabled={processing} className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-coin-600 text-white rounded-lg hover:bg-coin-700 disabled:bg-gray-400 dark:disabled:bg-gray-700">Create Run</button>
          </div>
        </form>
      </div>
    </PayrollLayout>
  );
}
