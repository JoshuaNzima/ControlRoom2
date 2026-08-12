import React from 'react';
import { Button } from '@/Components/ui/button';
import { Card } from '@/Components/ui/card';
import IconMapper from '@/Components/IconMapper';

type CellTone = 'neutral' | 'soft' | 'success' | 'warning' | 'danger';

export type WeeklyRosterSectionCell = {
  label: string;
  value: string;
  tone: CellTone;
  badges?: string[];
  onClick: () => void;
};

export type WeeklyRosterSectionAction = {
  label: string;
  onClick: () => void;
  tone?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
};

export type WeeklyRosterSectionRow = {
  id: number;
  name: string;
  employeeId?: string;
  typeLabel: string;
  selected?: boolean;
  onSelectToggle?: () => void;
  cells: WeeklyRosterSectionCell[];
  actions?: WeeklyRosterSectionAction[];
};

interface WeeklyRosterSectionProps {
  title: string;
  description: string;
  icon: string;
  rows: WeeklyRosterSectionRow[];
  bulkAction?: WeeklyRosterSectionAction;
  emptyLabel?: string;
}

const toneClasses: Record<CellTone, string> = {
  neutral:
    'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400 dark:hover:border-gray-700',
  soft:
    'border-gray-200 bg-gray-50 text-gray-900 hover:border-gray-300 hover:bg-white dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800',
  success:
    'border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200',
  warning:
    'border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200',
  danger:
    'border-rose-200 bg-rose-50 text-rose-900 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200',
};

export default function WeeklyRosterSection({
  title,
  description,
  icon,
  rows,
  bulkAction,
  emptyLabel = 'No guards in this section.',
}: WeeklyRosterSectionProps) {
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

          {bulkAction ? (
            <Button
              type="button"
              variant={bulkAction.tone === 'danger' ? 'destructive' : 'secondary'}
              className="shrink-0"
              onClick={bulkAction.onClick}
              disabled={bulkAction.disabled}
            >
              <IconMapper name="LayoutGrid" size={16} className="mr-2" />
              {bulkAction.label}
            </Button>
          ) : null}
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
                {row.onSelectToggle ? (
                  <input
                    type="checkbox"
                    checked={!!row.selected}
                    onChange={row.onSelectToggle}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-coin-700 focus:ring-coin-700 dark:border-gray-600"
                  />
                ) : null}

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">{row.name}</h4>
                    <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                      {row.typeLabel}
                    </span>
                  </div>
                  {row.employeeId ? (
                    <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Employee ID {row.employeeId}</p>
                  ) : null}
                </div>
              </div>

              {row.actions?.length ? (
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  {row.actions.map((action) => (
                    <Button
                      key={action.label}
                      type="button"
                      size="sm"
                      variant={action.tone === 'danger' ? 'destructive' : action.tone === 'secondary' ? 'secondary' : 'default'}
                      onClick={action.onClick}
                      disabled={action.disabled}
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-7">
              {row.cells.map((cell) => (
                <button
                  key={`${row.id}-${cell.label}`}
                  type="button"
                  onClick={cell.onClick}
                  className={`group min-h-[62px] rounded-lg border px-3 py-2 text-left transition-colors ${toneClasses[cell.tone]}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold uppercase text-current/60">{cell.label}</span>
                    <IconMapper
                      name="ChevronRight"
                      size={14}
                      className="text-current/35 transition-transform group-hover:translate-x-0.5"
                    />
                  </div>

                  <div className="mt-1.5">
                    <div className="line-clamp-2 text-sm font-semibold leading-snug">{cell.value}</div>
                    {cell.badges?.length ? (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {cell.badges.map((badge) => (
                          <span
                            key={badge}
                            className="inline-flex items-center rounded-md bg-black/5 px-1.5 py-0.5 text-[10px] font-semibold text-current/75 dark:bg-white/10"
                          >
                            {badge}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>
    </Card>
  );
}
