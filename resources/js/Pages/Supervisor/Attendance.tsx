import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import SupervisorLayout from '@/Layouts/SupervisorLayout';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface AttendanceRecord {
  id: number;
  guard: {
    id: number;
    name: string;
    employee_id: string;
  };
  site: {
    name: string;
    client_name: string;
  } | null;
  check_in_time: string;
  check_out_time: string;
  hours_worked: number;
  overtime_hours: number;
  status: string;
  supervisor: string;
  notes: string;
}

interface Props {
  attendance: {
    data: AttendanceRecord[];
    links: any[];
    meta?: {
      from: number;
      to: number;
      total: number;
      last_page: number;
      current_page: number;
    };
  };
  filters: {
    date?: string;
    status?: string;
    search?: string;
  };
  stats: {
    total: number;
    present: number;
    late: number;
    absent: number;
  };
}

export default function Attendance({ attendance, filters, stats }: Props) {
  const [date, setDate] = useState(filters.date ? new Date(filters.date) : new Date());
  const [status, setStatus] = useState(filters.status || '');
  const [search, setSearch] = useState(filters.search || '');

  const handleFilter = () => {
    router.get(route('supervisor.attendance'), {
      date: date.toISOString().slice(0, 10),
      status,
      search,
    }, { preserveState: true });
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      present: 'bg-green-100 text-green-800',
      late: 'bg-yellow-100 text-yellow-800',
      absent: 'bg-red-100 text-red-800',
      half_day: 'bg-orange-100 text-orange-800',
    };
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
      </span>
    );
  };

  // Safe access to meta with fallback values
  const meta = attendance.meta || {
    from: 0,
    to: 0,
    total: 0,
    last_page: 1,
    current_page: 1
  };

  // Safe access to links
  const links = attendance.links || [];

  return (
    <SupervisorLayout title="Attendance">
      <Head title="Attendance" />

      <div className="max-w-7xl mx-auto space-y-6 px-6">
        {/* Header with Stats */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Attendance History</h1>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-md p-4">
              <p className="text-sm text-gray-600 mb-1">Total</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-green-50 rounded-xl shadow-md p-4">
              <p className="text-sm text-green-600 mb-1">Present</p>
              <p className="text-3xl font-bold text-green-900">{stats.present}</p>
            </div>
            <div className="bg-yellow-50 rounded-xl shadow-md p-4">
              <p className="text-sm text-yellow-600 mb-1">Late</p>
              <p className="text-3xl font-bold text-yellow-900">{stats.late}</p>
            </div>
            <div className="bg-red-50 rounded-xl shadow-md p-4">
              <p className="text-sm text-red-600 mb-1">Absent</p>
              <p className="text-3xl font-bold text-red-900">{stats.absent}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <DatePicker
                selected={date}
                onChange={(d) => setDate(d || new Date())}
                dateFormat="yyyy-MM-dd"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                maxDate={new Date()}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">All Statuses</option>
                <option value="present">Present</option>
                <option value="late">Late</option>
                <option value="absent">Absent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Guard name..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleFilter}
                className="w-full px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium"
              >
                Apply
              </button>
            </div>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guard</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Site</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check In</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check Out</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supervisor</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendance.data && attendance.data.length > 0 ? (
                  attendance.data.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-gray-900">{record.guard.name}</div>
                          <div className="text-sm text-gray-500">{record.guard.employee_id}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {record.site ? (
                          <div>
                            <div className="text-sm font-medium text-gray-900">{record.site.client_name}</div>
                            <div className="text-sm text-gray-500">{record.site.name}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.check_in_time || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.check_out_time || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {record.hours_worked}h
                          {record.overtime_hours > 0 && (
                            <span className="text-xs text-orange-600 ml-1">
                              (+{record.overtime_hours}h OT)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(record.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.supervisor}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      No attendance records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination - Only show if we have multiple pages */}
          {meta.last_page > 1 && (
            <div className="bg-gray-50 px-6 py-4 border-t">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {meta.from} to {meta.to} of {meta.total}
                </div>
                <div className="flex gap-2">
                  {links.map((link, index) => (
                    <Link
                      key={index}
                      href={link.url || '#'}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${
                        link.active
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                      dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </SupervisorLayout>
  );
}