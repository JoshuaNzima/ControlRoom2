import React, { useEffect, useState, useMemo } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
import AdminLayout from '@/Layouts/AdminLayout';
import IconMapper from '@/Components/IconMapper';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import EditClientModal from '@/Components/Clients/EditClientModal';
import ClientDetailsModal from '@/Components/Clients/ClientDetailsModal';
import BulkImportClientsModal from '@/Components/Clients/BulkImportClientsModal';
import AddClientModal from '@/Components/Clients/AddClientModal';
import EmptyState from '@/Components/ui/empty-state';
import { formatCurrencyMWK, formatDistanceToNow } from '@/Components/format';

// Animated Counter Component
const AnimatedCounter: React.FC<{ value: number; duration?: number }> = ({ value, duration = 1000 }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let startTime: number;
    let animationFrame: number;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * value));
      if (progress < 1) animationFrame = requestAnimationFrame(animate);
    };
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);
  return <span>{count.toLocaleString()}</span>;
};

// StatCard Component
const StatCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  value: number;
  subtitle: string;
  color: 'red' | 'blue' | 'green' | 'amber' | 'purple' | 'cyan';
}> = ({ icon, title, value, subtitle, color }) => {
  const colorMap = {
    red: { bg: 'bg-red-50 dark:bg-red-950/20', border: 'border-red-200 dark:border-red-800', icon: 'bg-red-600 text-white', text: 'text-red-700 dark:text-red-300' },
    blue: { bg: 'bg-blue-50 dark:bg-blue-950/20', border: 'border-blue-200 dark:border-blue-800', icon: 'bg-blue-600 text-white', text: 'text-blue-700 dark:text-blue-300' },
    green: { bg: 'bg-emerald-50 dark:bg-emerald-950/20', border: 'border-emerald-200 dark:border-emerald-800', icon: 'bg-emerald-600 text-white', text: 'text-emerald-700 dark:text-emerald-300' },
    amber: { bg: 'bg-amber-50 dark:bg-amber-950/20', border: 'border-amber-200 dark:border-amber-800', icon: 'bg-amber-600 text-white', text: 'text-amber-700 dark:text-amber-300' },
    purple: { bg: 'bg-purple-50 dark:bg-purple-950/20', border: 'border-purple-200 dark:border-purple-800', icon: 'bg-purple-600 text-white', text: 'text-purple-700 dark:text-purple-300' },
    cyan: { bg: 'bg-cyan-50 dark:bg-cyan-950/20', border: 'border-cyan-200 dark:border-cyan-800', icon: 'bg-cyan-600 text-white', text: 'text-cyan-700 dark:text-cyan-300' },
  };
  const colors = colorMap[color];
  return (
    <div className={`${colors.bg} ${colors.border} rounded-xl border p-4 transition-all duration-300 hover:scale-[1.02]`}>
      <div className="flex items-start justify-between">
        <div className={`${colors.icon} p-2.5 rounded-lg shadow-md`}>{icon}</div>
      </div>
      <div className="mt-3">
        <p className="text-xl font-bold text-gray-900 dark:text-gray-100"><AnimatedCounter value={value} /></p>
        <p className={`text-sm font-medium ${colors.text} mt-0.5`}>{title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
};

// Action Tile Component
const ActionTile: React.FC<{ icon: React.ReactNode; title: string; description: string; color: string; onClick?: () => void }> = ({ icon, title, description, color, onClick }) => (
  <button onClick={onClick} className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all text-left">
    <div className={`${color} p-2.5 rounded-lg text-white shadow-md shrink-0`}>{icon}</div>
    <div className="min-w-0">
      <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">{title}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{description}</p>
    </div>
  </button>
);

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
  monthly_rate?: number;
  last_payment_date?: string;
  billing_start_date?: string;
}

const statusConfig: Record<string, { color: string; icon: string; label: string }> = {
  active: { color: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40', icon: 'CheckCircle', label: 'Active' },
  overdue: { color: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40', icon: 'AlertCircle', label: 'Overdue' },
  inactive: { color: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700/40 dark:text-gray-300 dark:border-gray-600', icon: 'XCircle', label: 'Inactive' },
};

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

  const toggleClientStatus = async (client: Client) => {
    const newStatus = client.status === 'active' ? 'inactive' : 'active';
    const actionText = newStatus === 'active' ? 'activate' : 'deactivate';
    const confirmMessage = newStatus === 'inactive'
      ? `Deactivate "${client.name}"?\n\nThis will:\n- Set the client status to inactive\n- Deactivate all client sites\n- Preserve all historical data\n\nThe client can be reactivated at any time.`
      : `Activate "${client.name}"? This will restore the client and their sites to active status.`;

    if (!confirm(confirmMessage)) return;

    try {
      await axios.post(route('admin.clients.toggle-status', { client: client.id }), {
        status: newStatus,
      }, {
        headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      });
      router.reload({ only: ['clients'] });
    } catch (e: any) {
      const msg = e?.response?.data?.message || `Failed to ${actionText} client.`;
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

  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => { const timer = setInterval(() => setCurrentTime(new Date()), 60000); return () => clearInterval(timer); }, []);

  const totalSites = clients.data.reduce((sum, client) => sum + (client.sites_count || 0), 0);
  const totalServices = clients.data.reduce((sum, client) => sum + (client.services_count || 0), 0);

  const statCards = useMemo(() => [
    { icon: <IconMapper name="Users" size={20} />, title: 'Total Clients', value: clients.meta?.total || clients.data.length, subtitle: 'Registered clients', color: 'blue' as const },
    { icon: <IconMapper name="MapPin" size={20} />, title: 'Total Sites', value: totalSites, subtitle: 'Managed locations', color: 'green' as const },
    { icon: <IconMapper name="ShieldCheck" size={20} />, title: 'Active Services', value: totalServices, subtitle: 'Services provided', color: 'purple' as const },
    { icon: <IconMapper name="DollarSign" size={20} />, title: 'Revenue', value: clients.data.reduce((sum, c) => sum + (c.total_due || 0), 0), subtitle: 'Total due', color: 'amber' as const },
  ], [clients, totalSites, totalServices]);

  const quickActions = [
    { icon: <IconMapper name="Plus" size={18} />, title: 'Add Client', description: 'Register new client', color: 'bg-red-600', onClick: () => setShowAddClient(true) },
    { icon: <IconMapper name="FileUp" size={18} />, title: 'Bulk Import', description: 'Import clients CSV', color: 'bg-blue-600', onClick: () => setShowBulkImport(true) },
    { icon: <IconMapper name="RefreshCw" size={18} />, title: 'Refresh', description: 'Reload data', color: 'bg-emerald-600', onClick: () => router.reload() },
    { icon: <IconMapper name="Filter" size={18} />, title: 'Filters', description: 'Advanced options', color: 'bg-purple-600', onClick: () => {} },
  ];

  const urlParams = useMemo(() => {
    if (typeof window === 'undefined') return {} as any;
    const p = new URLSearchParams(window.location.search);
    const o: any = {};
    p.forEach((v, k) => { o[k] = v; });
    return o;
  }, []);

  return (
    <AdminLayout title="Clients Management">
      <Head title="Clients" />
      
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Hero Header */}
        <div className="bg-gradient-to-br from-red-900 via-red-800 to-red-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white/10 rounded-lg backdrop-blur-sm">
                    <IconMapper name="Users" size={24} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Clients Management</h1>
                    <p className="text-red-100 text-sm mt-0.5">Manage clients, sites, and services</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" asChild className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  <Link href={route('admin.payments.index')}>
                    <IconMapper name="DollarSign" size={18} className="mr-2" />
                    View Payments
                  </Link>
                </Button>
                <Button
                  onClick={() => setShowAddClient(true)}
                  className="bg-white text-red-700 hover:bg-red-50"
                >
                  <IconMapper name="Plus" size={18} className="mr-2" />
                  Add Client
                </Button>
                <div className="text-right hidden sm:block">
                  <p className="text-2xl font-mono font-semibold">
                    {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-red-200 text-xs">
                    {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
            {statCards.map((stat, idx) => (
              <StatCard key={idx} {...stat} />
            ))}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {quickActions.map((action, idx) => (
              <ActionTile key={idx} {...action} />
            ))}
          </div>

          {/* Filters */}
          <Card className="p-4 md:p-5 mb-6">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <IconMapper name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search clients by name, contact person, or email..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <Button onClick={handleSearch} className="bg-red-600 hover:bg-red-700">
                <IconMapper name="Search" size={18} className="mr-2" />
                Search
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={() => handleSearch()}>All</Button>
              <Button variant="outline" size="sm" onClick={() => router.get(route('admin.clients.index'), { status: 'active', per_page: perPage })}>Active</Button>
              <Button variant="outline" size="sm" onClick={() => router.get(route('admin.clients.index'), { status: 'overdue', per_page: perPage })}>Overdue</Button>
              <Button variant="outline" size="sm" onClick={() => router.get(route('admin.clients.index'), { status: 'inactive', per_page: perPage })}>Inactive</Button>
              <select
                className="h-9 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                value={String(perPage)}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setPerPage(v);
                  router.get(route('admin.clients.index'), { per_page: v, page: 1 }, { preserveState: true });
                }}
              >
                <option value={10}>10/page</option>
                <option value={20}>20/page</option>
                <option value={50}>50/page</option>
                <option value={100}>100/page</option>
              </select>
            </div>
          </Card>

          {/* Clients List - Card Based */}
          {clients.data.length === 0 ? (
            <EmptyState
              title="No clients found"
              description={search ? "Try adjusting your search." : "Add your first client to get started."}
              icon="Users"
            />
          ) : (
            <div className="space-y-3">
              {clients.data.map((client) => {
                const status = statusConfig[client.status || 'active'] || statusConfig.active;
                const balance = (client.total_due || 0) - (client.total_paid || 0);

                return (
                  <Card
                    key={client.id}
                    className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => fetchClientAndView(client.id)}
                  >
                    <div className="flex flex-col sm:flex-row">
                      {/* Left accent bar based on status */}
                      <div className={`w-full sm:w-1.5 ${
                        client.status === 'overdue' ? 'bg-rose-500' :
                        client.status === 'inactive' ? 'bg-gray-500' : 'bg-emerald-500'
                      }`} />

                      <div className="flex-1 p-4 sm:p-5">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Avatar */}
                              <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-lg flex items-center justify-center text-white font-bold shadow-sm shrink-0">
                                {client.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                  {client.name}
                                </h3>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  Since {client.billing_start_date || 'Not set'}
                                </span>
                              </div>
                              <Badge className={`${status.color} text-xs ml-2`}>
                                <IconMapper name={status.icon} size={12} className="mr-1 inline" />
                                {status.label}
                              </Badge>
                            </div>

                            {/* Contact Info */}
                            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
                              {client.contact_person && (
                                <span className="flex items-center gap-1">
                                  <IconMapper name="User" size={14} />
                                  {client.contact_person}
                                </span>
                              )}
                              {client.phone && (
                                <span className="flex items-center gap-1">
                                  <IconMapper name="Phone" size={14} />
                                  {client.phone}
                                </span>
                              )}
                              {client.email && (
                                <span className="flex items-center gap-1">
                                  <IconMapper name="Mail" size={14} />
                                  {client.email}
                                </span>
                              )}
                            </div>

                            {/* Stats Row */}
                            <div className="mt-3 flex flex-wrap items-center gap-4">
                              <span className="inline-flex items-center gap-1.5 text-sm">
                                <IconMapper name="MapPin" size={14} className="text-blue-500" />
                                <span className="font-medium text-gray-900 dark:text-gray-100">{client.sites_count || 0}</span>
                                <span className="text-gray-500 dark:text-gray-400">Sites</span>
                              </span>
                              <span className="inline-flex items-center gap-1.5 text-sm">
                                <IconMapper name="ShieldCheck" size={14} className="text-purple-500" />
                                <span className="font-medium text-gray-900 dark:text-gray-100">{client.services_count || 0}</span>
                                <span className="text-gray-500 dark:text-gray-400">Services</span>
                              </span>
                              {client.monthly_rate ? (
                                <span className="inline-flex items-center gap-1.5 text-sm">
                                  <IconMapper name="DollarSign" size={14} className="text-amber-500" />
                                  <span className="font-medium text-gray-900 dark:text-gray-100">
                                    {formatCurrencyMWK(client.monthly_rate)}
                                  </span>
                                  <span className="text-gray-500 dark:text-gray-400">/month</span>
                                </span>
                              ) : null}
                              {client.last_payment_date && (
                                <span className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                                  <IconMapper name="Clock" size={14} />
                                  Paid {formatDistanceToNow(client.last_payment_date)}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Right side: Balance & Actions */}
                          <div className="flex flex-col items-end gap-3">
                            {/* Balance Indicator */}
                            {balance > 0 ? (
                              <div className="text-right">
                                <div className="text-xs text-gray-500 dark:text-gray-400">Outstanding</div>
                                <div className="text-lg font-bold text-rose-600 dark:text-rose-400">
                                  {formatCurrencyMWK(balance)}
                                </div>
                              </div>
                            ) : balance < 0 ? (
                              <div className="text-right">
                                <div className="text-xs text-gray-500 dark:text-gray-400">Credit</div>
                                <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                                  {formatCurrencyMWK(Math.abs(balance))}
                                </div>
                              </div>
                            ) : (
                              <div className="text-right">
                                <div className="text-xs text-gray-500 dark:text-gray-400">Balance</div>
                                <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                                  Paid Up
                                </div>
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  fetchClientAndView(client.id);
                                }}
                                disabled={loadingClientId === client.id}
                              >
                                <IconMapper name="Eye" size={16} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  fetchClientAndEdit(client.id);
                                }}
                                disabled={loadingClientId === client.id}
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleClientStatus(client);
                                }}
                                className={client.status === 'active' ? 'text-amber-600' : 'text-emerald-600'}
                                title={client.status === 'active' ? 'Deactivate' : 'Activate'}
                              >
                                <IconMapper name={client.status === 'active' ? 'PauseCircle' : 'PlayCircle'} size={16} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteClient(client);
                                }}
                                className="text-red-500"
                              >
                                <IconMapper name="Trash" size={16} />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {clients.meta && clients.meta.last_page > 1 && (
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {clients.links?.map((link: any, idx: number) => (
                <Button
                  key={idx}
                  variant={link.active ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                  disabled={!link.url}
                  className={link.active ? 'bg-red-600 hover:bg-red-700' : ''}
                  dangerouslySetInnerHTML={{ __html: link.label }}
                />
              ))}
            </div>
          )}
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
      </div>
    </AdminLayout>
  );
}
