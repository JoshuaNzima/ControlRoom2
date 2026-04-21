import React from 'react';
import { Head, Link } from '@inertiajs/react';
import OperationsLayout from '@/Layouts/OperationsLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import IconMapper from '@/Components/IconMapper';
import { Badge } from '@/Components/ui/badge';

interface Shift {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  site?: { name: string };
  guard?: { name: string };
  zone?: { name: string };
}

interface Props {
  shifts: {
    data: Shift[];
    current_page: number;
    last_page: number;
  };
  filters: { date?: string; site_id?: string };
  auth?: { user?: any };
}

export default function ShiftsIndex({ shifts, filters, auth }: Props) {
  const user = auth?.user;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <OperationsLayout title="Shift Roster" user={user} showQrScanner={true}>
      <Head title="Shift Roster" />

      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-xl sm:text-2xl font-bold text-red-900 dark:text-gray-100">Shift Roster</h2>
          <div className="flex gap-2">
            <input
              type="date"
              value={filters.date || ''}
              onChange={(e) => window.location.href = route('operations.shifts.index', { date: e.target.value })}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
            />
          </div>
        </div>

        <div className="grid gap-3 sm:gap-4">
          {shifts.data.map((shift) => (
            <Card key={shift.id} className="dark:bg-gray-900 dark:border-gray-800">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">{shift.site?.name || 'Unknown Site'}</h3>
                      <Badge className={getStatusColor(shift.status)}>{shift.status}</Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {shift.guard?.name || 'Unassigned'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium dark:text-gray-300">
                      {shift.start_time} - {shift.end_time}
                    </p>
                    <p className="text-xs text-gray-500">{shift.zone?.name || 'No zone'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {shifts.data.length === 0 && (
          <Card className="dark:bg-gray-900 dark:border-gray-800">
            <CardContent className="p-8 text-center">
              <IconMapper name="calendar" className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No shifts found</p>
            </CardContent>
          </Card>
        )}

        {shifts.last_page > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {Array.from({ length: shifts.last_page }, (_, i) => i + 1).map((page) => (
              <Link
                key={page}
                href={route('operations.shifts.index', { ...filters, page })}
                className={`px-3 py-1 rounded-md text-sm ${
                  page === shifts.current_page
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {page}
              </Link>
            ))}
          </div>
        )}
      </div>
    </OperationsLayout>
  );
}
