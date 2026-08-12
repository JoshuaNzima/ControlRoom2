import React from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Badge } from '@/Components/ui/badge';
import IconMapper from '@/Components/IconMapper';

interface Client {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  status: 'active' | 'inactive';
  sites_count: number;
  guards_count?: number;
  contracts_count?: number;
}

interface ClientsIndexProps {
  clients: {
    data: Client[];
    meta?: any;
    links?: any[];
    stats?: { total: number; active: number; inactive: number; with_sites: number };
  };
  filters?: { search?: string; status?: string };
}

export default function ClientsIndex({ clients, filters = {} }: ClientsIndexProps) {
  const [search, setSearch] = React.useState<string>(filters.search || '');
  const [status, setStatus] = React.useState<string>(filters.status || '');

  const gotoTab = (next: string) => {
    setStatus(next);
    router.get(route('supervisor.clients'), { search, status: next || undefined }, { preserveState: true, preserveScroll: true });
  };

  const apply = () => {
    router.get(route('supervisor.clients'), { search: search || undefined, status: status || undefined }, { preserveState: true, preserveScroll: true });
  };

  const reset = () => {
    setSearch('');
    setStatus('');
    router.get(route('supervisor.clients'), {}, { preserveState: true, preserveScroll: true });
  };

  const statCards = [
    { label: 'Total Clients', value: clients.stats?.total || clients.meta?.total || clients.data.length, icon: 'Building', color: 'blue' },
    { label: 'Active', value: clients.stats?.active || clients.data.filter((c: Client) => c.status === 'active').length, icon: 'CheckCircle', color: 'emerald' },
    { label: 'Inactive', value: clients.stats?.inactive || clients.data.filter((c: Client) => c.status === 'inactive').length, icon: 'XCircle', color: 'gray' },
    { label: 'With Sites', value: clients.stats?.with_sites || clients.data.filter((c: Client) => c.sites_count > 0).length, icon: 'MapPin', color: 'amber' },
  ];

  return (
    <AuthenticatedLayout header="Clients">
      <Head title="Clients" />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-gradient-to-br from-red-900 via-red-800 to-red-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/10 rounded-lg backdrop-blur-sm">
                  <IconMapper name="Building" size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">Clients</h1>
                  <p className="text-red-100 text-sm mt-0.5">Manage client accounts and sites</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => router.visit(route('supervisor.clients.show', { client: 'create' }))}
                  className="bg-white text-red-900 hover:bg-red-50 font-medium"
                >
                  <IconMapper name="Plus" size={16} className="mr-2" />
                  Add Client
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {statCards.map((stat, idx) => (
              <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                  </div>
                  <div className={`p-2 rounded-lg ${stat.color === 'emerald' ? 'bg-emerald-100 dark:bg-emerald-900/20' : stat.color === 'amber' ? 'bg-amber-100 dark:bg-amber-900/20' : stat.color === 'gray' ? 'bg-gray-100 dark:bg-gray-800' : 'bg-blue-100 dark:bg-blue-900/20'}`}>
                    <IconMapper name={stat.icon} size={20} className={stat.color === 'emerald' ? 'text-emerald-600' : stat.color === 'amber' ? 'text-amber-600' : stat.color === 'gray' ? 'text-gray-600' : 'text-blue-600'} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <Card className="mb-6 dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-end gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search Clients</label>
                    <div className="relative">
                      <IconMapper name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && apply()}
                        className="pl-10 dark:bg-gray-900 dark:border-gray-600"
                        placeholder="Search by name..."
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={apply} className="bg-red-600 hover:bg-red-700">
                      <IconMapper name="Search" size={16} className="mr-1" />
                      Search
                    </Button>
                    <Button variant="outline" onClick={reset}>
                      <IconMapper name="X" size={16} className="mr-1" />
                      Clear
                    </Button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
                  <button
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${!status ? 'border-red-600 text-red-600 dark:text-red-400' : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}
                    onClick={() => gotoTab('')}
                  >
                    All Clients
                  </button>
                  <button
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${status === 'active' ? 'border-red-600 text-red-600 dark:text-red-400' : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}
                    onClick={() => gotoTab('active')}
                  >
                    Active
                  </button>
                  <button
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${status === 'inactive' ? 'border-red-600 text-red-600 dark:text-red-400' : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}
                    onClick={() => gotoTab('inactive')}
                  >
                    Inactive
                  </button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Clients List */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-0">
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {clients?.data?.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="inline-flex p-4 rounded-full bg-gray-100 dark:bg-gray-800 mb-3">
                      <IconMapper name="Building" size={32} className="text-gray-400" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">No clients found</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try adjusting your search or filters</p>
                  </div>
                ) : (
                  clients?.data?.map((c: Client) => (
                    <div key={c.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                            <IconMapper name="Building" size={20} className="text-red-600 dark:text-red-400" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-900 dark:text-gray-100">{c.name}</h3>
                              <Badge className={c.status === 'active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'}>
                                {c.status}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                              {c.email && (
                                <span className="flex items-center gap-1">
                                  <IconMapper name="Mail" size={12} />
                                  {c.email}
                                </span>
                              )}
                              {c.phone && (
                                <span className="flex items-center gap-1">
                                  <IconMapper name="Phone" size={12} />
                                  {c.phone}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
                              <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                                <IconMapper name="MapPin" size={12} />
                                {c.sites_count} site{c.sites_count !== 1 ? 's' : ''}
                              </span>
                              {c.guards_count !== undefined && (
                                <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                                  <IconMapper name="Users" size={12} />
                                  {c.guards_count} guard{c.guards_count !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => router.visit(route('supervisor.clients.show', c.id))}
                            variant="outline"
                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 border-red-600 dark:border-red-400"
                          >
                            <IconMapper name="Eye" size={14} className="mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination */}
              {clients?.links && clients.data.length > 0 && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Showing {clients.meta?.from || 1} to {clients.meta?.to || clients.data.length} of {clients.meta?.total || clients.data.length} results
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      {clients.links.filter((l: any) => l.url).map((l: any, idx: number) => (
                        <button
                          key={idx}
                          className={`px-3 py-1.5 text-sm rounded border dark:border-gray-700 transition-colors ${
                            l.active
                              ? 'bg-red-600 text-white border-red-600'
                              : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                          onClick={() => router.get(l.url, { search: search || undefined, status: status || undefined }, { preserveScroll: true, preserveState: true })}
                          dangerouslySetInnerHTML={{ __html: l.label }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
