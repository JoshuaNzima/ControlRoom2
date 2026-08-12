import React from 'react';
import { Button } from '@/Components/ui/button';
import IconMapper from '@/Components/IconMapper';

type PlanStatus = 'draft' | 'published' | null | undefined;

interface WeeklyPlannerHeaderProps {
  weekStart: string;
  assignedGuards: number;
  relievers: number;
  planStatus: PlanStatus;
  planLocked: boolean;
  draftCount: number;
  savingDraft: boolean;
  publishing: boolean;
  onSaveDraft: () => void;
  onPublish: () => void;
}

export default function WeeklyPlannerHeader({
  weekStart,
  assignedGuards,
  relievers,
  planStatus,
  planLocked,
  draftCount,
  savingDraft,
  publishing,
  onSaveDraft,
  onPublish,
}: WeeklyPlannerHeaderProps) {
  const statusLabel = planStatus === 'published' ? 'Published' : 'Draft';
  const statusTone =
    planStatus === 'published'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300'
      : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300';

  return (
    <section className="rounded-lg border border-gray-200 bg-white px-4 py-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:px-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-coin-700 dark:border-gray-800 dark:bg-gray-950 dark:text-coin-300">
              <IconMapper name="CalendarDays" size={20} />
            </span>
            <div className="min-w-0">
              <h1 className="text-xl font-semibold text-gray-950 dark:text-gray-100 sm:text-2xl">Weekly roster</h1>
              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                Plan assignments, off days, relievers, and manual shifts.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatTile label="Week" value={weekStart} />
            <StatTile label="Guards" value={assignedGuards.toString()} />
            <StatTile label="Relievers" value={relievers.toString()} />
            <StatTile label="Status" value={statusLabel} />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              className="border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
              onClick={onSaveDraft}
              disabled={savingDraft || planLocked || draftCount === 0}
            >
              <IconMapper name="Save" size={16} className="mr-2" />
              Save draft
            </Button>
            <Button
              type="button"
              className="bg-coin-700 text-white hover:bg-coin-600"
              onClick={onPublish}
              disabled={publishing || planLocked || draftCount > 0}
            >
              <IconMapper name="Send" size={16} className="mr-2" />
              Publish
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium ${statusTone}`}>
          <IconMapper name={planStatus === 'published' ? 'Lock' : 'Edit3'} size={12} />
          {statusLabel}
        </span>
        {planLocked ? (
          <span className="inline-flex items-center rounded-md border border-gray-200 px-2.5 py-1 text-xs text-gray-600 dark:border-gray-800 dark:text-gray-300">
            Locked after publish
          </span>
        ) : null}
        {draftCount > 0 ? (
          <span className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300">
            {draftCount} unsaved change{draftCount === 1 ? '' : 's'}
          </span>
        ) : null}
      </div>
    </section>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-800 dark:bg-gray-950">
      <div className="text-[11px] font-medium uppercase text-gray-500 dark:text-gray-400">{label}</div>
      <div className="mt-0.5 break-words text-sm font-semibold text-gray-950 dark:text-gray-100">{value}</div>
    </div>
  );
}
