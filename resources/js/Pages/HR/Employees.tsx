import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import HRLayout from '@/Layouts/HRLayout';
import PromoteGuardModal from '@/Components/HR/PromoteGuardModal';
import GuardDetailsModal from '@/Components/Guards/GuardDetailsModal';
import ConfirmModal from '@/Components/ConfirmModal';
import ReasonModal from '@/Components/ReasonModal';

interface Guard {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  employee_role?: string;
  status: string;
}

interface PageProps {
  guards?: {
    data: Guard[];
    meta?: any;
    links?: Array<{ url: string | null; label: string; active: boolean }>;
  };
  filters?: {
    search?: string;
    status?: string;
    employee_role?: string;
    per_page?: number | string;
  };
  zones?: any[];
  auth?: { user?: any };
}

export default function HREmployees() {
  const { guards, filters, zones, auth }: PageProps = usePage().props as any;
  const [search, setSearch] = useState(filters?.search || '');
  const [status, setStatus] = useState(filters?.status || '');
  const [employeeRole, setEmployeeRole] = useState(filters?.employee_role || '');
  const initialPerPage = Number(filters?.per_page ?? guards?.meta?.per_page ?? 20);
  const [perPage, setPerPage] = useState<number>(initialPerPage);
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [currentGuard, setCurrentGuard] = useState<any | null>(null);
  const [selectedGuardDetails, setSelectedGuardDetails] = useState<any | null>(null);

  // Loading states for actions
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string>('');

  const setLoadingState = (key: string, value: boolean) => {
    setLoading(prev => ({ ...prev, [key]: value }));
  };

  const openDetails = async (guardId: number) => {
    setLoadingState(`details_${guardId}`, true);
    setError('');
    try {
      const res = await fetch(route('admin.guards.json', guardId), {
        headers: { 'Accept': 'application/json' },
        credentials: 'same-origin',
      });
      if (!res.ok) throw new Error('Failed to load details');
      const data = await res.json();
      setSelectedGuardDetails(data);
    } catch {
      setError('Failed to load guard details');
    } finally {
      setLoadingState(`details_${guardId}`, false);
    }
  };

  const handleComplianceUpdate = async (guardId: number, data: { fingerprint_registered?: boolean; uniform_issued?: boolean; equipment_issued?: string[] }) => {
    try {
      const res = await fetch(route('admin.guards.compliance', guardId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
        },
        credentials: 'same-origin',
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.success && selectedGuardDetails) {
        setSelectedGuardDetails({
          ...selectedGuardDetails,
          ...result.guard,
        });
      }
    } catch (error) {
      console.error('Failed to update compliance:', error);
      setError('Failed to update compliance');
    }
  };

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
    router.get(route('hr.employees.index'), { search, status, employee_role: employeeRole, per_page: perPage }, { preserveState: true, replace: true });
  };

  const openPromote = (guard: any) => {
    setCurrentGuard(guard);
    setPromoteOpen(true);
  };

  const doSuspend = (guard: any) => {
    openConfirm('Suspend guard', `Suspend ${guard.name}?`, () => {
      setLoadingState(`suspend_${guard.id}`, true);
      setError('');
      router.post(route('hr.guards.suspend', { guard: guard.id }), {}, {
        preserveScroll: true,
        onFinish: () => setLoadingState(`suspend_${guard.id}`, false),
        onError: (errs: any) => setError(Object.values(errs)[0] as string || 'Failed to suspend'),
      });
    });
  };
  const doReinstate = (guard: any) => {
    openConfirm('Reinstate guard', `Reinstate ${guard.name}?`, () => {
      setLoadingState(`reinstate_${guard.id}`, true);
      setError('');
      router.post(route('hr.guards.reinstate', { guard: guard.id }), {}, {
        preserveScroll: true,
        onFinish: () => setLoadingState(`reinstate_${guard.id}`, false),
        onError: (errs: any) => setError(Object.values(errs)[0] as string || 'Failed to reinstate'),
      });
    });
  };
  const doDismiss = (guard: any) => {
    openReason('Dismiss Guard', `Provide a reason (optional) for dismissing ${guard.name}`, (reason: string) => {
      setLoadingState(`dismiss_${guard.id}`, true);
      setError('');
      router.post(route('hr.guards.dismiss', { guard: guard.id }), { reason }, {
        preserveScroll: true,
        onFinish: () => setLoadingState(`dismiss_${guard.id}`, false),
        onError: (errs: any) => setError(Object.values(errs)[0] as string || 'Failed to dismiss'),
      });
    });
  };
  const doAbscond = (guard: any) => {
    openReason('Mark as Absconded', `Provide a reason (optional) for marking ${guard.name} as absconded`, (reason: string) => {
      setLoadingState(`abscond_${guard.id}`, true);
      setError('');
      router.post(route('hr.guards.abscond', { guard: guard.id }), { reason }, {
        preserveScroll: true,
        onFinish: () => setLoadingState(`abscond_${guard.id}`, false),
        onError: (errs: any) => setError(Object.values(errs)[0] as string || 'Failed to mark absconded'),
      });
    });
  };

  const handleSetRole = (guard: any) => {
    setLoadingState(`setrole_${guard.id}`, true);
    setError('');
    router.post(route('hr.guards.set-role', { guard: guard.id }), { employee_role: (guard.employee_role === 'driver' ? 'guard' : 'driver') }, {
      preserveScroll: true,
      onFinish: () => setLoadingState(`setrole_${guard.id}`, false),
      onError: (errs: any) => setError(Object.values(errs)[0] as string || 'Failed to set role'),
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
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
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
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600 dark:text-slate-400">Per Page:</label>
              <select
                value={String(perPage)}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setPerPage(v);
                  router.get(route('hr.employees.index'), { search, status, employee_role: employeeRole, per_page: v, page: 1 }, { preserveState: true });
                }}
                className="px-3 py-1.5 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              {guards?.meta && (
                <span className="text-sm text-gray-500 dark:text-slate-400">
                  Showing {guards.meta.from || 0} to {guards.meta.to || 0} of {guards.meta.total || 0}
                </span>
              )}
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-slate-100">
                      <button onClick={() => openDetails(g.id)} className="hover:underline text-left">
                        {g.name}
                      </button>
                    </td>
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
                          onClick={() => handleSetRole(g)}
                          disabled={loading[`setrole_${g.id}`]}
                          className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60"
                        >
                          {loading[`setrole_${g.id}`] ? '...' : (g.employee_role === 'driver' ? 'Set as Guard' : 'Set as Driver')}
                        </button>
                        {g.status === 'active' ? (
                          <button
                            onClick={() => doSuspend(g)}
                            disabled={loading[`suspend_${g.id}`]}
                            className="px-3 py-1 rounded bg-yellow-600 hover:bg-yellow-700 text-white disabled:opacity-60"
                          >
                            {loading[`suspend_${g.id}`] ? '...' : 'Suspend'}
                          </button>
                        ) : (
                          <button
                            onClick={() => doReinstate(g)}
                            disabled={loading[`reinstate_${g.id}`]}
                            className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-60"
                          >
                            {loading[`reinstate_${g.id}`] ? '...' : 'Reinstate'}
                          </button>
                        )}
                        <button
                          onClick={() => doDismiss(g)}
                          disabled={loading[`dismiss_${g.id}`]}
                          className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-60"
                        >
                          {loading[`dismiss_${g.id}`] ? '...' : 'Dismiss'}
                        </button>
                        <button
                          onClick={() => doAbscond(g)}
                          disabled={loading[`abscond_${g.id}`]}
                          className="px-3 py-1 rounded bg-red-700 hover:bg-red-800 text-white disabled:opacity-60"
                        >
                          {loading[`abscond_${g.id}`] ? '...' : 'Abscond'}
                        </button>
                        {error && (
                          <span className="text-xs text-red-600 dark:text-red-400">{error}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {guards?.meta && guards.meta.last_page > 1 && (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {guards.links && guards.links.map((link: any, index: number) => (
                <Link
                  key={index}
                  href={link.url || '#'}
                  className={`px-3 py-2 rounded ${
                    link.active
                      ? 'bg-indigo-600 text-white'
                      : link.url
                      ? 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-800'
                      : 'bg-transparent text-gray-400 cursor-default'
                  }`}
                  dangerouslySetInnerHTML={{ __html: link.label }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <PromoteGuardModal
        open={promoteOpen}
        guard={currentGuard}
        zones={zones || []}
        onClose={() => { setPromoteOpen(false); setCurrentGuard(null); }}
        onSuccess={() => router.reload()}
      />
      {/* Guard Details Modal */}
      <GuardDetailsModal
        open={!!selectedGuardDetails}
        onClose={() => setSelectedGuardDetails(null)}
        guard={selectedGuardDetails}
        scope="hr"
        onComplianceUpdate={handleComplianceUpdate}
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
