import React from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AssetManagementLayout from '@/Layouts/AssetManagementLayout';

interface Settings {
  asset_tag_prefix: string;
  vehicle_tag_prefix: string;
  service_interval_days: number;
  require_checkout_confirmation: boolean;
}

interface Props {
  auth?: any;
  settings: Settings;
}

export default function AssetSettings({ auth = {}, settings }: Props) {
  const { data, setData, processing, errors } = useForm<Settings>({
    asset_tag_prefix: settings.asset_tag_prefix,
    vehicle_tag_prefix: settings.vehicle_tag_prefix,
    service_interval_days: settings.service_interval_days,
    require_checkout_confirmation: !!settings.require_checkout_confirmation,
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, any> = { ...data };
    router.post(route('assets.settings.update'), payload, { preserveScroll: true });
  };

  return (
    <AssetManagementLayout title="Asset Settings" user={auth?.user as any}>
      <Head title="Asset Settings" />
      <div className="py-6">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Tagging</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Asset tag prefix</label>
                  <input
                    className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2"
                    value={data.asset_tag_prefix}
                    onChange={(e) => setData('asset_tag_prefix', e.target.value)}
                  />
                  {errors.asset_tag_prefix && <p className="text-sm text-red-600 mt-1">{errors.asset_tag_prefix}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vehicle tag prefix</label>
                  <input
                    className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2"
                    value={data.vehicle_tag_prefix}
                    onChange={(e) => setData('vehicle_tag_prefix', e.target.value)}
                  />
                  {errors.vehicle_tag_prefix && <p className="text-sm text-red-600 mt-1">{errors.vehicle_tag_prefix}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Service interval (days)</label>
                  <input
                    type="number"
                    min={0}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2"
                    value={data.service_interval_days}
                    onChange={(e) => setData('service_interval_days', Number(e.target.value) || 0)}
                  />
                  {errors.service_interval_days && <p className="text-sm text-red-600 mt-1">{errors.service_interval_days}</p>}
                </div>
                <div className="sm:col-span-2 flex items-center gap-3">
                  <input
                    id="checkout_confirm"
                    type="checkbox"
                    checked={!!data.require_checkout_confirmation}
                    onChange={(e) => setData('require_checkout_confirmation', e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <label htmlFor="checkout_confirm" className="text-sm text-gray-700 dark:text-gray-300">Require checkout confirmation</label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button type="submit" disabled={processing} className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">Save Settings</button>
            </div>
          </form>
        </div>
      </div>
    </AssetManagementLayout>
  );
}
