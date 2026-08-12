import React, { useState, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import IconMapper from '@/Components/IconMapper';

interface Shift {
  id: number;
  guard_id: number;
  guard_name: string | null;
  guard_phone: string | null;
  position: string | null;
  site_id: number;
  site_name: string | null;
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  shift_type: string | null;
  status: string;
  status_color: string;
  is_late: boolean;
  actual_start_time: string | null;
  actual_end_time: string | null;
}

interface Site {
  id: number;
  name: string;
}

interface ClientSchedulesProps {
  auth: {
    user: {
      id: number;
      name: string;
      email: string;
    };
  };
  client: {
    id: number;
    name: string;
  } | null;
  shifts: Shift[];
  sites: Site[];
  filters: {
    start_date: string;
    end_date: string;
  };
}

const StatusBadge: React.FC<{ status: string; color: string }> = ({ status, color }) => {
  const colorClasses: Record<string, string> = {
    green: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    red: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    gray: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${colorClasses[color] || colorClasses.gray}`}>
      {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
    </span>
  );
};

export default function ClientSchedules({ auth, client, shifts, sites, filters }: ClientSchedulesProps) {
  const [startDate, setStartDate] = useState(filters.start_date);
  const [endDate, setEndDate] = useState(filters.end_date);
  const [selectedSite, setSelectedSite] = useState<string>('all');

  const handleFilter = () => {
    router.get(route('client.schedules'), {
      start_date: startDate,
      end_date: endDate,
    }, { preserveState: true });
  };

  const filteredShifts = useMemo(() => {
    if (selectedSite === 'all') return shifts;
    return shifts.filter(s => s.site_id === parseInt(selectedSite));
  }, [shifts, selectedSite]);

  // Group shifts by date
  const shiftsByDate = useMemo(() => {
    const grouped: Record<string, Shift[]> = {};
    filteredShifts.forEach(shift => {
      const date = shift.date || 'Unknown';
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(shift);
    });
    return grouped;
  }, [filteredShifts]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  if (!client) {
    return (
      <AuthenticatedLayout header="Shift Schedules" user={auth?.user}>
        <Head title="Shift Schedules" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Card className="p-8 text-center dark:bg-gray-800 dark:border-gray-700">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-amber-100 dark:bg-amber-900/20 rounded-full">
                <IconMapper name="AlertCircle" size={32} className="text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">No Client Assigned</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  Your account is not linked to any client.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout header="Shift Schedules" user={auth?.user}>
      <Head title="Shift Schedules" />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-gradient-to-br from-red-900 via-red-800 to-rose-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/10 rounded-lg backdrop-blur-sm">
                  <IconMapper name="Calendar" size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">Shift Schedules</h1>
                  <p className="text-red-100 text-sm mt-0.5">View guard shift schedules</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Filters */}
          <Card className="p-4 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Site</label>
                <select
                  value={selectedSite}
                  onChange={(e) => setSelectedSite(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                >
                  <option value="all">All Sites</option>
                  {sites.map(site => (
                    <option key={site.id} value={site.id}>{site.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <Button onClick={handleFilter} className="bg-red-600 hover:bg-red-700 text-white">
                  <IconMapper name="Filter" size={16} className="mr-2" />
                  Apply
                </Button>
              </div>
            </div>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <Card className="p-3 sm:p-4 dark:bg-gray-800 dark:border-gray-700">
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Total Shifts</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{shifts.length}</p>
            </Card>
            <Card className="p-3 sm:p-4 dark:bg-gray-800 dark:border-gray-700">
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Completed</p>
              <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
                {shifts.filter(s => s.status === 'completed').length}
              </p>
            </Card>
            <Card className="p-3 sm:p-4 dark:bg-gray-800 dark:border-gray-700">
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">In Progress</p>
              <p className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
                {shifts.filter(s => s.status === 'in_progress').length}
              </p>
            </Card>
            <Card className="p-3 sm:p-4 dark:bg-gray-800 dark:border-gray-700">
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Scheduled</p>
              <p className="text-xl sm:text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {shifts.filter(s => s.status === 'scheduled').length}
              </p>
            </Card>
          </div>

          {/* Shifts by Date */}
          {Object.keys(shiftsByDate).length === 0 ? (
            <Card className="p-8 text-center dark:bg-gray-800 dark:border-gray-700">
              <IconMapper name="CalendarOff" size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No shifts found for the selected period</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {Object.entries(shiftsByDate).map(([date, dateShifts]) => (
                <Card key={date} className="p-4 dark:bg-gray-800 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <IconMapper name="Calendar" size={18} className="text-red-600 dark:text-red-400" />
                      {formatDate(date)}
                    </h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{dateShifts.length} shifts</span>
                  </div>
                  <div className="space-y-2">
                    {dateShifts.map((shift) => (
                      <div key={shift.id} className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                              <IconMapper name="User" size={18} className="text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                                {shift.guard_name || 'Unassigned'}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {shift.site_name} {shift.position && `· ${shift.position}`}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {shift.start_time} - {shift.end_time}
                            </p>
                            <div className="flex items-center justify-end gap-2">
                              <StatusBadge status={shift.status} color={shift.status_color} />
                              {shift.is_late && (
                                <span className="text-xs text-red-600 dark:text-red-400">(Late)</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
