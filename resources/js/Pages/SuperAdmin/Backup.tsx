import React from 'react';
import { Head } from '@inertiajs/react';
import SuperAdminLayout from '@/Layouts/SuperAdminLayout';
import IconMapper from '@/Components/IconMapper';

interface Props {
  auth?: any;
}

const Backup: React.FC<Props> = ({ auth }) => {
  return (
    <SuperAdminLayout title="Backup" user={auth?.user}>
      <Head title="Backup" />

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="bg-gradient-to-r from-red-700 via-rose-600 to-pink-600 rounded-2xl shadow p-6 text-white">
          <div className="flex items-center gap-3">
            <IconMapper name="HardDrive" size={28} />
            <h1 className="text-2xl font-bold">Backup & Restore</h1>
          </div>
          <p className="mt-2 text-sm text-red-100">Create and manage database backups. UI ready; backend action can be wired to your preferred backup command.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-red-100 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Create Backup</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">One-click full database backup.</p>
            <button
              disabled
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 cursor-not-allowed"
              title="Hook this to a POST endpoint that triggers backup: e.g. Artisan backup:run"
            >
              <IconMapper name="Play" size={18} />
              Backup Now (wire backend)
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-red-100 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Backups</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">List and download recent backup files.</p>
            <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">No backups to display.</div>
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
};

export default Backup;
