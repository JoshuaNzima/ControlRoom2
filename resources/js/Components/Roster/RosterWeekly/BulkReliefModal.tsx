import React, { useEffect, useState } from 'react';
import { useForm } from '@inertiajs/react';
import Modal from '@/Components/Modal';

type DayKey = string;
type Site = { id: number; name: string };

type DraftEntry = {
  guard_id: number;
  date: string;
  entry_type: 'site' | 'off';
  client_site_id?: number | '';
  notes?: string;
  delete?: boolean;
};

export default function BulkReliefModal({
  open,
  onClose,
  guardId,
  days,
  initialMap,
  sites,
  activeSites,
  planLocked,
  onStage,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  guardId?: number;
  days: DayKey[];
  initialMap: Record<DayKey, Site | null>;
  sites: Site[];
  activeSites: Site[];
  planLocked: boolean;
  onStage: (entries: DraftEntry[]) => void;
  onSaved: () => void;
}) {
  const { data, setData, processing, reset } = useForm<{ guard_id: number | string; day_site_map: Record<DayKey, number | ''> }>({
    guard_id: guardId ?? '',
    day_site_map: days.reduce((acc, d) => { acc[d] = initialMap?.[d]?.id || ''; return acc; }, {} as Record<DayKey, number | ''>),
  });
  const [onlyActive, setOnlyActive] = useState(true);

  useEffect(() => {
    if (!open) return;
    setData('guard_id', guardId ?? '');
    setData('day_site_map', days.reduce((acc, d) => { acc[d] = initialMap?.[d]?.id || ''; return acc; }, {} as Record<DayKey, number | ''>));
    setOnlyActive(true);
  }, [open, guardId, days, initialMap, setData]);

  const list = onlyActive ? activeSites : sites;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (planLocked) return;
    if (!guardId) return;

    const entries: DraftEntry[] = days.map((d) => {
      const sid = data.day_site_map?.[d];
      if (!sid) return { guard_id: guardId, date: d, entry_type: 'site', delete: true };
      return { guard_id: guardId, date: d, entry_type: 'site', client_site_id: Number(sid) };
    });

    onStage(entries);
    reset();
    onSaved();
  };

  return (
    <Modal show={open} onClose={() => !processing && onClose()} maxWidth="md">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Bulk Assign Reliever</h2>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">✕</button>
      </div>
      <div className="bg-white px-6 py-4 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
        <form className="grid grid-cols-1 gap-3" onSubmit={submit}>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={onlyActive} onChange={(e) => setOnlyActive(e.target.checked)} />
            <span className="text-sm">Only show active sites this week</span>
          </label>

          {days.map((d) => (
            <div key={d} className="grid grid-cols-1 items-center gap-2 sm:grid-cols-3">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                {new Date(d).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
              </div>
              <div className="sm:col-span-2">
                <select className="w-full rounded-md border p-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  value={data.day_site_map[d] as any}
                  onChange={(e) => setData('day_site_map', { ...data.day_site_map, [d]: e.target.value ? Number(e.target.value) : '' })}
                >
                  <option value="">—</option>
                  {list.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
          ))}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-md bg-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700" disabled={processing}>Cancel</button>
            <button type="submit" disabled={processing || planLocked || !guardId} className="rounded-md bg-coin-700 px-4 py-2 text-sm text-white hover:bg-coin-600">Save</button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
