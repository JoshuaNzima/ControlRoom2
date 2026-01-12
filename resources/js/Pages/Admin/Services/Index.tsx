import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
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



  return (
    <AdminLayout title="Services">
      <Head title="Services" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 bg-coin-100 dark:bg-coin-900/30 rounded-full">
                  <IconMapper name="Package" className="w-6 h-6 text-coin-600 dark:text-coin-300" />
                </div>
                <div className="ml-4">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">Total Services</h3>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.total_services}</p>
                </div>
              </div>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <IconMapper name="Check" className="w-6 h-6 text-green-600 dark:text-green-300" />
                </div>
                <div className="ml-4">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">Active Services</h3>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.active_services}</p>
                </div>
              </div>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                  <IconMapper name="DollarSign" className="w-6 h-6 text-yellow-600 dark:text-yellow-300" />
                </div>
                <div className="ml-4">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">Monthly Revenue</h3>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{formatCurrencyMWK(stats.total_monthly_revenue)}</p>
                </div>
              </div>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 bg-coin-100 dark:bg-coin-900/30 rounded-full">
                  <IconMapper name="Star" className="w-6 h-6 text-coin-600 dark:text-coin-300" />
                </div>
                <div className="ml-4">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">Most Used Service</h3>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{stats.most_used_service}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="bg-white dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-800 shadow">
          <div className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Services</h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Create and manage client services.</p>
            </div>
            <Button type="button" onClick={openCreate} className="w-full sm:w-auto">
              Add Service
            </Button>
          </div>
        </div>

        <div className="mt-8 bg-white dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-800 shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Existing Services</h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {services.map(service => (
              <div key={service.id} className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{service.name}</h3>
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        service.active ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
                      }`}>
                        {service.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{service.description || '—'}</p>
                    <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <IconMapper name="DollarSign" className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400 dark:text-gray-500" />
                      {formatCurrencyMWK(service.monthly_price)}
                      {service.client_count !== undefined && (
                        <>
                          <IconMapper name="Users" className="ml-4 mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400 dark:text-gray-500" />
                          {service.client_count} clients
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex w-full sm:w-auto justify-end gap-2">
                    <Button onClick={() => startEdit(service)} variant="outline" className="w-full sm:w-auto">Edit</Button>
                    <Button onClick={() => remove(service.id)} variant="destructive" className="w-full sm:w-auto">Delete</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
                    className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm focus:border-coin-500 focus:ring-1 focus:ring-coin-500 sm:text-sm"
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
                      className="block w-full pl-10 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm focus:border-coin-500 focus:ring-1 focus:ring-coin-500 sm:text-sm"
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
                    className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm focus:border-coin-500 focus:ring-1 focus:ring-coin-500 sm:text-sm"
                    placeholder="Enter service description"
                  />
                  {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                </div>

                <div className="sm:col-span-2">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 dark:border-gray-700 text-coin-600 shadow-sm focus:border-coin-500 focus:ring-1 focus:ring-coin-500 dark:bg-gray-900"
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
                      className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm focus:border-coin-500 focus:ring-1 focus:ring-coin-500 sm:text-sm"
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
                        className="block w-full pl-10 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm focus:border-coin-500 focus:ring-1 focus:ring-coin-500 sm:text-sm"
                        value={editData.monthly_price ?? 0}
                        onChange={(e) => setEditData({ ...editData, monthly_price: Number(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                    <textarea
                      className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm focus:border-coin-500 focus:ring-1 focus:ring-coin-500 sm:text-sm"
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
                        className="rounded border-gray-300 dark:border-gray-700 text-coin-600 shadow-sm focus:border-coin-500 focus:ring-1 focus:ring-coin-500 dark:bg-gray-900"
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
