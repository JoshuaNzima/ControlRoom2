import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import IconMapper from '@/Components/IconMapper';

interface Module {
    name: string;
    display_name: string;
    is_active: boolean;
}

interface ModuleIndexProps {
    modules: Module[];
}

export default function ModuleIndex({ modules }: ModuleIndexProps) {
  return (
    <AdminLayout title="Modules">
      <Head title="Modules" />
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-bold text-red-900 dark:text-gray-100">Modules</h1>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {modules.map((m) => (
              <Link key={m.name} href={route('admin.modules.summary', m.name)} className={`rounded-2xl border p-4 transition hover:shadow ${m.is_active ? 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900' : 'border-dashed border-gray-300 dark:border-gray-700 bg-white/50 dark:bg-gray-900/50'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${m.is_active ? 'bg-red-100 text-red-700 dark:bg-gray-800 dark:text-gray-200' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                    <IconMapper name="grid" className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 dark:text-gray-100">{m.display_name}</div>
                    <div className={`text-xs ${m.is_active ? 'text-green-700 dark:text-green-300' : 'text-gray-500 dark:text-gray-400'}`}>{m.is_active ? 'Active' : 'Inactive'}</div>
                  </div>
                  <IconMapper name="arrow-right" className="w-4 h-4 text-gray-400" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
