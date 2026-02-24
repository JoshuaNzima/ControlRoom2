import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import ControlRoomLayout from '@/Layouts/ControlRoomLayout';
import { Card } from '@/Components/ui/card';
import PageHeader from '@/Components/ui/page-header';
import EmptyState from '@/Components/ui/empty-state';
import IconMapper from '@/Components/IconMapper';
import Modal from '@/Components/Modal';

type AttendanceRecord = {
  id: number;
  guard_id: number;
  date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  status: string;
  hours_worked: number | null;
  overtime_hours: number | null;
  check_in_notes: string | null;
  check_out_notes: string | null;
  guard_relation: {
    id: number;
    name: string;
    employee_id: string;
  } | null;
  client_site: {
    id: number;
    name: string;
    client: {
      id: number;
      name: string;
    } | null;
  } | null;
  supervisor: {
    id: number;
    name: string;
  } | null;
};

type PageProps = {
  attendance: {
    data: AttendanceRecord[];
    links: any[];
    meta: any;
  };
  filters: {
    search?: string;
    status?: string;
    site_id?: string;
    date?: string;
    per_page?: string;
  };
  sites: Array<{
    id: number;
    name: string;
    client: { id: number; name: string } | null;
  }>;
  isTuesday: boolean;
  isSuperAdmin: boolean;
  lastWeekRange: {
    start: string;
    end: string;
    display: string;
  };
  canEdit: boolean;
};

const statusColors: Record<string, string> = {
  present: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
  absent: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
  late: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
  'half_day': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200',
  leave: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
};

export default function AttendanceIndex() {
  const { attendance, filters, sites, isTuesday, isSuperAdmin, lastWeekRange, canEdit } = usePage<PageProps>().props;

  const [search, setSearch] = useState(filters.search || '');
  const [status, setStatus] = useState(filters.status || '');
  const [siteId, setSiteId] = useState(filters.site_id || '');
  const [date, setDate] = useState(filters.date || '');
  const [perPage, setPerPage] = useState(filters.per_page || '20');

  const [showInfoModal, setShowInfoModal] = useState(false);

  const applyFilters = () => {
    const query: Record<string, any> = {
      search: search || undefined,
      status: status || undefined,
      site_id: siteId || undefined,
      date: date || undefined,
      per_page: perPage,
    };
    router.get(route('control-room.attendance.index'), query, { preserveState: true, preserveScroll: true });
  };

  const resetFilters = () => {
    setSearch('');
    setStatus('');
    setSiteId('');
    setDate('');
    setPerPage('20');
    router.get(route('control-room.attendance.index'), {}, { preserveState: true, preserveScroll: true });
  };

  const formatTime = (time: string | null) => {
    if (!time) return '--:--';
    // Handle both full datetime and time-only formats
    if (time.includes('T')) {
      return time.split('T')[1].substring(0, 5);
    }
    if (time.includes(' ')) {
      return time.split(' ')[1].substring(0, 5);
    }
    return time.substring(0, 5);
  };

  return (
    <ControlRoomLayout title="Attendance History">
      <Head title="Attendance History" />

      <div className="max-w-7xl mx-auto mt-6 px-4 sm:px-6 lg:px-8 space-y-6">
        <PageHeader
          title={`Attendance History - ${lastWeekRange.display}`}
          description="Previous week's attendance records. Control Room can edit only on Tuesdays."
          actions={(
            <>
              <button
                onClick={() => setShowInfoModal(true)}
                className="w-full sm:w-auto px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <IconMapper name="Info" size={18} className="inline mr-2" />
                Edit Policy
              </button>
            </>
          )}
        />

        {/* Edit Window Alert */}
        {!canEdit && !isSuperAdmin && (
          <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-start gap-3">
              <IconMapper name="AlertTriangle" className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Editing Currently Disabled</h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  Today is not Tuesday. Attendance records can only be edited on Tuesdays for the previous week's data.
                  Please contact a Super Admin for emergency edits.
                </p>
              </div>
            </div>
          </div>
        )}

        {canEdit && isTuesday && !isSuperAdmin && (
          <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <div className="flex items-start gap-3">
              <IconMapper name="CheckCircle" className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-800 dark:text-green-200">Tuesday Edit Window Open</h4>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  You can edit attendance records from the previous week ({lastWeekRange.display}) today only.
                  This window closes at midnight.
                </p>
              </div>
            </div>
          </div>
        )}

        {isSuperAdmin && (
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <IconMapper name="Shield" className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800 dark:text-blue-200">Super Admin Access</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  You can edit any attendance record at any time. All edits will be logged with your user ID.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <Card className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search Guard</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400 dark:text-gray-500">
                  <IconMapper name="Search" size={18} />
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                  placeholder="Name or Employee ID..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-coin-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              >
                <option value="">All Statuses</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
                <option value="half_day">Half Day</option>
                <option value="leave">Leave</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Site</label>
              <select
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              >
                <option value="">All Sites</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name} {site.client ? `(${site.client.name})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={lastWeekRange.start}
                max={lastWeekRange.end}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={applyFilters}
                className="px-4 py-2 bg-coin-600 hover:bg-coin-700 text-white rounded-lg"
              >
                Apply
              </button>
              <button
                onClick={resetFilters}
                className="px-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200"
              >
                Reset
              </button>
            </div>
          </div>
        </Card>

        {/* Attendance Table */}
        <Card>
          {attendance.data.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="No attendance records"
                description="No attendance records found for the previous week with the current filters."
                size="sm"
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-950">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Guard</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Site</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Check In</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Check Out</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Hours</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {attendance.data.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                        {record.date}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                        <div className="font-medium">{record.guard_relation?.name || 'Unknown'}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{record.guard_relation?.employee_id || ''}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {record.client_site ? (
                          <div>
                            <div className="font-medium">{record.client_site.name}</div>
                            {record.client_site.client && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">{record.client_site.client.name}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {formatTime(record.check_in_time)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {formatTime(record.check_out_time)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {record.hours_worked !== null ? (
                          <div>
                            <span>{record.hours_worked.toFixed(1)}h</span>
                            {record.overtime_hours && record.overtime_hours > 0 && (
                              <span className="ml-1 text-xs text-amber-600 dark:text-amber-400">+{record.overtime_hours.toFixed(1)} OT</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 text-xs rounded-full ${statusColors[record.status] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'}`}>
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Link
                          href={route('control-room.attendance.edit', { attendance: record.id })}
                          className={`inline-flex items-center px-3 py-1 rounded text-xs font-medium ${
                            canEdit
                              ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:hover:bg-amber-900/50'
                              : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500 cursor-not-allowed'
                          }`}
                          onClick={(e) => {
                            if (!canEdit) {
                              e.preventDefault();
                              alert('Editing is only available on Tuesdays for Control Room operators. Please contact a Super Admin.');
                            }
                          }}
                        >
                          <IconMapper name="Pencil" size={14} className="mr-1" />
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {attendance.meta?.last_page > 1 && (
            <div className="p-4 border-t dark:border-gray-700 flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Page {attendance.meta.current_page} of {attendance.meta.last_page}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {attendance.links
                  .filter((l: any) => l.url !== null)
                  .map((l: any, idx: number) => (
                    <button
                      key={idx}
                      className={`px-3 py-1 rounded border dark:border-gray-700 ${
                        l.active
                          ? 'bg-coin-600 text-white'
                          : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200'
                      }`}
                      onClick={() => router.get(l.url, {}, { preserveScroll: true, preserveState: true })}
                      dangerouslySetInnerHTML={{ __html: l.label }}
                    />
                  ))}
              </div>
            </div>
          )}
        </Card>

        {/* Info Modal */}
        <Modal show={showInfoModal} onClose={() => setShowInfoModal(false)} maxWidth="md">
          <div className="p-6 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Attendance Edit Policy
            </h3>
            <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">Control Room Operators</h4>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Can only edit attendance records on <strong>Tuesdays</strong></li>
                  <li>Can only edit records from the <strong>previous week</strong> (Monday-Sunday)</li>
                  <li>Must provide a reason for each edit</li>
                  <li>Edit window closes at midnight on Tuesday</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">Super Admins</h4>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Can edit any attendance record at any time</li>
                  <li>All edits are logged with user ID and timestamp</li>
                  <li>No restrictions apply</li>
                </ul>
              </div>
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
                <p className="text-yellow-800 dark:text-yellow-200">
                  <strong>Current Period:</strong> {lastWeekRange.display}
                </p>
                <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                  {isTuesday
                    ? 'Today is Tuesday - Edit window is currently OPEN'
                    : 'Today is not Tuesday - Edit window is currently CLOSED'}
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowInfoModal(false)}
                className="px-4 py-2 bg-coin-600 hover:bg-coin-700 text-white rounded"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </ControlRoomLayout>
  );
}
