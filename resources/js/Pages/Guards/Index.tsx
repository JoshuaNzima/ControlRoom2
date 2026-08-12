import React, { useState, useEffect, useMemo } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Badge } from '@/Components/ui/badge';
import { Label } from '@/Components/ui/label';
import IconMapper from '@/Components/IconMapper';
import Modal from '@/Components/Modal';
import ScannerModal from '@/Components/Scanner/ScannerModal';
import CameraCapture from '@/Components/CameraCapture';
import GuardFilterBar from '@/Components/Guards/GuardFilterBar';
import GuardListItem from '@/Components/Guards/GuardListItem';
import StatusBadge from '@/Components/Guards/StatusBadge';
import useNotification from '@/Providers/useNotifications';

/* ─── Types ─────────────────────────────────────────────────────────────── */

export type GuardsMode =
  | 'view-only'        // Read-only guard directory
  | 'attendance-basic' // Mark present/absent + check-out + assign site
  | 'attendance-full'  // Full check-in/out, bulk, backdate, time overrides
  | 'control-room'     // Attendance + status changes + assignments + limited CRUD + import/export
  | 'admin'            // Everything: full CRUD, compliance, all status changes, export

interface Guard {
  id: number;
  name: string;
  employee_id: string;
  phone?: string;
  email?: string;
  status: string;
  guard_type?: 'permanent' | 'reliever' | 'standby';
  employee_role?: string;
  position?: string;
  is_on_duty?: boolean;
  is_profile_complete?: boolean;
  edit_count?: number;
  grade_id?: number;
  zone_id?: number;
  supervisor_id?: number;
  risk_level?: string;
  attendance_rate?: number;
  performance_score?: number;
  shifts_this_month?: number;
  incidents_count?: number;
  joined_date?: string;
  hire_date?: string;
  supervisor?: { id: number; name: string } | null;
  site?: { id: number; name: string } | null;
  zone?: { id: number; name: string } | null;
  grade?: { code?: string; name?: string } | null;
  current_assignment?: {
    site_name: string;
    client_name: string;
    site_id?: number;
  } | null;
  today_attendance?: {
    check_in: string | null;
    check_out: string | null;
    status?: string;
    source?: string;
  } | null;
  attendance?: {
    id: number;
    check_in_time: string;
    check_out_time?: string | null;
    status: string;
    site?: string | null;
    hours_worked?: number | null;
  } | null;
  active_assignment?: {
    site_id: number | null;
    site_name: string | null;
    client_name: string | null;
  } | null;
  profile_missing_fields?: string[];
  next_of_kin_name?: string;
  next_of_kin_phone?: string;
  emergency_contact?: string;
  emergency_phone?: string;
}

interface Site {
  id: number;
  name: string;
  client_name: string;
  full_name: string;
}

interface ActiveScan {
  scan_id: number;
  site_id: number;
  site_name: string;
  client_name: string;
  scanned_at: string;
  expires_at: string;
}

interface Stats {
  total: number;
  active: number;
  on_duty: number;
  off_duty: number;
  assigned?: number;
  incomplete?: number;
  inactive?: number;
  average_attendance?: number;
  average_performance?: number;
  total_incidents?: number;
  total_guards?: number;
  active_guards?: number;
  on_duty_today?: number;
}

interface Props {
  guards: {
    data: Guard[];
    links?: any[];
    meta?: any;
    stats?: Stats;
  };
  inactiveGuards?: {
    data: Guard[];
    meta?: any;
    links?: any[];
  };
  sites?: Site[];
  filters?: Record<string, any>;
  zones?: Array<{ id: number; name: string }>;
  grades?: Array<{ id: number; code: string; name: string }>;
  clients?: Array<{ id: number; name: string }>;
  supervisors?: Array<{ id: number; name: string }>;
  stats?: Stats;
  mode: GuardsMode;
  activeScan?: ActiveScan | null;
  requireSiteScan?: boolean;
  can?: {
    suspend?: boolean;
    dismiss?: boolean;
    reinstate?: boolean;
  };
  auth?: { user?: any };
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

type SortField = 'name' | 'employee_id' | 'status';
type SortDirection = 'asc' | 'desc';

const MODE_FEATURES: Record<GuardsMode, {
  searchFilter: boolean; guardType: boolean; sort: boolean;
  viewDetails: boolean; quickPresent: boolean; quickAbsent: boolean;
  checkIn: boolean; checkOut: boolean; bulkCheckInOut: boolean;
  bulkCover: boolean; assignSite: boolean; assignSupervisor: boolean;
  suspendDismiss: boolean; addGuard: boolean; editGuard: boolean;
  importExport: boolean; compliance: boolean; scanner: boolean;
}> = {
  'view-only':        { searchFilter: true, guardType: true, sort: true, viewDetails: true, quickPresent: false, quickAbsent: false, checkIn: false, checkOut: false, bulkCheckInOut: false, bulkCover: false, assignSite: false, assignSupervisor: false, suspendDismiss: false, addGuard: false, editGuard: false, importExport: false, compliance: false, scanner: false },
  'attendance-basic': { searchFilter: true, guardType: true, sort: true, viewDetails: true, quickPresent: true, quickAbsent: true, checkIn: false, checkOut: true, bulkCheckInOut: false, bulkCover: false, assignSite: true, assignSupervisor: false, suspendDismiss: false, addGuard: false, editGuard: false, importExport: false, compliance: false, scanner: false },
  'attendance-full':  { searchFilter: true, guardType: true, sort: true, viewDetails: true, quickPresent: true, quickAbsent: true, checkIn: true, checkOut: true, bulkCheckInOut: true, bulkCover: false, assignSite: false, assignSupervisor: false, suspendDismiss: false, addGuard: false, editGuard: false, importExport: false, compliance: false, scanner: true },
  'control-room':     { searchFilter: true, guardType: true, sort: true, viewDetails: true, quickPresent: true, quickAbsent: true, checkIn: true, checkOut: true, bulkCheckInOut: false, bulkCover: true, assignSite: true, assignSupervisor: true, suspendDismiss: true, addGuard: true, editGuard: true, importExport: true, compliance: true, scanner: false },
  'admin':            { searchFilter: true, guardType: true, sort: true, viewDetails: true, quickPresent: true, quickAbsent: true, checkIn: true, checkOut: true, bulkCheckInOut: true, bulkCover: false, assignSite: true, assignSupervisor: true, suspendDismiss: true, addGuard: true, editGuard: true, importExport: true, compliance: true, scanner: false },
};

const feat = (mode: GuardsMode) => MODE_FEATURES[mode];

/* ─── Animated Counter ──────────────────────────────────────────────────── */

const AnimatedCounter: React.FC<{ value: number; duration?: number }> = ({ value, duration = 1000 }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let startTime: number, anim: number;
    const fn = (ts: number) => {
      if (!startTime) startTime = ts;
      const p = Math.min((ts - startTime) / duration, 1);
      setCount(Math.floor(p * value));
      if (p < 1) anim = requestAnimationFrame(fn);
    };
    anim = requestAnimationFrame(fn);
    return () => cancelAnimationFrame(anim);
  }, [value, duration]);
  return <span>{count.toLocaleString()}</span>;
};

/* ─── Stat Card ──────────────────────────────────────────────────────────── */

interface StatCardProps {
  icon: React.ReactNode; title: string; value: number; subtitle: string;
  color: 'red' | 'blue' | 'green' | 'amber' | 'purple' | 'cyan';
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, subtitle, color }) => {
  const cm = {
    red: { bg: 'bg-red-50 dark:bg-red-950/20', border: 'border-red-200 dark:border-red-800', icon: 'bg-red-600 text-white', text: 'text-red-700 dark:text-red-300' },
    blue: { bg: 'bg-blue-50 dark:bg-blue-950/20', border: 'border-blue-200 dark:border-blue-800', icon: 'bg-blue-600 text-white', text: 'text-blue-700 dark:text-blue-300' },
    green: { bg: 'bg-emerald-50 dark:bg-emerald-950/20', border: 'border-emerald-200 dark:border-emerald-800', icon: 'bg-emerald-600 text-white', text: 'text-emerald-700 dark:text-emerald-300' },
    amber: { bg: 'bg-amber-50 dark:bg-amber-950/20', border: 'border-amber-200 dark:border-amber-800', icon: 'bg-amber-600 text-white', text: 'text-amber-700 dark:text-amber-300' },
    purple: { bg: 'bg-purple-50 dark:bg-purple-950/20', border: 'border-purple-200 dark:border-purple-800', icon: 'bg-purple-600 text-white', text: 'text-purple-700 dark:text-purple-300' },
    cyan: { bg: 'bg-cyan-50 dark:bg-cyan-950/20', border: 'border-cyan-200 dark:border-cyan-800', icon: 'bg-cyan-600 text-white', text: 'text-cyan-700 dark:text-cyan-300' },
  };
  const c = cm[color];
  return (
    <div className={`${c.bg} ${c.border} rounded-xl border p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg`}>
      <div className={`${c.icon} p-2.5 rounded-lg shadow-md w-fit`}>{icon}</div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100"><AnimatedCounter value={value} /></p>
        <p className={`text-sm font-medium ${c.text} mt-1`}>{title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
};

/* ─── Action Tile ────────────────────────────────────────────────────────── */

const ActionTile: React.FC<{
  icon: React.ReactNode; title: string; description: string;
  color: string; onClick?: () => void; href?: string;
}> = ({ icon, title, description, color, onClick, href }) => {
  const inner = (
    <div className={`group relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 text-left w-full h-full`}>
      <div className={`absolute top-0 right-0 w-20 h-20 -mr-6 -mt-6 rounded-full opacity-10 ${color}`} />
      <div className={`inline-flex p-2.5 rounded-lg ${color} text-white shadow-md group-hover:scale-110 transition-transform`}>{icon}</div>
      <h3 className="mt-3 font-semibold text-gray-900 dark:text-gray-100 text-sm">{title}</h3>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{description}</p>
    </div>
  );
  if (onClick) return <button onClick={onClick} className="block w-full">{inner}</button>;
  if (href) return <a href={href} className="block">{inner}</a>;
  return <div>{inner}</div>;
};

/* ─── Main Component ─────────────────────────────────────────────────────── */

export default function GuardsPage(props: Props) {
  // Merge page props with direct props
  const page = usePage().props as any;
  const p: Props = {
    guards: props.guards || page.guards || { data: [] },
    inactiveGuards: props.inactiveGuards || page.inactiveGuards || undefined,
    sites: props.sites || page.sites || [],
    filters: props.filters || page.filters || {},
    zones: props.zones || page.zones || [],
    grades: props.grades || page.grades || [],
    clients: props.clients || page.clients || [],
    supervisors: props.supervisors || page.supervisors || [],
    stats: props.stats || page.stats || { total: 0, active: 0, on_duty: 0, off_duty: 0 },
    mode: props.mode || page.mode || 'view-only',
    activeScan: props.activeScan ?? page.activeScan ?? null,
    requireSiteScan: props.requireSiteScan ?? page.requireSiteScan ?? false,
    can: props.can || page.can || {},
    auth: props.auth || page.auth,
  };
  const { push } = useNotification();
  const f = feat(p.mode);
  const canPresent = p.requireSiteScan ? !!p.activeScan : true;

  /* ── Filter / Sort State ──────────────────────────────────────────────── */
  const [searchTerm, setSearchTerm] = useState(() => (p.filters?.search as string) || '');
  const [filterStatus, setFilterStatus] = useState(() => (p.filters?.status as string) || 'all');
  const [filterGuardType, setFilterGuardType] = useState('all');
  const [sortField, setSortField] = useState<SortField>(() => (p.filters?.sort as SortField) || 'name');
  const [sortDirection, setSortDirection] = useState<SortDirection>(() => (p.filters?.dir === 'desc' ? 'desc' : 'asc'));
  const [zoneId, setZoneId] = useState<string>(() => (p.filters?.zone_id as string) || '');
  const [clientId, setClientId] = useState<string>(() => (p.filters?.client_id as string) || '');
  const [supervisorId, setSupervisorId] = useState<string>(() => (p.filters?.supervisor_id as string) || '');
  const [gradeId, setGradeId] = useState<string>(() => (p.filters?.grade_id as string) || '');
  const [profileStatus, setProfileStatus] = useState<string>(() => (p.filters?.profile_status as string) || '');
  const [onDuty, setOnDuty] = useState<boolean>(() => {
    const v = p.filters?.on_duty; return !!(v === '1' || v === 1 || v === true || v === 'true');
  });
  const [view, setView] = useState<string>(() => (p.filters?.view as string) || 'active');
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedGuardIds, setSelectedGuardIds] = useState<Set<number>>(new Set());

  /* ── Modal State ──────────────────────────────────────────────────────── */
  const [selectedGuard, setSelectedGuard] = useState<Guard | null>(null);
  const [action, setAction] = useState<'checkin' | 'checkout' | 'bulk-checkin' | 'bulk-checkout' | null>(null);
  const [selectedSite, setSelectedSite] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [checkInTimeInput, setCheckInTimeInput] = useState(new Date().toTimeString().slice(0, 5));
  const [checkOutTimeInput, setCheckOutTimeInput] = useState(new Date().toTimeString().slice(0, 5));
  const [submitting, setSubmitting] = useState(false);
  const [backdate, setBackdate] = useState(false);
  const [backdateReason, setBackdateReason] = useState('');

  // View details modal
  const [viewData, setViewData] = useState<any | null>(null);
  const [viewLoading, setViewLoading] = useState<number | null>(null);

  // Import/Export
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importProcessing, setImportProcessing] = useState(false);
  const [importAllowUpdates, setImportAllowUpdates] = useState(false);

  /* ── Derived Data ─────────────────────────────────────────────────────── */
  const guardsList = p.guards?.data || [];

  const filteredGuards = useMemo(() => {
    return guardsList
      .filter((g: Guard) => {
        const term = searchTerm.trim().toLowerCase();
        const matchesSearch = !term ||
          g.name.toLowerCase().includes(term) ||
          (g.employee_id && g.employee_id.toLowerCase().includes(term)) ||
          (g.phone && g.phone.toLowerCase().includes(term));

        const matchesStatus = filterStatus === 'all' ? true :
          filterStatus === 'on_duty' ? (g.is_on_duty || !!g.today_attendance?.check_in) :
          filterStatus === 'off_duty' ? (!g.is_on_duty && !g.today_attendance?.check_in) :
          filterStatus === 'active' ? g.status === 'active' :
          filterStatus === 'inactive' ? g.status === 'inactive' :
          g.status === filterStatus;

        const matchesGuardType = filterGuardType === 'all' ? true :
          g.guard_type === filterGuardType;

        const matchesZone = !zoneId || g.zone_id === Number(zoneId) ||
          g.zone?.id === Number(zoneId);

        return matchesSearch && matchesStatus && matchesGuardType && matchesZone;
      })
      .sort((a: Guard, b: Guard) => {
        let va = a[sortField] ?? '';
        let vb = b[sortField] ?? '';
        va = String(va).toLowerCase();
        vb = String(vb).toLowerCase();
        if (va < vb) return sortDirection === 'asc' ? -1 : 1;
        if (va > vb) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
  }, [guardsList, searchTerm, filterStatus, filterGuardType, zoneId, sortField, sortDirection]);

  const stats = useMemo(() => {
    const s: Stats = p.stats || { total: 0, active: 0, on_duty: 0, off_duty: 0 };
    return [
      { icon: <IconMapper name="Users" size={20} />, title: 'Total Guards', value: s.total || s.total_guards || guardsList.length, subtitle: 'All personnel', color: 'blue' as const },
      { icon: <IconMapper name="UserCheck" size={20} />, title: 'Active', value: s.active || s.active_guards || 0, subtitle: 'Currently active', color: 'green' as const },
      { icon: <IconMapper name="Shield" size={20} />, title: 'On Duty', value: s.on_duty || s.on_duty_today || 0, subtitle: 'Working now', color: 'cyan' as const },
      { icon: <IconMapper name="Clock" size={20} />, title: 'Off Duty', value: s.off_duty || 0, subtitle: 'Not on shift', color: 'amber' as const },
    ];
  }, [p.stats, guardsList]);

  /* ── Bulk Selection ───────────────────────────────────────────────────── */
  const toggleSelectAll = () => {
    if (selectedGuardIds.size === filteredGuards.length) {
      setSelectedGuardIds(new Set());
    } else {
      setSelectedGuardIds(new Set(filteredGuards.map((g: Guard) => g.id)));
    }
  };
  const toggleSelectGuard = (id: number) => {
    const next = new Set(selectedGuardIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedGuardIds(next);
  };

  /* ── Check-in / Check-out ─────────────────────────────────────────────── */
  const handleCheckIn = (guard: Guard) => {
    setSelectedGuard(guard);
    setAction('checkin');
    setNotes('');
    setSelectedSite(p.activeScan?.site_id ?? null);
    setCheckInTimeInput(new Date().toTimeString().slice(0, 5));
    setBackdate(false);
    setBackdateReason('');
  };
  const handleCheckOut = (guard: Guard) => {
    setSelectedGuard(guard);
    setAction('checkout');
    setNotes('');
    setCheckOutTimeInput(new Date().toTimeString().slice(0, 5));
  };

  const submitCheckIn = () => {
    if (!selectedGuard || !selectedSite) return;
    const fd = new FormData();
    fd.append('guard_id', String(selectedGuard.id));
    fd.append('client_site_id', String(selectedSite));
    if (notes) fd.append('notes', notes);
    if (photoFile) fd.append('photo', photoFile);
    if (checkInTimeInput) fd.append('time', checkInTimeInput);
    if (backdate) {
      fd.append('backdate', '1');
      if (backdateReason) fd.append('backdate_reason', backdateReason);
    }
    setSubmitting(true);
    router.post(route('supervisor.attendance.check-in'), fd, {
      forceFormData: true,
      onSuccess: () => { setSelectedGuard(null); setSelectedSite(null); setNotes(''); setPhotoFile(null); setAction(null); },
      onFinish: () => setSubmitting(false),
    });
  };

  const submitCheckOut = () => {
    if (!selectedGuard?.attendance) return;
    const fd = new FormData();
    fd.append('guard_id', String(selectedGuard.id));
    if (notes) fd.append('notes', notes);
    if (photoFile) fd.append('photo', photoFile);
    if (checkOutTimeInput) fd.append('time', checkOutTimeInput);
    setSubmitting(true);
    router.post(route('supervisor.attendance.check-out'), fd, {
      forceFormData: true,
      onSuccess: () => { setSelectedGuard(null); setNotes(''); setPhotoFile(null); setAction(null); },
      onFinish: () => setSubmitting(false),
    });
  };

  const bulkCheckIn = () => {
    if (selectedGuardIds.size === 0) return;
    setSelectedSite(p.activeScan?.site_id ?? null);
    setAction('bulk-checkin');
  };
  const bulkCheckOut = () => {
    if (selectedGuardIds.size === 0) return;
    setAction('bulk-checkout');
  };

  const submitBulkCheckIn = () => {
    const ids = Array.from(selectedGuardIds);
    if (ids.length === 0) return;
    const fd = new FormData();
    fd.append('guard_ids', JSON.stringify(ids));
    if (selectedSite) fd.append('client_site_id', String(selectedSite));
    if (notes) fd.append('notes', notes);
    if (checkInTimeInput) fd.append('time', checkInTimeInput);
    if (backdate) { fd.append('backdate', '1'); if (backdateReason) fd.append('backdate_reason', backdateReason); }
    setSubmitting(true);
    router.post(route('supervisor.attendance.bulk-check-in'), fd, {
      forceFormData: true,
      onSuccess: () => { setSelectedGuardIds(new Set()); setSelectedSite(null); setNotes(''); setAction(null); },
      onFinish: () => setSubmitting(false),
    });
  };

  const submitBulkCheckOut = () => {
    const ids = Array.from(selectedGuardIds);
    if (ids.length === 0) return;
    const fd = new FormData();
    fd.append('guard_ids', JSON.stringify(ids));
    if (notes) fd.append('notes', notes);
    if (checkOutTimeInput) fd.append('time', checkOutTimeInput);
    setSubmitting(true);
    router.post(route('supervisor.attendance.bulk-check-out'), fd, {
      forceFormData: true,
      onSuccess: () => { setSelectedGuardIds(new Set()); setNotes(''); setAction(null); },
      onFinish: () => setSubmitting(false),
    });
  };

  const submitQuickPresent = (guard: Guard) => {
    const siteId = p.activeScan?.site_id ?? (p.sites && p.sites.length > 0 ? p.sites[0].id : null);
    if (!siteId) { handleCheckIn(guard); return; }
    const fd = new FormData();
    fd.append('guard_id', String(guard.id));
    fd.append('client_site_id', String(siteId));
    fd.append('time', new Date().toTimeString().slice(0, 5));
    setSubmitting(true);
    router.post(route('supervisor.attendance.check-in'), fd, {
      forceFormData: true,
      onSuccess: () => setSelectedGuard(null),
      onFinish: () => setSubmitting(false),
    });
  };

  const submitQuickAbsent = (guard: Guard) => {
    if (!canPresent) return;
    const siteId = p.activeScan?.site_id ?? (p.sites && p.sites.length > 0 ? p.sites[0].id : null);
    if (!siteId) return;
    router.post(route('supervisor.attendance.manual'), {
      guard_id: guard.id,
      client_site_id: siteId,
      date: new Date().toISOString().slice(0, 10),
      check_in_time: new Date().toTimeString().slice(0, 5),
      status: 'absent',
    }, { preserveState: true, onFinish: () => setSubmitting(false) });
  };

  /* ── View Details ─────────────────────────────────────────────────────── */
  const openView = async (id: number) => {
    setViewLoading(id);
    try {
      const res = await fetch(route('guards.json', { guard: id }), { headers: { Accept: 'application/json' } });
      if (res.ok) setViewData(await res.json());
    } catch { /* noop */ } finally { setViewLoading(null); }
  };

  /* ── Import/Export ─────────────────────────────────────────────────────── */
  const handleExport = () => {
    const params = new URLSearchParams({
      search: searchTerm || '', status: filterStatus || '',
      zone_id: zoneId || '', grade_id: gradeId || '', on_duty: onDuty ? '1' : '', export: '1',
    });
    window.open(`${route('guards.index')}?${params.toString()}`, '_blank');
  };

  const handleImport = () => {
    if (!importFile) return;
    setImportProcessing(true);
    const fd = new FormData();
    fd.append('file', importFile);
    fd.append('allow_updates', importAllowUpdates ? '1' : '0');
    router.post(route('admin.guards.bulk-import'), fd, {
      onSuccess: () => { setImportOpen(false); setImportFile(null); setImportAllowUpdates(false); setImportProcessing(false); },
      onError: () => setImportProcessing(false),
    });
  };

  const downloadTemplate = () => window.open(route('admin.guards.bulk-import-template'), '_blank');

  /* ── Guard Action Buttons ──────────────────────────────────────────────── */
  const renderGuardActions = (guard: Guard): React.ReactNode => {
    const actions: React.ReactNode[] = [];

    // Quick Present/Absent (attendance-full, attendance-basic, control-room, admin)
    if (f.quickPresent || f.quickAbsent) {
      const hasCheckIn = guard.attendance || guard.today_attendance?.check_in;
      if (!hasCheckIn) {
        if (f.quickPresent) {
          actions.push(
            <button key="present" onClick={() => submitQuickPresent(guard)}
              disabled={!canPresent || submitting}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-lg font-medium text-sm transition"
              title="Quick Check In">Present</button>
          );
        }
        if (f.quickAbsent) {
          actions.push(
            <button key="absent" onClick={() => submitQuickAbsent(guard)}
              disabled={!canPresent || submitting}
              className="px-3 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-lg font-medium text-sm transition"
              title="Mark Absent">Absent</button>
          );
        }
      }
    }

    // Check-out
    if (f.checkOut && (guard.attendance?.check_in_time || guard.today_attendance?.check_in) && !guard.attendance?.check_out_time) {
      actions.push(
        <button key="checkout" onClick={() => handleCheckOut(guard)}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition">Check Out</button>
      );
    }

    // Done badge
    if (guard.attendance?.check_out_time) {
      actions.push(
        <span key="done" className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-lg font-medium flex items-center gap-2">
          <IconMapper name="CheckCircle" size={16} className="text-green-500" />
          Done
        </span>
      );
    }

    return <>{actions}</>;
  };

  /* ── Backdate reason input ─────────────────────────────────────────────── */
  const renderBackdateReason = () => {
    if (!backdate) return null;
    const tooShort = backdateReason.length > 0 && backdateReason.length < 10;
    return (
      <div>
        <input value={backdateReason} onChange={(e) => setBackdateReason(e.target.value)}
          placeholder="Reason for backdate (min 10 characters)..."
          className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-coin-500 ${tooShort ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}`}
        />
        {tooShort && <p className="text-xs text-red-600 mt-1">Please provide at least 10 characters.</p>}
      </div>
    );
  };

  /* ── Filter apply / reset ──────────────────────────────────────────────── */
  const applyFilters = () => {
    const query: Record<string, any> = {
      search: searchTerm || undefined, status: filterStatus !== 'all' ? filterStatus : undefined,
      guard_type: filterGuardType !== 'all' ? filterGuardType : undefined,
      sort: sortField, dir: sortDirection,
      zone_id: zoneId || undefined, client_id: clientId || undefined,
      supervisor_id: supervisorId || undefined, grade_id: gradeId || undefined,
      profile_status: profileStatus || undefined,
      per_page: '20', view: view, on_duty: onDuty ? '1' : undefined,
    };
    router.get(window.location.pathname, query, { preserveState: true, preserveScroll: true });
  };
  const resetFilters = () => {
    setSearchTerm(''); setFilterStatus('all'); setFilterGuardType('all');
    setSortField('name'); setSortDirection('asc');
    setZoneId(''); setClientId(''); setSupervisorId(''); setGradeId('');
    setProfileStatus(''); setOnDuty(false);
    router.get(window.location.pathname, {}, { preserveState: true, preserveScroll: true });
  };

  /* ── Render ────────────────────────────────────────────────────────────── */
  const headerTitle = p.mode === 'admin' ? 'Guards Directory' :
    p.mode === 'control-room' ? 'Guards Management' :
    p.mode === 'attendance-full' ? 'My Guards' :
    p.mode === 'attendance-basic' ? 'Guards' : 'Guards Directory';

  const headerDesc = p.mode === 'admin' ? 'View guard profiles and performance metrics' :
    p.mode === 'control-room' ? 'Control Room guard operations and attendance' :
    p.mode === 'attendance-full' ? 'Manage your team attendance' :
    'View guard information';

  const canSearch = f.searchFilter;
  const showFilterZone = p.mode === 'control-room' || p.mode === 'admin';
  const showFilterClient = p.mode === 'control-room';
  const showFilterSupervisor = p.mode === 'control-room' || p.mode === 'admin';
  const showFilterGrade = p.mode === 'view-only';

  return (
    <>
      <Head title={headerTitle} />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Hero Header */}
        <div className="bg-gradient-to-br from-red-900 via-red-800 to-red-900 text-white">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 sm:p-2.5 bg-white/10 rounded-lg backdrop-blur-sm">
                  <IconMapper name="Shield" size={20} className="sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">{headerTitle}</h1>
                  <p className="text-red-100 text-xs sm:text-sm mt-0.5">{headerDesc}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {f.scanner && p.activeScan && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100/20 text-green-200 rounded-lg text-sm">
                    <IconMapper name="MapPin" size={14} />
                    <span className="font-medium">{p.activeScan.site_name}</span>
                    <button onClick={() => setShowScannerModal(true)} className="text-xs underline ml-1">Change</button>
                  </div>
                )}
                {f.scanner && !p.activeScan && p.requireSiteScan && (
                  <button onClick={() => setShowScannerModal(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition">
                    <IconMapper name="ScanLine" size={16} />
                    Scan Site
                  </button>
                )}
                {f.importExport && (
                  <>
                    <button onClick={handleExport}
                      className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition">
                      <IconMapper name="Download" size={16} />
                      <span className="hidden sm:inline">Export</span>
                    </button>
                    <button onClick={() => setImportOpen(true)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition">
                      <IconMapper name="Upload" size={16} />
                      <span className="hidden sm:inline">Import</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
            {stats.map((s, i) => <StatCard key={i} {...s} />)}
          </div>

          {(f.addGuard || f.importExport) && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
              {f.addGuard && (
                <ActionTile icon={<IconMapper name="UserPlus" size={18} />}
                  title="Add Guard" description="Register new guard" color="bg-blue-600"
                  onClick={() => {}} />
              )}
              {f.importExport && (
                <ActionTile icon={<IconMapper name="FileSpreadsheet" size={18} />}
                  title="Export" description="Download guard list" color="bg-emerald-600"
                  onClick={handleExport} />
              )}
            </div>
          )}

          <div>
            <GuardFilterBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              filterStatus={filterStatus}
              onFilterStatusChange={setFilterStatus}
              filterGuardType={filterGuardType}
              onFilterGuardTypeChange={setFilterGuardType}
              sortField={sortField}
              sortDirection={sortDirection}
              onSortChange={(field, direction) => { setSortField(field); setSortDirection(direction); }}
              enabled={{ search: canSearch, status: true, guardType: f.guardType, sort: f.sort }}
              bulkMode={bulkMode}
              onToggleBulkMode={f.bulkCheckInOut ? () => setBulkMode(!bulkMode) : undefined}
              totalCount={guardsList.length}
              filteredCount={filteredGuards.length}
            />
          </div>

          {bulkMode && selectedGuardIds.size > 0 && (
            <div className="sticky top-0 z-10 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 mb-4">
              <div className="bg-coin-600 rounded-xl shadow-lg p-4 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <IconMapper name="CheckSquare" size={22} />
                  <span className="font-semibold">{selectedGuardIds.size} guard{selectedGuardIds.size !== 1 ? 's' : ''} selected</span>
                </div>
                <div className="flex items-center gap-2">
                  {f.bulkCheckInOut && (
                    <>
                      <button onClick={bulkCheckIn} disabled={!canPresent}
                        className="px-4 py-2 bg-white text-green-700 hover:bg-green-50 rounded-lg font-semibold text-sm transition disabled:opacity-50">
                        <IconMapper name="LogIn" size={16} className="inline mr-1" />Check In
                      </button>
                      <button onClick={bulkCheckOut}
                        className="px-4 py-2 bg-white text-red-700 hover:bg-red-50 rounded-lg font-semibold text-sm transition">
                        <IconMapper name="LogOut" size={16} className="inline mr-1" />Check Out
                      </button>
                    </>
                  )}
                  <button onClick={() => setSelectedGuardIds(new Set())}
                    className="px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition">Clear</button>
                </div>
              </div>
            </div>
          )}

          <Card className="overflow-hidden">
            <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                Guards ({filteredGuards.length} of {guardsList.length})
              </h2>
            </div>

            {filteredGuards.length === 0 ? (
              <div className="p-6 sm:p-8 text-center">
                <div className="inline-flex p-3 sm:p-4 rounded-full bg-gray-100 dark:bg-gray-800 mb-3">
                  <IconMapper name="Search" size={28} className="sm:w-8 sm:h-8 text-gray-400" />
                </div>
                <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">No guards found matching your filters</p>
              </div>
            ) : (
              <>
                {bulkMode && (
                  <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
                    <input type="checkbox"
                      checked={selectedGuardIds.size === filteredGuards.length && filteredGuards.length > 0}
                      onChange={toggleSelectAll}
                      className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-coin-600 focus:ring-coin-500" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {selectedGuardIds.size === filteredGuards.length && filteredGuards.length > 0
                        ? 'Deselect All' : `Select All (${filteredGuards.length})`}
                    </span>
                  </div>
                )}
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredGuards.map((guard: Guard) => (
                    <GuardListItem
                      key={guard.id}
                      guard={{
                        id: guard.id,
                        employee_id: guard.employee_id,
                        name: guard.name,
                        phone: guard.phone,
                        status: guard.status,
                        guard_type: guard.guard_type || guard.employee_role as any,
                        is_on_duty: guard.is_on_duty || !!guard.today_attendance?.check_in,
                        attendance: guard.attendance || (guard.today_attendance ? {
                          id: 0,
                          check_in_time: guard.today_attendance.check_in || '',
                          check_out_time: guard.today_attendance.check_out || null,
                          status: guard.today_attendance.status || (guard.today_attendance.check_in ? 'present' : ''),
                          site: guard.current_assignment?.site_name || guard.active_assignment?.site_name || null,
                          hours_worked: null,
                        } : null),
                        current_assignment: guard.current_assignment || (guard.active_assignment ? {
                          site_name: guard.active_assignment.site_name || '',
                          client_name: guard.active_assignment.client_name || '',
                        } : null),
                        zone: guard.zone ? guard.zone.name : null,
                        supervisor_name: guard.supervisor?.name || null,
                      }}
                      showAttendance={f.quickPresent || f.checkIn || f.checkOut}
                      showAssignment={showFilterZone || showFilterClient}
                      showZone={showFilterZone}
                      showSupervisor={showFilterSupervisor}
                      selected={selectedGuardIds.has(guard.id)}
                      bulkMode={bulkMode}
                      onToggleSelect={toggleSelectGuard}
                      detailRoute={p.mode === 'attendance-full' ? route('supervisor.guards.show', guard.id) : undefined}
                      actions={renderGuardActions(guard)}
                    />
                  ))}
                </div>
              </>
            )}
          </Card>
        </div>

        {/* ──────────────── Modals ──────────────── */}

        <Modal show={action === 'bulk-checkin'} onClose={() => setAction(null)} maxWidth="md">
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <IconMapper name="LogIn" size={20} className="text-green-600" />
              Bulk Check In ({selectedGuardIds.size} guards)
            </h3>
            <div className="space-y-4">
              <div className="bg-coin-50 dark:bg-coin-900/20 p-3 rounded-lg">
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  This will check in <strong>{selectedGuardIds.size} guards</strong> at the selected site with the chosen time.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Site *</label>
                <select value={selectedSite ?? ''} onChange={(e) => setSelectedSite(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-coin-500"
                  required disabled={!!p.activeScan}>
                  <option value="">Choose a site...</option>
                  {(p.sites || []).map((site: Site) => (
                    <option key={site.id} value={site.id}>{site.full_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Time *</label>
                <input type="time" value={checkInTimeInput} onChange={(e) => setCheckInTimeInput(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-coin-500" required />
              </div>
              <div className="space-y-2">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                  <input type="checkbox" checked={backdate} onChange={(e) => setBackdate(e.target.checked)}
                    className="rounded border-gray-300 dark:border-gray-700" />
                  <span>Mark for yesterday (backdate)</span>
                </label>
                {renderBackdateReason()}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-coin-500"
                  placeholder="Optional notes for all selected guards..." />
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={submitBulkCheckIn}
                  disabled={!selectedSite || submitting || (backdate && backdateReason.length < 10)}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg font-medium">
                  {submitting ? 'Processing...' : 'Confirm Bulk Check In'}
                </button>
                <button onClick={() => setAction(null)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium">Cancel</button>
              </div>
            </div>
          </div>
        </Modal>

        <Modal show={action === 'bulk-checkout'} onClose={() => setAction(null)} maxWidth="md">
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <IconMapper name="LogOut" size={20} className="text-red-600" />
              Bulk Check Out ({selectedGuardIds.size} guards)
            </h3>
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Only guards with an active check-in will be affected.</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Time *</label>
                <input type="time" value={checkOutTimeInput} onChange={(e) => setCheckOutTimeInput(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-coin-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-coin-500"
                  placeholder="End of shift notes..." />
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={submitBulkCheckOut} disabled={submitting}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white rounded-lg font-medium">
                  {submitting ? 'Processing...' : 'Confirm Bulk Check Out'}
                </button>
                <button onClick={() => setAction(null)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium">Cancel</button>
              </div>
            </div>
          </div>
        </Modal>

        <Modal show={action === 'checkin'} onClose={() => setAction(null)} maxWidth="md">
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <IconMapper name="LogIn" size={20} className="text-green-600" />
              Check In: {selectedGuard?.name}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Site *</label>
                <select value={selectedSite ?? ''} onChange={(e) => setSelectedSite(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-coin-500"
                  required disabled={!!p.activeScan}>
                  <option value="">Choose a site...</option>
                  {(p.sites || []).map((site: Site) => (
                    <option key={site.id} value={site.id}>{site.full_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Time *</label>
                <input type="time" value={checkInTimeInput} onChange={(e) => setCheckInTimeInput(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-coin-500" required />
              </div>
              <div className="space-y-2">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                  <input type="checkbox" checked={backdate} onChange={(e) => setBackdate(e.target.checked)}
                    className="rounded border-gray-300 dark:border-gray-700" />
                  <span>Mark for yesterday (backdate)</span>
                </label>
                {renderBackdateReason()}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Photo</label>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setShowCameraModal(true)}
                    className="px-4 py-2 bg-coin-600 hover:bg-coin-700 text-white rounded-lg">
                    <IconMapper name="Camera" size={18} className="inline mr-2" />Camera
                  </button>
                  <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                    className="flex-1 text-sm text-gray-600 dark:text-gray-400" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-coin-500" placeholder="Optional notes..." />
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={submitCheckIn}
                  disabled={!selectedSite || submitting || (backdate && backdateReason.length < 10)}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg font-medium">
                  {submitting ? 'Processing...' : 'Confirm Check In'}
                </button>
                <button onClick={() => setAction(null)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium">Cancel</button>
              </div>
            </div>
          </div>
        </Modal>

        <Modal show={action === 'checkout'} onClose={() => setAction(null)} maxWidth="md">
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <IconMapper name="LogOut" size={20} className="text-red-600" />
              Check Out: {selectedGuard?.name}
            </h3>
            <div className="space-y-4">
              <div className="bg-coin-50 dark:bg-coin-900/20 border border-coin-200 dark:border-coin-900/30 p-4 rounded-lg">
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  <span className="font-medium">Checked in:</span> {selectedGuard?.attendance?.check_in_time || selectedGuard?.today_attendance?.check_in}
                </p>
                {selectedGuard?.attendance?.site && (
                  <p className="text-sm text-gray-700 dark:text-gray-200 mt-1">
                    <span className="font-medium">Site:</span> {selectedGuard.attendance.site}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Time *</label>
                <input type="time" value={checkOutTimeInput} onChange={(e) => setCheckOutTimeInput(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-coin-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Photo</label>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setShowCameraModal(true)}
                    className="px-4 py-2 bg-coin-600 hover:bg-coin-700 text-white rounded-lg">
                    <IconMapper name="Camera" size={18} className="inline mr-2" />Camera
                  </button>
                  <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                    className="flex-1 text-sm text-gray-600 dark:text-gray-400" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-coin-500" placeholder="End of shift notes..." />
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={submitCheckOut} disabled={submitting}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white rounded-lg font-medium">
                  {submitting ? 'Processing...' : 'Confirm Check Out'}
                </button>
                <button onClick={() => setAction(null)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium">Cancel</button>
              </div>
            </div>
          </div>
        </Modal>

        <ScannerModal open={showScannerModal} onClose={() => setShowScannerModal(false)} activeScan={p.activeScan} />

        {showCameraModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Capture Photo</h3>
                <button onClick={() => setShowCameraModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400">
                  <IconMapper name="X" size={20} />
                </button>
              </div>
              <CameraCapture onCapture={(file) => { setPhotoFile(file); setShowCameraModal(false); }} />
            </div>
          </div>
        )}

        <Modal show={importOpen} onClose={() => setImportOpen(false)} maxWidth="md">
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <IconMapper name="Upload" size={20} className="text-purple-600" />
              Bulk Import Guards
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Upload Excel file to import multiple guards</p>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Template</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Download the Excel template with the correct format for bulk importing guards.
                </p>
                <Button variant="outline" onClick={downloadTemplate} className="w-full">
                  <IconMapper name="Download" size={16} className="mr-2" />Download Template
                </Button>
              </div>
              <div>
                <input type="file" accept=".xlsx,.xls" onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-gray-700 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-100 file:text-purple-700 dark:file:bg-purple-900/30 dark:file:text-purple-300" />
              </div>
              <label className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <input type="checkbox" checked={importAllowUpdates} onChange={(e) => setImportAllowUpdates(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 dark:border-gray-700 text-purple-600 focus:ring-purple-500" />
                <div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Update existing guards when duplicates are found</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">If unchecked, duplicate rows will be skipped.</div>
                </div>
              </label>
              <div className="flex gap-2">
                <Button onClick={handleImport} disabled={!importFile || importProcessing}
                  className="flex-1 bg-purple-600 hover:bg-purple-700">
                  {importProcessing ? 'Importing...' : 'Import Guards'}
                </Button>
                <Button variant="outline" onClick={() => { setImportOpen(false); setImportFile(null); setImportAllowUpdates(false); }}
                  className="flex-1">Cancel</Button>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </>
  );
}
