import React from 'react';
import { Head } from '@inertiajs/react';
import SuperAdminLayout from '@/Layouts/SuperAdminLayout';
import IconMapper from '@/Components/IconMapper';

interface Props {
  auth?: any;
}

const Logs: React.FC<Props> = ({ auth }) => {
  return (
    <SuperAdminLayout title="System Logs" user={auth?.user}>
      <Head title="System Logs" />

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="bg-gradient-to-r from-red-700 via-rose-600 to-pink-600 rounded-2xl shadow p-6 text-white">
          <div className="flex items-center gap-3">
            <IconMapper name="ClipboardList" size={28} />
            <h1 className="text-2xl font-bold">System Logs</h1>
          </div>
          <p className="mt-2 text-sm text-red-100">View recent application logs. Wire this page to a backend endpoint that streams or paginates storage/logs.</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-red-100 dark:border-gray-700 p-5">
          <div className="text-sm text-gray-600 dark:text-gray-400">No logs loaded. Implement backend to provide log lines.</div>
        </div>
      </div>
    </SuperAdminLayout>
  );
};

export default Logs;
