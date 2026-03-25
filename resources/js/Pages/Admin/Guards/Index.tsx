import React, { useMemo, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import IconMapper from '@/Components/IconMapper';
import GuardDetailsModal from '@/Components/Guards/GuardDetailsModal';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Pagination } from '@/Components/ui/Pagination';
import { normalizePagination } from '@/utils/pagination';

interface Guard {
  id: number;
  name: string;
  employee_id: string;
  phone?: string;
  email?: string;
  status?: string;
  supervisor?: { id: number; name: string } | null;
  site?: { id: number; name: string } | null;
  is_profile_complete?: boolean;
  is_on_duty?: boolean;
  attendance_rate?: number;
  performance_score?: number;
  shifts_this_month?: number;
  incidents_count?: number;
  joined_date?: string;
}

interface Filters {
  search?: string;
  status?: string;
  per_page?: number | string;
}

interface GuardsIndexProps {
  guards: {
    data: Guard[];
    meta?: any;
    links?: Array<{ url: string | null; label: string; active: boolean }>;
  };
  filters: Filters;
  stats: {
    total_guards: number;
    active_guards: number;
    on_duty_today: number;
    average_attendance: number;
    average_performance: number;
    total_incidents: number;
  };
}

// Animated Counter Component
const AnimatedCounter: React.FC<{ value: number; duration?: number; suffix?: string }> = ({ 
  value, duration = 1000, suffix = '' 
}) => {
  const [count, setCount] = React.useState(0);
  
  React.useEffect(() => {
    let startTime: number;
    let animationFrame: number;
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * value));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);
  
  return <span>{count.toLocaleString()}{suffix}</span>;
};

// Stat Card Component
interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: number | string;
  subtitle: string;
  color: 'red' | 'blue' | 'green' | 'amber' | 'purple' | 'cyan';
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, subtitle, color }) => {
  const colorMap = {
    red: { bg: 'bg-red-50 dark:bg-red-950/20', border: 'border-red-200 dark:border-red-800', icon: 'bg-red-600 text-white', text: 'text-red-700 dark:text-red-300' },
    blue: { bg: 'bg-blue-50 dark:bg-blue-950/20', border: 'border-blue-200 dark:border-blue-800', icon: 'bg-blue-600 text-white', text: 'text-blue-700 dark:text-blue-300' },
    green: { bg: 'bg-emerald-50 dark:bg-emerald-950/20', border: 'border-emerald-200 dark:border-emerald-800', icon: 'bg-emerald-600 text-white', text: 'text-emerald-700 dark:text-emerald-300' },
    amber: { bg: 'bg-amber-50 dark:bg-amber-950/20', border: 'border-amber-200 dark:border-amber-800', icon: 'bg-amber-600 text-white', text: 'text-amber-700 dark:text-amber-300' },
    purple: { bg: 'bg-purple-50 dark:bg-purple-950/20', border: 'border-purple-200 dark:border-purple-800', icon: 'bg-purple-600 text-white', text: 'text-purple-700 dark:text-purple-300' },
    cyan: { bg: 'bg-cyan-50 dark:bg-cyan-950/20', border: 'border-cyan-200 dark:border-cyan-800', icon: 'bg-cyan-600 text-white', text: 'text-cyan-700 dark:text-cyan-300' },
  };
  
  const colors = colorMap[color];
  const numericValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) || 0 : value;
  const isPercentage = typeof value === 'string' && value.includes('%');
  
  return (
    <div className={`${colors.bg} ${colors.border} rounded-xl border p-5 transition-all duration-300 hover:scale-[1.02]`}>
      <div className="flex items-start justify-between">
        <div className={`${colors.icon} p-3 rounded-lg shadow-md`}>
          {icon}
        </div>
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {isPercentage ? value : <AnimatedCounter value={numericValue} />}
        </p>
        <p className={`text-sm font-medium ${colors.text} mt-1`}>{title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
};

export default function GuardsIndex({ guards, filters, stats }: GuardsIndexProps) {
  const [search, setSearch] = React.useState(filters.search || '');
  const [selectedGuardDetails, setSelectedGuardDetails] = useState<any | null>(null);
  const { meta } = normalizePagination(guards, Number(filters?.per_page ?? 20));
  const [perPage] = React.useState<number>(meta.per_page);

  const openDetails = async (guardId: number) => {
    try {
      const res = await fetch(route('admin.guards.json', guardId), {
        headers: { 'Accept': 'application/json' },
        credentials: 'same-origin',
      });
      const data = await res.json();
      setSelectedGuardDetails(data);
    } catch {}
  };

  const handleSearch = () => {
    router.get(
      route('admin.guards.index'),
      { search, per_page: perPage },
      { preserveState: true }
    );
  };

  // Stats cards
  const statCards = useMemo(() => [
    {
      icon: <IconMapper name="Shield" size={24} />,
      title: 'Total Guards',
      value: stats.total_guards,
      subtitle: 'All personnel',
      color: 'red' as const,
    },
    {
      icon: <IconMapper name="CheckCircle" size={24} />,
      title: 'Active Guards',
      value: stats.active_guards,
      subtitle: 'Currently active',
      color: 'green' as const,
    },
    {
      icon: <IconMapper name="MapPin" size={24} />,
      title: 'On Duty Now',
      value: stats.on_duty_today,
      subtitle: 'Assigned to sites',
      color: 'blue' as const,
    },
    {
      icon: <IconMapper name="TrendingUp" size={24} />,
      title: 'Avg Attendance',
      value: `${stats.average_attendance}%`,
      subtitle: 'This month',
      color: 'purple' as const,
    },
  ], [stats]);

  const getPerformanceColor = (score?: number) => {
    if (!score) return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    if (score >= 90) return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
    if (score >= 70) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
    if (score >= 50) return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
    return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
  };

  const getAttendanceColor = (rate?: number) => {
    if (!rate) return 'text-gray-600 dark:text-gray-400';
    if (rate >= 95) return 'text-green-600 dark:text-green-400';
    if (rate >= 80) return 'text-blue-600 dark:text-blue-400';
    if (rate >= 60) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <AdminLayout title="Guards Directory">
      <Head title="Guards Directory" />
      
      <div className="min-h-screen bg-red-50 dark:bg-gray-900">
        {/* Hero Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-red-800 via-red-700 to-rose-800 text-white">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20" />
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                  <IconMapper name="ShieldCheck" size={28} />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">Guards Directory</h1>
                  <p className="text-red-100 text-sm mt-1">View guard profiles and performance metrics</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href={route('admin.guards.export')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-sm transition text-sm font-medium"
                >
                  <IconMapper name="Download" size={18} />
                  <span className="hidden sm:inline">Export</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {statCards.map((stat, idx) => (
              <StatCard key={idx} {...stat} />
            ))}
          </div>

          {/* Filters */}
          <Card className="p-4 md:p-5 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <span className="absolute left-3 top-3 text-gray-400">
                  <IconMapper name="Search" size={20} />
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search by name, employee ID or phone..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              <Button onClick={handleSearch} className="bg-red-600 hover:bg-red-700">
                <IconMapper name="Search" size={18} className="mr-2" />
                Search
              </Button>
            </div>
          </Card>

          {/* Mobile Cards */}
          <div className="md:hidden grid gap-4 mb-6">
            {guards.data.map((guard) => (
              <div key={guard.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white font-bold text-lg">
                    {guard.name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <button onClick={() => openDetails(guard.id)} className="text-left">
                      <p className="font-medium text-gray-900 dark:text-gray-100 truncate hover:underline">{guard.name}</p>
                    </button>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{guard.employee_id}</p>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Status:</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      guard.status === 'active'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                    }`}>
                      {guard.status || 'Active'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Site:</span>
                    <span className="text-gray-900 dark:text-gray-100">{guard.site?.name || 'Unassigned'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Attendance:</span>
                    <span className={`font-medium ${getAttendanceColor(guard.attendance_rate)}`}>
                      {guard.attendance_rate ? `${guard.attendance_rate}%` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Performance:</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPerformanceColor(guard.performance_score)}`}>
                      {guard.performance_score ? `${guard.performance_score}%` : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <Card className="hidden md:block overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Guard</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Employee ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Site</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Attendance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Performance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Shifts</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {guards.data.map((guard) => (
                  <tr key={guard.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white font-semibold text-sm mr-3">
                          {guard.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <button onClick={() => openDetails(guard.id)} className="text-left">
                            <div className="font-medium text-gray-900 dark:text-gray-100 hover:underline">{guard.name}</div>
                          </button>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{guard.phone || 'No phone'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{guard.employee_id}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {guard.site?.name || <span className="text-gray-400 italic">Unassigned</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        guard.status === 'active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                      }`}>
                        {guard.status || 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              (guard.attendance_rate || 0) >= 95 ? 'bg-green-500' :
                              (guard.attendance_rate || 0) >= 80 ? 'bg-blue-500' :
                              (guard.attendance_rate || 0) >= 60 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${guard.attendance_rate || 0}%` }}
                          />
                        </div>
                        <span className={`text-sm font-medium ${getAttendanceColor(guard.attendance_rate)}`}>
                          {guard.attendance_rate ? `${guard.attendance_rate}%` : 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPerformanceColor(guard.performance_score)}`}>
                        {guard.performance_score ? `${guard.performance_score}%` : 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {guard.shifts_this_month || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Pagination */}
          <Pagination
            currentPage={meta.current_page}
            lastPage={meta.last_page}
            total={meta.total}
            perPage={meta.per_page}
            from={meta.from}
            to={meta.to}
            baseUrl={route('admin.guards.index')}
            filters={{ search, per_page: perPage }}
          />
        </div>
        {/* Guard Details Modal */}
        <GuardDetailsModal
          open={!!selectedGuardDetails}
          onClose={() => setSelectedGuardDetails(null)}
          guard={selectedGuardDetails}
          scope="admin"
        />
      </div>
    </AdminLayout>
  );
}
