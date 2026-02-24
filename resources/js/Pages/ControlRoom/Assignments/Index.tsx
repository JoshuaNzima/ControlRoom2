import React from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import ControlRoomLayout from '@/Layouts/ControlRoomLayout';
import { Card } from '@/Components/ui/card';
import PageHeader from '@/Components/ui/page-header';
import EmptyState from '@/Components/ui/empty-state';

type Guard = {
  id: number;
  name: string;
  employee_id: string;
  status: string;
  supervisor?: { id: number; name: string } | null;
  current_assignment?: { client_name?: string | null; site_name?: string | null } | null;
};

type PageProps = {
  guards?: { data: Guard[]; links?: any[]; meta?: any };
  filters?: { filter?: 'assigned' | 'unassigned' };
};

export default function AssignmentsIndex() {
  const { guards = { data: [], links: [], meta: {} }, filters = {} } = usePage<PageProps>().props as any;
  const [filter, setFilter] = React.useState<string>(filters.filter || '');

  const gotoTab = (next: string) => {
    setFilter(next);
    router.get(route('control-room.assignments.index'), { filter: next || undefined }, { preserveState: true, preserveScroll: true });
  };

  return (
    <ControlRoomLayout title="Assignments">
      <Head title="Assignments" />

      <div className="max-w-7xl mx-auto mt-6 px-4 sm:px-6 lg:px-8 space-y-6">
        <PageHeader
          title="Guard Assignments"
          description="View current deployments. Use Clients or Zones pages for bulk changes."
          actions={(
            <>
              <a href={route('control-room.clients')} className="w-full sm:w-auto px-4 py-2 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800">Clients</a>
              <a href={route('control-room.zones.index')} className="w-full sm:w-auto px-4 py-2 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800">Zones</a>
            </>
          )}
        />

        <Card>
          <div className="px-4 pt-4 border-b dark:border-gray-700">
            <div className="flex gap-4">
              <button className={`px-3 py-2 text-sm font-medium border-b-2 ${!filter ? 'border-coin-600 text-coin-700 dark:text-coin-400' : 'border-transparent text-gray-600 dark:text-gray-300'}`} onClick={() => gotoTab('')}>All</button>
              <button className={`px-3 py-2 text-sm font-medium border-b-2 ${filter === 'assigned' ? 'border-coin-600 text-coin-700 dark:text-coin-400' : 'border-transparent text-gray-600 dark:text-gray-300'}`} onClick={() => gotoTab('assigned')}>Assigned</button>
              <button className={`px-3 py-2 text-sm font-medium border-b-2 ${filter === 'unassigned' ? 'border-coin-600 text-coin-700 dark:text-coin-400' : 'border-transparent text-gray-600 dark:text-gray-300'}`} onClick={() => gotoTab('unassigned')}>Unassigned</button>
            </div>
          </div>
          {(guards.data || []).length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="No assignment data"
                description="No guards match the current filter."
                size="sm"
                contentClassName="px-0"
              />
            </div>
          ) : (
            <>
              <div className="lg:hidden divide-y divide-gray-200 dark:divide-gray-800">
                {guards.data.map((g: Guard) => (
                  <div key={g.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 break-words">
                          {g.name}
                        </div>
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 break-words">
                          {g.employee_id}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="min-w-0">
                        <div className="text-xs text-gray-500 dark:text-gray-400">Supervisor</div>
                        <div className="text-gray-700 dark:text-gray-200 break-words">{g.supervisor?.name || '-'}</div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-gray-500 dark:text-gray-400">Assignment</div>
                        <div className="text-gray-700 dark:text-gray-200 break-words">
                          {g.current_assignment
                            ? `${g.current_assignment.client_name || 'Unknown Client'} — ${g.current_assignment.site_name || 'Unknown Site'}`
                            : <span className="text-gray-500 dark:text-gray-400">Unassigned</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-[900px] w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-950">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Guard</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Employee ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Supervisor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Current Assignment</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {guards.data.map((g: Guard) => (
                      <tr key={g.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                        <td className="px-6 py-3 text-sm text-gray-900 dark:text-gray-100">{g.name}</td>
                        <td className="px-6 py-3 text-sm text-gray-700 dark:text-gray-300">{g.employee_id}</td>
                        <td className="px-6 py-3 text-sm text-gray-700 dark:text-gray-300">{g.supervisor?.name || '-'}</td>
                        <td className="px-6 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {g.current_assignment
                            ? `${g.current_assignment.client_name || 'Unknown Client'} — ${g.current_assignment.site_name || 'Unknown Site'}`
                            : <span className="text-gray-400 dark:text-gray-500">Unassigned</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          {guards?.links && (
            <div className="p-4 border-t dark:border-gray-700 flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Page {guards?.meta?.current_page ?? ''} of {guards?.meta?.last_page ?? ''}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {(guards?.links || []).filter((l: any) => l.url !== null).map((l: any, idx: number) => (
                  <button
                    key={idx}
                    className={`px-3 py-1 rounded border dark:border-gray-700 ${l.active ? 'bg-coin-600 text-white' : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200'}`}
                    onClick={() => router.get(l.url, { filter: filter || undefined }, { preserveScroll: true, preserveState: true })}
                    dangerouslySetInnerHTML={{ __html: l.label }}
                  />
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>
    </ControlRoomLayout>
  );
}
