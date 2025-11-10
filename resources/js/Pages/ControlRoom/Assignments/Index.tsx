import React from 'react';
import { Head, usePage } from '@inertiajs/react';
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
  guards?: { data: Guard[] };
};

export default function AssignmentsIndex() {
  const { guards = { data: [] } } = usePage<PageProps>().props as any;

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

        <Card className="bg-white rounded-xl shadow">
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
        </Card>
      </div>
    </ControlRoomLayout>
  );
}
