import React from 'react';
import Modal from '@/Components/Modal';
import { useForm, usePage } from '@inertiajs/react';
import type { PageProps } from '@/types';

type QuickRequisitionForm = {
  title: string;
  description: string;
  needed_by: string;
  category: 'general' | 'fuel' | 'vehicle_hire' | 'events' | 'k9' | 'utilities' | 'office_supplies';
  amount: string;
};

export default function QuickRequisitionButton({
  label = 'New requisition',
  className = '',
}: {
  label?: string;
  className?: string;
}) {
  const page = usePage() as any;
  const auth = page?.props?.auth;
  const user = auth?.user;
  const roles: string[] = Array.isArray(user?.roles) ? user.roles : [];
  if (!user) return null;
  if (roles.includes('admin') || roles.includes('super_admin')) return null;

  const [open, setOpen] = React.useState(false);

  const { data, setData, post, processing, errors, reset } = useForm<QuickRequisitionForm>({
    title: '',
    description: '',
    needed_by: new Date().toISOString().slice(0, 10),
    category: 'general',
    amount: '',
  } as QuickRequisitionForm);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('requisitions.store'), {
      onSuccess: () => {
        reset();
        setOpen(false);
      },
      preserveScroll: true,
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center justify-center rounded-md bg-red-600 px-3 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-red-700 disabled:opacity-60 ${className}`}
      >
        {label}
      </button>

      <Modal show={open} onClose={() => setOpen(false)} maxWidth="md">
        <form onSubmit={handleSubmit} className="p-4 sm:p-6">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">New requisition</h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Provide a clear title and optional description. Admins will review and either approve or request changes.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Title</label>
              <input
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                value={data.title}
                onChange={(e) => setData('title', e.target.value)}
                maxLength={255}
                required
              />
              {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Category</label>
              <select
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                value={data.category}
                onChange={(e) => setData('category', e.target.value as QuickRequisitionForm['category'])}
              >
                <option value="general">General</option>
                <option value="fuel">Fuel</option>
                <option value="vehicle_hire">Vehicle hire</option>
                <option value="events">Events</option>
                <option value="k9">K9</option>
                <option value="utilities">Utilities</option>
                <option value="office_supplies">Office supplies</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Amount</label>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                value={data.amount}
                onChange={(e) => setData('amount', e.target.value)}
                required
              />
              {errors.amount && <p className="text-xs text-red-500">{errors.amount}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Description (optional)</label>
              <textarea
                className="min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                value={data.description}
                onChange={(e) => setData('description', e.target.value)}
              />
              {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Needed by (optional)</label>
              <input
                type="date"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                value={data.needed_by}
                onChange={(e) => setData('needed_by', e.target.value)}
              />
              {errors.needed_by && <p className="text-xs text-red-500">{errors.needed_by}</p>}
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center rounded-md border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={processing}
              className="inline-flex items-center justify-center rounded-md bg-red-600 px-3 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-red-700 disabled:opacity-60"
            >
              {processing ? 'Submitting…' : 'Submit requisition'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
