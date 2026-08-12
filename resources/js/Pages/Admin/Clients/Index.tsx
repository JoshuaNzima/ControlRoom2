import React, { useEffect, useState, useMemo } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
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

// Client Card Component
const ClientCard: React.FC<{
  client: Client;
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onToggleStatus: (client: Client) => void;
  onDelete: (client: Client) => void;
  loadingId: number | null;
}> = ({ client, onView, onEdit, onToggleStatus, onDelete, loadingId }) => {
  const status = statusConfig[client.status || 'active'] || statusConfig.active;
  const balance = (client.outstanding_amount || 0);
  const isLoading = loadingId === client.id;

  return (
    <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
      <div className="flex flex-col md:flex-row">
        {/* Status Indicator Bar */}
        <div className={`w-full md:w-1.5 ${
          client.status === 'overdue' ? 'bg-rose-500' :
          client.status === 'inactive' ? 'bg-gray-500' : 'bg-emerald-500'
        }`} />

        <div className="flex-1 p-4 md:p-5">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* Avatar */}
              <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0">
                {client.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {client.name}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge className={`${status.color} text-xs`}>
                    <IconMapper name={status.icon} size={12} className="mr-1 inline" />
                    {status.label}
                  </Badge>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Since {client.billing_start_date ? new Date(client.billing_start_date).toLocaleDateString() : 'Not set'}
                  </span>
                </div>
              </div>
            </div>

            {/* Balance Badge */}
            <div className="text-right shrink-0">
              {balance > 0 ? (
                <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-lg px-3 py-2">
                  <div className="text-xs text-rose-600 dark:text-rose-400 font-medium">Outstanding</div>
                  <div className="text-lg font-bold text-rose-700 dark:text-rose-400">{formatCurrencyMWK(balance)}</div>
                </div>
              ) : balance < 0 ? (
                <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-2">
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Credit</div>
                  <div className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{formatCurrencyMWK(Math.abs(balance))}</div>
                </div>
              ) : (
                <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-2">
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Balance</div>
                  <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Paid Up</div>
                </div>
              )}
            </div>
          </div>

          {/* Contact & Stats Grid */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Sites */}
            <div className="flex items-center gap-2 p-2.5 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <IconMapper name="MapPin" size={14} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-none">{client.sites_count || 0}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Sites</div>
              </div>
            </div>

            {/* Services */}
            <div className="flex items-center gap-2 p-2.5 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <IconMapper name="ShieldCheck" size={14} className="text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-none">{client.services_count || 0}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Services</div>
              </div>
            </div>

            {/* Monthly Rate */}
            <div className="flex items-center gap-2 p-2.5 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                <IconMapper name="DollarSign" size={14} className="text-amber-600 dark:text-amber-400" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-none truncate">
                  {client.monthly_rate ? formatCurrencyMWK(client.monthly_rate) : '—'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">/month</div>
              </div>
            </div>

            {/* Year Total */}
            <div className="flex items-center gap-2 p-2.5 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <div className="w-8 h-8 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg flex items-center justify-center">
                <IconMapper name="Wallet" size={14} className="text-cyan-600 dark:text-cyan-400" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-none truncate">
                  {formatCurrencyMWK(client.total_paid || 0)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Paid {new Date().getFullYear()}</div>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          {(client.contact_person || client.phone || client.email) && (
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-gray-600 dark:text-gray-400">
              {client.contact_person && (
                <span className="flex items-center gap-1.5">
                  <IconMapper name="User" size={14} className="text-gray-400" />
                  {client.contact_person}
                </span>
              )}
              {client.phone && (
                <span className="flex items-center gap-1.5">
                  <IconMapper name="Phone" size={14} className="text-gray-400" />
                  {client.phone}
                </span>
              )}
              {client.email && (
                <span className="flex items-center gap-1.5">
                  <IconMapper name="Mail" size={14} className="text-gray-400" />
                  <span className="truncate max-w-[200px]">{client.email}</span>
                </span>
              )}
            </div>
          )}

          {/* Last Payment */}
          {client.last_payment_date && (
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
              <IconMapper name="Clock" size={12} />
              Last payment {formatDistanceToNow(client.last_payment_date)}
            </div>
          )}

          {/* Action Bar */}
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onView(client.id)}
              disabled={isLoading}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            >
              <IconMapper name="Eye" size={16} className="mr-1.5" />
              View Details
            </Button>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(client.id);
                }}
                disabled={isLoading}
                className="text-blue-600 hover:text-blue-700"
              >
                {isLoading ? (
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
                  onToggleStatus(client);
                }}
                className={client.status === 'active' ? 'text-amber-600 hover:text-amber-700' : 'text-emerald-600 hover:text-emerald-700'}
                title={client.status === 'active' ? 'Deactivate' : 'Activate'}
              >
                <IconMapper name={client.status === 'active' ? 'PauseCircle' : 'PlayCircle'} size={16} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(client);
                }}
                className="text-red-500 hover:text-red-600"
              >
                <IconMapper name="Trash" size={16} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

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
  outstanding_amount?: number;
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
  status?: string;
  has_sites?: string;
}

interface PaginatedClients {
  data: Client[];
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
  from?: number;
  to?: number;
  links?: Array<{ url: string | null; label: string; active: boolean }>;
  // Inertia may also nest under meta
  meta?: {
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
    from?: number;
    to?: number;
  };
}

interface ClientsIndexProps {
  clients: PaginatedClients;
  filters: Filters;
  services?: Array<{ id: number; name: string; monthly_price: number; required_guards?: number }>;
  zones?: Array<{ id: number; name: string }>;
  supervisors?: Array<{ id: number; name: string; email?: string }>;
  sergeants?: Array<{ id: number; name: string; position?: string }>;
}

export default function ClientsIndex({ clients, filters, services = [], zones = [], supervisors = [], sergeants = [] }: ClientsIndexProps) {
  const [search, setSearch] = React.useState(filters.search || '');
  const initialPerPage = Number(filters?.per_page ?? clients.meta?.per_page ?? 20);
  const [perPage, setPerPage] = React.useState<number>(initialPerPage);
  const [hasSites, setHasSites] = React.useState<string>(filters.has_sites || '');
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
    router.get(route('admin.clients.index'), { search, per_page: perPage, has_sites: hasSites }, { preserveState: true });
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
    { icon: <IconMapper name="Users" size={20} />, title: 'Total Clients', value: meta.total || clients.data.length, subtitle: 'Registered clients', color: 'blue' as const },
    { icon: <IconMapper name="MapPin" size={20} />, title: 'Total Sites', value: totalSites, subtitle: 'Managed locations', color: 'green' as const },
    { icon: <IconMapper name="ShieldCheck" size={20} />, title: 'Active Services', value: totalServices, subtitle: 'Services provided', color: 'purple' as const },
    { icon: <IconMapper name="DollarSign" size={20} />, title: 'Outstanding', value: clients.data.reduce((sum, c) => sum + (c.outstanding_amount || 0), 0), subtitle: 'Total due', color: 'amber' as const },
  ], [clients, meta, totalSites, totalServices]);

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
    <AuthenticatedLayout header="Clients Management">
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
              <Button variant="outline" size="sm" onClick={() => { setHasSites(''); router.get(route('admin.clients.index'), { search, per_page: perPage, status: '', has_sites: '' }); }}>All</Button>
              <Button variant="outline" size="sm" onClick={() => router.get(route('admin.clients.index'), { status: 'active', per_page: perPage, search, has_sites: hasSites })}>Active</Button>
              <Button variant="outline" size="sm" onClick={() => router.get(route('admin.clients.index'), { status: 'overdue', per_page: perPage, search, has_sites: hasSites })}>Overdue</Button>
              <Button variant="outline" size="sm" onClick={() => router.get(route('admin.clients.index'), { status: 'inactive', per_page: perPage, search, has_sites: hasSites })}>Inactive</Button>
              <select
                className="h-9 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                value={String(perPage)}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setPerPage(v);
                  router.get(route('admin.clients.index'), { per_page: v, page: 1, search, has_sites: hasSites }, { preserveState: true });
                }}
              >
                <option value={10}>10/page</option>
                <option value={20}>20/page</option>
                <option value={50}>50/page</option>
                <option value={100}>100/page</option>
              </select>
              <select
                className="h-9 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                value={hasSites}
                onChange={(e) => {
                  const v = e.target.value;
                  setHasSites(v);
                  router.get(route('admin.clients.index'), { has_sites: v, per_page: perPage, search, page: 1 }, { preserveState: true });
                }}
              >
                <option value="">All Clients</option>
                <option value="1">With Sites</option>
                <option value="0">Without Sites</option>
              </select>
            </div>
          </Card>

          {/* Clients List */}
          {clients.data.length === 0 ? (
            <EmptyState
              title="No clients found"
              description={search ? "Try adjusting your search." : "Add your first client to get started."}
              icon="Users"
            />
          ) : (
            <div className="space-y-4">
              {clients.data.map((client) => (
                <ClientCard
                  key={client.id}
                  client={client}
                  onView={fetchClientAndView}
                  onEdit={fetchClientAndEdit}
                  onToggleStatus={toggleClientStatus}
                  onDelete={deleteClient}
                  loadingId={loadingClientId}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {meta.last_page > 1 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {meta.from || 1} to {meta.to || clients.data.length} of {meta.total} clients
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Page {meta.current_page} of {meta.last_page}
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {/* Previous button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => meta.current_page > 1 && router.get(route('admin.clients.index'), { ...urlParams, page: meta.current_page - 1 }, { preserveState: true })}
                  disabled={meta.current_page <= 1}
                >
                  ← Previous
                </Button>

                {/* Page numbers */}
                {Array.from({ length: meta.last_page }, (_, i) => i + 1)
                  .filter((page) => {
                    // Show first, last, current, and pages near current
                    return page === 1 || page === meta.last_page || Math.abs(page - meta.current_page) <= 2;
                  })
                  .reduce((acc: (number | string)[], page, idx, arr) => {
                    // Insert ellipsis between non-consecutive pages
                    if (idx > 0 && typeof arr[idx - 1] === 'number' && page - (arr[idx - 1] as number) > 1) {
                      acc.push('...');
                    }
                    acc.push(page);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    typeof item === 'string' ? (
                      <span key={`ellipsis-${idx}`} className="px-2 py-1 text-gray-400">…</span>
                    ) : (
                      <Button
                        key={item}
                        variant={item === meta.current_page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => router.get(route('admin.clients.index'), { ...urlParams, page: item }, { preserveState: true })}
                        className={item === meta.current_page ? 'bg-red-600 hover:bg-red-700' : ''}
                      >
                        {item}
                      </Button>
                    )
                  )}

                {/* Next button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => meta.current_page < meta.last_page && router.get(route('admin.clients.index'), { ...urlParams, page: meta.current_page + 1 }, { preserveState: true })}
                  disabled={meta.current_page >= meta.last_page}
                >
                  Next →
                </Button>
              </div>
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
              zones={zones}
              supervisors={supervisors}
              sergeants={sergeants}
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
    </AuthenticatedLayout>
  );
}
