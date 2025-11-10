import React from 'react';

interface CoverageMeterProps {
  value: number;          // 0-100 percentage
  required: number;       // Required count (e.g., required guards)
  current: number;        // Current count
  label?: string;        // Optional label
  size?: 'sm' | 'md' | 'lg';
  showNumbers?: boolean;
}

export function CoverageMeter({ 
  value, 
  required, 
  current, 
  label,
  size = 'md',
  showNumbers = true 
}: CoverageMeterProps) {
  // Clamp value between 0-100
  const percentage = Math.min(100, Math.max(0, value));
  
  // Determine color based on coverage
  const getColor = (pct: number) => {
    if (pct >= 90) return 'bg-green-500';
    if (pct >= 75) return 'bg-green-400';
    if (pct >= 50) return 'bg-yellow-400';
    if (pct >= 25) return 'bg-orange-400';
    return 'bg-red-500';
  };

  const height = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3'
  }[size];

  // Determine color class for the counter numbers
  const getCounterColor = (cur: number, req: number) => {
    const pct = (cur / req) * 100;
    if (pct >= 90) return 'text-green-600 dark:text-green-400';
    if (pct >= 75) return 'text-green-500 dark:text-green-500';
    if (pct >= 50) return 'text-yellow-600 dark:text-yellow-400';
    if (pct >= 25) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="w-full" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className="relative w-full bg-gray-200 rounded-full overflow-hidden dark:bg-gray-700">
        <div
          className={`absolute left-0 top-0 ${height} rounded-full transition-all duration-700 ease-in-out motion-safe:animate-[expand_0.8s_ease-in-out] ${getColor(percentage)}`}
          style={{ width: `${percentage}%` }}
        />
        <div className={`${height} rounded-full`} />
      </div>
      {(showNumbers || label) && (
        <div className="flex justify-between mt-1 text-xs">
          {label && <span className="text-gray-600 dark:text-gray-400">{label}</span>}
          {showNumbers && (
            <span className={`ml-auto transition-colors duration-500 ${getCounterColor(current, required)}`}>
              {current}/{required}
            </span>
          )}
        </div>
      )}
    </div>
  );
}