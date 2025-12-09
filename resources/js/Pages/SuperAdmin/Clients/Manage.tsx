import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import SuperAdminLayout from '@/Layouts/SuperAdminLayout';
import IconMapper from '@/Components/IconMapper';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import EditClientModal from '@/Components/Clients/EditClientModal';
import ClientDetailsModal from '@/Components/Clients/ClientDetailsModal';
import AddClientModal from '@/Components/Clients/AddClientModal';
import axios from 'axios';
import BulkImportClientsModal from '@/Components/Clients/BulkImportClientsModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/dialog';

interface Client {
  id: number;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  status?: string;
  sites_count?: number;
  services_count?: number;
  billing_start_date?: string;
}

interface ManageProps {
  clients: {
    data: Client[];
    meta?: any;
    links?: Array<{ url: string | null; label: string; active: boolean }>;
  } | any;
  filters: { search?: string; per_page?: number | string };
  services?: Array<{ id: number; name: string; monthly_price: number }>;
  zones?: Array<{ id: number; name: string }>;
}

export default function Manage({ clients, filters, services = [], zones = [] }: ManageProps) {
  const [search, setSearch] = React.useState(filters.search || '');
  const initialPerPage = Number((clients?.meta?.per_page ?? filters.per_page) || 20);
  const [perPage, setPerPage] = React.useState<number>(initialPerPage);
  const [editingClient, setEditingClient] = React.useState<any | null>(null);
  const [viewingClient, setViewingClient] = React.useState<any | null>(null);
  const [showAddClient, setShowAddClient] = React.useState(false);
  const [showBulkImport, setShowBulkImport] = React.useState(false);
  const [loadingId, setLoadingId] = React.useState<number | null>(null);
  const [showBulkSites, setShowBulkSites] = React.useState(false);
  const [bulkSites, setBulkSites] = React.useState<any[]>([]);
  const [bulkSearch, setBulkSearch] = React.useState('');
  const [bulkZoneFilter, setBulkZoneFilter] = React.useState<string>('');
  const [selectedSiteIds, setSelectedSiteIds] = React.useState<number[]>([]);
  const [bulkAction, setBulkAction] = React.useState<'activate' | 'deactivate' | 'move_zone' | 'set_required_guards'>('activate');
  const [bulkTargetZone, setBulkTargetZone] = React.useState<string>('');
  const [bulkRequiredGuards, setBulkRequiredGuards] = React.useState<string>('');
  const [bulkLoading, setBulkLoading] = React.useState(false);
  const [bulkMessage, setBulkMessage] = React.useState<string | null>(null);

  const meta = React.useMemo(() => {
    const raw: any = clients;
    if (raw?.meta) return raw.meta;
    if (raw && typeof raw === 'object' && (raw.current_page || raw.last_page)) {
      return {
        current_page: Number(raw.current_page || 1),
        last_page: Number(raw.last_page || 1),
        per_page: Number(raw.per_page || perPage || 20),
        total: Number(raw.total || (Array.isArray(raw.data) ? raw.data.length : 0)),
        from: Number(raw.from || 0),
        to: Number(raw.to || 0),
      };
    }
    return { current_page: 1, last_page: 1, per_page: perPage || 20, total: Array.isArray(clients?.data) ? clients.data.length : 0, from: 0, to: 0 };
  }, [clients, perPage]);

  const handleSearch = () => {
    router.get(route('superadmin.clients.manage'), { search, per_page: perPage }, { preserveState: true });
  };

  const fetchClient = async (id: number, mode: 'view' | 'edit') => {
    setLoadingId(id);
    try {
      const res = await axios.get(route('admin.clients.json', { client: id }), { headers: { Accept: 'application/json' } });
      if (mode === 'view') setViewingClient(res.data);
      else setEditingClient(res.data);
    } catch (_) {
      if (mode === 'edit') router.visit(route('admin.clients.edit', { client: id }));
    } finally {
      setLoadingId(null);
    }
  };

  const list = Array.isArray(clients?.data) ? clients.data : [];

  const loadBulkSites = React.useCallback(async () => {
    setBulkLoading(true);
    try {
      const res = await axios.get(route('admin.clients.sites.json'), {
        params: {
          search: bulkSearch || undefined,
          zone_id: bulkZoneFilter || undefined,
        },
        headers: { Accept: 'application/json' },
      });
      setBulkSites(Array.isArray(res.data) ? res.data : []);
    } catch (_) {
      setBulkSites([]);
    } finally {
      setBulkLoading(false);
    }
  }, [bulkSearch, bulkZoneFilter]);

  React.useEffect(() => {
    if (showBulkSites) {
      loadBulkSites();
      setSelectedSiteIds([]);
    }
  }, [showBulkSites, loadBulkSites]);

  const toggleSiteSelection = (id: number) => {
    setSelectedSiteIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const runBulkAction = async () => {
    if (!selectedSiteIds.length) {
      alert('Select at least one site.');
      return;
    }
    if (bulkAction === 'move_zone' && !bulkTargetZone) {
      alert('Select a target zone.');
      return;
    }
    if (bulkAction === 'set_required_guards' && !bulkRequiredGuards) {
      alert('Enter required guards value.');
      return;
    }
    setBulkLoading(true);
    try {
      const res = await axios.post(
        route('admin.clients.sites.bulk-update'),
        {
          site_ids: selectedSiteIds,
          action: bulkAction,
          zone_id: bulkAction === 'move_zone' ? Number(bulkTargetZone) : undefined,
          required_guards: bulkAction === 'set_required_guards' ? Number(bulkRequiredGuards) : undefined,
        },
        { headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' } },
      );
      setShowBulkSites(false);
      const updated = (res && res.data && typeof res.data.updated === 'number') ? res.data.updated : selectedSiteIds.length;
      setBulkMessage(`Bulk operation completed on ${updated} site${updated === 1 ? '' : 's'}.`);
      setTimeout(() => setBulkMessage(null), 5000);
    } catch (e) {
      alert('Bulk operation failed.');
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <SuperAdminLayout title="Clients">
      <Head title="Super Admin • Manage Clients" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {bulkMessage && (
          <div className="rounded-md border border-green-500/40 bg-green-900/40 px-4 py-2 text-sm text-green-100">
            {bulkMessage}
          </div>
        )}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Manage Clients</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">Sites and services are managed via modals</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setShowAddClient(true)} className="flex items-center gap-2">
              <IconMapper name="Plus" />
              Add Client
            </Button>
            <Button variant="outline" onClick={() => setShowBulkImport(true)} className="flex items-center gap-2">
              <IconMapper name="FileUp" />
              Bulk Import
            </Button>
            <Button variant="outline" onClick={() => setShowBulkSites(true)} className="flex items-center gap-2">
              <IconMapper name="Settings" />
              Bulk Site Ops
            </Button>
            <Button variant="outline" asChild>
              <Link href={route('admin.clients.index')}>Open Admin View</Link>
            </Button>
          </div>
        </div>

        <Card className="p-4 dark:bg-gray-800 dark:border-gray-700">
          <div className="flex gap-3 flex-wrap items-center">
            <div className="flex-1 min-w-[220px]">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search clients"
                className="w-full px-3 py-2 rounded-md border dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
              />
            </div>
            <select
              className="px-3 py-2 rounded-md border dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
              value={String(perPage)}
              onChange={(e) => {
                const v = Number(e.target.value);
                setPerPage(v);
                router.get(route('superadmin.clients.manage'), { search, per_page: v, page: 1 }, { preserveState: true });
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <Button variant="secondary" onClick={handleSearch}>
              <IconMapper name="Search" className="mr-2" />
              Search
            </Button>
          </div>
        </Card>

        <Card className="overflow-hidden dark:bg-gray-800 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium">Contact</th>
                  <th className="px-6 py-3 text-center text-xs font-medium">Sites</th>
                  <th className="px-6 py-3 text-center text-xs font-medium">Services</th>
                  <th className="px-6 py-3 text-right text-xs font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {list.map((c: Client) => (
                  <tr key={c.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/40">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-gray-100">{c.name}</div>
                      <div className="text-xs text-gray-500">{c.billing_start_date || ''}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-gray-100">{c.contact_person || 'N/A'}</div>
                      <div className="text-xs text-gray-500">{c.phone || ''}</div>
                      <div className="text-xs text-gray-500">{c.email || ''}</div>
                    </td>
                    <td className="px-6 py-4 text-center">{c.sites_count || 0}</td>
                    <td className="px-6 py-4 text-center">{c.services_count || 0}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => fetchClient(c.id, 'view')} disabled={loadingId === c.id}>
                          <IconMapper name="Eye" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => fetchClient(c.id, 'edit')} disabled={loadingId === c.id}>
                          <IconMapper name="Pencil" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => router.delete(route('admin.clients.destroy', { client: c.id }))}>
                          <IconMapper name="Trash" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
          <div>
            Showing {meta.from || 0} - {meta.to || list.length} of {meta.total || list.length}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={meta.current_page <= 1}
              onClick={() => router.get(route('superadmin.clients.manage'), { search, per_page: perPage, page: (meta.current_page - 1) }, { preserveState: true })}
            >
              Prev
            </Button>
            <Button
              variant="outline"
              disabled={meta.current_page >= meta.last_page}
              onClick={() => router.get(route('superadmin.clients.manage'), { search, per_page: perPage, page: (meta.current_page + 1) }, { preserveState: true })}
            >
              Next
            </Button>
          </div>
        </div>

        {showAddClient && (
          <AddClientModal open={showAddClient} onClose={() => setShowAddClient(false)} services={services} zones={zones} />
        )}
        {editingClient && (
          <EditClientModal client={editingClient} open={true} services={services} onClose={() => setEditingClient(null)} />
        )}
        <BulkImportClientsModal open={showBulkImport} onClose={() => setShowBulkImport(false)} />
        {viewingClient && (
          <ClientDetailsModal client={viewingClient} open={true} services={services} zones={zones} onClientUpdated={(c: any) => setViewingClient(c)} onClose={() => setViewingClient(null)} />
        )}
        <Dialog open={showBulkSites} onOpenChange={setShowBulkSites}>
          <DialogContent className="w-full max-w-2xl dark:bg-gray-900 dark:text-gray-100">
            <DialogHeader>
              <DialogTitle>Bulk Site Operations</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  value={bulkSearch}
                  onChange={(e) => setBulkSearch(e.target.value)}
                  placeholder="Search sites or clients"
                  className="px-3 py-2 rounded-md border dark:bg-gray-950 dark:border-gray-700 dark:text-gray-100"
                />
                <select
                  className="px-3 py-2 rounded-md border dark:bg-gray-950 dark:border-gray-700 dark:text-gray-100"
                  value={bulkZoneFilter}
                  onChange={(e) => setBulkZoneFilter(e.target.value)}
                >
                  <option value="">All zones</option>
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>{z.name}</option>
                  ))}
                </select>
                <Button onClick={loadBulkSites} disabled={bulkLoading} className="flex items-center justify-center gap-2 w-full">
                  <IconMapper name="RefreshCw" />
                  Refresh
                </Button>
              </div>
              <div className="border rounded-lg max-h-64 overflow-y-auto dark:border-gray-700">
                {bulkLoading ? (
                  <div className="p-4 text-sm text-gray-400">Loading sites a0 a0 a0</div>
                ) : bulkSites.length === 0 ? (
                  <div className="p-4 text-sm text-gray-400">No sites found.</div>
                ) : (
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-900/60">
                      <tr>
                        <th className="px-3 py-2 text-left">Select</th>
                        <th className="px-3 py-2 text-left">Site</th>
                        <th className="px-3 py-2 text-left">Client</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {bulkSites.map((s) => (
                        <tr key={s.id} className="hover:bg-gray-900/40">
                          <td className="px-3 py-2">
                            <input
                              type="checkbox"
                              checked={selectedSiteIds.includes(s.id)}
                              onChange={() => toggleSiteSelection(s.id)}
                              className="h-4 w-4 rounded border-gray-600 bg-gray-900"
                            />
                          </td>
                          <td className="px-3 py-2 text-gray-100">{s.name}</td>
                          <td className="px-3 py-2 text-gray-400">{s.client_name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                  <select
                    className="px-3 py-2 rounded-md border dark:bg-gray-950 dark:border-gray-700 dark:text-gray-100"
                    value={bulkAction}
                    onChange={(e) => setBulkAction(e.target.value as any)}
                  >
                    <option value="activate">Activate</option>
                    <option value="deactivate">Deactivate</option>
                    <option value="move_zone">Move to zone</option>
                    <option value="set_required_guards">Set required guards</option>
                  </select>
                  {bulkAction === 'move_zone' && (
                    <select
                      className="px-3 py-2 rounded-md border dark:bg-gray-950 dark:border-gray-700 dark:text-gray-100"
                      value={bulkTargetZone}
                      onChange={(e) => setBulkTargetZone(e.target.value)}
                    >
                      <option value="">Select zone</option>
                      {zones.map((z) => (
                        <option key={z.id} value={z.id}>{z.name}</option>
                      ))}
                    </select>
                  )}
                  {bulkAction === 'set_required_guards' && (
                    <input
                      type="number"
                      min={1}
                      value={bulkRequiredGuards}
                      onChange={(e) => setBulkRequiredGuards(e.target.value)}
                      placeholder="Required guards"
                      className="px-3 py-2 rounded-md border dark:bg-gray-950 dark:border-gray-700 dark:text-gray-100"
                    />
                  )}
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <div>{selectedSiteIds.length} site(s) selected</div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowBulkSites(false)} className="dark:border-gray-700">Cancel</Button>
                    <Button onClick={runBulkAction} disabled={bulkLoading} className="bg-red-600 hover:bg-red-700">
                      Run
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </SuperAdminLayout>
  );
}
