import React, { useEffect } from 'react';
import { useForm, router } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import useToast from '@/Components/ui/use-toast';

type Site = { id: number; name: string };
type ShiftType = 'day' | 'night' | 'morning' | 'evening' | 'custom';

export default function ManualRosterShiftModal({
  open,
  onClose,
  guardId,
  date,
  sites,
  shiftType,
  initialSiteId,
  shiftId,
  notes,
  onSaved,
  onDeleted,
}: {
  open: boolean;
  onClose: () => void;
  guardId?: number;
  date?: string;
  sites: Site[];
  shiftType: ShiftType;
  initialSiteId?: number;
  shiftId?: number;
  notes?: string;
  onSaved: () => void;
  onDeleted: () => void;
}) {
  const { toast } = useToast();
  const { data, setData, post, processing, reset } = useForm<{
    shift_id: number | '';
    guard_id: number | '';
    client_site_id: number | '';
    date: string;
    shift_type: ShiftType;
    start_time: string;
    end_time: string;
    notes?: string;
  }>({
    shift_id: (shiftId ?? '') as any,
    guard_id: (guardId ?? '') as any,
    client_site_id: (initialSiteId ?? '') as any,
    date: date ?? '',
    shift_type: shiftType,
    start_time: shiftType === 'night' ? '18:00' : '06:00',
    end_time: shiftType === 'night' ? '06:00' : '18:00',
    notes: notes ?? '',
  });

  useEffect(() => {
    if (!open) return;
    setData('shift_id', (shiftId ?? '') as any);
    setData('guard_id', (guardId ?? '') as any);
    setData('client_site_id', (initialSiteId ?? '') as any);
    setData('date', date ?? '');
    setData('shift_type', shiftType);
    setData('start_time', shiftType === 'night' ? '18:00' : '06:00');
    setData('end_time', shiftType === 'night' ? '06:00' : '18:00');
    setData('notes', notes ?? '');
  }, [open, guardId, date, initialSiteId, notes, setData, shiftId, shiftType]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.guard_id || !data.client_site_id || !data.date) {
      toast({ title: 'Missing fields', description: 'Select date and site.', variant: 'destructive' });
      return;
    }
    post(route('control-room.roster.manual-shifts.upsert'), {
      preserveScroll: true,
      onSuccess: () => { reset(); onSaved(); },
    });
  };

  const doDelete = () => {
    if (!shiftId) return;
    if (!confirm('Delete this manual roster shift?')) return;
    router.post(route('control-room.roster.manual-shifts.delete'), { shift_id: shiftId }, {
      preserveScroll: true,
      onSuccess: () => { reset(); onDeleted(); },
      onError: (errs) => { toast({ title: Object.values(errs)[0] || 'Failed to delete', variant: 'destructive' }); },
    });
  };

  return (
    <Modal show={open} onClose={() => !processing && onClose()} maxWidth="md">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Manual Roster Shift</h2>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">✕</button>
      </div>
      <div className="bg-white px-6 py-4 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
        <form className="grid grid-cols-1 gap-3" onSubmit={submit}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium">Date</label>
              <input type="date" className="w-full rounded-md border p-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100" value={data.date} onChange={(e) => setData('date', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium">Site</label>
              <select className="w-full rounded-md border p-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100" value={data.client_site_id as any} onChange={(e) => setData('client_site_id', e.target.value ? Number(e.target.value) : '')}>
                <option value="">Select a site</option>
                {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium">Start time</label>
              <input type="time" className="w-full rounded-md border p-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100" value={data.start_time} onChange={(e) => setData('start_time', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium">End time</label>
              <input type="time" className="w-full rounded-md border p-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100" value={data.end_time} onChange={(e) => setData('end_time', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium">Notes</label>
            <input type="text" className="w-full rounded-md border p-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100" value={data.notes || ''} onChange={(e) => setData('notes', e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            {shiftId ? <button type="button" onClick={doDelete} className="rounded-md bg-red-700 px-4 py-2 text-sm text-white hover:bg-red-600" disabled={processing}>Delete</button> : null}
            <button type="button" onClick={onClose} className="rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800" disabled={processing}>Cancel</button>
            <button type="submit" className="rounded-md bg-coin-700 px-4 py-2 text-sm text-white hover:bg-coin-600 disabled:opacity-50" disabled={processing}>Save shift</button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
