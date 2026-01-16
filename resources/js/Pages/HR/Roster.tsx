import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import HRLayout from '@/Layouts/HRLayout';
import Modal from '@/Components/Modal';
import PageHeader from '@/Components/ui/page-header';

type Guard = { id: number; name: string; employee_id?: string };
type Holiday = { id?: number; name: string; date: string; is_recurring?: boolean; type?: 'company' | 'public' };
type OffDay = { id?: number; guard_id: number; start_date: string; end_date?: string | null; reason?: string | null };
type EventItem = {
  entity: 'holiday' | 'off_day';
  entity_id: number;
  date: string; // YYYY-MM-DD
  title: string;
  type: 'holiday' | 'off_day';
  color: 'red' | 'indigo';
  meta?: any;
};
type AttendanceWarning = {
  date: string;
  offCount: number;
  totalGuards: number;
  ratio: number;
  hasHoliday: boolean;
  severity: 'medium' | 'high';
};

function formatYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function startOfMonth(d: Date) {
  const nd = new Date(d);
  nd.setDate(1);
  nd.setHours(0, 0, 0, 0);
  return nd;
}
function endOfMonth(d: Date) {
  const nd = new Date(d);
  nd.setMonth(nd.getMonth() + 1);
  nd.setDate(0);
  nd.setHours(23, 59, 59, 999);
  return nd;
}
function getCalendarRange(d: Date) {
  const start = startOfMonth(d);
  const end = endOfMonth(d);
  const startDay = start.getDay(); // 0=Sun..6=Sat
  const gridStart = new Date(start);
  gridStart.setDate(start.getDate() - startDay); // start from Sunday
  const endDay = end.getDay();
  const gridEnd = new Date(end);
  gridEnd.setDate(end.getDate() + (6 - endDay));
  // Ensure 6 weeks (42 days)
  const days = Math.round((gridEnd.getTime() - gridStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  if (days < 42) gridEnd.setDate(gridEnd.getDate() + (42 - days));
  return { gridStart, gridEnd };
}

export default function Roster() {
  const { auth, guards = [], initial_month } = (usePage().props as any);
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    if (initial_month) {
      const d = new Date(initial_month);
      d.setDate(1);
      return d;
    }
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [addHolidayOpen, setAddHolidayOpen] = useState(false);
  const [addOffDayOpen, setAddOffDayOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [editHolidayOpen, setEditHolidayOpen] = useState(false);
  const [editOffDayOpen, setEditOffDayOpen] = useState(false);

  const { gridStart, gridEnd } = useMemo(() => getCalendarRange(currentMonth), [currentMonth]);

  const refreshEvents = useCallback(async () => {
    setLoading(true);
    try {
      const url = route('hr.leaves.events', { start: formatYmd(gridStart), end: formatYmd(gridEnd) });
      const res = await fetch(url, { headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' } });
      if (res.ok) {
        const json = await res.json();
        setEvents(json.events || []);
      }
    } finally {
      setLoading(false);
    }
  }, [gridStart, gridEnd]);

  useEffect(() => {
    refreshEvents();
  }, [refreshEvents]);

  const days: Date[] = useMemo(() => {
    const arr: Date[] = [];
    const cur = new Date(gridStart);
    while (cur <= gridEnd) {
      arr.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return arr;
  }, [gridStart, gridEnd]);

  const monthLabel = currentMonth.toLocaleString(undefined, { month: 'long', year: 'numeric' });

  const dayEvents = (date: Date) => {
    const key = formatYmd(date);
    return events.filter((e) => e.date === key);
  };

  const warningDays = useMemo<AttendanceWarning[]>(() => {
    if (!Array.isArray(guards) || !guards.length || !events.length) return [];
    const totalGuards = guards.length;
    const byDate: Record<string, { offCount: number; hasHoliday: boolean }> = {};

    for (const e of events) {
      if (!byDate[e.date]) {
        byDate[e.date] = { offCount: 0, hasHoliday: false };
      }
      if (e.type === 'off_day') {
        byDate[e.date].offCount += 1;
      }
      if (e.type === 'holiday') {
        byDate[e.date].hasHoliday = true;
      }
    }

    const list: AttendanceWarning[] = [];
    Object.entries(byDate).forEach(([date, info]) => {
      if (!info.offCount) return;
      const ratio = info.offCount / totalGuards;
      // Only flag days where a significant share of guards are off
      const severity: AttendanceWarning['severity'] | null = ratio >= 0.5 ? 'high' : ratio >= 0.25 ? 'medium' : null;
      if (!severity) return;
      list.push({
        date,
        offCount: info.offCount,
        totalGuards,
        ratio,
        hasHoliday: info.hasHoliday,
        severity,
      });
    });

    list.sort((a, b) => {
      if (b.ratio !== a.ratio) return b.ratio - a.ratio;
      return a.date.localeCompare(b.date);
    });

    return list.slice(0, 6);
  }, [events, guards]);

  const openEvent = (e: EventItem) => {
    setSelectedEvent(e);
    if (e.type === 'holiday') {
      setEditHolidayOpen(true);
    } else {
      setEditOffDayOpen(true);
    }
  };

  return (
    <HRLayout title="Leave Management" user={auth?.user as any}>
      <Head title="Leave Management" />
      <div className="space-y-4">
        <PageHeader
          title="Roster & Calendar"
          description="Register guard off days and holidays."
          actions={(
            <>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  className="shrink-0 px-3 py-1.5 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
                  onClick={() => setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
                >
                  Prev
                </button>
                <div className="flex-1 min-w-0 text-center font-medium text-gray-900 dark:text-gray-100 truncate">{monthLabel}</div>
                <button
                  type="button"
                  className="shrink-0 px-3 py-1.5 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
                  onClick={() => setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
                >
                  Next
                </button>
              </div>
              <button
                type="button"
                className="px-3 py-1.5 rounded-md bg-coin-700 text-white hover:bg-coin-800"
                onClick={() => setAddOffDayOpen(true)}
              >
                Add Off Day
              </button>
              <button
                type="button"
                className="px-3 py-1.5 rounded-md bg-red-600 text-white hover:bg-red-700"
                onClick={() => setAddHolidayOpen(true)}
              >
                Add Holiday
              </button>
            </>
          )}
        />

        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded-sm bg-red-600" /> Holiday</div>
          <div className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded-sm bg-coin-700" /> Off Day</div>
          {loading && <div className="text-gray-500 dark:text-gray-400">Loading…</div>}
        </div>

        {warningDays.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/30 p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold text-amber-900 dark:text-amber-100">Attendance warnings this month</div>
                <div className="text-xs text-amber-800 dark:text-amber-200">
                  {warningDays.length} day{warningDays.length > 1 ? 's' : ''}
                </div>
              </div>
              <ul className="mt-2 space-y-1">
                {warningDays.map((w) => {
                  const d = new Date(w.date);
                  const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                  const badgeClass = w.severity === 'high'
                    ? 'bg-red-600/10 text-red-700 dark:bg-red-900/40 dark:text-red-200'
                    : 'bg-amber-500/10 text-amber-700 dark:bg-amber-900/50 dark:text-amber-200';
                  return (
                    <li key={w.date} className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-gray-100">{label}</span>
                          {w.hasHoliday && (
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-red-600/10 text-red-700 dark:bg-red-900/40 dark:text-red-200">
                              Holiday
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-700 dark:text-gray-300">
                          {w.offCount} off out of {w.totalGuards} guards ({Math.round(w.ratio * 100)}%)
                        </div>
                      </div>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeClass}`}>
                        {w.severity === 'high' ? 'High risk' : 'Medium risk'}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}

        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
            <div key={d} className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 px-1 sm:px-2 py-1">{d}</div>
          ))}
          {days.map((d) => {
            const inMonth = d.getMonth() === currentMonth.getMonth();
            const evs = dayEvents(d);
            return (
              <div
                key={d.toISOString()}
                className={`min-h-[80px] sm:min-h-[110px] border rounded-md p-1 sm:p-2 ${inMonth ? 'bg-white dark:bg-gray-900 dark:border-gray-800' : 'bg-gray-50 text-gray-400 dark:bg-gray-950 dark:border-gray-900'} `}
              >
                <div className="text-xs sm:text-sm font-medium mb-1">{d.getDate()}</div>
                <div className="space-y-1">
                  {evs.slice(0,3).map((e) => (
                    <button
                      key={`${e.entity}-${e.entity_id}-${e.date}`}
                      type="button"
                      onClick={() => openEvent(e)}
                      className={`text-left w-full text-[10px] sm:text-xs px-1.5 py-0.5 rounded-md text-white hover:opacity-90 ${e.color === 'red' ? 'bg-red-600' : 'bg-coin-700'}`}
                    >
                      {e.title}
                    </button>
                  ))}
                  {evs.length > 3 && (
                    <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">+{evs.length - 3} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <AddHolidayModal
          open={addHolidayOpen}
          onClose={() => setAddHolidayOpen(false)}
          onSaved={() => {
            setAddHolidayOpen(false);
            refreshEvents();
          }}
        />

        <AddOffDayModal
          open={addOffDayOpen}
          onClose={() => setAddOffDayOpen(false)}
          guards={guards as Guard[]}
          onSaved={() => {
            setAddOffDayOpen(false);
            refreshEvents();
          }}
        />

        <EditHolidayModal
          open={editHolidayOpen}
          onClose={() => {
            setEditHolidayOpen(false);
            setSelectedEvent(null);
          }}
          event={selectedEvent}
          onSaved={() => {
            setEditHolidayOpen(false);
            setSelectedEvent(null);
            refreshEvents();
          }}
        />

        <EditOffDayModal
          open={editOffDayOpen}
          onClose={() => {
            setEditOffDayOpen(false);
            setSelectedEvent(null);
          }}
          event={selectedEvent}
          guards={guards as Guard[]}
          onSaved={() => {
            setEditOffDayOpen(false);
            setSelectedEvent(null);
            refreshEvents();
          }}
        />
      </div>
    </HRLayout>
  );
}

function AddHolidayModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const { data, setData, post, processing, errors, reset } = useForm<Holiday>({
    name: '',
    date: '',
    is_recurring: false,
    type: 'company',
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('hr.leaves.holidays.store'), {
      onSuccess: () => { reset(); onSaved(); },
    });
  };

  const handleClose = () => { if (!processing) onClose(); };

  return (
    <Modal show={open} onClose={handleClose} maxWidth="md">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white dark:bg-gray-900 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Add Holiday</h2>
        <button type="button" onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200">✕</button>
      </div>
      <div className="px-6 py-4 bg-white dark:bg-gray-900">
        <form className="grid grid-cols-1 gap-3" onSubmit={submit}>
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={data.name} onChange={(e) => setData('name', e.target.value)} />
            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Date</label>
            <input type="date" className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={data.date} onChange={(e) => setData('date', e.target.value)} />
            {errors.date && <p className="text-xs text-red-600 mt-1">{errors.date}</p>}
          </div>
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!data.is_recurring} onChange={(e) => setData('is_recurring', e.target.checked)} />
              <span>Recurring annually</span>
            </label>
            <label className="text-sm">
              <span className="mr-2">Type</span>
              <select className="border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={data.type} onChange={(e) => setData('type', e.target.value as any)}>
                <option value="company">Company</option>
                <option value="public">Public</option>
              </select>
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={handleClose} className="px-4 py-2 text-sm rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700" disabled={processing}>Cancel</button>
            <button type="submit" disabled={processing} className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700">{processing ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function EditHolidayModal({
  open,
  onClose,
  onSaved,
  event,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  event: EventItem | null;
}) {
  const { data, setData, put, processing, errors, reset, delete: destroy } = useForm<Holiday>({
    name: '',
    date: '',
    is_recurring: false,
    type: 'company',
  });

  useEffect(() => {
    if (!open || !event || event.type !== 'holiday') return;
    setData({
      name: event.title || '',
      date: event.date || '',
      is_recurring: !!event.meta?.is_recurring,
      type: (event.meta?.holiday_type as any) || 'company',
    });
  }, [open, event, setData]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || event.type !== 'holiday') return;
    put(route('hr.leaves.holidays.update', event.entity_id), {
      preserveScroll: true,
      onSuccess: () => {
        reset();
        onSaved();
      },
    });
  };

  const handleDelete = () => {
    if (!event || event.type !== 'holiday') return;
    if (!confirm('Delete this holiday?')) return;
    destroy(route('hr.leaves.holidays.destroy', event.entity_id), {
      preserveScroll: true,
      onSuccess: () => {
        reset();
        onSaved();
      },
    });
  };

  const handleClose = () => {
    if (!processing) onClose();
  };

  return (
    <Modal show={open} onClose={handleClose} maxWidth="md">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white dark:bg-gray-900 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit Holiday</h2>
        <button
          type="button"
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200"
        >
          ✕
        </button>
      </div>
      <div className="px-6 py-4 bg-white dark:bg-gray-900">
        <form className="grid grid-cols-1 gap-3" onSubmit={submit}>
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input
              className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              value={data.name}
              onChange={(e) => setData('name', e.target.value)}
            />
            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Date</label>
            <input
              type="date"
              className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              value={data.date}
              onChange={(e) => setData('date', e.target.value)}
            />
            {errors.date && <p className="text-xs text-red-600 mt-1">{errors.date}</p>}
          </div>
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!data.is_recurring}
                onChange={(e) => setData('is_recurring', e.target.checked)}
              />
              <span>Recurring annually</span>
            </label>
            <label className="text-sm">
              <span className="mr-2">Type</span>
              <select
                className="border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                value={data.type}
                onChange={(e) => setData('type', e.target.value as any)}
              >
                <option value="company">Company</option>
                <option value="public">Public</option>
              </select>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
              disabled={processing}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 text-sm rounded-md bg-red-700 text-white hover:bg-red-800"
              disabled={processing}
            >
              Delete
            </button>
            <button
              type="submit"
              disabled={processing}
              className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700"
            >
              {processing ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function EditOffDayModal({
  open,
  onClose,
  onSaved,
  event,
  guards,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  event: EventItem | null;
  guards: Guard[];
}) {
  const { data, setData, put, processing, errors, reset, delete: destroy } = useForm<OffDay>({
    guard_id: (guards?.[0]?.id as number) || ('' as any),
    start_date: '',
    end_date: '',
    reason: '',
  });

  useEffect(() => {
    if (!open || !event || event.type !== 'off_day') return;
    const guardId = Number(event.meta?.guard_id ?? event.meta?.guard?.id ?? '') || (guards?.[0]?.id as number);
    setData({
      guard_id: guardId as any,
      start_date: event.meta?.start_date || event.date || '',
      end_date: event.meta?.end_date || '',
      reason: event.meta?.reason || '',
    });
  }, [open, event, guards, setData]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || event.type !== 'off_day') return;
    put(route('hr.leaves.off-days.update', event.entity_id), {
      preserveScroll: true,
      onSuccess: () => {
        reset();
        onSaved();
      },
    });
  };

  const handleDelete = () => {
    if (!event || event.type !== 'off_day') return;
    if (!confirm('Delete this off day?')) return;
    destroy(route('hr.leaves.off-days.destroy', event.entity_id), {
      preserveScroll: true,
      onSuccess: () => {
        reset();
        onSaved();
      },
    });
  };

  const handleClose = () => {
    if (!processing) onClose();
  };

  return (
    <Modal show={open} onClose={handleClose} maxWidth="md">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white dark:bg-gray-900 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit Off Day</h2>
        <button
          type="button"
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200"
        >
          ✕
        </button>
      </div>
      <div className="px-6 py-4 bg-white dark:bg-gray-900">
        <form className="grid grid-cols-1 gap-3" onSubmit={submit}>
          <div>
            <label className="block text-sm font-medium">Guard</label>
            <select
              className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              value={data.guard_id as any}
              onChange={(e) => setData('guard_id', Number(e.target.value))}
            >
              {guards.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} {g.employee_id ? `(${g.employee_id})` : ''}
                </option>
              ))}
            </select>
            {errors.guard_id && <p className="text-xs text-red-600 mt-1">{errors.guard_id}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium">Start Date</label>
              <input
                type="date"
                className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                value={data.start_date}
                onChange={(e) => setData('start_date', e.target.value)}
              />
              {errors.start_date && <p className="text-xs text-red-600 mt-1">{errors.start_date}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium">End Date</label>
              <input
                type="date"
                className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                value={data.end_date || ''}
                onChange={(e) => setData('end_date', e.target.value)}
              />
              {errors.end_date && <p className="text-xs text-red-600 mt-1">{errors.end_date}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium">Reason (optional)</label>
            <input
              className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              value={data.reason || ''}
              onChange={(e) => setData('reason', e.target.value)}
            />
            {errors.reason && <p className="text-xs text-red-600 mt-1">{errors.reason}</p>}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
              disabled={processing}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 text-sm rounded-md bg-red-700 text-white hover:bg-red-800"
              disabled={processing}
            >
              Delete
            </button>
            <button
              type="submit"
              disabled={processing}
              className="px-4 py-2 text-sm rounded-md bg-coin-700 text-white hover:bg-coin-800"
            >
              {processing ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function AddOffDayModal({ open, onClose, guards, onSaved }: { open: boolean; onClose: () => void; guards: Guard[]; onSaved: () => void }) {
  const { data, setData, post, processing, errors, reset } = useForm<OffDay>({
    guard_id: (guards?.[0]?.id as number) || ('' as any),
    start_date: '',
    end_date: '',
    reason: '',
  });

  useEffect(() => {
    if (open && guards && guards.length && !data.guard_id) {
      setData('guard_id', guards[0].id);
    }
  }, [open, guards, data.guard_id, setData]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('hr.leaves.off-days.store'), {
      onSuccess: () => { reset(); onSaved(); },
    });
  };

  const handleClose = () => { if (!processing) onClose(); };

  return (
    <Modal show={open} onClose={handleClose} maxWidth="md">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white dark:bg-gray-900 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Add Off Day</h2>
        <button type="button" onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200">✕</button>
      </div>
      <div className="px-6 py-4 bg-white dark:bg-gray-900">
        <form className="grid grid-cols-1 gap-3" onSubmit={submit}>
          <div>
            <label className="block text-sm font-medium">Guard</label>
            <select className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={data.guard_id as any} onChange={(e) => setData('guard_id', Number(e.target.value))}>
              {guards.map((g) => (
                <option key={g.id} value={g.id}>{g.name} {g.employee_id ? `(${g.employee_id})` : ''}</option>
              ))}
            </select>
            {errors.guard_id && <p className="text-xs text-red-600 mt-1">{errors.guard_id}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium">Start Date</label>
              <input type="date" className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={data.start_date} onChange={(e) => setData('start_date', e.target.value)} />
              {errors.start_date && <p className="text-xs text-red-600 mt-1">{errors.start_date}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium">End Date</label>
              <input type="date" className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={data.end_date || ''} onChange={(e) => setData('end_date', e.target.value)} />
              {errors.end_date && <p className="text-xs text-red-600 mt-1">{errors.end_date}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium">Reason (optional)</label>
            <input className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={data.reason || ''} onChange={(e) => setData('reason', e.target.value)} />
            {errors.reason && <p className="text-xs text-red-600 mt-1">{errors.reason}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={handleClose} className="px-4 py-2 text-sm rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700" disabled={processing}>Cancel</button>
            <button type="submit" disabled={processing} className="px-4 py-2 text-sm rounded-md bg-coin-700 text-white hover:bg-coin-800">{processing ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
