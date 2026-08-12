import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import IconMapper from '@/Components/IconMapper';

interface Props {
  auth?: any;
  module: string;
  summary: Record<string, number | string>;
}

const labelize = (key: string) => key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export default function ModuleSummary({ auth = {}, module, summary }: Props) {
  const entries = Object.entries(summary || {});
  const title = `${labelize(module)} — Summary`;

  return (
    <AuthenticatedLayout header={title} user={auth?.user as any}>
      <Head title={title} />
      <div className="py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-red-900 dark:text-gray-100">{labelize(module)} Summary</h1>
              <p className="text-sm text-red-800/80 dark:text-gray-400 mt-1">Read-only overview for Admin</p>
            </div>
            <Link href={route('admin.modules.index')} className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-white dark:bg-gray-800 text-red-800 dark:text-gray-100 border border-red-200 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-gray-700">
              <IconMapper name="grid" className="w-4 h-4 mr-2" />
              Modules
            </Link>
          </div>

          {entries.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 text-gray-600 dark:text-gray-300">No summary available.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {entries.map(([k, v]) => (
                <div key={k} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">{labelize(k)}</div>
                  <div className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">{String(v)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
