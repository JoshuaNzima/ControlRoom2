import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import IconMapper from '@/Components/IconMapper';

interface Settings {
  email_notifications: boolean;
  sms_notifications: boolean;
  push_notifications: boolean;
  incident_alerts: boolean;
  shift_reminders: boolean;
  invoice_reminders: boolean;
  report_notifications: boolean;
  language: string;
  timezone: string;
  date_format: string;
}

interface Client {
  id: number;
  name: string;
}

interface ClientSettingsProps {
  auth: {
    user: {
      id: number;
      name: string;
      email: string;
      phone?: string;
    };
  };
  client: Client | null;
  settings: Settings;
}

export default function ClientSettings({ auth, client, settings }: ClientSettingsProps) {
  const [form, setForm] = useState<Settings>(settings);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setLoadingState = (key: string, value: boolean) => {
    setLoading(prev => ({ ...prev, [key]: value }));
  };

  const setErrorState = (key: string, value: string) => {
    setErrors(prev => ({ ...prev, [key]: value }));
    if (value) setTimeout(() => setErrors(prev => ({ ...prev, [key]: '' })), 5000);
  };

  const handleToggle = (key: keyof Settings) => {
    const newValue = !form[key];
    setForm(prev => ({ ...prev, [key]: newValue }));
    
    // Auto-save on toggle
    setLoadingState(key, true);
    setErrorState(key, '');
    
    router.put(route('client.settings.update'), { [key]: newValue }, {
      preserveScroll: true,
      onFinish: () => setLoadingState(key, false),
      onError: (errs) => setErrorState(key, Object.values(errs)[0] || 'Failed to update'),
    });
  };

  const handleSelectChange = (key: keyof Settings, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
    
    // Auto-save on change
    setLoadingState(key, true);
    setErrorState(key, '');
    
    router.put(route('client.settings.update'), { [key]: value }, {
      preserveScroll: true,
      onFinish: () => setLoadingState(key, false),
      onError: (errs) => setErrorState(key, Object.values(errs)[0] || 'Failed to update'),
    });
  };

  const ToggleSwitch: React.FC<{
    label: string;
    description: string;
    field: keyof Settings;
    icon: string;
  }> = ({ label, description, field, icon }) => (
    <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg shrink-0">
          <IconMapper name={icon} size={18} className="text-red-600 dark:text-red-400" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{description}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => handleToggle(field)}
        disabled={loading[field]}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
          form[field] ? 'bg-red-600' : 'bg-gray-300 dark:bg-gray-600'
        } ${loading[field] ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            form[field] ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  return (
    <AuthenticatedLayout header="Settings" user={auth?.user}>
      <Head title="Settings" />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-gradient-to-br from-red-900 via-red-800 to-rose-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/10 rounded-lg backdrop-blur-sm">
                  <IconMapper name="Settings" size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">Settings</h1>
                  <p className="text-red-100 text-sm mt-0.5">Manage your preferences</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Error Display */}
          {errors.general && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{errors.general}</p>
            </div>
          )}

          {/* Notification Settings */}
          <Card className="p-4 sm:p-6 dark:bg-gray-800 dark:border-gray-700">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <IconMapper name="Bell" size={20} className="text-red-600 dark:text-red-400" />
              Notification Preferences
            </h3>
            <div className="space-y-3">
              <ToggleSwitch
                label="Email Notifications"
                description="Receive updates via email"
                field="email_notifications"
                icon="Mail"
              />
              <ToggleSwitch
                label="SMS Notifications"
                description="Receive alerts via SMS"
                field="sms_notifications"
                icon="Smartphone"
              />
              <ToggleSwitch
                label="Push Notifications"
                description="Browser push notifications"
                field="push_notifications"
                icon="Bell"
              />
            </div>
          </Card>

          {/* Alert Settings */}
          <Card className="p-4 sm:p-6 dark:bg-gray-800 dark:border-gray-700">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <IconMapper name="AlertCircle" size={20} className="text-red-600 dark:text-red-400" />
              Alert Settings
            </h3>
            <div className="space-y-3">
              <ToggleSwitch
                label="Incident Alerts"
                description="Get notified about security incidents"
                field="incident_alerts"
                icon="ShieldAlert"
              />
              <ToggleSwitch
                label="Shift Reminders"
                description="Reminders about guard shift changes"
                field="shift_reminders"
                icon="Clock"
              />
              <ToggleSwitch
                label="Invoice Reminders"
                description="Payment due date reminders"
                field="invoice_reminders"
                icon="CreditCard"
              />
              <ToggleSwitch
                label="Report Notifications"
                description="New report availability alerts"
                field="report_notifications"
                icon="FileText"
              />
            </div>
          </Card>

          {/* Regional Settings */}
          <Card className="p-4 sm:p-6 dark:bg-gray-800 dark:border-gray-700">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <IconMapper name="Globe" size={20} className="text-red-600 dark:text-red-400" />
              Regional Settings
            </h3>
            <div className="space-y-4">
              {/* Language */}
              <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg shrink-0">
                      <IconMapper name="Languages" size={18} className="text-red-600 dark:text-red-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Language</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Display language</p>
                    </div>
                  </div>
                  <select
                    value={form.language}
                    onChange={(e) => handleSelectChange('language', e.target.value)}
                    disabled={loading.language}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm disabled:opacity-60"
                  >
                    <option value="en">English</option>
                  </select>
                </div>
              </div>

              {/* Timezone */}
              <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg shrink-0">
                      <IconMapper name="Clock" size={18} className="text-red-600 dark:text-red-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Timezone</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Local time zone</p>
                    </div>
                  </div>
                  <select
                    value={form.timezone}
                    onChange={(e) => handleSelectChange('timezone', e.target.value)}
                    disabled={loading.timezone}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm disabled:opacity-60"
                  >
                    <option value="Africa/Blantyre">Africa/Blantyre (CAT)</option>
                    <option value="Africa/Lusaka">Africa/Lusaka (CAT)</option>
                    <option value="Africa/Harare">Africa/Harare (CAT)</option>
                    <option value="Africa/Johannesburg">Africa/Johannesburg (SAST)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
              </div>

              {/* Date Format */}
              <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg shrink-0">
                      <IconMapper name="Calendar" size={18} className="text-red-600 dark:text-red-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Date Format</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Preferred date display</p>
                    </div>
                  </div>
                  <select
                    value={form.date_format}
                    onChange={(e) => handleSelectChange('date_format', e.target.value)}
                    disabled={loading.date_format}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm disabled:opacity-60"
                  >
                    <option value="d/m/Y">DD/MM/YYYY</option>
                    <option value="m/d/Y">MM/DD/YYYY</option>
                    <option value="Y-m-d">YYYY-MM-DD</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* Client Info */}
          {client && (
            <Card className="p-4 sm:p-6 dark:bg-gray-800 dark:border-gray-700">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <IconMapper name="Building" size={20} className="text-red-600 dark:text-red-400" />
                Client Account
              </h3>
              <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400">Linked Client</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{client.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Contact your security provider for account-level changes.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
