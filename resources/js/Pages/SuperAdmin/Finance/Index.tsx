import React from 'react';
import { Head, Link } from '@inertiajs/react';
import SuperAdminLayout from '@/Layouts/SuperAdminLayout';
import IconMapper from '@/Components/IconMapper';

export default function FinanceIndex() {
  const cards = [
    { title: 'Manage Finance', icon: 'Wrench', href: route('superadmin.finance.manage') },
    { title: 'Requisitions', icon: 'ClipboardList', href: route('requisitions.index') },
    { title: 'Control Room', icon: 'Monitor', href: route('control-room.dashboard') },
    { title: 'Settings', icon: 'Settings', href: route('superadmin.settings') },
  ];

  return (
    <SuperAdminLayout title="Finance">
      <Head title="Super Admin • Finance" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Finance</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Super Admin finance oversight</p>
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

        <div className="mt-10">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Actions</h2>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href={route('admin.approvals.index')} className="rounded-xl border dark:border-gray-700 p-4 bg-white dark:bg-gray-800 hover:border-coin-600 transition">
              <div className="flex items-center gap-3">
                <IconMapper name="CheckCircle2" size={22} className="text-coin-700" />
                <div className="text-gray-900 dark:text-gray-100 font-medium">Approvals</div>
              </div>
            </Link>
            <Link href={route('superadmin.audit')} className="rounded-xl border dark:border-gray-700 p-4 bg-white dark:bg-gray-800 hover:border-coin-600 transition">
              <div className="flex items-center gap-3">
                <IconMapper name="Search" size={22} className="text-coin-700" />
                <div className="text-gray-900 dark:text-gray-100 font-medium">Audit</div>
              </div>
            </Link>
            <Link href={route('superadmin.logs')} className="rounded-xl border dark:border-gray-700 p-4 bg-white dark:bg-gray-800 hover:border-coin-600 transition">
              <div className="flex items-center gap-3">
                <IconMapper name="FileText" size={22} className="text-coin-700" />
                <div className="text-gray-900 dark:text-gray-100 font-medium">Logs</div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
}
