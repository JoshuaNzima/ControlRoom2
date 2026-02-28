import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import ControlRoomLayout from '@/Layouts/ControlRoomLayout';
import Modal from '@/Components/Modal';
import ManualRosterEntryModal from '@/Components/Roster/ManualRosterEntryModal';
import { StatCard } from '@/Components/StatCard';
import { ActionTile } from '@/Components/ActionTile';
import IconMapper from '@/Components/IconMapper';

type Guard = { id: number; name: string; employee_id?: string };
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
  const { auth, guards = [], sites = [], initial_month } = (usePage().props as any);
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
  const [addOffDayOpen, setAddOffDayOpen] = useState(false);
  const [manualEntryOpen, setManualEntryOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [editOffDayOpen, setEditOffDayOpen] = useState(false);

  const { gridStart, gridEnd } = useMemo(() => getCalendarRange(currentMonth), [currentMonth]);

  const refreshEvents = useCallback(async () => {
    setLoading(true);
    try {
      const url = route('control-room.roster.events', { start: formatYmd(gridStart), end: formatYmd(gridEnd) });
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

  const openEvent = (e: EventItem) => {
    if (e.type !== 'off_day') return;
    setSelectedEvent(e);
    setEditOffDayOpen(true);
  };

  return (
    <ControlRoomLayout title="Roster" user={auth?.user as any}>
      <Head title="Roster" />
      <div className="space-y-6">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-700 via-red-600 to-rose-600 text-white shadow-2xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20" />
          <div className="relative p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                  <IconMapper name="Calendar" size={32} />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">Roster & Calendar</h1>
                  <p className="text-red-100 mt-1">Manage guard off days and view holidays</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="px-4 py-2 bg-white/10 rounded-lg backdrop-blur-sm">
                  <p className="text-xs text-red-200">Current Month</p>
                  <p className="text-lg font-semibold">{monthLabel}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* StatCards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={<IconMapper name="Users" size={24} />}
            title="Total Guards"
            value={guards.length || 0}
            subtitle="Available guards"
            color="blue"
          />
          <StatCard
            icon={<IconMapper name="MapPin" size={24} />}
            title="Active Sites"
            value={sites.length || 0}
            subtitle="Assigned locations"
            color="green"
          />
          <StatCard
            icon={<IconMapper name="CalendarOff" size={24} />}
            title="Off Days"
            value={events.filter(e => e.type === 'off_day').length}
            subtitle="This month"
            color="amber"
          />
          <StatCard
            icon={<IconMapper name="CalendarCheck" size={24} />}
            title="Holidays"
            value={events.filter(e => e.type === 'holiday').length}
            subtitle="This month"
            color="purple"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <ActionTile
            icon={<IconMapper name="Plus" size={18} />}
            title="Add Off Day"
            description="Schedule guard time off"
            color="bg-red-600"
            onClick={() => setAddOffDayOpen(true)}
          />
          <ActionTile
            icon={<IconMapper name="Zap" size={18} />}
            title="Quick Entry"
            description="Fast roster entry"
            color="bg-emerald-600"
            onClick={() => setManualEntryOpen(true)}
          />
          <ActionTile
            icon={<IconMapper name="ChevronLeft" size={18} />}
            title="Previous Month"
            description="View last month"
            color="bg-blue-600"
            onClick={() => setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
          />
          <ActionTile
            icon={<IconMapper name="ChevronRight" size={18} />}
            title="Next Month"
            description="View next month"
            color="bg-purple-600"
            onClick={() => setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
          />
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded-sm bg-red-600" /> Holiday</div>
          <div className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded-sm bg-coin-700" /> Off Day</div>
          {loading && <div className="text-gray-500 dark:text-gray-400">Loading…</div>}
        </div>

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
                <div className={`text-xs sm:text-sm font-medium mb-1 ${inMonth ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}`}>{d.getDate()}</div>
                <div className="space-y-1">
                  {evs.slice(0,3).map((e) => (
                    <button
                      key={`${e.entity}-${e.entity_id}-${e.date}`}
                      type="button"
                      onClick={() => openEvent(e)}
                      className={`text-left w-full truncate text-[10px] sm:text-xs px-1.5 py-0.5 rounded-md text-white hover:opacity-90 ${e.color === 'red' ? 'bg-red-600' : 'bg-coin-700'}`}
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

        <AddOffDayModal
          open={addOffDayOpen}
          onClose={() => setAddOffDayOpen(false)}
          guards={guards as Guard[]}
          onSaved={() => {
            setAddOffDayOpen(false);
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
        <ManualRosterEntryModal
          open={manualEntryOpen}
          onClose={() => setManualEntryOpen(false)}
          guards={guards as Guard[]}
          sites={sites as {id: number; name: string}[]}
          onSaved={() => {
            setManualEntryOpen(false);
            refreshEvents();
          }}
        />
      </div>
    </ControlRoomLayout>
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
    post(route('control-room.roster.off-days.store'), {
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
            <button type="submit" disabled={processing} className="px-4 py-2 text-sm rounded-md bg-coin-700 text-white hover:bg-coin-600">{processing ? 'Saving…' : 'Save'}</button>
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
    put(route('control-room.roster.off-days.update', event.entity_id), {
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
    destroy(route('control-room.roster.off-days.destroy', event.entity_id), {
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
              className="px-4 py-2 text-sm rounded-md bg-coin-700 text-white hover:bg-coin-600"
            >
              {processing ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
