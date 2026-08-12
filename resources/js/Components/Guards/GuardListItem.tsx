import React, { ReactNode } from 'react';
import { Link } from '@inertiajs/react';
import IconMapper from '@/Components/IconMapper';
import StatusBadge from '@/Components/Guards/StatusBadge';

interface Guard {
  id: number;
  employee_id: string;
  name: string;
  phone?: string;
  status: string;
  guard_type?: 'permanent' | 'reliever' | 'standby';
  is_on_duty?: boolean;
  attendance?: {
    id: number;
    check_in_time: string;
    check_out_time?: string | null;
    status: string;
    site?: string | null;
    hours_worked?: number | null;
  } | null;
  current_assignment?: {
    site_name: string;
    client_name: string;
  } | null;
  zone?: string | null;
  supervisor_name?: string | null;
}

interface GuardListItemProps {
  guard: Guard;
  showAttendance?: boolean;
  showAssignment?: boolean;
  showZone?: boolean;
  showSupervisor?: boolean;
  selected?: boolean;
  bulkMode?: boolean;
  onToggleSelect?: (id: number) => void;
  detailRoute?: string;
  actions?: ReactNode;
}

export default function GuardListItem({
  guard,
  showAttendance = true,
  showAssignment = false,
  showZone = false,
  showSupervisor = false,
  selected = false,
  bulkMode = false,
  onToggleSelect,
  detailRoute,
  actions,
}: GuardListItemProps) {
  return (
    <div
      className={`p-4 transition ${
        selected ? 'bg-coin-50 dark:bg-coin-900/15' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Guard identity */}
        <div className="flex items-center gap-3">
          {bulkMode && (
            <input
              type="checkbox"
              checked={selected}
              onChange={() => onToggleSelect?.(guard.id)}
              className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-coin-600 focus:ring-coin-500 flex-shrink-0"
            />
          )}
          <div className="w-12 h-12 bg-gradient-to-br from-coin-500 to-coin-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            {guard.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-gray-900 dark:text-gray-100 truncate">{guard.name}</h4>
              {guard.guard_type && guard.guard_type !== 'permanent' && (
                <StatusBadge status={guard.guard_type} type="guard_type" />
              )}
              {guard.is_on_duty && (
                <span className="px-3 py-1 text-xs font-bold bg-green-500 text-white rounded-full">
                  On Duty
                </span>
              )}
              {guard.status && guard.status !== 'active' && (
                <StatusBadge status={guard.status} type="guard" />
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {guard.employee_id}
              {guard.phone && ` • ${guard.phone}`}
            </p>
            {(showAssignment || showZone || showSupervisor) && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">
                {showZone && guard.zone && <span>{guard.zone}</span>}
                {showZone && guard.zone && showAssignment && guard.current_assignment && <span> • </span>}
                {showAssignment && guard.current_assignment && (
                  <span>{guard.current_assignment.client_name} — {guard.current_assignment.site_name}</span>
                )}
                {showSupervisor && guard.supervisor_name && <span> • {guard.supervisor_name}</span>}
              </p>
            )}
          </div>
        </div>

        {/* Attendance info */}
        {showAttendance && (
          <div className="flex-1 min-w-0">
            {guard.attendance ? (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <IconMapper name="Clock" size={14} />
                  <span>In: {guard.attendance.check_in_time}</span>
                  <StatusBadge status={guard.attendance.status} type="attendance" />
                  {guard.attendance.site && (
                    <span className="text-coin-600 dark:text-coin-400 truncate">@ {guard.attendance.site}</span>
                  )}
                </div>
                {guard.attendance.check_out_time && (
                  <div className="flex items-center gap-2 mt-1">
                    <IconMapper name="CheckCircle" size={14} />
                    <span>Out: {guard.attendance.check_out_time}</span>
                    <span className="text-purple-600">({guard.attendance.hours_worked ?? 0}h)</span>
                  </div>
                )}
              </div>
            ) : (
              <span className="text-sm text-gray-400 dark:text-gray-500">No attendance today</span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {detailRoute && (
            <Link
              href={detailRoute}
              className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
              title="View Details"
            >
              <IconMapper name="Eye" size={18} />
            </Link>
          )}
          {actions}
        </div>
      </div>
    </div>
  );
}
