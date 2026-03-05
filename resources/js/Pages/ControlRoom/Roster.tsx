import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import ControlRoomLayout from '@/Layouts/ControlRoomLayout';
import Modal from '@/Components/Modal';
import ManualRosterEntryModal from '@/Components/Roster/ManualRosterEntryModal';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/Components/ui/tabs';
import IconMapper from '@/Components/IconMapper';

type Guard = { id: number; name: string; employee_id?: string };
type Shift = { id: number; name: string; start_time: string; end_time: string; status: string };
type OffDay = { id?: number; guard_id: number; start_date: string; end_date?: string | null; reason?: string | null };
type EventItem = {
  entity: 'holiday' | 'off_day';
  entity_id: number;
  date: string;
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
  const startDay = start.getDay();
  const gridStart = new Date(start);
  gridStart.setDate(start.getDate() - startDay);
  const endDay = end.getDay();
  const gridEnd = new Date(end);
  gridEnd.setDate(end.getDate() + (6 - endDay));
  const days = Math.round((gridEnd.getTime() - gridStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  if (days < 42) gridEnd.setDate(gridEnd.getDate() + (42 - days));
  return { gridStart, gridEnd };
}

export default function Roster() {
  const { auth, guards = [], sites = [], shifts = [], initial_month } = (usePage().props as any);
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
  const [activeTab, setActiveTab] = useState('calendar');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dayEventsOpen, setDayEventsOpen] = useState(false);

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

  const openDayEvents = (d: Date) => {
    setSelectedDate(d);
    setDayEventsOpen(true);
  };

  const stats = useMemo(() => ({
    totalGuards: guards.length || 0,
    activeSites: sites.length || 0,
    offDays: events.filter(e => e.type === 'off_day').length,
    holidays: events.filter(e => e.type === 'holiday').length,
    activeShifts: shifts.filter((s: Shift) => s.status === 'active').length || 0,
  }), [guards.length, sites.length, events, shifts]);

  return (
    <ControlRoomLayout title="Roster & Shifts" user={auth?.user as any}>
      <Head title="Roster & Shifts" />
      <div className="space-y-4 md:space-y-6">
        {/* Hero Header - Mobile Optimized */}
        <div className="relative overflow-hidden rounded-xl md:rounded-2xl bg-gradient-to-br from-coin-900 via-coin-800 to-coin-700 text-white shadow-lg md:shadow-2xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20" />
          <div className="relative p-4 md:p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 md:p-4 bg-white/10 rounded-lg md:rounded-xl backdrop-blur-sm">
                  <IconMapper name="Calendar" size={24} className="md:w-8 md:h-8" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">Roster & Shifts</h1>
                  <p className="text-coin-100 text-sm mt-0.5">Manage off days, holidays & shift schedules</p>
                </div>
              </div>
              <div className="flex items-center justify-between lg:justify-end gap-3">
                <div className="px-3 py-1.5 md:px-4 md:py-2 bg-white/10 rounded-lg backdrop-blur-sm">
                  <p className="text-xs text-coin-200">Current Month</p>
                  <p className="text-sm md:text-lg font-semibold">{monthLabel}</p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => router.visit(route('control-room.roster.weekly'))}
                  className="dark:bg-white/10 dark:hover:bg-white/15 bg-white/15 hover:bg-white/25 text-white border border-white/10"
                >
                  <IconMapper name="CalendarDays" size={16} className="mr-2" />
                  Weekly Planner
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid - Responsive */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 md:gap-4">
          <StatCard icon="Users" value={stats.totalGuards} label="Total Guards" color="blue" />
          <StatCard icon="MapPin" value={stats.activeSites} label="Active Sites" color="emerald" />
          <StatCard icon="CalendarOff" value={stats.offDays} label="Off Days" color="amber" />
          <StatCard icon="CalendarCheck" value={stats.holidays} label="Holidays" color="purple" />
          <StatCard icon="Clock" value={stats.activeShifts} label="Active Shifts" color="cyan" />
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex bg-gray-100 dark:bg-gray-900">
            <TabsTrigger value="calendar" className="text-xs md:text-sm">
              <IconMapper name="Calendar" size={14} className="mr-1.5" />
              <span className="hidden sm:inline">Calendar</span>
              <span className="sm:hidden">Cal</span>
            </TabsTrigger>
            <TabsTrigger value="shifts" className="text-xs md:text-sm">
              <IconMapper name="Clock" size={14} className="mr-1.5" />
              <span className="hidden sm:inline">Shifts</span>
              <span className="sm:hidden">Shift</span>
            </TabsTrigger>
            <TabsTrigger value="guards" className="text-xs md:text-sm">
              <IconMapper name="Users" size={14} className="mr-1.5" />
              <span className="hidden sm:inline">Guards</span>
              <span className="sm:hidden">Guards</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="space-y-4">
            {/* Calendar Controls */}
            <Card className="p-3 md:p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block w-2.5 h-2.5 rounded-sm bg-red-600" />
                    <span className="text-gray-600 dark:text-gray-400">Holiday</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block w-2.5 h-2.5 rounded-sm bg-coin-700" />
                    <span className="text-gray-600 dark:text-gray-400">Off Day</span>
                  </div>
                  {loading && (
                    <div className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <IconMapper name="Loader2" size={14} className="animate-spin" />
                      <span>Loading...</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
                    className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
                  >
                    <IconMapper name="ChevronLeft" size={16} />
                  </Button>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 min-w-[100px] text-center">
                    {monthLabel}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
                    className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
                  >
                    <IconMapper name="ChevronRight" size={16} />
                  </Button>
                  <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1 hidden sm:block" />
                  <Button size="sm" onClick={() => setAddOffDayOpen(true)} className="hidden sm:flex bg-coin-700 hover:bg-coin-600 text-white">
                    <IconMapper name="Plus" size={14} className="mr-1" />
                    Add Off Day
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setManualEntryOpen(true)} className="hidden sm:flex dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100">
                    <IconMapper name="Zap" size={14} className="mr-1" />
                    Quick Entry
                  </Button>
                </div>
              </div>
              {/* Mobile Action Buttons */}
              <div className="flex gap-2 mt-3 sm:hidden">
                <Button size="sm" onClick={() => setAddOffDayOpen(true)} className="flex-1 bg-coin-700 hover:bg-coin-600 text-white">
                  <IconMapper name="Plus" size={14} className="mr-1" />
                  Off Day
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setManualEntryOpen(true)} className="flex-1 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100">
                  <IconMapper name="Zap" size={14} className="mr-1" />
                  Quick Entry
                </Button>
              </div>
            </Card>

            {/* Calendar Grid */}
            <Card className="overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
              {/* Day Headers */}
              <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-950/40 border-b border-gray-200 dark:border-gray-800">
                {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
                  <div key={d} className="text-xs font-semibold text-gray-600 dark:text-gray-400 px-1 py-2 md:px-2 md:py-3 text-center">
                    <span className="hidden sm:inline">{d}</span>
                    <span className="sm:hidden">{d[0]}</span>
                  </div>
                ))}
              </div>
              {/* Calendar Days */}
              <div className="grid grid-cols-7">
                {days.map((d) => {
                  const inMonth = d.getMonth() === currentMonth.getMonth();
                  const evs = dayEvents(d);
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                  const isToday = formatYmd(d) === formatYmd(new Date());
                  
                  return (
                    <div
                      key={d.toISOString()}
                      onClick={() => evs.length > 0 ? openDayEvents(d) : null}
                      className={`min-h-[70px] sm:min-h-[105px] md:min-h-[125px] border-b border-r border-gray-200 dark:border-gray-800 p-1.5 md:p-2 cursor-pointer transition-colors ${
                        inMonth 
                          ? isWeekend ? 'bg-coin-50/50 dark:bg-coin-900/10' : 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50' 
                          : 'bg-gray-50/50 text-gray-400 dark:bg-gray-950 dark:text-gray-600'
                      } ${isToday ? 'ring-2 ring-coin-600 ring-inset' : ''}`}
                    >
                      <div className={`text-xs md:text-sm font-medium mb-0.5 md:mb-1 flex items-center justify-between ${
                        inMonth 
                          ? isWeekend ? 'text-coin-700 dark:text-coin-200' : 'text-gray-900 dark:text-gray-100' 
                          : 'text-gray-400 dark:text-gray-600'
                      }`}>
                        <span>{d.getDate()}</span>
                        {isToday && (
                          <span className="text-[8px] md:text-xs bg-coin-600 text-white px-1 rounded">Today</span>
                        )}
                      </div>
                      <div className="space-y-0.5 md:space-y-1">
                        {evs.slice(0, 2).map((e) => (
                          <button
                            key={`${e.entity}-${e.entity_id}-${e.date}`}
                            type="button"
                            onClick={(evt) => { evt.stopPropagation(); openEvent(e); }}
                            className={`text-left w-full truncate text-[8px] md:text-xs px-1 py-0.5 rounded text-white hover:opacity-90 transition-opacity ${
                              e.color === 'red' ? 'bg-red-600' : 'bg-coin-700'
                            }`}
                          >
                            {e.title}
                          </button>
                        ))}
                        {evs.length > 2 && (
                          <div 
                            onClick={(e) => { e.stopPropagation(); openDayEvents(d); }}
                            className="text-[8px] md:text-xs text-gray-500 dark:text-gray-400 font-medium cursor-pointer hover:text-coin-700 dark:hover:text-coin-200"
                          >
                            +{evs.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="shifts" className="space-y-4">
            <ShiftsPanel shifts={shifts} />
          </TabsContent>

          <TabsContent value="guards" className="space-y-4">
            <GuardsPanel guards={guards} events={events} />
          </TabsContent>
        </Tabs>

        {/* Modals */}
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

        <DayEventsModal
          open={dayEventsOpen}
          onClose={() => {
            setDayEventsOpen(false);
            setSelectedDate(null);
          }}
          date={selectedDate}
          events={selectedDate ? dayEvents(selectedDate) : []}
          onEdit={openEvent}
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

// Stat Card Component
function StatCard({ icon, value, label, color }: { icon: string; value: number; label: string; color: string }) {
  const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
    blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', border: 'border-l-blue-500' },
    emerald: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-l-emerald-500' },
    amber: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400', border: 'border-l-amber-500' },
    purple: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400', border: 'border-l-purple-500' },
    cyan: { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-l-cyan-500' },
  };
  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <Card className={`p-3 md:p-4 border-l-4 ${colors.border}`}>
      <div className="flex items-center gap-2 md:gap-3">
        <div className={`p-1.5 md:p-2.5 ${colors.bg} rounded-lg`}>
          <IconMapper name={icon as any} size={16} className={`md:w-5 md:h-5 ${colors.text}`} />
        </div>
        <div>
          <p className="text-lg md:text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">{label}</p>
        </div>
      </div>
    </Card>
  );
}

// Shifts Panel Component
function ShiftsPanel({ shifts }: { shifts: Shift[] }) {
  if (!shifts || shifts.length === 0) {
    return (
      <Card className="p-8 text-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
        <IconMapper name="Clock" size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
        <p className="text-gray-500 dark:text-gray-400">No shifts configured</p>
        <Button className="mt-4 bg-coin-700 hover:bg-coin-600 text-white" onClick={() => router.visit(route('control-room.shifts.index'))}>
          Manage Shifts
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Active Shifts</h3>
        <Button size="sm" onClick={() => router.visit(route('control-room.shifts.index'))} className="bg-coin-700 hover:bg-coin-600 text-white">
          <IconMapper name="Settings" size={14} className="mr-1" />
          Manage
        </Button>
      </div>
      <div className="grid gap-3">
        {shifts.map((shift) => (
          <Card key={shift.id} className="p-3 md:p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">{shift.name}</h4>
                  <Badge variant={shift.status === 'active' ? 'default' : 'secondary'}>
                    {shift.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {shift.start_time} - {shift.end_time}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
                onClick={() => router.visit(route('control-room.shifts.schedule', shift.id))}
              >
                Schedule
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Guards Panel Component
function GuardsPanel({ guards, events }: { guards: Guard[]; events: EventItem[] }) {
  const [search, setSearch] = useState('');
  
  const filteredGuards = useMemo(() => {
    if (!search) return guards;
    return guards.filter(g => 
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.employee_id?.toLowerCase().includes(search.toLowerCase())
    );
  }, [guards, search]);

  const getGuardOffDays = (guardId: number) => {
    return events.filter(e => 
      e.type === 'off_day' && e.meta?.guard_id === guardId
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Guards</h3>
        <div className="relative">
          <IconMapper name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search guards..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 w-full sm:w-64 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
          />
        </div>
      </div>
      <div className="grid gap-2">
        {filteredGuards.map((guard) => {
          const offDays = getGuardOffDays(guard.id);
          return (
            <Card key={guard.id} className="p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-coin-100 dark:bg-coin-900/30 flex items-center justify-center">
                    <IconMapper name="User" size={16} className="text-coin-600 dark:text-coin-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{guard.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{guard.employee_id || 'No ID'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {offDays.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {offDays.length} off day{offDays.length !== 1 ? 's' : ''}
                    </Badge>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => {}}>
                    <IconMapper name="Calendar" size={16} />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// Day Events Modal
function DayEventsModal({ open, onClose, date, events, onEdit }: { 
  open: boolean; 
  onClose: () => void; 
  date: Date | null; 
  events: EventItem[];
  onEdit: (e: EventItem) => void;
}) {
  if (!date) return null;
  
  return (
    <Modal show={open} onClose={onClose} maxWidth="sm">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
        </h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-400">✕</button>
      </div>
      <div className="px-4 py-3 bg-white dark:bg-gray-900 max-h-[60vh] overflow-y-auto">
        {events.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-4">No events on this day</p>
        ) : (
          <div className="space-y-2">
            {events.map((e) => (
              <button
                key={`${e.entity}-${e.entity_id}`}
                onClick={() => { onClose(); onEdit(e); }}
                className={`w-full text-left p-3 rounded-lg text-white hover:opacity-90 transition-opacity ${
                  e.color === 'red' ? 'bg-red-600' : 'bg-coin-700'
                }`}
              >
                <p className="font-medium">{e.title}</p>
                <p className="text-xs opacity-80">{e.type === 'off_day' ? 'Off Day' : 'Holiday'}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

// Add Off Day Modal
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
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Add Off Day</h2>
        <button type="button" onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-400">✕</button>
      </div>
      <div className="px-4 py-4 bg-white dark:bg-gray-900">
        <form className="grid grid-cols-1 gap-3" onSubmit={submit}>
          <div>
            <label className="block text-sm font-medium mb-1">Guard</label>
            <select 
              className="w-full border border-gray-200 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100" 
              value={data.guard_id as any} 
              onChange={(e) => setData('guard_id', Number(e.target.value))}
            >
              {guards.map((g) => (
                <option key={g.id} value={g.id}>{g.name} {g.employee_id ? `(${g.employee_id})` : ''}</option>
              ))}
            </select>
            {errors.guard_id && <p className="text-xs text-red-600 mt-1">{errors.guard_id}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <input 
                type="date" 
                className="w-full border border-gray-200 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100" 
                value={data.start_date} 
                onChange={(e) => setData('start_date', e.target.value)} 
              />
              {errors.start_date && <p className="text-xs text-red-600 mt-1">{errors.start_date}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input 
                type="date" 
                className="w-full border border-gray-200 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100" 
                value={data.end_date || ''} 
                onChange={(e) => setData('end_date', e.target.value)} 
              />
              {errors.end_date && <p className="text-xs text-red-600 mt-1">{errors.end_date}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Reason (optional)</label>
            <input 
              className="w-full border border-gray-200 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100" 
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

// Edit Off Day Modal
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
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit Off Day</h2>
        <button type="button" onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-400">✕</button>
      </div>
      <div className="px-4 py-4 bg-white dark:bg-gray-900">
        <form className="grid grid-cols-1 gap-3" onSubmit={submit}>
          <div>
            <label className="block text-sm font-medium mb-1">Guard</label>
            <select
              className="w-full border border-gray-200 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
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
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <input
                type="date"
                className="w-full border border-gray-200 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
                value={data.start_date}
                onChange={(e) => setData('start_date', e.target.value)}
              />
              {errors.start_date && <p className="text-xs text-red-600 mt-1">{errors.start_date}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input
                type="date"
                className="w-full border border-gray-200 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
                value={data.end_date || ''}
                onChange={(e) => setData('end_date', e.target.value)}
              />
              {errors.end_date && <p className="text-xs text-red-600 mt-1">{errors.end_date}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Reason (optional)</label>
            <input
              className="w-full border border-gray-200 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
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
              className="px-4 py-2 text-sm rounded-md bg-red-700 text-white hover:bg-red-800 dark:bg-red-900/60 dark:hover:bg-red-900"
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
