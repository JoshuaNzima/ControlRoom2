import React from 'react';
import { Head, Link } from '@inertiajs/react';
import SupervisorLayout from '@/Layouts/SupervisorLayout';
import IconMapper from '@/Components/IconMapper';

interface AbsenceLeader {
  id: number;
  name: string;
  employee_id: string;
  absent_count: number;
}

interface Props {
  attendanceSummary: Record<string, number>;
  absenceLeaders: AbsenceLeader[];
  sitesCount: number;
  todayAttendanceCount: number;
  totalGuards: number;
  roleType: string;
  isSergeant: boolean;
}

export default function Reports({ 
  attendanceSummary, 
  absenceLeaders, 
  sitesCount, 
  todayAttendanceCount, 
  totalGuards,
  roleType,
  isSergeant 
}: Props) {
  const present = attendanceSummary.present || 0;
  const late = attendanceSummary.late || 0;
  const absent = attendanceSummary.absent || 0;
  const total = present + late + absent;
  const attendanceRate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

  return (
    <SupervisorLayout title="Reports">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Head title="Reports" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Header */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
            {/* 30-Day Attendance Summary */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <IconMapper name="PieChart" size={20} className="text-coin-500" />
                30-Day Attendance Breakdown
              </h3>
              
              {total === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <IconMapper name="ClipboardX" size={48} className="mx-auto mb-2 opacity-50" />
                  <p>No attendance data available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Progress Bar */}
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
                    {present > 0 && (
                      <div 
                        className="bg-green-500 h-full" 
                        style={{ width: `${(present / total) * 100}%` }}
                        title={`Present: ${present}`}
                      />
                    )}
                    {late > 0 && (
                      <div 
                        className="bg-yellow-500 h-full" 
                        style={{ width: `${(late / total) * 100}%` }}
                        title={`Late: ${late}`}
                      />
                    )}
                    {absent > 0 && (
                      <div 
                        className="bg-red-500 h-full" 
                        style={{ width: `${(absent / total) * 100}%` }}
                        title={`Absent: ${absent}`}
                      />
                    )}
                  </div>

                  {/* Legend */}
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
                Top Absences (30 Days)
              </h3>
              
              {absenceLeaders.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <IconMapper name="CheckCircle" size={48} className="mx-auto mb-2 text-green-500" />
                  <p>No absences recorded - Great job!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {absenceLeaders.map((guard, index) => (
                    <div 
                      key={guard.id} 
                      className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0 ? 'bg-red-500 text-white' : 
                          index === 1 ? 'bg-red-400 text-white' : 
                          index === 2 ? 'bg-red-300 text-white' : 
                          'bg-gray-300 text-gray-700'
                        }`}>
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

          {/* Quick Links */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
    </SupervisorLayout>
  );
}
