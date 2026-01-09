import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import HRLayout from '@/Layouts/HRLayout';
import PromoteGuardModal from '@/Components/HR/PromoteGuardModal';
import ConfirmModal from '@/Components/ConfirmModal';
import ReasonModal from '@/Components/ReasonModal';

export default function HREmployees() {
  const { guards, filters, zones, auth }: any = usePage().props;
  const [search, setSearch] = useState(filters?.search || '');
  const [status, setStatus] = useState(filters?.status || '');
  const [employeeRole, setEmployeeRole] = useState(filters?.employee_role || '');
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [currentGuard, setCurrentGuard] = useState<any | null>(null);

  // Confirm & Reason Modals
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});
  const [reasonOpen, setReasonOpen] = useState(false);
  const [reasonTitle, setReasonTitle] = useState('');
  const [reasonMessage, setReasonMessage] = useState('');
  const [reasonSubmit, setReasonSubmit] = useState<((reason: string) => void) | null>(null);

  const openConfirm = (title: string, message: string, action: () => void) => {
    setConfirmTitle(title); setConfirmMessage(message); setConfirmAction(() => action); setConfirmOpen(true);
  };
  const openReason = (title: string, message: string, submit: (reason: string) => void) => {
    setReasonTitle(title); setReasonMessage(message); setReasonSubmit(() => submit); setReasonOpen(true);
  };

  const onFilter = () => {
    router.get(route('hr.employees.index'), { search, status, employee_role: employeeRole }, { preserveState: true, replace: true });
  };

  const openPromote = (guard: any) => {
    setCurrentGuard(guard);
    setPromoteOpen(true);
  };

  const doSuspend = (guard: any) => {
    openConfirm('Suspend guard', `Suspend ${guard.name}?`, () => {
      router.post(route('hr.guards.suspend', { guard: guard.id }), {}, { preserveScroll: true });
    });
  };
  const doReinstate = (guard: any) => {
    openConfirm('Reinstate guard', `Reinstate ${guard.name}?`, () => {
      router.post(route('hr.guards.reinstate', { guard: guard.id }), {}, { preserveScroll: true });
    });
  };
  const doDismiss = (guard: any) => {
    openReason('Dismiss Guard', `Provide a reason (optional) for dismissing ${guard.name}`, (reason: string) => {
      router.post(route('hr.guards.dismiss', { guard: guard.id }), { reason }, { preserveScroll: true });
    });
  };
  const doAbscond = (guard: any) => {
    openReason('Mark as Absconded', `Provide a reason (optional) for marking ${guard.name} as absconded`, (reason: string) => {
      router.post(route('hr.guards.abscond', { guard: guard.id }), { reason }, { preserveScroll: true });
    });
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
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
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
                <option value="dismissed">Dismissed</option>
                <option value="absconded">Absconded</option>
              </select>
              <select
                value={employeeRole}
                onChange={(e) => setEmployeeRole(e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100"
              >
                <option value="">All Types</option>
                <option value="guard">Guards</option>
                <option value="driver">Drivers</option>
              </select>
              <div className="flex gap-3">
                <button onClick={onFilter} className="px-4 py-2 rounded-md border dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200">
                  Filter
                </button>
                <button onClick={() => { setSearch(''); setStatus(''); setEmployeeRole(''); router.get(route('hr.employees.index'), {}, { preserveState: false }); }} className="px-4 py-2 rounded-md border dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200">
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase">Type</th>
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
                      <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                        {(g.employee_role || 'guard').toString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded text-xs ${
                        g.status === 'active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                          : g.status === 'suspended'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
                          : g.status === 'absconded'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-100'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100'
                      }`}>
                        {g.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => openPromote(g)}
                          className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                          Promote
                        </button>
                        <button
                          onClick={() => router.post(route('hr.guards.set-role', { guard: g.id }), { employee_role: (g.employee_role === 'driver' ? 'guard' : 'driver') }, { preserveScroll: true })}
                          className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {g.employee_role === 'driver' ? 'Set as Guard' : 'Set as Driver'}
                        </button>
                        {g.status === 'active' ? (
                          <button
                            onClick={() => doSuspend(g)}
                            className="px-3 py-1 rounded bg-yellow-600 hover:bg-yellow-700 text-white"
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            onClick={() => doReinstate(g)}
                            className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            Reinstate
                          </button>
                        )}
                        <button
                          onClick={() => doDismiss(g)}
                          className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white"
                        >
                          Dismiss
                        </button>
                        <button
                          onClick={() => doAbscond(g)}
                          className="px-3 py-1 rounded bg-red-700 hover:bg-red-800 text-white"
                        >
                          Abscond
                        </button>
                      </div>
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
      {/* Confirm & Reason Modals */}
      <ConfirmModal
        open={confirmOpen}
        title={confirmTitle}
        message={confirmMessage}
        onConfirm={() => { setConfirmOpen(false); confirmAction(); }}
        onCancel={() => setConfirmOpen(false)}
      />
      <ReasonModal
        open={reasonOpen}
        title={reasonTitle}
        message={reasonMessage}
        confirmLabel="Submit"
        onConfirm={(reason) => { setReasonOpen(false); reasonSubmit && reasonSubmit(reason); }}
        onCancel={() => setReasonOpen(false)}
      />
    </HRLayout>
  );
}
