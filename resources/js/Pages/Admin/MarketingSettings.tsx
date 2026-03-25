import React from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import MarketingLayout from '@/Layouts/MarketingLayout';

interface SocialLinks {
  facebook?: string | null;
  instagram?: string | null;
  linkedin?: string | null;
  x?: string | null;
  youtube?: string | null;
}

interface Settings {
  campaign_default_status: string;
  notify_on_new_lead: boolean;
  auto_assign_user_id: number | null;
  lead_sources: string[];
  social_links: SocialLinks;
  show_social_on_public: boolean;
  show_social_in_email_footer: boolean;
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
      social_links: settings.social_links || {},
      show_social_on_public: !!settings.show_social_on_public,
      show_social_in_email_footer: !!settings.show_social_in_email_footer,
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
      social_links: {
        facebook: data.social_links?.facebook || null,
        instagram: data.social_links?.instagram || null,
        linkedin: data.social_links?.linkedin || null,
        x: data.social_links?.x || null,
        youtube: data.social_links?.youtube || null,
      },
      show_social_on_public: !!data.show_social_on_public,
      show_social_in_email_footer: !!data.show_social_in_email_footer,
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

            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Social media</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Facebook URL</label>
                    <input
                      className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2"
                      value={data.social_links.facebook || ''}
                      onChange={(e) => setData('social_links', { ...data.social_links, facebook: e.target.value })}
                      placeholder="https://facebook.com/your-page"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Instagram URL</label>
                    <input
                      className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2"
                      value={data.social_links.instagram || ''}
                      onChange={(e) => setData('social_links', { ...data.social_links, instagram: e.target.value })}
                      placeholder="https://instagram.com/your-handle"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">LinkedIn URL</label>
                    <input
                      className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2"
                      value={data.social_links.linkedin || ''}
                      onChange={(e) => setData('social_links', { ...data.social_links, linkedin: e.target.value })}
                      placeholder="https://linkedin.com/company/your-company"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">X (Twitter) URL</label>
                    <input
                      className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2"
                      value={data.social_links.x || ''}
                      onChange={(e) => setData('social_links', { ...data.social_links, x: e.target.value })}
                      placeholder="https://x.com/your-handle"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">YouTube URL</label>
                    <input
                      className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2"
                      value={data.social_links.youtube || ''}
                      onChange={(e) => setData('social_links', { ...data.social_links, youtube: e.target.value })}
                      placeholder="https://youtube.com/@your-channel"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={!!data.show_social_on_public}
                      onChange={(e) => setData('show_social_on_public', e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-coin-600 focus:ring-coin-500"
                    />
                    <span>Show icons on public site footer</span>
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={!!data.show_social_in_email_footer}
                      onChange={(e) => setData('show_social_in_email_footer', e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-coin-600 focus:ring-coin-500"
                    />
                    <span>Show icons in email footers</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button type="submit" disabled={processing} className="px-4 py-2 rounded-md bg-coin-700 text-white hover:bg-coin-600 disabled:opacity-50">Save Settings</button>
            </div>
          </form>
        </div>
      </div>
    </MarketingLayout>
  );
}
