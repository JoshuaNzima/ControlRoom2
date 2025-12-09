import React from 'react';
import { Head, Link } from '@inertiajs/react';
import SuperAdminLayout from '@/Layouts/SuperAdminLayout';
import IconMapper from '@/Components/IconMapper';

export default function AssetsIndex() {
  const cards = [
    { title: 'Manage Assets', icon: 'Wrench', href: route('superadmin.assets.manage') },
    { title: 'Vehicles', icon: 'Car', href: route('assets.index') },
    { title: 'Equipment', icon: 'Package', href: route('assets.index') },
    { title: 'Handovers', icon: 'Hand', href: route('assets.index') },
    { title: 'Settings', icon: 'Settings', href: route('superadmin.settings') },
  ];

  return (
    <SuperAdminLayout title="Assets">
      <Head title="Super Admin • Assets" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Assets</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Super Admin assets oversight</p>
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
