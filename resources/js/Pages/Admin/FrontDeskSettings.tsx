import React from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import FrontDeskLayout from '@/Layouts/FrontDeskLayout';
import PushNotificationSettings from '@/Components/Common/PushNotificationSettings';

const frontDeskFieldClassName =
  'w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 focus:border-red-500 focus:ring-1 focus:ring-red-500';

interface Settings {
  visitor_badge_prefix: string;
  auto_notify_security: boolean;
  working_hours: string;
  default_ticket_priority: 'low' | 'normal' | 'high' | 'urgent';
}

interface Props {
  auth?: any;
  settings: Settings;
  options?: { priorities: string[] };
}

export default function FrontDeskSettings({ auth = {}, settings, options = { priorities: ['low','normal','high','urgent'] } }: Props) {
  const { data, setData, processing, errors } = useForm<Settings>({
    visitor_badge_prefix: settings.visitor_badge_prefix,
    auto_notify_security: !!settings.auto_notify_security,
    working_hours: settings.working_hours,
    default_ticket_priority: settings.default_ticket_priority,
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, any> = { ...data };
    router.post(route('admin.front-desk.settings.update'), payload, { preserveScroll: true });
  };

  return (
    <FrontDeskLayout title="Front Desk Settings" user={auth?.user as any}>
      <Head title="Front Desk Settings" />
      <div className="py-6">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Push Notifications */}
          <PushNotificationSettings />

          <form onSubmit={onSubmit} className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">General</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Visitor badge prefix</label>
                  <input
                    className={frontDeskFieldClassName}
                    value={data.visitor_badge_prefix}
                    onChange={(e) => setData('visitor_badge_prefix', e.target.value)}
                  />
                  {errors.visitor_badge_prefix && <p className="text-sm text-red-600 mt-1">{errors.visitor_badge_prefix}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Default ticket priority</label>
                  <select
                    className={frontDeskFieldClassName}
                    value={data.default_ticket_priority}
                    onChange={(e) => setData('default_ticket_priority', e.target.value as any)}
                  >
                    {options.priorities.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  {errors.default_ticket_priority && <p className="text-sm text-red-600 mt-1">{errors.default_ticket_priority}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Working hours</label>
                  <input
                    placeholder="08:00-17:00"
                    className={frontDeskFieldClassName}
                    value={data.working_hours}
                    onChange={(e) => setData('working_hours', e.target.value)}
                  />
                  {errors.working_hours && <p className="text-sm text-red-600 mt-1">{errors.working_hours}</p>}
                </div>
                <div className="sm:col-span-2 flex items-center gap-3">
                  <input
                    id="notify"
                    type="checkbox"
                    checked={!!data.auto_notify_security}
                    onChange={(e) => setData('auto_notify_security', e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-red-600 focus:ring-2 focus:ring-red-500"
                  />
                  <label htmlFor="notify" className="text-sm text-gray-700 dark:text-gray-300">Auto-notify security on visitor check-in</label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="submit"
                disabled={processing}
                className="w-full sm:w-auto px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950"
              >
                Save Settings
              </button>
            </div>
          </form>
        </div>
      </div>
    </FrontDeskLayout>
  );
}
