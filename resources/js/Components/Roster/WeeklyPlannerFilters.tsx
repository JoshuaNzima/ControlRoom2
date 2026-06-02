import React from 'react';
import { Button } from '@/Components/ui/button';
import IconMapper from '@/Components/IconMapper';
import { Card } from '@/Components/ui/card';

type ShiftType = 'day' | 'night' | 'morning' | 'evening' | 'custom';

type Zone = { id: number; name: string };
type Supervisor = { id: number; name: string };

interface WeeklyPlannerFiltersProps {
  weekStart: string;
  zoneId: number | '';
  supervisorId: number | '';
  shiftType: ShiftType;
  shiftStartTime: string;
  shiftEndTime: string;
  filtersOpen: boolean;
  activeFilterCount: number;
  zones: Zone[];
  supervisors: Supervisor[];
  planLocked: boolean;
  selectedSupervisorLabel: string;
  onWeekStartChange: (value: string) => void;
  onZoneChange: (value: number | '') => void;
  onSupervisorChange: (value: number | '') => void;
  onShiftTypeChange: (value: ShiftType) => void;
  onShiftStartTimeChange: (value: string) => void;
  onShiftEndTimeChange: (value: string) => void;
  onToggleFilters: () => void;
  onApply: () => void;
  onReset: () => void;
}

export default function WeeklyPlannerFilters({
  weekStart,
  zoneId,
  supervisorId,
  shiftType,
  shiftStartTime,
  shiftEndTime,
  filtersOpen,
  activeFilterCount,
  zones,
  supervisors,
  planLocked,
  selectedSupervisorLabel,
  onWeekStartChange,
  onZoneChange,
  onSupervisorChange,
  onShiftTypeChange,
  onShiftStartTimeChange,
  onShiftEndTimeChange,
  onToggleFilters,
  onApply,
  onReset,
}: WeeklyPlannerFiltersProps) {
  return (
    <Card className="border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="p-4 sm:p-5">
        <div className="sm:hidden flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <IconMapper name="Filter" size={16} />
            Filters
            {activeFilterCount > 0 ? (
              <span className="rounded-full bg-coin-700 px-1.5 py-0.5 text-xs text-white">
                {activeFilterCount}
              </span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onToggleFilters}
            className="text-sm text-coin-700 hover:underline dark:text-coin-300"
          >
            {filtersOpen ? 'Hide' : 'Show'}
          </button>
        </div>

        <div className={`${filtersOpen ? 'block' : 'hidden'} sm:block`}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Week Start">
              <input
                type="date"
                className="w-full rounded-md border border-gray-200 bg-white p-2 text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                value={weekStart}
                onChange={(event) => onWeekStartChange(event.target.value)}
              />
            </Field>

            <Field label="Zone">
              <select
                className="w-full rounded-md border border-gray-200 bg-white p-2 text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                value={zoneId as any}
                onChange={(event) => onZoneChange(event.target.value ? Number(event.target.value) : '')}
              >
                <option value="">All Zones</option>
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Supervisor">
              <select
                className="w-full rounded-md border border-gray-200 bg-white p-2 text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                value={supervisorId as any}
                onChange={(event) => onSupervisorChange(event.target.value ? Number(event.target.value) : '')}
              >
                <option value="">Select Supervisor</option>
                {supervisors.map((supervisor) => (
                  <option key={supervisor.id} value={supervisor.id}>
                    {supervisor.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Shift Type">
              <select
                className="w-full rounded-md border border-gray-200 bg-white p-2 text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                value={shiftType}
                onChange={(event) => onShiftTypeChange(event.target.value as ShiftType)}
              >
                <option value="day">Day</option>
                <option value="night">Night</option>
                <option value="morning">Morning</option>
                <option value="evening">Evening</option>
                <option value="custom">Custom</option>
              </select>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Field label="Start time" compact>
                  <input
                    type="time"
                    className="w-full rounded-md border border-gray-200 bg-white p-2 text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                    value={shiftStartTime}
                    onChange={(event) => onShiftStartTimeChange(event.target.value)}
                  />
                </Field>
                <Field label="End time" compact>
                  <input
                    type="time"
                    className="w-full rounded-md border border-gray-200 bg-white p-2 text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                    value={shiftEndTime}
                    onChange={(event) => onShiftEndTimeChange(event.target.value)}
                  />
                </Field>
              </div>
            </Field>
          </div>

          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {selectedSupervisorLabel ? (
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                    planLocked
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                  }`}
                >
                  <IconMapper name={planLocked ? 'Lock' : 'Unlock'} size={12} />
                  {planLocked ? 'Published (Locked)' : 'Draft Mode'}
                </span>
              ) : (
                'Select a supervisor to enable plan editing'
              )}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" className="bg-coin-700 text-white hover:bg-coin-600" onClick={onApply}>
                <IconMapper name="Filter" size={16} className="mr-2" />
                Apply
              </Button>
              <Button type="button" variant="secondary" onClick={onReset}>
                Reset
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function Field({ label, children, compact = false }: { label: string; children: React.ReactNode; compact?: boolean }) {
  return (
    <div>
      <label className={`mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300 ${compact ? 'text-xs text-gray-500 dark:text-gray-400' : ''}`}>
        {label}
      </label>
      {children}
    </div>
  );
}
