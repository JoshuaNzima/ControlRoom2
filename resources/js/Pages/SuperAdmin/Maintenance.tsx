import React from 'react';
import { Head, router } from '@inertiajs/react';
import SuperAdminLayout from '@/Layouts/SuperAdminLayout';
import IconMapper from '@/Components/IconMapper';
import { route } from 'ziggy-js';

interface Props {
  auth: any;
  isMaintenance?: boolean;
  maintenanceSecret?: string;
}

const Maintenance: React.FC<Props> = ({ auth, isMaintenance, maintenanceSecret }) => {
  return (
    <SuperAdminLayout title="Maintenance" user={auth.user}>
      <Head title="Maintenance" />

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-yellow-100 text-yellow-700">
            <IconMapper name="Settings" size={28} />
          </div>
          <div>
            <h2 className="text-xl font-bold">Maintenance Mode</h2>
            <p className="text-sm text-gray-600">Current status: <span className="font-semibold">{isMaintenance ? 'Enabled' : 'Disabled'}</span></p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-bold mb-3">Actions</h3>
          <div className="space-x-3">
            {!isMaintenance ? (
              <button
                onClick={() => router.post(route('superadmin.maintenance.enable'))}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded"
              >
                Enable Maintenance
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    if (confirm('Disable maintenance mode?')) {
                      router.post(route('superadmin.maintenance.disable'))
                    }
                  }}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
                >
                  Disable Maintenance
                </button>

                <div className="mt-4 text-sm text-gray-700">
                  <p>Maintenance secret (for bypass route or cookie):</p>
                  <code className="block mt-1 p-2 bg-gray-100 rounded">{maintenanceSecret}</code>
                  <p className="mt-2 text-xs text-gray-500">You can visit <span className="font-mono">/{maintenanceSecret}</span> to use the secret bypass if needed.</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
};

export default Maintenance;
