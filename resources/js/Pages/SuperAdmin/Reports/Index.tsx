import React from 'react';
import { Head, Link } from '@inertiajs/react';
import SuperAdminLayout from '@/Layouts/SuperAdminLayout';
import IconMapper from '@/Components/IconMapper';

export default function ReportsIndex() {
  const cards = [
    { title: 'Manage Reports', icon: 'Wrench', href: route('superadmin.reports.manage') },
    { title: 'All Reports', icon: 'BarChart2', href: route('reports.index') },
    { title: 'Activity Logs', icon: 'Clock', href: route('superadmin.logs') },
  ];

  return (
    <SuperAdminLayout title="Reports">
      <Head title="Super Admin • Reports" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Reports</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Super Admin analytics and logs</p>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((c, i) => (
            <Link key={i} href={c.href} className="rounded-xl border dark:border-gray-700 p-4 bg-white dark:bg-gray-800 hover:border-coin-600 transition">
              <div className="flex items-center gap-3">
                <IconMapper name={c.icon} size={22} className="text-coin-700" />
                <div className="text-gray-900 dark:text-gray-100 font-medium">{c.title}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </SuperAdminLayout>
  );
}
