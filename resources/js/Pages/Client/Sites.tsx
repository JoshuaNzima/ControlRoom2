import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import IconMapper from '@/Components/IconMapper';

interface GuardOnDuty {
  id: number;
  guard_id: number;
  guard_name: string | null;
  position: string | null;
  check_in_time: string | null;
  status: string;
}

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
  latitude?: number | null;
  longitude?: number | null;
  checkpoints_count?: number;
  active_guards?: number;
  scheduled_shifts?: number;
  guards_on_duty?: GuardOnDuty[];
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
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const filteredSites = filter === 'all' 
    ? sites 
    : sites.filter(s => s.status === filter);

  const stats = {
    total: sites.length,
    active: sites.filter(s => s.status === 'active').length,
    inactive: sites.filter(s => s.status === 'inactive').length,
    totalGuardsOnDuty: sites.reduce((sum, s) => sum + (s.active_guards || 0), 0),
    totalShifts: sites.reduce((sum, s) => sum + (s.scheduled_shifts || 0), 0),
  };

  const handleViewSite = (site: Site) => {
    setSelectedSite(site);
    setIsDetailModalOpen(true);
  };

  if (!client) {
    return (
      <AuthenticatedLayout header="My Sites" user={auth?.user}>
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
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout header="My Sites" user={auth?.user}>
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <Card className="p-3 sm:p-4 dark:bg-gray-800 dark:border-gray-700">
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Total Sites</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
            </Card>
            <Card className="p-3 sm:p-4 dark:bg-gray-800 dark:border-gray-700">
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Active</p>
              <p className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.active}</p>
            </Card>
            <Card className="p-3 sm:p-4 dark:bg-gray-800 dark:border-gray-700">
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">On Duty</p>
              <p className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalGuardsOnDuty}</p>
            </Card>
            <Card className="p-3 sm:p-4 dark:bg-gray-800 dark:border-gray-700">
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Shifts Today</p>
              <p className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.totalShifts}</p>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {filteredSites.map((site) => (
                <Card 
                  key={site.id} 
                  className="p-4 sm:p-5 dark:bg-gray-800 dark:border-gray-700 hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => handleViewSite(site)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <IconMapper name="Building" size={20} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex flex-wrap gap-1 sm:gap-2">
                      <SiteTypeBadge type={site.site_type} />
                      <StatusBadge status={site.status} />
                    </div>
                  </div>

                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 text-sm sm:text-base">{site.name}</h3>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{site.address}</p>

                  {/* Guards on Duty Indicator */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      (site.active_guards || 0) >= site.required_guards
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                        : (site.active_guards || 0) > 0
                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                    }`}>
                      <IconMapper name="UserCheck" size={12} />
                      <span>{site.active_guards || 0}/{site.required_guards} on duty</span>
                    </div>
                    {(site.scheduled_shifts || 0) > 0 && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full text-xs text-blue-700 dark:text-blue-300">
                        <IconMapper name="Calendar" size={12} />
                        <span>{site.scheduled_shifts} shifts</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs sm:text-sm">
                    {site.contact_person && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <IconMapper name="User" size={14} />
                        <span className="truncate">{site.contact_person}</span>
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

                  <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-gray-500 dark:text-gray-400">
                        <IconMapper name="Shield" size={14} className="inline mr-1" />
                        {site.required_guards} required
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

      {/* Site Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto dark:bg-gray-800 dark:border-gray-700">
          {selectedSite && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  <IconMapper name="Building" size={20} className="text-blue-600 dark:text-blue-400" />
                  {selectedSite.name}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                {/* Status & Type */}
                <div className="flex gap-2">
                  <SiteTypeBadge type={selectedSite.site_type} />
                  <StatusBadge status={selectedSite.status} />
                </div>

                {/* Address */}
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Address</p>
                  <p className="text-sm text-gray-900 dark:text-gray-100">{selectedSite.address}</p>
                </div>

                {/* Guards on Duty */}
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Guards on Duty</p>
                    <span className={`text-sm font-medium ${
                      (selectedSite.active_guards || 0) >= selectedSite.required_guards
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}>
                      {selectedSite.active_guards || 0}/{selectedSite.required_guards}
                    </span>
                  </div>
                  {selectedSite.guards_on_duty && selectedSite.guards_on_duty.length > 0 ? (
                    <div className="space-y-2">
                      {selectedSite.guards_on_duty.map((guard) => (
                        <div key={guard.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                              <IconMapper name="User" size={16} className="text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{guard.guard_name || 'Unknown'}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{guard.position || 'Guard'}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Since {guard.check_in_time || 'N/A'}</p>
                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                              guard.status === 'present' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' :
                              guard.status === 'late' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' :
                              'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}>
                              {guard.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">No guards currently on duty</p>
                  )}
                </div>

                {/* Contact Info */}
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Contact Information</p>
                  <div className="space-y-1.5 text-sm">
                    {selectedSite.contact_person && (
                      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <IconMapper name="User" size={14} />
                        <span>{selectedSite.contact_person}</span>
                      </div>
                    )}
                    {selectedSite.phone && (
                      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <IconMapper name="Phone" size={14} />
                        <a href={`tel:${selectedSite.phone}`} className="text-blue-600 dark:text-blue-400 hover:underline">{selectedSite.phone}</a>
                      </div>
                    )}
                    {selectedSite.zone_name && (
                      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <IconMapper name="MapPin" size={14} />
                        <span>{selectedSite.zone_name}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Checkpoints */}
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Checkpoints</p>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedSite.checkpoints_count || 0}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <IconMapper name="CheckCircle" size={16} className="text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">Security patrol points configured</span>
                  </div>
                </div>

                {/* Location */}
                {selectedSite.latitude && selectedSite.longitude && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Location</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                      {selectedSite.latitude.toFixed(6)}, {selectedSite.longitude.toFixed(6)}
                    </p>
                  </div>
                )}

                {/* Close Button */}
                <Button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                >
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AuthenticatedLayout>
  );
}
