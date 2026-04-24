import React, { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import ClientLayout from '@/Layouts/ClientLayout';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import IconMapper from '@/Components/IconMapper';

interface Supervisor {
  name: string;
  email: string;
  phone: string;
}

interface Sergeant {
  name: string;
  phone: string;
}

interface Client {
  id: number;
  name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  contract_start_date: string | null;
  contract_end_date: string | null;
  monthly_rate: number;
  status: string;
  supervisor: Supervisor | null;
  sergeant: Sergeant | null;
}

interface ClientProfileProps {
  auth: {
    user: {
      id: number;
      name: string;
      email: string;
      phone?: string;
    };
  };
  client: Client | null;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-MW', {
    style: 'currency',
    currency: 'MWK',
    minimumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export default function ClientProfile({ auth, client }: ClientProfileProps) {
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const profileForm = useForm({
    name: auth.user.name,
    phone: auth.user.phone || '',
  });

  const passwordForm = useForm({
    current_password: '',
    password: '',
    password_confirmation: '',
  });

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    profileForm.put(route('client.profile.update'), {
      preserveScroll: true,
    });
  };

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    passwordForm.put(route('client.profile.password'), {
      preserveScroll: true,
      onSuccess: () => {
        passwordForm.reset();
        setShowPasswordForm(false);
      },
    });
  };

  return (
    <ClientLayout title="Profile" user={auth?.user}>
      <Head title="Profile" />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-gradient-to-br from-red-900 via-red-800 to-rose-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/10 rounded-lg backdrop-blur-sm">
                  <IconMapper name="User" size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">Profile & Settings</h1>
                  <p className="text-red-100 text-sm mt-0.5">Manage your account settings</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* User Profile Form */}
          <Card className="p-4 sm:p-6 dark:bg-gray-800 dark:border-gray-700">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <IconMapper name="User" size={20} className="text-red-600 dark:text-red-400" />
              Account Information
            </h3>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Full Name</label>
                <input
                  type="text"
                  value={profileForm.data.name}
                  onChange={(e) => profileForm.setData('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                />
                {profileForm.errors.name && (
                  <p className="text-red-500 text-xs mt-1">{profileForm.errors.name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Email</label>
                <input
                  type="email"
                  value={auth.user.email}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-sm cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Phone</label>
                <input
                  type="tel"
                  value={profileForm.data.phone}
                  onChange={(e) => profileForm.setData('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                />
                {profileForm.errors.phone && (
                  <p className="text-red-500 text-xs mt-1">{profileForm.errors.phone}</p>
                )}
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={profileForm.processing} className="bg-red-600 hover:bg-red-700 text-white">
                  {profileForm.processing ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Card>

          {/* Password Form */}
          <Card className="p-4 sm:p-6 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <IconMapper name="Lock" size={20} className="text-red-600 dark:text-red-400" />
                Password
              </h3>
              <Button
                variant="outline"
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                className="dark:border-gray-600 dark:text-gray-300"
              >
                {showPasswordForm ? 'Cancel' : 'Change Password'}
              </Button>
            </div>
            {showPasswordForm && (
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Current Password</label>
                  <input
                    type="password"
                    value={passwordForm.data.current_password}
                    onChange={(e) => passwordForm.setData('current_password', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                  />
                  {passwordForm.errors.current_password && (
                    <p className="text-red-500 text-xs mt-1">{passwordForm.errors.current_password}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">New Password</label>
                  <input
                    type="password"
                    value={passwordForm.data.password}
                    onChange={(e) => passwordForm.setData('password', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                  />
                  {passwordForm.errors.password && (
                    <p className="text-red-500 text-xs mt-1">{passwordForm.errors.password}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordForm.data.password_confirmation}
                    onChange={(e) => passwordForm.setData('password_confirmation', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                  />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={passwordForm.processing} className="bg-red-600 hover:bg-red-700 text-white">
                    {passwordForm.processing ? 'Updating...' : 'Update Password'}
                  </Button>
                </div>
              </form>
            )}
          </Card>

          {/* Client Information */}
          {client && (
            <Card className="p-4 sm:p-6 dark:bg-gray-800 dark:border-gray-700">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <IconMapper name="Building" size={20} className="text-red-600 dark:text-red-400" />
                Client Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Client Name</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{client.name}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                  <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                    client.status === 'active'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Contract Period</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {formatDate(client.contract_start_date)} - {formatDate(client.contract_end_date)}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Monthly Rate</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatCurrency(client.monthly_rate)}</p>
                </div>
                {client.address && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg sm:col-span-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Address</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{client.address}</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Assigned Personnel */}
          {client && (client.supervisor || client.sergeant) && (
            <Card className="p-4 sm:p-6 dark:bg-gray-800 dark:border-gray-700">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <IconMapper name="Users" size={20} className="text-red-600 dark:text-red-400" />
                Assigned Personnel
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {client.supervisor && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Supervisor</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{client.supervisor.name}</p>
                    <div className="mt-2 space-y-1">
                      {client.supervisor.email && (
                        <a href={`mailto:${client.supervisor.email}`} className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                          <IconMapper name="Mail" size={12} />
                          {client.supervisor.email}
                        </a>
                      )}
                      {client.supervisor.phone && (
                        <a href={`tel:${client.supervisor.phone}`} className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                          <IconMapper name="Phone" size={12} />
                          {client.supervisor.phone}
                        </a>
                      )}
                    </div>
                  </div>
                )}
                {client.sergeant && (
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <p className="text-xs text-purple-600 dark:text-purple-400 mb-1">Sergeant</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{client.sergeant.name}</p>
                    {client.sergeant.phone && (
                      <a href={`tel:${client.sergeant.phone}`} className="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 mt-2">
                        <IconMapper name="Phone" size={12} />
                        {client.sergeant.phone}
                      </a>
                    )}
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </ClientLayout>
  );
}
