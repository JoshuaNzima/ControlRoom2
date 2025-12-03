import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import K9Layout from '@/Layouts/K9Layout';
import IconMapper from '@/Components/IconMapper';

export default function K9Dashboard() {
  const { auth } = (usePage().props as any);
  return (
    <K9Layout title="K9 Dashboard" user={auth?.user as any}>
      <Head title="K9 Dashboard" />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">K9 Unit</h1>
            <p className="text-gray-600 dark:text-slate-400 mt-1">Overview of K9 operations.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <a href={route('k9.dogs')} className="group block rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow hover:shadow-md transition">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white">
                  <IconMapper name="Dog" className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-slate-100">Dogs</div>
                  <div className="text-sm text-gray-600 dark:text-slate-400">Manage K9 roster and profiles</div>
                </div>
              </div>
            </a>

            <a href={route('k9.handlers')} className="group block rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow hover:shadow-md transition">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 flex items-center justify-center text-white">
                  <IconMapper name="User" className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-slate-100">Handlers</div>
                  <div className="text-sm text-gray-600 dark:text-slate-400">Manage K9 handlers and assignments</div>
                </div>
              </div>
            </a>

            <div className="block rounded-2xl border border-dashed border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-slate-600 to-slate-700 flex items-center justify-center text-white">
                  <IconMapper name="ClipboardList" className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-slate-100">Deployments</div>
                  <div className="text-sm text-gray-600 dark:text-slate-400">Coming soon</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </K9Layout>
  );
}
