import React from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { PageHeader } from '@/Components/ui/page-header';
import EmptyState from '@/Components/ui/empty-state';
import IconMapper from '@/Components/IconMapper';

interface Guard {
  id: number;
  name: string;
  employee_id: string;
  status: string;
  supervisor?: { id: number; name: string } | null;
  current_assignment?: { client_name?: string | null; site_name?: string | null; site_id?: number } | null;
  zone?: { id: number; name: string } | null;
}

type PageProps = {
  guards?: { data: Guard[]; links?: any[]; meta?: any };
  filters?: { filter?: 'assigned' | 'unassigned' };
};

export default function AssignmentsIndex() {
  const pageProps = usePage().props as any;
  const guards = pageProps?.guards && typeof pageProps.guards === 'object'
    ? pageProps.guards
    : { data: [], links: [], meta: {} };
  const filters = pageProps?.filters && typeof pageProps.filters === 'object' ? pageProps.filters : {};
  const stats = pageProps?.stats;

  const guardsData: Guard[] = Array.isArray(guards?.data) ? guards.data : [];
  const guardLinks = Array.isArray(guards?.links) ? guards.links : [];

  const [filter, setFilter] = React.useState<string>(filters?.filter || '');

  const gotoTab = (next: string) => {
    setFilter(next);
    router.get(route('control-room.assignments.index'), { filter: next || undefined }, { preserveState: true, preserveScroll: true });
  };

  const statCards = [
    { label: 'Total Guards', value: stats?.total || guards.meta?.total || 0, icon: 'Users', color: 'blue' },
    { label: 'Assigned', value: stats?.assigned || 0, icon: 'CheckCircle', color: 'emerald' },
    { label: 'Unassigned', value: stats?.unassigned || 0, icon: 'UserX', color: 'amber' },
    { label: 'On Duty', value: stats?.on_duty || 0, icon: 'Clock', color: 'cyan' },
  ];

  return (
    <AuthenticatedLayout header="Guard Assignments">
      <Head title="Assignments" />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-gradient-to-br from-red-900 via-red-800 to-red-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/10 rounded-lg backdrop-blur-sm">
                  <IconMapper name="MapPin" size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">Guard Assignments</h1>
                  <p className="text-red-100 text-sm mt-0.5">Manage deployments and site allocations</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={route('control-room.clients')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium text-sm backdrop-blur-sm"
                >
                  <IconMapper name="Building" size={16} />
                  Clients
                </Link>
                <Link
                  href={route('control-room.zones.index')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium text-sm backdrop-blur-sm"
                >
                  <IconMapper name="Map" size={16} />
                  Zones
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {statCards.map((stat, idx) => (
              <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                  </div>
                  <div className={`p-2 rounded-lg ${stat.color === 'emerald' ? 'bg-emerald-100 dark:bg-emerald-900/20' : stat.color === 'amber' ? 'bg-amber-100 dark:bg-amber-900/20' : stat.color === 'cyan' ? 'bg-cyan-100 dark:bg-cyan-900/20' : 'bg-blue-100 dark:bg-blue-900/20'}`}>
                    <IconMapper name={stat.icon} size={20} className={stat.color === 'emerald' ? 'text-emerald-600' : stat.color === 'amber' ? 'text-amber-600' : stat.color === 'cyan' ? 'text-cyan-600' : 'text-blue-600'} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <Card className="mb-6 dark:bg-gray-800 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex gap-1">
                <button
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${!filter ? 'border-red-600 text-red-600 dark:text-red-400' : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}
                  onClick={() => gotoTab('')}
                >
                  All Guards
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${filter === 'assigned' ? 'border-red-600 text-red-600 dark:text-red-400' : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}
                  onClick={() => gotoTab('assigned')}
                >
                  Assigned
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${filter === 'unassigned' ? 'border-red-600 text-red-600 dark:text-red-400' : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}
                  onClick={() => gotoTab('unassigned')}
                >
                  Unassigned
                </button>
              </div>
            </div>
          </Card>

          {/* Guards List */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            {guardsData.length === 0 ? (
              <div className="py-12 text-center">
                <div className="inline-flex p-4 rounded-full bg-gray-100 dark:bg-gray-800 mb-3">
                  <IconMapper name="Users" size={32} className="text-gray-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-medium">No guards found</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">No guards match the current filter</p>
              </div>
            ) : (
              <>
                {/* Mobile View */}
                <div className="lg:hidden divide-y divide-gray-200 dark:divide-gray-700">
                  {guardsData.map((g: Guard) => (
                    <div key={g.id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                            <IconMapper name="User" size={18} className="text-red-600 dark:text-red-400" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 break-words">
                              {g.name}
                            </div>
                            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 break-words">
                              {g.employee_id}
                            </div>
                            <Badge className={`mt-2 ${g.status === 'active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'}`}>
                              {g.status}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div className="min-w-0">
                          <div className="text-xs text-gray-500 dark:text-gray-400">Supervisor</div>
                          <div className="text-gray-700 dark:text-gray-200 break-words">{g.supervisor?.name || '-'}</div>
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs text-gray-500 dark:text-gray-400">Zone</div>
                          <div className="text-gray-700 dark:text-gray-200 break-words">{g.zone?.name || '-'}</div>
                        </div>
                        <div className="min-w-0 sm:col-span-2">
                          <div className="text-xs text-gray-500 dark:text-gray-400">Current Assignment</div>
                          <div className="text-gray-700 dark:text-gray-200 break-words">
                            {g.current_assignment ? (
                              <span className="flex items-center gap-1">
                                <IconMapper name="MapPin" size={12} className="text-red-500" />
                                {g.current_assignment.client_name || 'Unknown Client'} — {g.current_assignment.site_name || 'Unknown Site'}
                              </span>
                            ) : (
                              <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                <IconMapper name="AlertCircle" size={12} />
                                Unassigned
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop View */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="min-w-full w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-950">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Guard</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Employee ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Supervisor</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Zone</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Current Assignment</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {guardsData.map((g: Guard) => (
                        <tr key={g.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="p-1.5 bg-red-100 dark:bg-red-900/20 rounded">
                                <IconMapper name="User" size={16} className="text-red-600 dark:text-red-400" />
                              </div>
                              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{g.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{g.employee_id}</td>
                          <td className="px-6 py-4">
                            <Badge className={g.status === 'active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'}>
                              {g.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{g.supervisor?.name || '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{g.zone?.name || '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                            {g.current_assignment ? (
                              <span className="flex items-center gap-1">
                                <IconMapper name="MapPin" size={14} className="text-red-500" />
                                <span className="truncate max-w-xs">{g.current_assignment.client_name || 'Unknown'} — {g.current_assignment.site_name || 'Unknown'}</span>
                              </span>
                            ) : (
                              <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                <IconMapper name="AlertCircle" size={14} />
                                Unassigned
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Link
                              href={route('guards.index', { search: g.employee_id })}
                              className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            {guardLinks.length > 0 && guardsData.length > 0 && (
              <div className="p-4 border-t dark:border-gray-700">
                <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Showing {guards.meta?.from || 1} to {guards.meta?.to || guardsData.length} of {guards.meta?.total || guardsData.length} results
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    {guardLinks.filter((l: any) => l.url !== null).map((l: any, idx: number) => (
                      <button
                        key={idx}
                        className={`px-3 py-1.5 text-sm rounded border dark:border-gray-700 transition-colors ${
                          l.active
                            ? 'bg-red-600 text-white border-red-600'
                            : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                        onClick={() => router.get(l.url, { filter: filter || undefined }, { preserveScroll: true, preserveState: true })}
                        dangerouslySetInnerHTML={{ __html: l.label }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
