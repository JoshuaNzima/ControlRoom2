import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import SupervisorLayout from '@/Layouts/SupervisorLayout';
import DatePicker from '@/Components/DatePicker';
import ScannerModal from '@/Components/Scanner/ScannerModal';

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
  activeScan: {
    scan_id: number;
    site_id: number;
    site_name: string;
    client_name: string;
    scanned_at: string;
    expires_at: string;
  } | null;
}

export default function Attendance({ attendance, filters, stats, activeScan }: Props) {
  const [date, setDate] = useState(filters.date ? new Date(filters.date) : new Date());
  const [status, setStatus] = useState(filters.status || '');
  const [search, setSearch] = useState(filters.search || '');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const handleFilter = () => {
    router.get(route('supervisor.attendance'), {
      date: date.toISOString().slice(0, 10),
      status,
      search,
    }, { preserveState: true });
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      present: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
      late: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
      absent: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
      half_day: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200',
    };
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'}`}>
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

      <div className="max-w-7xl mx-auto space-y-6 px-4 sm:px-6">
        {/* Header with Stats */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Attendance History</h1>
            <button
              onClick={() => setIsScannerOpen(true)}
              className="w-full sm:w-auto px-4 py-2 bg-coin-700 hover:bg-coin-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-coin-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              Scan Site
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 p-4 shadow-sm shadow-black/5 dark:shadow-none">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Total</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
            </div>
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-green-50 dark:bg-green-900/20 p-4 shadow-sm shadow-black/5 dark:shadow-none">
              <p className="text-sm text-green-700 dark:text-green-200 mb-1">Present</p>
              <p className="text-3xl font-bold text-green-900 dark:text-green-100">{stats.present}</p>
            </div>
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-yellow-50 dark:bg-yellow-900/20 p-4 shadow-sm shadow-black/5 dark:shadow-none">
              <p className="text-sm text-yellow-700 dark:text-yellow-200 mb-1">Late</p>
              <p className="text-3xl font-bold text-yellow-900 dark:text-yellow-100">{stats.late}</p>
            </div>
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-red-50 dark:bg-red-900/20 p-4 shadow-sm shadow-black/5 dark:shadow-none">
              <p className="text-sm text-red-700 dark:text-red-200 mb-1">Absent</p>
              <p className="text-3xl font-bold text-red-900 dark:text-red-100">{stats.absent}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <DatePicker
                label="Date"
                selected={date}
                onChange={(d) => setDate(d || new Date())}
                dateFormat="yyyy-MM-dd"
                maxDate={new Date()}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:border-coin-500 focus:ring-1 focus:ring-coin-500"
              >
                <option value="">All Statuses</option>
                <option value="present">Present</option>
                <option value="late">Late</option>
                <option value="absent">Absent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search</label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Guard name..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:border-coin-500 focus:ring-1 focus:ring-coin-500"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleFilter}
                className="w-full px-6 py-2 bg-coin-700 hover:bg-coin-600 text-white rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-coin-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950"
              >
                Apply
              </button>
            </div>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Guard</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Site</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Check In</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Check Out</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Hours</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Status</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Supervisor</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {attendance.data && attendance.data.length > 0 ? (
                  attendance.data.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                      <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">{record.guard.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{record.guard.employee_id}</div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3">
                        {record.site ? (
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{record.site.client_name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{record.site.name}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">N/A</span>
                        )}
                      </td>
                      <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {record.check_in_time || '-'}
                      </td>
                      <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {record.check_out_time || '-'}
                      </td>
                      <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {record.hours_worked}h
                          {record.overtime_hours > 0 && (
                            <span className="text-xs text-orange-600 dark:text-orange-300 ml-1">
                              (+{record.overtime_hours}h OT)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
                        {getStatusBadge(record.status)}
                      </td>
                      <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {record.supervisor}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      No attendance records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination - Only show if we have multiple pages */}
          {meta.last_page > 1 && (
            <div className="bg-gray-50 dark:bg-gray-950 px-4 sm:px-6 py-4 border-t border-gray-200 dark:border-gray-800">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Showing {meta.from} to {meta.to} of {meta.total}
                </div>
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  {links.map((link, index) => (
                    <Link
                      key={index}
                      href={link.url || '#'}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${
                        link.active
                          ? 'bg-coin-700 text-white'
                          : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                      dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Scanner Modal */}
        <ScannerModal
          open={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          activeScan={activeScan}
        />
      </div>
    </SupervisorLayout>
  );
}