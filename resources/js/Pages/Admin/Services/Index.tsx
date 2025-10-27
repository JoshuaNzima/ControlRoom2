import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import IconMapper from '@/Components/IconMapper';
import { formatCurrencyMWK } from '@/Components/format';

interface Service {
  id: number;
  name: string;
  monthly_price: number;
  description?: string;
  active: boolean;
  client_count?: number;
  total_revenue?: number;
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
  const { data, setData, post, processing, errors } = useForm({ name: '', monthly_price: 0, description: '', active: true } as any);
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [editData, setEditData] = React.useState<any>({});

  const startEdit = (s: any) => {
    setEditingId(s.id);
    setEditData({ name: s.name, monthly_price: s.monthly_price, active: s.active });
  };

  const saveEdit = (id: number) => {
    // send put request via router
    router.put(route('admin.services.update', id), editData);
    setEditingId(null);
  };

  const remove = (id: number) => {
    if (!confirm('Delete this service?')) return;
    router.delete(route('admin.services.destroy', id));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('admin.services.store'));
  };



  return (
    <AdminLayout title="Services">
      <Head title="Services" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 bg-blue-100 rounded-full">
                  <IconMapper name="Package" className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="font-medium text-gray-900">Total Services</h3>
                  <p className="text-3xl font-bold text-gray-900">{stats.total_services}</p>
                </div>
              </div>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 bg-green-100 rounded-full">
                  <IconMapper name="Check" className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <h3 className="font-medium text-gray-900">Active Services</h3>
                  <p className="text-3xl font-bold text-gray-900">{stats.active_services}</p>
                </div>
              </div>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 bg-yellow-100 rounded-full">
                  <IconMapper name="DollarSign" className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <h3 className="font-medium text-gray-900">Monthly Revenue</h3>
                  <p className="text-3xl font-bold text-gray-900">{formatCurrencyMWK(stats.total_monthly_revenue)}</p>
                </div>
              </div>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 bg-purple-100 rounded-full">
                  <IconMapper name="Star" className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <h3 className="font-medium text-gray-900">Most Used Service</h3>
                  <p className="text-lg font-semibold text-gray-900">{stats.most_used_service}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-6">Add New Service</h2>
            <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input 
                  type="text" 
                  value={data.name} 
                  onChange={(e) => (setData as any)('name', e.target.value)} 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Enter service name"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Monthly Price</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-gray-500 sm:text-sm">MWK</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={data.monthly_price}
                    onChange={(e) => (setData as any)('monthly_price', Number(e.target.value) || 0)}
                    className="block w-full pl-7 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="0.00"
                  />
                </div>
                {errors.monthly_price && <p className="mt-1 text-sm text-red-600">{errors.monthly_price}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={data.description}
                  onChange={(e) => (setData as any)('description', e.target.value)}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Enter service description"
                />
                {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    checked={data.active}
                    onChange={(e) => (setData as any)('active', e.target.checked)}
                  />
                  <span className="ml-2 text-sm text-gray-600">Active</span>
                </label>
              </div>

              <div className="md:col-span-2">
                <Button
                  type="submit"
                  disabled={processing}
                  className="w-full md:w-auto"
                >
                  Create Service
                </Button>
              </div>
            </form>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Existing Services</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {services.map(service => (
              <div key={service.id} className="p-6">
                {editingId === service.id ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        value={editData.name || ''}
                        onChange={e => setEditData({ ...editData, name: e.target.value })}
                        placeholder="Service name"
                      />
                      <div className="relative rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <span className="text-gray-500 sm:text-sm">MWK</span>
                        </div>
                        <input
                          type="number"
                          className="block w-full pl-7 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          value={editData.monthly_price ?? 0}
                          onChange={e => setEditData({ ...editData, monthly_price: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                    <div>
                      <textarea
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        value={editData.description || ''}
                        onChange={e => setEditData({ ...editData, description: e.target.value })}
                        rows={3}
                        placeholder="Service description"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          checked={!!editData.active}
                          onChange={e => setEditData({ ...editData, active: e.target.checked })}
                        />
                        <span className="ml-2 text-sm text-gray-600">Active</span>
                      </label>
                      <div className="flex gap-2">
                        <Button onClick={() => saveEdit(service.id)} className="bg-green-600 hover:bg-green-700">Save</Button>
                        <Button onClick={() => setEditingId(null)} variant="outline">Cancel</Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h3 className="text-lg font-medium text-gray-900">{service.name}</h3>
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          service.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {service.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">{service.description}</p>
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <IconMapper name="DollarSign" className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" />
                        {formatCurrencyMWK(service.monthly_price)}
                        {service.client_count !== undefined && (
                          <>
                            <IconMapper name="Users" className="ml-4 mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" />
                            {service.client_count} clients
                          </>
                        )}
                      </div>
                    </div>
                    <div className="ml-4 flex items-center space-x-2">
                      <Button onClick={() => startEdit(service)} variant="outline">Edit</Button>
                      <Button onClick={() => remove(service.id)} variant="destructive">Delete</Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
