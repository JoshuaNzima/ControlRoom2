import React, { useEffect, useMemo } from 'react';
import Modal from '@/Components/Modal';
import { useForm } from '@inertiajs/react';

export default function PromoteGuardModal({
  open,
  guard,
  zones = [],
  onClose,
  onSuccess,
}: {
  open: boolean;
  guard: any | null;
  zones: Array<{ id: number; name: string }>;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { data, setData, post, processing, errors, reset, clearErrors } = useForm<{ role: string; zone_id?: number | '' }>(
    { role: 'sergeant', zone_id: '' }
  );

  useEffect(() => {
    if (open) {
      reset({ role: 'sergeant'});
      clearErrors();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, guard?.id]);

  const requiresZone = useMemo(() => data.role === 'zone_commander', [data.role]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guard) return;
    post(route('hr.guards.promote', guard.id), {
      onSuccess: () => {
        onSuccess();
        onClose();
      },
      preserveScroll: true,
    });
  };

  return (
    <Modal show={open} onClose={onClose} maxWidth="md">
      <form onSubmit={submit} className="p-4 sm:p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Promote Guard</h3>
          <p className="text-sm text-gray-600 dark:text-slate-400">{guard?.name}</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-slate-300">New Role</label>
            <select
              className="w-full rounded-md border border-gray-300 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={data.role}
              onChange={(e) => setData('role', e.target.value)}
              required
            >
              <option value="sergeant">Sergeant</option>
              <option value="supervisor">Supervisor</option>
              <option value="zone_commander">Zone Commander</option>
            </select>
            {errors.role && <div className="text-sm text-red-600">{errors.role}</div>}
          </div>

          {requiresZone && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Assign Zone</label>
              <select
                className="w-full rounded-md border border-gray-300 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={data.zone_id || ''}
                onChange={(e) => setData('zone_id', e.target.value ? Number(e.target.value) : '')}
                required
              >
                <option value="">Select zone</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>{z.name}</option>
                ))}
              </select>
              {errors.zone_id && <div className="text-sm text-red-600">{errors.zone_id}</div>}
            </div>
          )}

          {!guard?.email && (
            <div className="rounded-md bg-amber-50 dark:bg-amber-900/30 p-3 text-sm text-amber-800 dark:text-amber-200">
              This guard has no email on file. A login cannot be created until an email is provided.
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center px-4 py-2 rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={processing || !guard?.email}
            className="inline-flex items-center px-4 py-2 rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60"
          >
            {processing ? 'Promoting...' : 'Promote'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
