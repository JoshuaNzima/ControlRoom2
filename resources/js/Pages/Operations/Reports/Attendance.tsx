import React from 'react';
import { Head } from '@inertiajs/react';
import OperationsLayout from '@/Layouts/OperationsLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import IconMapper from '@/Components/IconMapper';
import { Badge } from '@/Components/ui/badge';

interface AttendanceRecord {
  id: number;
  guard?: { name: string; employee_id: string };
  site?: { name: string };
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: string;
}

interface Props {
  attendance: {
    data: AttendanceRecord[];
    current_page: number;
    last_page: number;
  };
  stats: {
    total: number;
    checked_in: number;
    checked_out: number;
    absent: number;
  };
  date: string;
  auth?: { user?: any };
}

export default function AttendanceReport({ attendance, stats, date, auth }: Props) {
  const user = auth?.user;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800';
      case 'absent': return 'bg-red-100 text-red-800';
      case 'late': return 'bg-yellow-100 text-yellow-800';
      case 'early_out': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <OperationsLayout title="Attendance Report" user={user} showQrScanner={true}>
      <Head title="Attendance Report" />

      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-xl sm:text-2xl font-bold text-red-900 dark:text-gray-100">Attendance Report</h2>
          <input
            type="date"
            value={date}
            onChange={(e) => window.location.href = route('operations.reports.attendance', { date: e.target.value })}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <Card className="dark:bg-gray-900 dark:border-gray-800">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
              <p className="text-xs text-gray-500">Total</p>
            </CardContent>
          </Card>
          <Card className="dark:bg-gray-900 dark:border-gray-800">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-green-600">{stats.checked_in}</p>
              <p className="text-xs text-gray-500">Checked In</p>
            </CardContent>
          </Card>
          <Card className="dark:bg-gray-900 dark:border-gray-800">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-blue-600">{stats.checked_out}</p>
              <p className="text-xs text-gray-500">Checked Out</p>
            </CardContent>
          </Card>
          <Card className="dark:bg-gray-900 dark:border-gray-800">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
              <p className="text-xs text-gray-500">Absent</p>
            </CardContent>
          </Card>
        </div>

        {/* Attendance List */}
        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Daily Attendance</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="space-y-3">
              {attendance.data.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                >
                  <div>
                    <p className="font-medium text-sm dark:text-gray-100">{record.guard?.name || 'Unknown'}</p>
                    <p className="text-xs text-gray-500">{record.site?.name || 'No site'}</p>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor(record.status)}>{record.status}</Badge>
                    <div className="text-xs text-gray-500 mt-1">
                      {record.check_in && <span>In: {record.check_in}</span>}
                      {record.check_out && <span> • Out: {record.check_out}</span>}
                    </div>
                  </div>
                </div>
              ))}
              {attendance.data.length === 0 && (
                <p className="text-center text-gray-500 py-4">No attendance records for this date</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </OperationsLayout>
  );
}
