import React from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import IconMapper from '@/Components/IconMapper';
import { route } from 'ziggy-js';

interface Props {
  auth?: any;
}

const Cache: React.FC<Props> = ({ auth }) => {
  const safeRoute = React.useCallback((name: string, params?: any) => {
    try {
      return route(name, params) as unknown as string;
    } catch {
      return null;
    }
  }, []);

  return (
    <AuthenticatedLayout header="Cache" user={auth?.user}>
      <Head title="Cache" />

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 flex items-center gap-4 border border-red-100 dark:border-gray-700">
          <div className="p-3 rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
            <IconMapper name="Trash2" size={24} />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Clear All Caches</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Application, config and route caches.</p>
          </div>
          <button
            onClick={() => {
              if (!confirm('Clear all system caches?')) return;
              const href = safeRoute('superadmin.cache.clear');
              if (!href) return;
              router.post(href);
            }}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold"
          >
            Clear Cache
          </button>
        </div>
      </div>
    </AuthenticatedLayout>
  );
};

export default Cache;
