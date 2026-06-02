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
      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
      : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="bg-gradient-to-r from-coin-700 via-coin-600 to-coin-500 px-5 py-6 text-white sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white">
                <IconMapper name="CalendarDays" size={28} />
              </span>
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-bold sm:text-3xl">Weekly Planner</h1>
                <p className="mt-1 max-w-2xl text-sm text-coin-100">
                  Schedule and manage guard assignments for the week.
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${statusTone}`}>
                <IconMapper name={planStatus === 'published' ? 'Lock' : 'Edit3'} size={12} />
                {statusLabel}
              </span>
              {planLocked ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
                  Locked after publish
                </span>
              ) : null}
              {draftCount > 0 ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
                  {draftCount} unsaved change{draftCount === 1 ? '' : 's'}
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              className="border-0 bg-white/20 text-white hover:bg-white/30"
              onClick={onSaveDraft}
              disabled={savingDraft || planLocked || draftCount === 0}
            >
              <IconMapper name="Save" size={16} className="mr-2" />
              Save Draft
            </Button>
            <Button
              type="button"
              className="bg-white text-coin-700 hover:bg-coin-50"
              onClick={onPublish}
              disabled={publishing || planLocked || draftCount > 0}
            >
              <IconMapper name="Send" size={16} className="mr-2" />
              Publish
            </Button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Week Starting" value={weekStart} />
          <StatTile label="Assigned Guards" value={assignedGuards.toString()} />
          <StatTile label="Relievers" value={relievers.toString()} />
          <StatTile label="Plan Status" value={statusLabel} />
        </div>
      </div>
    </section>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/10 px-3 py-3 backdrop-blur-sm">
      <div className="text-xs text-coin-100">{label}</div>
      <div className="mt-1 break-words text-sm font-bold sm:text-base">{value}</div>
    </div>
  );
}
