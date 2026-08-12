import React, { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import Modal from '@/Components/Modal';

type Site = { id: number; name: string };

type DraftEntry = {
  guard_id: number;
  date: string;
  entry_type: 'site' | 'off';
  client_site_id?: number | '';
  notes?: string;
  delete?: boolean;
};

export default function AssignGuardSiteModal({
  open,
  onClose,
  guardId,
  date,
  initialSiteId,
  sites,
  planLocked,
  onStage,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  guardId?: number;
  date?: string;
  initialSiteId?: number;
  sites: Site[];
  planLocked: boolean;
  onStage: (e: DraftEntry) => void;
  onSaved: () => void;
}) {
  const { data, setData, processing, reset } = useForm<{ guard_id: number | string; client_site_id: number | string; date: string }>({
    guard_id: guardId ?? '',
    client_site_id: initialSiteId ?? '',
    date: date ?? '',
  });

  useEffect(() => {
    if (!open) return;
    setData('guard_id', guardId ?? '');
    setData('client_site_id', initialSiteId ?? '');
    setData('date', date ?? '');
  }, [open, guardId, date, initialSiteId, setData]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (planLocked) return;
    if (!data.guard_id || !data.date || !data.client_site_id) return;

    onStage({
      guard_id: Number(data.guard_id),
      date: data.date,
      entry_type: 'site',
      client_site_id: Number(data.client_site_id),
    });
    reset();
    onSaved();
  };

  const clearOverride = () => {
    if (planLocked) return;
    if (!guardId || !date) return;

    onStage({ guard_id: guardId, date, entry_type: 'site', delete: true });
    reset();
    onSaved();
  };

  return (
    <Modal show={open} onClose={() => !processing && onClose()} maxWidth="sm">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Assign Site</h2>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          ✕
        </button>
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
            <label className="block text-sm font-medium">Site</label>
            <select
              className="w-full rounded-md border p-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              value={data.client_site_id as any}
              onChange={(e) => setData('client_site_id', e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">Select a site</option>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
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

            {initialSiteId ? (
              <button
                type="button"
                onClick={clearOverride}
                className="rounded-md bg-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
                disabled={processing || planLocked}
              >
                Clear
              </button>
            ) : null}

            <button
              type="submit"
              disabled={processing || planLocked || !data.client_site_id || !data.date}
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
