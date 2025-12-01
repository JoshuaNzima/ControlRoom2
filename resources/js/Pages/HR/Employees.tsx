import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import HRLayout from '@/Layouts/HRLayout';
import PromoteGuardModal from '@/Components/HR/PromoteGuardModal';

export default function HREmployees() {
  const { guards, filters, zones, auth }: any = usePage().props;
  const [search, setSearch] = useState(filters?.search || '');
  const [status, setStatus] = useState(filters?.status || '');
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [currentGuard, setCurrentGuard] = useState<any | null>(null);

  const onFilter = () => {
    router.get(route('hr.employees.index'), { search, status }, { preserveState: true, replace: true });
  };

  const openPromote = (guard: any) => {
    setCurrentGuard(guard);
    setPromoteOpen(true);
  };

  return (
    <HRLayout title="Guards & Promotions" user={auth?.user as any}>
      <Head title="Guards & Promotions" />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Guards & Promotions</h1>
              <p className="text-gray-600 dark:text-slate-400 mt-1">Promote guards to Sergeant, Supervisor, or Zone Commander</p>
            </div>
            <div className="hidden" />
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 md:p-6 mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, phone"
                className="w-full rounded-md border border-gray-300 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100"
              />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
              <div className="flex gap-3">
                <button onClick={onFilter} className="px-4 py-2 rounded-md border dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200">
                  Filter
                </button>
                <button onClick={() => { setSearch(''); setStatus(''); router.get(route('hr.employees.index'), {}, { preserveState: false }); }} className="px-4 py-2 rounded-md border dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200">
                  Reset
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
              <thead className="bg-gray-50 dark:bg-slate-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-700">
                {guards?.data?.map((g: any) => (
                  <tr key={g.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-slate-100">{g.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-slate-100">{g.email || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-slate-100">{g.phone || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded text-xs ${g.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' : g.status === 'inactive' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100' : 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-100'}`}>
                        {g.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => openPromote(g)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Promote
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <PromoteGuardModal
        open={promoteOpen}
        guard={currentGuard}
        zones={zones || []}
        onClose={() => { setPromoteOpen(false); setCurrentGuard(null); }}
        onSuccess={() => router.reload()}
      />
    </HRLayout>
  );
}
