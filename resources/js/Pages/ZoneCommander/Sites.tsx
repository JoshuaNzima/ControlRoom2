import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import ZoneCommanderLayout from '@/Layouts/ZoneCommanderLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Badge } from '@/Components/ui/badge';
import IconMapper from '@/Components/IconMapper';
import { format } from 'date-fns';

interface Site {
  id: number;
  name: string;
  client_name: string;
  address: string;
  status: 'active' | 'inactive' | 'maintenance';
  guard_count: number;
  attendance_today: number;
  last_patrol: string | null;
  security_level: 'low' | 'medium' | 'high' | 'critical';
  coordinates: {
    lat: number;
    lng: number;
  };
  facilities: string[];
  contact_person: string;
  contact_phone: string;
}

interface SitesProps {
  sites: Site[];
}

export default function Sites({ sites = [] }: SitesProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'maintenance'>('all');
  const [securityFilter, setSecurityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');

  const filteredSites = sites.filter(site => {
    const matchesSearch = site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         site.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         site.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || site.status === statusFilter;
    const matchesSecurity = securityFilter === 'all' || site.security_level === securityFilter;
    return matchesSearch && matchesStatus && matchesSecurity;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getSecurityColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200';
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const totalSites = sites.length;
  const activeSites = sites.filter(s => s.status === 'active').length;
  const totalGuards = sites.reduce((sum, site) => sum + site.guard_count, 0);
  const presentGuards = sites.reduce((sum, site) => sum + site.attendance_today, 0);

  return (
    <ZoneCommanderLayout title="Sites">
      <Head title="Sites Management" />

      <div className="w-full min-h-screen p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <IconMapper name="MapPin" className="w-6 h-6 text-blue-600 dark:text-blue-200" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Total Sites</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalSites}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <IconMapper name="CheckCircle" className="w-6 h-6 text-green-600 dark:text-green-200" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Active Sites</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{activeSites}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <IconMapper name="Shield" className="w-6 h-6 text-purple-600 dark:text-purple-200" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Total Guards</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalGuards}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                  <IconMapper name="Users" className="w-6 h-6 text-orange-600 dark:text-orange-200" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Present Today</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{presentGuards}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconMapper name="MapPin" className="w-5 h-5" />
              Site Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex-1">
                <Input
                  placeholder="Search sites by name, client, or address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('all')}
                  size="sm"
                >
                  All Status
                </Button>
                <Button
                  variant={statusFilter === 'active' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('active')}
                  size="sm"
                >
                  Active
                </Button>
                <Button
                  variant={statusFilter === 'inactive' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('inactive')}
                  size="sm"
                >
                  Inactive
                </Button>
                <Button
                  variant={statusFilter === 'maintenance' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('maintenance')}
                  size="sm"
                >
                  Maintenance
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={securityFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setSecurityFilter('all')}
                  size="sm"
                >
                  All Security
                </Button>
                <Button
                  variant={securityFilter === 'critical' ? 'default' : 'outline'}
                  onClick={() => setSecurityFilter('critical')}
                  size="sm"
                >
                  Critical
                </Button>
                <Button
                  variant={securityFilter === 'high' ? 'default' : 'outline'}
                  onClick={() => setSecurityFilter('high')}
                  size="sm"
                >
                  High
                </Button>
              </div>
            </div>

            {/* Sites List */}
            <div className="space-y-4">
              {filteredSites.map((site) => (
                <Card key={site.id} className="hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{site.name}</h3>
                          <Badge className={getStatusColor(site.status)}>
                            {site.status.toUpperCase()}
                          </Badge>
                          <Badge className={getSecurityColor(site.security_level)}>
                            {site.security_level.toUpperCase()}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-300 mb-4">
                          <div className="flex items-center gap-2">
                            <IconMapper name="Building" className="w-4 h-4" />
                            <span>{site.client_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <IconMapper name="MapPin" className="w-4 h-4" />
                            <span>{site.address}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <IconMapper name="Shield" className="w-4 h-4" />
                            <span>{site.guard_count} guards</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <IconMapper name="Users" className="w-4 h-4" />
                            <span>{site.attendance_today} present</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Last Patrol</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {site.last_patrol ? format(new Date(site.last_patrol), 'MMM d, HH:mm') : '—'}
                            </p>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Contact Person</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{site.contact_person || '—'}</p>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Contact Phone</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{site.contact_phone || '—'}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {site.facilities.map((facility, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {facility}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 sm:ml-4 w-full sm:w-auto">
                        <Button variant="outline" size="sm" className="hover:bg-blue-50 dark:hover:bg-gray-900 w-full sm:w-auto">
                          <IconMapper name="Eye" className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                        <Button variant="outline" size="sm" className="hover:bg-green-50 dark:hover:bg-gray-900 w-full sm:w-auto">
                          <IconMapper name="Map" className="w-4 h-4 mr-2" />
                          View Map
                        </Button>
                        <Button variant="outline" size="sm" className="hover:bg-purple-50 dark:hover:bg-gray-900 w-full sm:w-auto">
                          <IconMapper name="ScanLine" className="w-4 h-4 mr-2" />
                          Start Patrol
                        </Button>
                        <Button variant="outline" size="sm" className="hover:bg-orange-50 dark:hover:bg-gray-900 w-full sm:w-auto">
                          <IconMapper name="FileText" className="w-4 h-4 mr-2" />
                          Reports
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredSites.length === 0 && (
              <div className="text-center py-12">
                <IconMapper name="MapPin" className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No sites found</h3>
                <p className="text-gray-500 dark:text-gray-400">Try adjusting your search or filter criteria.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ZoneCommanderLayout>
  );
}


