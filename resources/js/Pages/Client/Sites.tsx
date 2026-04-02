import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import IconMapper from '@/Components/IconMapper';

interface Site {
  id: number;
  name: string;
  address: string;
  contact_person: string | null;
  phone: string | null;
  required_guards: number;
  status: 'active' | 'inactive' | 'suspended';
  site_type: 'site' | 'office' | 'warehouse' | 'residential';
  zone_name?: string;
  checkpoints_count?: number;
  active_guards_count?: number;
}

interface ClientSitesProps {
  auth: {
    user: {
      id: number;
      name: string;
      email: string;
    };
  };
  client: {
    id: number;
    name: string;
  } | null;
  sites: Site[];
}

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const colors: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    suspended: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status] || colors.inactive}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const SiteTypeBadge: React.FC<{ type: string }> = ({ type }) => {
  const colors: Record<string, string> = {
    site: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    office: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    warehouse: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    residential: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
  };

  const labels: Record<string, string> = {
    site: 'Site',
    office: 'Office',
    warehouse: 'Warehouse',
    residential: 'Residential',
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${colors[type] || colors.site}`}>
      {labels[type] || type}
    </span>
  );
};

export default function ClientSites({ auth, client, sites }: ClientSitesProps) {
  const [filter, setFilter] = useState<string>('all');

  const filteredSites = filter === 'all' 
    ? sites 
    : sites.filter(s => s.status === filter);

  const stats = {
    total: sites.length,
    active: sites.filter(s => s.status === 'active').length,
    inactive: sites.filter(s => s.status === 'inactive').length,
  };

  if (!client) {
    return (
      <AdminLayout title="My Sites" user={auth?.user}>
        <Head title="My Sites" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Card className="p-8 text-center dark:bg-gray-800 dark:border-gray-700">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-amber-100 dark:bg-amber-900/20 rounded-full">
                <IconMapper name="AlertCircle" size={32} className="text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">No Client Assigned</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  Your account is not linked to any client. Please contact support for assistance.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="My Sites" user={auth?.user}>
      <Head title="My Sites" />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-gradient-to-br from-red-900 via-red-800 to-rose-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/10 rounded-lg backdrop-blur-sm">
                  <IconMapper name="Building" size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">My Sites</h1>
                  <p className="text-red-100 text-sm mt-0.5">View your assigned security sites</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4 dark:bg-gray-800 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Sites</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
            </Card>
            <Card className="p-4 dark:bg-gray-800 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">Active</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.active}</p>
            </Card>
            <Card className="p-4 dark:bg-gray-800 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">Inactive</p>
              <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{stats.inactive}</p>
            </Card>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
              className={filter === 'all' ? 'bg-red-600' : 'dark:border-gray-600 dark:text-gray-300'}
            >
              All Sites
            </Button>
            <Button
              variant={filter === 'active' ? 'default' : 'outline'}
              onClick={() => setFilter('active')}
              className={filter === 'active' ? 'bg-emerald-600' : 'dark:border-gray-600 dark:text-gray-300'}
            >
              Active
            </Button>
            <Button
              variant={filter === 'inactive' ? 'default' : 'outline'}
              onClick={() => setFilter('inactive')}
              className={filter === 'inactive' ? 'bg-gray-600' : 'dark:border-gray-600 dark:text-gray-300'}
            >
              Inactive
            </Button>
          </div>

          {/* Sites Grid */}
          {filteredSites.length === 0 ? (
            <Card className="p-8 text-center dark:bg-gray-800 dark:border-gray-700">
              <IconMapper name="Building" size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No sites found</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSites.map((site) => (
                <Card key={site.id} className="p-5 dark:bg-gray-800 dark:border-gray-700 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <IconMapper name="Building" size={20} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex gap-2">
                      <SiteTypeBadge type={site.site_type} />
                      <StatusBadge status={site.status} />
                    </div>
                  </div>

                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{site.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{site.address}</p>

                  <div className="space-y-2 text-sm">
                    {site.contact_person && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <IconMapper name="User" size={14} />
                        <span>{site.contact_person}</span>
                      </div>
                    )}
                    {site.phone && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <IconMapper name="Phone" size={14} />
                        <span>{site.phone}</span>
                      </div>
                    )}
                    {site.zone_name && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <IconMapper name="MapPin" size={14} />
                        <span>{site.zone_name}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">
                        <IconMapper name="Shield" size={14} className="inline mr-1" />
                        {site.required_guards} guards
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        <IconMapper name="CheckCircle" size={14} className="inline mr-1" />
                        {site.checkpoints_count || 0} checkpoints
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
