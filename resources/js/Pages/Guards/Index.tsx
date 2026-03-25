import React, { useState, useEffect, useMemo } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Badge } from '@/Components/ui/badge';
import { Label } from '@/Components/ui/label';
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
  email?: string;
  phone?: string;
  nin?: string;
  grade_id?: number;
  zone_id?: number;
  supervisor_id?: number;
  employee_role?: string;
  supervisor?: { id: number; name: string } | null;
  today_attendance?: { check_in?: string | null; check_out?: string | null } | null;
  active_assignment?: { site_id?: number | null; site_name?: string | null; client_name?: string | null } | null;
};

type PageProps = {
  guards?: { data: Guard[]; links?: any; meta?: any };
  filters?: Record<string, any>;
  grades?: Array<{ id: number; code: string; name: string }>;
  zones?: Array<{ id: number; name: string }>;
  stats?: { total: number; active: number; on_duty: number; off_duty: number };
};

export default function GuardsDirectory() {
  const { guards: guardsProp = { data: [], links: [], meta: {} }, filters = {}, grades = [], zones = [], stats } = usePage().props as any;

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

  // Form modals state
  const [formOpen, setFormOpen] = useState(false);
  const [editingGuard, setEditingGuard] = useState<Guard | null>(null);
  const [formProcessing, setFormProcessing] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Delete confirmation state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteGuard, setDeleteGuard] = useState<Guard | null>(null);
  const [deleteProcessing, setDeleteProcessing] = useState(false);

  // QR Scan state
  const [scanOpen, setScanOpen] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);

  // Attendance marking state
  const [markGuard, setMarkGuard] = useState<Guard | null>(null);
  const [markPresentOpen, setMarkPresentOpen] = useState(false);
  const [markAbsentOpen, setMarkAbsentOpen] = useState(false);
  const [markNotes, setMarkNotes] = useState('');
  const [markProcessing, setMarkProcessing] = useState(false);

  // Bulk import state
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importProcessing, setImportProcessing] = useState(false);
  const [importAllowUpdates, setImportAllowUpdates] = useState(false);
  const [importPreview, setImportPreview] = useState<any[] | null>(null);

  // Form data state
  const [formData, setFormData] = useState({
    name: '',
    employee_id: '',
    email: '',
    phone: '',
    nin: '',
    grade_id: '',
    zone_id: '',
    supervisor_id: '',
    status: 'active',
    employee_role: 'guard',
  });

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

  const openAddForm = () => {
    setEditingGuard(null);
    setFormData({
      name: '',
      employee_id: '',
      email: '',
      phone: '',
      nin: '',
      grade_id: '',
      zone_id: '',
      supervisor_id: '',
      status: 'active',
      employee_role: 'guard',
    });
    setFormErrors({});
    setFormOpen(true);
  };

  const openEditForm = async (guard: Guard) => {
    setEditingGuard(guard);
    setFormData({
      name: guard.name || '',
      employee_id: guard.employee_id || '',
      email: guard.email || '',
      phone: guard.phone || '',
      nin: guard.nin || '',
      grade_id: guard.grade_id ? String(guard.grade_id) : '',
      zone_id: guard.zone_id ? String(guard.zone_id) : '',
      supervisor_id: guard.supervisor_id ? String(guard.supervisor_id) : '',
      status: guard.status || 'active',
      employee_role: guard.employee_role || 'guard',
    });
    setFormErrors({});
    setFormOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormProcessing(true);
    setFormErrors({});

    const payload = {
      ...formData,
      grade_id: formData.grade_id ? Number(formData.grade_id) : null,
      zone_id: formData.zone_id ? Number(formData.zone_id) : null,
      supervisor_id: formData.supervisor_id ? Number(formData.supervisor_id) : null,
    };

    if (editingGuard) {
      router.put(route('admin.guards.update', { guard: editingGuard.id }), payload, {
        onSuccess: () => {
          setFormOpen(false);
          setEditingGuard(null);
          setFormProcessing(false);
        },
        onError: (errors) => {
          setFormErrors(errors as Record<string, string>);
          setFormProcessing(false);
        },
      });
    } else {
      router.post(route('admin.guards.store'), payload, {
        onSuccess: () => {
          setFormOpen(false);
          setFormProcessing(false);
        },
        onError: (errors) => {
          setFormErrors(errors as Record<string, string>);
          setFormProcessing(false);
        },
      });
    }
  };

  const confirmDelete = (guard: Guard) => {
    setDeleteGuard(guard);
    setDeleteOpen(true);
  };

  const handleDelete = () => {
    if (!deleteGuard) return;
    setDeleteProcessing(true);
    router.delete(route('admin.guards.destroy', { guard: deleteGuard.id }), {
      onSuccess: () => {
        setDeleteOpen(false);
        setDeleteGuard(null);
        setDeleteProcessing(false);
      },
      onError: () => {
        setDeleteProcessing(false);
      },
    });
  };

  const handleMarkPresent = () => {
    if (!markGuard) return;
    setMarkProcessing(true);
    router.post(route('control-room.attendance.mark-present'), {
      guard_id: markGuard.id,
      notes: markNotes,
    }, {
      onSuccess: () => {
        setMarkPresentOpen(false);
        setMarkGuard(null);
        setMarkNotes('');
        setMarkProcessing(false);
      },
      onError: () => {
        setMarkProcessing(false);
      },
    });
  };

  const handleMarkAbsent = () => {
    if (!markGuard) return;
    setMarkProcessing(true);
    router.post(route('control-room.attendance.mark-absent'), {
      guard_id: markGuard.id,
      notes: markNotes,
    }, {
      onSuccess: () => {
        setMarkAbsentOpen(false);
        setMarkGuard(null);
        setMarkNotes('');
        setMarkProcessing(false);
      },
      onError: () => {
        setMarkProcessing(false);
      },
    });
  };

  const openMarkPresent = (guard: Guard) => {
    setMarkGuard(guard);
    setMarkNotes('');
    setMarkPresentOpen(true);
  };

  const openMarkAbsent = (guard: Guard) => {
    setMarkGuard(guard);
    setMarkNotes('');
    setMarkAbsentOpen(true);
  };

  const handleExport = () => {
    const params = new URLSearchParams({
      search: search || '',
      status: status || '',
      zone_id: zoneId || '',
      grade_id: gradeId || '',
      on_duty: onDuty ? '1' : '',
      export: '1',
    });
    window.open(`${route('guards.index')}?${params.toString()}`, '_blank');
  };

  const guards = guardsProp?.data || [];
  const meta = guardsProp?.meta || {};

  const statCards = useMemo(() => [
    { icon: <IconMapper name="Users" size={20} />, title: 'Total Guards', value: stats?.total || meta?.total || guards.length, subtitle: 'Registered personnel', color: 'blue' as const },
    { icon: <IconMapper name="UserCheck" size={20} />, title: 'Active', value: stats?.active || 0, subtitle: 'Currently employed', color: 'green' as const },
    { icon: <IconMapper name="Shield" size={20} />, title: 'On Duty', value: stats?.on_duty || 0, subtitle: 'Working now', color: 'cyan' as const },
    { icon: <IconMapper name="Clock" size={20} />, title: 'Off Duty', value: stats?.off_duty || 0, subtitle: 'Not on shift', color: 'amber' as const },
  ], [guards, meta, stats]);

  const handleImport = () => {
    if (!importFile) return;
    setImportProcessing(true);
    const formData = new FormData();
    formData.append('file', importFile);
    formData.append('allow_updates', importAllowUpdates ? '1' : '0');
    router.post(route('admin.guards.bulk-import'), formData, {
      onSuccess: () => {
        setImportOpen(false);
        setImportFile(null);
        setImportPreview(null);
        setImportAllowUpdates(false);
        setImportProcessing(false);
      },
      onError: () => {
        setImportProcessing(false);
      },
    });
  };

  const downloadTemplate = () => {
    window.open(route('admin.guards.bulk-import-template'), '_blank');
  };

  const quickActions = [
    { icon: <IconMapper name="UserPlus" size={18} />, title: 'Add Guard', description: 'Register new personnel', color: 'bg-blue-600', onClick: openAddForm },
    { icon: <IconMapper name="FileSpreadsheet" size={18} />, title: 'Export', description: 'Download guard list', color: 'bg-emerald-600', onClick: handleExport },
    { icon: <IconMapper name="Scan" size={18} />, title: 'Quick Scan', description: 'Scan guard QR code', color: 'bg-amber-600', onClick: () => setScanOpen(true) },
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
                {(zones || []).map((z: any) => (
                  <option key={z.id} value={z.id}>{z.name}</option>
                ))}
              </select>

              <select
                value={gradeId}
                onChange={(e) => setGradeId(e.target.value)}
                className="h-10 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 text-sm"
              >
                <option value="">All Grades</option>
                {(grades || []).map((g: any) => (
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
                      <div className="flex items-center gap-2">
                        <Badge className={guard.status === 'active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' : guard.status === 'inactive' ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}>
                          {guard.status}
                        </Badge>
                        {guard.today_attendance?.check_in && !guard.today_attendance?.check_out && (
                          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                            <IconMapper name="Clock" size={12} className="mr-1" />
                            On Duty
                          </Badge>
                        )}
                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openMarkPresent(guard)}
                            className="text-emerald-600 hover:text-emerald-700"
                            title="Mark Present"
                          >
                            <IconMapper name="CheckCircle" size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openMarkAbsent(guard)}
                            className="text-red-600 hover:text-red-700"
                            title="Mark Absent"
                          >
                            <IconMapper name="XCircle" size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openView(guard.id)}
                            disabled={viewLoading === guard.id}
                          >
                            {viewLoading === guard.id ? (
                              <IconMapper name="Loader2" size={16} className="animate-spin" />
                            ) : (
                              <IconMapper name="Eye" size={16} />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditForm(guard)}
                          >
                            <IconMapper name="Pencil" size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => confirmDelete(guard)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <IconMapper name="Trash2" size={16} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            {guards?.links && guards.data.length > 0 && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Showing {guards.meta?.from || 1} to {guards.meta?.to || guards.data.length} of {guards.meta?.total || guards.data.length} results
                  </p>
                  <div className="flex items-center gap-2">
                    {guards.links.filter((l: any) => l.url).map((l: any, idx: number) => (
                      <button
                        key={idx}
                        className={`px-3 py-1.5 text-sm rounded border dark:border-gray-700 transition-colors ${
                          l.active
                            ? 'bg-red-600 text-white border-red-600'
                            : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                        onClick={() => router.get(l.url, { search: search || undefined, status: status || undefined, zone_id: zoneId || undefined, grade_id: gradeId || undefined, on_duty: onDuty ? '1' : undefined, sort, dir, per_page: perPage }, { preserveScroll: true, preserveState: true })}
                        dangerouslySetInnerHTML={{ __html: l.label }}
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
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              {/* Header Card */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
                  <IconMapper name="User" size={24} className="text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{viewData.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{viewData.employee_id}</p>
                  {viewData.position && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{viewData.position}</p>
                  )}
                </div>
                <Badge className={`ml-auto ${viewData.status === 'active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' : viewData.status === 'inactive' ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
                  {viewData.status}
                </Badge>
              </div>

              {/* Attendance Summary */}
              {viewData.attendance_tally && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-900/20 rounded-lg">
                  <h4 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 mb-3 flex items-center gap-2">
                    <IconMapper name="ClipboardCheck" size={16} />
                    This Month's Attendance
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="text-center p-2 bg-white dark:bg-gray-800 rounded">
                      <p className="text-lg font-bold text-emerald-600">{viewData.attendance_tally.by_status?.present || 0}</p>
                      <p className="text-xs text-gray-500">Present</p>
                    </div>
                    <div className="text-center p-2 bg-white dark:bg-gray-800 rounded">
                      <p className="text-lg font-bold text-amber-600">{viewData.attendance_tally.by_status?.late || 0}</p>
                      <p className="text-xs text-gray-500">Late</p>
                    </div>
                    <div className="text-center p-2 bg-white dark:bg-gray-800 rounded">
                      <p className="text-lg font-bold text-red-600">{viewData.attendance_tally.by_status?.absent || 0}</p>
                      <p className="text-xs text-gray-500">Absent</p>
                    </div>
                    <div className="text-center p-2 bg-white dark:bg-gray-800 rounded">
                      <p className="text-lg font-bold text-blue-600">{viewData.attendance_tally.total || 0}</p>
                      <p className="text-xs text-gray-500">Total</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-emerald-200 dark:border-emerald-900/20 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Hours Worked</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{viewData.attendance_tally.hours_worked?.toFixed(1) || 0} hrs</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Overtime</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{viewData.attendance_tally.overtime_hours?.toFixed(1) || 0} hrs</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Contact Information */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                  <IconMapper name="Phone" size={16} />
                  Contact Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {viewData.phone && (
                    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{viewData.phone}</p>
                    </div>
                  )}
                  {viewData.email && (
                    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{viewData.email}</p>
                    </div>
                  )}
                  {viewData.address && (
                    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg sm:col-span-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Address</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{viewData.address}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Employment Details */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                  <IconMapper name="Briefcase" size={16} />
                  Employment Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {viewData.grade && (
                    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Grade</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{viewData.grade.code} - {viewData.grade.name}</p>
                    </div>
                  )}
                  {viewData.supervisor && (
                    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Supervisor</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{viewData.supervisor.name}</p>
                    </div>
                  )}
                  {viewData.employee_role && (
                    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Role</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">{viewData.employee_role}</p>
                    </div>
                  )}
                  {viewData.hire_date && (
                    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Hire Date</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{new Date(viewData.hire_date).toLocaleDateString()}</p>
                    </div>
                  )}
                  {viewData.guard_type && (
                    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Guard Type</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">{viewData.guard_type}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Personal Information */}
              {(viewData.date_of_birth || viewData.gender || viewData.id_number) && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                    <IconMapper name="UserCircle" size={16} />
                    Personal Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {viewData.id_number && (
                      <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400">ID Number</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{viewData.id_number}</p>
                      </div>
                    )}
                    {viewData.date_of_birth && (
                      <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Date of Birth</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{new Date(viewData.date_of_birth).toLocaleDateString()}</p>
                      </div>
                    )}
                    {viewData.gender && (
                      <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Gender</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">{viewData.gender}</p>
                      </div>
                    )}
                    {viewData.marital_status && (
                      <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Marital Status</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">{viewData.marital_status}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Emergency Contact */}
              {(viewData.emergency_contact_name || viewData.emergency_contact_phone) && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                    <IconMapper name="AlertCircle" size={16} />
                    Emergency Contact
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {viewData.emergency_contact_name && (
                      <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Name</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{viewData.emergency_contact_name}</p>
                      </div>
                    )}
                    {viewData.emergency_contact_phone && (
                      <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{viewData.emergency_contact_phone}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Quick Actions in Modal */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => {
                    setViewOpen(false);
                    openMarkPresent(viewData);
                  }}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  size="sm"
                >
                  <IconMapper name="CheckCircle" size={16} className="mr-1" />
                  Mark Present
                </Button>
                <Button
                  onClick={() => {
                    setViewOpen(false);
                    openMarkAbsent(viewData);
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  size="sm"
                >
                  <IconMapper name="XCircle" size={16} className="mr-1" />
                  Mark Absent
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <IconMapper name="Loader2" size={32} className="animate-spin text-red-600" />
            </div>
          )}
        </div>
      </Modal>

      {/* Mark Present Modal */}
      <Modal show={markPresentOpen} onClose={() => setMarkPresentOpen(false)} maxWidth="md">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/20 rounded-full">
              <IconMapper name="CheckCircle" size={24} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Mark Present</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{markGuard?.name}</p>
            </div>
          </div>
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              This will mark <strong>{markGuard?.name}</strong> as present for today.
            </p>
            <div>
              <Label className="text-sm text-gray-700 dark:text-gray-300">Notes (optional)</Label>
              <textarea
                value={markNotes}
                onChange={(e) => setMarkNotes(e.target.value)}
                placeholder="Add any notes about this attendance..."
                rows={3}
                className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleMarkPresent}
                disabled={markProcessing}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {markProcessing ? (
                  <>
                    <IconMapper name="Loader2" size={16} className="animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <IconMapper name="CheckCircle" size={16} className="mr-2" />
                    Confirm Present
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setMarkPresentOpen(false)}
                disabled={markProcessing}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Mark Absent Modal */}
      <Modal show={markAbsentOpen} onClose={() => setMarkAbsentOpen(false)} maxWidth="md">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-full">
              <IconMapper name="XCircle" size={24} className="text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Mark Absent</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{markGuard?.name}</p>
            </div>
          </div>
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              This will mark <strong>{markGuard?.name}</strong> as absent for today.
            </p>
            <div>
              <Label className="text-sm text-gray-700 dark:text-gray-300">Reason (optional)</Label>
              <textarea
                value={markNotes}
                onChange={(e) => setMarkNotes(e.target.value)}
                placeholder="Add reason for absence..."
                rows={3}
                className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleMarkAbsent}
                disabled={markProcessing}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {markProcessing ? (
                  <>
                    <IconMapper name="Loader2" size={16} className="animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <IconMapper name="XCircle" size={16} className="mr-2" />
                    Confirm Absent
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setMarkAbsentOpen(false)}
                disabled={markProcessing}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Bulk Import Modal */}
      <Modal show={importOpen} onClose={() => setImportOpen(false)} maxWidth="md">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-full">
              <IconMapper name="Upload" size={24} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Bulk Import Guards</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Upload Excel file to import multiple guards</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Template</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Download the Excel template with the correct format for bulk importing guards.
              </p>
              <Button
                variant="outline"
                onClick={downloadTemplate}
                className="w-full"
              >
                <IconMapper name="Download" size={16} className="mr-2" />
                Download Template
              </Button>
            </div>

            <div>
              <Label className="text-sm text-gray-700 dark:text-gray-300">Upload Excel File</Label>
              <div className="mt-2">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="excel-upload"
                />
                <label
                  htmlFor="excel-upload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <IconMapper name="FileUp" size={24} className="text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {importFile ? importFile.name : 'Click to upload Excel file'}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Excel files only (.xlsx, .xls) max 5MB
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <label className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <input
                type="checkbox"
                checked={importAllowUpdates}
                onChange={(e) => setImportAllowUpdates(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-purple-600 focus:ring-purple-500"
              />
              <div>
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Update existing guards when duplicates are found</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">If unchecked, duplicate rows will be skipped.</div>
              </div>
            </label>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleImport}
                disabled={!importFile || importProcessing}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
              >
                {importProcessing ? (
                  <>
                    <IconMapper name="Loader2" size={16} className="animate-spin mr-2" />
                    Importing...
                  </>
                ) : (
                  <>
                    <IconMapper name="Upload" size={16} className="mr-2" />
                    Import Guards
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setImportOpen(false);
                  setImportFile(null);
                  setImportPreview(null);
                  setImportAllowUpdates(false);
                }}
                disabled={importProcessing}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
