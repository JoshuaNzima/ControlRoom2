import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import BusinessDevLayout from '@/Layouts/BusinessDevLayout';
import IconMapper from '@/Components/IconMapper';

export default function K9Dogs() {
  const { auth } = (usePage().props as any);
  return (
    <BusinessDevLayout title="K9 Dogs" user={auth?.user as any}>
      <Head title="K9 Dogs" />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">K9 Dogs</h1>
            <p className="text-gray-600 dark:text-slate-400 mt-1">Manage K9 roster and profiles. CRUD via modals coming next.</p>
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6">
            <div className="flex items-center gap-3 text-gray-700 dark:text-slate-300">
              <IconMapper name="Dog" className="w-5 h-5" />
              <span>Coming soon: dog listing with filters and modal forms.</span>
            </div>
          </div>
        </div>
      </div>
    </BusinessDevLayout>
  );
}
