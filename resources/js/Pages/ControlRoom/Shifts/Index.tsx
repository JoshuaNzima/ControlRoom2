import React, { useState } from 'react';
import { Head, Link, usePage, useForm, router } from '@inertiajs/react';
import ControlRoomLayout from '@/Layouts/ControlRoomLayout';
import { Card, CardContent, CardHeader } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import Modal from '@/Components/Modal';

type Shift = {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
  description?: string | null;
  supervisor_id?: number | null;
  required_guards: number;
  status?: string;
  sites?: number[];
  guards?: any[];
  supervisor?: { id: number; name: string } | null;
};

export default function ShiftsIndex() {
  const { shifts, supervisors = [], sites = [] } = usePage().props as any;

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [viewData, setViewData] = useState<any | null>(null);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const openViewModal = async (id: number) => {
    setLoadingId(id);
    try {
      const response = await fetch(route('control-room.shifts.show', id), {
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load shift');
      }

      const json = await response.json();
      setViewData(json);
      setViewOpen(true);
    } catch (e) {
      router.visit(route('control-room.shifts.show', id));
    } finally {
      setLoadingId(null);
    }
  };

  const openEditModal = (shift: Shift) => {
    setEditingShift(shift);
    setEditOpen(true);
  };

  return (
    <ControlRoomLayout title="Shift Management">
      <Head title="Shift Management" />
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Shifts</h2>
          <Button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center px-3 py-2 rounded-md bg-indigo-600 text-white text-sm"
          >
            Create Shift
          </Button>
        </div>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Recent Shifts</h3>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {shifts?.data?.map((s: any) => (
                <div key={s.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs text-gray-500">{s.start_time} - {s.end_time} • Required guards: {s.required_guards}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => openViewModal(s.id)}
                      className="text-sm text-indigo-600 disabled:opacity-50"
                      disabled={loadingId === s.id}
                    >
                      {loadingId === s.id ? 'Opening…' : 'View'}
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(s)}
                      className="text-sm text-gray-600"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <CreateShiftModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          supervisors={supervisors}
          sites={sites}
        />

        {editingShift && (
          <EditShiftModal
            open={editOpen}
            onClose={() => {
              setEditOpen(false);
              setEditingShift(null);
            }}
            shift={editingShift}
            supervisors={supervisors}
            sites={sites}
          />
        )}

        {viewData && (
          <ViewShiftModal
            open={viewOpen}
            onClose={() => {
              setViewOpen(false);
              setViewData(null);
            }}
            data={viewData}
          />
        )}
      </div>
    </ControlRoomLayout>
  );
}

type ShiftForm = {
  name: string;
  start_time: string;
  end_time: string;
  description: string;
  supervisor_id: number | '';
  required_guards: number;
  sites: number[];
  status?: string;
};

interface CreateShiftModalProps {
  open: boolean;
  onClose: () => void;
  supervisors: any[];
  sites: any[];
}

function CreateShiftModal({ open, onClose, supervisors, sites }: CreateShiftModalProps) {
  const { data, setData, post, processing, errors, reset } = useForm<ShiftForm>({
    name: '',
    start_time: '',
    end_time: '',
    description: '',
    supervisor_id: '',
    required_guards: 1,
    sites: [],
  });

  const toggleSite = (siteId: number) => {
    const current = new Set(data.sites as any[]);
    if (current.has(siteId)) current.delete(siteId); else current.add(siteId);
    setData('sites', Array.from(current) as any);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('control-room.shifts.store'), {
      onSuccess: () => {
        reset();
        onClose();
      },
    });
  };

  const handleClose = () => {
    if (!processing) {
      onClose();
    }
  };

  return (
    <Modal show={open} onClose={handleClose} maxWidth="2xl">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white">
        <h2 className="text-lg font-semibold text-gray-900">New Shift</h2>
        <button
          type="button"
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <span className="sr-only">Close</span>
          <svg
            className="h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
      <div className="px-6 py-4 bg-white">
        <form className="grid grid-cols-1 sm:grid-cols-2 gap-4" onSubmit={onSubmit}>
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input
              className="w-full border rounded-md p-2"
              value={data.name}
              onChange={(e) => setData('name', e.target.value)}
            />
            {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Supervisor</label>
            <select
              className="w-full border rounded-md p-2"
              value={data.supervisor_id as any}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setData('supervisor_id', e.target.value ? Number(e.target.value) : '')
              }
            >
              <option value="">Select supervisor</option>
              {supervisors.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            {errors.supervisor_id && <p className="text-sm text-red-600">{errors.supervisor_id}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Start Time</label>
            <input
              type="time"
              className="w-full border rounded-md p-2"
              value={data.start_time}
              onChange={(e) => setData('start_time', e.target.value)}
            />
            {errors.start_time && <p className="text-sm text-red-600">{errors.start_time}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">End Time</label>
            <input
              type="time"
              className="w-full border rounded-md p-2"
              value={data.end_time}
              onChange={(e) => setData('end_time', e.target.value)}
            />
            {errors.end_time && <p className="text-sm text-red-600">{errors.end_time}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Required Guards</label>
            <input
              type="number"
              min={1}
              className="w-full border rounded-md p-2"
              value={data.required_guards as any}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setData('required_guards', Number(e.target.value))
              }
            />
            {errors.required_guards && <p className="text-sm text-red-600">{errors.required_guards}</p>}
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium">Sites</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-auto border rounded p-2">
              {sites.map((s: any) => (
                <label key={s.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={(data.sites as any[]).includes(s.id)}
                    onChange={() => toggleSite(s.id)}
                  />
                  <span>{s.name}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium">Description</label>
            <textarea
              className="w-full border rounded-md p-2"
              rows={3}
              value={data.description}
              onChange={(e) => setData('description', e.target.value)}
            />
          </div>
          <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300"
              disabled={processing}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={processing}
              className="px-4 py-2 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-400"
            >
              {processing ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

interface EditShiftModalProps {
  open: boolean;
  onClose: () => void;
  shift: Shift;
  supervisors: any[];
  sites: any[];
}

function EditShiftModal({ open, onClose, shift, supervisors, sites }: EditShiftModalProps) {
  const { data, setData, put, processing, errors, reset } = useForm<ShiftForm>({
    name: shift.name,
    start_time: shift.start_time,
    end_time: shift.end_time,
    description: shift.description ?? '',
    supervisor_id: shift.supervisor_id ?? '',
    required_guards: shift.required_guards,
    sites: Array.isArray(shift.sites) ? (shift.sites as any[]) : [],
    status: shift.status ?? 'active',
  });

  const toggleSite = (siteId: number) => {
    const current = new Set(data.sites as any[]);
    if (current.has(siteId)) current.delete(siteId); else current.add(siteId);
    setData('sites', Array.from(current) as any);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    put(route('control-room.shifts.update', shift.id), {
      onSuccess: () => {
        reset();
        onClose();
      },
    });
  };

  const handleClose = () => {
    if (!processing) {
      onClose();
    }
  };

  return (
    <Modal show={open} onClose={handleClose} maxWidth="2xl">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white">
        <h2 className="text-lg font-semibold text-gray-900">Edit Shift</h2>
        <button
          type="button"
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <span className="sr-only">Close</span>
          <svg
            className="h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
      <div className="px-6 py-4 bg-white">
        <form className="grid grid-cols-1 sm:grid-cols-2 gap-4" onSubmit={onSubmit}>
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input
              className="w-full border rounded-md p-2"
              value={data.name}
              onChange={(e) => setData('name', e.target.value)}
            />
            {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Supervisor</label>
            <select
              className="w-full border rounded-md p-2"
              value={data.supervisor_id as any}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setData('supervisor_id', e.target.value ? Number(e.target.value) : '')
              }
            >
              <option value="">Select supervisor</option>
              {supervisors.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            {errors.supervisor_id && <p className="text-sm text-red-600">{errors.supervisor_id}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Start Time</label>
            <input
              type="time"
              className="w-full border rounded-md p-2"
              value={data.start_time}
              onChange={(e) => setData('start_time', e.target.value)}
            />
            {errors.start_time && <p className="text-sm text-red-600">{errors.start_time}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">End Time</label>
            <input
              type="time"
              className="w-full border rounded-md p-2"
              value={data.end_time}
              onChange={(e) => setData('end_time', e.target.value)}
            />
            {errors.end_time && <p className="text-sm text-red-600">{errors.end_time}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Required Guards</label>
            <input
              type="number"
              min={1}
              className="w-full border rounded-md p-2"
              value={data.required_guards as any}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setData('required_guards', Number(e.target.value))
              }
            />
            {errors.required_guards && <p className="text-sm text-red-600">{errors.required_guards}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Status</label>
            <select
              className="w-full border rounded-md p-2"
              value={data.status}
              onChange={(e) => setData('status', e.target.value)}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium">Sites</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-auto border rounded p-2">
              {sites.map((s: any) => (
                <label key={s.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={(data.sites as any[]).includes(s.id)}
                    onChange={() => toggleSite(s.id)}
                  />
                  <span>{s.name}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium">Description</label>
            <textarea
              className="w-full border rounded-md p-2"
              rows={3}
              value={data.description}
              onChange={(e) => setData('description', e.target.value)}
            />
          </div>
          <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300"
              disabled={processing}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={processing}
              className="px-4 py-2 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-400"
            >
              {processing ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

interface ViewShiftModalProps {
  open: boolean;
  onClose: () => void;
  data: any;
}

function ViewShiftModal({ open, onClose, data }: ViewShiftModalProps) {
  const shift: Shift = data.shift;
  const sitesMap = data.sitesMap || {};

  const sitesLabel = (() => {
    const ids = Array.isArray(shift.sites) ? shift.sites : [];
    if (ids.length === 0) return '';
    const names = ids.map((id: any) => sitesMap[id] || id).filter(Boolean);
    return names.join(', ');
  })();

  return (
    <Modal show={open} onClose={onClose} maxWidth="xl">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white">
        <h2 className="text-lg font-semibold text-gray-900">Shift • {shift.name}</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <span className="sr-only">Close</span>
          <svg
            className="h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
      <div className="px-6 py-4 bg-white space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-medium text-gray-700">Time</div>
            <div className="text-gray-900">{shift.start_time} - {shift.end_time}</div>
          </div>
          <div>
            <div className="font-medium text-gray-700">Required Guards</div>
            <div className="text-gray-900">{shift.required_guards}</div>
          </div>
          <div>
            <div className="font-medium text-gray-700">Supervisor</div>
            <div className="text-gray-900">{shift.supervisor?.name}</div>
          </div>
          <div>
            <div className="font-medium text-gray-700">Status</div>
            <div className="text-gray-900 capitalize">{shift.status}</div>
          </div>
          <div className="sm:col-span-2">
            <div className="font-medium text-gray-700">Sites</div>
            <div className="text-gray-900">{sitesLabel || '—'}</div>
          </div>
        </div>

        {shift.description && (
          <div className="text-sm">
            <div className="font-medium text-gray-700">Description</div>
            <div className="text-gray-900 mt-1">{shift.description}</div>
          </div>
        )}

        <div className="text-sm">
          <div className="font-medium text-gray-700 mb-1">Assigned Guards</div>
          <div className="space-y-1">
            {(!shift.guards || shift.guards.length === 0) && (
              <div className="text-gray-500">No guards assigned.</div>
            )}
            {shift.guards && shift.guards.map((g: any) => (
              <div key={g.id} className="flex items-center justify-between border rounded px-3 py-1">
                <div className="text-gray-900">{g.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="px-6 py-3 bg-gray-50 border-t flex justify-end text-sm">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}
