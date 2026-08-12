import React from 'react';

type BadgeType = 'attendance' | 'guard' | 'guard_type' | 'assignment';
type BadgeVariant = 'filled' | 'outlined';

interface StatusBadgeProps {
  status: string;
  type: BadgeType;
  variant?: BadgeVariant;
  className?: string;
}

const ATTENDANCE_STATUSES: Record<string, { label: string; filled: string; outlined: string }> = {
  present: {
    label: 'Present',
    filled: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
    outlined: 'border border-green-300 text-green-800 dark:border-green-700 dark:text-green-200',
  },
  late: {
    label: 'Late',
    filled: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
    outlined: 'border border-yellow-300 text-yellow-800 dark:border-yellow-700 dark:text-yellow-200',
  },
  absent: {
    label: 'Absent',
    filled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
    outlined: 'border border-red-300 text-red-800 dark:border-red-700 dark:text-red-200',
  },
  half_day: {
    label: 'Half Day',
    filled: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200',
    outlined: 'border border-orange-300 text-orange-800 dark:border-orange-700 dark:text-orange-200',
  },
};

const GUARD_STATUSES: Record<string, { label: string; filled: string; outlined: string }> = {
  active: {
    label: 'Active',
    filled: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
    outlined: 'border border-green-300 text-green-800 dark:border-green-700 dark:text-green-200',
  },
  inactive: {
    label: 'Inactive',
    filled: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    outlined: 'border border-gray-300 text-gray-800 dark:border-gray-600 dark:text-gray-200',
  },
  suspended: {
    label: 'Suspended',
    filled: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
    outlined: 'border border-yellow-300 text-yellow-800 dark:border-yellow-700 dark:text-yellow-200',
  },
  dismissed: {
    label: 'Dismissed',
    filled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
    outlined: 'border border-red-300 text-red-800 dark:border-red-700 dark:text-red-200',
  },
  absconded: {
    label: 'Absconded',
    filled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
    outlined: 'border border-red-300 text-red-800 dark:border-red-700 dark:text-red-200',
  },
  resigned: {
    label: 'Resigned',
    filled: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200',
    outlined: 'border border-purple-300 text-purple-800 dark:border-purple-700 dark:text-purple-200',
  },
  retired: {
    label: 'Retired',
    filled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
    outlined: 'border border-blue-300 text-blue-800 dark:border-blue-700 dark:text-blue-200',
  },
};

const GUARD_TYPE_STATUSES: Record<string, { label: string; filled: string; outlined: string }> = {
  permanent: {
    label: 'Permanent',
    filled: 'bg-coin-100 text-coin-800 dark:bg-coin-900/30 dark:text-coin-200',
    outlined: 'border border-coin-300 text-coin-800 dark:border-coin-700 dark:text-coin-200',
  },
  reliever: {
    label: 'Reliever',
    filled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
    outlined: 'border border-blue-300 text-blue-800 dark:border-blue-700 dark:text-blue-200',
  },
  standby: {
    label: 'Standby',
    filled: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
    outlined: 'border border-yellow-300 text-yellow-800 dark:border-yellow-700 dark:text-yellow-200',
  },
};

const ASSIGNMENT_STATUSES: Record<string, { label: string; filled: string; outlined: string }> = {
  permanent: {
    label: 'Permanent',
    filled: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200',
    outlined: 'border border-emerald-300 text-emerald-800 dark:border-emerald-700 dark:text-emerald-200',
  },
  temporary: {
    label: 'Temporary',
    filled: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200',
    outlined: 'border border-amber-300 text-amber-800 dark:border-amber-700 dark:text-amber-200',
  },
};

function getStatusConfig(status: string, type: BadgeType) {
  const maps: Record<BadgeType, Record<string, { label: string; filled: string; outlined: string }>> = {
    attendance: ATTENDANCE_STATUSES,
    guard: GUARD_STATUSES,
    guard_type: GUARD_TYPE_STATUSES,
    assignment: ASSIGNMENT_STATUSES,
  };

  return maps[type]?.[status] ?? {
    label: status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' '),
    filled: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    outlined: 'border border-gray-300 text-gray-800 dark:border-gray-600 dark:text-gray-200',
  };
}

export default function StatusBadge({ status, type, variant = 'filled', className = '' }: StatusBadgeProps) {
  const config = getStatusConfig(status, type);
  const classes = variant === 'outlined' ? config.outlined : config.filled;

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${classes} ${className}`}>
      {config.label}
    </span>
  );
}
