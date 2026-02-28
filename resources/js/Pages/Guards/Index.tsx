import React, { useState, useEffect, useMemo } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Badge } from '@/Components/ui/badge';
import IconMapper from '@/Components/IconMapper';
import Modal from '@/Components/Modal';

// Animated Counter Component
const AnimatedCounter: React.FC<{ value: number; duration?: number }> = ({ value, duration = 1000 }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let startTime: number;
    let animationFrame: number;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * value));
      if (progress < 1) animationFrame = requestAnimationFrame(animate);
    };
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);
  return <span>{count.toLocaleString()}</span>;
};

// StatCard Component
const StatCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  value: number;
  subtitle: string;
  color: 'red' | 'blue' | 'green' | 'amber' | 'purple' | 'cyan';
}> = ({ icon, title, value, subtitle, color }) => {
  const colorMap = {
    red: { bg: 'bg-red-50 dark:bg-red-950/20', border: 'border-red-200 dark:border-red-800', icon: 'bg-red-600 text-white', text: 'text-red-700 dark:text-red-300' },
    blue: { bg: 'bg-blue-50 dark:bg-blue-950/20', border: 'border-blue-200 dark:border-blue-800', icon: 'bg-blue-600 text-white', text: 'text-blue-700 dark:text-blue-300' },
    green: { bg: 'bg-emerald-50 dark:bg-emerald-950/20', border: 'border-emerald-200 dark:border-emerald-800', icon: 'bg-emerald-600 text-white', text: 'text-emerald-700 dark:text-emerald-300' },
    amber: { bg: 'bg-amber-50 dark:bg-amber-950/20', border: 'border-amber-200 dark:border-amber-800', icon: 'bg-amber-600 text-white', text: 'text-amber-700 dark:text-amber-300' },
    purple: { bg: 'bg-purple-50 dark:bg-purple-950/20', border: 'border-purple-200 dark:border-purple-800', icon: 'bg-purple-600 text-white', text: 'text-purple-700 dark:text-purple-300' },
    cyan: { bg: 'bg-cyan-50 dark:bg-cyan-950/20', border: 'border-cyan-200 dark:border-cyan-800', icon: 'bg-cyan-600 text-white', text: 'text-cyan-700 dark:text-cyan-300' },
  };
  const colors = colorMap[color];
  return (
    <div className={`${colors.bg} ${colors.border} rounded-xl border p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg`}>
      <div className="flex items-start justify-between">
        <div className={`${colors.icon} p-2.5 rounded-lg shadow-md`}>{icon}</div>
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100"><AnimatedCounter value={value} /></p>
        <p className={`text-sm font-medium ${colors.text} mt-1`}>{title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
};

// ActionTile Component
const ActionTile: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick?: () => void;
  color: string;
}> = ({ icon, title, description, onClick, color }) => (
  <button
    onClick={onClick}
    className="group relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 text-left w-full"
  >
    <div className={`absolute top-0 right-0 w-20 h-20 -mr-6 -mt-6 rounded-full opacity-10 ${color}`} />
    <div className={`inline-flex p-2.5 rounded-lg ${color} text-white shadow-md group-hover:scale-110 transition-transform`}>{icon}</div>
    <h3 className="mt-3 font-semibold text-gray-900 dark:text-gray-100 text-sm">{title}</h3>
    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{description}</p>
  </button>
);

type Guard = {
  id: number;
  name: string;
  employee_id: string;
  status: string;
  supervisor?: { id: number; name: string } | null;
  today_attendance?: { check_in?: string | null; check_out?: string | null } | null;
  active_assignment?: { site_id?: number | null; site_name?: string | null; client_name?: string | null } | null;
};

type PageProps = {
  guards?: { data: Guard[]; links?: any; meta?: any };
  filters?: Record<string, any>;
  grades?: Array<{ id: number; code: string; name: string }>;
  zones?: Array<{ id: number; name: string }>;
};

export default function GuardsDirectory() {
  const { guards: guardsProp = { data: [], links: [], meta: {} }, filters = {}, grades = [], zones = [] } = usePage<PageProps>().props as any;

  const [search, setSearch] = useState(filters.search || '');
  const [status, setStatus] = useState<string>(filters.status || '');
  const [zoneId, setZoneId] = useState<string>(filters.zone_id || '');
  const [gradeId, setGradeId] = useState<string>(filters.grade_id || '');
  const [onDuty, setOnDuty] = useState<boolean>(filters.on_duty === '1' || filters.on_duty === 1 || filters.on_duty === true || filters.on_duty === 'true');
  const [sort, setSort] = useState<string>(filters.sort || 'name');
  const [dir, setDir] = useState<'asc' | 'desc'>(filters.dir === 'desc' ? 'desc' : 'asc');
  const [perPage, setPerPage] = useState<string>(String(filters.per_page || '20'));
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showFilters, setShowFilters] = useState(false);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewData, setViewData] = useState<any | null>(null);
  const [viewLoading, setViewLoading] = useState<number | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const applyFilters = () => {
    const query: Record<string, any> = {
      search: search || undefined,
      status: status || undefined,
      zone_id: zoneId || undefined,
      grade_id: gradeId || undefined,
      on_duty: onDuty ? 1 : undefined,
      sort,
      dir,
      per_page: perPage,
    };
    router.get(route('guards.index'), query, { preserveState: true, preserveScroll: true });
  };

  const resetFilters = () => {
    setSearch(''); setStatus(''); setZoneId(''); setGradeId(''); setOnDuty(false); setSort('name'); setDir('asc'); setPerPage('20');
    router.get(route('guards.index'), {}, { preserveState: true, preserveScroll: true });
  };

  const openView = async (id: number) => {
    setViewLoading(id);
    try {
      const res = await fetch(route('guards.json', { guard: id }), { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error('Failed');
      const json = await res.json();
      setViewData(json);
      setViewOpen(true);
    } catch (e) {
      // no-op
    } finally {
      setViewLoading(null);
    }
  };

  const guards = guardsProp?.data || [];
  const meta = guardsProp?.meta || {};

  const statCards = useMemo(() => [
    { icon: <IconMapper name="Users" size={20} />, title: 'Total Guards', value: meta?.total || guards.length, subtitle: 'Registered personnel', color: 'blue' as const },
    { icon: <IconMapper name="UserCheck" size={20} />, title: 'Active', value: guards.filter((g: Guard) => g.status === 'active').length, subtitle: 'Currently employed', color: 'green' as const },
    { icon: <IconMapper name="Shield" size={20} />, title: 'On Duty', value: guards.filter((g: Guard) => g.today_attendance?.check_in && !g.today_attendance?.check_out).length, subtitle: 'Working now', color: 'cyan' as const },
    { icon: <IconMapper name="Clock" size={20} />, title: 'Off Duty', value: guards.filter((g: Guard) => !g.today_attendance?.check_in).length, subtitle: 'Not on shift', color: 'amber' as const },
  ], [guards, meta]);

  const quickActions = [
    { icon: <IconMapper name="UserPlus" size={18} />, title: 'Add Guard', description: 'Register new personnel', color: 'bg-blue-600', onClick: () => router.get(route('guards.create')) },
    { icon: <IconMapper name="FileSpreadsheet" size={18} />, title: 'Export', description: 'Download guard list', color: 'bg-emerald-600', onClick: () => {} },
    { icon: <IconMapper name="Scan" size={18} />, title: 'Quick Scan', description: 'Scan guard QR code', color: 'bg-purple-600', onClick: () => {} },
    { icon: <IconMapper name="BarChart3" size={18} />, title: 'Reports', description: 'View analytics', color: 'bg-amber-600', onClick: () => {} },
  ];

  return (
    <>
      <Head title="Guards Directory" />
      
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Hero Header */}
        <div className="bg-gradient-to-br from-red-900 via-red-800 to-red-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white/10 rounded-lg backdrop-blur-sm">
                    <IconMapper name="Shield" size={24} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Guards Directory</h1>
                    <p className="text-red-100 text-sm mt-0.5">Manage security personnel</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-2xl font-mono font-semibold">
                    {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-red-200 text-xs">
                    {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
            {statCards.map((stat, idx) => (
              <StatCard key={idx} {...stat} />
            ))}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {quickActions.map((action, idx) => (
              <ActionTile key={idx} {...action} />
            ))}
          </div>

          {/* Filters Card */}
          <Card className="p-4 md:p-5 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div className="relative flex-1 max-w-md">
                <IconMapper name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search guards..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="md:hidden"
                >
                  <IconMapper name={showFilters ? "ChevronUp" : "ChevronDown"} size={16} className="mr-1" />
                  Filters
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetFilters}
                  className="hidden sm:flex"
                >
                  <IconMapper name="X" size={16} className="mr-1" />
                  Clear
                </Button>
                <Button
                  size="sm"
                  onClick={applyFilters}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <IconMapper name="Search" size={16} className="mr-1" />
                  Search
                </Button>
              </div>
            </div>

            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 ${showFilters ? '' : 'hidden md:grid'}`}>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-10 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 text-sm"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>

              <select
                value={zoneId}
                onChange={(e) => setZoneId(e.target.value)}
                className="h-10 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 text-sm"
              >
                <option value="">All Zones</option>
                {zones.map((z: any) => (
                  <option key={z.id} value={z.id}>{z.name}</option>
                ))}
              </select>

              <select
                value={gradeId}
                onChange={(e) => setGradeId(e.target.value)}
                className="h-10 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 text-sm"
              >
                <option value="">All Grades</option>
                {grades.map((g: any) => (
                  <option key={g.id} value={g.id}>{g.code} - {g.name}</option>
                ))}
              </select>

              <label className="flex items-center gap-2 p-2 rounded-md border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <input
                  type="checkbox"
                  checked={onDuty}
                  onChange={(e) => setOnDuty(e.target.checked)}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">On duty only</span>
              </label>
            </div>
          </Card>

          {/* Guards List */}
          <Card className="overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Guards ({meta?.total || guards.length})
                </h2>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <span>Sort by:</span>
                  <select
                    value={sort}
                    onChange={(e) => { setSort(e.target.value); applyFilters(); }}
                    className="h-8 rounded border border-gray-300 dark:border-gray-600 bg-transparent px-2 text-sm"
                  >
                    <option value="name">Name</option>
                    <option value="employee_id">ID</option>
                    <option value="status">Status</option>
                  </select>
                  <button
                    onClick={() => { setDir(dir === 'asc' ? 'desc' : 'asc'); applyFilters(); }}
                    className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <IconMapper name={dir === 'asc' ? "ArrowUp" : "ArrowDown"} size={16} />
                  </button>
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {guards.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="inline-flex p-4 rounded-full bg-gray-100 dark:bg-gray-800 mb-3">
                    <IconMapper name="Search" size={32} className="text-gray-400" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400">No guards found</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try adjusting your filters</p>
                </div>
              ) : (
                guards.map((guard: Guard) => (
                  <div
                    key={guard.id}
                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                          <IconMapper name="User" size={20} className="text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-gray-100">{guard.name}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">ID: {guard.employee_id}</p>
                          {guard.active_assignment && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              <IconMapper name="MapPin" size={12} className="inline mr-1" />
                              {guard.active_assignment.site_name} ({guard.active_assignment.client_name})
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={guard.status === 'active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' : guard.status === 'inactive' ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}>
                          {guard.status}
                        </Badge>
                        {guard.today_attendance?.check_in && !guard.today_attendance?.check_out && (
                          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                            <IconMapper name="Clock" size={12} className="mr-1" />
                            On Duty
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openView(guard.id)}
                          disabled={viewLoading === guard.id}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          {viewLoading === guard.id ? (
                            <IconMapper name="Loader2" size={16} className="animate-spin" />
                          ) : (
                            <IconMapper name="Eye" size={16} />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            {meta?.last_page > 1 && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Showing {meta?.from || 1} to {meta?.to || guards.length} of {meta?.total} results
                  </p>
                  <div className="flex items-center gap-2">
                    {meta?.links?.map((link: any, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => link.url && router.get(link.url)}
                        disabled={!link.url}
                        className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                          link.active
                            ? 'bg-red-600 text-white'
                            : link.url
                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                            : 'bg-gray-50 dark:bg-gray-900 text-gray-400 cursor-not-allowed'
                        }`}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* View Modal */}
      <Modal show={viewOpen} onClose={() => setViewOpen(false)} maxWidth="lg">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Guard Details</h2>
            <button
              onClick={() => setViewOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <IconMapper name="X" size={20} />
            </button>
          </div>
          {viewData ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
                  <IconMapper name="User" size={24} className="text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{viewData.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{viewData.employee_id}</p>
                </div>
                <Badge className={`ml-auto ${viewData.status === 'active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' : viewData.status === 'inactive' ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
                  {viewData.status}
                </Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {viewData.email && (
                  <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{viewData.email}</p>
                  </div>
                )}
                {viewData.phone && (
                  <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{viewData.phone}</p>
                  </div>
                )}
                {viewData.supervisor && (
                  <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Supervisor</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{viewData.supervisor.name}</p>
                  </div>
                )}
                {viewData.grade && (
                  <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Grade</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{viewData.grade.code} - {viewData.grade.name}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <IconMapper name="Loader2" size={32} className="animate-spin text-red-600" />
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
