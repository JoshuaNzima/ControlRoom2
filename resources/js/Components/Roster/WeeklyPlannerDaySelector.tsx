import React from 'react';
import IconMapper from '@/Components/IconMapper';
import { Button } from '@/Components/ui/button';

type DayKey = string;

export type WeeklyPlannerDaySelectorProps = {
  days: DayKey[];
  selectedDay?: DayKey | null;
  onSelectDay: (day: DayKey) => void;
  disabled?: boolean;
};

export default function WeeklyPlannerDaySelector({
  days,
  selectedDay,
  onSelectDay,
  disabled = false,
}: WeeklyPlannerDaySelectorProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200">
          <IconMapper name="CalendarDays" size={18} />
        </span>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-gray-950 dark:text-gray-100">Days</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Select a day to edit assignments</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {days.map((d) => {
          const isSelected = selectedDay ? d === selectedDay : false;
          return (
            <Button
              key={d}
              type="button"
              variant={isSelected ? 'default' : 'secondary'}
              disabled={disabled}
              onClick={() => onSelectDay(d)}
              className={isSelected ? 'bg-coin-700 text-white hover:bg-coin-600' : 'justify-start'}
            >
              <div className="flex w-full items-center justify-between gap-3">
                <span className="text-sm font-medium">
                  {new Date(d).toLocaleDateString(undefined, { weekday: 'short' })}
                </span>
                <span className="text-xs opacity-80">
                  {new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
