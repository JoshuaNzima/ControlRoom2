import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import IconMapper from '@/Components/IconMapper';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import EditClientModal from '@/Components/Clients/EditClientModal';
import ClientDetailsModal from '@/Components/Clients/ClientDetailsModal';

interface Client {
  id: number;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  status?: string;
  sites_count?: number;
  total_due?: number;
  total_paid?: number;
  service_count?: number;
  last_payment_date?: string;
  billing_start_date?: string;
}

interface Filters {
  search?: string;
}

interface ClientsIndexProps {
  clients: {
    data: Client[];
    meta?: any;
  };
  filters: Filters;
}

export default function ClientsIndex({ clients, filters }: ClientsIndexProps) {
  const [search, setSearch] = React.useState(filters.search || '');
  const [editingClient, setEditingClient] = React.useState<Client | null>(null);
  const [viewingClient, setViewingClient] = React.useState<Client | null>(null);

  const handleSearch = () => {
    router.get(route('clients.index'), { search }, { preserveState: true });
  };

  return (
    <AdminLayout title="Clients Management">
      <Head title="Clients" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Clients Management</h1>
            <p className="text-gray-600">Manage clients, sites, and services</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" asChild>
              <Link href={route('admin.payments.index')}>
                <IconMapper name="DollarSign" size={18} className="mr-2" />
                View Payments
              </Link>
            </Button>
            <Button asChild>
              <Link href={route('clients.create')} className="flex items-center gap-2">
                <IconMapper name="Plus" size={18} />
                Add Client
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-blue-900">Total Clients</h3>
              <IconMapper name="Users" size={20} className="text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-blue-900">{clients.data.length}</p>
            <p className="text-sm text-blue-700 mt-1">Active clients in the system</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-emerald-900">Total Sites</h3>
              <IconMapper name="MapPin" size={20} className="text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-emerald-900">
              {clients.data.reduce((sum, client) => sum + (client.sites_count || 0), 0)}
            </p>
            <p className="text-sm text-emerald-700 mt-1">Managed locations</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-purple-900">Active Services</h3>
              <IconMapper name="ShieldCheck" size={20} className="text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-purple-900">
              {clients.data.reduce((sum, client) => sum + (client.service_count || 0), 0)}
            </p>
            <p className="text-sm text-purple-700 mt-1">Services being provided</p>
          </Card>
        </div>

        <Card className="p-6 mb-6">
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-3 text-gray-400">
                <IconMapper name="Search" size={20} />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search clients by name, contact person, or email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <Button onClick={handleSearch} variant="secondary">
              <IconMapper name="Search" size={18} className="mr-2" />
              Search
            </Button>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => handleSearch()}>All</Button>
            <Button variant="outline" size="sm" onClick={() => router.get(route('clients.index'), { status: 'active' })}>Active</Button>
            <Button variant="outline" size="sm" onClick={() => router.get(route('clients.index'), { status: 'overdue' })}>Overdue</Button>
            <Button variant="outline" size="sm" onClick={() => router.get(route('clients.index'), { status: 'inactive' })}>Inactive</Button>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact Info</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Sites</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Services</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clients.data.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm"> 
                          {client.name.charAt(0)}
                        </div>
                        <div>
                          <Link
                            href={route('clients.show', { client: client.id })}
                            className="font-medium text-gray-900 hover:text-blue-600 block"
                          >
                            {client.name}
                          </Link>
                          <span className="text-xs text-gray-500">
                            Since: {client.billing_start_date || 'Not set'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">{client.contact_person || 'N/A'}</div>
                        <div className="text-gray-500">{client.phone || 'No phone'}</div>
                        <div className="text-gray-500">{client.email || 'No email'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Link
                        href={route('clients.show', { client: client.id })}
                        className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        <span>{client.sites_count || 0}</span>
                        <IconMapper name="ChevronRight" size={16} />
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Link
                        href={route('clients.show', { client: client.id })}
                        className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        <span>{client.service_count || 0}</span>
                        <IconMapper name="ChevronRight" size={16} />
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          client.status === 'active' ? 'bg-green-100 text-green-800' : 
                          client.status === 'overdue' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {client.status || 'Active'}
                        </span>
                        {client.last_payment_date && (
                          <span className="text-xs text-gray-500">
                            Last paid: {client.last_payment_date}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setViewingClient(client)}
                        >
                          <IconMapper name="Eye" size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setEditingClient(client)}
                        >
                          <IconMapper name="Pencil" size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this client?')) {
                              router.delete(route('clients.destroy', { client: client.id }));
                            }
                          }}
                        >
                          <IconMapper name="Trash" size={16} className="text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {clients.meta?.links && clients.meta.links.length > 3 && (
          <div className="mt-4 flex justify-center">
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              {clients.meta.links.map((link: any, i: number) => (
                <Button
                  key={i}
                  variant={link.active ? "default" : "outline"}
                  disabled={!link.url}
                  onClick={() => router.get(link.url)}
                  className="relative inline-flex items-center px-4 py-2 text-sm font-medium"
                >
                  <span dangerouslySetInnerHTML={{ __html: link.label }}></span>
                </Button>
              ))}
            </nav>
          </div>
        )}

        {editingClient && (
          <EditClientModal
            client={editingClient}
            open={true}
            onClose={() => setEditingClient(null)}
          />
        )}

        {viewingClient && (
          <ClientDetailsModal
            client={viewingClient}
            open={true}
            onClose={() => setViewingClient(null)}
          />
        )}
      </div>
    </AdminLayout>
  );
}
