import React from 'react';
import { Head, router } from '@inertiajs/react';
import ControlRoomLayout from '@/Layouts/ControlRoomLayout';
import IconMapper from '@/Components/IconMapper';
import useNotification from '@/Providers/useNotifications';
import Modal from '@/Components/Modal';
import ConfirmModal from '@/Components/ConfirmModal';
import ReasonModal from '@/Components/ReasonModal';
import GuardForm from '@/Components/Guards/GuardForm';
import { GuardFormData } from '@/types/guards';
import AssignSiteModal from '@/Components/Guards/AssignSiteModal';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';

interface Guard {
  id: number;
  name: string;
  employee_id: string;
  phone?: string;
  position?: string;
  status?: string;
  supervisor?: { id: number; name: string } | null;
  is_profile_complete?: boolean;
  active_assignment?: {
    client_name: string;
    site_name: string;
  } | null;
  today_attendance?: {
    check_in: string | null;
    check_out: string | null;
    status?: string;
  } | null;
  edit_count?: number;
}

interface Zone { id: number; name: string }
interface Client { id: number; name: string }
interface Grade { id: number; code: string; name: string }

interface GuardsIndexProps {
  guards: {
    data: Guard[];
    meta?: any;
    links?: any[];
    stats?: { total: number; active: number; assigned: number; incomplete: number; inactive: number };
  };
  inactiveGuards?: {
    data: Guard[];
    meta?: any;
    links?: any[];
  };
  filters: any;
  supervisors: Array<{ id: number; name: string }>;
  zones: Zone[];
  clients: Client[];
  auth: { user: any };
  can?: {
    suspend: boolean;
    dismiss: boolean;
    reinstate: boolean;
  };
}

// Animated Counter
const AnimatedCounter: React.FC<{ value: number; duration?: number }> = ({ value, duration = 1000 }) => {
  const [count, setCount] = React.useState(0);
  
  React.useEffect(() => {
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

// Stat Card Component
interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: number;
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
  
  return (
    <div className={`${colors.bg} ${colors.border} rounded-xl border p-4 transition-all duration-300 hover:scale-[1.02]`}>
      <div className={`${colors.icon} p-2 rounded-lg shadow-md w-fit`}>
        {icon}
      </div>
      <div className="mt-3">
        <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
          <AnimatedCounter value={value} />
        </p>
        <p className={`text-sm font-medium ${colors.text} mt-0.5`}>{title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
};

// Action Tile Component
const ActionTile: React.FC<{ 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  color: string;
  onClick?: () => void;
  href?: string;
}> = ({ icon, title, description, color, onClick, href }) => {
  const content = (
    <div className={`${color} p-3 rounded-xl text-white flex items-center gap-3 transition-transform hover:scale-[1.02]`}>
      <div className="p-2 bg-white/20 rounded-lg">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="font-medium text-sm truncate">{title}</div>
        <div className="text-xs opacity-90 truncate">{description}</div>
      </div>
    </div>
  );
  
  if (onClick) {
    return <button onClick={onClick} className="block w-full text-left">{content}</button>;
  }
  if (href) {
    return <a href={href} className="block">{content}</a>;
  }
  return <div>{content}</div>;
};

export default function ControlRoomGuardsIndex({ 
  guards: guardsProp, 
  inactiveGuards,
  filters, 
  supervisors = [], 
  zones = [], 
  clients = [],
  auth,
  can = { suspend: true, dismiss: true, reinstate: true }
}: GuardsIndexProps) {
  const { push } = useNotification();
  const user = auth.user;
  
  // Filters state
  const [search, setSearch] = React.useState<string>(() => filters.search || '');
  const [status, setStatus] = React.useState<string>(() => filters.status || '');
  const [profileStatus, setProfileStatus] = React.useState<string>(() => filters.profile_status || '');
  const [zoneId, setZoneId] = React.useState<string>(() => filters.zone_id || '');
  const [supervisorId, setSupervisorId] = React.useState<string>(() => filters.supervisor_id || '');
  const [clientId, setClientId] = React.useState<string>(() => filters.client_id || '');
  const [onDuty, setOnDuty] = React.useState<boolean>(() => !!filters.on_duty);
  const [view, setView] = React.useState<string>(() => filters.view || 'active');
  const [sort, setSort] = React.useState<string>(() => {
    if (filters.sort) return String(filters.sort);
    if (typeof window !== 'undefined') return window.localStorage.getItem('controlRoom.guards.sort') || 'name';
    return 'name';
  });
  const [dir, setDir] = React.useState<'asc'|'desc'>(() => {
    if (filters.dir === 'desc') return 'desc';
    if (typeof window !== 'undefined') return (window.localStorage.getItem('controlRoom.guards.dir') as any) === 'desc' ? 'desc' : 'asc';
    return 'asc';
  });
  const [perPage, setPerPage] = React.useState<string>(() => {
    if (filters.per_page) return String(filters.per_page);
    if (typeof window !== 'undefined') return window.localStorage.getItem('controlRoom.guards.perPage') || '20';
    return '20';
  });
  
  // Selection state
  const [selectedGuardIds, setSelectedGuardIds] = React.useState<number[]>([]);
  const canAssignSupervisor = !!(user?.permissions?.some((p: string) => p.includes('assign-supervisor')) || user?.role === 'control_room');
  const canBulkCover = selectedGuardIds.length > 0 && selectedGuardIds.some(id => {
    const g = guardsProp.data.find((x: Guard) => x.id === id);
    return !g?.today_attendance || (!g.today_attendance.check_in && !g.today_attendance.check_out);
  });

  // Modal states
  const [showAdd, setShowAdd] = React.useState(false);
  const [showEdit, setShowEdit] = React.useState(false);
  const [showAssign, setShowAssign] = React.useState(false);
  const [showSupervisor, setShowSupervisor] = React.useState(false);
  const [currentGuardId, setCurrentGuardId] = React.useState<number | null>(null);
  const [selectedSupervisorId, setSelectedSupervisorId] = React.useState<string>('');
  const [currentGuard, setCurrentGuard] = React.useState<Guard | null>(null);
  const [currentGuardData, setCurrentGuardData] = React.useState<any>(null);
  const [editLoading, setEditLoading] = React.useState<number | null>(null);
  const [viewLoading, setViewLoading] = React.useState<number | null>(null);
  const [viewOpen, setViewOpen] = React.useState(false);
  const [viewData, setViewData] = React.useState<any>(null);
  const [bulkCoverOpen, setBulkCoverOpen] = React.useState(false);
  const [bulkCoverNotes, setBulkCoverNotes] = React.useState('');
  const [importOpen, setImportOpen] = React.useState(false);
  const [importFile, setImportFile] = React.useState<File | null>(null);
  const [importProcessing, setImportProcessing] = React.useState(false);
  const [importAllowUpdates, setImportAllowUpdates] = React.useState(false);

  // Confirm/Reason modal states
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [confirmTitle, setConfirmTitle] = React.useState('');
  const [confirmMessage, setConfirmMessage] = React.useState('');
  const [confirmAction, setConfirmAction] = React.useState<() => void>(() => {});
  const [reasonOpen, setReasonOpen] = React.useState(false);
  const [reasonTitle, setReasonTitle] = React.useState('');
  const [reasonMessage, setReasonMessage] = React.useState('');
  const [reasonSubmit, setReasonSubmit] = React.useState<(reason: string) => void>(() => {});

  const openConfirm = (title: string, message: string, action: () => void) => {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setConfirmOpen(true);
  };

  const openReason = (title: string, message: string, onSubmit: (reason: string) => void) => {
    setReasonTitle(title);
    setReasonMessage(message);
    setReasonSubmit(() => onSubmit);
    setReasonOpen(true);
  };

  const applyFilters = (viewOverride?: string) => {
    const currentView = viewOverride || view;
    const query: Record<string, any> = {
      search: search || undefined,
      status: currentView === 'inactive' ? undefined : (status || undefined),
      profile_status: profileStatus || undefined,
      zone_id: zoneId || undefined,
      supervisor_id: supervisorId || undefined,
      client_id: clientId || undefined,
      on_duty: onDuty || undefined,
      sort: sort || undefined,
      dir: dir || undefined,
      per_page: perPage || undefined,
      view: currentView || 'active',
    };
    router.get(route('control-room.guards'), query, { preserveState: false, preserveScroll: true });
  };

  const resetFilters = () => {
    setSearch(''); setStatus(''); setProfileStatus(''); setZoneId(''); setSupervisorId(''); setClientId(''); setOnDuty(false);
    setSort('name'); setDir('asc'); setPerPage('20'); setView('active');
    router.get(route('control-room.guards'), {}, { preserveState: true, preserveScroll: true });
  };

  const markPresent = (guard: Guard) => {
    if (guard.today_attendance?.check_in) {
      push('Guard already checked in today', 'warning');
      return;
    }
    if (!confirm(`Mark ${guard.name} present for today?`)) return;
    router.post(route('control-room.attendance.mark-present'), {
      guard_id: guard.id,
    }, {
      preserveScroll: true,
      onSuccess: () => push('Guard marked present', 'success'),
    });
  };

  const markAbsent = (guard: Guard) => {
    if (guard.today_attendance?.check_in) {
      push('Guard already checked in today', 'warning');
      return;
    }
    if (!confirm(`Mark ${guard.name} absent for today?`)) return;
    router.post(route('control-room.attendance.mark-absent'), {
      guard_id: guard.id,
    }, {
      preserveScroll: true,
      onSuccess: () => push('Guard marked absent', 'info'),
    });
  };

  const canMarkPresent = (g: Guard) => !g.today_attendance?.check_in && g.today_attendance?.status !== 'present';
  const canMarkAbsent = (g: Guard) => !g.today_attendance?.check_in && g.today_attendance?.status !== 'absent';

  const submitBulkCover = () => {
    router.post(route('control-room.attendance.mark-covered'), {
      client_id: clientId ? Number(clientId) : undefined,
      zone_id: zoneId ? Number(zoneId) : undefined,
      notes: bulkCoverNotes || undefined,
    }, {
      preserveScroll: true,
      onSuccess: () => { setBulkCoverOpen(false); setBulkCoverNotes(''); setSelectedGuardIds([]); router.reload(); },
    });
  };

  const handleExport = () => {
    const query: Record<string, any> = {
      search: search || undefined,
      status: view === 'inactive' ? undefined : (status || undefined),
      profile_status: profileStatus || undefined,
      zone_id: zoneId || undefined,
      supervisor_id: supervisorId || undefined,
      client_id: clientId || undefined,
      on_duty: onDuty ? 1 : undefined,
      sort,
      dir,
    };
    const url = route('control-room.guards.export', query);
    window.location.href = url;
  };

  const handleImport = () => {
    if (!importFile) return;
    setImportProcessing(true);
    const formData = new FormData();
    formData.append('file', importFile);
    formData.append('allow_updates', importAllowUpdates ? '1' : '0');
    router.post(route('control-room.guards.bulk-import'), formData, {
      onSuccess: () => {
        setImportOpen(false);
        setImportFile(null);
        setImportAllowUpdates(false);
        setImportProcessing(false);
        router.reload();
      },
      onError: () => {
        setImportProcessing(false);
      },
    });
  };

  const downloadTemplate = () => {
    window.open(route('control-room.guards.bulk-import-template'), '_blank');
  };

  const openView = async (id: number) => {
    setViewLoading(id);
    try {
      const res = await fetch(route('control-room.guards.json', { guard: id }), { headers: { Accept: 'application/json' } });
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

  const openEdit = async (g: Guard) => {
    if (g.edit_count !== undefined && g.edit_count >= 3) {
      alert('This guard has reached the maximum edit limit (3 edits). Contact an administrator for further changes.');
      return;
    }
    setEditLoading(g.id);
    try {
      const res = await fetch(route('control-room.guards.json', { guard: g.id }), { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error('Failed');
      const json = await res.json();
      setCurrentGuard(g);
      setCurrentGuardData(json);
      setShowEdit(true);
    } catch (e) {
      // no-op
    } finally {
      setEditLoading(null);
    }
  };

  const toggleGuardSelected = (id: number) => {
    setSelectedGuardIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    const idsOnPage = guardsProp.data.map((g: Guard) => g.id);
    const allSelected = idsOnPage.every((id: number) => selectedGuardIds.includes(id));
    if (allSelected) {
      setSelectedGuardIds(prev => prev.filter(id => !idsOnPage.includes(id)));
    } else {
      setSelectedGuardIds(prev => Array.from(new Set([...prev, ...idsOnPage])));
    }
  };

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('controlRoom.guards.sort', sort);
    window.localStorage.setItem('controlRoom.guards.dir', dir);
    window.localStorage.setItem('controlRoom.guards.perPage', perPage);
  }, [sort, dir, perPage]);

  // Sync view state with filters from backend when page updates
  React.useEffect(() => {
    if (filters.view && filters.view !== view) {
      setView(filters.view);
    }
  }, [filters.view]);

  // Stats calculation from backend
  const stats = React.useMemo(() => {
    return {
      total: guardsProp.stats?.total ?? guardsProp.meta?.total ?? guardsProp.data.length,
      active: guardsProp.stats?.active ?? guardsProp.data.filter((g: Guard) => g.status === 'active').length,
      inactive: guardsProp.stats?.inactive ?? guardsProp.data.filter((g: Guard) => ['inactive', 'suspended', 'dismissed', 'absconded'].includes(g.status || '')).length,
      assigned: guardsProp.stats?.assigned ?? guardsProp.data.filter((g: Guard) => g.active_assignment).length,
      incomplete: guardsProp.stats?.incomplete ?? guardsProp.data.filter((g: Guard) => g.is_profile_complete === false).length,
    };
  }, [guardsProp]);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
      case 'inactive': return 'bg-slate-100 text-slate-800 dark:bg-slate-900/40 dark:text-slate-300';
      case 'suspended': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300';
      case 'dismissed': return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
      case 'resigned': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300';
      case 'retired': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
      case 'absconded': return 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300';
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
    }
  };

  return (
    <ControlRoomLayout title="Guards Management">
      <Head title="Guards" />

      <div className="min-h-screen bg-red-50 dark:bg-gray-900">
        {/* Hero Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-red-800 via-red-700 to-rose-800 text-white">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20" />
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                  <IconMapper name="Shield" size={28} />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">Guards Management</h1>
                  <p className="text-red-100 text-sm mt-1">Control Room guard operations and attendance</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleExport}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
                >
                  <IconMapper name="Download" size={18} className="mr-2" />
                  Export
                </Button>
                <Button 
                  onClick={() => setShowAdd(true)}
                  className="bg-white text-red-700 hover:bg-red-50"
                >
                  <IconMapper name="Plus" size={18} className="mr-2" />
                  Add Guard
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard
              icon={<IconMapper name="Users" size={24} />}
              title="Total Guards"
              value={stats.total}
              subtitle="All personnel"
              color="blue"
            />
            <StatCard
              icon={<IconMapper name="Activity" size={24} />}
              title="Active"
              value={stats.active}
              subtitle="Currently active"
              color="green"
            />
            <StatCard
              icon={<IconMapper name="MapPin" size={24} />}
              title="Assigned"
              value={stats.assigned}
              subtitle="To sites"
              color="purple"
            />
            <StatCard
              icon={<IconMapper name="AlertCircle" size={24} />}
              title="Incomplete"
              value={stats.incomplete}
              subtitle="Need attention"
              color="amber"
            />
            <StatCard
              icon={<IconMapper name="UserX" size={24} />}
              title="Inactive"
              value={stats.inactive}
              subtitle="Suspended/Dismissed"
              color="red"
            />
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2 bg-white dark:bg-gray-900 p-2 rounded-lg border border-gray-200 dark:border-gray-800 w-fit">
            <button
              onClick={() => { setView('active'); applyFilters('active'); }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                view === 'active'
                  ? 'bg-red-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <IconMapper name="Users" size={16} className="inline mr-2" />
              Active Guards
            </button>
            <button
              onClick={() => { setView('inactive'); applyFilters('inactive'); }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                view === 'inactive'
                  ? 'bg-red-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <IconMapper name="UserX" size={16} className="inline mr-2" />
              Inactive Guards
            </button>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <ActionTile
              icon={<IconMapper name="Plus" size={18} />}
              title="Add Guard"
              description="Register new guard"
              color="bg-red-600"
              onClick={() => setShowAdd(true)}
            />
            <ActionTile
              icon={<IconMapper name="MapPin" size={18} />}
              title="Assignments"
              description="Manage site assignments"
              color="bg-blue-600"
              href={route('control-room.assignments.index')}
            />
            <ActionTile
              icon={<IconMapper name="Download" size={18} />}
              title="Export CSV"
              description="Download guard list"
              color="bg-emerald-600"
              onClick={handleExport}
            />
            <ActionTile
              icon={<IconMapper name="Upload" size={18} />}
              title="Bulk Import"
              description="Import guards from Excel"
              color="bg-purple-600"
              onClick={() => setImportOpen(true)}
            />
            <ActionTile
              icon={<IconMapper name="Building2" size={18} />}
              title="Clients"
              description="View client sites"
              color="bg-cyan-600"
              href={route('control-room.clients')}
            />
          </div>

          {/* Filters */}
          <Card className="p-4 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-7 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-400"><IconMapper name="Search" size={18} /></span>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                    placeholder="Name or Employee ID..."
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                  />
                </div>
              </div>
              {view === 'active' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                  <select 
                    value={status} 
                    onChange={(e) => setStatus(e.target.value)} 
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="">All Active</option>
                    <option value="active">Active</option>
                    <option value="on_leave">On Leave</option>
                    <option value="training">Training</option>
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Profile</label>
                <select 
                  value={profileStatus} 
                  onChange={(e) => setProfileStatus(e.target.value)} 
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="">All</option>
                  <option value="complete">Complete</option>
                  <option value="incomplete">Incomplete</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Zone</label>
                <select 
                  value={zoneId} 
                  onChange={(e) => setZoneId(e.target.value)} 
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="">All</option>
                  {zones.map((z) => (<option key={z.id} value={z.id}>{z.name}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Client</label>
                <select 
                  value={clientId} 
                  onChange={(e) => setClientId(e.target.value)} 
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="">All</option>
                  {clients.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Supervisor/Sergeant</label>
                <select 
                  value={supervisorId} 
                  onChange={(e) => setSupervisorId(e.target.value)} 
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="">All</option>
                  <option value="unassigned">Unassigned</option>
                  {supervisors.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sort By</label>
                <div className="flex items-center gap-2">
                  <select 
                    value={sort} 
                    onChange={(e) => setSort(e.target.value)} 
                    className="flex-1 rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="name">Name</option>
                    <option value="employee_id">Employee ID</option>
                    <option value="status">Status</option>
                    <option value="supervisor_id">Supervisor</option>
                  </select>
                  <button 
                    onClick={() => setDir(d => d === 'asc' ? 'desc' : 'asc')} 
                    className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 text-sm"
                  >
                    {dir === 'asc' ? 'Asc' : 'Desc'}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input 
                    type="checkbox" 
                    checked={onDuty} 
                    onChange={(e) => setOnDuty(e.target.checked)} 
                    className="rounded border-gray-300 dark:border-gray-700"
                  />
                  Currently on duty
                </label>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {view === 'inactive' 
                  ? `Showing ${inactiveGuards?.data?.length || 0} inactive guards`
                  : `Page ${guardsProp.meta?.current_page ?? '-'} of ${guardsProp.meta?.last_page ?? '-'}`
                }
                {selectedGuardIds.length > 0 && (
                  <span className="ml-2 text-red-600 dark:text-red-400">({selectedGuardIds.length} selected)</span>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                {canBulkCover && view === 'active' && (
                  <Button 
                    onClick={() => setBulkCoverOpen(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-sm"
                  >
                    <IconMapper name="ShieldCheck" size={16} className="mr-1.5" />
                    Mark Covered
                  </Button>
                )}
                {canAssignSupervisor && selectedGuardIds.length > 0 && view === 'active' && (
                  <Button 
                    variant="outline" 
                    onClick={() => { setSelectedSupervisorId(''); setShowSupervisor(true); }}
                    className="text-sm"
                  >
                    <IconMapper name="UserPlus" size={16} className="mr-1.5" />
                    Assign Supervisor
                  </Button>
                )}
                <Button onClick={() => applyFilters()} className="bg-red-600 hover:bg-red-700 text-sm">
                  Apply
                </Button>
                <Button variant="outline" onClick={resetFilters} className="text-sm">
                  Reset
                </Button>
              </div>
            </div>
          </Card>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-3">
            {guardsProp.data.map((guard) => (
              <Card key={guard.id} className="overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 dark:border-gray-600"
                        checked={selectedGuardIds.includes(guard.id)}
                        onChange={() => toggleGuardSelected(guard.id)}
                      />
                      <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center text-white font-bold">
                        {guard.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">{guard.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{guard.employee_id}</div>
                        {guard.position && (
                          <Badge className="mt-1 bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200 text-xs">
                            {guard.position}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Badge className={getStatusColor(guard.status)}>
                      {guard.status || 'Active'}
                    </Badge>
                  </div>
                  
                  {guard.is_profile_complete === false && (
                    <div className="mt-2">
                      <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 text-xs">
                        Profile incomplete
                      </Badge>
                    </div>
                  )}
                  
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Supervisor:</span>
                      <div className="text-gray-700 dark:text-gray-300">{guard.supervisor?.name || '-'}</div>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Assignment:</span>
                      <div className="text-gray-700 dark:text-gray-300">
                        {guard.active_assignment ? (
                          <span className="inline-flex flex-wrap items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-800 border border-red-200 dark:bg-gray-900/40 dark:text-red-200 dark:border-gray-800 text-xs">
                            <span className="font-medium">{guard.active_assignment.client_name}</span>
                            <span className="text-red-700 dark:text-red-300">• {guard.active_assignment.site_name}</span>
                          </span>
                        ) : (
                          <span className="text-gray-400">Unassigned</span>
                        )}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500 dark:text-gray-400">Today:</span>
                      <div className="text-gray-700 dark:text-gray-300">
                        {guard.today_attendance ? (
                          <span className="text-sm">
                            {guard.today_attendance.check_in || '--:--'} → {guard.today_attendance.check_out || '--:--'}
                          </span>
                        ) : (
                          <span className="text-gray-400">No entry</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex flex-wrap gap-1">
                    <Button variant="ghost" size="sm" onClick={() => { setCurrentGuardId(guard.id); setShowAssign(true); }}>
                      <IconMapper name="MapPin" size={16} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => markPresent(guard)}
                      disabled={!canMarkPresent(guard)}
                      className={canMarkPresent(guard) ? 'text-emerald-600' : 'opacity-50'}
                    >
                      <IconMapper name="CheckCircle" size={16} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => markAbsent(guard)}
                      disabled={!canMarkAbsent(guard)}
                      className={canMarkAbsent(guard) ? 'text-red-600' : 'opacity-50'}
                    >
                      <IconMapper name="XCircle" size={16} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openView(guard.id)} disabled={viewLoading === guard.id}>
                      <IconMapper name="Eye" size={16} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => openEdit(guard)}
                      disabled={editLoading === guard.id || (guard.edit_count !== undefined && guard.edit_count >= 3)}
                    >
                      <IconMapper name="Pencil" size={16} />
                    </Button>
                    {canAssignSupervisor && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => { setCurrentGuardId(guard.id); setSelectedSupervisorId(''); setShowSupervisor(true); }}
                      >
                        <IconMapper name="UserPlus" size={16} />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Desktop Table */}
          <Card className="hidden lg:block overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 dark:border-gray-600"
                        checked={guardsProp.data.length > 0 && guardsProp.data.every((g: Guard) => selectedGuardIds.includes(g.id))}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Guard</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Employee ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Supervisor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Assignment</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Today</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {guardsProp.data.map((guard) => (
                    <tr key={guard.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 dark:border-gray-600"
                          checked={selectedGuardIds.includes(guard.id)}
                          onChange={() => toggleGuardSelected(guard.id)}
                        />
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {guard.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">{guard.name}</div>
                            {guard.position && (
                              <Badge className="mt-0.5 bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200 text-xs">
                                {guard.position}
                              </Badge>
                            )}
                            {guard.is_profile_complete === false && (
                              <Badge className="mt-0.5 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 text-xs">
                                Profile incomplete
                              </Badge>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-700 dark:text-gray-300">{guard.employee_id}</td>
                      <td className="px-6 py-3">
                        <Badge className={getStatusColor(guard.status)}>
                          {guard.status || 'Active'}
                        </Badge>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-700 dark:text-gray-300">{guard.supervisor?.name || '-'}</td>
                      <td className="px-6 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {guard.active_assignment ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-800 border border-red-200 dark:bg-gray-900/40 dark:text-red-200 dark:border-gray-800 text-xs">
                            <span className="font-medium">{guard.active_assignment.client_name}</span>
                            <span className="text-red-700 dark:text-red-300">• {guard.active_assignment.site_name}</span>
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {guard.today_attendance ? (
                          <span>
                            {guard.today_attendance.check_in || '--:--'} → {guard.today_attendance.check_out || '--:--'}
                          </span>
                        ) : (
                          <span className="text-gray-400">No entry</span>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => { setCurrentGuardId(guard.id); setShowAssign(true); }}
                            title="Assign Site"
                          >
                            <IconMapper name="MapPin" size={16} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => markPresent(guard)}
                            disabled={!canMarkPresent(guard)}
                            className={canMarkPresent(guard) ? 'text-emerald-600' : 'opacity-50'}
                            title="Mark Present"
                          >
                            <IconMapper name="CheckCircle" size={16} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => markAbsent(guard)}
                            disabled={!canMarkAbsent(guard)}
                            className={canMarkAbsent(guard) ? 'text-red-600' : 'opacity-50'}
                            title="Mark Absent"
                          >
                            <IconMapper name="XCircle" size={16} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => openView(guard.id)}
                            disabled={viewLoading === guard.id}
                            title="View Details"
                          >
                            <IconMapper name="Eye" size={16} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => openEdit(guard)}
                            disabled={editLoading === guard.id || (guard.edit_count !== undefined && guard.edit_count >= 3)}
                            title={guard.edit_count !== undefined && guard.edit_count >= 3 ? 'Edit limit reached' : `Edit (${guard.edit_count || 0}/3)`}
                          >
                            <IconMapper name="Pencil" size={16} />
                          </Button>
                          {canAssignSupervisor && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => { setCurrentGuardId(guard.id); setSelectedSupervisorId(''); setShowSupervisor(true); }}
                              title="Assign Supervisor"
                            >
                              <IconMapper name="UserPlus" size={16} />
                            </Button>
                          )}
                          {/* Action Dropdown */}
                          <div className="relative group">
                            <Button variant="ghost" size="sm" className="text-gray-600">
                              <IconMapper name="MoreVertical" size={16} />
                            </Button>
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                              {can.suspend && (
                                <button
                                  onClick={() => openReason('Suspend Guard', `Suspend ${guard.name}?`, (reason) => {
                                    router.post(route('control-room.guards.suspend', guard.id), { reason }, { preserveScroll: true });
                                  })}
                                  className="w-full px-4 py-2 text-left text-sm text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 first:rounded-t-lg"
                                >
                                  <IconMapper name="Pause" size={14} className="inline mr-2" />
                                  Suspend
                                </button>
                              )}
                              {can.dismiss && (
                                <button
                                  onClick={() => openReason('Dismiss Guard', `Dismiss ${guard.name}? This action cannot be undone.`, (reason) => {
                                    router.post(route('control-room.guards.dismiss', guard.id), { reason }, { preserveScroll: true });
                                  })}
                                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                >
                                  <IconMapper name="UserX" size={14} className="inline mr-2" />
                                  Dismiss
                                </button>
                              )}
                              <button
                                onClick={() => openReason('Mark as Resigned', `${guard.name} has resigned?`, (reason) => {
                                  router.post(route('control-room.guards.resign', guard.id), { reason }, { preserveScroll: true });
                                })}
                                className="w-full px-4 py-2 text-left text-sm text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                              >
                                <IconMapper name="LogOut" size={14} className="inline mr-2" />
                                Resigned
                              </button>
                              <button
                                onClick={() => openReason('Mark as Retired', `${guard.name} has retired?`, (reason) => {
                                  router.post(route('control-room.guards.resign', guard.id), { reason, status: 'retired' }, { preserveScroll: true });
                                })}
                                className="w-full px-4 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 last:rounded-b-lg"
                              >
                                <IconMapper name="Crown" size={14} className="inline mr-2" />
                                Retired
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Page {guardsProp.meta?.current_page ?? '-'} of {guardsProp.meta?.last_page ?? '-'}
              </div>
              {selectedGuardIds.length > 0 && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedGuardIds.length} selected
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2">
                {guardsProp.links?.filter((l: any) => l.url !== null).map((l: any, idx: number) => (
                  <button
                    key={idx}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      l.active 
                        ? 'bg-red-600 text-white' 
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => router.get(l.url, {}, { preserveScroll: true, preserveState: true })}
                    dangerouslySetInnerHTML={{ __html: l.label }}
                  />
                ))}
              </div>
            </div>
          </Card>

          {/* Empty State */}
          {guardsProp.data.length === 0 && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                <IconMapper name="Search" size={24} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No guards found</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Try adjusting your filters or search terms.</p>
            </div>
          )}
        </div>

        {/* Add Guard Modal */}
        <Modal show={showAdd} onClose={() => setShowAdd(false)} maxWidth="2xl">
          <div className="p-4 sm:p-6 bg-white dark:bg-gray-900">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <IconMapper name="UserPlus" size={20} className="text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Add Guard</h2>
            </div>
            <GuardForm
              initialData={{ status: 'active', guard_type: 'permanent' } as any}
              supervisors={supervisors}
              onSubmit={(form: any) => {
                router.post(route('control-room.guards.store'), form, {
                  preserveScroll: true,
                  onSuccess: () => { setShowAdd(false); router.reload(); },
                });
              }}
              canAssignSupervisor={canAssignSupervisor}
              errors={{}}
              hideCancel={false}
              onCancel={() => setShowAdd(false)}
            />
          </div>
        </Modal>

        {/* Edit Guard Modal */}
        <Modal show={showEdit} onClose={() => setShowEdit(false)} maxWidth="2xl">
          <div className="p-4 sm:p-6 bg-white dark:bg-gray-900">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <IconMapper name="Pencil" size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Edit Guard</h2>
            </div>
            {currentGuardData && (
              <GuardForm
                initialData={currentGuardData}
                supervisors={supervisors}
                onSubmit={(form: any) => {
                  router.put(route('control-room.guards.update', { guard: currentGuard?.id }), form, {
                    preserveScroll: true,
                    onSuccess: () => { setShowEdit(false); router.reload(); },
                  });
                }}
                canAssignSupervisor={canAssignSupervisor}
                errors={{}}
                hideCancel={false}
                onCancel={() => setShowEdit(false)}
              />
            )}
          </div>
        </Modal>

        {/* Assign Site Modal */}
        <AssignSiteModal
          open={showAssign}
          onClose={() => setShowAssign(false)}
          guardId={currentGuardId}
          zones={zones}
          scope="control-room"
          onSuccess={() => { push('Guard assigned to site', 'success'); router.reload(); }}
        />

        {/* Assign Supervisor Modal */}
        <Modal show={showSupervisor} onClose={() => setShowSupervisor(false)} maxWidth="md">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const targetIds = selectedGuardIds.length > 0 ? selectedGuardIds : (currentGuardId ? [currentGuardId] : []);
              if (!targetIds.length || !selectedSupervisorId) return;
              router.post(route('guards.assign-supervisor'), {
                guard_ids: targetIds,
                supervisor_id: Number(selectedSupervisorId),
              }, {
                preserveScroll: true,
                onSuccess: () => { setShowSupervisor(false); setSelectedGuardIds([]); router.reload(); },
              });
            }}
            className="p-4 sm:p-6 space-y-4 bg-white dark:bg-gray-900"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <IconMapper name="UserPlus" size={20} className="text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Assign Supervisor</h3>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Supervisor</label>
              <select
                value={selectedSupervisorId}
                onChange={(e) => setSelectedSupervisorId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">Select supervisor...</option>
                {supervisors.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowSupervisor(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!selectedSupervisorId} className="bg-purple-600 hover:bg-purple-700">
                Assign
              </Button>
            </div>
          </form>
        </Modal>

        {/* View Details Modal */}
        <Modal show={viewOpen} onClose={() => setViewOpen(false)} maxWidth="xl">
          <div className="p-4 sm:p-6 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <IconMapper name="User" size={20} />
              </div>
              <h2 className="text-xl font-semibold">Guard Details</h2>
            </div>
            {!viewData ? (
              <div className="text-sm text-gray-500">Loading...</div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Name</span>
                    <div className="font-medium">{viewData.name}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Employee ID</span>
                    <div className="font-medium">{viewData.employee_id}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Phone</span>
                    <div className="font-medium">{viewData.phone || '—'}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Email</span>
                    <div className="font-medium">{viewData.email || '—'}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Status</span>
                    <div>
                      <Badge className={getStatusColor(viewData.status)}>
                        {viewData.status || 'Active'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Supervisor</span>
                    <div className="font-medium">{viewData.supervisor?.name || '—'}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Modal>

        {/* Bulk Cover Modal */}
        <Modal show={bulkCoverOpen} onClose={() => setBulkCoverOpen(false)} maxWidth="md">
          <div className="p-4 sm:p-6 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <IconMapper name="ShieldCheck" size={20} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold">Bulk Mark as Covered</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              This will mark {selectedGuardIds.length} guard(s) as covered for today.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes (optional)</label>
              <textarea
                value={bulkCoverNotes}
                onChange={(e) => setBulkCoverNotes(e.target.value)}
                placeholder="Reason for covering..."
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                rows={3}
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setBulkCoverOpen(false)}>Cancel</Button>
              <Button onClick={submitBulkCover} className="bg-emerald-600 hover:bg-emerald-700">Confirm</Button>
            </div>
          </div>
        </Modal>

        {/* Bulk Import Modal */}
        <Modal show={importOpen} onClose={() => setImportOpen(false)} maxWidth="md">
          <div className="p-4 sm:p-6 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <IconMapper name="Upload" size={20} className="text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Bulk Import Guards</h3>
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
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Upload File</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Select an Excel file (.xlsx or .xls) with guard data.
                </p>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-gray-700 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-100 file:text-purple-700 dark:file:bg-purple-900/30 dark:file:text-purple-300 hover:file:bg-purple-200 dark:hover:file:bg-purple-900/50"
                />
              </div>

              <label className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <input
                  type="checkbox"
                  checked={importAllowUpdates}
                  onChange={(e) => setImportAllowUpdates(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-purple-600 focus:ring-purple-500"
                />
                <div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Update existing guards when duplicates are found</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">If unchecked, duplicate rows will be skipped.</div>
                </div>
              </label>
              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" onClick={() => setImportOpen(false)}>Cancel</Button>
                <Button
                  onClick={handleImport}
                  disabled={!importFile || importProcessing}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {importProcessing ? (
                    <>
                      <IconMapper name="Loader2" size={16} className="mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <IconMapper name="Upload" size={16} className="mr-2" />
                      Import Guards
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </Modal>
        {/* Confirm & Reason Modals */}
        <ConfirmModal
          open={confirmOpen}
          title={confirmTitle}
          message={confirmMessage}
          onConfirm={() => { setConfirmOpen(false); confirmAction(); }}
          onCancel={() => setConfirmOpen(false)}
        />
        <ReasonModal
          open={reasonOpen}
          title={reasonTitle}
          message={reasonMessage}
          confirmLabel="Submit"
          onConfirm={(reason) => { setReasonOpen(false); reasonSubmit && reasonSubmit(reason); }}
          onCancel={() => setReasonOpen(false)}
        />
      </div>
    </ControlRoomLayout>
  );
}
