import React from 'react';
import { Card } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import IconMapper from '@/Components/IconMapper';

type DayKey = string;

type CellTone = 'neutral' | 'soft' | 'success' | 'warning' | 'danger';
type AttendanceToday = {
  id: number;
  client_site_id: number | null;
  status: string;
  checked_in: boolean;
  checked_out: boolean;
};

type GuardType = 'permanent' | 'standby' | 'reliever';

export type WeeklyPlannerGuardCell = {
  label: string;
  value: string;
  tone: CellTone;
  badges?: string[];
  onClick: () => void;
};

export type WeeklyPlannerGuardRow = {
  id: number;
  name: string;
  employeeId?: string;
  guardType: GuardType;
  attendanceToday?: AttendanceToday | null;
  cell: WeeklyPlannerGuardCell;
  actions?: { label: string; onClick: () => void; disabled?: boolean; tone?: 'default' | 'secondary' | 'danger' }[];
  onToggleSelect?: () => void;
  selected?: boolean;
};

export type WeeklyPlannerGuardListProps = {
  title: string;
  icon: string;
  description: string;
  rows: WeeklyPlannerGuardRow[];
  emptyLabel?: string;
};

export default function WeeklyPlannerGuardList({
  title,
  icon,
  description,
  rows,
  emptyLabel = 'No guards to display.',
}: WeeklyPlannerGuardListProps) {
  return (
    <Card className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-800 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200">
                <IconMapper name={icon} size={18} />
              </span>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
                <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{description}</p>
              </div>
            </div>
          </div>

          <div />
        </div>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {!rows.length ? (
          <div className="m-4 rounded-lg border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400 sm:m-5">
            {emptyLabel}
          </div>
        ) : null}

        {rows.map((row) => (
          <article key={row.id} className="px-4 py-4 sm:px-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                {row.onToggleSelect ? (
                  <input
                    type="checkbox"
                    checked={!!row.selected}
                    onChange={row.onToggleSelect}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-coin-700 focus:ring-coin-700 dark:border-gray-600"
                  />
                ) : null}

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">{row.name}</h4>
                    <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                      {row.guardType === 'permanent'
                        ? 'Permanent'
                        : row.guardType === 'standby'
                          ? 'Standby'
                          : 'Reliever'}
                    </span>

                    {row.employeeId ? (
                      <Badge variant="secondary" className="rounded-md">
                        Employee {row.employeeId}
                      </Badge>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                {row.actions?.length
                  ? row.actions.map((a) => (
                      <button
                        key={a.label}
                        type="button"
                        onClick={a.onClick}
                        disabled={a.disabled}
                        className={[
                          'rounded-md px-3 py-1.5 text-sm font-medium',
                          a.tone === 'danger'
                            ? 'bg-red-50 text-red-700 hover:bg-red-100'
                            : a.tone === 'secondary'
                              ? 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                              : 'bg-coin-700 text-white hover:bg-coin-600',
                        ].join(' ')}
                      >
                        {a.label}
                      </button>
                    ))
                  : null}
              </div>
            </div>

            <div className="mt-3">
              <button
                type="button"
                onClick={row.cell.onClick}
                className={[
                  'w-full rounded-lg border px-4 py-3 text-left transition-colors',
                  row.cell.tone === 'neutral'
                    ? 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    : row.cell.tone === 'soft'
                      ? 'border-gray-200 bg-gray-50 text-gray-900 hover:bg-white'
                      : row.cell.tone === 'success'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
                        : row.cell.tone === 'warning'
                          ? 'border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100'
                          : 'border-rose-200 bg-rose-50 text-rose-900 hover:bg-rose-100',
                ].join(' ')}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold uppercase text-current/60">{row.cell.label}</span>
                  <IconMapper name="ChevronRight" size={16} className="text-current/35" />
                </div>
                <div className="mt-1.5 line-clamp-2 text-sm font-semibold">{row.cell.value}</div>
                {row.cell.badges?.length ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {row.cell.badges.map((badge) => (
                      <span key={badge} className="rounded-md bg-black/5 px-2 py-0.5 text-[10px] font-semibold text-current/75 dark:bg-white/10">
                        {badge}
                      </span>
                    ))}
                  </div>
                ) : null}
              </button>
            </div>
          </article>
        ))}
      </div>
    </Card>
  );
}
