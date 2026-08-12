import React from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import IconMapper from '@/Components/IconMapper';
import { route } from 'ziggy-js';

interface Props {
  auth?: any;
  entries?: Array<{ model: string; id: number; who?: string; action: string; at?: string }>;
}

const Audit: React.FC<Props> = ({ auth, entries = [] }) => {
  const [data, setData] = React.useState(entries);

  const safeRoute = React.useCallback((name: string, params?: any) => {
    try {
      return route(name, params) as unknown as string;
    } catch {
      return null;
    }
  }, []);

  const refresh = async () => {
    const url = safeRoute('superadmin.audit.data');
    if (!url) return;
    try {
      const res = await fetch(url, {
        headers: {
          Accept: 'application/json',
        },
      });
      const json = await res.json();
      setData(Array.isArray(json?.entries) ? json.entries : []);
    } catch (e) {}
  };
  return (
    <AuthenticatedLayout header="Audit Trail" user={auth?.user}>
      <Head title="Audit Trail" />

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="bg-gradient-to-r from-red-700 via-rose-600 to-pink-600 rounded-2xl shadow p-6 text-white">
          <div className="flex items-center gap-3">
            <IconMapper name="Search" size={28} />
            <h1 className="text-2xl font-bold">Audit Trail</h1>
          </div>
          <p className="mt-2 text-sm text-red-100">Track critical user actions.</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-red-100 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Activity</h2>
            <button onClick={refresh} className="px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-700 text-white text-sm">Refresh</button>
          </div>
          {data.length === 0 ? (
            <div className="text-sm text-gray-600 dark:text-gray-400">No audit entries available.</div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {data.map((e, i) => (
                <li key={i} className="py-2 flex items-center justify-between">
                  <div className="text-sm">
                    <div className="text-gray-900 dark:text-gray-100 font-medium">{e.who || 'System'} <span className="text-gray-500 font-normal">{e.action}</span></div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{e.model}#{e.id} • {e.at ? new Date(e.at).toLocaleString() : ''}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
};

export default Audit;
