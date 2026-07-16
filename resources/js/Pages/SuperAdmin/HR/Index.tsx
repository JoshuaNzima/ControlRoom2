import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import IconMapper from '@/Components/IconMapper';

export default function HRIndex() {
  const cards = [
    { title: 'Manage HR', icon: 'Wrench', href: route('superadmin.hr.manage') },
    { title: 'Users', icon: 'Users2', href: route('superadmin.users') },
    { title: 'Roles & Permissions', icon: 'Key', href: route('superadmin.roles.index') },
    { title: 'Guards', icon: 'ShieldCheck', href: route('superadmin.guards') },
    { title: 'Drivers', icon: 'Truck', href: route('superadmin.drivers') },
    { title: 'Settings', icon: 'Settings', href: route('superadmin.settings') },
  ];

  return (
    <AuthenticatedLayout header="HR">
      <Head title="Super Admin • HR" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">HR</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Super Admin HR oversight</p>
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
            <Link href={route('superadmin.roles.index')} className="rounded-xl border dark:border-gray-700 p-4 bg-white dark:bg-gray-800 hover:border-coin-600 transition">
              <div className="flex items-center gap-3">
                <IconMapper name="Key" size={22} className="text-coin-700" />
                <div className="text-gray-900 dark:text-gray-100 font-medium">Roles & Permissions</div>
              </div>
            </Link>
            <Link href={route('superadmin.users')} className="rounded-xl border dark:border-gray-700 p-4 bg-white dark:bg-gray-800 hover:border-coin-600 transition">
              <div className="flex items-center gap-3">
                <IconMapper name="Users2" size={22} className="text-coin-700" />
                <div className="text-gray-900 dark:text-gray-100 font-medium">Manage Users</div>
              </div>
            </Link>
            <Link href={route('admin.qr-codes.download-bulk')} className="rounded-xl border dark:border-gray-700 p-4 bg-white dark:bg-gray-800 hover:border-coin-600 transition">
              <div className="flex items-center gap-3">
                <IconMapper name="QrCode" size={22} className="text-coin-700" />
                <div className="text-gray-900 dark:text-gray-100 font-medium">Download Supervisor QRs (Bulk)</div>
              </div>
            </Link>
            <Link href={route('superadmin.audit')} className="rounded-xl border dark:border-gray-700 p-4 bg-white dark:bg-gray-800 hover:border-coin-600 transition">
              <div className="flex items-center gap-3">
                <IconMapper name="Search" size={22} className="text-coin-700" />
                <div className="text-gray-900 dark:text-gray-100 font-medium">Audit</div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
