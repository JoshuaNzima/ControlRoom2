import React, { useEffect } from 'react';
import Modal from '@/Components/Modal';
import { useForm } from '@inertiajs/react';

type Option = { id: number; name: string };

type Shift = {
  id?: number;
  guard_id?: number;
  client_site_id?: number;
  date?: string;
  start_time?: string; // HH:mm
  end_time?: string;   // HH:mm
  shift_type?: 'day' | 'night';
  instructions?: string | null;
  status?: 'scheduled' | 'completed' | 'cancelled';
};

export default function ShiftFormModal({
  open,
  mode,
  onClose,
  onSuccess,
  guards,
  sites,
  initial,
}: {
  open: boolean;
  mode: 'create' | 'edit';
  onClose: () => void;
  onSuccess: () => void;
  guards: Option[];
  sites: Option[];
  initial?: Shift | null;
}) {
  const { data, setData, post, put, processing, errors, reset } = useForm<Shift>({
    guard_id: undefined,
    client_site_id: undefined,
    date: '',
    start_time: '',
    end_time: '',
    shift_type: 'day',
    instructions: '',
    status: 'scheduled',
  });

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && initial) {
        setData({
          guard_id: (initial as any)?.guard_id ?? (initial as any)?.guard_relation?.id,
          client_site_id: (initial as any)?.client_site_id ?? (initial as any)?.client_site?.id,
          date: initial.date ? initial.date.substring(0, 10) : '',
          start_time: initial.start_time ? new Date(initial.start_time).toISOString().substring(11, 16) : '',
          end_time: initial.end_time ? new Date(initial.end_time).toISOString().substring(11, 16) : '',
          shift_type: (initial.shift_type as any) || 'day',
          instructions: (initial.instructions as any) || '',
          status: (initial.status as any) || 'scheduled',
        });
      } else {
        reset();
        setData('shift_type', 'day');
        setData('status', 'scheduled');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, initial]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'create') {
      post(route('shifts.store'), {
        onSuccess: () => {
          onSuccess();
          onClose();
        },
      });
    } else if (mode === 'edit' && initial?.id) {
      put(route('shifts.update', initial.id), {
        onSuccess: () => {
          onSuccess();
          onClose();
        },
      });
    }
  };

  return (
    <Modal show={open} onClose={onClose} maxWidth="2xl">
      <form onSubmit={handleSubmit} className="p-4 sm:p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{mode === 'create' ? 'Create Shift' : 'Edit Shift'}</h3>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Guard</label>
            <select
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={data.guard_id ?? ''}
              onChange={(e) => setData('guard_id', Number(e.target.value))}
              required
            >
              <option value="">Select guard</option>
              {guards.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
            {errors.guard_id && <div className="text-sm text-red-600">{errors.guard_id}</div>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Site</label>
            <select
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={data.client_site_id ?? ''}
              onChange={(e) => setData('client_site_id', Number(e.target.value))}
              required
            >
              <option value="">Select site</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            {errors.client_site_id && <div className="text-sm text-red-600">{errors.client_site_id}</div>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={data.date || ''}
                onChange={(e) => setData('date', e.target.value)}
                required
              />
              {errors.date && <div className="text-sm text-red-600">{errors.date}</div>}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Start Time</label>
              <input
                type="time"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={data.start_time || ''}
                onChange={(e) => setData('start_time', e.target.value)}
                required
              />
              {errors.start_time && <div className="text-sm text-red-600">{errors.start_time}</div>}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">End Time</label>
              <input
                type="time"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={data.end_time || ''}
                onChange={(e) => setData('end_time', e.target.value)}
                required
              />
              {errors.end_time && <div className="text-sm text-red-600">{errors.end_time}</div>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Type</label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={data.shift_type || 'day'}
                onChange={(e) => setData('shift_type', e.target.value as any)}
                required
              >
                <option value="day">Day</option>
                <option value="night">Night</option>
              </select>
              {errors.shift_type && <div className="text-sm text-red-600">{errors.shift_type}</div>}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Status</label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={data.status || 'scheduled'}
                onChange={(e) => setData('status', e.target.value as any)}
                required
              >
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              {errors.status && <div className="text-sm text-red-600">{errors.status}</div>}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Instructions</label>
              <input
                type="text"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={data.instructions || ''}
                onChange={(e) => setData('instructions', e.target.value)}
                placeholder="Optional"
              />
              {errors.instructions && <div className="text-sm text-red-600">{errors.instructions}</div>}
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={processing}
            className="inline-flex items-center px-4 py-2 rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60"
          >
            {processing ? 'Saving...' : (mode === 'create' ? 'Create' : 'Save changes')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
