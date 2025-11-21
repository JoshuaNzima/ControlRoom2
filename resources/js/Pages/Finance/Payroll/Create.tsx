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
      <div className="max-w-xl">
        <form onSubmit={submit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Period Start *</label>
            <input type="date" value={data.period_start} onChange={e => setData('period_start', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" />
            {errors.period_start && <p className="mt-1 text-sm text-red-600">{errors.period_start}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Period End *</label>
            <input type="date" value={data.period_end} onChange={e => setData('period_end', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" />
            {errors.period_end && <p className="mt-1 text-sm text-red-600">{errors.period_end}</p>}
          </div>
          <div className="pt-2">
            <button type="submit" disabled={processing} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400">Create Run</button>
          </div>
        </form>
      </div>
    </PayrollLayout>
  );
}
