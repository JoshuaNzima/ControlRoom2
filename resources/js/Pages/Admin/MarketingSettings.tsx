import React from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import MarketingLayout from '@/Layouts/MarketingLayout';

interface Settings {
  campaign_default_status: string;
  notify_on_new_lead: boolean;
  auto_assign_user_id: number | null;
  lead_sources: string[];
}

interface Props {
  auth?: any;
  settings: Settings;
  options: { channels: string[]; statuses: string[]; lead_sources: string[] };
  users: { id: number; name: string }[];
}

export default function MarketingSettings({ auth = {}, settings, options, users }: Props) {
  const { data, setData, processing, errors } = useForm<Settings & { lead_sources_text: string }>(
    {
      campaign_default_status: settings.campaign_default_status,
      notify_on_new_lead: !!settings.notify_on_new_lead,
      auto_assign_user_id: settings.auto_assign_user_id,
      lead_sources: settings.lead_sources || [],
      lead_sources_text: (settings.lead_sources || []).join(', '),
    }
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      campaign_default_status: data.campaign_default_status,
      notify_on_new_lead: !!data.notify_on_new_lead,
      auto_assign_user_id: data.auto_assign_user_id || null,
      lead_sources: (data.lead_sources_text || '').split(',').map(s => s.trim()).filter(Boolean),
    } as any;
    router.post(route('admin.marketing.settings.update'), payload, { preserveScroll: true });
  };

  return (
    <MarketingLayout title="Marketing Settings" user={auth?.user as any}>
      <Head title="Marketing Settings" />
      <div className="py-6">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Defaults</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Campaign default status</label>
                  <select
                    className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2"
                    value={data.campaign_default_status}
                    onChange={(e) => setData('campaign_default_status', e.target.value)}
                  >
                    {options.statuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {errors.campaign_default_status && <p className="text-sm text-red-600 mt-1">{errors.campaign_default_status}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Auto assign new leads to</label>
                  <select
                    className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2"
                    value={data.auto_assign_user_id ?? ''}
                    onChange={(e) => setData('auto_assign_user_id', e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">None</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                  {errors.auto_assign_user_id && <p className="text-sm text-red-600 mt-1">{errors.auto_assign_user_id}</p>}
                </div>
                <div className="sm:col-span-2 flex items-center gap-3">
                  <input
                    id="notify"
                    type="checkbox"
                    checked={!!data.notify_on_new_lead}
                    onChange={(e) => setData('notify_on_new_lead', e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <label htmlFor="notify" className="text-sm text-gray-700 dark:text-gray-300">Notify on new lead</label>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Lead sources</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Comma separated sources</label>
                <input
                  className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2"
                  value={data.lead_sources_text}
                  onChange={(e) => setData('lead_sources_text', e.target.value)}
                  placeholder="referral, website, email, call, event, other"
                />
                {errors.lead_sources && <p className="text-sm text-red-600 mt-1">{String(errors.lead_sources)}</p>}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button type="submit" disabled={processing} className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">Save Settings</button>
            </div>
          </form>
        </div>
      </div>
    </MarketingLayout>
  );
}
