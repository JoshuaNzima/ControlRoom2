import React from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import ControlRoomLayout from '@/Layouts/ControlRoomLayout';
import { Card } from '@/Components/ui/card';

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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Guard Assignments</h2>
            <p className="text-sm text-gray-600 mt-1">View current deployments. Use Clients or Zones pages for bulk changes.</p>
          </div>
          <div className="flex gap-2">
            <a href={route('control-room.clients')} className="px-4 py-2 bg-gray-100 rounded text-gray-700">Clients</a>
            <a href={route('control-room.zones.index')} className="px-4 py-2 bg-gray-100 rounded text-gray-700">Zones</a>
          </div>
        </div>

        <Card className="bg-white dark:bg-gray-800 dark:border-gray-700 rounded-xl shadow">
          <div className="px-4 pt-4 border-b dark:border-gray-700">
            <div className="flex gap-4">
              <button className={`px-3 py-2 text-sm font-medium border-b-2 ${!filter ? 'border-coin-600 text-coin-700 dark:text-coin-400' : 'border-transparent text-gray-600 dark:text-gray-300'}`} onClick={() => gotoTab('')}>All</button>
              <button className={`px-3 py-2 text-sm font-medium border-b-2 ${filter === 'assigned' ? 'border-coin-600 text-coin-700 dark:text-coin-400' : 'border-transparent text-gray-600 dark:text-gray-300'}`} onClick={() => gotoTab('assigned')}>Assigned</button>
              <button className={`px-3 py-2 text-sm font-medium border-b-2 ${filter === 'unassigned' ? 'border-coin-600 text-coin-700 dark:text-coin-400' : 'border-transparent text-gray-600 dark:text-gray-300'}`} onClick={() => gotoTab('unassigned')}>Unassigned</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guard</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supervisor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Assignment</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {guards.data.map((g: Guard) => (
                  <tr key={g.id}>
                    <td className="px-6 py-3 text-sm text-gray-900">{g.name}</td>
                    <td className="px-6 py-3 text-sm text-gray-700">{g.employee_id}</td>
                    <td className="px-6 py-3 text-sm text-gray-700">{g.supervisor?.name || '-'}</td>
                    <td className="px-6 py-3 text-sm text-gray-700">
                      {g.current_assignment
                        ? `${g.current_assignment.client_name || 'Unknown Client'} — ${g.current_assignment.site_name || 'Unknown Site'}`
                        : <span className="text-gray-400">Unassigned</span>}
                    </td>
                  </tr>
                ))}
                {guards.data.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No assignment data.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {guards?.links && (
            <div className="p-4 border-t dark:border-gray-700 flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Page {guards?.meta?.current_page ?? ''} of {guards?.meta?.last_page ?? ''}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {guards.links.filter((l: any) => l.url !== null).map((l: any, idx: number) => (
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
