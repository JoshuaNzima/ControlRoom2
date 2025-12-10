import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import FrontOfficeLayout from '@/Layouts/FrontOfficeLayout';

interface Stats {
  visitors_today: number;
  deliveries_today: number;
  appointments_today: number;
}

type PageProps = {
  auth?: any;
  stats?: Stats;
};

export default function FrontOfficeDashboard() {
  const { auth, stats = { visitors_today: 0, deliveries_today: 0, appointments_today: 0 } } = usePage<PageProps>().props as any;

  return (
    <FrontOfficeLayout title="Front Office" user={auth?.user}>
      <Head title="Front Office" />
      <div className="py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Welcome{auth?.user?.name ? `, ${auth.user.name}` : ''}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Quick view of today's front office activity</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-4">
              <div className="text-sm text-gray-500">Visitors Today</div>
              <div className="text-3xl font-bold text-red-700 dark:text-red-400">{stats.visitors_today}</div>
            </div>
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-4">
              <div className="text-sm text-gray-500">Deliveries Today</div>
              <div className="text-3xl font-bold text-red-700 dark:text-red-400">{stats.deliveries_today}</div>
            </div>
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-4">
              <div className="text-sm text-gray-500">Appointments Today</div>
              <div className="text-3xl font-bold text-red-700 dark:text-red-400">{stats.appointments_today}</div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Actions</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">This area can host quick actions like logging a visitor, recording a delivery, or checking appointments.</p>
          </div>
        </div>
      </div>
    </FrontOfficeLayout>
  );
}
