import React from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function ZoneCommanderWindow() {
  return (
    <AdminLayout title="Zone Commander Window">
      <Head title="Zone Commander Window" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Zone Commander Window</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Overview of Zone Commander activities.</p>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <div className="text-sm font-medium text-coin-800 dark:text-coin-300">Coming soon</div>
          <div className="mt-1 text-sm text-gray-700 dark:text-gray-300">
            This window is reserved for zone-level operational insights.
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}


