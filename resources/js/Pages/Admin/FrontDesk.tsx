import React from 'react';
import { Head } from '@inertiajs/react';
import FrontDeskLayout from '@/Layouts/FrontDeskLayout';

interface Summary {
  open_tickets: number;
  visitors_today: number;
  scheduled_appointments: number;
}

interface Props {
  auth?: any;
  summary: Summary;
}

export default function FrontDesk({ auth = {}, summary }: Props) {
  return (
    <FrontDeskLayout title="Front Desk" user={auth?.user as any}>
      <Head title="Front Desk" />
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Open tickets</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">{summary.open_tickets}</p>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Visitors today</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">{summary.visitors_today}</p>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Scheduled appointments</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">{summary.scheduled_appointments}</p>
            </div>
          </div>
        </div>
      </div>
    </FrontDeskLayout>
  );
}
