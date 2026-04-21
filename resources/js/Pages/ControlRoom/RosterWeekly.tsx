import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Head, useForm, usePage, Link, router } from '@inertiajs/react';
import ControlRoomLayout from '@/Layouts/ControlRoomLayout';
import Modal from '@/Components/Modal';
import useToast from '@/Components/ui/use-toast';
import EmptyState from '@/Components/ui/empty-state';
import ManualRosterEntryModal from '@/Components/Roster/ManualRosterEntryModal';
import { Button } from '@/Components/ui/button';
import { Card } from '@/Components/ui/card';
import IconMapper from '@/Components/IconMapper';

type DayKey = string; // YYYY-MM-DD

type Site = { id: number; name: string };

type ShiftType = 'day' | 'night' | 'morning' | 'evening' | 'custom';

type DayMeta = {
  source?: 'shift' | 'assignment' | 'rotation';
  shift_id?: number;
  start_time?: string | null;
  end_time?: string | null;
};

type AttendanceToday = {
  id: number;
  client_site_id: number | null;
  status: string;
  checked_in: boolean;
  checked_out: boolean;
};

type GuardWeekly = {
  id: number;
  name: string;
  employee_id?: string;
  guard_type?: 'permanent' | 'standby' | 'reliever' | string;
  sites: Record<DayKey, Site | null>;
  off: Record<DayKey, boolean>;
  meta?: Record<DayKey, DayMeta>;
  attendance_today?: AttendanceToday | null;
};

type RelieverWeekly = {
  id: number;
  name: string;
  employee_id?: string;
  sites: Record<DayKey, Site | null>;
  meta?: Record<DayKey, DayMeta>;
  attendance_today?: AttendanceToday | null;
};

type WeeklyData = {
  shift_type?: ShiftType;
  today?: string;
  days: DayKey[];
  guards: GuardWeekly[];
  relievers: RelieverWeekly[];
  sites: Site[];
  active_sites?: Site[];
};

type GuardPlanCell = {
  client_site_id?: number | null;
  entry_type: 'site' | 'off';
  notes?: string | null;
};

type WeeklyPlanStatus = {
  id: number;
  week_start: string;
  supervisor_id: number;
  shift_type: ShiftType;
  status: 'draft' | 'published';
  published_at?: string | null;
};

type DraftEntry = {
  guard_id: number;
  date: string;
  entry_type: 'site' | 'off';
  client_site_id?: number | '';
  notes?: string;
  delete?: boolean;
};

function getCsrfToken(): string {
  if (typeof document === 'undefined') return '';
  const el = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
  return el?.content || '';
}

function startOfWeekMonday(d: Date) {
  const date = new Date(d);
  const day = date.getDay(); // 0=Sun
  const diff = (day === 0 ? -6 : 1) - day; // make Monday start
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatYmd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export default function RosterWeekly() {
  const { auth, initial_week_start, zones = [], supervisors = [] } = (usePage().props as any);
  const { toast } = useToast();

  const [weekStart, setWeekStart] = useState<Date>(() => initial_week_start ? new Date(initial_week_start) : startOfWeekMonday(new Date()));
  const [zoneId, setZoneId] = useState<number | ''>('');
  const [supervisorId, setSupervisorId] = useState<number | ''>('');
  const [guardTypeFilter, setGuardTypeFilter] = useState<string>('');
  const [shiftType, setShiftType] = useState<ShiftType>('day');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [data, setData] = useState<WeeklyData | null>(null);
  const [loading, setLoading] = useState(false);

  const [plan, setPlan] = useState<WeeklyPlanStatus | null>(null);
  const [planEntries, setPlanEntries] = useState<Record<number, Record<DayKey, GuardPlanCell>> | null>(null);
  const [draftEdits, setDraftEdits] = useState<Record<string, DraftEntry>>({});
  const [savingDraft, setSavingDraft] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [manualEntryOpen, setManualEntryOpen] = useState(false);

  const canManageAttendance = useMemo(() => {
    const can = (auth as any)?.user?.can;
    if (can && can['attendance.manage']) return true;
    const rawRoles = ((auth?.user as any)?.roles ?? []) as (string | { id: number; name: string })[];
    const roles = rawRoles.map((r) => (typeof r === 'string' ? r : r.name));
    const isAdmin = roles.includes('admin') || roles.includes('super_admin');
    return isAdmin || roles.includes('control_room_operator') || roles.includes('operations_officer') || roles.includes('manager');
  }, [auth]);

  const planLocked = useMemo(() => plan?.status === 'published', [plan?.status]);

  const loadPlan = useCallback(async (params: { start: string; supervisor_id: number; shift_type: ShiftType }) => {
    try {
      const url = route('control-room.roster.weekly.plan', params);
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) {
        setPlan(null);
        setPlanEntries(null);
        return;
      }
      const json = await res.json();
      setPlan(json?.plan ?? null);
      setPlanEntries(json?.entries ?? null);
    } catch {
      setPlan(null);
      setPlanEntries(null);
    }
  }, []);

  const load = useCallback(async (overrides?: { weekStart?: Date; zoneId?: number | ''; supervisorId?: number | '' }) => {
    setLoading(true);
    try {
      const ws = overrides?.weekStart ?? weekStart;
      const zid = overrides?.zoneId ?? zoneId;
      const sid = overrides?.supervisorId ?? supervisorId;

      const params: any = { start: formatYmd(ws), shift_type: shiftType };
      if (zid) params.zone_id = zid;
      if (sid) params.supervisor_id = sid;

      if (sid) {
        await loadPlan({ start: formatYmd(ws), supervisor_id: Number(sid), shift_type: shiftType });
      } else {
        setPlan(null);
        setPlanEntries(null);
      }

      const res = await fetch(route('control-room.roster.weekly.data', params), { headers: { Accept: 'application/json' } });
      if (!res.ok) {
        toast({ title: 'Failed to load roster', description: `Request failed (${res.status})`, variant: 'destructive' });
        setData(null);
        return;
      }
      const json = await res.json();
      setData(json as WeeklyData);
    } finally {
      setLoading(false);
    }
  }, [loadPlan, shiftType, supervisorId, toast, weekStart, zoneId]);

  useEffect(() => {
    load({});
  }, [load]);

  const stageDraftEntry = useCallback((entry: DraftEntry) => {
    const key = `${entry.guard_id}-${entry.date}`;
    setDraftEdits((prev) => ({ ...prev, [key]: entry }));
  }, []);

  const saveDraft = useCallback(async () => {
    if (!supervisorId) {
      toast({ title: 'Supervisor required', description: 'Select a supervisor to save a weekly plan.', variant: 'destructive' });
      return;
    }
    const entries = Object.values(draftEdits);
    if (entries.length === 0) {
      toast({ title: 'No changes to save', description: 'Make changes first, then click Save Draft.' });
      return;
    }

    setSavingDraft(true);
    try {
      const token = getCsrfToken();
      const payload = {
        start: formatYmd(weekStart),
        supervisor_id: Number(supervisorId),
        shift_type: shiftType,
        entries,
      };
      const res = await fetch(route('control-room.roster.weekly.plan.save'), {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...(token ? { 'X-CSRF-TOKEN': token } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        toast({ title: 'Failed to save draft', description: `Request failed (${res.status})`, variant: 'destructive' });
        return;
      }
      toast({ title: 'Draft saved', description: `${entries.length} change(s) saved.` });
      setDraftEdits({});
      await load({});
    } finally {
      setSavingDraft(false);
    }
  }, [draftEdits, load, shiftType, supervisorId, toast, weekStart]);

  const publishPlan = useCallback(async () => {
    if (!supervisorId) {
      toast({ title: 'Supervisor required', description: 'Select a supervisor to publish a weekly plan.', variant: 'destructive' });
      return;
    }
    if (Object.keys(draftEdits).length > 0) {
      toast({ title: 'Save draft first', description: 'You have unsaved changes. Click Save Draft before publishing.', variant: 'destructive' });
      return;
    }

    setPublishing(true);
    try {
      const token = getCsrfToken();
      const payload = {
        start: formatYmd(weekStart),
        supervisor_id: Number(supervisorId),
        shift_type: shiftType,
      };
      const res = await fetch(route('control-room.roster.weekly.plan.publish'), {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...(token ? { 'X-CSRF-TOKEN': token } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        toast({ title: 'Publish failed', description: `Request failed (${res.status})`, variant: 'destructive' });
        return;
      }
      toast({ title: 'Published', description: 'Weekly plan published.' });
      await load({});
    } finally {
      setPublishing(false);
    }
  }, [draftEdits, load, shiftType, supervisorId, toast, weekStart]);

  const safeDays: DayKey[] = useMemo(() => (Array.isArray(data?.days) ? data!.days : []), [data?.days]);
  const safeSites: Site[] = useMemo(() => (Array.isArray(data?.sites) ? data!.sites : []), [data?.sites]);
  const safeGuards: GuardWeekly[] = useMemo(() => (Array.isArray(data?.guards) ? data!.guards : []), [data?.guards]);
  const safeRelievers: RelieverWeekly[] = useMemo(() => (Array.isArray(data?.relievers) ? data!.relievers : []), [data?.relievers]);

  const planned = useMemo(() => {
    const siteById = new Map<number, Site>();
    safeSites.forEach((s) => siteById.set(s.id, s));

    const sites: Record<number, Record<DayKey, Site | null>> = {};
    const off: Record<number, Record<DayKey, boolean>> = {};

    const allGuards = [...safeGuards, ...safeRelievers];
    for (const g of allGuards) {
      sites[g.id] = {};
      off[g.id] = {};
      for (const d of safeDays) {
        sites[g.id][d] = null;
        off[g.id][d] = false;
      }
    }

    // persisted plan entries
    if (planEntries) {
      for (const [gidRaw, perDay] of Object.entries(planEntries)) {
        const gid = Number(gidRaw);
        if (!sites[gid]) sites[gid] = {};
        if (!off[gid]) off[gid] = {};
        for (const [d, cell] of Object.entries(perDay)) {
          if (cell.entry_type === 'off') {
            off[gid][d] = true;
            sites[gid][d] = null;
            continue;
          }
          const sid = cell.client_site_id ?? null;
          off[gid][d] = false;
          sites[gid][d] = sid ? (siteById.get(Number(sid)) ?? { id: Number(sid), name: 'Site' }) : null;
        }
      }
    }

    // draft edits
    for (const e of Object.values(draftEdits)) {
      if (!e.guard_id || !e.date) continue;
      if (!sites[e.guard_id]) sites[e.guard_id] = {};
      if (!off[e.guard_id]) off[e.guard_id] = {};

      if (e.delete) {
        sites[e.guard_id][e.date] = null;
        off[e.guard_id][e.date] = false;
        continue;
      }
      if (e.entry_type === 'off') {
        sites[e.guard_id][e.date] = null;
        off[e.guard_id][e.date] = true;
        continue;
      }
      const sid = e.client_site_id;
      sites[e.guard_id][e.date] = sid ? (siteById.get(Number(sid)) ?? { id: Number(sid), name: 'Site' }) : null;
      off[e.guard_id][e.date] = false;
    }

    return { sites, off };
  }, [draftEdits, planEntries, safeDays, safeGuards, safeRelievers, safeSites]);

  return (
    <ControlRoomLayout title="Weekly Planner">
      <Head title="Weekly Planner" />

      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        {/* Hero Header */}
        <div className="bg-gradient-to-r from-coin-700 via-coin-600 to-coin-500 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
                <IconMapper name="CalendarDays" size={28} />
                Weekly Planner
              </h1>
              <p className="mt-1 text-coin-100 text-sm">
                Schedule and manage guard assignments for the week
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                type="button" 
                variant="secondary" 
                className="bg-white/20 hover:bg-white/30 text-white border-0"
                onClick={saveDraft} 
                disabled={savingDraft || planLocked || Object.keys(draftEdits).length === 0}
              >
                <IconMapper name="Save" size={16} className="mr-2" />
                Save Draft
              </Button>
              <Button 
                type="button" 
                className="bg-white text-coin-700 hover:bg-coin-50"
                onClick={publishPlan} 
                disabled={publishing || planLocked || !supervisorId || Object.keys(draftEdits).length > 0}
              >
                <IconMapper name="Send" size={16} className="mr-2" />
                Publish
              </Button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            <div className="bg-white/10 backdrop-blur rounded-xl p-3">
              <div className="text-xs text-coin-100">Week Starting</div>
              <div className="text-lg font-bold">{formatYmd(weekStart)}</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-3">
              <div className="text-xs text-coin-100">Assigned Guards</div>
              <div className="text-2xl font-bold">{data?.guards?.length || 0}</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-3">
              <div className="text-xs text-coin-100">Relievers</div>
              <div className="text-2xl font-bold">{data?.relievers?.length || 0}</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-3">
              <div className="text-xs text-coin-100">Plan Status</div>
              <div className="text-lg font-bold">{plan?.status === 'published' ? 'Published' : 'Draft'}</div>
            </div>
          </div>
        </div>

        {/* Filters Card */}
        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <div className="p-4">
            {/* Mobile Filter Toggle */}
            <div className="sm:hidden flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <IconMapper name="Filter" size={16} />
                Filters
                {(zoneId || supervisorId || shiftType !== 'day') && (
                  <span className="bg-coin-700 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {[zoneId, supervisorId, shiftType !== 'day' ? 'shift' : null].filter(Boolean).length}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setFiltersOpen(!filtersOpen)}
                className="text-sm text-coin-700 dark:text-coin-300 hover:underline"
              >
                {filtersOpen ? 'Hide' : 'Show'}
              </button>
            </div>

            <div className={`${filtersOpen ? 'block' : 'hidden'} sm:block`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Week Start</label>
                  <input 
                    type="date" 
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
                    value={formatYmd(weekStart)} 
                    onChange={(e) => setWeekStart(startOfWeekMonday(new Date(e.target.value)))} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Zone</label>
                  <select 
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
                    value={zoneId as any} 
                    onChange={(e) => setZoneId(e.target.value ? Number(e.target.value) : '')}
                  >
                    <option value="">All Zones</option>
                    {zones.map((z: any) => (<option key={z.id} value={z.id}>{z.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Supervisor</label>
                  <select 
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
                    value={supervisorId as any} 
                    onChange={(e) => setSupervisorId(e.target.value ? Number(e.target.value) : '')}
                  >
                    <option value="">Select Supervisor</option>
                    {supervisors.map((s: any) => (<option key={s.id} value={s.id}>{s.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Shift Type</label>
                  <select 
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
                    value={shiftType} 
                    onChange={(e) => setShiftType(e.target.value as ShiftType)}
                  >
                    <option value="day">Day</option>
                    <option value="night">Night</option>
                  </select>
                </div>
              </div>
              <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {supervisorId ? (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      planLocked 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' 
                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                    }`}>
                      <IconMapper name={planLocked ? 'Lock' : 'Unlock'} size={12} />
                      {planLocked ? 'Published (Locked)' : 'Draft Mode'}
                    </span>
                  ) : (
                    'Select a supervisor to enable plan editing'
                  )}
                </div>
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    className="bg-coin-700 hover:bg-coin-600 text-white"
                    onClick={() => load({})}
                  >
                    <IconMapper name="Filter" size={16} className="mr-2" />
                    Apply
                  </Button>
                  <Button 
                    type="button" 
                    variant="secondary" 
                    className="dark:bg-gray-800 dark:hover:bg-gray-700"
                    onClick={() => { setZoneId(''); setSupervisorId(''); setGuardTypeFilter(''); load({ zoneId: '', supervisorId: '' }); }}
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {loading && (
          <EmptyState title="Loading roster" description="Fetching weekly roster data…" size="sm" contentClassName="py-2" />
        )}

        {data && (
          <div className="space-y-8">
            {(!guardTypeFilter || guardTypeFilter === 'permanent') && (
              <GuardsTable
                data={{ ...data, days: safeDays, sites: safeSites, guards: safeGuards, relievers: safeRelievers }}
                onRefresh={load}
                shiftType={shiftType}
                canManageAttendance={canManageAttendance}
                plannedSites={planned.sites}
                plannedOff={planned.off}
                planLocked={planLocked}
                onStageDraftEntry={stageDraftEntry}
              />
            )}
            {(!guardTypeFilter || guardTypeFilter === 'standby') && (
              <StandbyTable
                data={{ ...data, days: safeDays, sites: safeSites, guards: safeGuards, relievers: safeRelievers }}
                onRefresh={load}
                shiftType={shiftType}
                canManageAttendance={canManageAttendance}
                plannedSites={planned.sites}
                plannedOff={planned.off}
                planLocked={planLocked}
                onStageDraftEntry={stageDraftEntry}
              />
            )}
            {(!guardTypeFilter || guardTypeFilter === 'reliever') && (
              <RelieversTable
                data={{ ...data, days: safeDays, sites: safeSites, guards: safeGuards, relievers: safeRelievers }}
                onRefresh={load}
                shiftType={shiftType}
                canManageAttendance={canManageAttendance}
                plannedSites={planned.sites}
                planLocked={planLocked}
                onStageDraftEntry={stageDraftEntry}
              />
            )}
          </div>
        )}

        <ManualRosterEntryModal
          open={manualEntryOpen}
          onClose={() => setManualEntryOpen(false)}
          guards={safeGuards}
          sites={safeSites}
          onSaved={() => { setManualEntryOpen(false); load({}); }}
        />
      </div>
    </ControlRoomLayout>
  );
}

function AssignGuardSiteModal({ open, onClose, guardId, date, initialSiteId, sites, planLocked, onStage, onSaved }: { open: boolean; onClose: () => void; guardId?: number; date?: string; initialSiteId?: number; sites: Site[]; planLocked: boolean; onStage: (e: DraftEntry) => void; onSaved: () => void }) {
  const { data, setData, processing, reset } = useForm<{ guard_id: number | string; client_site_id: number | string; date: string }>(
    {
      guard_id: guardId ?? ('' as any),
      client_site_id: initialSiteId ?? ('' as any),
      date: date ?? '',
    }
  );

  useEffect(() => {
    if (!open) return;
    setData('guard_id', guardId ?? ('' as any));
    setData('client_site_id', initialSiteId ?? ('' as any));
    setData('date', date ?? '');
  }, [open, guardId, date, initialSiteId, setData]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (planLocked) return;
    if (!data.guard_id || !data.date || !data.client_site_id) return;
    onStage({
      guard_id: Number(data.guard_id),
      date: data.date,
      entry_type: 'site',
      client_site_id: Number(data.client_site_id),
    });
    reset();
    onSaved();
  };

  const clearOverride = () => {
    if (planLocked) return;
    if (!guardId || !date) return;
    onStage({ guard_id: guardId, date, entry_type: 'site', delete: true });
    reset();
    onSaved();
  };

  const handleClose = () => {
    if (!processing) onClose();
  };

  return (
    <Modal show={open} onClose={handleClose} maxWidth="sm">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white dark:bg-gray-900 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Override Site</h2>
        <button type="button" onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200">✕</button>
      </div>
      <div className="px-6 py-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <form className="grid grid-cols-1 gap-3" onSubmit={submit}>
          <div>
            <label className="block text-sm font-medium">Date</label>
            <input type="date" className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={data.date} onChange={(e) => setData('date', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium">Site</label>
            <select className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={data.client_site_id as any} onChange={(e) => setData('client_site_id', e.target.value ? Number(e.target.value) : '')}>
              <option value="">Select a site</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={handleClose} className="px-4 py-2 text-sm rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700" disabled={processing}>Cancel</button>
            {initialSiteId ? (
              <button type="button" onClick={clearOverride} className="px-4 py-2 text-sm rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700" disabled={processing || planLocked}>Clear</button>
            ) : null}
            <button type="submit" disabled={processing || planLocked || !data.client_site_id || !data.date} className="px-4 py-2 text-sm rounded-md bg-coin-700 text-white hover:bg-coin-600">Save</button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function StandbyTable({ data, onRefresh, shiftType, canManageAttendance, plannedSites, plannedOff, planLocked, onStageDraftEntry }: { data: WeeklyData; onRefresh: () => void; shiftType: ShiftType; canManageAttendance: boolean; plannedSites: Record<number, Record<DayKey, Site | null>>; plannedOff: Record<number, Record<DayKey, boolean>>; planLocked: boolean; onStageDraftEntry: (e: DraftEntry) => void }) {
  const dayLabels = useMemo(() => data.days.map((d) => new Date(d).toLocaleDateString(undefined, { weekday: 'short' })), [data.days]);
  const [offModal, setOffModal] = useState<{ open: boolean; guardId?: number; date?: string }>({ open: false });
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [bulkOffOpen, setBulkOffOpen] = useState(false);
  const [assignModal, setAssignModal] = useState<{ open: boolean; guardId?: number; date?: string; siteId?: number }>( { open: false } );
  const [manualModal, setManualModal] = useState<{ open: boolean; guardId?: number; date?: string; siteId?: number; shiftId?: number }>({ open: false });
  const [attModal, setAttModal] = useState<{ open: boolean; guardId?: number; siteId?: number | null; action?: 'present' | 'absent' }>({ open: false });
  const { toast } = useToast();

  const toggleSel = (id: number) => setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  const selectedIds = Object.entries(selected).filter(([_, v]) => !!v).map(([k]) => Number(k));

  const todayKey = data.today;

  const doQuick = (guardId: number, action: 'present' | 'absent', siteId?: number | null) => {
    if (!canManageAttendance) return;
    if (action === 'absent') {
      if (!confirm('Mark this guard as absent for today?')) return;
      router.post(route('control-room.attendance.mark-absent'), { guard_id: guardId }, {
          preserveScroll: true,
          onSuccess: () => { toast({ title: 'Marked absent' }); onRefresh(); },
          onError: (errs) => toast({ title: Object.values(errs)[0] || 'Failed to mark absent', variant: 'destructive' }),
        });
      return;
    }
    router.post(route('control-room.attendance.mark-present'), { guard_id: guardId, client_site_id: siteId ?? undefined }, {
          preserveScroll: true,
          onSuccess: () => { toast({ title: 'Marked present' }); onRefresh(); },
          onError: (errs) => toast({ title: Object.values(errs)[0] || 'Failed to mark present', variant: 'destructive' }),
        });
  };

  const standbyGuards = (data.guards || []).filter((g) => (g.guard_type || 'permanent') === 'standby');
  if (!standbyGuards.length) return null;

  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Standby Guards</h3>
        <div className="text-xs text-gray-500 dark:text-gray-400">Click a day to add off-day</div>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="text-xs text-gray-500 dark:text-gray-400">Select guards then bulk mark OFF</div>
        <button disabled={!selectedIds.length} onClick={() => setBulkOffOpen(true)} className={`w-full sm:w-auto px-3 py-1.5 rounded-md text-white ${selectedIds.length ? 'bg-coin-700 hover:bg-coin-600' : 'bg-gray-400 cursor-not-allowed'}`}>Bulk Off-day</button>
      </div>

      <div className="md:hidden space-y-2">
        {standbyGuards.map((g) => (
          <div key={g.id} className="rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3">
            <div className="flex items-start justify-between gap-3">
              <label className="inline-flex items-start gap-2">
                <input className="mt-1 rounded border-gray-300 dark:border-gray-600 dark:bg-gray-900" type="checkbox" checked={!!selected[g.id]} onChange={() => toggleSel(g.id)} />
                <span className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 break-words">
                    {g.name} {g.employee_id ? <span className="text-xs text-gray-500">({g.employee_id})</span> : null}
                  </div>
                  <div className="mt-1">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">Standby</span>
                  </div>
                </span>
              </label>
            </div>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {data.days.map((d, idx) => {
                const meta = g.meta?.[d];
                const isShift = meta?.source === 'shift';
                const off = isShift ? !!g.off?.[d] : !!plannedOff?.[g.id]?.[d];
                const site = isShift ? (g.sites?.[d] ?? null) : (plannedSites?.[g.id]?.[d] ?? null);
                const isToday = !!todayKey && d === todayKey;
                const att = g.attendance_today || null;
                return (
                  <button
                    key={d}
                    type="button"
                    className={`flex items-center justify-between gap-2 w-full px-3 py-2 rounded-md border text-sm ${off ? 'bg-gray-800 text-gray-100 border-gray-700' : site ? 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700' : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-800'}`}
                    onClick={() => {
                      if (off) {
                        if (planLocked) {
                          toast({ title: 'Plan is published', description: 'This weekly plan is locked.' });
                          return;
                        }
                        setOffModal({ open: true, guardId: g.id, date: d });
                        return;
                      }
                      if (!meta?.source) {
                        if (planLocked) {
                          toast({ title: 'Plan is published', description: 'This weekly plan is locked.' });
                          return;
                        }
                        setAssignModal({ open: true, guardId: g.id, date: d, siteId: site?.id });
                        return;
                      }
                      setManualModal({
                        open: true,
                        guardId: g.id,
                        date: d,
                        siteId: site?.id,
                        shiftId: meta?.shift_id,
                      });
                    }}
                    title={off ? 'Add off-day' : 'Edit roster'}
                  >
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{dayLabels[idx]}</span>
                    <span className="font-semibold truncate">
                      {off ? 'OFF' : (site ? site.name : '—')}
                      {meta?.source === 'shift' ? <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-coin-700 text-white">Manual</span> : null}
                      {isToday && att?.checked_out ? <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-sky-700 text-white">OUT</span> : null}
                      {isToday && !att?.checked_out && att?.checked_in ? <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-700 text-white">IN</span> : null}
                      {isToday && !att?.checked_in && (att?.status === 'present') ? <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-700 text-white">PRESENT</span> : null}
                      {isToday && (att?.status === 'absent') ? <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-red-700 text-white">ABSENT</span> : null}
                    </span>
                  </button>
                );
              })}
            </div>

            {todayKey && canManageAttendance ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-md bg-emerald-700 text-white text-xs"
                  onClick={() => {
                    const siteId = g.sites?.[todayKey!]?.id ?? null;
                    setAttModal({ open: true, guardId: g.id, siteId, action: 'present' });
                  }}
                >
                  Mark Present
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-md bg-red-700 text-white text-xs"
                  onClick={() => setAttModal({ open: true, guardId: g.id, action: 'absent' })}
                >
                  Mark Absent
                </button>
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <div className="hidden md:block overflow-x-auto border dark:border-gray-800 rounded-md">
        <table className="min-w-[900px] w-full divide-y divide-gray-200 dark:divide-gray-800">
          <thead className="bg-gray-50 dark:bg-gray-950">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Guard</th>
              {dayLabels.map((lbl, idx) => (
                <th key={idx} className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">{lbl}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-900 bg-white dark:bg-gray-900">
            {standbyGuards.map((g) => (
              <tr key={g.id}>
                <td className="px-3 py-2 text-sm font-medium whitespace-nowrap">
                  <label className="inline-flex items-center gap-2">
                    <input className="rounded border-gray-300 dark:border-gray-600 dark:bg-gray-900" type="checkbox" checked={!!selected[g.id]} onChange={() => toggleSel(g.id)} />
                    <span className="inline-flex items-center gap-2">
                      <span>{g.name} {g.employee_id ? <span className="text-xs text-gray-500">({g.employee_id})</span> : null}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">Standby</span>
                    </span>
                  </label>
                </td>
                {data.days.map((d) => {
                  const meta = g.meta?.[d];
                  const isShift = meta?.source === 'shift';
                  const off = isShift ? !!g.off?.[d] : !!plannedOff?.[g.id]?.[d];
                  const site = isShift ? (g.sites?.[d] ?? null) : (plannedSites?.[g.id]?.[d] ?? null);
                  const isToday = !!todayKey && d === todayKey;
                  const att = g.attendance_today || null;
                  return (
                    <td key={d} className="px-3 py-2 text-sm">
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          className={`inline-flex items-center gap-2 px-2 py-1 rounded-md border text-xs ${off ? 'bg-gray-800 text-gray-100 border-gray-700' : site ? 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700' : 'bg-white dark:bg-gray-900 text-gray-500 border-gray-200 dark:border-gray-800'}`}
                          onClick={() => {
                            if (off) {
                              if (planLocked) {
                                toast({ title: 'Plan is published', description: 'This weekly plan is locked.' });
                                return;
                              }
                              setOffModal({ open: true, guardId: g.id, date: d });
                              return;
                            }
                            if (!meta?.source) {
                              if (planLocked) {
                                toast({ title: 'Plan is published', description: 'This weekly plan is locked.' });
                                return;
                              }
                              setAssignModal({ open: true, guardId: g.id, date: d, siteId: site?.id });
                              return;
                            }
                            setManualModal({
                              open: true,
                              guardId: g.id,
                              date: d,
                              siteId: site?.id,
                              shiftId: meta?.shift_id,
                            });
                          }}
                          title={off ? 'Add off-day' : 'Edit roster'}
                        >
                          {off ? 'OFF' : (site ? site.name : '—')}
                          {meta?.source === 'shift' ? <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-coin-700 text-white">M</span> : null}
                          {isToday && att?.checked_out ? <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-sky-700 text-white">OUT</span> : null}
                          {isToday && !att?.checked_out && att?.checked_in ? <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-700 text-white">IN</span> : null}
                          {isToday && !att?.checked_in && (att?.status === 'present') ? <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-700 text-white">PRESENT</span> : null}
                          {isToday && (att?.status === 'absent') ? <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-700 text-white">ABSENT</span> : null}
                        </button>

                        {isToday && canManageAttendance ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              className="px-2 py-1 rounded-md bg-emerald-700 text-white text-[10px]"
                              onClick={() => doQuick(g.id, 'present', site?.id ?? null)}
                            >
                              Present
                            </button>
                            <button
                              type="button"
                              className="px-2 py-1 rounded-md bg-red-700 text-white text-[10px]"
                              onClick={() => doQuick(g.id, 'absent')}
                            >
                              Absent
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AddOffDayModal
        open={offModal.open}
        onClose={() => setOffModal({ open: false })}
        guardId={offModal.guardId}
        date={offModal.date}
        planLocked={planLocked}
        onStage={(e) => onStageDraftEntry(e)}
        onSaved={() => { setOffModal({ open: false }); }}
      />

      <BulkOffModal
        open={bulkOffOpen}
        onClose={() => setBulkOffOpen(false)}
        guardIds={selectedIds}
        days={data.days}
        planLocked={planLocked}
        onStage={(entries) => entries.forEach((e) => onStageDraftEntry(e))}
        onSaved={() => { setBulkOffOpen(false); }}
      />

      <AssignReliefModal
        open={assignModal.open}
        onClose={() => setAssignModal({ open: false })}
        guardId={assignModal.guardId}
        date={assignModal.date}
        initialSiteId={assignModal.siteId}
        sites={data.sites}
        planLocked={planLocked}
        onStage={(e) => onStageDraftEntry(e)}
        onSaved={() => { setAssignModal({ open: false }); }}
      />

      <ManualRosterShiftModal
        open={manualModal.open}
        onClose={() => setManualModal({ open: false })}
        guardId={manualModal.guardId}
        date={manualModal.date}
        sites={data.sites}
        shiftType={shiftType}
        initialSiteId={manualModal.siteId}
        shiftId={manualModal.shiftId}
        onSaved={() => { setManualModal({ open: false }); onRefresh(); }}
        onDeleted={() => { setManualModal({ open: false }); onRefresh(); }}
      />

      <QuickAttendanceConfirmModal
        open={attModal.open}
        onClose={() => setAttModal({ open: false })}
        guardId={attModal.guardId}
        siteId={attModal.siteId}
        action={attModal.action}
        onConfirm={(guardId: number, action: 'present' | 'absent', siteId?: number | null) => {
          setAttModal({ open: false });
          doQuick(guardId, action, siteId ?? undefined);
        }}
      />
    </div>
  );
}

function GuardsTable({ data, onRefresh, shiftType, canManageAttendance, plannedSites, plannedOff, planLocked, onStageDraftEntry }: { data: WeeklyData; onRefresh: () => void; shiftType: ShiftType; canManageAttendance: boolean; plannedSites: Record<number, Record<DayKey, Site | null>>; plannedOff: Record<number, Record<DayKey, boolean>>; planLocked: boolean; onStageDraftEntry: (e: DraftEntry) => void }) {
  const dayLabels = useMemo(() => data.days.map((d) => new Date(d).toLocaleDateString(undefined, { weekday: 'short' })), [data.days]);
  const [offModal, setOffModal] = useState<{ open: boolean; guardId?: number; date?: string }>( { open: false } );
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [bulkOffOpen, setBulkOffOpen] = useState(false);
  const [assignModal, setAssignModal] = useState<{ open: boolean; guardId?: number; date?: string; siteId?: number }>( { open: false } );
  const [manualModal, setManualModal] = useState<{ open: boolean; guardId?: number; date?: string; siteId?: number; shiftId?: number; notes?: string }>( { open: false } );
  const { toast } = useToast();

  const todayKey = data.today;

  const selectedIds = useMemo(() => Object.entries(selected).filter(([, v]) => v).map(([id]) => Number(id)), [selected]);
  const toggleSel = (id: number) => setSelected((prev) => ({ ...prev, [id]: !prev[id] }));

  const doQuick = (guardId: number, action: 'present' | 'absent', siteId?: number | null) => {
    if (!canManageAttendance) return;
    if (action === 'absent') {
      if (!confirm('Mark this guard as absent for today?')) return;
      router.post(route('control-room.attendance.mark-absent'), { guard_id: guardId }, {
          preserveScroll: true,
          onSuccess: () => { toast({ title: 'Marked absent' }); onRefresh(); },
          onError: (errs) => toast({ title: Object.values(errs)[0] || 'Failed to mark absent', variant: 'destructive' }),
        });
      return;
    }
    router.post(route('control-room.attendance.mark-present'), { guard_id: guardId, client_site_id: siteId ?? undefined }, {
          preserveScroll: true,
          onSuccess: () => { toast({ title: 'Marked present' }); onRefresh(); },
          onError: (errs) => toast({ title: Object.values(errs)[0] || 'Failed to mark present', variant: 'destructive' }),
        });
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <IconMapper name="Users" size={20} className="text-coin-600" />
            Assigned Guards
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Click a day to add off-day or assign site</p>
        </div>
        <button 
          disabled={!selectedIds.length} 
          onClick={() => setBulkOffOpen(true)} 
          className={`px-3 py-1.5 rounded-md text-white text-sm font-medium transition-colors ${
            selectedIds.length 
              ? 'bg-coin-700 hover:bg-coin-600' 
              : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          <IconMapper name="CalendarX" size={14} className="mr-1.5 inline" />
          Bulk Off-day
        </button>
      </div>

      <div className="md:hidden space-y-2">
        {data.guards.filter(g => ((g.guard_type || 'permanent') === 'permanent')).map((g) => (
          <div key={g.id} className="rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3">
            <div className="flex items-start justify-between gap-3">
              <label className="inline-flex items-start gap-2">
                <input className="mt-1 rounded border-gray-300 dark:border-gray-600 dark:bg-gray-900" type="checkbox" checked={!!selected[g.id]} onChange={() => toggleSel(g.id)} />
                <span className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 break-words">
                    {g.name} {g.employee_id ? <span className="text-xs text-gray-500">({g.employee_id})</span> : null}
                  </div>
                  <div className="mt-1">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200">Permanent</span>
                  </div>
                </span>
              </label>
            </div>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {data.days.map((d, idx) => {
                const meta = g.meta?.[d];
                const isShift = meta?.source === 'shift';
                const off = isShift ? !!g.off?.[d] : !!plannedOff?.[g.id]?.[d];
                const site = isShift ? (g.sites?.[d] ?? null) : (plannedSites?.[g.id]?.[d] ?? null);
                return (
                  <button
                    key={d}
                    type="button"
                    className={`flex items-center justify-between gap-2 w-full px-3 py-2 rounded-md border text-sm ${off ? 'bg-gray-800 text-gray-100 border-gray-700' : site ? 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700' : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-800'}`}
                    onClick={() => {
                      if (meta?.source === 'shift') {
                        setManualModal({ open: true, guardId: g.id, date: d, siteId: site?.id, shiftId: meta?.shift_id });
                        return;
                      }
                      if (planLocked) {
                        toast({ title: 'Plan is published', description: 'This weekly plan is locked.' });
                        return;
                      }
                      if (off) {
                        setOffModal({ open: true, guardId: g.id, date: d });
                        return;
                      }
                      setAssignModal({ open: true, guardId: g.id, date: d, siteId: site?.id });
                    }}
                    title="Add off-day"
                  >
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{dayLabels[idx]}</span>
                    <span className="font-semibold truncate">{off ? 'OFF' : (site ? site.name : '—')}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="hidden md:block overflow-x-auto border dark:border-gray-800 rounded-md">
        <table className="min-w-[900px] w-full divide-y divide-gray-200 dark:divide-gray-800">
          <thead className="bg-gray-50 dark:bg-gray-950">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Guard</th>
              {dayLabels.map((lbl, idx) => (
                <th key={idx} className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">{lbl}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-900 bg-white dark:bg-gray-900">
            {data.guards.filter(g => ((g.guard_type || 'permanent') === 'permanent')).map((g) => (
              <tr key={g.id}>
                <td className="px-3 py-2 text-sm font-medium whitespace-nowrap">
                  <label className="inline-flex items-center gap-2">
                    <input className="rounded border-gray-300 dark:border-gray-600 dark:bg-gray-900" type="checkbox" checked={!!selected[g.id]} onChange={() => toggleSel(g.id)} />
                    <span className="inline-flex items-center gap-2">
                      <span>{g.name} {g.employee_id ? <span className="text-xs text-gray-500">({g.employee_id})</span> : null}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200">Permanent</span>
                    </span>
                  </label>
                </td>
                {data.days.map((d) => {
                  const meta = g.meta?.[d];
                  const isShift = meta?.source === 'shift';
                  const off = isShift ? !!g.off?.[d] : !!plannedOff?.[g.id]?.[d];
                  const site = isShift ? (g.sites?.[d] ?? null) : (plannedSites?.[g.id]?.[d] ?? null);
                  return (
                    <td key={d} className="px-3 py-2 text-sm">
                      <button
                        type="button"
                        className={`inline-flex items-center gap-2 px-2 py-1 rounded-md border text-xs ${off ? 'bg-gray-800 text-gray-100 border-gray-700' : site ? 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700' : 'bg-white dark:bg-gray-900 text-gray-500 border-gray-200 dark:border-gray-800'}`}
                        onClick={() => {
                          if (meta?.source === 'shift') {
                            setManualModal({ open: true, guardId: g.id, date: d, siteId: site?.id, shiftId: meta?.shift_id });
                            return;
                          }
                          if (planLocked) {
                            toast({ title: 'Plan is published', description: 'This weekly plan is locked.' });
                            return;
                          }
                          if (off) {
                            setOffModal({ open: true, guardId: g.id, date: d });
                            return;
                          }
                          setAssignModal({ open: true, guardId: g.id, date: d, siteId: site?.id });
                        }}
                        title="Add off-day"
                      >
                        {off ? 'OFF' : (site ? site.name : '—')}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AddOffDayModal
        open={offModal.open}
        onClose={() => setOffModal({ open: false })}
        guardId={offModal.guardId}
        date={offModal.date}
        planLocked={planLocked}
        onStage={(e) => onStageDraftEntry(e)}
        onSaved={() => { setOffModal({ open: false }); }}
      />

      <BulkOffModal
        open={bulkOffOpen}
        onClose={() => setBulkOffOpen(false)}
        guardIds={selectedIds}
        days={data.days}
        planLocked={planLocked}
        onStage={(entries) => entries.forEach((e) => onStageDraftEntry(e))}
        onSaved={() => { setBulkOffOpen(false); }}
      />

      <AssignGuardSiteModal
        open={assignModal.open}
        onClose={() => setAssignModal({ open: false })}
        guardId={assignModal.guardId}
        date={assignModal.date}
        initialSiteId={assignModal.siteId}
        sites={data.sites}
        planLocked={planLocked}
        onStage={(e) => onStageDraftEntry(e)}
        onSaved={() => { setAssignModal({ open: false }); }}
      />

      <ManualRosterShiftModal
        open={manualModal.open}
        onClose={() => setManualModal({ open: false })}
        guardId={manualModal.guardId}
        date={manualModal.date}
        sites={data.sites}
        shiftType={shiftType}
        initialSiteId={manualModal.siteId}
        shiftId={manualModal.shiftId}
        notes={manualModal.notes}
        onSaved={() => { setManualModal({ open: false }); onRefresh(); }}
        onDeleted={() => { setManualModal({ open: false }); onRefresh(); }}
      />
    </div>
  );
}

function AddOffDayModal({ open, onClose, guardId, date, planLocked, onStage, onSaved }: { open: boolean; onClose: () => void; guardId?: number; date?: string; planLocked: boolean; onStage: (e: DraftEntry) => void; onSaved: () => void }) {
  const { data, setData, processing, reset } = useForm<{ guard_id: number | string; date: string; action: 'off' | 'clear' }>({
    guard_id: guardId ?? ('' as any),
    date: date ?? '',
    action: 'off',
  });

  useEffect(() => {
    if (!open) return;
    setData('guard_id', guardId ?? ('' as any));
    setData('date', date ?? '');
    setData('action', 'off');
  }, [open, guardId, date, setData]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (planLocked) return;
    if (!data.guard_id || !data.date) return;
    const gid = Number(data.guard_id);
    if (data.action === 'clear') {
      onStage({ guard_id: gid, date: data.date, entry_type: 'off', delete: true });
    } else {
      onStage({ guard_id: gid, date: data.date, entry_type: 'off' });
    }
    reset();
    onSaved();
  };

  const handleClose = () => {
    if (!processing) onClose();
  };

  return (
    <Modal show={open} onClose={handleClose} maxWidth="sm">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white dark:bg-gray-900 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Off Day</h2>
        <button type="button" onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200">✕</button>
      </div>
      <div className="px-6 py-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <form className="grid grid-cols-1 gap-3" onSubmit={submit}>
          <div>
            <label className="block text-sm font-medium">Date</label>
            <input type="date" className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={data.date} onChange={(e) => setData('date', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium">Action</label>
            <select className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={data.action} onChange={(e) => setData('action', e.target.value as any)}>
              <option value="off">Mark OFF</option>
              <option value="clear">Clear OFF</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={handleClose} className="px-4 py-2 text-sm rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700" disabled={processing}>Cancel</button>
            <button type="submit" disabled={processing || planLocked || !data.guard_id || !data.date} className="px-4 py-2 text-sm rounded-md bg-coin-700 text-white hover:bg-coin-600">Save</button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function BulkOffModal({ open, onClose, guardIds, days, planLocked, onStage, onSaved }: { open: boolean; onClose: () => void; guardIds: number[]; days: DayKey[]; planLocked: boolean; onStage: (entries: DraftEntry[]) => void; onSaved: () => void }) {
  const { data, setData, processing, reset } = useForm<{ start: string; end: string; action: 'off' | 'clear' }>({
    start: days?.[0] ?? '',
    end: days?.[days.length - 1] ?? '',
    action: 'off',
  });

  useEffect(() => {
    if (!open) return;
    setData('start', days?.[0] ?? '');
    setData('end', days?.[days.length - 1] ?? '');
    setData('action', 'off');
  }, [open, days, setData]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (planLocked) return;
    if (!guardIds?.length) return;
    if (!data.start || !data.end) return;

    const rangeDays = (days || []).filter((d) => d >= data.start && d <= data.end);
    const entries: DraftEntry[] = [];
    for (const gid of guardIds) {
      for (const d of rangeDays) {
        if (data.action === 'clear') {
          entries.push({ guard_id: gid, date: d, entry_type: 'off', delete: true });
        } else {
          entries.push({ guard_id: gid, date: d, entry_type: 'off' });
        }
      }
    }
    onStage(entries);
    reset();
    onSaved();
  };

  const handleClose = () => {
    if (!processing) onClose();
  };

  return (
    <Modal show={open} onClose={handleClose} maxWidth="md">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white dark:bg-gray-900 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Bulk Off Day</h2>
        <button type="button" onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200">✕</button>
      </div>
      <div className="px-6 py-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <form className="grid grid-cols-1 gap-3" onSubmit={submit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium">Start</label>
              <input type="date" className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={data.start} onChange={(e) => setData('start', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium">End</label>
              <input type="date" className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={data.end} onChange={(e) => setData('end', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium">Action</label>
            <select className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={data.action} onChange={(e) => setData('action', e.target.value as any)}>
              <option value="off">Mark OFF</option>
              <option value="clear">Clear OFF</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={handleClose} className="px-4 py-2 text-sm rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700" disabled={processing}>Cancel</button>
            <button type="submit" disabled={processing || planLocked || !guardIds?.length || !data.start || !data.end} className="px-4 py-2 text-sm rounded-md bg-coin-700 text-white hover:bg-coin-600">Save</button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function ManualRosterShiftModal({
  open,
  onClose,
  guardId,
  date,
  sites,
  shiftType,
  initialSiteId,
  shiftId,
  notes,
  onSaved,
  onDeleted,
}: {
  open: boolean;
  onClose: () => void;
  guardId?: number;
  date?: string;
  sites: Site[];
  shiftType: ShiftType;
  initialSiteId?: number;
  shiftId?: number;
  notes?: string;
  onSaved: () => void;
  onDeleted: () => void;
}) {
  const { toast } = useToast();
  const { data, setData, post, processing, reset } = useForm<{
    shift_id: number | '';
    guard_id: number | '';
    client_site_id: number | '';
    date: string;
    shift_type: ShiftType;
    start_time: string;
    end_time: string;
    notes?: string;
  }>({
    shift_id: (shiftId ?? '') as any,
    guard_id: (guardId ?? '') as any,
    client_site_id: (initialSiteId ?? '') as any,
    date: date ?? '',
    shift_type: shiftType,
    start_time: shiftType === 'night' ? '18:00' : '06:00',
    end_time: shiftType === 'night' ? '06:00' : '18:00',
    notes: notes ?? '',
  });

  useEffect(() => {
    if (!open) return;
    setData('shift_id', (shiftId ?? '') as any);
    setData('guard_id', (guardId ?? '') as any);
    setData('client_site_id', (initialSiteId ?? '') as any);
    setData('date', date ?? '');
    setData('shift_type', shiftType);
    setData('start_time', shiftType === 'night' ? '18:00' : '06:00');
    setData('end_time', shiftType === 'night' ? '06:00' : '18:00');
    setData('notes', notes ?? '');
  }, [open, guardId, date, initialSiteId, notes, setData, shiftId, shiftType]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.guard_id || !data.client_site_id || !data.date) {
      toast({ title: 'Missing fields', description: 'Select date and site.', variant: 'destructive' });
      return;
    }
    post(route('control-room.roster.manual-shifts.upsert'), {
      preserveScroll: true,
      onSuccess: () => {
        reset();
        onSaved();
      },
    });
  };

  const doDelete = () => {
    if (!shiftId) return;
    if (!confirm('Delete this manual roster shift?')) return;
    router.post(route('control-room.roster.manual-shifts.delete'), { shift_id: shiftId }, {
      preserveScroll: true,
      onSuccess: () => { reset(); onDeleted(); },
      onError: (errs) => { toast({ title: Object.values(errs)[0] || 'Failed to delete', variant: 'destructive' }); },
    });
  };

  const handleClose = () => {
    if (!processing) onClose();
  };

  return (
    <Modal show={open} onClose={handleClose} maxWidth="md">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white dark:bg-gray-900 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Manual Roster Shift</h2>
        <button type="button" onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200">✕</button>
      </div>
      <div className="px-6 py-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <form className="grid grid-cols-1 gap-3" onSubmit={submit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium">Date</label>
              <input type="date" className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={data.date} onChange={(e) => setData('date', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium">Site</label>
              <select className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={data.client_site_id as any} onChange={(e) => setData('client_site_id', e.target.value ? Number(e.target.value) : '')}>
                <option value="">Select a site</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium">Start time</label>
              <input type="time" className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={data.start_time} onChange={(e) => setData('start_time', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium">End time</label>
              <input type="time" className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={data.end_time} onChange={(e) => setData('end_time', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium">Notes (optional)</label>
            <input className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={data.notes || ''} onChange={(e) => setData('notes', e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            {shiftId ? (
              <button type="button" onClick={doDelete} className="px-4 py-2 text-sm rounded-md bg-red-700 text-white hover:bg-red-600" disabled={processing}>Delete</button>
            ) : null}
            <button type="button" onClick={handleClose} className="px-4 py-2 text-sm rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700" disabled={processing}>Cancel</button>
            <button type="submit" disabled={processing || !data.date || !data.client_site_id || !data.guard_id} className="px-4 py-2 text-sm rounded-md bg-coin-700 text-white hover:bg-coin-600">{processing ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function QuickAttendanceConfirmModal({
  open,
  onClose,
  guardId,
  siteId,
  action,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  guardId?: number;
  siteId?: number | null;
  action?: 'present' | 'absent';
  onConfirm: (guardId: number, action: 'present' | 'absent', siteId?: number | null) => void;
}) {
  const handleClose = () => onClose();
  const canConfirm = !!guardId && !!action;

  return (
    <Modal show={open} onClose={handleClose} maxWidth="sm">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white dark:bg-gray-900 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Confirm Attendance</h2>
        <button type="button" onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200">✕</button>
      </div>
      <div className="px-6 py-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 space-y-3">
        <div className="text-sm text-gray-700 dark:text-gray-200">
          {action === 'present' ? 'Mark this guard as present for today?' : 'Mark this guard as absent for today?'}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={handleClose} className="px-4 py-2 text-sm rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">Cancel</button>
          <button
            type="button"
            disabled={!canConfirm}
            onClick={() => {
              if (!guardId || !action) return;
              onConfirm(guardId, action, siteId ?? null);
            }}
            className={`px-4 py-2 text-sm rounded-md text-white ${action === 'absent' ? 'bg-red-700 hover:bg-red-600' : 'bg-emerald-700 hover:bg-emerald-600'} disabled:opacity-60`}
          >
            Confirm
          </button>
        </div>
      </div>
    </Modal>
  );
}

function RelieversTable({ data, onRefresh, shiftType, canManageAttendance, plannedSites, planLocked, onStageDraftEntry }: { data: WeeklyData; onRefresh: () => void; shiftType: ShiftType; canManageAttendance: boolean; plannedSites: Record<number, Record<DayKey, Site | null>>; planLocked: boolean; onStageDraftEntry: (e: DraftEntry) => void }) {
  const dayLabels = useMemo(() => data.days.map((d) => new Date(d).toLocaleDateString(undefined, { weekday: 'short' })), [data.days]);
  const [relModal, setRelModal] = useState<{ open: boolean; guardId?: number; date?: string; siteId?: number }>( { open: false } );
  const [bulkRel, setBulkRel] = useState<{ open: boolean; guardId?: number }>({ open: false });
  const [manualModal, setManualModal] = useState<{ open: boolean; guardId?: number; date?: string; siteId?: number; shiftId?: number }>({ open: false });
  const { toast } = useToast();

  const todayKey = data.today;

  const doQuick = (guardId: number, action: 'present' | 'absent', siteId?: number | null) => {
    if (!canManageAttendance) return;
    if (action === 'absent') {
      if (!confirm('Mark this guard as absent for today?')) return;
      router.post(route('control-room.attendance.mark-absent'), { guard_id: guardId }, {
          preserveScroll: true,
          onSuccess: () => { toast({ title: 'Marked absent' }); onRefresh(); },
          onError: (errs) => toast({ title: Object.values(errs)[0] || 'Failed to mark absent', variant: 'destructive' }),
        });
      return;
    }
    router.post(route('control-room.attendance.mark-present'), { guard_id: guardId, client_site_id: siteId ?? undefined }, {
          preserveScroll: true,
          onSuccess: () => { toast({ title: 'Marked present' }); onRefresh(); },
          onError: (errs) => toast({ title: Object.values(errs)[0] || 'Failed to mark present', variant: 'destructive' }),
        });
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Relievers</h3>
        <div className="text-xs text-gray-500 dark:text-gray-400">Click a day to assign a site</div>
      </div>
      <div className="md:hidden space-y-2">
        {data.relievers.map((r) => (
          <div key={r.id} className="rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 break-words">
                  {r.name} {r.employee_id ? <span className="text-xs text-gray-500">({r.employee_id})</span> : null}
                </div>
                <button type="button" className="mt-2 px-2 py-1 text-xs rounded-md bg-coin-700 text-white hover:bg-coin-600" onClick={() => setBulkRel({ open: true, guardId: r.id })}>Bulk Assign Week</button>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {data.days.map((d, idx) => {
                const meta = r.meta?.[d];
                const isShift = meta?.source === 'shift';
                const site = isShift ? (r.sites?.[d] ?? null) : (plannedSites?.[r.id]?.[d] ?? null);
                const isToday = !!todayKey && d === todayKey;
                const att = r.attendance_today || null;
                return (
                  <button
                    key={d}
                    type="button"
                    className={`flex items-center justify-between gap-2 w-full px-3 py-2 rounded-md border text-sm ${site ? 'bg-coin-700 text-white border-coin-800' : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-800'}`}
                    onClick={() => {
                      if (meta?.source === 'shift') {
                        setManualModal({ open: true, guardId: r.id, date: d, siteId: site?.id, shiftId: meta?.shift_id });
                        return;
                      }
                      if (planLocked) {
                        toast({ title: 'Plan is published', description: 'This weekly plan is locked.' });
                        return;
                      }
                      setRelModal({ open: true, guardId: r.id, date: d, siteId: site?.id });
                    }}
                    title={meta?.source === 'shift' ? 'Edit roster' : 'Assign site'}
                  >
                    <span className={`text-xs font-medium ${site ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>{dayLabels[idx]}</span>
                    <span className="font-semibold truncate">
                      {site ? site.name : 'Assign'}
                      {meta?.source === 'shift' ? <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-black/20 text-white">Manual</span> : null}
                      {isToday && att?.checked_out ? <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-sky-700 text-white">OUT</span> : null}
                      {isToday && !att?.checked_out && att?.checked_in ? <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-700 text-white">IN</span> : null}
                      {isToday && !att?.checked_in && (att?.status === 'present') ? <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-700 text-white">PRESENT</span> : null}
                      {isToday && (att?.status === 'absent') ? <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-red-700 text-white">ABSENT</span> : null}
                    </span>
                  </button>
                );
              })}
            </div>

            {todayKey && canManageAttendance ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className="px-3 py-1.5 rounded-md bg-emerald-700 text-white text-xs" onClick={() => doQuick(r.id, 'present', r.sites?.[todayKey!]?.id ?? null)}>Mark Present</button>
                <button type="button" className="px-3 py-1.5 rounded-md bg-red-700 text-white text-xs" onClick={() => doQuick(r.id, 'absent')}>Mark Absent</button>
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <div className="hidden md:block overflow-x-auto border dark:border-gray-800 rounded-md">
        <table className="min-w-[900px] w-full divide-y divide-gray-200 dark:divide-gray-800">
          <thead className="bg-gray-50 dark:bg-gray-950">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Reliever</th>
              {dayLabels.map((lbl, idx) => (
                <th key={idx} className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">{lbl}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-900 bg-white dark:bg-gray-900">
            {data.relievers.map((r) => (
              <tr key={r.id}>
                <td className="px-3 py-2 text-sm font-medium whitespace-nowrap">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-2">
                    <span>{r.name} {r.employee_id ? <span className="text-xs text-gray-500">({r.employee_id})</span> : null}</span>
                    <button type="button" className="px-2 py-1 text-xs rounded-md bg-coin-700 text-white hover:bg-coin-600" onClick={() => setBulkRel({ open: true, guardId: r.id })}>Bulk Assign Week</button>
                  </div>
                </td>
                {data.days.map((d) => {
                  const meta = r.meta?.[d];
                  const isShift = meta?.source === 'shift';
                  const site = isShift ? (r.sites?.[d] ?? null) : (plannedSites?.[r.id]?.[d] ?? null);
                  const isToday = !!todayKey && d === todayKey;
                  const att = r.attendance_today || null;
                  return (
                    <td key={d} className="px-3 py-2 text-sm">
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          className={`inline-flex items-center gap-2 px-2 py-1 rounded-md border text-xs ${site ? 'bg-coin-700 text-white border-coin-800' : 'bg-white dark:bg-gray-900 text-gray-500 border-gray-200 dark:border-gray-800'}`}
                          onClick={() => {
                            if (meta?.source === 'shift') {
                              setManualModal({ open: true, guardId: r.id, date: d, siteId: site?.id, shiftId: meta?.shift_id });
                              return;
                            }
                            if (planLocked) {
                              toast({ title: 'Plan is published', description: 'This weekly plan is locked.' });
                              return;
                            }
                            setRelModal({ open: true, guardId: r.id, date: d, siteId: site?.id });
                          }}
                          title={meta?.source === 'shift' ? 'Edit roster' : 'Assign site'}
                        >
                          {site ? site.name : 'Assign'}
                          {meta?.source === 'shift' ? <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/20 text-white">M</span> : null}
                          {isToday && att?.checked_out ? <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-sky-700 text-white">OUT</span> : null}
                          {isToday && !att?.checked_out && att?.checked_in ? <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-700 text-white">IN</span> : null}
                          {isToday && !att?.checked_in && (att?.status === 'present') ? <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-700 text-white">PRESENT</span> : null}
                          {isToday && (att?.status === 'absent') ? <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-700 text-white">ABSENT</span> : null}
                        </button>
                        {isToday && canManageAttendance ? (
                          <div className="flex items-center gap-1">
                            <button type="button" className="px-2 py-1 rounded-md bg-emerald-700 text-white text-[10px]" onClick={() => doQuick(r.id, 'present', site?.id ?? null)}>Present</button>
                            <button type="button" className="px-2 py-1 rounded-md bg-red-700 text-white text-[10px]" onClick={() => doQuick(r.id, 'absent')}>Absent</button>
                          </div>
                        ) : null}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AssignReliefModal
        open={relModal.open}
        onClose={() => setRelModal({ open: false })}
        guardId={relModal.guardId}
        date={relModal.date}
        initialSiteId={relModal.siteId}
        sites={data.sites}
        planLocked={planLocked}
        onStage={(entry) => onStageDraftEntry(entry)}
        onSaved={() => { setRelModal({ open: false }); }}
      />

      <BulkReliefModal
        open={bulkRel.open}
        onClose={() => setBulkRel({ open: false })}
        guardId={bulkRel.guardId}
        days={data.days}
        initialMap={bulkRel.guardId ? (plannedSites?.[bulkRel.guardId] || {}) : {}}
        sites={data.sites}
        activeSites={data.active_sites || []}
        planLocked={planLocked}
        onStage={(entries) => entries.forEach((e) => onStageDraftEntry(e))}
        onSaved={() => { setBulkRel({ open: false }); }}
      />

      <ManualRosterShiftModal
        open={manualModal.open}
        onClose={() => setManualModal({ open: false })}
        guardId={manualModal.guardId}
        date={manualModal.date}
        sites={data.sites}
        shiftType={shiftType}
        initialSiteId={manualModal.siteId}
        shiftId={manualModal.shiftId}
        onSaved={() => { setManualModal({ open: false }); onRefresh(); }}
        onDeleted={() => { setManualModal({ open: false }); onRefresh(); }}
      />
    </div>
  );
}

function AssignReliefModal({ open, onClose, guardId, date, initialSiteId, sites, planLocked, onStage, onSaved }: { open: boolean; onClose: () => void; guardId?: number; date?: string; initialSiteId?: number; sites: Site[]; planLocked: boolean; onStage: (e: DraftEntry) => void; onSaved: () => void }) {
  const { data, setData, processing, errors, reset } = useForm<{ guard_id: number | string; client_site_id: number | string; date: string; notes?: string }>(
    {
      guard_id: guardId ?? ('' as any),
      client_site_id: initialSiteId ?? ('' as any),
      date: date ?? '',
      notes: '',
    }
  );

  useEffect(() => {
    if (!open) return;
    setData('guard_id', guardId ?? ('' as any));
    setData('client_site_id', initialSiteId ?? ('' as any));
    setData('date', date ?? '');
  }, [open, guardId, date, initialSiteId, setData]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (planLocked) return;
    if (!data.guard_id || !data.date || !data.client_site_id) return;
    onStage({
      guard_id: Number(data.guard_id),
      date: data.date,
      entry_type: 'site',
      client_site_id: Number(data.client_site_id),
      notes: data.notes || undefined,
    });
    reset();
    onSaved();
  };

  const clearAssignment = () => {
    if (planLocked) return;
    if (!guardId || !date) return;
    onStage({ guard_id: guardId, date, entry_type: 'site', delete: true });
    reset();
    onSaved();
  };

  return (
    <Modal show={open} onClose={onClose} maxWidth="sm">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white dark:bg-gray-900 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Assign Reliever</h2>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200">✕</button>
      </div>
      <div className="px-6 py-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <form className="grid grid-cols-1 gap-3" onSubmit={submit}>
          <div>
            <label className="block text-sm font-medium">Date</label>
            <input type="date" className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={data.date} onChange={(e) => setData('date', e.target.value)} />
            {errors.date && <p className="text-xs text-red-600 mt-1">{errors.date}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Site</label>
            <select className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={data.client_site_id as any} onChange={(e) => setData('client_site_id', Number(e.target.value))}>
              <option value="">Select a site</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            {errors.client_site_id && <p className="text-xs text-red-600 mt-1">{errors.client_site_id}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Notes (optional)</label>
            <input className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={data.notes || ''} onChange={(e) => setData('notes', e.target.value)} />
            {errors.notes && <p className="text-xs text-red-600 mt-1">{errors.notes}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700" disabled={processing}>Cancel</button>
            {initialSiteId ? (
              <button type="button" onClick={clearAssignment} className="px-4 py-2 text-sm rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700" disabled={processing}>Clear</button>
            ) : null}
            <button type="submit" disabled={processing || planLocked || !data.client_site_id || !data.date} className="px-4 py-2 text-sm rounded-md bg-coin-700 text-white hover:bg-coin-600">Save</button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function BulkReliefModal({ open, onClose, guardId, days, initialMap, sites, activeSites, planLocked, onStage, onSaved }: { open: boolean; onClose: () => void; guardId?: number; days: DayKey[]; initialMap: Record<DayKey, Site | null>; sites: Site[]; activeSites: Site[]; planLocked: boolean; onStage: (entries: DraftEntry[]) => void; onSaved: () => void }) {
  const { data, setData, processing, reset } = useForm<{ guard_id: number | string; day_site_map: Record<DayKey, number | ''> }>(
    {
      guard_id: guardId ?? ('' as any),
      day_site_map: days.reduce((acc: any, d) => { acc[d] = initialMap?.[d]?.id || ''; return acc; }, {} as Record<DayKey, number | ''>),
    }
  );
  const [onlyActive, setOnlyActive] = useState(true);

  useEffect(() => {
    if (!open) return;
    setData('guard_id', guardId ?? ('' as any));
    setData('day_site_map', days.reduce((acc: any, d) => { acc[d] = initialMap?.[d]?.id || ''; return acc; }, {} as Record<DayKey, number | ''>));
  }, [open, guardId, days, initialMap, setData]);

  const list = onlyActive ? activeSites : sites;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (planLocked) return;
    if (!guardId) return;
    const entries: DraftEntry[] = days.map((d) => {
      const sid = data.day_site_map?.[d];
      if (!sid) {
        return { guard_id: guardId, date: d, entry_type: 'site', delete: true };
      }
      return { guard_id: guardId, date: d, entry_type: 'site', client_site_id: Number(sid) };
    });
    onStage(entries);
    reset();
    onSaved();
  };

  return (
    <Modal show={open} onClose={onClose} maxWidth="md">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white dark:bg-gray-900 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Bulk Assign Reliever</h2>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200">✕</button>
      </div>
      <div className="px-6 py-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <form className="grid grid-cols-1 gap-3" onSubmit={submit}>
          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={onlyActive} onChange={(e) => setOnlyActive(e.target.checked)} /> <span className="text-sm">Only show active sites this week</span></label>
          {days.map((d) => (
            <div key={d} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
              <div className="text-sm text-gray-600 dark:text-gray-300">{new Date(d).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</div>
              <div className="sm:col-span-2">
                <select className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={data.day_site_map[d] as any} onChange={(e) => setData('day_site_map', { ...data.day_site_map, [d]: e.target.value ? Number(e.target.value) : '' })}>
                  <option value="">—</option>
                  {list.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
                </select>
              </div>
            </div>
          ))}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700" disabled={processing}>Cancel</button>
            <button type="submit" disabled={processing || planLocked || !guardId} className="px-4 py-2 text-sm rounded-md bg-coin-700 text-white hover:bg-coin-600">Save</button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
