import React from 'react';

interface MiniStatProps {
  label: string;
  value: string | number;
  color?: string;
}

export default function MiniStat({ label, value, color = 'text-gray-900 dark:text-gray-100' }: MiniStatProps) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3">
      <div className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</div>
      <div className={`text-lg font-semibold ${color}`}>{value}</div>
    </div>
  );
}
