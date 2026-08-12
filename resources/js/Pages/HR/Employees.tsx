import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import PromoteGuardModal from '@/Components/HR/PromoteGuardModal';
import GuardDetailsModal from '@/Components/Guards/GuardDetailsModal';
import ConfirmModal from '@/Components/ConfirmModal';
import ReasonModal from '@/Components/ReasonModal';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import IconMapper from '@/Components/IconMapper';

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
  const [selectedGuardDetailsId, setSelectedGuardDetailId] = useState<number | null>(null);
  const [selectedGuardDetails, setSelectedGuardDetails] = useState<any | null>(null);

  // Loading states for actions
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string>('');

  // Helper to get initials
  const getInitials = (name: string): string => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Status color helper
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'suspended': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'absconded': return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400';
      case 'dismissed': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

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
    <AuthenticatedLayout header="Guards & Promotions" user={auth?.user as any}>
      <Head title="Guards & Promotions" />
      
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-red-900 via-red-800 to-rose-900 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                <IconMapper name="Users" size={28} />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">Guards & Promotions</h1>
                <p className="text-red-100 dark:text-gray-400 text-sm mt-1">Manage employees, promotions, and status changes</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {guards?.meta && (
                <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-white/10 text-white text-sm font-medium border border-white/20">
                  <IconMapper name="Users" size={16} className="mr-2" />
                  {guards.meta.total || 0} Total
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Filter Card */}
        <Card className="p-4 dark:bg-gray-800 dark:border-gray-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div className="relative">
              <IconMapper name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, phone"
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 pl-9 pr-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
              />
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
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
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
            >
              <option value="">All Types</option>
              <option value="guard">Guards</option>
              <option value="driver">Drivers</option>
            </select>
            <div className="flex gap-2">
              <Button onClick={onFilter} variant="outline" className="flex-1">
                <IconMapper name="Filter" size={16} className="mr-1" />
                Filter
              </Button>
              <Button onClick={() => { setSearch(''); setStatus(''); setEmployeeRole(''); router.get(route('hr.employees.index'), {}, { preserveState: false }); }} variant="ghost">
                Reset
              </Button>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600 dark:text-gray-400">Per Page:</label>
              <select
                value={String(perPage)}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setPerPage(v);
                  router.get(route('hr.employees.index'), { search, status, employee_role: employeeRole, per_page: v, page: 1 }, { preserveState: true });
                }}
                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            {guards?.meta && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Showing {guards.meta.from || 0} to {guards.meta.to || 0} of {guards.meta.total || 0}
              </span>
            )}
          </div>
        </Card>

        {/* Mobile Cards View */}
        <div className="lg:hidden space-y-3">
          {guards?.data?.map((g: any) => (
            <Card key={g.id} className="p-4 dark:bg-gray-800 dark:border-gray-700">
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {getInitials(g.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{g.name}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{g.email || g.phone || '-'}</p>
                    </div>
                    <Badge className={getStatusColor(g.status)}>{g.status}</Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {(g.employee_role || 'guard').toString()}
                    </Badge>
                  </div>
                  {/* Mobile Actions */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openDetails(g.id)}
                      disabled={loading[`details_${g.id}`]}
                      className="touch-target-min"
                    >
                      <IconMapper name="Eye" size={14} className="mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => openPromote(g)}
                      className="bg-indigo-600 hover:bg-indigo-700 touch-target-min"
                    >
                      Promote
                    </Button>
                    {g.status === 'active' ? (
                      <Button size="sm" variant="outline" onClick={() => doSuspend(g)} disabled={loading[`suspend_${g.id}`]} className="text-yellow-600 border-yellow-300 touch-target-min">
                        Suspend
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => doReinstate(g)} disabled={loading[`reinstate_${g.id}`]} className="text-emerald-600 border-emerald-300 touch-target-min">
                        Reinstate
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Desktop Table View */}
        <Card className="hidden lg:block overflow-hidden dark:bg-gray-800 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {guards?.data?.map((g: any) => (
                  <tr key={g.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white font-bold text-sm">
                          {getInitials(g.name)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{g.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">ID: {g.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">{g.email || '-'}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{g.phone || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="outline" className="text-xs">
                        {(g.employee_role || 'guard').toString()}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getStatusColor(g.status)}>{g.status}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openDetails(g.id)}
                          disabled={loading[`details_${g.id}`]}
                          title="View Details"
                        >
                          <IconMapper name="Eye" size={16} />
                        </Button>
                        <Button size="sm" onClick={() => openPromote(g)} className="bg-indigo-600 hover:bg-indigo-700">
                          Promote
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSetRole(g)}
                          disabled={loading[`setrole_${g.id}`]}
                        >
                          {loading[`setrole_${g.id}`] ? '...' : (g.employee_role === 'driver' ? 'Set Guard' : 'Set Driver')}
                        </Button>
                        {g.status === 'active' ? (
                          <Button size="sm" variant="outline" onClick={() => doSuspend(g)} disabled={loading[`suspend_${g.id}`]} className="text-yellow-600 border-yellow-300">
                            {loading[`suspend_${g.id}`] ? '...' : 'Suspend'}
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => doReinstate(g)} disabled={loading[`reinstate_${g.id}`]} className="text-emerald-600 border-emerald-300">
                            {loading[`reinstate_${g.id}`] ? '...' : 'Reinstate'}
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => doDismiss(g)} disabled={loading[`dismiss_${g.id}`]} className="text-rose-600 border-rose-300">
                          {loading[`dismiss_${g.id}`] ? '...' : 'Dismiss'}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => doAbscond(g)} disabled={loading[`abscond_${g.id}`]} className="text-red-600 border-red-300">
                          {loading[`abscond_${g.id}`] ? '...' : 'Abscond'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Pagination */}
        {guards?.meta && guards.meta.last_page > 1 && (
          <div className="flex flex-wrap justify-center gap-2">
            {guards.links && guards.links.map((link: any, index: number) => (
              <Link
                key={index}
                href={link.url || '#'}
                className={`px-3 py-2 rounded text-sm ${
                  link.active
                    ? 'bg-red-600 text-white'
                    : link.url
                    ? 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700'
                    : 'bg-transparent text-gray-400 cursor-default'
                }`}
                dangerouslySetInnerHTML={{ __html: link.label }}
              />
            ))}
          </div>
        )}

        {error && (
          <div className="text-sm text-red-600 dark:text-red-400 text-center">{error}</div>
        )}
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
    </AuthenticatedLayout>
  );
}
