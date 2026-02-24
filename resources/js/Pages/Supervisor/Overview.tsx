import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/SupervisorLayout';
import IconMapper from '@/Components/IconMapper';
import { Link } from '@inertiajs/react';
import { format } from 'date-fns';

interface Props {
  stats: Record<string, {
    label: string;
    count: number;
    description: string;
    color: string;
    badge: string;
    icon: string;
  }>;
  attendanceToday: {
    present: number;
    on_duty: number;
    completed: number;
    absent: number;
  };
  attendanceTrend: Array<{
    date: string;
    present: number;
    on_duty: number;
    absent: number;
  }>;
  shiftStats: Array<{
    type: string;
    count: number;
  }>;
  activeGuards: number;
  currentDate: string;
}

export default function Overview({
  stats = {},
  attendanceToday = { present: 0, on_duty: 0, completed: 0, absent: 0 },
  attendanceTrend = [],
  shiftStats = [],
  activeGuards = 0,
  currentDate = new Date().toLocaleDateString(),
}: Props) {
  const [time, setTime] = useState<string>(new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }));

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const getIcon = (iconName: string) => {
    const iconMap: Record<string, string> = {
      '🛡️': 'Shield',
      '🔄': 'RefreshCw',
      '⏸️': 'Pause',
      '📋': 'ClipboardList',
      '⚠️': 'AlertTriangle',
      '❌': 'XCircle',
    };
    return iconMap[iconName] || 'Activity';
  };

  return (
    <DashboardLayout title="Overview">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Head title="Overview" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-coin-600 via-coin-500 to-coin-400 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold mb-1">Supervisor Overview</h1>
                <p className="text-white/80">{currentDate}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm opacity-90">Current Time</p>
                  <h2 className="text-4xl font-bold font-mono">{time}</h2>
                </div>
                <div className="flex flex-col gap-2">
                  <Link
                    href="/supervisor/attendance"
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-semibold transition flex items-center gap-2"
                  >
                    <IconMapper name="Clipboard" size={18} />
                    Attendance
                  </Link>
                  <Link
                    href="/supervisor/guards"
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-semibold transition flex items-center gap-2"
                  >
                    <IconMapper name="Users" size={18} />
                    Guards ({activeGuards})
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          {Object.keys(stats).length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.values(stats).map((stat, idx) => (
                <StatCard
                  key={idx}
                  label={stat.label}
                  count={stat.count}
                  description={stat.description}
                  color={stat.color}
                  badge={stat.badge}
                  icon={getIcon(stat.icon)}
                />
              ))}
            </div>
          )}

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left - Attendance Summary & Trends */}
            <div className="lg:col-span-2 space-y-6">
              {/* Attendance Summary */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <IconMapper name="Activity" size={20} className="text-coin-500" />
                  Today's Attendance
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <AttendanceCard
                    icon="CheckCircle"
                    label="Present"
                    value={attendanceToday.present}
                    color="green"
                  />
                  <AttendanceCard
                    icon="Clock"
                    label="On Duty"
                    value={attendanceToday.on_duty}
                    color="blue"
                  />
                  <AttendanceCard
                    icon="CheckSquare"
                    label="Completed"
                    value={attendanceToday.completed}
                    color="purple"
                  />
                  <AttendanceCard
                    icon="XCircle"
                    label="Absent"
                    value={attendanceToday.absent}
                    color="red"
                  />
                </div>
              </div>

              {/* 7-Day Trend */}
              {attendanceTrend.length > 0 && (
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <IconMapper name="TrendingUp" size={20} className="text-coin-500" />
                    7-Day Attendance Trend
                  </h3>
                  <div className="space-y-3">
                    {attendanceTrend.map((day, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <span className="text-sm text-gray-600 dark:text-gray-400 w-16">{day.date}</span>
                        <div className="flex-1 flex gap-1 h-6 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
                          <div
                            className="bg-green-500"
                            style={{ width: `${(day.present / Math.max(day.present + day.absent, 1)) * 100}%` }}
                            title={`Present: ${day.present}`}
                          />
                          <div
                            className="bg-red-400"
                            style={{ width: `${(day.absent / Math.max(day.present + day.absent, 1)) * 100}%` }}
                            title={`Absent: ${day.absent}`}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 w-20 text-right">
                          {day.present}/{day.present + day.absent}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 mt-4 text-sm">
                    <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                      <span className="w-3 h-3 bg-green-500 rounded" /> Present
                    </span>
                    <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                      <span className="w-3 h-3 bg-red-400 rounded" /> Absent
                    </span>
                  </div>
                </div>
              )}

              {/* Shift Stats */}
              {shiftStats.length > 0 && (
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <IconMapper name="Clock" size={20} className="text-coin-500" />
                    Today's Shift Distribution
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {shiftStats.map((shift, idx) => (
                      <div key={idx} className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{shift.count}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{shift.type}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right - Quick Actions */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <IconMapper name="Zap" size={20} className="text-coin-500" />
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <Link
                    href="/supervisor/attendance"
                    className="flex items-center gap-3 p-3 bg-coin-50 dark:bg-coin-900/20 border border-coin-200 dark:border-coin-900/30 rounded-lg hover:bg-coin-100 dark:hover:bg-coin-900/30 transition"
                  >
                    <div className="w-10 h-10 bg-coin-500 rounded-full flex items-center justify-center">
                      <IconMapper name="Clipboard" size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">Take Attendance</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Check in/out guards</p>
                    </div>
                  </Link>
                  <Link
                    href="/supervisor/guards"
                    className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/30 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition"
                  >
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                      <IconMapper name="Users" size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">View All Guards</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Guard list & details</p>
                    </div>
                  </Link>
                  <Link
                    href="/supervisor/assignments"
                    className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition"
                  >
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <IconMapper name="MapPin" size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">Site Assignments</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Manage guard deployments</p>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ label, count, description, color, badge, icon }: {
  label: string;
  count: number;
  description: string;
  color: string;
  badge: string;
  icon: string;
}) {
  const colorClasses: Record<string, string> = {
    green: 'border-green-500 bg-gradient-to-br from-green-50 to-green-100 dark:border-green-900/40 dark:from-green-900/20 dark:to-green-900/10',
    blue: 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 dark:border-blue-900/40 dark:from-blue-900/20 dark:to-blue-900/10',
    yellow: 'border-yellow-500 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:border-yellow-900/40 dark:from-yellow-900/20 dark:to-yellow-900/10',
    gray: 'border-gray-500 bg-gradient-to-br from-gray-50 to-gray-100 dark:border-gray-800 dark:from-gray-900 dark:to-gray-800',
    orange: 'border-orange-500 bg-gradient-to-br from-orange-50 to-orange-100 dark:border-orange-900/40 dark:from-orange-900/20 dark:to-orange-900/10',
    red: 'border-red-500 bg-gradient-to-br from-red-50 to-red-100 dark:border-red-900/40 dark:from-red-900/20 dark:to-red-900/10',
  };

  const badgeClasses: Record<string, string> = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-500',
    gray: 'bg-gray-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
  };

  return (
    <div className={`rounded-xl p-4 border-t-4 ${colorClasses[color]} shadow-md hover:shadow-xl transition-all`}>
      <div className="flex items-center justify-between mb-2">
        <IconMapper name={icon} size={24} className="text-gray-600 dark:text-gray-400" />
        <span className={`px-2 py-1 text-xs font-bold text-white rounded-full ${badgeClasses[color]}`}>{badge}</span>
      </div>
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">{label}</p>
      <p className="text-3xl font-black text-gray-900 dark:text-gray-100 mb-1">{count}</p>
      <p className="text-xs text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  );
}

function AttendanceCard({ icon, label, value, color }: {
  icon: string;
  label: string;
  value: number;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    green: 'from-green-50 to-green-100 border-green-200 dark:from-green-900/20 dark:to-green-900/10 dark:border-green-900/30',
    blue: 'from-blue-50 to-blue-100 border-blue-200 dark:from-blue-900/20 dark:to-blue-900/10 dark:border-blue-900/30',
    purple: 'from-purple-50 to-purple-100 border-purple-200 dark:from-purple-900/20 dark:to-purple-900/10 dark:border-purple-900/30',
    red: 'from-red-50 to-red-100 border-red-200 dark:from-red-900/20 dark:to-red-900/10 dark:border-red-900/30',
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl p-5 border-2 shadow-md hover:shadow-lg transition-all`}>
      <div className="flex items-center gap-3">
        <IconMapper name={icon} size={28} className="text-gray-600 dark:text-gray-400" />
        <div>
          <p className="text-3xl font-black text-gray-900 dark:text-gray-100">{value}</p>
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">{label}</p>
        </div>
      </div>
    </div>
  );
}
