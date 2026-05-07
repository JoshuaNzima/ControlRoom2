import React from 'react';
import { Head, router } from '@inertiajs/react';
import SuperAdminLayout from '@/Layouts/SuperAdminLayout';
import IconMapper from '@/Components/IconMapper';
import useNotification from '@/Providers/useNotifications';
import Modal from '@/Components/Modal';
import GuardForm from '@/Components/Guards/GuardForm';
import { GuardFormData } from '@/types/guards';
import AssignSiteModal from '@/Components/Guards/AssignSiteModal';
import PromoteGuardModal from '@/Components/HR/PromoteGuardModal';
import ConfirmModal from '@/Components/ConfirmModal';
import GuardDetailsModal from '@/Components/Guards/GuardDetailsModal';
import ReasonModal from '@/Components/ReasonModal';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';

interface Guard {
  id: number;
  name: string;
  employee_id: string;
  phone?: string;
  status?: string;
  supervisor?: { id: number; name: string } | null;
  is_profile_complete?: boolean;
  site?: { id: number; name: string; client?: { name: string } } | null;
  notes?: string;
}

interface Filters {
  search?: string;
  status?: string;
  profile_status?: string;
}

interface Supervisor { id: number; name: string }
interface GradeOption { id: number; code: string; name: string }

interface GuardsPageProps {
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
  filters: Filters & { status?: string; profile_status?: string; zone_id?: string; supervisor_id?: string; sort?: string; dir?: 'asc'|'desc'; per_page?: number|string; view?: string };
  supervisors?: Supervisor[];
  zones?: Array<{ id: number; name: string }>;
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
  color: 'red' | 'blue' | 'green' | 'amber' | 'purple';
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, subtitle, color }) => {
  const colorMap = {
    red: { bg: 'bg-red-50 dark:bg-red-950/20', border: 'border-red-200 dark:border-red-800', icon: 'bg-red-600 text-white', text: 'text-red-700 dark:text-red-300' },
    blue: { bg: 'bg-blue-50 dark:bg-blue-950/20', border: 'border-blue-200 dark:border-blue-800', icon: 'bg-blue-600 text-white', text: 'text-blue-700 dark:text-blue-300' },
    green: { bg: 'bg-emerald-50 dark:bg-emerald-950/20', border: 'border-emerald-200 dark:border-emerald-800', icon: 'bg-emerald-600 text-white', text: 'text-emerald-700 dark:text-emerald-300' },
    amber: { bg: 'bg-amber-50 dark:bg-amber-950/20', border: 'border-amber-200 dark:border-amber-800', icon: 'bg-amber-600 text-white', text: 'text-amber-700 dark:text-amber-300' },
    purple: { bg: 'bg-purple-50 dark:bg-purple-950/20', border: 'border-purple-200 dark:border-purple-800', icon: 'bg-purple-600 text-white', text: 'text-purple-700 dark:text-purple-300' },
  };
  
  const colors = colorMap[color];
  
  return (
    <div className={`${colors.bg} ${colors.border} rounded-xl border p-5 transition-all duration-300 hover:scale-[1.02]`}>
      <div className={`${colors.icon} p-3 rounded-lg shadow-md w-fit`}>
        {icon}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          <AnimatedCounter value={value} />
        </p>
        <p className={`text-sm font-medium ${colors.text} mt-1`}>{title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
};

export default function SuperAdminGuards({ guards, inactiveGuards, filters, supervisors = [], zones = [], can = { suspend: true, dismiss: true, reinstate: true } }: GuardsPageProps) {
  const [search, setSearch] = React.useState(filters.search || '');
  const [status, setStatus] = React.useState<string>(filters.status || '');
  const [profileStatus, setProfileStatus] = React.useState<string>(filters.profile_status || '');
  const [zoneId, setZoneId] = React.useState<string>(filters.zone_id || '');
  const [supervisorId, setSupervisorId] = React.useState<string>(filters.supervisor_id || '');
  const [view, setView] = React.useState<string>(filters.view || 'active');
  const [sort, setSort] = React.useState<string>(() => {
    if (filters.sort) return String(filters.sort);
    if (typeof window !== 'undefined') return window.localStorage.getItem('superadmin.guards.sort') || 'name';
    return 'name';
  });
  const [dir, setDir] = React.useState<'asc'|'desc'>(() => {
    if (filters.dir === 'desc') return 'desc';
    if (typeof window !== 'undefined') return (window.localStorage.getItem('superadmin.guards.dir') as any) === 'desc' ? 'desc' : 'asc';
    return 'asc';
  });
  const [perPage, setPerPage] = React.useState<string>(() => {
    if (filters.per_page) return String(filters.per_page);
    if (typeof window !== 'undefined') return window.localStorage.getItem('superadmin.guards.perPage') || '20';
    return '20';
  });
  const [loadingId, setLoadingId] = React.useState<number | null>(null);
  const [processingId, setProcessingId] = React.useState<number | null>(null);
  const [actionLoading, setActionLoading] = React.useState<Record<string, boolean>>({});
  const { push } = useNotification();

  // Modals
  const [showAdd, setShowAdd] = React.useState(false);
  const [showEdit, setShowEdit] = React.useState(false);
  const [selectedGuardDetails, setSelectedGuardDetails] = React.useState<any | null>(null);
  const [showAssign, setShowAssign] = React.useState(false);
  const [showPromote, setShowPromote] = React.useState(false);
  const [selectedGuard, setSelectedGuard] = React.useState<any | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [selectedGuardIds, setSelectedGuardIds] = React.useState<number[]>([]);
  const [showSupervisor, setShowSupervisor] = React.useState(false);
  const [selectedSupervisorId, setSelectedSupervisorId] = React.useState<string>('');
  
  // Confirm & Reason modals
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [confirmTitle, setConfirmTitle] = React.useState('');
  const [confirmMessage, setConfirmMessage] = React.useState('');
  const [confirmAction, setConfirmAction] = React.useState<() => void>(() => {});
  const [reasonOpen, setReasonOpen] = React.useState(false);
  const [reasonTitle, setReasonTitle] = React.useState('');
  const [reasonMessage, setReasonMessage] = React.useState('');
  const [reasonSubmit, setReasonSubmit] = React.useState<((reason: string) => void) | null>(null);
  
  // Bulk import state
  const [importOpen, setImportOpen] = React.useState(false);
  const [importFile, setImportFile] = React.useState<File | null>(null);
  const [importProcessing, setImportProcessing] = React.useState(false);
  const [importAllowUpdates, setImportAllowUpdates] = React.useState(false);

  // Helper to get guard initials
  const getInitials = (name: string): string => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const openConfirm = (title: string, message: string, action: () => void) => {
    setConfirmTitle(title); setConfirmMessage(message); setConfirmAction(() => action); setConfirmOpen(true);
  };
  const openReason = (title: string, message: string, submit: (reason: string) => void) => {
    setReasonTitle(title); setReasonMessage(message); setReasonSubmit(() => submit); setReasonOpen(true);
  };

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('superadmin.guards.sort', sort);
    window.localStorage.setItem('superadmin.guards.dir', dir);
    window.localStorage.setItem('superadmin.guards.perPage', perPage);
  }, [sort, dir, perPage]);

  React.useEffect(() => {
    if (filters.view && filters.view !== view) {
      setView(filters.view);
    }
  }, [filters.view]);

  const applyFilters = (viewOverride?: string) => {
    const currentView = viewOverride || view;
    const query: Record<string, any> = {
      search: search || undefined,
      status: currentView === 'inactive' ? undefined : (status || undefined),
      profile_status: profileStatus || undefined,
      zone_id: zoneId || undefined,
      supervisor_id: supervisorId || undefined,
      sort,
      dir,
      per_page: perPage,
      view: currentView,
    };
    router.get(route('superadmin.guards'), query, { preserveState: false, preserveScroll: true });
  };
  
  const resetFilters = () => {
    setSearch(''); setStatus(''); setProfileStatus(''); setZoneId(''); setSupervisorId(''); setSort('name'); setDir('asc'); setPerPage('20'); setView('active');
    router.get(route('superadmin.guards'), {}, { preserveState: false, preserveScroll: true });
  };

  const handleExport = () => {
    const query: Record<string, any> = {
      search: search || undefined,
      status: view === 'inactive' ? undefined : (status || undefined),
      profile_status: profileStatus || undefined,
      zone_id: zoneId || undefined,
      supervisor_id: supervisorId || undefined,
      sort,
      dir,
    };
    const url = route('admin.guards.export', query);
    window.location.href = url;
  };

  const handleImport = () => {
    if (!importFile) return;
    setImportProcessing(true);
    const formData = new FormData();
    formData.append('file', importFile);
    formData.append('allow_updates', importAllowUpdates ? '1' : '0');
    router.post(route('superadmin.guards.bulk-import'), formData, {
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
    window.open(route('superadmin.guards.bulk-import-template'), '_blank');
  };

  function showToast(message: string) {
    push(message, 'info');
  }

  const openAdd = () => { setSelectedGuard(null); setShowAdd(true); };
  const openEdit = async (guardId: number) => {
    try {
      const url = route('admin.guards.json', guardId);
      const res = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        credentials: 'same-origin',
      });
      if (!res.ok) {
        console.error('Failed to fetch guard details:', res.status, res.statusText);
        push('Failed to load guard details. Please try again.', 'error');
        return;
      }
      const data = await res.json();
      setSelectedGuard(data);
      setShowEdit(true);
    } catch (e) {
      console.error('Error fetching guard details:', e);
      push('Failed to load guard details. Please try again.', 'error');
    }
  };
  const openDetails = async (guardId: number) => {
    try {
      setLoadingId(guardId);
      const url = route('admin.guards.json', guardId);
      const res = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        credentials: 'same-origin',
      });
      if (!res.ok) {
        console.error('Failed to fetch guard details:', res.status, res.statusText);
        push('Failed to load guard details. Please try again.', 'error');
        return;
      }
      const data = await res.json();
      setSelectedGuardDetails(data);
    } catch (e) {
      console.error('Error fetching guard details:', e);
      push('Failed to load guard details. Please try again.', 'error');
    } finally {
      setLoadingId(null);
    }
  };
  const openPromote = async (guardId: number) => {
    try {
      const url = route('admin.guards.json', guardId);
      const res = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        credentials: 'same-origin',
      });
      if (!res.ok) {
        console.error('Failed to fetch guard details:', res.status, res.statusText);
        push('Failed to load guard details. Please try again.', 'error');
        return;
      }
      const data = await res.json();
      setSelectedGuard(data);
      setShowPromote(true);
    } catch (e) {
      console.error('Error fetching guard details:', e);
      push('Failed to load guard details. Please try again.', 'error');
    }
  };
  const openAssign = (guardId: number) => { setSelectedGuard({ id: guardId }); setShowAssign(true); };

  const handleComplianceUpdate = async (guardId: number, data: { fingerprint_registered?: boolean; uniform_issued?: boolean; equipment_issued?: string[] }) => {
    try {
      const res = await fetch(route('admin.guards.compliance', guardId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
        },
        credentials: 'same-origin',
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.success && selectedGuardDetails) {
        setSelectedGuardDetails({
          ...selectedGuardDetails,
          ...result.guard,
        });
      }
    } catch (error) {
      console.error('Failed to update compliance:', error);
      push('Failed to update compliance', 'error');
    }
  };

  const submitCreate = async (formData: FormData) => {
    setSaving(true);
    router.post(route('admin.guards.store'), formData, {
      preserveScroll: true,
      onFinish: () => setSaving(false),
      onSuccess: () => { setShowAdd(false); push('Guard created successfully', 'success'); },
      onError: (errs) => { push(Object.values(errs)[0] || 'Failed to create guard', 'error'); },
    });
  };

  const submitUpdate = async (formData: FormData) => {
    if (!selectedGuard) return;
    setSaving(true);
    router.put(route('admin.guards.update', { guard: selectedGuard.id }), formData, {
      preserveScroll: true,
      onFinish: () => setSaving(false),
      onSuccess: () => { setShowEdit(false); push('Guard updated successfully', 'success'); },
      onError: (errs) => { push(Object.values(errs)[0] || 'Failed to update guard', 'error'); },
    });
  };

  const toggleGuardSelected = (id: number) => {
    setSelectedGuardIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const toggleSelectAll = () => {
    const idsOnPage = guards.data.map((g: Guard) => g.id);
    const allSelected = idsOnPage.every((id: number) => selectedGuardIds.includes(id));
    if (allSelected) {
      setSelectedGuardIds(prev => prev.filter(id => !idsOnPage.includes(id)));
    } else {
      setSelectedGuardIds(prev => Array.from(new Set([...prev, ...idsOnPage])));
    }
  };

  // Stats calculation from backend
  const stats = React.useMemo(() => {
    return {
      total: guards.stats?.total ?? guards.meta?.total ?? guards.data.length,
      active: guards.stats?.active ?? guards.data.filter((g: Guard) => g.status === 'active').length,
      inactive: guards.stats?.inactive ?? guards.data.filter((g: Guard) => ['inactive', 'suspended', 'dismissed', 'absconded'].includes(g.status || '')).length,
      incomplete: guards.stats?.incomplete ?? guards.data.filter((g: Guard) => g.is_profile_complete === false).length,
      assigned: guards.stats?.assigned ?? guards.data.filter((g: Guard) => g.site).length,
    };
  }, [guards]);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
      case 'inactive': return 'bg-slate-100 text-slate-800 dark:bg-slate-900/40 dark:text-slate-300';
      case 'suspended': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300';
      case 'dismissed': return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
      case 'resigned': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300';
      case 'retired': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
      case 'absconded': return 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <SuperAdminLayout title="Guards Management">
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
                  <p className="text-red-100 text-sm mt-1">Manage field guards and assignments</p>
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
                  variant="outline"
                  onClick={() => setImportOpen(true)}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
                >
                  <IconMapper name="Upload" size={18} className="mr-2" />
                  Bulk Import
                </Button>
                <Button 
                  onClick={openAdd}
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
              color="red"
            />
            <StatCard
              icon={<IconMapper name="Activity" size={24} />}
              title="Active Guards"
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
              subtitle="Profiles need attention"
              color="amber"
            />
            <StatCard
              icon={<IconMapper name="UserX" size={24} />}
              title="Inactive"
              value={stats.inactive}
              subtitle="Suspended/Dismissed/etc"
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

          {/* Filters */}
          <Card className="p-4 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
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
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {view === 'inactive' 
                  ? `Showing ${inactiveGuards?.data?.length || 0} inactive guards`
                  : `Page ${guards.meta?.current_page ?? '-'} of ${guards.meta?.last_page ?? '-'}`
                }
              </div>
            </div>
          </Card>

          {/* Mobile Cards - Active Guards */}
          {view === 'active' && (
            <div className="lg:hidden space-y-3">
              {guards.data.map((guard) => (
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
                        <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                          {getInitials(guard.name)}
                        </div>
                        <div>
                          <button onClick={() => openDetails(guard.id)} className="text-left">
                            <div className="font-medium text-gray-900 dark:text-gray-100 hover:underline">{guard.name}</div>
                          </button>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{guard.employee_id}</div>
                        </div>
                      </div>
                      <Badge className={getStatusColor(guard.status)}>
                        {guard.status || 'Active'}
                      </Badge>
                    </div>
                    
                    {guard.is_profile_complete === false && (
                      <div className="mt-2">
                        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
                          Profile incomplete
                        </Badge>
                      </div>
                    )}
                    
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Supervisor:</span>
                        <div className="text-gray-700 dark:text-gray-300">{guard.supervisor?.name || 'Unassigned'}</div>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Site:</span>
                        <div className="text-gray-700 dark:text-gray-300">{guard.site?.name || 'Unassigned'}</div>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex flex-wrap gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openDetails(guard.id)} title="View Details">
                        <IconMapper name="Eye" size={16} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(guard.id)}>
                        <IconMapper name="Pencil" size={16} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openAssign(guard.id)}>
                        <IconMapper name="MapPin" size={16} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openPromote(guard.id)}>
                        <IconMapper name="ArrowUpCircle" size={16} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => { setSelectedSupervisorId(''); setShowSupervisor(true); setSelectedGuardIds([guard.id]); }}
                      >
                        <IconMapper name="UserPlus" size={16} />
                      </Button>
                      {can.suspend && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={processingId === guard.id}
                          onClick={() => openReason('Suspend Guard', `Suspend ${guard.name}? This will prevent them from being assigned to sites.`, (reason) => {
                            setProcessingId(guard.id);
                            router.post(route('admin.guards.suspend', guard.id), { reason }, {
                              preserveScroll: true,
                              onFinish: () => setProcessingId(null),
                              onSuccess: () => push('Guard suspended', 'success'),
                              onError: (errs) => { setProcessingId(null); push(Object.values(errs)[0] || 'Failed to suspend guard', 'error'); },
                            });
                          })}
                          className="text-yellow-600"
                        >
                          <IconMapper name={processingId === guard.id ? 'Loader2' : 'Pause'} size={16} className={processingId === guard.id ? 'animate-spin' : ''} />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Mobile Cards - Inactive Guards */}
          {view === 'inactive' && inactiveGuards && (
            <div className="lg:hidden space-y-3">
              {inactiveGuards.data.map((guard) => (
                <Card key={guard.id} className="overflow-hidden border-l-4 border-l-red-500">
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                          {getInitials(guard.name)}
                        </div>
                        <div>
                          <button onClick={() => openDetails(guard.id)} className="text-left">
                            <div className="font-medium text-gray-900 dark:text-gray-100 hover:underline">{guard.name}</div>
                          </button>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{guard.employee_id}</div>
                        </div>
                      </div>
                      <Badge className={getStatusColor(guard.status)}>
                        {guard.status || 'Inactive'}
                      </Badge>
                    </div>
                    
                    <div className="mt-3 text-sm">
                      <div className="text-gray-500 dark:text-gray-400">Reason:</div>
                      <div className="text-gray-700 dark:text-gray-300 text-xs mt-1 line-clamp-2">{guard.notes || 'No reason recorded'}</div>
                    </div>
                    
                    <div className="mt-3 flex flex-wrap gap-1">
                      {can.reinstate && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={processingId === guard.id}
                          onClick={() => openConfirm('Reinstate Guard', `Reinstate ${guard.name}? This will restore them to active duty.`, () => {
                            setProcessingId(guard.id);
                            router.post(route('admin.guards.reinstate', guard.id), {}, {
                              preserveScroll: true,
                              onFinish: () => setProcessingId(null),
                              onSuccess: () => push('Guard reinstated', 'success'),
                              onError: (errs) => { setProcessingId(null); push(Object.values(errs)[0] || 'Failed to reinstate guard', 'error'); },
                            });
                          })}
                          className="text-green-600"
                        >
                          <IconMapper name={processingId === guard.id ? 'Loader2' : 'RotateCcw'} size={16} className={processingId === guard.id ? 'animate-spin' : ''} />
                          <span className="ml-1">Reinstate</span>
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => openDetails(guard.id)}>
                        <IconMapper name="Eye" size={16} />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Desktop Table - Active Guards */}
          {view === 'active' && (
            <Card className="hidden lg:block overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900/50">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 dark:border-gray-600"
                          checked={guards.data.length > 0 && guards.data.every((g: Guard) => selectedGuardIds.includes(g.id))}
                          onChange={toggleSelectAll}
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Guard</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Employee ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Supervisor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Site</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {guards.data.map((guard) => (
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
                            <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-md">
                              {getInitials(guard.name)}
                            </div>
                            <div>
                              <button onClick={() => openDetails(guard.id)} className="text-left hover:underline">
                                <div className="font-medium text-gray-900 dark:text-gray-100">{guard.name}</div>
                              </button>
                              {guard.is_profile_complete === false && (
                                <Badge className="mt-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 text-xs">
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
                        <td className="px-6 py-3 text-sm text-gray-700 dark:text-gray-300">{guard.supervisor?.name || 'Unassigned'}</td>
                        <td className="px-6 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {guard.site ? (
                            <div>
                              <div className="font-medium">{guard.site.name}</div>
                              {guard.site.client && (
                                <div className="text-xs text-gray-500">{guard.site.client.name}</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">Unassigned</span>
                          )}
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openDetails(guard.id)} title="View Details">
                              <IconMapper name="Eye" size={16} />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => openEdit(guard.id)} title="Edit">
                              <IconMapper name="Pencil" size={16} />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => openAssign(guard.id)} title="Assign Site">
                              <IconMapper name="MapPin" size={16} />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => openPromote(guard.id)} title="Promote">
                              <IconMapper name="ArrowUpCircle" size={16} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => { setSelectedSupervisorId(''); setShowSupervisor(true); setSelectedGuardIds([guard.id]); }}
                              title="Assign Supervisor"
                            >
                              <IconMapper name="UserPlus" size={16} />
                            </Button>
                            {/* Action Dropdown */}
                            <div className="relative group">
                              <Button variant="ghost" size="sm" className="text-gray-600">
                                <IconMapper name="MoreVertical" size={16} />
                              </Button>
                              <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                                {can.suspend && (
                                  <button
                                    disabled={processingId === guard.id}
                                    onClick={() => openReason('Suspend Guard', `Suspend ${guard.name}?`, (reason) => {
                                      setProcessingId(guard.id);
                                      router.post(route('admin.guards.suspend', guard.id), { reason }, {
                                        preserveScroll: true,
                                        onFinish: () => setProcessingId(null),
                                        onSuccess: () => push('Guard suspended', 'success'),
                                        onError: (errs) => { setProcessingId(null); push(Object.values(errs)[0] || 'Failed to suspend guard', 'error'); },
                                      });
                                    })}
                                    className="w-full px-4 py-2 text-left text-sm text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 first:rounded-t-lg disabled:opacity-50"
                                  >
                                    <IconMapper name={processingId === guard.id ? 'Loader2' : 'Pause'} size={14} className={`inline mr-2 ${processingId === guard.id ? 'animate-spin' : ''}`} />
                                    Suspend
                                  </button>
                                )}
                                {can.dismiss && (
                                  <button
                                    disabled={processingId === guard.id}
                                    onClick={() => openReason('Dismiss Guard', `Dismiss ${guard.name}? This action cannot be undone.`, (reason) => {
                                      setProcessingId(guard.id);
                                      router.post(route('admin.guards.dismiss', guard.id), { reason }, {
                                        preserveScroll: true,
                                        onFinish: () => setProcessingId(null),
                                        onSuccess: () => push('Guard dismissed', 'success'),
                                        onError: (errs) => { setProcessingId(null); push(Object.values(errs)[0] || 'Failed to dismiss guard', 'error'); },
                                      });
                                    })}
                                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                                  >
                                    <IconMapper name={processingId === guard.id ? 'Loader2' : 'UserX'} size={14} className={`inline mr-2 ${processingId === guard.id ? 'animate-spin' : ''}`} />
                                    Dismiss
                                  </button>
                                )}
                                <button
                                  disabled={processingId === guard.id}
                                  onClick={() => openReason('Mark as Resigned', `${guard.name} has resigned?`, (reason) => {
                                    setProcessingId(guard.id);
                                    router.post(route('admin.guards.resign', guard.id), { reason }, {
                                      preserveScroll: true,
                                      onFinish: () => setProcessingId(null),
                                      onSuccess: () => push('Guard marked as resigned', 'success'),
                                      onError: (errs) => { setProcessingId(null); push(Object.values(errs)[0] || 'Failed to mark guard as resigned', 'error'); },
                                    });
                                  })}
                                  className="w-full px-4 py-2 text-left text-sm text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 disabled:opacity-50"
                                >
                                  <IconMapper name={processingId === guard.id ? 'Loader2' : 'LogOut'} size={14} className={`inline mr-2 ${processingId === guard.id ? 'animate-spin' : ''}`} />
                                  Resigned
                                </button>
                                <button
                                  disabled={processingId === guard.id}
                                  onClick={() => openReason('Mark as Retired', `${guard.name} has retired?`, (reason) => {
                                    setProcessingId(guard.id);
                                    router.post(route('admin.guards.resign', guard.id), { reason, status: 'retired' }, {
                                      preserveScroll: true,
                                      onFinish: () => setProcessingId(null),
                                      onSuccess: () => push('Guard marked as retired', 'success'),
                                      onError: (errs) => { setProcessingId(null); push(Object.values(errs)[0] || 'Failed to mark guard as retired', 'error'); },
                                    });
                                  })}
                                  className="w-full px-4 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 last:rounded-b-lg disabled:opacity-50"
                                >
                                  <IconMapper name={processingId === guard.id ? 'Loader2' : 'Crown'} size={14} className={`inline mr-2 ${processingId === guard.id ? 'animate-spin' : ''}`} />
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
              <div className="px-2 sm:px-4 py-2 sm:py-3 border-t border-gray-200 dark:border-gray-700">
                {/* Mobile: Simple prev/next */}
                <div className="flex sm:hidden justify-between items-center gap-2">
                  <button
                    onClick={() => {
                      const prevLink = guards.links?.find((l: any) => l.label.includes('Previous') || l.label.includes('«'));
                      if (prevLink?.url) router.get(prevLink.url, {}, { preserveScroll: true, preserveState: true });
                    }}
                    disabled={!guards.links?.some((l: any) => l.label.includes('Previous') || l.label.includes('«'))}
                    className="touch-target-min px-3 py-2 text-xs font-medium rounded border dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 disabled:opacity-50"
                  >
                    <IconMapper name="ChevronLeft" size={14} className="mr-1" />
                    Prev
                  </button>
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    {guards.meta?.current_page ?? '-'} / {guards.meta?.last_page ?? '-'}
                  </span>
                  <button
                    onClick={() => {
                      const nextLink = guards.links?.find((l: any) => l.label.includes('Next') || l.label.includes('»'));
                      if (nextLink?.url) router.get(nextLink.url, {}, { preserveScroll: true, preserveState: true });
                    }}
                    disabled={!guards.links?.some((l: any) => l.label.includes('Next') || l.label.includes('»'))}
                    className="touch-target-min px-3 py-2 text-xs font-medium rounded border dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 disabled:opacity-50"
                  >
                    Next
                    <IconMapper name="ChevronRight" size={14} className="ml-1" />
                  </button>
                </div>

                {/* Desktop: Full pagination */}
                <div className="hidden sm:flex sm:flex-row items-center justify-between gap-3">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Page {guards.meta?.current_page ?? '-'} of {guards.meta?.last_page ?? '-'}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 justify-end">
                    {Array.isArray(guards.links) && guards.links.filter((l: any) => l.url !== null).map((l: any, idx: number) => (
                      <button
                        key={idx}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors touch-target-min ${
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
              </div>
            </Card>
          )}

          {/* Desktop Table - Inactive Guards */}
          {view === 'inactive' && inactiveGuards && (
            <Card className="hidden lg:block overflow-hidden border-t-4 border-t-red-500">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-100 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Guard</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Employee ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Reason / Notes</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {inactiveGuards.data.map((guard) => (
                      <tr key={guard.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                              {guard.name.charAt(0)}
                            </div>
                            <div>
                              <button onClick={() => openDetails(guard.id)} className="text-left hover:underline">
                                <div className="font-medium text-gray-900 dark:text-gray-100">{guard.name}</div>
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-700 dark:text-gray-300">{guard.employee_id}</td>
                        <td className="px-6 py-3">
                          <Badge className={getStatusColor(guard.status)}>
                            {guard.status || 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-700 dark:text-gray-300 max-w-xs">
                          <div className="truncate" title={guard.notes || ''}>
                            {guard.notes || 'No reason recorded'}
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-1">
                            {can.reinstate && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => openConfirm('Reinstate Guard', `Reinstate ${guard.name}? This will restore them to active duty.`, () => {
                                  router.post(route('admin.guards.reinstate', guard.id), {}, { preserveScroll: true });
                                })}
                                className="text-green-600"
                              >
                                <IconMapper name="RotateCcw" size={16} />
                                <span className="ml-1">Reinstate</span>
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => openDetails(guard.id)} title="View Details">
                              <IconMapper name="Eye" size={16} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {inactiveGuards.meta && (
                <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Page {inactiveGuards.meta?.current_page ?? '-'} of {inactiveGuards.meta?.last_page ?? '-'}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {Array.isArray(inactiveGuards.links) && inactiveGuards.links.filter((l: any) => l.url !== null).map((l: any, idx: number) => (
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
              )}
            </Card>
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
              onSubmit={submitCreate}
              canAssignSupervisor={true}
              processing={saving}
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
            {selectedGuard && (
              <GuardForm
                initialData={selectedGuard}
                supervisors={supervisors}
                onSubmit={submitUpdate}
                canAssignSupervisor={true}
                processing={saving}
                errors={{}}
                hideCancel={false}
                onCancel={() => setShowEdit(false)}
              />
            )}
          </div>
        </Modal>

        {/* Guard Details Modal */}
        <GuardDetailsModal
          open={!!selectedGuardDetails}
          onClose={() => setSelectedGuardDetails(null)}
          guard={selectedGuardDetails}
          onEdit={selectedGuardDetails ? () => { setSelectedGuard(selectedGuardDetails); setSelectedGuardDetails(null); setShowEdit(true); } : undefined}
          onAssign={selectedGuardDetails ? () => { setSelectedGuard(selectedGuardDetails); setSelectedGuardDetails(null); setShowAssign(true); } : undefined}
          scope="superadmin"
          onComplianceUpdate={handleComplianceUpdate}
        />

        {/* Assign to Site Modal */}
        <AssignSiteModal
          open={showAssign}
          onClose={() => setShowAssign(false)}
          guardId={selectedGuard?.id ?? null}
          zones={zones}
          scope="superadmin"
          onSuccess={() => { push('Guard assigned to site', 'success'); router.reload(); }}
        />

        {/* Promote Guard Modal */}
        <PromoteGuardModal
          open={showPromote}
          guard={selectedGuard}
          zones={zones}
          onClose={() => setShowPromote(false)}
          onSuccess={() => push('Guard promoted')}
        />

        {/* Assign Supervisor Modal */}
        <Modal show={showSupervisor} onClose={() => setShowSupervisor(false)} maxWidth="md">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const targetIds = selectedGuardIds.length > 0 ? selectedGuardIds : (selectedGuard?.id ? [selectedGuard.id] : []);
              if (!targetIds.length || !selectedSupervisorId) return;
              setActionLoading(prev => ({ ...prev, assignSupervisor: true }));
              router.post(route('guards.assign-supervisor'), {
                guard_ids: targetIds,
                supervisor_id: Number(selectedSupervisorId),
              }, {
                preserveScroll: true,
                onFinish: () => setActionLoading(prev => ({ ...prev, assignSupervisor: false })),
                onSuccess: () => { setShowSupervisor(false); setSelectedGuardIds([]); router.reload(); push('Supervisor assigned', 'success'); },
                onError: (errs) => { push(Object.values(errs)[0] || 'Failed to assign supervisor', 'error'); },
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
              <Button
                type="button"
                variant="outline"
                disabled={actionLoading.unassignSupervisor}
                onClick={() => {
                  const targetIds = selectedGuardIds.length > 0 ? selectedGuardIds : (selectedGuard?.id ? [selectedGuard.id] : []);
                  if (!targetIds.length) return;
                  if (!confirm('Unassign supervisor from selected guard(s)?')) return;
                  setActionLoading(prev => ({ ...prev, unassignSupervisor: true }));
                  router.post(route('guards.unassign-supervisor'), { guard_ids: targetIds }, {
                    preserveScroll: true,
                    onFinish: () => setActionLoading(prev => ({ ...prev, unassignSupervisor: false })),
                    onSuccess: () => { setShowSupervisor(false); setSelectedGuardIds([]); router.reload(); push('Supervisor unassigned', 'success'); },
                    onError: (errs) => { push(Object.values(errs)[0] || 'Failed to unassign supervisor', 'error'); },
                  });
                }}
                className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
              >
                {actionLoading.unassignSupervisor ? (
                  <><IconMapper name="Loader2" size={16} className="mr-2 animate-spin" /> Unassigning...</>
                ) : 'Unassign'}
              </Button>
              <Button type="submit" disabled={!selectedSupervisorId || actionLoading.assignSupervisor} className="bg-purple-600 hover:bg-purple-700">
                {actionLoading.assignSupervisor ? (
                  <><IconMapper name="Loader2" size={16} className="mr-2 animate-spin" /> Assigning...</>
                ) : 'Assign'}
              </Button>
            </div>
          </form>
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
      </div>
    </SuperAdminLayout>
  );
}
