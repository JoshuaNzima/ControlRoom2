import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import ControlRoomLayout from '@/Layouts/ControlRoomLayout';
import { Card } from '@/Components/ui/card';
import PageHeader from '@/Components/ui/page-header';
import IconMapper from '@/Components/IconMapper';

type AttendanceRecord = {
  id: number;
  guard_id: number;
  client_site_id: number | null;
  date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  status: string;
  check_in_notes: string | null;
  check_out_notes: string | null;
  guard_relation: {
    id: number;
    name: string;
    employee_id: string;
  } | null;
  client_site: {
    id: number;
    name: string;
    client: {
      id: number;
      name: string;
    } | null;
  } | null;
};

type PageProps = {
  attendance: AttendanceRecord;
  sites: Array<{
    id: number;
    name: string;
    client: { id: number; name: string } | null;
  }>;
  guards: Array<{
    id: number;
    name: string;
    employee_id: string;
  }>;
  isSuperAdmin: boolean;
};

const statusOptions = [
  { value: 'present', label: 'Present', color: 'text-green-700 dark:text-green-400' },
  { value: 'absent', label: 'Absent', color: 'text-red-700 dark:text-red-400' },
  { value: 'late', label: 'Late', color: 'text-yellow-700 dark:text-yellow-400' },
  { value: 'half_day', label: 'Half Day', color: 'text-orange-700 dark:text-orange-400' },
  { value: 'leave', label: 'Leave', color: 'text-blue-700 dark:text-blue-400' },
];

export default function AttendanceEdit() {
  const { attendance, sites, guards, isSuperAdmin } = usePage().props as any;

  const [form, setForm] = useState({
    guard_id: String(attendance.guard_id || ''),
    client_site_id: String(attendance.client_site_id || ''),
    date: attendance.date || '',
    check_in_time: attendance.check_in_time
      ? formatTimeForInput(attendance.check_in_time)
      : '',
    check_out_time: attendance.check_out_time
      ? formatTimeForInput(attendance.check_out_time)
      : '',
    status: attendance.status || 'present',
    check_in_notes: attendance.check_in_notes || '',
    check_out_notes: attendance.check_out_notes || '',
    edit_reason: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function formatTimeForInput(time: string): string {
    if (!time) return '';
    // Handle full datetime format
    if (time.includes('T')) {
      return time.split('T')[1].substring(0, 5);
    }
    if (time.includes(' ')) {
      return time.split(' ')[1].substring(0, 5);
    }
    return time.substring(0, 5);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});

    router.put(route('control-room.attendance.update', { attendance: attendance.id }), form, {
      preserveScroll: true,
      onFinish: () => setSaving(false),
      onSuccess: () => {
        // Redirect handled by controller
      },
      onError: (errs: any) => {
        setErrors(errs);
        setSaving(false);
      },
    });
  };

  const currentGuard = guards.find((g: any) => g.id === Number(form.guard_id));
  const currentSite = sites.find((s: any) => s.id === Number(form.client_site_id));

  return (
    <ControlRoomLayout title="Edit Attendance Record">
      <Head title="Edit Attendance" />

      <div className="max-w-4xl mx-auto mt-6 px-4 sm:px-6 lg:px-8">
        <PageHeader
          title="Edit Attendance Record"
          description={`Editing record for ${attendance.guard_relation?.name || 'Unknown'} on ${attendance.date}`}
          actions={(
            <button
              onClick={() => router.get(route('control-room.attendance.index'))}
              className="w-full sm:w-auto px-4 py-2 border dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <IconMapper name="ArrowLeft" size={18} className="inline mr-2" />
              Back to List
            </button>
          )}
        />

        {/* Edit Policy Notice */}
        {!isSuperAdmin && (
          <div className="mb-6 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-start gap-3">
              <IconMapper name="AlertTriangle" className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Tuesday Edit Window</h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  You are editing a record from the previous week. This action is only allowed on Tuesdays.
                  All edits are logged and require a reason.
                </p>
              </div>
            </div>
          </div>
        )}

        {isSuperAdmin && (
          <div className="mb-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <IconMapper name="Shield" className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800 dark:text-blue-200">Super Admin Edit</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  You have unrestricted edit access. All changes will be logged with your user ID.
                </p>
              </div>
            </div>
          </div>
        )}

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Guard Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Guard <span className="text-red-500">*</span>
              </label>
              <select
                value={form.guard_id}
                onChange={(e) => setForm({ ...form, guard_id: e.target.value })}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-coin-600"
                required
              >
                <option value="">Select Guard...</option>
                {guards.map((guard: any) => (
                  <option key={guard.id} value={guard.id}>
                    {guard.name} ({guard.employee_id})
                  </option>
                ))}
              </select>
              {currentGuard && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Currently selected: {currentGuard.name}
                </p>
              )}
              {errors.guard_id && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.guard_id}</p>
              )}
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-coin-600"
                required
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.date}</p>
              )}
            </div>

            {/* Site Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Site <span className="text-red-500">*</span>
              </label>
              <select
                value={form.client_site_id}
                onChange={(e) => setForm({ ...form, client_site_id: e.target.value })}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-coin-600"
                required
              >
                <option value="">Select Site...</option>
                {sites.map((site: any) => (
                  <option key={site.id} value={site.id}>
                    {site.name} {site.client ? `(${site.client.name})` : ''}
                  </option>
                ))}
              </select>
              {currentSite && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Currently selected: {currentSite.name}
                </p>
              )}
              {errors.client_site_id && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.client_site_id}</p>
              )}
            </div>

            {/* Times */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Check In Time
                </label>
                <input
                  type="time"
                  value={form.check_in_time}
                  onChange={(e) => setForm({ ...form, check_in_time: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-coin-600"
                />
                {errors.check_in_time && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.check_in_time}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Check Out Time
                </label>
                <input
                  type="time"
                  value={form.check_out_time}
                  onChange={(e) => setForm({ ...form, check_out_time: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-coin-600"
                />
                {errors.check_out_time && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.check_out_time}</p>
                )}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {statusOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                      form.status === option.value
                        ? 'border-coin-500 bg-coin-50 dark:bg-coin-900/20'
                        : 'border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name="status"
                      value={option.value}
                      checked={form.status === option.value}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className="sr-only"
                    />
                    <span className={`text-sm font-medium ${option.color}`}>{option.label}</span>
                  </label>
                ))}
              </div>
              {errors.status && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.status}</p>
              )}
            </div>

            {/* Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Check In Notes
                </label>
                <textarea
                  value={form.check_in_notes}
                  onChange={(e) => setForm({ ...form, check_in_notes: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-coin-600"
                  placeholder="Notes about check in..."
                />
                {errors.check_in_notes && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.check_in_notes}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Check Out Notes
                </label>
                <textarea
                  value={form.check_out_notes}
                  onChange={(e) => setForm({ ...form, check_out_notes: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-coin-600"
                  placeholder="Notes about check out..."
                />
                {errors.check_out_notes && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.check_out_notes}</p>
                )}
              </div>
            </div>

            {/* Edit Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Edit Reason {!isSuperAdmin && <span className="text-red-500">*</span>}
              </label>
              <textarea
                value={form.edit_reason}
                onChange={(e) => setForm({ ...form, edit_reason: e.target.value })}
                rows={2}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-coin-600"
                placeholder={isSuperAdmin ? "Optional: Reason for this edit..." : "Required: Explain why this record needs to be edited..."}
                required={!isSuperAdmin}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                This reason will be logged with the attendance record for audit purposes.
              </p>
              {errors.edit_reason && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.edit_reason}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t dark:border-gray-700">
              <button
                type="button"
                onClick={() => router.get(route('control-room.attendance.index'))}
                className="w-full sm:w-auto px-6 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto px-6 py-2 bg-coin-600 hover:bg-coin-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <IconMapper name="Loader2" size={18} className="animate-spin" />
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <IconMapper name="Save" size={18} />
                    Save Changes
                  </span>
                )}
              </button>
            </div>
          </form>
        </Card>
      </div>
    </ControlRoomLayout>
  );
}
