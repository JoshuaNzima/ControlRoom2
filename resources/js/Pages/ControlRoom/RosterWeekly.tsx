import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import Modal from '@/Components/Modal';
import useToast from '@/Components/ui/use-toast';
import EmptyState from '@/Components/ui/empty-state';
import ManualRosterEntryModal from '@/Components/Roster/ManualRosterEntryModal';
import WeeklyPlannerHeader from '@/Components/Roster/WeeklyPlannerHeader';
import WeeklyPlannerFilters from '@/Components/Roster/WeeklyPlannerFilters';
import WeeklyRosterSection, {
  WeeklyRosterSectionAction,
  WeeklyRosterSectionCell,
  WeeklyRosterSectionRow,
} from '@/Components/Roster/WeeklyRosterSection';
import AssignGuardSiteModal from '@/Components/Roster/RosterWeekly/AssignGuardSiteModal';
import BulkOffModal from '@/Components/Roster/RosterWeekly/BulkOffModal';
import AddOffDayModal from '@/Components/Roster/RosterWeekly/AddOffDayModal';
import AssignReliefModal from '@/Components/Roster/RosterWeekly/AssignReliefModal';
import BulkReliefModal from '@/Components/Roster/RosterWeekly/BulkReliefModal';
import ManualRosterShiftModal from '@/Components/Roster/RosterWeekly/ManualRosterShiftModal';

type DayKey = string;

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

type Scope = 'permanent' | 'standby' | 'reliever';

function getShiftTimeDefaults(shiftType: ShiftType): { start_time: string; end_time: string } {
  switch (shiftType) {
    case 'night':
      return { start_time: '18:00', end_time: '06:00' };
    case 'morning':
      return { start_time: '06:00', end_time: '14:00' };
    case 'evening':
      return { start_time: '14:00', end_time: '22:00' };
    case 'custom':
      return { start_time: '06:00', end_time: '18:00' };
    case 'day':
    default:
      return { start_time: '06:00', end_time: '18:00' };
  }
}

function getCsrfToken(): string {
  if (typeof document === 'undefined') return '';
  const el = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
  return el?.content || '';
}

function startOfWeekMonday(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
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

function shortDayLabel(day: DayKey) {
  return new Date(day).toLocaleDateString(undefined, { weekday: 'short' });
}

function getAttendanceBadges(attendance?: AttendanceToday | null): string[] {
  if (!attendance) return [];
  if (attendance.checked_out) return ['OUT'];
  if (attendance.checked_in) return ['IN'];
  if (attendance.status === 'present') return ['PRESENT'];
  if (attendance.status === 'absent') return ['ABSENT'];
  return [];
}

function getCellTone(
  scope: Scope,
  off: boolean,
  hasSite: boolean,
  source?: DayMeta['source'],
): 'neutral' | 'soft' | 'success' | 'warning' | 'danger' {
  if (off) return 'danger';
  if (source === 'shift') return 'warning';
  if (hasSite) return scope === 'reliever' ? 'success' : 'soft';
  return 'neutral';
}

function getCellValue(scope: Scope, off: boolean, site?: Site | null): string {
  if (off) return 'OFF';
  if (site?.name) return site.name;
  if (scope !== 'reliever') return '-';
  return scope === 'reliever' ? 'Assign' : '—';
}

function getSectionTitle(scope: Scope): { title: string; description: string; icon: string } {
  switch (scope) {
    case 'standby':
      return {
        title: 'Standby Guards',
        description: 'Tap a day to mark off, assign, or edit a manual shift.',
        icon: 'Shield',
      };
    case 'reliever':
      return {
        title: 'Relievers',
        description: 'Tap a day to assign a site or edit a manual shift.',
        icon: 'Repeat',
      };
    case 'permanent':
    default:
      return {
        title: 'Assigned Guards',
        description: 'Tap a day to mark off, assign, or edit a manual shift.',
        icon: 'Users',
      };
  }
}

export default function RosterWeekly() {
  const { auth, initial_week_start, zones = [], supervisors = [] } = usePage().props as any;
  const { toast } = useToast();

  const [weekStart, setWeekStart] = useState<Date>(() =>
    initial_week_start ? new Date(initial_week_start) : startOfWeekMonday(new Date()),
  );
  const [zoneId, setZoneId] = useState<number | ''>('');
  const [supervisorId, setSupervisorId] = useState<number | ''>('');
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
  const [shiftStartTime, setShiftStartTime] = useState<string>(() => getShiftTimeDefaults('day').start_time);
  const [shiftEndTime, setShiftEndTime] = useState<string>(() => getShiftTimeDefaults('day').end_time);

  const [selectedPermanent, setSelectedPermanent] = useState<Record<number, boolean>>({});
  const [selectedStandby, setSelectedStandby] = useState<Record<number, boolean>>({});
  const [bulkOffScope, setBulkOffScope] = useState<Scope | null>(null);
  const [bulkReliefGuardId, setBulkReliefGuardId] = useState<number | null>(null);

  const [offModal, setOffModal] = useState<{ open: boolean; guardId?: number; date?: string }>({ open: false });
  const [assignModal, setAssignModal] = useState<{ open: boolean; guardId?: number; date?: string; siteId?: number }>(
    { open: false },
  );
  const [manualModal, setManualModal] = useState<{
    open: boolean;
    guardId?: number;
    date?: string;
    siteId?: number;
    shiftId?: number;
  }>({ open: false });
  const [reliefModal, setReliefModal] = useState<{
    open: boolean;
    guardId?: number;
    date?: string;
    siteId?: number;
  }>({ open: false });

  const canManageAttendance = useMemo(() => {
    const can = (auth as any)?.user?.can;
    if (can && can['attendance.manage']) return true;
    const rawRoles = ((auth?.user as any)?.roles ?? []) as (string | { id: number; name: string })[];
    const roles = rawRoles.map((r) => (typeof r === 'string' ? r : r.name));
    const isAdmin = roles.includes('admin') || roles.includes('super_admin');
    return isAdmin || roles.includes('control_room_operator') || roles.includes('operations_officer') || roles.includes('manager');
  }, [auth]);

  const planLocked = useMemo(() => plan?.status === 'published', [plan?.status]);
  const activeFilterCount = useMemo(
    () => [zoneId, supervisorId, shiftType !== 'day' ? shiftType : null].filter(Boolean).length,
    [shiftType, supervisorId, zoneId],
  );
  const selectedSupervisorLabel = useMemo(() => {
    if (!supervisorId) return '';
    return supervisors.find((supervisor: any) => supervisor.id === supervisorId)?.name || '';
  }, [supervisors, supervisorId]);

  useEffect(() => {
    const defaults = getShiftTimeDefaults(shiftType);
    setShiftStartTime(defaults.start_time);
    setShiftEndTime(defaults.end_time);
  }, [shiftType]);

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

  const load = useCallback(
    async (overrides?: { weekStart?: Date; zoneId?: number | ''; supervisorId?: number | '' }) => {
      setLoading(true);
      try {
        const ws = overrides?.weekStart ?? weekStart;
        const zid = overrides?.zoneId ?? zoneId;
        const sid = overrides?.supervisorId ?? supervisorId;

        const params: Record<string, string | number> = { start: formatYmd(ws), shift_type: shiftType };
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
    },
    [loadPlan, shiftType, supervisorId, toast, weekStart, zoneId],
  );

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
        start_time: shiftStartTime,
        end_time: shiftEndTime,
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
  }, [draftEdits, load, shiftEndTime, shiftStartTime, shiftType, supervisorId, toast, weekStart]);

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

  const lockToast = useCallback(() => {
    toast({ title: 'Plan is published', description: 'This weekly plan is locked.' });
  }, [toast]);

  const buildGuardRows = useCallback(
    (scope: 'permanent' | 'standby', rowsSource: GuardWeekly[]) => {
      return rowsSource
        .filter((g) => (g.guard_type || 'permanent') === scope)
        .map<WeeklyRosterSectionRow>((guard) => {
          const selected = scope === 'permanent' ? !!selectedPermanent[guard.id] : !!selectedStandby[guard.id];
          const onSelectToggle =
            scope === 'permanent'
              ? () => setSelectedPermanent((prev) => ({ ...prev, [guard.id]: !prev[guard.id] }))
              : () => setSelectedStandby((prev) => ({ ...prev, [guard.id]: !prev[guard.id] }));

          return {
            id: guard.id,
            name: guard.name,
            employeeId: guard.employee_id,
            typeLabel: scope === 'permanent' ? 'Permanent' : 'Standby',
            selected,
            onSelectToggle,
            cells: safeDays.map<WeeklyRosterSectionCell>((day) => {
              const meta = guard.meta?.[day];
              const isShift = meta?.source === 'shift';
              const off = isShift ? !!guard.off?.[day] : !!planned.off?.[guard.id]?.[day];
              const site = isShift ? (guard.sites?.[day] ?? null) : (planned.sites?.[guard.id]?.[day] ?? null);
              const badges = [
                ...(meta?.source === 'shift' ? ['Manual'] : []),
                ...(data?.today && day === data.today ? getAttendanceBadges(guard.attendance_today) : []),
              ];

              return {
                label: shortDayLabel(day),
                value: getCellValue(scope, off, site),
                tone: getCellTone(scope, off, !!site, meta?.source),
                badges,
                onClick: () => {
                  if (off) {
                    if (planLocked) {
                      lockToast();
                      return;
                    }
                    setOffModal({ open: true, guardId: guard.id, date: day });
                    return;
                  }
                  if (meta?.source === 'shift') {
                    setManualModal({
                      open: true,
                      guardId: guard.id,
                      date: day,
                      siteId: site?.id,
                      shiftId: meta?.shift_id,
                    });
                    return;
                  }
                  if (planLocked) {
                    lockToast();
                    return;
                  }
                  setAssignModal({ open: true, guardId: guard.id, date: day, siteId: site?.id });
                },
              };
            }),
          };
        });
    },
    [
      data?.today,
      lockToast,
      planned.off,
      planned.sites,
      planLocked,
      safeDays,
      selectedPermanent,
      selectedStandby,
      setAssignModal,
      setManualModal,
      setOffModal,
      setSelectedPermanent,
      setSelectedStandby,
    ],
  );

  const permanentRows = useMemo(() => buildGuardRows('permanent', safeGuards), [buildGuardRows, safeGuards]);
  const standbyRows = useMemo(() => buildGuardRows('standby', safeGuards), [buildGuardRows, safeGuards]);

  const relieverRows = useMemo(() => {
    return safeRelievers.map((reliever) => {
      return {
        id: reliever.id,
        name: reliever.name,
        employeeId: reliever.employee_id,
        typeLabel: 'Reliever',
        actions: [
          {
            label: 'Bulk week',
            onClick: () => setBulkReliefGuardId(reliever.id),
          },
        ],
        cells: safeDays.map((day) => {
          const meta = reliever.meta?.[day];
          const isShift = meta?.source === 'shift';
          const site = isShift ? (reliever.sites?.[day] ?? null) : (planned.sites?.[reliever.id]?.[day] ?? null);
          const badges = [
            ...(meta?.source === 'rotation' ? ['Rotation'] : []),
            ...(meta?.source === 'shift' ? ['Manual'] : []),
            ...(data?.today && day === data.today ? getAttendanceBadges(reliever.attendance_today) : []),
          ];

          return {
            label: shortDayLabel(day),
            value: getCellValue('reliever', false, site),
            tone: getCellTone('reliever', false, !!site, meta?.source),
            badges,
            onClick: () => {
              if (meta?.source === 'shift') {
                setManualModal({
                  open: true,
                  guardId: reliever.id,
                  date: day,
                  siteId: site?.id,
                  shiftId: meta?.shift_id,
                });
                return;
              }
              if (planLocked) {
                lockToast();
                return;
              }
              setReliefModal({ open: true, guardId: reliever.id, date: day, siteId: site?.id });
            },
          };
        }),
      };
    });
  }, [data?.today, lockToast, planned.sites, planLocked, safeDays, safeRelievers]);

  const permanentSelectedIds = useMemo(
    () => Object.entries(selectedPermanent).filter(([, v]) => v).map(([id]) => Number(id)),
    [selectedPermanent],
  );
  const standbySelectedIds = useMemo(
    () => Object.entries(selectedStandby).filter(([, v]) => v).map(([id]) => Number(id)),
    [selectedStandby],
  );
  const bulkOffSelectedIds = bulkOffScope === 'standby' ? standbySelectedIds : permanentSelectedIds;

  const sectionBulkAction = (scope: Scope): WeeklyRosterSectionAction | undefined => {
    const count = scope === 'standby' ? standbySelectedIds.length : permanentSelectedIds.length;
    return {
      label: `Bulk off-day${count ? ` (${count})` : ''}`,
      onClick: () => setBulkOffScope(scope),
      disabled: count === 0,
    };
  };

  const hasRows = permanentRows.length > 0 || standbyRows.length > 0 || relieverRows.length > 0;

  return (
    <AuthenticatedLayout header="Weekly Planner">
      <Head title="Weekly Planner" />

      <div className="px-4 py-6 space-y-4 sm:px-6 lg:px-8">
        <WeeklyPlannerHeader
          weekStart={formatYmd(weekStart)}
          assignedGuards={data?.guards?.length || 0}
          relievers={data?.relievers?.length || 0}
          planStatus={plan?.status}
          planLocked={planLocked}
          draftCount={Object.keys(draftEdits).length}
          savingDraft={savingDraft}
          publishing={publishing}
          onSaveDraft={saveDraft}
          onPublish={publishPlan}
        />

        <WeeklyPlannerFilters
          weekStart={formatYmd(weekStart)}
          zoneId={zoneId}
          supervisorId={supervisorId}
          shiftType={shiftType}
          shiftStartTime={shiftStartTime}
          shiftEndTime={shiftEndTime}
          filtersOpen={filtersOpen}
          activeFilterCount={activeFilterCount}
          zones={zones as any}
          supervisors={supervisors as any}
          planLocked={planLocked}
          selectedSupervisorLabel={selectedSupervisorLabel}
          onWeekStartChange={(value) => setWeekStart(startOfWeekMonday(new Date(value)))}
          onZoneChange={(value) => setZoneId(value)}
          onSupervisorChange={(value) => setSupervisorId(value)}
          onShiftTypeChange={(value) => setShiftType(value)}
          onShiftStartTimeChange={setShiftStartTime}
          onShiftEndTimeChange={setShiftEndTime}
          onToggleFilters={() => setFiltersOpen((prev) => !prev)}
          onApply={() => load({})}
          onReset={() => {
            setZoneId('');
            setSupervisorId('');
            setShiftType('day');
            const defaults = getShiftTimeDefaults('day');
            setShiftStartTime(defaults.start_time);
            setShiftEndTime(defaults.end_time);
            load({ zoneId: '', supervisorId: '' });
          }}
        />

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setManualEntryOpen(true)}
            className="inline-flex items-center rounded-md bg-coin-700 px-3 py-2 text-sm font-medium text-white hover:bg-coin-600"
          >
            Manual entry
          </button>
          {selectedSupervisorLabel ? (
            <span className={`rounded-md px-2.5 py-1 text-xs font-medium ${planLocked ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'}`}>
              {planLocked ? 'Published' : 'Draft mode'}
            </span>
          ) : null}
        </div>

        {loading ? (
          <EmptyState title="Loading roster" description="Fetching weekly roster data..." size="sm" contentClassName="py-2" />
        ) : null}

        {data && hasRows && (
          <div className="space-y-5">
            {permanentRows.length ? (
              <WeeklyRosterSection
                title={getSectionTitle('permanent').title}
                description={getSectionTitle('permanent').description}
                icon={getSectionTitle('permanent').icon}
                rows={permanentRows}
                bulkAction={sectionBulkAction('permanent')}
              />
            ) : null}

            {standbyRows.length ? (
              <WeeklyRosterSection
                title={getSectionTitle('standby').title}
                description={getSectionTitle('standby').description}
                icon={getSectionTitle('standby').icon}
                rows={standbyRows}
                bulkAction={sectionBulkAction('standby')}
              />
            ) : null}

            {relieverRows.length ? (
              <WeeklyRosterSection
                title={getSectionTitle('reliever').title}
                description={getSectionTitle('reliever').description}
                icon={getSectionTitle('reliever').icon}
                rows={relieverRows}
              />
            ) : null}
          </div>
        )}

        {data && !hasRows && !loading ? (
          <EmptyState
            title="No roster data"
            description="No guards or relievers matched the current filters."
            size="sm"
            contentClassName="py-4"
          />
        ) : null}

        <ManualRosterEntryModal
          open={manualEntryOpen}
          onClose={() => setManualEntryOpen(false)}
          guards={safeGuards}
          sites={safeSites}
          onSaved={() => {
            setManualEntryOpen(false);
            load({});
          }}
        />
      </div>

      <AddOffDayModal
        open={offModal.open}
        onClose={() => setOffModal({ open: false })}
        guardId={offModal.guardId}
        date={offModal.date}
        planLocked={planLocked}
        onStage={stageDraftEntry}
        onSaved={() => setOffModal({ open: false })}
      />

      <BulkOffModal
        open={bulkOffScope !== null}
        onClose={() => setBulkOffScope(null)}
        guardIds={bulkOffSelectedIds}
        days={safeDays}
        planLocked={planLocked}
        onStage={(entries) => entries.forEach((entry) => stageDraftEntry(entry))}
        onSaved={() => setBulkOffScope(null)}
      />

      <AssignGuardSiteModal
        open={assignModal.open}
        onClose={() => setAssignModal({ open: false })}
        guardId={assignModal.guardId}
        date={assignModal.date}
        initialSiteId={assignModal.siteId}
        sites={safeSites}
        planLocked={planLocked}
        onStage={stageDraftEntry}
        onSaved={() => setAssignModal({ open: false })}
      />

      <ManualRosterShiftModal
        open={manualModal.open}
        onClose={() => setManualModal({ open: false })}
        guardId={manualModal.guardId}
        date={manualModal.date}
        sites={safeSites}
        shiftType={shiftType}
        initialSiteId={manualModal.siteId}
        shiftId={manualModal.shiftId}
        onSaved={() => {
          setManualModal({ open: false });
          load({});
        }}
        onDeleted={() => {
          setManualModal({ open: false });
          load({});
        }}
      />

      <AssignReliefModal
        open={reliefModal.open}
        onClose={() => setReliefModal({ open: false })}
        guardId={reliefModal.guardId}
        date={reliefModal.date}
        initialSiteId={reliefModal.siteId}
        sites={safeSites}
        planLocked={planLocked}
        onStage={stageDraftEntry}
        onSaved={() => setReliefModal({ open: false })}
      />

      <BulkReliefModal
        open={bulkReliefGuardId !== null}
        onClose={() => setBulkReliefGuardId(null)}
        guardId={bulkReliefGuardId ?? undefined}
        days={safeDays}
        initialMap={bulkReliefGuardId ? (planned.sites?.[bulkReliefGuardId] || {}) : {}}
        sites={safeSites}
        activeSites={data?.active_sites || []}
        planLocked={planLocked}
        onStage={(entries) => entries.forEach((entry) => stageDraftEntry(entry))}
        onSaved={() => setBulkReliefGuardId(null)}
      />
    </AuthenticatedLayout>
  );
}
