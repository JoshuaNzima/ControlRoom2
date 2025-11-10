import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import ControlRoomLayout from '@/Layouts/ControlRoomLayout';
import { Card } from '@/Components/ui/card';
import IconMapper from '@/Components/IconMapper';

type Guard = {
  id: number;
  name: string;
  employee_id: string;
  status: string;
  supervisor?: { id: number; name: string } | null;
  today_attendance?: { check_in?: string | null; check_out?: string | null } | null;
};

type PageProps = {
  guards?: { data: Guard[]; links?: any; meta?: any };
  filters?: { search?: string };
};

export default function GuardsIndex() {
  const { guards: guardsProp = { data: [] }, filters = {} } = usePage<PageProps>().props as any;
  const [search, setSearch] = useState(filters.search || '');

  return (
    <ControlRoomLayout title="Guards">
      <Head title="Guards" />

      <div className="max-w-7xl mx-auto mt-6 px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Guards Management</h1>
            <p className="text-gray-600">Control Room scoped guard list and quick actions</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => (window.location.href = route('control-room.assignments.index'))}
              className="px-4 py-2 bg-coin-600 text-white rounded"
            >
              Manage Assignments
            </button>
            <Link href={route('control-room.clients')} className="px-4 py-2 bg-gray-100 rounded text-gray-700">
              Clients
            </Link>
          </div>
        </div>

        <Card className="bg-white rounded-xl shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400"><IconMapper name="Search" size={20} /></span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && router.get(route('control-room.guards'), { search }, { preserveState: true })}
                  placeholder="Name or Employee ID..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => router.get(route('control-room.guards'), { search }, { preserveState: true })}
                className="px-4 py-2 bg-coin-600 text-white rounded w-full md:w-auto"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </Card>

        <Card className="bg-white rounded-xl shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supervisor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Today</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {guardsProp.data.map((g: Guard) => (
                  <tr key={g.id}>
                    <td className="px-6 py-3 text-sm text-gray-900">{g.name}</td>
                    <td className="px-6 py-3 text-sm text-gray-700">{g.employee_id}</td>
                    <td className="px-6 py-3 text-sm">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        g.status === 'active' ? 'bg-green-100 text-green-800' :
                        g.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {g.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-700">{g.supervisor?.name || '-'}</td>
                    <td className="px-6 py-3 text-sm text-gray-700">
                      {g.today_attendance ? (
                        <span>
                          {g.today_attendance.check_in || '--:--'} → {g.today_attendance.check_out || '--:--'}
                        </span>
                      ) : <span className="text-gray-400">No entry</span>}
                    </td>
                  </tr>
                ))}
                {guardsProp.data.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No guards found.</td>
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
