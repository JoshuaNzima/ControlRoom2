import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { route } from 'ziggy-js';
import SuperAdminLayout from '@/Layouts/SuperAdminLayout';
import IconMapper from '@/Components/IconMapper';

interface Props {
  auth?: any;
}

const Security: React.FC<Props> = ({ auth }) => {
  return (
    <SuperAdminLayout title="Security" user={auth?.user}>
      <Head title="Security" />

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="bg-gradient-to-r from-red-700 via-rose-600 to-pink-600 rounded-2xl shadow p-6 text-white">
          <div className="flex items-center gap-3">
            <IconMapper name="Shield" size={28} />
            <h1 className="text-2xl font-bold">Security Center</h1>
          </div>
          <p className="mt-2 text-sm text-red-100">Manage roles, permissions and user access controls.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href={route('superadmin.roles.index')}
            className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-red-100 dark:border-gray-700 hover:shadow-lg transition group"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                <IconMapper name="Key" size={22} />
              </div>
              <div>
                <div className="font-semibold text-gray-900 dark:text-gray-100">Roles & Permissions</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Assign and manage access</div>
              </div>
            </div>
          </Link>

          <Link
            href={route('superadmin.users')}
            className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-red-100 dark:border-gray-700 hover:shadow-lg transition group"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                <IconMapper name="Users2" size={22} />
              </div>
              <div>
                <div className="font-semibold text-gray-900 dark:text-gray-100">Users</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">View and manage all users</div>
              </div>
            </div>
          </Link>

          <Link
            href={route('superadmin.settings')}
            className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-red-100 dark:border-gray-700 hover:shadow-lg transition group"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                <IconMapper name="Settings" size={22} />
              </div>
              <div>
                <div className="font-semibold text-gray-900 dark:text-gray-100">System Settings</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Configure global policies</div>
              </div>
            </div>
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-red-100 dark:border-gray-700 p-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Best Practices</h2>
          <ul className="mt-3 list-disc pl-5 text-sm text-gray-700 dark:text-gray-300 space-y-1">
            <li>Use least-privilege roles for non-admin users.</li>
            <li>Regularly review role assignments and inactive accounts.</li>
            <li>Rotate privileged credentials and enable device security.</li>
          </ul>
        </div>
      </div>
    </SuperAdminLayout>
  );
};

export default Security;
