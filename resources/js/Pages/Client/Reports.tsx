import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import IconMapper from '@/Components/IconMapper';

interface Incident {
  id: number;
  title: string;
  description: string | null;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  site_name: string | null;
  guard_name: string | null;
  created_at: string;
  resolved_at: string | null;
}

interface ClientReportsProps {
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
  incidents: Incident[];
}

const SeverityBadge: React.FC<{ severity: string }> = ({ severity }) => {
  const colors: Record<string, string> = {
    critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${colors[severity] || colors.medium}`}>
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </span>
  );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const colors: Record<string, string> = {
    open: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    'in-progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    resolved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    closed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status] || colors.closed}`}>
      {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
    </span>
  );
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateString);
};

export default function ClientReports({ auth, client, incidents }: ClientReportsProps) {
  const [filter, setFilter] = useState<{ status: string; severity: string }>({ status: 'all', severity: 'all' });

  const filteredIncidents = incidents.filter((incident) => {
    if (filter.status !== 'all' && incident.status !== filter.status) return false;
    if (filter.severity !== 'all' && incident.severity !== filter.severity) return false;
    return true;
  });

  const stats = {
    total: incidents.length,
    open: incidents.filter(i => i.status === 'open').length,
    resolved: incidents.filter(i => i.status === 'resolved' || i.status === 'closed').length,
    critical: incidents.filter(i => i.severity === 'critical').length,
  };

  if (!client) {
    return (
      <AdminLayout title="Reports" user={auth?.user}>
        <Head title="Reports" />
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
    <AdminLayout title="Security Reports" user={auth?.user}>
      <Head title="Reports" />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-gradient-to-br from-red-900 via-red-800 to-rose-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/10 rounded-lg backdrop-blur-sm">
                  <IconMapper name="FileText" size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">Security Reports</h1>
                  <p className="text-red-100 text-sm mt-0.5">View incidents and reports for your sites</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 dark:bg-gray-800 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Reports</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
            </Card>
            <Card className="p-4 dark:bg-gray-800 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">Open</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.open}</p>
            </Card>
            <Card className="p-4 dark:bg-gray-800 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">Resolved</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.resolved}</p>
            </Card>
            <Card className="p-4 dark:bg-gray-800 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">Critical</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.critical}</p>
            </Card>
          </div>

          {/* Filters */}
          <Card className="p-4 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status:</span>
                <div className="flex gap-1">
                  {['all', 'open', 'in-progress', 'resolved', 'closed'].map((status) => (
                    <Button
                      key={status}
                      size="sm"
                      variant={filter.status === status ? 'default' : 'outline'}
                      onClick={() => setFilter({ ...filter, status })}
                      className={filter.status === status ? 'bg-red-600' : 'dark:border-gray-600 dark:text-gray-300'}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Severity:</span>
                <div className="flex gap-1">
                  {['all', 'critical', 'high', 'medium', 'low'].map((severity) => (
                    <Button
                      key={severity}
                      size="sm"
                      variant={filter.severity === severity ? 'default' : 'outline'}
                      onClick={() => setFilter({ ...filter, severity })}
                      className={filter.severity === severity ? 'bg-red-600' : 'dark:border-gray-600 dark:text-gray-300'}
                    >
                      {severity.charAt(0).toUpperCase() + severity.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Incidents List */}
          {filteredIncidents.length === 0 ? (
            <Card className="p-8 text-center dark:bg-gray-800 dark:border-gray-700">
              <IconMapper name="FileText" size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No reports found</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredIncidents.map((incident) => (
                <Card key={incident.id} className="p-5 dark:bg-gray-800 dark:border-gray-700">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{incident.title}</h3>
                        <SeverityBadge severity={incident.severity} />
                        <StatusBadge status={incident.status} />
                      </div>

                      {incident.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{incident.description}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        {incident.site_name && (
                          <span className="flex items-center gap-1">
                            <IconMapper name="Building" size={14} />
                            {incident.site_name}
                          </span>
                        )}
                        {incident.guard_name && (
                          <span className="flex items-center gap-1">
                            <IconMapper name="Shield" size={14} />
                            {incident.guard_name}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <IconMapper name="Clock" size={14} />
                          {formatRelativeTime(incident.created_at)}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        Reported: {formatDate(incident.created_at)}
                      </p>
                      {incident.resolved_at && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          Resolved: {formatDate(incident.resolved_at)}
                        </p>
                      )}
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
