import React from 'react';
import { Head } from '@inertiajs/react';
import SuperAdminLayout from '@/Layouts/SuperAdminLayout';
import IconMapper from '@/Components/IconMapper';

interface Props {
  auth?: any;
}

const Audit: React.FC<Props> = ({ auth }) => {
  return (
    <SuperAdminLayout title="Audit Trail" user={auth?.user}>
      <Head title="Audit Trail" />

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="bg-gradient-to-r from-red-700 via-rose-600 to-pink-600 rounded-2xl shadow p-6 text-white">
          <div className="flex items-center gap-3">
            <IconMapper name="Search" size={28} />
            <h1 className="text-2xl font-bold">Audit Trail</h1>
          </div>
          <p className="mt-2 text-sm text-red-100">Track critical user actions. Hook to backend that queries activity logs table.</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-red-100 dark:border-gray-700 p-5">
          <div className="text-sm text-gray-600 dark:text-gray-400">No audit entries. Implement backend and props to populate this view.</div>
        </div>
      </div>
    </SuperAdminLayout>
  );
};

export default Audit;
