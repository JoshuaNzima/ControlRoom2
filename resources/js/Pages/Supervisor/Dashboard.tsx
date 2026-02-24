import React, { useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/SupervisorLayout';
import IconMapper from '@/Components/IconMapper';
import { Link } from '@inertiajs/react';

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
  currentDate: string;
  activeGuards: number;
}

export default function Dashboard({
  stats = {},
  attendanceToday = { present: 0, on_duty: 0, completed: 0, absent: 0 },
  currentDate = new Date().toLocaleDateString(),
  activeGuards = 0,
}: Props) {
  // Redirect to overview page
  useEffect(() => {
    router.get('/supervisor/overview', {}, { replace: true });
  }, []);

  return (
    <DashboardLayout title="Dashboard">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Head title="Dashboard" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-coin-600 via-coin-500 to-coin-400 rounded-2xl shadow-xl p-6 text-white mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold mb-1">Supervisor Dashboard</h1>
                <p className="text-white/80">{currentDate}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm opacity-90">Active Guards</p>
                  <h2 className="text-4xl font-bold font-mono">{activeGuards}</h2>
                </div>
                <div className="flex flex-col gap-2">
                  <Link
                    href="/supervisor/overview"
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-semibold transition flex items-center gap-2"
                  >
                    <IconMapper name="LayoutDashboard" size={18} />
                    Overview
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Link
              href="/supervisor/overview"
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition"
            >
              <div className="w-12 h-12 bg-coin-500 rounded-lg flex items-center justify-center mb-4">
                <IconMapper name="LayoutDashboard" size={24} className="text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Overview</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Stats & attendance summary</p>
            </Link>

            <Link
              href="/supervisor/guards"
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition"
            >
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mb-4">
                <IconMapper name="Users" size={24} className="text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Guards</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Manage & check-in guards</p>
            </Link>

            <Link
              href="/supervisor/analytics"
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition"
            >
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-4">
                <IconMapper name="BarChart3" size={24} className="text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Analytics</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Performance & trends</p>
            </Link>

            <Link
              href="/supervisor/assignments"
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition"
            >
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mb-4">
                <IconMapper name="MapPin" size={24} className="text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Assignments</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Site deployments</p>
            </Link>
          </div>

          {/* Today's Summary */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <IconMapper name="Activity" size={20} className="text-coin-500" />
              Today's Attendance
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10 rounded-xl p-5 border-2 border-green-200 dark:border-green-900/30">
                <div className="flex items-center gap-3">
                  <IconMapper name="CheckCircle" size={28} className="text-green-600 dark:text-green-400" />
                  <div>
                    <p className="text-3xl font-black text-gray-900 dark:text-gray-100">{attendanceToday.present}</p>
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Present</p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 rounded-xl p-5 border-2 border-blue-200 dark:border-blue-900/30">
                <div className="flex items-center gap-3">
                  <IconMapper name="Clock" size={28} className="text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="text-3xl font-black text-gray-900 dark:text-gray-100">{attendanceToday.on_duty}</p>
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">On Duty</p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/10 rounded-xl p-5 border-2 border-purple-200 dark:border-purple-900/30">
                <div className="flex items-center gap-3">
                  <IconMapper name="CheckSquare" size={28} className="text-purple-600 dark:text-purple-400" />
                  <div>
                    <p className="text-3xl font-black text-gray-900 dark:text-gray-100">{attendanceToday.completed}</p>
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Completed</p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/10 rounded-xl p-5 border-2 border-red-200 dark:border-red-900/30">
                <div className="flex items-center gap-3">
                  <IconMapper name="XCircle" size={28} className="text-red-600 dark:text-red-400" />
                  <div>
                    <p className="text-3xl font-black text-gray-900 dark:text-gray-100">{attendanceToday.absent}</p>
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Absent</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
