import React, { useState, useMemo } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import IconMapper from '@/Components/IconMapper';
import { format, parseISO } from 'date-fns';

interface Trainee {
  id: number;
  name: string;
  status: string;
  attendance?: AttendanceRecord[];
}

interface AttendanceRecord {
  id: number;
  date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes: string | null;
  recorder?: { id: number; name: string };
}

interface SummaryItem {
  trainee_id: number;
  status: string;
  count: number;
}

interface PageProps {
  [key: string]: any;
  auth: { user: any };
  trainees: Trainee[];
  summary: SummaryItem[];
  filters: { date: string; trainee_id?: number };
}

const fieldClassName = 'w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-coin-500 focus:border-coin-500';

export default function AttendanceIndex() {
  const props = usePage<PageProps>().props;
  const auth = props.auth || {};
  const trainees = props.trainees || [];
  const summary = props.summary || [];
  const filters = props.filters || { date: format(new Date(), 'yyyy-MM-dd') };
  
  const [selectedDate, setSelectedDate] = useState(filters.date || format(new Date(), 'yyyy-MM-dd'));
  const [attendanceData, setAttendanceData] = useState<Record<number, { status: string; check_in: string; check_out: string; notes: string }>>({});
  const [loading, setLoading] = useState(false);

  const statusColors: Record<string, string> = {
    present: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    absent: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400',
    late: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    excused: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  };

  const handleStatusChange = (traineeId: number, status: string) => {
    setAttendanceData(prev => ({
      ...prev,
      [traineeId]: { ...(prev[traineeId] || {}), status }
    }));
  };

  const handleTimeChange = (traineeId: number, field: 'check_in' | 'check_out', value: string) => {
    setAttendanceData(prev => ({
      ...prev,
      [traineeId]: { ...(prev[traineeId] || {}), [field]: value }
    }));
  };

  const handleNotesChange = (traineeId: number, value: string) => {
    setAttendanceData(prev => ({
      ...prev,
      [traineeId]: { ...(prev[traineeId] || {}), notes: value }
    }));
  };

  const submitAttendance = () => {
    const attendances = Object.entries(attendanceData)
      .filter(([_, data]) => data.status)
      .map(([traineeId, data]) => ({
        trainee_id: parseInt(traineeId),
        status: data.status,
        check_in_time: data.check_in || null,
        check_out_time: data.check_out || null,
        notes: data.notes || null,
      }));

    if (attendances.length === 0) {
      alert('Please select at least one attendance status');
      return;
    }

    setLoading(true);
    router.post(route('training.attendance.store.bulk'), {
      date: selectedDate,
      attendances,
    }, {
      onSuccess: () => {
        setAttendanceData({});
        setLoading(false);
      },
      onError: () => setLoading(false),
    });
  };

  const getAttendanceForTrainee = (trainee: Trainee) => {
    return trainee.attendance?.[0];
  };

  return (
    <AuthenticatedLayout header="Trainee Attendance" user={auth.user}>
      <Head title="Attendance" />
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Attendance Tracking</h2>
          <p className="text-gray-600 dark:text-gray-400">Record and manage trainee daily attendance</p>
        </div>

        {/* Date Filter */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  router.get(route('training.attendance.index'), { date: e.target.value }, { preserveState: true });
                }}
                className={fieldClassName}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={submitAttendance}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                <IconMapper name="Save" className="h-4 w-4" />
                {loading ? 'Saving...' : 'Save Attendance'}
              </button>
              <a
                href={route('training.attendance.report')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                <IconMapper name="FileText" className="h-4 w-4" />
                Report
              </a>
            </div>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Trainee</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Check In</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Check Out</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Notes</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Current Status</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {trainees.map((trainee) => {
                  const currentAttendance = getAttendanceForTrainee(trainee);
                  const currentData = attendanceData[trainee.id];
                  return (
                    <tr key={trainee.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{trainee.name}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <select
                          value={currentData?.status || currentAttendance?.status || ''}
                          onChange={(e) => handleStatusChange(trainee.id, e.target.value)}
                          className={fieldClassName}
                        >
                          <option value="">Select...</option>
                          <option value="present">Present</option>
                          <option value="absent">Absent</option>
                          <option value="late">Late</option>
                          <option value="excused">Excused</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <input
                          type="time"
                          value={currentData?.check_in || currentAttendance?.check_in_time?.slice(0, 5) || ''}
                          onChange={(e) => handleTimeChange(trainee.id, 'check_in', e.target.value)}
                          className={fieldClassName}
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <input
                          type="time"
                          value={currentData?.check_out || currentAttendance?.check_out_time?.slice(0, 5) || ''}
                          onChange={(e) => handleTimeChange(trainee.id, 'check_out', e.target.value)}
                          className={fieldClassName}
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <input
                          type="text"
                          value={currentData?.notes || currentAttendance?.notes || ''}
                          onChange={(e) => handleNotesChange(trainee.id, e.target.value)}
                          placeholder="Notes..."
                          className={fieldClassName}
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {currentAttendance && (
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[currentAttendance.status]}`}>
                            {currentAttendance.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {trainees.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No trainees found for attendance tracking
            </div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
