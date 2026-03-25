import React from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import SupervisorLayout from '@/Layouts/SupervisorLayout';

type DayStatus = {
  date: string;
  weekday: number;
  statuses: Record<string, { count: number; backdated_count: number }>;
  total: number;
};

type PageProps = {
  month: number;
  year: number;
  days: DayStatus[];
  summary: {
    total_records: number;
    by_status: Record<string, number>;
  };
};

export default function Calendar() {
  const { month, year, days, summary } = usePage().props as any;

  const current = new Date(year, month - 1, 1);

  const goToDay = (isoDate: string) => {
    if (!isoDate) return;
    router.get(route('supervisor.attendance'), { date: isoDate }, { preserveScroll: true });
  };

  const goToMonth = (offset: number) => {
    const target = new Date(year, month - 1 + offset, 1);
    router.get(route('guards.calendar'), {
      month: target.getMonth() + 1,
      year: target.getFullYear(),
    }, { preserveScroll: true });
  };

  const weeks: DayStatus[][] = [];
  if (Array.isArray(days)) {
    const byDate: Record<string, DayStatus> = {};
    days.forEach((d) => { byDate[d.date] = d; });

    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);

    let week: DayStatus[] = [];
    for (let i = 0; i < firstDay.getDay(); i++) {
      week.push({ date: '', weekday: i, statuses: {}, total: 0 });
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateObj = new Date(year, month - 1, d);
      const iso = dateObj.toISOString().slice(0, 10);
      const weekday = dateObj.getDay();
      const dayData = byDate[iso] || { date: iso, weekday, statuses: {}, total: 0 };
      week.push(dayData);
      if (weekday === 6 || d === lastDay.getDate()) {
        while (week.length < 7) {
          week.push({ date: '', weekday: week.length, statuses: {}, total: 0 });
        }
        weeks.push(week);
        week = [];
      }
    }
  }

  const monthLabel = current.toLocaleString(undefined, { month: 'long', year: 'numeric' });

  const statusColors: Record<string, string> = {
    present: 'bg-green-600 text-white dark:bg-green-900/30 dark:text-green-200',
    late: 'bg-yellow-500 text-gray-900 dark:bg-yellow-900/30 dark:text-yellow-200',
    absent: 'bg-red-600 text-white dark:bg-red-900/30 dark:text-red-200',
    half_day: 'bg-orange-500 text-white dark:bg-orange-900/30 dark:text-orange-200',
    leave: 'bg-coin-700 text-white dark:bg-coin-900/40 dark:text-coin-100',
  };

  return (
    <SupervisorLayout title="Attendance Calendar">
      <Head title="Attendance Calendar" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Attendance Calendar</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Monthly view of recorded attendance across all guards. Backdated entries are highlighted.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => goToMonth(-1)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 text-sm"
            >
              Prev
            </button>
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex-1 min-w-0 text-center truncate">
              {monthLabel}
            </div>
            <button
              type="button"
              onClick={() => goToMonth(1)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 text-sm"
            >
              Next
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
            <div key={d} className="text-center uppercase tracking-wide">{d}</div>
          ))}
        </div>

        <div className="space-y-2 bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-200 dark:border-gray-800 p-2 sm:p-4">
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1 sm:gap-2">
              {week.map((day, di) => (
                <div
                  key={`${wi}-${di}`}
                  className={`min-h-[72px] sm:min-h-[96px] rounded-lg border text-xs sm:text-sm flex flex-col p-1.5 sm:p-2
                    ${day.date ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800' : 'border-transparent'}
                    ${day.date && day.total > 0 ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700' : ''}`}
                  onClick={() => {
                    if (day.date && day.total > 0) {
                      goToDay(day.date);
                    }
                  }}
                >
                  {day.date && (
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                        {parseInt(day.date.slice(-2), 10)}
                      </span>
                      {day.total > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-coin-700 text-white">
                          {day.total} rec
                        </span>
                      )}
                    </div>
                  )}
                  {day.date && day.total > 0 && (
                    <div className="space-y-0.5">
                      {Object.entries(day.statuses).map(([status, info]) => (
                        <div key={status} className="flex items-center justify-between gap-1">
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${statusColors[status] || 'bg-gray-600 text-white dark:bg-gray-900/40 dark:text-gray-200'}`}
                          >
                            {status.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] text-gray-800 dark:text-gray-200">
                            {info.count}
                            {info.backdated_count > 0 && (
                              <span className="ml-1 text-[9px] text-yellow-700 dark:text-yellow-300">
                                ({info.backdated_count} backdated)
                              </span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-200 dark:border-gray-800 p-4 space-y-3 text-sm">
          <div className="font-semibold text-gray-900 dark:text-gray-100">Monthly Summary</div>
          <div className="flex flex-wrap gap-2">
            <span className="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-xs">
              Total records: {summary?.total_records ?? 0}
            </span>
            {summary && summary.by_status && (Object.entries(summary.by_status) as [string, number][]).map(([status, count]) => (
              <span
                key={status}
                className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-600 text-white dark:bg-gray-900/40 dark:text-gray-200'}`}
              >
                {status.replace('_', ' ')}: {count}
              </span>
            ))}
          </div>
        </div>
      </div>
    </SupervisorLayout>
  );
}