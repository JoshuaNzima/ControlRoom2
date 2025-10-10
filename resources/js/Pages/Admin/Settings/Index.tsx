import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, usePage } from '@inertiajs/react';
import { useTheme } from '@/Providers/ThemeProvider';

type PageProps = {
  auth: {
    user: {
      id: number;
      name: string;
      email: string;
      roles: string[];
    }
  };
  system: {
    database_status: string;
    database_size: string;
    cache_size: string;
    storage_free: string;
    memory_usage: string;
    uptime: string;
  };
};

export default function SettingIndex() {
  const { auth, system } = usePage<PageProps>().props;
  const { theme, setTheme, toggle } = useTheme();

  return (
    <AdminLayout title="Settings" user={auth?.user as any}>
      <Head title="Settings" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">User Preferences</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                <input className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" defaultValue={auth.user.name} disabled />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                <input className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" defaultValue={auth.user.email} disabled />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role(s)</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {auth.user.roles?.map((r) => (
                  <span key={r} className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-gray-700 dark:text-gray-100">{r}</span>
                ))}
              </div>
            </div>
            <div className="pt-4 border-t dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">Preferences</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="inline-flex items-center">
                  <input type="checkbox" className="rounded border-gray-300 text-red-600" defaultChecked />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Enable desktop notifications</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-red-600"
                    checked={theme === 'dark'}
                    onChange={() => toggle()}
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Dark mode</span>
                </label>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">System Status</h2>
          <dl className="space-y-3">
            <div className="flex items-center justify-between">
              <dt className="text-sm text-gray-600 dark:text-gray-300">Database</dt>
              <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{system.database_status}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-sm text-gray-600 dark:text-gray-300">DB Size</dt>
              <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{system.database_size}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-sm text-gray-600 dark:text-gray-300">Cache Size</dt>
              <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{system.cache_size}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-sm text-gray-600 dark:text-gray-300">Storage Free</dt>
              <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{system.storage_free}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-sm text-gray-600 dark:text-gray-300">Memory Usage</dt>
              <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{system.memory_usage}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-sm text-gray-600 dark:text-gray-300">Uptime (1m load)</dt>
              <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{system.uptime}</dd>
            </div>
          </dl>
        </section>
      </div>
    </AdminLayout>
  );
}
