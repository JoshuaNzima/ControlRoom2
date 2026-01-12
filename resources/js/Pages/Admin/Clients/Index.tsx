import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
import AdminLayout from '@/Layouts/AdminLayout';
import IconMapper from '@/Components/IconMapper';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import EditClientModal from '@/Components/Clients/EditClientModal';
import ClientDetailsModal from '@/Components/Clients/ClientDetailsModal';
import BulkImportClientsModal from '@/Components/Clients/BulkImportClientsModal';
import AddClientModal from '@/Components/Clients/AddClientModal';
import { Pagination } from '@/Components/ui/Pagination';

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
  services_count?: number;
  last_payment_date?: string;
  billing_start_date?: string;
}

interface Filters {
  search?: string;
  per_page?: number | string;
  show_add?: number | string;
}

interface ClientsIndexProps {
  clients: {
    data: Client[];
    meta?: any;
    links?: Array<{ url: string | null; label: string; active: boolean }>;
  };
  filters: Filters;
  services?: Array<{ id: number; name: string; monthly_price: number; required_guards?: number }>;
  zones?: Array<{ id: number; name: string }>;
}

export default function ClientsIndex({ clients, filters, services = [], zones = [] }: ClientsIndexProps) {
  const [search, setSearch] = React.useState(filters.search || '');
  const initialPerPage = Number(filters?.per_page ?? clients.meta?.per_page ?? 20);
  const [perPage, setPerPage] = React.useState<number>(initialPerPage);
  const [editingClient, setEditingClient] = React.useState<Client | null>(null);
  const [loadingClientId, setLoadingClientId] = React.useState<number | null>(null);
  const [viewingClient, setViewingClient] = React.useState<Client | null>(null);
  const [showBulkImport, setShowBulkImport] = React.useState(false);
  const [showAddClient, setShowAddClient] = React.useState(false);
  React.useEffect(() => {
    // Open Add Client modal if server requested it (redirect from create route)
    if (filters?.show_add) {
      setShowAddClient(true);
    }
  }, []);

  const handleSearch = () => {
    router.get(route('admin.clients.index'), { search, per_page: perPage }, { preserveState: true });
  };

  const fetchClientAndView = async (id: number) => {
    setLoadingClientId(id);
    try {
      const url = route('admin.clients.json', { client: id });
      const res = await axios.get(url, { headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' }, timeout: 10000 });
      setViewingClient(res.data as any);
    } catch (e) {
      console.error('Failed to load client for viewing', e);
      if (confirm('Failed to load client details. Open full page instead?')) {
        router.visit(route('admin.clients.edit', { client: id }));
      }
    } finally {
      setLoadingClientId(null);
    }
  };

  const fetchClientAndEdit = async (id: number) => {
    setLoadingClientId(id);
    try {
      const url = route('admin.clients.json', { client: id });
      const res = await axios.get(url, {
        headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' },
        timeout: 10000,
      });
      // server returns full client object (with services & sites)
      setEditingClient(res.data);
    } catch (e) {
      console.error('Failed to load client', e);
      // Offer fallback: redirect to the edit page so user can still edit
      if (confirm('Failed to load client details from the API. Open full edit page instead?')) {
        router.visit(route('admin.clients.edit', { client: id }));
      }
    } finally {
      setLoadingClientId(null);
    }
  };

  const deleteClient = async (client: Client) => {
    if (!confirm('Are you sure you want to delete this client?')) return;
    try {
      await axios.delete(route('admin.clients.destroy', { client: client.id }), {
        headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      });
      router.reload({ only: ['clients'] });
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Failed to delete client.';
      alert(msg);
    }
  };

  // Normalize paginator meta for shared Pagination component
  const defaultMeta: any = { current_page: 1, last_page: 1, per_page: perPage || 20, total: clients?.data?.length || 0, from: 0, to: 0 };
  const rawClients: any = clients as any;
  const clientArr: any[] = Array.isArray(rawClients) ? (rawClients as any[]) : (rawClients?.data ?? []);
  const metaFromTop: any = rawClients && typeof rawClients === 'object' && !Array.isArray(rawClients) && (rawClients.current_page || rawClients.last_page || rawClients.total)
    ? {
        current_page: Number(rawClients.current_page ?? 1),
        last_page: Number(rawClients.last_page ?? 1),
        per_page: Number(rawClients.per_page ?? perPage ?? 20),
        total: Number(rawClients.total ?? clientArr.length ?? 0),
        from: Number(rawClients.from ?? ((clientArr.length > 0 && rawClients.current_page && rawClients.per_page) ? ((Number(rawClients.current_page) - 1) * Number(rawClients.per_page) + 1) : 0)),
        to: Number(rawClients.to ?? ((rawClients.from && clientArr.length) ? (Number(rawClients.from) + clientArr.length - 1) : (clientArr.length || 0))),
      }
    : null;
  const meta: any = Array.isArray(rawClients) ? defaultMeta : (rawClients?.meta ?? metaFromTop ?? defaultMeta);

  const urlParams = React.useMemo(() => {
    if (typeof window === 'undefined') return {} as any;
    const p = new URLSearchParams(window.location.search);
    const o: any = {};
    p.forEach((v, k) => { o[k] = v; });
    return o;
  }, []);

  return (
    <AdminLayout title="Clients Management">
      <Head title="Clients" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Clients Management</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage clients, sites, and services</p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <Button variant="outline" asChild>
              <Link href={route('admin.payments.index')}>
                <IconMapper name="DollarSign" size={18} className="mr-2" />
                View Payments
              </Link>
            </Button>
            <Button
              onClick={() => setShowAddClient(true)}
              className="flex items-center gap-2 bg-coin-700 text-white hover:bg-coin-600 focus:outline-none focus:ring-2 focus:ring-coin-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950"
            >
              <IconMapper name="Plus" size={18} />
              Add Client
            </Button>
            <Button onClick={() => setShowBulkImport(true)} variant="outline">
              <IconMapper name="FileUp" size={18} className="mr-2" />
              Bulk Import
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-br from-coin-50 to-coin-100 border-coin-200 dark:from-coin-900/20 dark:to-coin-900/10 dark:border-coin-900/30">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-coin-900 dark:text-coin-100">Total Clients</h3>
              <IconMapper name="Users" size={20} className="text-coin-600 dark:text-coin-300" />
            </div>
            <p className="text-2xl font-bold text-coin-900 dark:text-coin-100">{clients.meta?.total ?? clients.data.length}</p>
            <p className="text-sm text-coin-700 dark:text-coin-200 mt-1">Active clients in the system</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 dark:from-emerald-900/20 dark:to-emerald-900/10 dark:border-emerald-900/30">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-emerald-900 dark:text-emerald-100">Total Sites</h3>
              <IconMapper name="MapPin" size={20} className="text-emerald-600 dark:text-emerald-300" />
            </div>
            <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
              {clients.data.reduce((sum, client) => sum + (client.sites_count || 0), 0)}
            </p>
            <p className="text-sm text-emerald-700 dark:text-emerald-200 mt-1">Managed locations</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-coin-50 to-coin-100 border-coin-200 dark:from-coin-900/20 dark:to-coin-900/10 dark:border-coin-900/30">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-coin-900 dark:text-coin-100">Active Services</h3>
              <IconMapper name="ShieldCheck" size={20} className="text-coin-600 dark:text-coin-300" />
            </div>
            <p className="text-2xl font-bold text-coin-900 dark:text-coin-100">
              {clients.data.reduce((sum, client) => sum + (client.services_count || 0), 0)}
            </p>
            <p className="text-sm text-coin-700 dark:text-coin-200 mt-1">Services being provided</p>
          </Card>
        </div>

        <Card className="p-6 mb-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
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
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-coin-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950"
              />
            </div>
            <Button
              onClick={handleSearch}
              className="w-full sm:w-auto bg-coin-700 text-white hover:bg-coin-600 focus:outline-none focus:ring-2 focus:ring-coin-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950"
            >
              <IconMapper name="Search" size={18} className="mr-2" />
              Search
            </Button>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => handleSearch()}>All</Button>
            <Button variant="outline" size="sm" onClick={() => router.get(route('admin.clients.index'), { status: 'active', per_page: perPage })}>Active</Button>
            <Button variant="outline" size="sm" onClick={() => router.get(route('admin.clients.index'), { status: 'overdue', per_page: perPage })}>Overdue</Button>
            <Button variant="outline" size="sm" onClick={() => router.get(route('admin.clients.index'), { status: 'inactive', per_page: perPage })}>Inactive</Button>
            <div className="ml-2">
              <select
                className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-coin-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950"
                value={String(perPage)}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setPerPage(v);
                  // reset to first page when changing page size
                  router.get(route('admin.clients.index'), { per_page: v, page: 1 }, { preserveState: true });
                }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-800">
            {clients.data.length ? (
              clients.data.map((client) => (
                <div key={client.id} className="p-4 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <button
                        onClick={() => fetchClientAndView(client.id)}
                        className="text-sm font-semibold text-gray-900 dark:text-gray-100 hover:text-coin-700 dark:hover:text-coin-300 break-words text-left focus:outline-none focus:ring-2 focus:ring-coin-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950 rounded"
                      >
                        {client.name}
                      </button>
                      <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        Since: {client.billing_start_date || 'Not set'}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold ${
                        client.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200'
                          : client.status === 'overdue'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                      }`}
                    >
                      {client.status || 'Active'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium text-gray-900 dark:text-gray-100">Contact:</span>{' '}
                      <span className="break-words">{client.contact_person || 'N/A'}</span>
                    </div>
                    <div className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium text-gray-900 dark:text-gray-100">Phone:</span>{' '}
                      <span className="break-words">{client.phone || 'No phone'}</span>
                    </div>
                    <div className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium text-gray-900 dark:text-gray-100">Email:</span>{' '}
                      <span className="break-words">{client.email || 'No email'}</span>
                    </div>
                    <div className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium text-gray-900 dark:text-gray-100">Sites / Services:</span>{' '}
                      <button
                        onClick={() => fetchClientAndView(client.id)}
                        className="font-semibold text-coin-700 dark:text-coin-300 hover:text-coin-600 focus:outline-none focus:ring-2 focus:ring-coin-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950 rounded"
                      >
                        {(client.sites_count || 0)} / {(client.services_count || 0)}
                      </button>
                    </div>
                  </div>

                  {client.last_payment_date && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">Last paid: {client.last_payment_date}</div>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchClientAndView(client.id)}
                      disabled={loadingClientId === client.id}
                      className="bg-white dark:bg-gray-950 dark:text-gray-100 dark:border-gray-700"
                    >
                      <IconMapper name="Eye" size={16} className="mr-2" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchClientAndEdit(client.id)}
                      disabled={loadingClientId === client.id}
                      className="bg-white dark:bg-gray-950 dark:text-gray-100 dark:border-gray-700"
                    >
                      {loadingClientId === client.id ? (
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>
                      ) : (
                        <>
                          <IconMapper name="Pencil" size={16} className="mr-2" />
                          Edit
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteClient(client)}
                      className="bg-white dark:bg-gray-950 dark:text-gray-100 dark:border-gray-700"
                    >
                      <IconMapper name="Trash" size={16} className="mr-2 text-red-500" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-gray-500 dark:text-gray-400 text-sm">No clients found.</div>
            )}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-950">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Contact Info</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Sites</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Services</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {clients.data.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-coin-600 to-coin-700 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">
                          {client.name.charAt(0)}
                        </div>
                        <div>
                          <button onClick={() => fetchClientAndView(client.id)} className="font-medium text-gray-900 dark:text-gray-100 hover:text-coin-700 dark:hover:text-coin-300 block text-left focus:outline-none focus:ring-2 focus:ring-coin-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950 rounded">
                            {client.name}
                          </button>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Since: {client.billing_start_date || 'Not set'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900 dark:text-gray-100">{client.contact_person || 'N/A'}</div>
                        <div className="text-gray-500 dark:text-gray-400">{client.phone || 'No phone'}</div>
                        <div className="text-gray-500 dark:text-gray-400">{client.email || 'No email'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => fetchClientAndView(client.id)} className="inline-flex items-center gap-1 text-sm font-medium text-coin-700 dark:text-coin-300 hover:text-coin-600 focus:outline-none focus:ring-2 focus:ring-coin-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950 rounded">
                        <span>{client.sites_count || 0}</span>
                        <IconMapper name="ChevronRight" size={16} />
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => fetchClientAndView(client.id)} className="inline-flex items-center gap-1 text-sm font-medium text-coin-700 dark:text-coin-300 hover:text-coin-600 focus:outline-none focus:ring-2 focus:ring-coin-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950 rounded">
                        <span>{client.services_count || 0}</span>
                        <IconMapper name="ChevronRight" size={16} />
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          client.status === 'active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200' :
                          client.status === 'overdue' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                        }`}>
                          {client.status || 'Active'}
                        </span>
                        {client.last_payment_date && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
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
                          onClick={() => fetchClientAndView(client.id)}
                          disabled={loadingClientId === client.id}
                          className="text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <IconMapper name="Eye" size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => fetchClientAndEdit(client.id)}
                          disabled={loadingClientId === client.id}
                          className="text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          {loadingClientId === client.id ? (
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>
                          ) : (
                            <IconMapper name="Pencil" size={16} />
                          )}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => deleteClient(client)}
                          className="text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
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

        <div className="mt-4">
          <Pagination
            currentPage={meta.current_page}
            lastPage={meta.last_page}
            total={meta.total}
            perPage={meta.per_page}
            from={meta.from}
            to={meta.to}
            baseUrl={route('admin.clients.index')}
            filters={{ ...urlParams, search, per_page: perPage }}
          />
        </div>

        {editingClient && (
          <EditClientModal
            client={editingClient}
            open={true}
            services={services}
            onClose={() => setEditingClient(null)}
          />
        )}

        {viewingClient && (
          <ClientDetailsModal
            client={viewingClient}
            open={true}
            services={services}
            onClientUpdated={(c: any) => {
              setViewingClient(c);
              router.reload({ only: ['clients'] });
            }}
            onClose={() => setViewingClient(null)}
          />
        )}
        <BulkImportClientsModal
          open={showBulkImport}
          onClose={() => setShowBulkImport(false)}
        />
        <AddClientModal
          open={showAddClient}
          onClose={() => setShowAddClient(false)}
          services={services}
          zones={zones}
        />
      </div>
    </AdminLayout>
  );
}
