import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import ControlRoomLayout from '@/Layouts/ControlRoomLayout';
import Modal from '@/Components/Modal';
import ManualRosterEntryModal from '@/Components/Roster/ManualRosterEntryModal';
import EmptyState from '@/Components/ui/empty-state';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card } from '@/Components/ui/card';
import IconMapper from '@/Components/IconMapper';

type RosterGuard = { id: number; name: string; employee_id?: string | null };
type Site = { id: number; name: string };
type ShiftTemplate = {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
  status?: string | null;
  required_guards?: number | null;
};

type RosterEvent = {
  entity: 'holiday' | 'off_day';
  entity_id: number;
  date: string;
  title: string;
  type: 'holiday' | 'off_day';
  color: 'red' | 'indigo';
  meta?: {
    guard_id?: number;
    start_date?: string;
    end_date?: string | null;
    reason?: string | null;
  };
};

function formatYmd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function startOfMonth(date: Date): Date {
  const next = new Date(date);
  next.setDate(1);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfMonth(date: Date): Date {
  const next = new Date(date);
  next.setMonth(next.getMonth() + 1);
  next.setDate(0);
  next.setHours(23, 59, 59, 999);
  return next;
}

function buildCalendarRange(date: Date) {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  const gridStart = new Date(start);
  gridStart.setDate(start.getDate() - start.getDay());
  const gridEnd = new Date(end);
  gridEnd.setDate(end.getDate() + (6 - end.getDay()));

  const dayCount = Math.round((gridEnd.getTime() - gridStart.getTime()) / 86400000) + 1;
  if (dayCount < 42) {
    gridEnd.setDate(gridEnd.getDate() + (42 - dayCount));
  }

  return { gridStart, gridEnd };
}

function toLocalMonthStart(ym: string | undefined): Date {
  if (!ym) {
    const now = new Date();
    now.setDate(1);
    return now;
  }

  const parsed = new Date(ym);
  if (Number.isNaN(parsed.getTime())) {
    const now = new Date();
    now.setDate(1);
    return now;
  }

  parsed.setDate(1);
  parsed.setHours(0, 0, 0, 0);
  return parsed;
}

export default function Roster() {
  const { auth, guards = [], sites = [], shifts = [], initial_month } = usePage().props as any;
  const [month, setMonth] = useState<Date>(() => toLocalMonthStart(initial_month));
  const [events, setEvents] = useState<RosterEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dayEventsOpen, setDayEventsOpen] = useState(false);
  const [addOffDayOpen, setAddOffDayOpen] = useState(false);
  const [editOffDayOpen, setEditOffDayOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<RosterEvent | null>(null);
  const [manualEntryOpen, setManualEntryOpen] = useState(false);

  const { gridStart, gridEnd } = useMemo(() => buildCalendarRange(month), [month]);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const url = route('control-room.roster.events', {
        start: formatYmd(gridStart),
        end: formatYmd(gridEnd),
      });

      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      if (!response.ok) {
        setEvents([]);
        return;
      }

      const json = await response.json();
      setEvents(Array.isArray(json.events) ? json.events : []);
    } finally {
      setLoading(false);
    }
  }, [gridStart, gridEnd]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const days = useMemo(() => {
    const items: Date[] = [];
    const current = new Date(gridStart);
    while (current <= gridEnd) {
      items.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return items;
  }, [gridStart, gridEnd]);

  const monthLabel = month.toLocaleString(undefined, { month: 'long', year: 'numeric' });

  const eventsForDay = useCallback(
    (date: Date) => events.filter((event) => event.date === formatYmd(date)),
    [events]
  );

  const stats = useMemo(
    () => ({
      guards: guards.length,
      sites: sites.length,
      shifts: shifts.length,
      offDays: events.filter((event) => event.type === 'off_day').length,
      holidays: events.filter((event) => event.type === 'holiday').length,
    }),
    [events, guards.length, shifts.length, sites.length]
  );

  const openDayEvents = (date: Date) => {
    setSelectedDate(date);
    setDayEventsOpen(true);
  };

  const openOffDayEditor = (event: RosterEvent) => {
    setSelectedEvent(event);
    setEditOffDayOpen(true);
  };

  return (
    <ControlRoomLayout title="Roster Management" user={auth?.user as any}>
      <Head title="Roster Management" />
      <div className="space-y-4">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-coin-100 text-coin-800 shadow-[6px_6px_0_0_rgba(0,0,0,0.12)] dark:bg-coin-900/30 dark:text-coin-200">
                <IconMapper name="CalendarDays" size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-gray-950 dark:text-white">
                  Roster Management
                </h1>
                <p className="mt-1 max-w-2xl text-sm text-gray-600 dark:text-gray-400">
                  One place for monthly off-days, quick roster entries, and the weekly planner.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.visit(route('control-room.roster.weekly'))}
                className="bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
              >
                <IconMapper name="CalendarDays" size={16} className="mr-2" />
                Weekly planner
              </Button>
              <Button
                type="button"
                onClick={() => setAddOffDayOpen(true)}
                className="bg-coin-700 text-white hover:bg-coin-600"
              >
                <IconMapper name="Plus" size={16} className="mr-2" />
                Off day
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setManualEntryOpen(true)}
                className="bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
              >
                <IconMapper name="Zap" size={16} className="mr-2" />
                Quick entry
              </Button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatCard icon="Users" label="Guards" value={stats.guards} />
          <StatCard icon="MapPin" label="Sites" value={stats.sites} />
          <StatCard icon="Clock" label="Templates" value={stats.shifts} />
          <StatCard icon="CalendarOff" label="Off Days" value={stats.offDays} />
          <StatCard icon="AlertTriangle" label="Holidays" value={stats.holidays} />
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]">
          <Card className="border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            <div className="border-b border-gray-200 px-4 py-4 dark:border-gray-800">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-950 dark:text-white">Monthly roster calendar</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Click a day to review off-days and holidays.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
                    className="border-gray-200 bg-white text-gray-900 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:hover:bg-gray-800"
                  >
                    <IconMapper name="ChevronLeft" size={16} />
                  </Button>
                  <div className="min-w-40 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-center text-sm font-semibold text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100">
                    {monthLabel}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
                    className="border-gray-200 bg-white text-gray-900 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:hover:bg-gray-800"
                  >
                    <IconMapper name="ChevronRight" size={16} />
                  </Button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                <LegendPill color="bg-red-600" label="Holiday" />
                <LegendPill color="bg-coin-700" label="Off day" />
                {loading && (
                  <span className="inline-flex items-center gap-2">
                    <IconMapper name="Loader2" size={14} className="animate-spin" />
                    Loading calendar
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50 text-center text-xs font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:bg-gray-950/40 dark:text-gray-400">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="px-1 py-3">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {days.map((day) => {
                const inMonth = day.getMonth() === month.getMonth();
                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                const isToday = formatYmd(day) === formatYmd(new Date());
                const dayEvents = eventsForDay(day);

                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => openDayEvents(day)}
                    className={`min-h-24 border-b border-r border-gray-200 p-2 text-left transition-colors dark:border-gray-800 ${
                      inMonth
                        ? isWeekend
                          ? 'bg-coin-50/50 hover:bg-coin-50 dark:bg-coin-950/10 dark:hover:bg-coin-950/20'
                          : 'bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800/60'
                        : 'bg-gray-50 text-gray-400 hover:bg-gray-100 dark:bg-gray-950 dark:text-gray-700 dark:hover:bg-gray-900'
                    } ${isToday ? 'ring-2 ring-inset ring-coin-600' : ''}`}
                  >
                    <div className="mb-1 flex items-center justify-between text-xs font-semibold">
                      <span>{day.getDate()}</span>
                      {isToday && <span className="rounded-full bg-coin-700 px-1.5 py-0.5 text-[10px] text-white">Today</span>}
                    </div>

                    <div className="space-y-1">
                      {dayEvents.slice(0, 2).map((event) => (
                        <span
                          key={`${event.entity}-${event.entity_id}-${event.date}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (event.type === 'off_day') {
                              openOffDayEditor(event);
                            }
                          }}
                          className={`block truncate rounded px-2 py-1 text-[11px] text-white ${
                            event.color === 'red' ? 'bg-red-600' : 'bg-coin-700'
                          }`}
                        >
                          {event.title}
                        </span>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                          +{dayEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          <div className="space-y-4">
            <Card className="border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold text-gray-950 dark:text-white">Weekly planner</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Build the weekly roster with draft and publish flow.</p>
                </div>
                <Button
                  type="button"
                  onClick={() => router.visit(route('control-room.roster.weekly'))}
                  className="bg-coin-700 text-white hover:bg-coin-600"
                >
                  Open
                </Button>
              </div>
            </Card>

            <Card className="border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold text-gray-950 dark:text-white">Shift templates</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Keep template shifts separate from daily roster edits.
                  </p>
                </div>
                <Badge variant="secondary">{shifts.length}</Badge>
              </div>

              <div className="mt-4 space-y-2">
                {shifts.slice(0, 6).map((shift: ShiftTemplate) => (
                  <div
                    key={shift.id}
                    className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 dark:border-gray-700 dark:bg-gray-950/60"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-gray-950 dark:text-white">{shift.name}</div>
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {shift.start_time} - {shift.end_time}
                        </div>
                      </div>
                      <Badge variant={shift.status === 'active' ? 'default' : 'secondary'} className="shrink-0">
                        {shift.status || 'active'}
                      </Badge>
                    </div>
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      {shift.required_guards ?? 0} guards required
                    </div>
                  </div>
                ))}

                {shifts.length === 0 && (
                  <EmptyState
                    title="No templates yet"
                    description="Create shift templates from the shift management screen."
                    size="sm"
                    contentClassName="py-6"
                  />
                )}
              </div>
            </Card>

            <Card className="border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <h2 className="text-lg font-bold text-gray-950 dark:text-white">Roster tools</h2>
              <div className="mt-3 grid gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setAddOffDayOpen(true)}
                  className="justify-start bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
                >
                  <IconMapper name="CalendarOff" size={16} className="mr-2" />
                  Add off day
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setManualEntryOpen(true)}
                  className="justify-start bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
                >
                  <IconMapper name="Zap" size={16} className="mr-2" />
                  Quick manual entry
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => router.visit(route('control-room.attendance.index'))}
                  className="justify-start bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
                >
                  <IconMapper name="ClipboardList" size={16} className="mr-2" />
                  Attendance history
                </Button>
              </div>
            </Card>
          </div>
        </section>
      </div>

      <AddOffDayModal
        open={addOffDayOpen}
        guards={guards as any}
        onClose={() => setAddOffDayOpen(false)}
        onSaved={() => {
          setAddOffDayOpen(false);
          loadEvents();
        }}
      />

      <EditOffDayModal
        open={editOffDayOpen}
        event={selectedEvent}
        guards={guards as any}
        onClose={() => {
          setEditOffDayOpen(false);
          setSelectedEvent(null);
        }}
        onSaved={() => {
          setEditOffDayOpen(false);
          setSelectedEvent(null);
          loadEvents();
        }}
      />

      <DayEventsModal
        open={dayEventsOpen}
        date={selectedDate}
        events={selectedDate ? eventsForDay(selectedDate) : []}
        onClose={() => {
          setDayEventsOpen(false);
          setSelectedDate(null);
        }}
        onEdit={openOffDayEditor}
      />

      <ManualRosterEntryModal
        open={manualEntryOpen}
        onClose={() => setManualEntryOpen(false)}
        guards={guards as any}
        sites={sites as Site[]}
        onSaved={() => {
          setManualEntryOpen(false);
          loadEvents();
        }}
      />
    </ControlRoomLayout>
  );
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: number }) {
  return (
    <Card className="border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-coin-100 text-coin-800 dark:bg-coin-900/30 dark:text-coin-200">
          <IconMapper name={icon as any} size={18} />
        </div>
        <div>
          <div className="text-2xl font-black text-gray-950 dark:text-white">{value}</div>
          <div className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</div>
        </div>
      </div>
    </Card>
  );
}

function LegendPill({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-2.5 py-1 dark:border-gray-700 dark:bg-gray-950">
      <span className={`h-2.5 w-2.5 rounded-sm ${color}`} />
      {label}
    </span>
  );
}

function AddOffDayModal({
  open,
  guards,
  onClose,
  onSaved,
}: {
  open: boolean;
  guards: RosterGuard[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { data, setData, post, processing, errors, reset } = useForm<{
    guard_id: number | '';
    start_date: string;
    end_date: string;
    reason: string;
  }>({
    guard_id: guards?.[0]?.id ?? '',
    start_date: '',
    end_date: '',
    reason: '',
  });

  useEffect(() => {
    if (!open) {
      return;
    }
    setData({
      guard_id: guards?.[0]?.id ?? '',
      start_date: '',
      end_date: '',
      reason: '',
    });
  }, [guards, open, setData]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    post(route('control-room.roster.off-days.store'), {
      preserveScroll: true,
      onSuccess: () => {
        reset();
        onSaved();
      },
    });
  };

  return (
    <Modal show={open} onClose={onClose} maxWidth="md">
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
        <h2 className="text-lg font-bold text-gray-950 dark:text-white">Add off day</h2>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          ✕
        </button>
      </div>
      <div className="bg-white px-6 py-4 dark:bg-gray-900">
        <form className="grid gap-4" onSubmit={submit}>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Guard</label>
            <select
              className="w-full rounded-md border border-gray-200 bg-white p-2 text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
              value={data.guard_id as any}
              onChange={(e) => setData('guard_id', e.target.value ? Number(e.target.value) : '')}
            >
              {guards.map((guard) => (
                <option key={guard.id} value={guard.id}>
                  {guard.name}
                  {guard.employee_id ? ` (${guard.employee_id})` : ''}
                </option>
              ))}
            </select>
            {errors.guard_id && <p className="mt-1 text-xs text-red-600">{errors.guard_id}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Start date</label>
              <input
                type="date"
                className="w-full rounded-md border border-gray-200 bg-white p-2 text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                value={data.start_date}
                onChange={(e) => setData('start_date', e.target.value)}
              />
              {errors.start_date && <p className="mt-1 text-xs text-red-600">{errors.start_date}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">End date</label>
              <input
                type="date"
                className="w-full rounded-md border border-gray-200 bg-white p-2 text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                value={data.end_date}
                onChange={(e) => setData('end_date', e.target.value)}
              />
              {errors.end_date && <p className="mt-1 text-xs text-red-600">{errors.end_date}</p>}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Reason</label>
            <input
              className="w-full rounded-md border border-gray-200 bg-white p-2 text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
              value={data.reason}
              onChange={(e) => setData('reason', e.target.value)}
              placeholder="Optional"
            />
            {errors.reason && <p className="mt-1 text-xs text-red-600">{errors.reason}</p>}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={processing} className="bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">
              Cancel
            </Button>
            <Button type="submit" disabled={processing} className="bg-coin-700 text-white hover:bg-coin-600">
              {processing ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function EditOffDayModal({
  open,
  event,
  guards,
  onClose,
  onSaved,
}: {
  open: boolean;
  event: RosterEvent | null;
  guards: RosterGuard[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { data, setData, put, delete: destroy, processing, errors, reset } = useForm<{
    guard_id: number | '';
    start_date: string;
    end_date: string;
    reason: string;
  }>({
    guard_id: guards?.[0]?.id ?? '',
    start_date: '',
    end_date: '',
    reason: '',
  });

  useEffect(() => {
    if (!open || !event || event.type !== 'off_day') {
      return;
    }

    setData({
      guard_id: event.meta?.guard_id ?? guards?.[0]?.id ?? '',
      start_date: event.meta?.start_date ?? event.date ?? '',
      end_date: event.meta?.end_date ?? '',
      reason: event.meta?.reason ?? '',
    });
  }, [event, guards, open, setData]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || event.type !== 'off_day') return;

    put(route('control-room.roster.off-days.update', event.entity_id), {
      preserveScroll: true,
      onSuccess: () => {
        reset();
        onSaved();
      },
    });
  };

  const remove = () => {
    if (!event || event.type !== 'off_day') return;
    if (!window.confirm('Delete this off day?')) return;

    destroy(route('control-room.roster.off-days.destroy', event.entity_id), {
      preserveScroll: true,
      onSuccess: () => {
        reset();
        onSaved();
      },
    });
  };

  return (
    <Modal show={open} onClose={onClose} maxWidth="md">
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
        <h2 className="text-lg font-bold text-gray-950 dark:text-white">Edit off day</h2>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          ✕
        </button>
      </div>
      <div className="bg-white px-6 py-4 dark:bg-gray-900">
        <form className="grid gap-4" onSubmit={submit}>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Guard</label>
            <select
              className="w-full rounded-md border border-gray-200 bg-white p-2 text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
              value={data.guard_id as any}
              onChange={(e) => setData('guard_id', e.target.value ? Number(e.target.value) : '')}
            >
              {guards.map((guard) => (
                <option key={guard.id} value={guard.id}>
                  {guard.name}
                  {guard.employee_id ? ` (${guard.employee_id})` : ''}
                </option>
              ))}
            </select>
            {errors.guard_id && <p className="mt-1 text-xs text-red-600">{errors.guard_id}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Start date</label>
              <input
                type="date"
                className="w-full rounded-md border border-gray-200 bg-white p-2 text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                value={data.start_date}
                onChange={(e) => setData('start_date', e.target.value)}
              />
              {errors.start_date && <p className="mt-1 text-xs text-red-600">{errors.start_date}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">End date</label>
              <input
                type="date"
                className="w-full rounded-md border border-gray-200 bg-white p-2 text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                value={data.end_date}
                onChange={(e) => setData('end_date', e.target.value)}
              />
              {errors.end_date && <p className="mt-1 text-xs text-red-600">{errors.end_date}</p>}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Reason</label>
            <input
              className="w-full rounded-md border border-gray-200 bg-white p-2 text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
              value={data.reason}
              onChange={(e) => setData('reason', e.target.value)}
            />
            {errors.reason && <p className="mt-1 text-xs text-red-600">{errors.reason}</p>}
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={processing} className="bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">
              Cancel
            </Button>
            <Button type="button" onClick={remove} disabled={processing} className="bg-red-700 text-white hover:bg-red-600">
              Delete
            </Button>
            <Button type="submit" disabled={processing} className="bg-coin-700 text-white hover:bg-coin-600">
              {processing ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function DayEventsModal({
  open,
  date,
  events,
  onClose,
  onEdit,
}: {
  open: boolean;
  date: Date | null;
  events: RosterEvent[];
  onClose: () => void;
  onEdit: (event: RosterEvent) => void;
}) {
  if (!date) return null;

  return (
    <Modal show={open} onClose={onClose} maxWidth="sm">
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
        <h2 className="text-lg font-bold text-gray-950 dark:text-white">
          {date.toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
          })}
        </h2>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          ✕
        </button>
      </div>
      <div className="max-h-[60vh] overflow-y-auto bg-white px-6 py-4 dark:bg-gray-900">
        {events.length === 0 ? (
          <EmptyState title="No roster events" description="This date has no holiday or off-day records." size="sm" contentClassName="py-6" />
        ) : (
          <div className="space-y-2">
            {events.map((event) => (
              <button
                key={`${event.entity}-${event.entity_id}-${event.date}`}
                type="button"
                onClick={() => onEdit(event)}
                className={`w-full rounded-xl px-4 py-3 text-left text-white transition-opacity hover:opacity-90 ${
                  event.color === 'red' ? 'bg-red-600' : 'bg-coin-700'
                }`}
              >
                <div className="font-semibold">{event.title}</div>
                <div className="mt-1 text-xs opacity-80">{event.type === 'off_day' ? 'Off day' : 'Holiday'}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
