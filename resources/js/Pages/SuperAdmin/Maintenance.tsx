import React from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import IconMapper from '@/Components/IconMapper';
import { route } from 'ziggy-js';

interface Props {
  auth: any;
  isMaintenance?: boolean;
  maintenanceSecret?: string;
}

const Maintenance: React.FC<Props> = ({ auth, isMaintenance, maintenanceSecret }) => {
  const safeRoute = React.useCallback((name: string, params?: any) => {
    try {
      return route(name, params) as unknown as string;
    } catch {
      return null;
    }
  }, []);

  return (
    <AuthenticatedLayout header="Maintenance" user={auth.user}>
      <Head title="Maintenance" />

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 flex items-center gap-4 border border-red-100 dark:border-gray-700">
          <div className="p-3 rounded-lg bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
            <IconMapper name="Settings" size={28} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Maintenance Mode</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Current status: <span className="font-semibold">{isMaintenance ? 'Enabled' : 'Disabled'}</span></p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-red-100 dark:border-gray-700">
          <h3 className="font-bold mb-3 text-gray-900 dark:text-gray-100">Actions</h3>
          <div className="space-x-3">
            {!isMaintenance ? (
              <button
                onClick={() => {
                  const href = safeRoute('superadmin.maintenance.enable');
                  if (!href) return;
                  router.post(href);
                }}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 text-white rounded"
              >
                Enable Maintenance
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    if (confirm('Disable maintenance mode?')) {
                      const href = safeRoute('superadmin.maintenance.disable');
                      if (!href) return;
                      router.post(href);
                    }
                  }}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white rounded"
                >
                  Disable Maintenance
                </button>

                <div className="mt-4 text-sm text-gray-700 dark:text-gray-300">
                  <p>Maintenance secret (for bypass route or cookie):</p>
                  <code className="block mt-1 p-2 bg-gray-100 dark:bg-gray-900/60 rounded border border-gray-200 dark:border-gray-700">{maintenanceSecret}</code>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">You can visit <span className="font-mono">/{maintenanceSecret}</span> to use the secret bypass if needed.</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
};

export default Maintenance;
