import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Badge } from '@/Components/ui/badge';
import IconMapper from '@/Components/IconMapper';
import { formatCurrencyMWK } from '@/Components/format';
import Modal from '@/Components/Modal';

interface Service {
  id: number;
  name: string;
  monthly_price: number;
  description?: string;
  active: boolean;
  client_count?: number;
  total_revenue?: number;
}

interface ServiceForm {
  name: string;
  monthly_price: number;
  description: string;
  active: boolean;
}

export default function ServicesIndex({ services, stats }: { 
  services: Service[],
  stats: {
    total_services: number;
    active_services: number;
    total_monthly_revenue: number;
    most_used_service: string;
  }
}) {
  const {
    data,
    setData,
    post,
    processing,
    errors,
    reset,
  } = useForm<ServiceForm>({ name: '', monthly_price: 0, description: '', active: true });
  const [showCreate, setShowCreate] = React.useState(false);
  const [showEdit, setShowEdit] = React.useState(false);
  const [editingService, setEditingService] = React.useState<Service | null>(null);
  const [savingEdit, setSavingEdit] = React.useState(false);
  const [editData, setEditData] = React.useState<ServiceForm>({ name: '', monthly_price: 0, description: '', active: true });
  const [query, setQuery] = React.useState('');
  const [activeOnly, setActiveOnly] = React.useState(false);

  const openCreate = () => {
    reset();
    setData('active', true);
    setShowCreate(true);
  };

  const startEdit = (s: Service) => {
    setEditingService(s);
    setEditData({
      name: s.name,
      monthly_price: s.monthly_price,
      description: s.description ?? '',
      active: s.active,
    });
    setShowEdit(true);
  };

  const saveEdit = () => {
    if (!editingService || savingEdit) return;
    setSavingEdit(true);
    router.put(
      route('admin.services.update', editingService.id),
      {
        name: editData.name,
        monthly_price: Number(editData.monthly_price) || 0,
        description: editData.description || '',
        active: !!editData.active,
      },
      {
        preserveScroll: true,
        onFinish: () => setSavingEdit(false),
        onSuccess: () => {
          setShowEdit(false);
          setEditingService(null);
        },
      }
    );
  };

  const remove = (id: number) => {
    if (!confirm('Delete this service?')) return;
    router.delete(route('admin.services.destroy', id));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('admin.services.store'), {
      preserveScroll: true,
      onSuccess: () => {
        reset();
        setShowCreate(false);
      },
    });
  };

  const handleCreateClose = () => { if (!processing) setShowCreate(false); };
  const handleEditClose = () => { if (!savingEdit) setShowEdit(false); };

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return services
      .filter((s) => (activeOnly ? !!s.active : true))
      .filter((s) => {
        if (!q) return true;
        return (
          String(s.name || '').toLowerCase().includes(q) ||
          String(s.description || '').toLowerCase().includes(q)
        );
      })
      .slice()
      .sort((a, b) => {
        if (a.active !== b.active) return a.active ? -1 : 1;
        return String(a.name || '').localeCompare(String(b.name || ''));
      });
  }, [activeOnly, query, services]);

  const kpis = React.useMemo(() => {
    const totalRevenue = Number(stats.total_monthly_revenue || 0);
    return [
      {
        label: 'Total Services',
        value: stats.total_services,
        icon: 'Package',
        accent: 'bg-red-600',
      },
      {
        label: 'Active',
        value: stats.active_services,
        icon: 'CheckCircle',
        accent: 'bg-emerald-600',
      },
      {
        label: 'Monthly Revenue',
        value: formatCurrencyMWK(totalRevenue),
        icon: 'Wallet',
        accent: 'bg-amber-600',
      },
      {
        label: 'Most Used',
        value: stats.most_used_service,
        icon: 'Star',
        accent: 'bg-purple-600',
      },
    ] as const;
  }, [stats]);



  return (
    <AdminLayout title="Services">
      <Head title="Services" />
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          {kpis.map((kpi) => (
            <Card
              key={kpi.label}
              className="relative overflow-hidden border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950"
            >
              <div className={`absolute top-0 left-0 w-1 h-full ${kpi.accent}`} />
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{kpi.label}</p>
                    <p className="mt-1 text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
                      {kpi.value}
                    </p>
                  </div>
                  <div className={`p-2 rounded-lg ${kpi.accent} bg-opacity-15`}>
                    <IconMapper name={kpi.icon} size={18} className="text-gray-900 dark:text-gray-100" />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Services</h2>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Create and manage client services.</p>
                </div>
                <div className="flex gap-2">
                  <Button type="button" onClick={openCreate} className="w-full sm:w-auto">
                    <IconMapper name="Plus" size={16} className="mr-2" />
                    Add Service
                  </Button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <div className="flex-1">
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search services..."
                    className="h-10"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setActiveOnly((v) => !v)}
                  className={`h-10 px-3 rounded-md border text-sm font-medium transition-colors ${
                    activeOnly
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  {activeOnly ? 'Active Only' : 'All'}
                </button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setQuery('');
                    setActiveOnly(false);
                  }}
                  className="h-10"
                >
                  Reset
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <div className="mt-4 sm:mt-6">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Services List</h3>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {filtered.length} result{filtered.length === 1 ? '' : 's'}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filtered.map((service) => (
              <Card
                key={service.id}
                className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 hover:shadow-md transition-shadow"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {service.name}
                        </h4>
                        <Badge
                          className={
                            service.active
                              ? 'bg-emerald-500/15 text-emerald-700 border border-emerald-500/30 dark:text-emerald-300'
                              : 'bg-gray-500/15 text-gray-700 border border-gray-500/30 dark:text-gray-300'
                          }
                        >
                          {service.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>

                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {service.description || '—'}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                        <span className="inline-flex items-center gap-1 text-gray-700 dark:text-gray-300">
                          <IconMapper name="DollarSign" size={14} className="text-gray-500 dark:text-gray-400" />
                          {formatCurrencyMWK(service.monthly_price)}
                          <span className="text-gray-500 dark:text-gray-400">/mo</span>
                        </span>
                        {service.client_count !== undefined ? (
                          <span className="inline-flex items-center gap-1 text-gray-700 dark:text-gray-300">
                            <IconMapper name="Users" size={14} className="text-gray-500 dark:text-gray-400" />
                            {service.client_count}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => startEdit(service)}
                      className="flex-1"
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => remove(service.id)}
                      className="flex-1"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {filtered.length === 0 ? (
            <Card className="mt-4 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
              <div className="p-6 text-center">
                <div className="mx-auto h-10 w-10 rounded-full bg-red-600/15 flex items-center justify-center">
                  <IconMapper name="Search" size={18} className="text-red-700 dark:text-red-300" />
                </div>
                <div className="mt-3 text-sm font-semibold text-gray-900 dark:text-gray-100">No services found</div>
                <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">Try adjusting your filters, or add a new service.</div>
                <div className="mt-4">
                  <Button type="button" onClick={openCreate}>
                    <IconMapper name="Plus" size={16} className="mr-2" />
                    Add Service
                  </Button>
                </div>
              </div>
            </Card>
          ) : null}
        </div>

        <Modal show={showCreate} onClose={handleCreateClose} maxWidth="2xl">
          <div className="p-4 sm:p-6 bg-white dark:bg-gray-950">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Add Service</h2>
            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                  <input
                    type="text"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 sm:text-sm"
                    placeholder="Enter service name"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Monthly Price</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="text-gray-500 dark:text-gray-400 sm:text-sm">MWK</span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={data.monthly_price}
                      onChange={(e) => setData('monthly_price', Number(e.target.value) || 0)}
                      className="block w-full pl-10 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 sm:text-sm"
                      placeholder="0.00"
                    />
                  </div>
                  {errors.monthly_price && <p className="mt-1 text-sm text-red-600">{errors.monthly_price}</p>}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                  <textarea
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    rows={3}
                    className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 sm:text-sm"
                    placeholder="Enter service description"
                  />
                  {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                </div>

                <div className="sm:col-span-2">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 dark:border-gray-700 text-red-600 shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:bg-gray-900"
                      checked={data.active}
                      onChange={(e) => setData('active', e.target.checked)}
                    />
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">Active</span>
                  </label>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={handleCreateClose} disabled={processing} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button type="submit" disabled={processing} className="w-full sm:w-auto">
                  {processing ? 'Creating...' : 'Create Service'}
                </Button>
              </div>
            </form>
          </div>
        </Modal>

        <Modal show={showEdit} onClose={handleEditClose} maxWidth="2xl">
          <div className="p-4 sm:p-6 bg-white dark:bg-gray-950">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Edit Service</h2>
            {!editingService ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">Loading...</div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                    <input
                      className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 sm:text-sm"
                      value={editData.name || ''}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      placeholder="Service name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Monthly Price</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <span className="text-gray-500 dark:text-gray-400 sm:text-sm">MWK</span>
                      </div>
                      <input
                        type="number"
                        className="block w-full pl-10 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 sm:text-sm"
                        value={editData.monthly_price ?? 0}
                        onChange={(e) => setEditData({ ...editData, monthly_price: Number(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                    <textarea
                      className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 sm:text-sm"
                      value={editData.description || ''}
                      onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                      rows={3}
                      placeholder="Service description"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 dark:border-gray-700 text-red-600 shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:bg-gray-900"
                        checked={!!editData.active}
                        onChange={(e) => setEditData({ ...editData, active: e.target.checked })}
                      />
                      <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">Active</span>
                    </label>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={handleEditClose} disabled={savingEdit} className="w-full sm:w-auto">
                    Cancel
                  </Button>
                  <Button type="button" onClick={saveEdit} disabled={savingEdit} className="w-full sm:w-auto">
                    {savingEdit ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
}
