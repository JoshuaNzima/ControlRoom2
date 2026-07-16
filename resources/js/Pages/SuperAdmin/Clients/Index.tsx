import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import IconMapper from '@/Components/IconMapper';

export default function ClientsIndex() {
  const cards = [
    { title: 'Manage Clients', icon: 'Building2', href: route('superadmin.clients.manage') },
    { title: 'Manage Sites', icon: 'MapPin', href: route('superadmin.clients.manage') },
    { title: 'Assignments', icon: 'Briefcase', href: route('control-room.assignments.index') },
  ];

  return (
    <AuthenticatedLayout header="Clients">
      <Head title="Super Admin • Clients" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Clients</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Super Admin clients overview</p>
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
            <Link href={route('admin.clients.bulk-import-template')} className="rounded-xl border dark:border-gray-700 p-4 bg-white dark:bg-gray-800 hover:border-coin-600 transition">
              <div className="flex items-center gap-3">
                <IconMapper name="FileDown" size={22} className="text-coin-700" />
                <div className="text-gray-900 dark:text-gray-100 font-medium">Download Import Template</div>
              </div>
            </Link>
            <Link href={route('admin.clients.index')} className="rounded-xl border dark:border-gray-700 p-4 bg-white dark:bg-gray-800 hover:border-coin-600 transition">
              <div className="flex items-center gap-3">
                <IconMapper name="Upload" size={22} className="text-coin-700" />
                <div className="text-gray-900 dark:text-gray-100 font-medium">Bulk Import Clients</div>
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
