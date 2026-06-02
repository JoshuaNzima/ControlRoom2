import React, { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import Modal from '@/Components/Modal';

type DayKey = string;

type DraftEntry = {
  guard_id: number;
  date: string;
  entry_type: 'site' | 'off';
  client_site_id?: number | '';
  notes?: string;
  delete?: boolean;
};

export default function BulkOffModal({
  open,
  onClose,
  guardIds,
  days,
  planLocked,
  onStage,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  guardIds: number[];
  days: DayKey[];
  planLocked: boolean;
  onStage: (entries: DraftEntry[]) => void;
  onSaved: () => void;
}) {
  const { data, setData, processing, reset } = useForm<{ start: string; end: string; action: 'off' | 'clear' }>({
    start: days?.[0] ?? '',
    end: days?.[days.length - 1] ?? '',
    action: 'off',
  });

  useEffect(() => {
    if (!open) return;
    setData('start', days?.[0] ?? '');
    setData('end', days?.[days.length - 1] ?? '');
    setData('action', 'off');
  }, [days, open, setData]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (planLocked) return;
    if (!guardIds?.length) return;
    if (!data.start || !data.end) return;

    const rangeDays = (days || []).filter((d) => d >= data.start && d <= data.end);
    const entries: DraftEntry[] = [];

    for (const gid of guardIds) {
      for (const d of rangeDays) {
        entries.push(
          data.action === 'clear' ? { guard_id: gid, date: d, entry_type: 'off', delete: true } : { guard_id: gid, date: d, entry_type: 'off' },
        );
      }
    }

    onStage(entries);
    reset();
    onSaved();
  };

  return (
    <Modal show={open} onClose={() => !processing && onClose()} maxWidth="md">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Bulk Off Day</h2>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          ✕
        </button>
      </div>

      <div className="bg-white px-6 py-4 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
        <form className="grid grid-cols-1 gap-3" onSubmit={submit}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium">Start</label>
              <input
                type="date"
                className="w-full rounded-md border p-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                value={data.start}
                onChange={(e) => setData('start', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">End</label>
              <input
                type="date"
                className="w-full rounded-md border p-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                value={data.end}
                onChange={(e) => setData('end', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Action</label>
            <select
              className="w-full rounded-md border p-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              value={data.action}
              onChange={(e) => setData('action', e.target.value as 'off' | 'clear')}
            >
              <option value="off">Mark OFF</option>
              <option value="clear">Clear OFF</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md bg-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
              disabled={processing}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={processing || planLocked || !guardIds?.length || !data.start || !data.end}
              className="rounded-md bg-coin-700 px-4 py-2 text-sm text-white hover:bg-coin-600"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
