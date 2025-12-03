import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import K9Layout from '@/Layouts/K9Layout';
import IconMapper from '@/Components/IconMapper';

export default function K9Handlers() {
  const { auth } = (usePage().props as any);
  return (
    <K9Layout title="K9 Handlers" user={auth?.user as any}>
      <Head title="K9 Handlers" />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">K9 Handlers</h1>
            <p className="text-gray-600 dark:text-slate-400 mt-1">Manage handler profiles and K9 assignments.</p>
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6">
            <div className="flex items-center gap-3 text-gray-700 dark:text-slate-300">
              <IconMapper name="User" className="w-5 h-5" />
              <span>Coming soon: handler listing, certifications, and assignments with modal forms.</span>
            </div>
          </div>
        </div>
      </div>
    </K9Layout>
  );
}
