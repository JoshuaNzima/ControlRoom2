import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import ZoneCommanderLayout from '@/Layouts/ZoneCommanderLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Badge } from '@/Components/ui/badge';
import IconMapper from '@/Components/IconMapper';
import { format } from 'date-fns';

interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive' | 'suspended';
  contract_start: string;
  contract_end: string;
  total_sites: number;
  active_guards: number;
  monthly_revenue: number;
  last_contact: string;
}

interface ClientsProps {
  clients: Client[];
}

export default function Clients({ clients = [] }: ClientsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'suspended'>('all');

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      case 'suspended': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const totalRevenue = clients.reduce((sum, client) => sum + client.monthly_revenue, 0);
  const activeClients = clients.filter(c => c.status === 'active').length;

  return (
    <ZoneCommanderLayout title="Clients">
      <Head title="Clients Management" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <IconMapper name="Building" className="w-6 h-6 text-blue-600 dark:text-blue-200" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Total Clients</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{clients.length}</p>
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
                  <p className="text-sm text-gray-600 dark:text-gray-300">Active Clients</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{activeClients}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <IconMapper name="MapPin" className="w-6 h-6 text-purple-600 dark:text-purple-200" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Total Sites</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {clients.reduce((sum, client) => sum + client.total_sites, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                  <IconMapper name="DollarSign" className="w-6 h-6 text-orange-600 dark:text-orange-200" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">${totalRevenue.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconMapper name="Search" className="w-5 h-5" />
              Client Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <Input
                  placeholder="Search clients by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('all')}
                  size="sm"
                >
                  All
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
                  variant={statusFilter === 'suspended' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('suspended')}
                  size="sm"
                >
                  Suspended
                </Button>
              </div>
            </div>

            {/* Clients List */}
            <div className="space-y-4">
              {filteredClients.map((client) => (
                <Card key={client.id} className="hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{client.name}</h3>
                          <Badge className={getStatusColor(client.status)}>
                            {client.status.toUpperCase()}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-300">
                          <div className="flex items-center gap-2">
                            <IconMapper name="Mail" className="w-4 h-4" />
                            <span>{client.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <IconMapper name="Phone" className="w-4 h-4" />
                            <span>{client.phone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <IconMapper name="MapPin" className="w-4 h-4" />
                            <span>{client.total_sites} sites</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <IconMapper name="Shield" className="w-4 h-4" />
                            <span>{client.active_guards} guards</span>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Contract Period</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {format(new Date(client.contract_start), 'MMM yyyy')} - {format(new Date(client.contract_end), 'MMM yyyy')}
                            </p>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Monthly Revenue</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">${client.monthly_revenue.toLocaleString()}</p>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Last Contact</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {format(new Date(client.last_contact), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        <Button variant="outline" size="sm" className="hover:bg-blue-50 dark:hover:bg-gray-900">
                          <IconMapper name="Eye" className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                        <Button variant="outline" size="sm" className="hover:bg-green-50 dark:hover:bg-gray-900">
                          <IconMapper name="Edit" className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" className="hover:bg-purple-50 dark:hover:bg-gray-900">
                          <IconMapper name="FileText" className="w-4 h-4 mr-2" />
                          Reports
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredClients.length === 0 && (
              <div className="text-center py-12">
                <IconMapper name="Building" className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No clients found</h3>
                <p className="text-gray-500 dark:text-gray-400">Try adjusting your search or filter criteria.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ZoneCommanderLayout>
  );
}


