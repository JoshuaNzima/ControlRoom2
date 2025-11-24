import React, { useEffect } from 'react';
import Modal from '@/Components/Modal';
import { useForm } from '@inertiajs/react';

type Employee = {
  id?: number;
  name: string;
  email: string;
  phone?: string | null;
  position?: string | null;
  department?: string | null;
  status: 'active' | 'inactive' | 'terminated';
  hired_at?: string | null; // YYYY-MM-DD
  notes?: string | null;
};

export default function EmployeeFormModal({
  open,
  mode,
  onClose,
  onSuccess,
  initial,
}: {
  open: boolean;
  mode: 'create' | 'edit';
  onClose: () => void;
  onSuccess: () => void;
  initial?: Partial<Employee> | null;
}) {
  const { data, setData, post, put, processing, errors, reset } = useForm<Employee>({
    name: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    status: 'active',
    hired_at: '',
    notes: '',
  } as Employee);

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && initial) {
        setData({
          name: initial.name || '',
          email: initial.email || '',
          phone: (initial as any).phone || '',
          position: (initial as any).position || '',
          department: (initial as any).department || '',
          status: ((initial as any).status || 'active') as any,
          hired_at: (initial as any).hired_at ? String((initial as any).hired_at).substring(0, 10) : '',
          notes: (initial as any).notes || '',
        } as Employee);
      } else {
        reset();
        setData('status', 'active' as any);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, initial]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'create') {
      post(route('hr.employees.store'), {
        onSuccess: () => {
          onSuccess();
          onClose();
        },
      });
    } else if (mode === 'edit' && initial?.id) {
      put(route('hr.employees.update', initial.id), {
        onSuccess: () => {
          onSuccess();
          onClose();
        },
      });
    }
  };

  return (
    <Modal show={open} onClose={onClose} maxWidth="2xl">
      <form onSubmit={submit} className="p-4 sm:p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
            {mode === 'create' ? 'Add Employee' : 'Edit Employee'}
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Full Name</label>
              <input
                className="w-full rounded-md border border-gray-300 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={data.name}
                onChange={(e) => setData('name', e.target.value)}
                required
              />
              {errors.name && <div className="text-sm text-red-600">{errors.name}</div>}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Email</label>
              <input
                type="email"
                className="w-full rounded-md border border-gray-300 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={data.email}
                onChange={(e) => setData('email', e.target.value)}
                required
              />
              {errors.email && <div className="text-sm text-red-600">{errors.email}</div>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Phone</label>
              <input
                className="w-full rounded-md border border-gray-300 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={data.phone || ''}
                onChange={(e) => setData('phone', e.target.value)}
              />
              {errors.phone && <div className="text-sm text-red-600">{errors.phone}</div>}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Position</label>
              <input
                className="w-full rounded-md border border-gray-300 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={data.position || ''}
                onChange={(e) => setData('position', e.target.value)}
              />
              {errors.position && <div className="text-sm text-red-600">{errors.position}</div>}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Department</label>
              <input
                className="w-full rounded-md border border-gray-300 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={data.department || ''}
                onChange={(e) => setData('department', e.target.value)}
              />
              {errors.department && <div className="text-sm text-red-600">{errors.department}</div>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Status</label>
              <select
                className="w-full rounded-md border border-gray-300 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={data.status}
                onChange={(e) => setData('status', e.target.value as any)}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="terminated">Terminated</option>
              </select>
              {errors.status && <div className="text-sm text-red-600">{errors.status}</div>}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Hired At</label>
              <input
                type="date"
                className="w-full rounded-md border border-gray-300 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={data.hired_at || ''}
                onChange={(e) => setData('hired_at', e.target.value)}
              />
              {errors.hired_at && <div className="text-sm text-red-600">{errors.hired_at}</div>}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Notes</label>
              <input
                className="w-full rounded-md border border-gray-300 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={data.notes || ''}
                onChange={(e) => setData('notes', e.target.value)}
                placeholder="Optional"
              />
              {errors.notes && <div className="text-sm text-red-600">{errors.notes}</div>}
            </div>
          </div>
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
