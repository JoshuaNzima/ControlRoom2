import React from 'react';
import { Head, Link } from '@inertiajs/react';
import SupervisorLayout from '@/Layouts/SupervisorLayout';
import IconMapper from '@/Components/IconMapper';

interface AttendanceRecord {
  id: number;
  date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  status: string;
  hours_worked: number | null;
  site_name: string | null;
}

interface Guard {
  id: number;
  employee_id: string;
  name: string;
  phone: string;
  email: string | null;
  status: string;
  guard_type: 'permanent' | 'reliever' | 'standby';
  hire_date: string | null;
  supervisor: string | null;
  grade: string | null;
  zone: string | null;
  current_assignment: {
    site_name: string;
    client_name: string;
    start_date: string;
  } | null;
}

interface Props {
  guard: Guard;
  recentAttendance: AttendanceRecord[];
  roleType: string;
  isSergeant: boolean;
}

export default function GuardShow({ guard, recentAttendance, roleType, isSergeant }: Props) {
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
      inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      suspended: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
      dismissed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
      absconded: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
    };
    return styles[status] || styles.inactive;
  };

  const getAttendanceStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      present: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
      late: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
      absent: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
      half_day: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200',
    };
    return styles[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  };

  const getGuardTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      permanent: 'bg-coin-100 text-coin-800 dark:bg-coin-900/30 dark:text-coin-200',
      reliever: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
      standby: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
    };
    return styles[type] || styles.permanent;
  };

  // Calculate attendance stats
  const presentCount = recentAttendance.filter(a => a.status === 'present').length;
  const lateCount = recentAttendance.filter(a => a.status === 'late').length;
  const absentCount = recentAttendance.filter(a => a.status === 'absent').length;
  const attendanceRate = recentAttendance.length > 0 
    ? Math.round(((presentCount + lateCount) / recentAttendance.length) * 100) 
    : 0;

  return (
    <SupervisorLayout title={`${guard.name} - Details`}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Head title={`${guard.name} - Guard Details`} />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Header */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-gradient-to-br from-coin-500 to-coin-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {guard.name.charAt(0)}
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{guard.name}</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{guard.employee_id}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(guard.status)}`}>
                  {guard.status.charAt(0).toUpperCase() + guard.status.slice(1)}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getGuardTypeBadge(guard.guard_type)}`}>
                  {guard.guard_type.charAt(0).toUpperCase() + guard.guard_type.slice(1)}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Guard Info */}
            <div className="space-y-6">
              {/* Basic Info Card */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <IconMapper name="User" size={20} className="text-coin-500" />
                  Basic Information
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Phone</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{guard.phone || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Email</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{guard.email || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Hire Date</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{guard.hire_date || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Grade</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{guard.grade || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Zone</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{guard.zone || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Supervisor</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{guard.supervisor || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Current Assignment */}
              {guard.current_assignment && (
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <IconMapper name="MapPin" size={20} className="text-coin-500" />
                    Current Assignment
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Client</span>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{guard.current_assignment.client_name}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Site</span>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{guard.current_assignment.site_name}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Assigned Since</span>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{guard.current_assignment.start_date}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Attendance Summary */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <IconMapper name="BarChart3" size={20} className="text-coin-500" />
                  30-Day Attendance Summary
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/30 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">{presentCount}</p>
                    <p className="text-xs text-green-600 dark:text-green-400">Present</p>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/30 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{lateCount}</p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">Late</p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-red-700 dark:text-red-300">{absentCount}</p>
                    <p className="text-xs text-red-600 dark:text-red-400">Absent</p>
                  </div>
                  <div className="bg-coin-50 dark:bg-coin-900/20 border border-coin-200 dark:border-coin-900/30 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-coin-700 dark:text-coin-300">{attendanceRate}%</p>
                    <p className="text-xs text-coin-600 dark:text-coin-400">Rate</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Attendance History */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <IconMapper name="ClipboardList" size={20} className="text-coin-500" />
                    Recent Attendance (Last 30 Days)
                  </h3>
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                    <thead className="bg-gray-50 dark:bg-gray-950">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">Check In</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">Check Out</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">Hours</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">Site</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                      {recentAttendance.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                            No attendance records found
                          </td>
                        </tr>
                      ) : (
                        recentAttendance.map((record) => (
                          <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{record.date}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getAttendanceStatusBadge(record.status)}`}>
                                {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{record.check_in_time || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{record.check_out_time || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{record.hours_worked ?? '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{record.site_name || '-'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-800">
                  {recentAttendance.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                      No attendance records found
                    </div>
                  ) : (
                    recentAttendance.slice(0, 10).map((record) => (
                      <div key={record.id} className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900 dark:text-gray-100">{record.date}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getAttendanceStatusBadge(record.status)}`}>
                            {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">In:</span>{' '}
                            <span className="text-gray-900 dark:text-gray-100">{record.check_in_time || '-'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Out:</span>{' '}
                            <span className="text-gray-900 dark:text-gray-100">{record.check_out_time || '-'}</span>
                          </div>
                          {record.hours_worked && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Hours:</span>{' '}
                              <span className="text-gray-900 dark:text-gray-100">{record.hours_worked}</span>
                            </div>
                          )}
                          {record.site_name && (
                            <div className="col-span-2">
                              <span className="text-gray-500 dark:text-gray-400">Site:</span>{' '}
                              <span className="text-gray-900 dark:text-gray-100">{record.site_name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                  {recentAttendance.length > 10 && (
                    <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      + {recentAttendance.length - 10} more records
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Back Button */}
          <div className="mt-6">
            <Link
              href={route('supervisor.guards')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg font-medium transition"
            >
              <IconMapper name="ArrowLeft" size={18} />
              Back to Guards
            </Link>
          </div>
        </div>
      </div>
    </SupervisorLayout>
  );
}
