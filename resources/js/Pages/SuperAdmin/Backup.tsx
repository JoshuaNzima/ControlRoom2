import React from 'react';
import { Head, router } from '@inertiajs/react';
import SuperAdminLayout from '@/Layouts/SuperAdminLayout';
import IconMapper from '@/Components/IconMapper';
import { route } from 'ziggy-js';

interface Props {
  auth?: any;
}

const Backup: React.FC<Props> = ({ auth }) => {
  const [files, setFiles] = React.useState<Array<{ name: string; size: number; modified_at: string }>>([]);
  const [running, setRunning] = React.useState(false);

  const safeRoute = React.useCallback((name: string, params?: any) => {
    try {
      return route(name, params) as unknown as string;
    } catch {
      return null;
    }
  }, []);

  const load = React.useCallback(async () => {
    const url = safeRoute('superadmin.backups.list');
    if (!url) {
      setFiles([]);
      return;
    }
    try {
      const res = await fetch(url, {
        headers: {
          Accept: 'application/json',
        },
      });
      const data = await res.json();
      setFiles(Array.isArray(data?.files) ? data.files : []);
    } catch (e) {
      setFiles([]);
    }
  }, [safeRoute]);

  React.useEffect(() => {
    load();
  }, [load]);

  const runBackup = () => {
    if (!confirm('Start a new backup now? This may take a while.')) return;

    const url = safeRoute('superadmin.backup.run');
    if (!url) return;

    setRunning(true);
    router.post(url, {}, {
      preserveScroll: true,
      onFinish: () => {
        setRunning(false);
        setTimeout(load, 2000);
      },
    });
  };
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
              onClick={runBackup}
              disabled={running}
              className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg ${running ? 'bg-gray-400 dark:bg-gray-600 cursor-wait' : 'bg-rose-600 hover:bg-rose-700'} text-white`}
            >
              <IconMapper name={running ? 'Loader2' : 'Play'} size={18} />
              {running ? 'Running…' : 'Backup Now'}
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-red-100 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Backups</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">List and download recent backup files.</p>
            <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              {files.length === 0 ? (
                <div>No backups to display.</div>
              ) : (
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {files.map((f, i) => (
                    <li key={i} className="py-2 flex items-center justify-between">
                      <div>
                        <div className="text-gray-900 dark:text-gray-100 font-medium">{f.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{(f.size / 1024 / 1024).toFixed(2)} MB • {new Date(f.modified_at).toLocaleString()}</div>
                      </div>
                      {(() => {
                        const href = safeRoute('superadmin.backups.download', { file: f.name });
                        if (!href) return null;
                        return (
                          <a href={href} className="text-xs text-rose-600 dark:text-rose-300 hover:underline">Download</a>
                        );
                      })()}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
};

export default Backup;
