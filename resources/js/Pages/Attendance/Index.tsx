import React, { useState, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import StatusBadge from '@/Components/Guards/StatusBadge';
import Modal from '@/Components/Modal';
import ScannerModal from '@/Components/Scanner/ScannerModal';
import { toast } from 'react-hot-toast';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AttendanceMode = 'supervisor' | 'control-room' | 'zone-commander';

interface GuardInfo {
  id: number;
  name: string;
  employee_id: string;
}

interface AttendancePaginated {
  data: any[];
  links: any[];
  meta?: { from: number; to: number; total: number; last_page: number; current_page: number };
}

// Zone-commander guard row
interface ZoneGuardRow {
  id: number;
  name: string;
  employee_id: string;
  phone: string;
  default_site_id: number | null;
  attendance: {
    id: number;
    client_site_id: number | null;
    status: string;
    check_in_time: string | null;
    check_out_time: string | null;
    check_in_photo_url: string | null;
    check_out_photo_url: string | null;
  } | null;
}

interface ZoneSite {
  id: number;
  name: string;
  client_name: string;
  full_name: string;
}

interface ControlRoomSite {
  id: number;
  name: string;
  client: { id: number; name: string } | null;
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function formatTime(time: string | null): string {
  if (!time) return '--:--';
  if (time.includes('T')) return time.split('T')[1].substring(0, 5);
  if (time.includes(' ')) return time.split(' ')[1].substring(0, 5);
  return time.substring(0, 5);
}

// ---------------------------------------------------------------------------
// StatCard sub-component (avoids import dependency)
// ---------------------------------------------------------------------------

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    gray: 'bg-white dark:bg-gray-900/60',
    green: 'bg-green-50 dark:bg-green-900/20',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20',
    red: 'bg-red-50 dark:bg-red-900/20',
    blue: 'bg-blue-50 dark:bg-blue-900/20',
  };
  const valueColorMap: Record<string, string> = {
    gray: 'text-gray-900 dark:text-gray-100',
    green: 'text-green-900 dark:text-green-100',
    yellow: 'text-yellow-900 dark:text-yellow-100',
    red: 'text-red-900 dark:text-red-100',
    blue: 'text-blue-900 dark:text-blue-100',
  };
  const labelColorMap: Record<string, string> = {
    gray: 'text-gray-600 dark:text-gray-300',
    green: 'text-green-700 dark:text-green-200',
    yellow: 'text-yellow-700 dark:text-yellow-200',
    red: 'text-red-700 dark:text-red-200',
    blue: 'text-blue-700 dark:text-blue-200',
  };

  return (
    <div className={`rounded-xl border border-gray-200 dark:border-gray-800 ${colorMap[color] || colorMap.gray} p-4 shadow-sm shadow-black/5 dark:shadow-none`}>
      <p className={`text-sm mb-1 ${labelColorMap[color] || labelColorMap.gray}`}>{label}</p>
      <p className={`text-3xl font-bold ${valueColorMap[color] || valueColorMap.gray}`}>{value}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AttendanceIndex() {
  const pageProps: any = usePage().props;
  const mode = pageProps.mode as AttendanceMode;

  // Supervisor-specific state
  const [supDate, setSupDate] = useState(
    mode === 'supervisor' && pageProps.filters?.date
      ? new Date(pageProps.filters.date)
      : new Date()
  );
  const [supStatus, setSupStatus] = useState(
    mode === 'supervisor' ? (pageProps.filters?.status || '') : ''
  );
  const [supSearch, setSupSearch] = useState(
    mode === 'supervisor' ? (pageProps.filters?.search || '') : ''
  );
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Control-room state
  const [crSearch, setCrSearch] = useState(
    mode === 'control-room' ? (pageProps.filters?.search || '') : ''
  );
  const [crStatus, setCrStatus] = useState(
    mode === 'control-room' ? (pageProps.filters?.status || '') : ''
  );
  const [crSiteId, setCrSiteId] = useState(
    mode === 'control-room' ? (pageProps.filters?.site_id || '') : ''
  );
  const [crDate, setCrDate] = useState(
    mode === 'control-room' ? (pageProps.filters?.date || '') : ''
  );
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Zone-commander state
  const [zcSearch, setZcSearch] = useState('');
  const [zcAction, setZcAction] = useState<'markpresent' | 'checkout' | null>(null);
  const [zcSelectedGuard, setZcSelectedGuard] = useState<ZoneGuardRow | null>(null);
  const [zcSelectedSiteId, setZcSelectedSiteId] = useState<number | ''>('');
  const [zcNotes, setZcNotes] = useState('');
  const [zcSubmitting, setZcSubmitting] = useState(false);

  // -----------------------------------------------------------------------
  // Supervisor: Echo listener
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (mode !== 'supervisor') return;
    const echo = (window as any).Echo;
    if (!echo || typeof echo.private !== 'function') return;

    let channel: any;
    try {
      channel = echo.private('supervisor-attendance');
      channel.listen('AttendanceUpdated', (e: any) => {
        const data = e?.data ?? e?.attendance ?? {};
        const guardName = data.guard_name ?? data.guard ?? 'A guard';
        const action = data.action ?? (data.check_out_time ? 'checked out' : 'checked in');
        toast.success(`${guardName} just ${action}`, { duration: 4000, icon: data.check_out_time ? '🚪' : '✅' });
        router.reload({ only: ['attendance', 'stats'] });
      });
    } catch (err) {
      console.warn('Attendance Echo listener: failed to subscribe', err);
    }

    return () => {
      try { channel?.stopListening('.AttendanceUpdated'); } catch {}
    };
  }, [mode]);

  // -----------------------------------------------------------------------
  // Supervisor: apply filters
  // -----------------------------------------------------------------------
  const handleSupFilter = () => {
    router.get(route('supervisor.attendance'), {
      date: supDate.toISOString().slice(0, 10),
      status: supStatus,
      search: supSearch,
    }, { preserveState: true });
  };

  // -----------------------------------------------------------------------
  // Control Room: apply filters
  // -----------------------------------------------------------------------
  const handleCrFilter = () => {
    const query: Record<string, any> = {
      search: crSearch || undefined,
      status: crStatus || undefined,
      site_id: crSiteId || undefined,
      date: crDate || undefined,
    };
    router.get(route('control-room.attendance.index'), query, { preserveState: true, preserveScroll: true });
  };

  const resetCrFilters = () => {
    setCrSearch('');
    setCrStatus('');
    setCrSiteId('');
    setCrDate('');
    router.get(route('control-room.attendance.index'), {}, { preserveState: true, preserveScroll: true });
  };

  // -----------------------------------------------------------------------
  // Zone Commander: actions
  // -----------------------------------------------------------------------
  const openMarkPresent = (g: ZoneGuardRow) => {
    setZcSelectedGuard(g);
    setZcAction('markpresent');
    setZcNotes('');
    setZcSelectedSiteId(g.default_site_id ?? '');
  };

  const openCheckOut = (g: ZoneGuardRow) => {
    setZcSelectedGuard(g);
    setZcAction('checkout');
    setZcNotes('');
    const siteId = g.attendance?.client_site_id ?? g.default_site_id ?? '';
    setZcSelectedSiteId(siteId || '');
  };

  const closeZcModal = () => {
    setZcAction(null);
    setZcSelectedGuard(null);
    setZcSelectedSiteId('');
    setZcNotes('');
    setZcSubmitting(false);
  };

  const submitZcAction = () => {
    if (!zcSelectedGuard || !zcAction) return;
    if (!zcSelectedSiteId) return;

    const fd = new FormData();
    fd.append('guard_id', String(zcSelectedGuard.id));
    fd.append('client_site_id', String(zcSelectedSiteId));
    if (zcNotes) fd.append('notes', zcNotes);

    setZcSubmitting(true);
    router.post(
      zcAction === 'markpresent'
        ? route('zone.attendance.mark-present')
        : route('zone.attendance.check-out'),
      fd,
      {
        forceFormData: true,
        preserveScroll: true,
        onFinish: () => setZcSubmitting(false),
        onSuccess: () => closeZcModal(),
        onError: () => setZcSubmitting(false),
      }
    );
  };

  // -----------------------------------------------------------------------
  // Zone Commander: stats & filtered guards
  // -----------------------------------------------------------------------
  const zcStats = (mode === 'zone-commander')
    ? (() => {
        const g: ZoneGuardRow[] = pageProps.guards || [];
        const total = g.length;
        const checkedIn = g.filter((x) => !!x.attendance?.check_in_time).length;
        const checkedOut = g.filter((x) => !!x.attendance?.check_out_time).length;
        const pending = Math.max(0, total - checkedIn);
        return { total, checkedIn, checkedOut, pending };
      })()
    : null;

  const zcGuards: ZoneGuardRow[] = mode === 'zone-commander' ? (pageProps.guards || []) : [];
  const zcSites: ZoneSite[] = mode === 'zone-commander' ? (pageProps.sites || []) : [];
  const zcFilteredGuards = React.useMemo(() => {
    if (!zcSearch.trim()) return zcGuards;
    const term = zcSearch.trim().toLowerCase();
    return zcGuards.filter((g) =>
      g.name.toLowerCase().includes(term) ||
      g.employee_id.toLowerCase().includes(term) ||
      g.phone.toLowerCase().includes(term)
    );
  }, [zcGuards, zcSearch]);

  // -----------------------------------------------------------------------
  // Render: Supervisor stats cards
  // -----------------------------------------------------------------------
  const renderStats = () => {
    if (mode === 'supervisor') {
      const s = pageProps.stats || { total: 0, present: 0, late: 0, absent: 0 };
      return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Total" value={s.total} color="gray" />
          <StatCard label="Present" value={s.present} color="green" />
          <StatCard label="Late" value={s.late} color="yellow" />
          <StatCard label="Absent" value={s.absent} color="red" />
        </div>
      );
    }
    if (mode === 'zone-commander' && zcStats) {
      return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Total Guards" value={zcStats.total} color="gray" />
          <StatCard label="Checked In" value={zcStats.checkedIn} color="green" />
          <StatCard label="Checked Out" value={zcStats.checkedOut} color="blue" />
          <StatCard label="Pending" value={zcStats.pending} color="red" />
        </div>
      );
    }
    return null;
  };

  // -----------------------------------------------------------------------
  // Render: Alerts (control-room)
  // -----------------------------------------------------------------------
  const renderAlerts = () => {
    if (mode !== 'control-room') return null;
    const p = pageProps;

    if (!p.canEdit && !p.isSuperAdmin) {
      return (
        <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            <div>
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Editing Currently Disabled</h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Today is not Tuesday. Attendance records can only be edited on Tuesdays for the previous week's data.
                Please contact a Super Admin for emergency edits.
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (p.canEdit && p.isTuesday && !p.isSuperAdmin) {
      return (
        <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <div>
              <h4 className="font-medium text-green-800 dark:text-green-200">Tuesday Edit Window Open</h4>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                You can edit attendance records from the previous week ({p.lastWeekRange?.display}) today only.
                This window closes at midnight.
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (p.isSuperAdmin) {
      return (
        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
            <div>
              <h4 className="font-medium text-blue-800 dark:text-blue-200">Super Admin Access</h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                You can edit any attendance record at any time. All edits will be logged with your user ID.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  // -----------------------------------------------------------------------
  // Render: Filters
  // -----------------------------------------------------------------------
  const renderFilters = () => {
    if (mode === 'supervisor') {
      return (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date</label>
              <input
                type="date"
                value={supDate.toISOString().slice(0, 10)}
                onChange={(e) => setSupDate(e.target.value ? new Date(e.target.value) : new Date())}
                max={new Date().toISOString().slice(0, 10)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:border-coin-500 focus:ring-1 focus:ring-coin-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
              <select
                value={supStatus}
                onChange={(e) => setSupStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:border-coin-500 focus:ring-1 focus:ring-coin-500"
              >
                <option value="">All Statuses</option>
                <option value="present">Present</option>
                <option value="late">Late</option>
                <option value="absent">Absent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search</label>
              <input
                type="text"
                value={supSearch}
                onChange={(e) => setSupSearch(e.target.value)}
                placeholder="Guard name..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:border-coin-500 focus:ring-1 focus:ring-coin-500"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={handleSupFilter}
                className="px-6 py-2 bg-coin-700 hover:bg-coin-600 text-white rounded-lg font-medium transition"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (mode === 'control-room') {
      const p = pageProps;
      return (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search Guard</label>
              <input
                type="text"
                value={crSearch}
                onChange={(e) => setCrSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCrFilter()}
                placeholder="Name or Employee ID..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-coin-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
              <select
                value={crStatus}
                onChange={(e) => setCrStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-coin-600"
              >
                <option value="">All Statuses</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
                <option value="half_day">Half Day</option>
                <option value="leave">Leave</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Site</label>
              <select
                value={crSiteId}
                onChange={(e) => setCrSiteId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-coin-600"
              >
                <option value="">All Sites</option>
                {(p.sites || []).map((site: any) => (
                  <option key={site.id} value={site.id}>
                    {site.name} {site.client ? `(${site.client.name})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date</label>
              <input
                type="date"
                value={crDate}
                onChange={(e) => setCrDate(e.target.value)}
                min={p.lastWeekRange?.start}
                max={p.lastWeekRange?.end}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-coin-600"
              />
            </div>
            <div className="flex items-end gap-2">
              <button onClick={handleCrFilter} className="px-4 py-2 bg-coin-600 hover:bg-coin-700 text-white rounded-lg transition">
                Apply
              </button>
              <button onClick={resetCrFilters} className="px-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 transition">
                Reset
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Zone commander: simple search
    if (mode === 'zone-commander') {
      return (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search Guard</label>
              <input
                type="text"
                value={zcSearch}
                onChange={(e) => setZcSearch(e.target.value)}
                placeholder="Search by name, ID, or phone..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-coin-500"
              />
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  // -----------------------------------------------------------------------
  // Render: Main content
  // -----------------------------------------------------------------------

  // Supervisor table
  const renderSupervisorTable = () => {
    if (mode !== 'supervisor') return null;
    const attendance = pageProps.attendance || { data: [], links: [] };
    const recordData = attendance.data || [];
    const meta = attendance.meta || { from: 0, to: 0, total: 0, last_page: 1, current_page: 1 };
    const links = attendance.links || [];

    return (
      <>
        {/* Desktop table */}
        <div className="hidden md:block rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Guard</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Site</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Check In</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Check Out</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Hours</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Status</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Supervisor</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {recordData.length > 0 ? recordData.map((record: any) => (
                  <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                    <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
                      <div className="font-medium text-gray-900 dark:text-gray-100">{record.guard?.name || 'Unknown'}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{record.guard?.employee_id || ''}</div>
                    </td>
                    <td className="px-4 sm:px-6 py-3">
                      {record.site ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{record.site.client_name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{record.site.name}</div>
                        </div>
                      ) : <span className="text-gray-400 dark:text-gray-500">N/A</span>}
                    </td>
                    <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {formatTime(record.check_in_time) || '-'}
                    </td>
                    <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {formatTime(record.check_out_time) || '-'}
                    </td>
                    <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {record.hours_worked != null ? `${record.hours_worked}h` : '-'}
                      {record.overtime_hours && record.overtime_hours > 0 && (
                        <span className="text-xs text-orange-600 dark:text-orange-300 ml-1">
                          (+{record.overtime_hours}h OT)
                        </span>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
                      <StatusBadge status={record.status} type="attendance" />
                    </td>
                    <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {record.supervisor || '-'}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      No attendance records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 overflow-hidden divide-y divide-gray-200 dark:divide-gray-800">
          {recordData.length > 0 ? recordData.map((record: any) => (
            <div key={record.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">{record.guard?.name || 'Unknown'}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{record.guard?.employee_id || ''}</div>
                </div>
                <StatusBadge status={record.status} type="attendance" />
              </div>
              {record.site && (
                <div className="mb-3 text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Site: </span>
                  <span className="text-gray-900 dark:text-gray-100">{record.site.client_name} - {record.site.name}</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500 dark:text-gray-400">In: </span><span className="text-gray-900 dark:text-gray-100">{formatTime(record.check_in_time) || '-'}</span></div>
                <div><span className="text-gray-500 dark:text-gray-400">Out: </span><span className="text-gray-900 dark:text-gray-100">{formatTime(record.check_out_time) || '-'}</span></div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Hours: </span>
                  <span className="text-gray-900 dark:text-gray-100">
                    {record.hours_worked != null ? `${record.hours_worked}h` : '-'}
                    {record.overtime_hours && record.overtime_hours > 0 && (
                      <span className="text-xs text-orange-600 dark:text-orange-300 ml-1">(+{record.overtime_hours}h)</span>
                    )}
                  </span>
                </div>
                <div><span className="text-gray-500 dark:text-gray-400">By: </span><span className="text-gray-900 dark:text-gray-100">{record.supervisor || '-'}</span></div>
              </div>
            </div>
          )) : (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">No attendance records found.</div>
          )}
        </div>

        {/* Pagination */}
        {meta.last_page > 1 && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 px-4 sm:px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Showing {meta.from} to {meta.to} of {meta.total}
              </div>
              <div className="flex flex-wrap gap-2 sm:justify-end">
                {links.map((link: any, index: number) => (
                  <Link
                    key={index}
                    href={link.url || '#'}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      link.active
                        ? 'bg-coin-700 text-white'
                        : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                    dangerouslySetInnerHTML={{ __html: link.label }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  // Control Room table
  const renderControlRoomTable = () => {
    if (mode !== 'control-room') return null;
    const attendance = pageProps.attendance || { data: [], links: [], meta: null };
    const records = attendance.data || [];
    const meta = attendance.meta;

    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 overflow-hidden">
        {records.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">No attendance records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-950">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Guard</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Site</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Check In</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Check Out</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Hours</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {records.map((record: any) => (
                  <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{record.date}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                      <div className="font-medium">{record.guard_relation?.name || 'Unknown'}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{record.guard_relation?.employee_id || ''}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {record.client_site ? (
                        <div>
                          <div className="font-medium">{record.client_site.name}</div>
                          {record.client_site.client && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">{record.client_site.client.name}</div>
                          )}
                        </div>
                      ) : <span className="text-gray-400 dark:text-gray-500">-</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{formatTime(record.check_in_time)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{formatTime(record.check_out_time)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {record.hours_worked != null ? (
                        <div>
                          <span>{Number(record.hours_worked).toFixed(1)}h</span>
                          {record.overtime_hours && Number(record.overtime_hours) > 0 && (
                            <span className="ml-1 text-xs text-amber-600 dark:text-amber-400">+{Number(record.overtime_hours).toFixed(1)} OT</span>
                          )}
                        </div>
                      ) : <span className="text-gray-400 dark:text-gray-500">-</span>}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <StatusBadge status={record.status} type="attendance" />
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Link
                        href={route('control-room.attendance.edit', { attendance: record.id })}
                        className={`inline-flex items-center px-3 py-1 rounded text-xs font-medium ${
                          pageProps.canEdit
                            ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:hover:bg-amber-900/50'
                            : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500 cursor-not-allowed'
                        }`}
                        onClick={(e) => {
                          if (!pageProps.canEdit) {
                            e.preventDefault();
                            alert('Editing is only available on Tuesdays for Control Room operators. Please contact a Super Admin.');
                          }
                        }}
                      >
                        <svg className="w-3.5 h-3.5 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {meta?.last_page > 1 && (
          <div className="p-4 border-t dark:border-gray-700 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Page {meta.current_page} of {meta.last_page}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(attendance.links || [])
                .filter((l: any) => l.url !== null)
                .map((l: any, idx: number) => (
                  <button
                    key={idx}
                    className={`px-3 py-1 rounded border dark:border-gray-700 ${
                      l.active ? 'bg-coin-600 text-white' : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200'
                    }`}
                    onClick={() => router.get(l.url, {}, { preserveScroll: true, preserveState: true })}
                    dangerouslySetInnerHTML={{ __html: l.label }}
                  />
                ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Zone Commander guard list
  const renderZoneCommanderList = () => {
    if (mode !== 'zone-commander') return null;

    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 overflow-hidden divide-y divide-gray-200 dark:divide-gray-800">
        {zcFilteredGuards.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">No guards found.</div>
        ) : (
          zcFilteredGuards.map((g) => (
            <div key={g.id} className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-rose-700 text-white flex items-center justify-center font-bold flex-shrink-0">
                      {g.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900 dark:text-gray-100 truncate">{g.name}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-300 truncate">{g.employee_id} • {g.phone}</div>
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {renderZcBadge(g)}
                    {g.attendance?.check_in_time && (
                      <span className="text-xs text-gray-600 dark:text-gray-300">
                        In: <span className="font-medium">{g.attendance.check_in_time}</span>
                      </span>
                    )}
                    {g.attendance?.check_out_time && (
                      <span className="text-xs text-gray-600 dark:text-gray-300">
                        Out: <span className="font-medium">{g.attendance.check_out_time}</span>
                      </span>
                    )}
                  </div>

                  {(g.attendance?.check_in_photo_url || g.attendance?.check_out_photo_url) && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {g.attendance?.check_in_photo_url && (
                        <a href={g.attendance.check_in_photo_url} target="_blank" rel="noreferrer" className="text-xs text-coin-700 hover:text-coin-800 dark:text-coin-300 dark:hover:text-coin-200">View check-in photo</a>
                      )}
                      {g.attendance?.check_out_photo_url && (
                        <a href={g.attendance.check_out_photo_url} target="_blank" rel="noreferrer" className="text-xs text-coin-700 hover:text-coin-800 dark:text-coin-300 dark:hover:text-coin-200">View check-out photo</a>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:items-center flex-shrink-0">
                  {renderZcButton(g)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  const renderZcBadge = (g: ZoneGuardRow) => {
    if (!g.attendance?.check_in_time && g.attendance?.status !== 'present') {
      return <span className="px-3 py-1 text-xs font-medium rounded-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200">Not Checked In</span>;
    }
    if (g.attendance?.check_in_time && !g.attendance?.check_out_time) {
      return <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">On Duty</span>;
    }
    if (g.attendance?.status === 'present' && !g.attendance?.check_in_time) {
      return <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">Present</span>;
    }
    return <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">Completed</span>;
  };

  const renderZcButton = (g: ZoneGuardRow) => {
    if (!g.attendance?.check_in_time && g.attendance?.status !== 'present') {
      return (
        <button onClick={() => openMarkPresent(g)} className="px-4 py-2 bg-coin-600 hover:bg-coin-700 text-white rounded-lg text-sm font-medium transition w-full sm:w-auto">
          Mark Present
        </button>
      );
    }
    if ((g.attendance?.check_in_time || g.attendance?.status === 'present') && !g.attendance?.check_out_time) {
      return (
        <button onClick={() => openCheckOut(g)} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition w-full sm:w-auto">
          Check Out
        </button>
      );
    }
    return (
      <button disabled className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 rounded-lg text-sm font-medium w-full sm:w-auto cursor-not-allowed">
        Completed
      </button>
    );
  };

  // -----------------------------------------------------------------------
  // Render: Edit policy modal (control-room)
  // -----------------------------------------------------------------------
  const renderInfoModal = () => {
    if (mode !== 'control-room') return null;
    const p = pageProps;
    return (
      <Modal show={showInfoModal} onClose={() => setShowInfoModal(false)} maxWidth="md">
        <div className="p-6 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
          <h3 className="text-lg font-semibold mb-4">Attendance Edit Policy</h3>
          <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">Control Room Operators</h4>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Can only edit attendance records on <strong>Tuesdays</strong></li>
                <li>Can only edit records from the <strong>previous week</strong> (Monday-Sunday)</li>
                <li>Must provide a reason for each edit</li>
                <li>Edit window closes at midnight on Tuesday</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">Super Admins</h4>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Can edit any attendance record at any time</li>
                <li>All edits are logged with user ID and timestamp</li>
                <li>No restrictions apply</li>
              </ul>
            </div>
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
              <p className="text-yellow-800 dark:text-yellow-200"><strong>Current Period:</strong> {p.lastWeekRange?.display}</p>
              <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                {p.isTuesday ? 'Today is Tuesday — Edit window is currently OPEN' : 'Today is not Tuesday — Edit window is currently CLOSED'}
              </p>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button onClick={() => setShowInfoModal(false)} className="px-4 py-2 bg-coin-600 hover:bg-coin-700 text-white rounded">
              Close
            </button>
          </div>
        </div>
      </Modal>
    );
  };

  // -----------------------------------------------------------------------
  // Render: Zone Commander modals
  // -----------------------------------------------------------------------
  const renderZcModals = () => {
    if (mode !== 'zone-commander') return null;
    return (
      <Modal show={!!zcAction && !!zcSelectedGuard} onClose={closeZcModal} maxWidth="lg">
        <div className="p-4 sm:p-6 space-y-4 bg-white dark:bg-gray-950">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {zcAction === 'markpresent' ? 'Mark Present' : 'Check Out'}
                {zcSelectedGuard ? `: ${zcSelectedGuard.name}` : ''}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {zcAction === 'markpresent' ? 'Confirm guard is present at the selected site.' : 'Record check-out time and notes.'}
              </p>
            </div>
            <button onClick={closeZcModal} className="px-3 py-2 rounded-md border dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-700 dark:text-gray-200">Close</button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Site</label>
            <select
              value={zcSelectedSiteId}
              onChange={(e) => setZcSelectedSiteId(e.target.value ? Number(e.target.value) : '')}
              disabled={zcAction === 'checkout'}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 px-3 py-2"
            >
              <option value="">Select site…</option>
              {zcSites.map((s) => (
                <option key={s.id} value={s.id}>{s.full_name}</option>
              ))}
            </select>
            {zcAction === 'checkout' && (
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">Site is locked to the check-in record.</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Notes (optional)</label>
            <input
              value={zcNotes}
              onChange={(e) => setZcNotes(e.target.value)}
              placeholder="Context (optional)"
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 px-3 py-2"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button onClick={closeZcModal} disabled={zcSubmitting} className="px-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200">
              Cancel
            </button>
            <button
              onClick={submitZcAction}
              disabled={zcSubmitting || !zcSelectedGuard || !zcSelectedSiteId}
              className={`px-4 py-2 rounded-lg text-white font-medium transition disabled:opacity-50 ${
                zcAction === 'checkout' ? 'bg-red-600 hover:bg-red-700' : 'bg-coin-600 hover:bg-coin-700'
              }`}
            >
              {zcSubmitting
                ? (zcAction === 'checkout' ? 'Checking out…' : 'Marking present…')
                : (zcAction === 'checkout' ? 'Check Out' : 'Mark Present')}
            </button>
          </div>
        </div>
      </Modal>
    );
  };

  // -----------------------------------------------------------------------
  // Main render
  // -----------------------------------------------------------------------

  const headerTitle = mode === 'control-room'
    ? `Attendance History - ${pageProps.lastWeekRange?.display || ''}`
    : mode === 'zone-commander' ? 'Zone Attendance' : 'Attendance History';

  const headerDescription = mode === 'control-room'
    ? "Previous week's attendance records. Control Room can edit only on Tuesdays."
    : undefined;

  return (
    <AuthenticatedLayout header={mode === 'zone-commander' ? 'Zone Attendance' : 'Attendance'}>
      <Head title={mode === 'zone-commander' ? 'Zone Attendance' : 'Attendance'} />

      <div className="max-w-7xl mx-auto space-y-6 px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{headerTitle}</h1>
            {headerDescription && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{headerDescription}</p>}
          </div>
          <div className="flex gap-2">
            {mode === 'supervisor' && (
              <button
                onClick={() => setIsScannerOpen(true)}
                className="px-4 py-2 bg-coin-700 hover:bg-coin-600 text-white rounded-lg font-medium flex items-center gap-2 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                Scan Site
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        {renderStats()}

        {/* Edit Policy Alerts (control-room) */}
        {renderAlerts()}

        {/* Filters */}
        {renderFilters()}

        {/* Main Attendance List */}
        {renderSupervisorTable()}
        {renderControlRoomTable()}
        {renderZoneCommanderList()}

        {/* Scanner Modal (supervisor only) */}
        {mode === 'supervisor' && (
          <ScannerModal
            open={isScannerOpen}
            onClose={() => setIsScannerOpen(false)}
            activeScan={pageProps.activeScan}
          />
        )}

        {/* Edit Policy Info Modal */}
        {renderInfoModal()}

        {/* Zone Commander Action Modals */}
        {renderZcModals()}
      </div>
    </AuthenticatedLayout>
  );
}
