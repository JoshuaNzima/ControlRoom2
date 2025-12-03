import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import HRLayout from '@/Layouts/HRLayout';
import IconMapper from '@/Components/IconMapper';

export default function HRDashboard() {
  const { auth } = (usePage().props as any);
  return (
    <HRLayout title="HR" user={auth?.user as any}>
      <Head title="HR Dashboard" />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">HR Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage HR operations and visibility.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <a href={route('hr.leaves')} className="group block rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow hover:shadow-md transition">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white">
                  <IconMapper name="Calendar" className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">Leave Management</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Review and manage guard leaves</div>
                </div>
              </div>
            </a>

            <a href={route('hr.jobs.index')} className="group block rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow hover:shadow-md transition">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-red-600 to-red-500 flex items-center justify-center text-white">
                  <IconMapper name="Megaphone" className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">Careers</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Manage public job postings</div>
                </div>
              </div>
            </a>

            <a href={route('hr.archived')} className="group block rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow hover:shadow-md transition">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 flex items-center justify-center text-white">
                  <IconMapper name="Archive" className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">Archived Records</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Browse archived HR records</div>
                </div>
              </div>
            </a>

            <a href={route('hr.employees.index')} className="group block rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow hover:shadow-md transition">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-slate-600 to-slate-700 flex items-center justify-center text-white">
                  <IconMapper name="Users" className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">Employees</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Manage guards and promotions</div>
                </div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </HRLayout>
  );
}
