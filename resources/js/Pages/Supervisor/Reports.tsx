import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import SupervisorLayout from '@/Layouts/SupervisorLayout';
import IconMapper from '@/Components/IconMapper';
import Modal from '@/Components/Modal';
import { toast } from 'react-hot-toast';

interface AbsenceLeader {
  id: number;
  name: string;
  employee_id: string;
  absent_count: number;
}

interface AttendanceRecord {
  id: number;
  date: string;
  guard_name: string;
  employee_id: string;
  site_name: string;
  client_name: string;
  check_in: string | null;
  check_out: string | null;
  hours: number;
  status: string;
  supervisor: string;
}

interface DateRange {
  from: string;
  to: string;
}

interface Props {
  attendanceSummary: Record<string, number>;
  absenceLeaders: AbsenceLeader[];
  attendanceRecords?: {
    data: AttendanceRecord[];
    links: any[];
    meta: {
      from: number;
      to: number;
      total: number;
      last_page: number;
      current_page: number;
    };
  };
  sitesCount: number;
  todayAttendanceCount: number;
  totalGuards: number;
  dateRange: DateRange;
  roleType: string;
  isSergeant: boolean;
}

export default function Reports({
  attendanceSummary,
  absenceLeaders,
  attendanceRecords,
  sitesCount,
  todayAttendanceCount,
  totalGuards,
  dateRange,
  roleType,
  isSergeant,
}: Props) {
  const [fromDate, setFromDate] = useState(dateRange?.from || '');
  const [toDate, setToDate] = useState(dateRange?.to || '');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);

  const present = attendanceSummary.present || 0;
  const late = attendanceSummary.late || 0;
  const absent = attendanceSummary.absent || 0;
  const total = present + late + absent;
  const attendanceRate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

  const records = attendanceRecords?.data || [];
  const meta = attendanceRecords?.meta || { from: 0, to: 0, total: 0, last_page: 1, current_page: 1 };

  const handleFilter = () => {
    router.get(route('supervisor.reports'), {
      from: fromDate,
      to: toDate,
    }, { preserveState: true, preserveScroll: true });
  };

  const handleExportPdf = () => {
    const url = route('supervisor.reports.pdf', { from: fromDate, to: toDate });
    window.open(url, '_blank');
  };

  const handleExportCsv = () => {
    const url = route('supervisor.reports.csv', { from: fromDate, to: toDate });
    window.open(url, '_blank');
  };

  const handleEmailReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSending(true);
    router.post(route('supervisor.reports.email'), {
      email,
      from: fromDate,
      to: toDate,
    }, {
      preserveState: true,
      onSuccess: () => {
        toast.success(`Report sent to ${email}`);
        setShowEmailModal(false);
        setEmail('');
        setSending(false);
      },
      onError: () => {
        toast.error('Failed to send report');
        setSending(false);
      },
    });
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      present: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
      late: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
      absent: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
      half_day: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200',
    };
    return (
      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${badges[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
      </span>
    );
  };

  return (
    <SupervisorLayout title="Reports">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Head title="Reports" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Header */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-coin-100 dark:bg-coin-900/20 rounded-full flex items-center justify-center">
                <IconMapper name="FileText" size={24} className="text-coin-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Reports</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Performance and attendance insights</p>
              </div>
            </div>
          </div>

          {/* Date Range + Export Buttons */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">From Date</label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:border-coin-500 focus:ring-1 focus:ring-coin-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">To Date</label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:border-coin-500 focus:ring-1 focus:ring-coin-500"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleFilter}
                  className="px-4 py-2 bg-coin-700 hover:bg-coin-600 text-white rounded-lg font-medium text-sm"
                >
                  Apply
                </button>
                <button
                  onClick={handleExportPdf}
                  className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <IconMapper name="FileText" size={16} />
                  PDF
                </button>
                <button
                  onClick={handleExportCsv}
                  className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <IconMapper name="Download" size={16} />
                  CSV
                </button>
                <button
                  onClick={() => setShowEmailModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <IconMapper name="Mail" size={16} />
                  Email
                </button>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-coin-100 dark:bg-coin-900/20 rounded-lg flex items-center justify-center">
                  <IconMapper name="Users" size={20} className="text-coin-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalGuards}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Guards</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <IconMapper name="MapPin" size={20} className="text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{sitesCount}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Active Sites</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <IconMapper name="ClipboardCheck" size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{todayAttendanceCount}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Checked In Today</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${attendanceRate >= 80 ? 'bg-green-100 dark:bg-green-900/20' : attendanceRate >= 60 ? 'bg-yellow-100 dark:bg-yellow-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
                  <IconMapper name="TrendingUp" size={20} className={attendanceRate >= 80 ? 'text-green-600' : attendanceRate >= 60 ? 'text-yellow-600' : 'text-red-600'} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{attendanceRate}%</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">30-Day Rate</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Attendance Summary */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <IconMapper name="PieChart" size={20} className="text-coin-500" />
                Attendance Breakdown
              </h3>

              {total === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <IconMapper name="ClipboardX" size={48} className="mx-auto mb-2 opacity-50" />
                  <p>No attendance data available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
                    {present > 0 && <div className="bg-green-500 h-full" style={{ width: `${(present / total) * 100}%` }} title={`Present: ${present}`} />}
                    {late > 0 && <div className="bg-yellow-500 h-full" style={{ width: `${(late / total) * 100}%` }} title={`Late: ${late}`} />}
                    {absent > 0 && <div className="bg-red-500 h-full" style={{ width: `${(absent / total) * 100}%` }} title={`Absent: ${absent}`} />}
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                      <p className="text-2xl font-bold text-green-700 dark:text-green-300">{present}</p>
                      <p className="text-xs text-green-600 dark:text-green-400">Present</p>
                    </div>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
                      <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{late}</p>
                      <p className="text-xs text-yellow-600 dark:text-yellow-400">Late</p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                      <p className="text-2xl font-bold text-red-700 dark:text-red-300">{absent}</p>
                      <p className="text-xs text-red-600 dark:text-red-400">Absent</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Absence Leaders */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <IconMapper name="AlertTriangle" size={20} className="text-red-500" />
                Top Absences
              </h3>
              {absenceLeaders.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <IconMapper name="CheckCircle" size={48} className="mx-auto mb-2 text-green-500" />
                  <p>No absences recorded - Great job!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {absenceLeaders.map((guard, index) => (
                    <div key={guard.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-red-500 text-white' : index === 1 ? 'bg-red-400 text-white' : index === 2 ? 'bg-red-300 text-white' : 'bg-gray-300 text-gray-700'}`}>
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{guard.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{guard.employee_id}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-red-600 dark:text-red-400">{guard.absent_count}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">absences</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Attendance Records Table */}
          {records.length > 0 && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-800">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <IconMapper name="ClipboardList" size={20} className="text-coin-500" />
                  Attendance Records
                  <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                    ({meta.from}-{meta.to} of {meta.total})
                  </span>
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-[900px] w-full divide-y divide-gray-200 dark:divide-gray-800">
                  <thead className="bg-gray-50 dark:bg-gray-950">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Guard</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Site</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">In</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Out</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Hrs</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {records.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{record.date}</td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{record.guard_name}</div>
                          <div className="text-xs text-gray-500">{record.employee_id}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{record.site_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{record.check_in || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{record.check_out || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{record.hours}h</td>
                        <td className="px-4 py-3">{getStatusBadge(record.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              {meta.last_page > 1 && (
                <div className="px-4 sm:px-6 py-4 bg-gray-50 dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      Showing {meta.from} to {meta.to} of {meta.total}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {Array.from({ length: meta.last_page }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => router.get(route('supervisor.reports', { from: fromDate, to: toDate, page }), {}, { preserveState: true })}
                          className={`px-3 py-1 rounded-lg text-sm font-medium ${
                            page === meta.current_page
                              ? 'bg-coin-700 text-white'
                              : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick Links */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href={route('supervisor.attendance')}
              className="flex items-center gap-3 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm hover:shadow-md transition"
            >
              <div className="w-10 h-10 bg-coin-100 dark:bg-coin-900/20 rounded-lg flex items-center justify-center">
                <IconMapper name="ClipboardList" size={20} className="text-coin-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">View Attendance</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Check daily records</p>
              </div>
            </Link>
            <Link
              href={route('supervisor.analytics')}
              className="flex items-center gap-3 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm hover:shadow-md transition"
            >
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <IconMapper name="BarChart3" size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">Analytics</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Detailed metrics</p>
              </div>
            </Link>
            <Link
              href={route('supervisor.guards')}
              className="flex items-center gap-3 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm hover:shadow-md transition"
            >
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <IconMapper name="Users" size={20} className="text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">Manage Guards</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Check-in/out guards</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Email Report Modal */}
      <Modal show={showEmailModal} onClose={() => setShowEmailModal(false)}>
        <form onSubmit={handleEmailReport} className="p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Email Attendance Report</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Send report for period <strong>{fromDate}</strong> to <strong>{toDate}</strong> as PDF attachment.
          </p>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Recipient Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="email@example.com"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:border-coin-500 focus:ring-1 focus:ring-coin-500"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowEmailModal(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending}
              className="px-4 py-2 bg-coin-700 hover:bg-coin-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {sending ? 'Sending...' : 'Send Report'}
            </button>
          </div>
        </form>
      </Modal>
    </SupervisorLayout>
  );
}
