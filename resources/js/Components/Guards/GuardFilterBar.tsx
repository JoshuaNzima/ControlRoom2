import React from 'react';
import IconMapper from '@/Components/IconMapper';

interface FilterBarFilters {
  search?: boolean;
  status?: boolean;
  guardType?: boolean;
  zone?: boolean;
  client?: boolean;
  supervisor?: boolean;
  sort?: boolean;
  riskLevel?: boolean;
  onDuty?: boolean;
}

type SortField = 'name' | 'employee_id' | 'status';
type SortDirection = 'asc' | 'desc';

interface GuardFilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterStatus: string;
  onFilterStatusChange: (value: string) => void;
  filterGuardType: string;
  onFilterGuardTypeChange: (value: string) => void;
  sortField: SortField;
  sortDirection: SortDirection;
  onSortChange: (field: SortField, direction: SortDirection) => void;
  enabled?: FilterBarFilters;
  bulkMode?: boolean;
  onToggleBulkMode?: () => void;
  totalCount?: number;
  filteredCount?: number;
}

const DEFAULT_ENABLED: FilterBarFilters = {
  search: true,
  status: true,
  guardType: true,
  sort: true,
};

export default function GuardFilterBar({
  searchTerm,
  onSearchChange,
  filterStatus,
  onFilterStatusChange,
  filterGuardType,
  onFilterGuardTypeChange,
  sortField,
  sortDirection,
  onSortChange,
  enabled = DEFAULT_ENABLED,
  bulkMode = false,
  onToggleBulkMode,
  totalCount = 0,
  filteredCount = 0,
}: GuardFilterBarProps) {
  const handleSort = (field: SortField) => {
    const newDirection: SortDirection = sortField === field
      ? (sortDirection === 'asc' ? 'desc' : 'asc')
      : 'asc';
    onSortChange(field, newDirection);
  };

  const sortButton = (field: SortField, label: string) => {
    const isActive = sortField === field;
    return (
      <button
        onClick={() => handleSort(field)}
        className={`px-4 py-2 rounded-lg font-medium transition text-sm ${
          isActive
            ? 'bg-coin-100 text-coin-700 dark:bg-coin-900/30 dark:text-coin-200'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100'
        }`}
      >
        {label}{' '}
        {isActive && (
          sortDirection === 'asc'
            ? <IconMapper name="ArrowUp" size={14} className="inline" />
            : <IconMapper name="ArrowDown" size={14} className="inline" />
        )}
      </button>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-4">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        {enabled.search && (
          <div className="flex-1">
            <div className="relative">
              <IconMapper name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search guards by name or ID..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-coin-500"
              />
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {/* Status Filter */}
          {enabled.status && (
            <select
              value={filterStatus}
              onChange={(e) => onFilterStatusChange(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-coin-500 text-sm"
            >
              <option value="all">All Status</option>
              <option value="on_duty">On Duty</option>
              <option value="off_duty">Off Duty</option>
            </select>
          )}

          {/* Guard Type Filter */}
          {enabled.guardType && (
            <select
              value={filterGuardType}
              onChange={(e) => onFilterGuardTypeChange(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-coin-500 text-sm"
            >
              <option value="all">All Types</option>
              <option value="permanent">Permanent</option>
              <option value="reliever">Reliever</option>
              <option value="standby">Standby</option>
            </select>
          )}

          {/* Sort */}
          {enabled.sort && (
            <>
              {sortButton('name', 'Name')}
              {sortButton('employee_id', 'ID')}
            </>
          )}

          {/* Bulk toggle */}
          {onToggleBulkMode && (
            <button
              onClick={onToggleBulkMode}
              className={`px-4 py-2 rounded-lg font-medium transition text-sm flex items-center gap-1 ${
                bulkMode
                  ? 'bg-coin-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100'
              }`}
            >
              <IconMapper name={bulkMode ? 'CheckSquare' : 'Square'} size={14} />
              Bulk
            </button>
          )}
        </div>
      </div>

      {/* Count display */}
      {(totalCount > 0 || filteredCount > 0) && (
        <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
          {filteredCount !== totalCount ? (
            <span>{filteredCount} of {totalCount} guards</span>
          ) : (
            <span>{totalCount} guards</span>
          )}
        </div>
      )}
    </div>
  );
}
