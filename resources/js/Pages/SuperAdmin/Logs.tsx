import React from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import IconMapper from '@/Components/IconMapper';
import { route } from 'ziggy-js';

interface Props {
  auth?: any;
  logLines?: string[];
}

const Logs: React.FC<Props> = ({ auth, logLines = [] }) => {
  const [lines, setLines] = React.useState<string[]>(logLines);
  const [limit, setLimit] = React.useState<string>('200');

  const safeRoute = React.useCallback((name: string, params?: any) => {
    try {
      return route(name, params) as unknown as string;
    } catch {
      return null;
    }
  }, []);

  const refresh = async () => {
    const url = safeRoute('superadmin.logs.data', { limit });
    if (!url) return;
    try {
      const res = await fetch(url, {
        headers: {
          Accept: 'application/json',
        },
      });
      const data = await res.json();
      setLines(Array.isArray(data?.lines) ? data.lines : []);
    } catch (e) {
      // noop
    }
  };

  return (
    <AuthenticatedLayout header="System Logs" user={auth?.user}>
      <Head title="System Logs" />

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="bg-gradient-to-r from-red-700 via-rose-600 to-pink-600 rounded-2xl shadow p-6 text-white">
          <div className="flex items-center gap-3">
            <IconMapper name="ClipboardList" size={28} />
            <h1 className="text-2xl font-bold">System Logs</h1>
          </div>
          <p className="mt-2 text-sm text-red-100">View recent application logs.</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-red-100 dark:border-gray-700 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700 dark:text-gray-300">Show last</label>
              <select value={limit} onChange={(e) => setLimit(e.target.value)} className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-900/60 text-gray-900 dark:text-gray-100 text-sm border border-gray-200 dark:border-gray-700">
                <option value="100">100</option>
                <option value="200">200</option>
                <option value="500">500</option>
                <option value="1000">1000</option>
              </select>
              <span className="text-sm text-gray-700 dark:text-gray-300">lines</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={refresh} className="px-3 py-2 rounded bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold">Refresh</button>
              {(() => {
                const href = safeRoute('superadmin.logs.download');
                if (!href) return null;
                return (
                  <a href={href} className="px-3 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm font-semibold">Download</a>
                );
              })()}
            </div>
          </div>
          <pre className="text-xs leading-5 max-h-[60vh] overflow-auto bg-gray-50 dark:bg-gray-900 p-3 rounded">
            {lines.length ? lines.join('\n') : 'No logs found.'}
          </pre>
        </div>
      </div>
    </AuthenticatedLayout>
  );
};

export default Logs;
