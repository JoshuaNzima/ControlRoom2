import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import ControlRoomLayout from '@/Layouts/ControlRoomLayout';
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
import QuickAttendanceConfirmModal from '@/Components/Roster/RosterWeekly/QuickAttendanceConfirmModal';

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
  const [attModal, setAttModal] = useState<{
    open: boolean;
    guardId?: number;
    siteId?: number | null;
    action?: 'present' | 'absent';
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

  const doQuick = useCallback(
    (guardId: number, action: 'present' | 'absent', siteId?: number | null) => {
      if (!canManageAttendance) return;
      if (action === 'absent') {
        if (!confirm('Mark this guard as absent for today?')) return;
        router.post(route('control-room.attendance.mark-absent'), { guard_id: guardId }, {
          preserveScroll: true,
          onSuccess: () => {
            toast({ title: 'Marked absent' });
            load({});
          },
          onError: (errs) => toast({ title: Object.values(errs)[0] || 'Failed to mark absent', variant: 'destructive' }),
        });
        return;
      }
      router.post(route('control-room.attendance.mark-present'), { guard_id: guardId, client_site_id: siteId ?? undefined }, {
        preserveScroll: true,
        onSuccess: () => {
          toast({ title: 'Marked present' });
          load({});
        },
        onError: (errs) => toast({ title: Object.values(errs)[0] || 'Failed to mark present', variant: 'destructive' }),
      });
    },
    [canManageAttendance, load, toast],
  );

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
    return safeRelievers.map<WeeklyRosterSectionRow>((reliever) => ({
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
      cells: safeDays.map<WeeklyRosterSectionCell>((day) => {
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
    }));
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
    <ControlRoomLayout title="Weekly Planner">
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
            className="rounded-md bg-coin-700 px-3 py-2 text-sm font-medium text-white hover:bg-coin-600"
          >
            Manual entry
          </button>
          {selectedSupervisorLabel ? (
            <span className={`rounded-full px-3 py-2 text-xs font-semibold ${planLocked ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'}`}>
              {planLocked ? 'Published & locked' : 'Draft mode'}
            </span>
          ) : null}
        </div>

        {loading && (
          <EmptyState title="Loading roster" description="Fetching weekly roster data…" size="sm" contentClassName="py-2" />
        )}

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
    </ControlRoomLayout>
  );
}

function AssignGuardSiteModal({
  open,
  onClose,
  guardId,
  date,
  initialSiteId,
  sites,
  planLocked,
  onStage,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  guardId?: number;
  date?: string;
  initialSiteId?: number;
  sites: Site[];
  planLocked: boolean;
  onStage: (e: DraftEntry) => void;
  onSaved: () => void;
}) {
  const { data, setData, processing, reset } = useForm<{ guard_id: number | string; client_site_id: number | string; date: string }>({
    guard_id: guardId ?? ('' as any),
    client_site_id: initialSiteId ?? ('' as any),
    date: date ?? '',
  });

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

  return (
    <Modal show={open} onClose={() => !processing && onClose()} maxWidth="sm">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Assign Site</h2>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          ✕
        </button>
      </div>
      <div className="bg-white px-6 py-4 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
        <form className="grid grid-cols-1 gap-3" onSubmit={submit}>
          <div>
            <label className="block text-sm font-medium">Date</label>
            <input
              type="date"
              className="w-full rounded-md border p-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              value={data.date}
              onChange={(e) => setData('date', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Site</label>
            <select
              className="w-full rounded-md border p-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              value={data.client_site_id as any}
              onChange={(e) => setData('client_site_id', e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">Select a site</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md bg-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
              disabled={processing}
            >
              Cancel
            </button>
            {initialSiteId ? (
              <button
                type="button"
                onClick={clearOverride}
                className="rounded-md bg-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
                disabled={processing || planLocked}
              >
                Clear
              </button>
            ) : null}
            <button
              type="submit"
              disabled={processing || planLocked || !data.client_site_id || !data.date}
              className="rounded-md bg-coin-700 px-4 py-2 text-sm text-white hover:bg-coin-600"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function AssignReliefModal({
  open,
  onClose,
  guardId,
  date,
  initialSiteId,
  sites,
  planLocked,
  onStage,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  guardId?: number;
  date?: string;
  initialSiteId?: number;
  sites: Site[];
  planLocked: boolean;
  onStage: (e: DraftEntry) => void;
  onSaved: () => void;
}) {
  const { data, setData, processing, reset } = useForm<{ guard_id: number | string; client_site_id: number | string; date: string; notes?: string }>({
    guard_id: guardId ?? ('' as any),
    client_site_id: initialSiteId ?? ('' as any),
    date: date ?? '',
    notes: '',
  });

  useEffect(() => {
    if (!open) return;
    setData('guard_id', guardId ?? ('' as any));
    setData('client_site_id', initialSiteId ?? ('' as any));
    setData('date', date ?? '');
    setData('notes', '');
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
    <Modal show={open} onClose={() => !processing && onClose()} maxWidth="sm">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Assign Reliever</h2>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          ✕
        </button>
      </div>
      <div className="bg-white px-6 py-4 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
        <form className="grid grid-cols-1 gap-3" onSubmit={submit}>
          <div>
            <label className="block text-sm font-medium">Date</label>
            <input
              type="date"
              className="w-full rounded-md border p-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              value={data.date}
              onChange={(e) => setData('date', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Site</label>
            <select
              className="w-full rounded-md border p-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              value={data.client_site_id as any}
              onChange={(e) => setData('client_site_id', e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">Select a site</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Notes</label>
            <input
              type="text"
              className="w-full rounded-md border p-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              value={data.notes || ''}
              onChange={(e) => setData('notes', e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md bg-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
              disabled={processing}
            >
              Cancel
            </button>
            {initialSiteId ? (
              <button
                type="button"
                onClick={clearAssignment}
                className="rounded-md bg-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
                disabled={processing}
              >
                Clear
              </button>
            ) : null}
            <button
              type="submit"
              disabled={processing || planLocked || !data.client_site_id || !data.date}
              className="rounded-md bg-coin-700 px-4 py-2 text-sm text-white hover:bg-coin-600"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function AddOffDayModal({
  open,
  onClose,
  guardId,
  date,
  planLocked,
  onStage,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  guardId?: number;
  date?: string;
  planLocked: boolean;
  onStage: (e: DraftEntry) => void;
  onSaved: () => void;
}) {
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

  return (
    <Modal show={open} onClose={() => !processing && onClose()} maxWidth="sm">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Off Day</h2>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          ✕
        </button>
      </div>
      <div className="bg-white px-6 py-4 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
        <form className="grid grid-cols-1 gap-3" onSubmit={submit}>
          <div>
            <label className="block text-sm font-medium">Date</label>
            <input
              type="date"
              className="w-full rounded-md border p-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              value={data.date}
              onChange={(e) => setData('date', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Action</label>
            <select
              className="w-full rounded-md border p-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              value={data.action}
              onChange={(e) => setData('action', e.target.value as 'off' | 'clear')}
            >
              <option value="off">Mark OFF</option>
              <option value="clear">Clear OFF</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md bg-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
              disabled={processing}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={processing || planLocked || !data.guard_id || !data.date}
              className="rounded-md bg-coin-700 px-4 py-2 text-sm text-white hover:bg-coin-600"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function BulkOffModal({
  open,
  onClose,
  guardIds,
  days,
  planLocked,
  onStage,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  guardIds: number[];
  days: DayKey[];
  planLocked: boolean;
  onStage: (entries: DraftEntry[]) => void;
  onSaved: () => void;
}) {
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
  }, [days, open, setData]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (planLocked) return;
    if (!guardIds?.length) return;
    if (!data.start || !data.end) return;

    const rangeDays = (days || []).filter((d) => d >= data.start && d <= data.end);
    const entries: DraftEntry[] = [];
    for (const gid of guardIds) {
      for (const d of rangeDays) {
        entries.push(
          data.action === 'clear'
            ? { guard_id: gid, date: d, entry_type: 'off', delete: true }
            : { guard_id: gid, date: d, entry_type: 'off' },
        );
      }
    }
    onStage(entries);
    reset();
    onSaved();
  };

  return (
    <Modal show={open} onClose={() => !processing && onClose()} maxWidth="md">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Bulk Off Day</h2>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          ✕
        </button>
      </div>
      <div className="bg-white px-6 py-4 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
        <form className="grid grid-cols-1 gap-3" onSubmit={submit}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium">Start</label>
              <input
                type="date"
                className="w-full rounded-md border p-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                value={data.start}
                onChange={(e) => setData('start', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">End</label>
              <input
                type="date"
                className="w-full rounded-md border p-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                value={data.end}
                onChange={(e) => setData('end', e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium">Action</label>
            <select
              className="w-full rounded-md border p-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              value={data.action}
              onChange={(e) => setData('action', e.target.value as 'off' | 'clear')}
            >
              <option value="off">Mark OFF</option>
              <option value="clear">Clear OFF</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md bg-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
              disabled={processing}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={processing || planLocked || !guardIds?.length || !data.start || !data.end}
              className="rounded-md bg-coin-700 px-4 py-2 text-sm text-white hover:bg-coin-600"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function BulkReliefModal({
  open,
  onClose,
  guardId,
  days,
  initialMap,
  sites,
  activeSites,
  planLocked,
  onStage,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  guardId?: number;
  days: DayKey[];
  initialMap: Record<DayKey, Site | null>;
  sites: Site[];
  activeSites: Site[];
  planLocked: boolean;
  onStage: (entries: DraftEntry[]) => void;
  onSaved: () => void;
}) {
  const { data, setData, processing, reset } = useForm<{ guard_id: number | string; day_site_map: Record<DayKey, number | ''> }>({
    guard_id: guardId ?? ('' as any),
    day_site_map: days.reduce((acc, d) => {
      acc[d] = initialMap?.[d]?.id || '';
      return acc;
    }, {} as Record<DayKey, number | ''>),
  });
  const [onlyActive, setOnlyActive] = useState(true);

  useEffect(() => {
    if (!open) return;
    setData('guard_id', guardId ?? ('' as any));
    setData(
      'day_site_map',
      days.reduce((acc, d) => {
        acc[d] = initialMap?.[d]?.id || '';
        return acc;
      }, {} as Record<DayKey, number | ''>),
    );
    setOnlyActive(true);
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
    <Modal show={open} onClose={() => !processing && onClose()} maxWidth="md">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Bulk Assign Reliever</h2>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          ✕
        </button>
      </div>
      <div className="bg-white px-6 py-4 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
        <form className="grid grid-cols-1 gap-3" onSubmit={submit}>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={onlyActive} onChange={(e) => setOnlyActive(e.target.checked)} />
            <span className="text-sm">Only show active sites this week</span>
          </label>

          {days.map((d) => (
            <div key={d} className="grid grid-cols-1 items-center gap-2 sm:grid-cols-3">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                {new Date(d).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
              </div>
              <div className="sm:col-span-2">
                <select
                  className="w-full rounded-md border p-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  value={data.day_site_map[d] as any}
                  onChange={(e) =>
                    setData('day_site_map', { ...data.day_site_map, [d]: e.target.value ? Number(e.target.value) : '' })
                  }
                >
                  <option value="">—</option>
                  {list.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md bg-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
              disabled={processing}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={processing || planLocked || !guardId}
              className="rounded-md bg-coin-700 px-4 py-2 text-sm text-white hover:bg-coin-600"
            >
              Save
            </button>
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
      onSuccess: () => {
        reset();
        onDeleted();
      },
      onError: (errs) => {
        toast({ title: Object.values(errs)[0] || 'Failed to delete', variant: 'destructive' });
      },
    });
  };

  return (
    <Modal show={open} onClose={() => !processing && onClose()} maxWidth="md">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Manual Roster Shift</h2>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          ✕
        </button>
      </div>
      <div className="bg-white px-6 py-4 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
        <form className="grid grid-cols-1 gap-3" onSubmit={submit}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium">Date</label>
              <input
                type="date"
                className="w-full rounded-md border p-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                value={data.date}
                onChange={(e) => setData('date', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Site</label>
              <select
                className="w-full rounded-md border p-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                value={data.client_site_id as any}
                onChange={(e) => setData('client_site_id', e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">Select a site</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium">Start time</label>
              <input
                type="time"
                className="w-full rounded-md border p-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                value={data.start_time}
                onChange={(e) => setData('start_time', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">End time</label>
              <input
                type="time"
                className="w-full rounded-md border p-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                value={data.end_time}
                onChange={(e) => setData('end_time', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Notes</label>
            <input
              type="text"
              className="w-full rounded-md border p-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              value={data.notes || ''}
              onChange={(e) => setData('notes', e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            {shiftId ? (
              <button
                type="button"
                onClick={doDelete}
                className="rounded-md bg-red-700 px-4 py-2 text-sm text-white hover:bg-red-600"
                disabled={processing}
