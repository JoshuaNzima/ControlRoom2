import React from 'react';
import Modal from '@/Components/Modal';
import { router } from '@inertiajs/react';

export default function ManualCheckOutModal({
  open,
  guardId,
  onClose,
  onSuccess,
}: {
  open: boolean;
  guardId: number | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [time, setTime] = React.useState<string>('');
  const [notes, setNotes] = React.useState<string>('');
  const [reasonCode, setReasonCode] = React.useState<string>('');
  const [submitting, setSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (open) {
      setTime('');
      setNotes('');
      setReasonCode('');
      setErrors({});
    }
  }, [open]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guardId) return;
    setSubmitting(true);
    router.post(route('control-room.attendance.check-out'), {
      guard_id: guardId,
      time: time || undefined,
      notes: notes || undefined,
      reason_code: reasonCode || undefined,
    }, {
      preserveScroll: true,
      onFinish: () => setSubmitting(false),
      onSuccess: () => { setErrors({}); onSuccess(); onClose(); },
      onError: (errs: any) => {
        const e: Record<string, string> = {};
        Object.entries(errs || {}).forEach(([k, v]) => { e[String(k)] = String(v); });
        setErrors(e);
      },
    });
  };

  return (
    <Modal show={open} onClose={onClose} maxWidth="lg">
      <form onSubmit={submit} className="p-4 sm:p-6 space-y-4 bg-white dark:bg-gray-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Manual Check-Out</h3>
        {errors.guard_id && (
          <div className="text-sm text-red-600">{errors.guard_id}</div>
        )}
        <p className="text-sm text-gray-600 dark:text-gray-300">Fallback check-out when a supervisor/sergeant cannot.</p>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reason Code (optional)</label>
          <select
            value={reasonCode}
            onChange={(e) => setReasonCode(e.target.value)}
            className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2"
          >
            <option value="">Select...</option>
            <option value="supervisor_unavailable">Supervisor unavailable</option>
            <option value="gps_issue">GPS issue</option>
            <option value="network_outage">Network outage</option>
            <option value="device_failure">Device failure</option>
            <option value="emergency">Emergency</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time (optional)</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes (optional)</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reason or context"
              className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200">Cancel</button>
          <button type="submit" disabled={!guardId || submitting} className="px-4 py-2 rounded-md bg-coin-700 hover:bg-coin-800 text-white disabled:opacity-50">{submitting ? 'Checking out...' : 'Check Out'}</button>
        </div>
      </form>
    </Modal>
  );
}
