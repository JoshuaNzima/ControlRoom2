import React from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import BusinessDevLayout from '@/Layouts/BusinessDevLayout';

interface Settings {
  default_event_status: string;
  default_billing_type: string;
  k9_default_units: number;
  invoice_tax_percentage: number;
  invoice_due_days: number;
}

interface Props {
  auth?: any;
  settings: Settings;
  options: { statuses: string[]; billing_types: string[] };
}

export default function BusinessDevSettings({ auth = {}, settings, options }: Props) {
  const { data, setData, processing, errors } = useForm<Settings>({
    default_event_status: settings.default_event_status,
    default_billing_type: settings.default_billing_type,
    k9_default_units: settings.k9_default_units,
    invoice_tax_percentage: settings.invoice_tax_percentage,
    invoice_due_days: settings.invoice_due_days,
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, any> = { ...data };
    router.post(route('admin.business-dev.settings.update'), payload, { preserveScroll: true });
  };

  return (
    <BusinessDevLayout title="Business Dev Settings" user={auth?.user as any}>
      <Head title="Business Dev Settings" />
      <div className="py-6">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Defaults</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Default event status</label>
                  <select
                    className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2"
                    value={data.default_event_status}
                    onChange={(e) => setData('default_event_status', e.target.value)}
                  >
                    {options.statuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {errors.default_event_status && <p className="text-sm text-red-600 mt-1">{errors.default_event_status}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Default billing type</label>
                  <select
                    className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2"
                    value={data.default_billing_type}
                    onChange={(e) => setData('default_billing_type', e.target.value)}
                  >
                    {options.billing_types.map(bt => <option key={bt} value={bt}>{bt}</option>)}
                  </select>
                  {errors.default_billing_type && <p className="text-sm text-red-600 mt-1">{errors.default_billing_type}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Default K9 units</label>
                  <input
                    type="number"
                    min={0}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2"
                    value={data.k9_default_units}
                    onChange={(e) => setData('k9_default_units', Number(e.target.value) || 0)}
                  />
                  {errors.k9_default_units && <p className="text-sm text-red-600 mt-1">{errors.k9_default_units}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Invoice tax (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.01}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2"
                    value={data.invoice_tax_percentage}
                    onChange={(e) => setData('invoice_tax_percentage', Number(e.target.value) || 0)}
                  />
                  {errors.invoice_tax_percentage && <p className="text-sm text-red-600 mt-1">{errors.invoice_tax_percentage}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Invoice due days</label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2"
                    value={data.invoice_due_days}
                    onChange={(e) => setData('invoice_due_days', Number(e.target.value) || 30)}
                  />
                  {errors.invoice_due_days && <p className="text-sm text-red-600 mt-1">{errors.invoice_due_days}</p>}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button type="submit" disabled={processing} className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">Save Settings</button>
            </div>
          </form>
        </div>
      </div>
    </BusinessDevLayout>
  );
}
