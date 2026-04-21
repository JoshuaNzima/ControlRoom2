import React from 'react';
import { Head, Link } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/SupervisorLayout';
import IconMapper from '@/Components/IconMapper';

interface Props {
  guardPerformanceMetrics: Array<{
    id: number;
    name: string;
    employee_id: string;
    attendance_rate: number;
    late_count: number;
    absent_count: number;
    total_days: number;
    avg_hours: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  relieversOnDuty: Array<{
    id: number;
    name: string;
    site_name: string;
    on_duty: boolean;
  }>;
  attendanceTrend: Array<{
    date: string;
    present: number;
    on_duty: number;
    absent: number;
  }>;
  relieverTrend: Array<{
    date: string;
    available: number;
  }>;
  siteCoverageStatus: Array<{
    site_id: number;
    site_name: string;
    client_name: string;
    required_guards: number;
    checked_in_guards: number;
    coverage_percentage: number;
    status: 'covered' | 'partial' | 'uncovered';
    guards_on_site: Array<{
      id: number;
      name: string;
      check_in_time: string;
    }>;
  }>;
  stats: Record<string, {
    label: string;
    count: number;
    description: string;
    color: string;
    badge: string;
    icon: string;
  }>;
}

export default function Analytics({
  guardPerformanceMetrics = [],
  relieversOnDuty = [],
  attendanceTrend = [],
  relieverTrend = [],
  siteCoverageStatus = [],
  stats = {},
}: Props) {
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
    <DashboardLayout title="Analytics">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Head title="Analytics" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Header */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-coin-100 dark:bg-coin-900/20 rounded-full flex items-center justify-center">
                <IconMapper name="BarChart3" size={28} className="text-coin-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Analytics Dashboard</h1>
                <p className="text-gray-500 dark:text-gray-400">Performance metrics and trends</p>
              </div>
            </div>
          </div>

          {/* Key Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {Object.values(stats).slice(0, 6).map((stat, idx) => (
              <div key={idx} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <IconMapper name={getIcon(stat.icon)} size={20} className="text-gray-500 dark:text-gray-400" />
                  <span className={`px-2 py-0.5 text-xs font-bold text-white rounded-full ${
                    stat.color === 'green' ? 'bg-green-500' :
                    stat.color === 'blue' ? 'bg-blue-500' :
                    stat.color === 'yellow' ? 'bg-yellow-500' :
                    stat.color === 'red' ? 'bg-red-500' :
                    stat.color === 'orange' ? 'bg-orange-500' :
                    'bg-gray-500'
                  }`}>{stat.badge}</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stat.count}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Guard Performance */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <IconMapper name="Trophy" size={20} className="text-coin-500" />
                Guard Performance (30 Days)
              </h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {guardPerformanceMetrics.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">No performance data available</p>
                ) : (
                  guardPerformanceMetrics.map((guard) => (
                    <div key={guard.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-coin-100 dark:bg-coin-900/20 rounded-full flex items-center justify-center text-coin-600 font-bold text-sm">
                            {guard.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{guard.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{guard.employee_id}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded font-medium ${
                            guard.attendance_rate >= 95 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' :
                            guard.attendance_rate >= 80 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200' :
                            'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                          }`}>
                            {guard.attendance_rate}%
                          </span>
                          <IconMapper 
                            name={guard.trend === 'up' ? 'TrendingUp' : guard.trend === 'down' ? 'TrendingDown' : 'Minus'} 
                            size={16} 
                            className={guard.trend === 'up' ? 'text-green-500' : guard.trend === 'down' ? 'text-red-500' : 'text-gray-500'} 
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-center text-xs">
                        <div className="p-1 bg-white dark:bg-gray-700 rounded">
                          <p className="font-bold text-green-600">{guard.total_days - guard.absent_count}</p>
                          <p className="text-gray-500 dark:text-gray-400">Present</p>
                        </div>
                        <div className="p-1 bg-white dark:bg-gray-700 rounded">
                          <p className="font-bold text-yellow-600">{guard.late_count}</p>
                          <p className="text-gray-500 dark:text-gray-400">Late</p>
                        </div>
                        <div className="p-1 bg-white dark:bg-gray-700 rounded">
                          <p className="font-bold text-red-600">{guard.absent_count}</p>
                          <p className="text-gray-500 dark:text-gray-400">Absent</p>
                        </div>
                        <div className="p-1 bg-white dark:bg-gray-700 rounded">
                          <p className="font-bold text-gray-700 dark:text-gray-300">{guard.avg_hours}h</p>
                          <p className="text-gray-500 dark:text-gray-400">Avg</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Relievers & Trends */}
            <div className="space-y-6">
              {/* Relievers On Duty */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <IconMapper name="RefreshCw" size={20} className="text-coin-500" />
                  Relievers On Duty
                  {relieversOnDuty.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                      {relieversOnDuty.length}
                    </span>
                  )}
                </h3>
                {relieversOnDuty.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">No relievers on duty</p>
                ) : (
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {relieversOnDuty.map((reliever) => (
                      <div key={reliever.id} className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {reliever.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">{reliever.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{reliever.site_name}</p>
                        </div>
                        <span className="w-2 h-2 bg-green-500 rounded-full" title="On Duty" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Attendance Trend Chart */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <IconMapper name="TrendingUp" size={20} className="text-coin-500" />
                  7-Day Attendance Trend
                </h3>
                <div className="space-y-2">
                  {attendanceTrend.map((day, idx) => {
                    const total = day.present + day.absent || 1;
                    const presentPct = (day.present / total) * 100;
                    const absentPct = (day.absent / total) * 100;
                    return (
                      <div key={idx} className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 dark:text-gray-400 w-12">{day.date}</span>
                        <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden flex">
                          <div className="bg-green-500 h-full" style={{ width: `${presentPct}%` }} />
                          <div className="bg-red-400 h-full" style={{ width: `${absentPct}%` }} />
                        </div>
                        <span className="text-xs text-gray-700 dark:text-gray-300 w-16 text-right">
                          {day.present}/{total}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center gap-4 mt-4 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded" /> Present</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-400 rounded" /> Absent</span>
                </div>
              </div>

              {/* Reliever Availability Trend */}
              {relieverTrend.length > 0 && (
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <IconMapper name="Users" size={20} className="text-coin-500" />
                    Reliever Availability
                  </h3>
                  <div className="space-y-2">
                    {relieverTrend.map((day, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 dark:text-gray-400 w-12">{day.date}</span>
                        <div className="flex-1 h-4 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
                          <div 
                            className="h-full bg-blue-500" 
                            style={{ width: `${Math.min((day.available / 10) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-blue-600 dark:text-blue-400 w-8 text-right">{day.available}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Site Coverage Section */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <IconMapper name="MapPin" size={20} className="text-coin-500" />
              Site Coverage Status
              <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                ({siteCoverageStatus.filter(s => s.status === 'covered').length}/{siteCoverageStatus.length} covered)
              </span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {siteCoverageStatus.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 col-span-full text-center py-8">No site coverage data available</p>
              ) : (
                siteCoverageStatus.map((site) => (
                  <div key={site.site_id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{site.site_name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{site.client_name}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        site.status === 'covered' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' :
                        site.status === 'partial' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200' :
                        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                      }`}>
                        {site.status === 'covered' ? 'Covered' : site.status === 'partial' ? 'Partial' : 'Uncovered'}
                      </span>
                    </div>
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                        <span>{site.checked_in_guards} / {site.required_guards} guards</span>
                        <span>{site.coverage_percentage}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all ${
                            site.coverage_percentage >= 100 ? 'bg-green-500' :
                            site.coverage_percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(site.coverage_percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                    {site.guards_on_site.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {site.guards_on_site.map((guard) => (
                          <span key={guard.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-xs rounded">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                            {guard.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
