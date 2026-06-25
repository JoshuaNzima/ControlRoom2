import React, { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import Modal from '@/Components/Modal';

type DraftEntry = {
  guard_id: number;
  date: string;
  entry_type: 'site' | 'off';
  client_site_id?: number | '';
  notes?: string;
  delete?: boolean;
};

export default function AddOffDayModal({
  open,
  onClose,
  guardId,
  date,
  planLocked,
  onStage,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  guardId?: number;
  date?: string;
  planLocked: boolean;
  onStage: (e: DraftEntry) => void;
  onSaved: () => void;
}) {
  const { data, setData, processing, reset } = useForm<{ guard_id: number | string; date: string; action: 'off' | 'clear' }>({
    guard_id: guardId ?? '',
    date: date ?? '',
    action: 'off',
  });

  useEffect(() => {
    if (!open) return;
    setData('guard_id', guardId ?? '');
    setData('date', date ?? '');
    setData('action', 'off');
  }, [open, guardId, date, setData]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (planLocked) return;
    if (!data.guard_id || !data.date) return;
    const gid = Number(data.guard_id);
    if (data.action === 'clear') {
      onStage({ guard_id: gid, date: data.date, entry_type: 'off', delete: true });
    } else {
      onStage({ guard_id: gid, date: data.date, entry_type: 'off' });
    }
    reset();
    onSaved();
  };

  return (
    <Modal show={open} onClose={() => !processing && onClose()} maxWidth="sm">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Off Day</h2>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">✕</button>
      </div>
      <div className="bg-white px-6 py-4 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
        <form className="grid grid-cols-1 gap-3" onSubmit={submit}>
          <div>
            <label className="block text-sm font-medium">Date</label>
            <input
              type="date"
              className="w-full rounded-md border p-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              value={data.date}
              onChange={(e) => setData('date', e.target.value)}
            />
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
            >Cancel</button>
            <button
              type="submit"
              disabled={processing || planLocked || !data.guard_id || !data.date}
              className="rounded-md bg-coin-700 px-4 py-2 text-sm text-white hover:bg-coin-600"
            >Save</button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
