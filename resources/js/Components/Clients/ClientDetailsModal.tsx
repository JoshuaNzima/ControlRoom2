import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Button } from '@/Components/ui/button';
import { Card } from '@/Components/ui/card';
import { useForm } from '@inertiajs/react';
import axios from 'axios';
import IconMapper from '@/Components/IconMapper';
import { formatCurrencyMWK } from '@/Components/format';

interface Site {
  id: number;
  name: string;
  address: string;
  status: string;
  guard_count?: number;
}

interface Service {
  id: number;
  name: string;
  monthly_price: number;
  custom_price?: number | null;
  quantity?: number;
}

interface Client {
  id: number;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  status?: string;
  sites?: Site[];
  services?: Service[];
  services_count?: number;
  total_due?: number;
  total_paid?: number;
  monthly_rate?: number;
  billing_start_date?: string;
  last_payment_date?: string;
}

interface ClientDetailsModalProps {
  client: Client;
  open: boolean;
  onClose: () => void;
  services?: Service[];
  onClientUpdated?: (client: any) => void;
}

export default function ClientDetailsModal({ client, open, onClose, services = [], onClientUpdated }: ClientDetailsModalProps) {
  // Note: parent can pass services list and onClientUpdated handler
  const [activeTab, setActiveTab] = React.useState<'overview' | 'sites' | 'services'>('overview');
  const { data, setData, post, processing } = useForm({
    name: '',
    address: '',
    contact_person: '',
    phone: '',
    required_guards: 1,
    services_requested: '',
    special_instructions: '',
    status: 'active',
  });

  const handleAddSite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = route('admin.clients.sites.store', { client: client.id });
      await axios.post(url, data, { headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' } });
      // reset form
      setData({
        name: '',
        address: '',
        contact_person: '',
        phone: '',
        required_guards: 1,
        services_requested: '',
        special_instructions: '',
        status: 'active'
      });
      // ask parent to refresh client details if callback provided
      try {
        if (onClientUpdated) {
          // fetch fresh client
          const showUrl = route('admin.clients.json', { client: client.id });
          const resp = await axios.get(showUrl, { headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' } });
          onClientUpdated(resp.data);
        }
      } catch (err) {
        // ignore refresh errors
        console.warn('Failed to refresh client after site add', err);
      }
    } catch (err) {
      console.error('Failed to add site', err);
      alert('Failed to add site. Please try again.');
    }
  };

  // Using formatCurrencyMWK from Components/format.ts

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-4xl rounded-2xl bg-white p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <DialogHeader>
              <DialogTitle>{client.name}</DialogTitle>
            </DialogHeader>
            <p className="mt-1 text-sm text-gray-500">
              Client since: {client.billing_start_date ? formatDate(client.billing_start_date) : 'N/A'}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            client.status === 'active' ? 'bg-green-100 text-green-800' : 
            client.status === 'overdue' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {client.status || 'Active'}
          </span>
        </div>

        <div className="mb-6">
          <div className="flex space-x-4 border-b border-gray-200">
                <button
                  className={`px-4 py-2 text-sm font-medium ${
                    activeTab === 'overview' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('overview')}
                >
                  Overview
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium ${
                    activeTab === 'sites' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('sites')}
                >
                  Sites
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium ${
                    activeTab === 'services' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('services')}
                >
                  Services
                </button>
              </div>
            </div>

            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="p-4">
                    <h3 className="text-sm font-medium text-gray-500">Total Sites</h3>
                    <p className="mt-1 text-2xl font-semibold text-gray-900">{client.sites?.length || 0}</p>
                  </Card>
                    <Card className="p-4">
                      <h3 className="text-sm font-medium text-gray-500">Active Services</h3>
                      <p className="mt-1 text-2xl font-semibold text-gray-900">{client.services_count || client.services?.length || 0}</p>
                    </Card>
                  <Card className="p-4">
                    <h3 className="text-sm font-medium text-gray-500">Monthly Value</h3>
                    <p className="mt-1 text-2xl font-semibold text-gray-900">
                      {formatCurrencyMWK(client.monthly_rate || client.services?.reduce((sum, service) => 
                        sum + ((service.custom_price ?? service.monthly_price) * (service.quantity || 1)), 0) || 0)}
                    </p>
                  </Card>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Contact Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Contact Person</p>
                      <p className="text-sm font-medium text-gray-900">{client.contact_person || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="text-sm font-medium text-gray-900">{client.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="text-sm font-medium text-gray-900">{client.email || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Last Payment</p>
                      <p className="text-sm font-medium text-gray-900">
                        {client.last_payment_date ? formatDate(client.last_payment_date) : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'sites' && (
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-4">Add New Site</h3>
                  <form onSubmit={handleAddSite} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Site Name</label>
                      <input
                        type="text"
                        value={data.name}
                        onChange={e => setData('name', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="Enter site name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Address</label>
                      <input
                        type="text"
                        value={data.address}
                        onChange={e => setData('address', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="Enter site address"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Contact Person</label>
                      <input
                        type="text"
                        value={data.contact_person}
                        onChange={e => setData('contact_person', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="Enter contact person name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <input
                        type="text"
                        value={data.phone}
                        onChange={e => setData('phone', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="Enter contact phone"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Required Guards</label>
                      <input
                        type="number"
                        value={data.required_guards}
                        onChange={e => setData('required_guards', parseInt(e.target.value))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        min="1"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Site Status</label>
                      <select
                        value={data.status}
                        onChange={e => setData('status', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        required
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Services Requested</label>
                      <textarea
                        value={data.services_requested}
                        onChange={e => setData('services_requested', e.target.value)}
                        rows={2}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="Enter requested services"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Special Instructions</label>
                      <textarea
                        value={data.special_instructions}
                        onChange={e => setData('special_instructions', e.target.value)}
                        rows={2}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="Enter any special instructions or notes"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Button type="submit" disabled={processing}>
                        <IconMapper name="Plus" className="w-4 h-4 mr-2" />
                        Add Site
                      </Button>
                    </div>
                  </form>
                </div>

                <div className="divide-y divide-gray-200">
                  {client.sites?.map(site => (
                    <div key={site.id} className="py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{site.name}</h4>
                          <p className="text-sm text-gray-500">{site.address}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            site.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {site.guard_count || 0} guards
                          </span>
                          <Button variant="outline" size="sm" asChild>
                            <a href={route('admin.clients.sites.show', { client: client.id, site: site.id })}>
                              <IconMapper name="ExternalLink" className="w-4 h-4" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'services' && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Manage Services</h3>
                  <p className="text-sm text-gray-500 mb-3">Toggle services for this client, set custom rates or quantity, then save.</p>
                  <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                    {services.map(svc => {
                      const attached = (client.services || []).find(cs => cs.id === svc.id);
                      const selected = !!attached;
                      const initialCustom = attached?.custom_price ?? null;
                      const initialQty = attached?.quantity ?? 1;
                      return (
                        <div key={svc.id} className="p-3 border rounded-lg flex items-center gap-4 bg-white">
                          <input type="checkbox" defaultChecked={selected} id={`svc_${svc.id}`} className="h-4 w-4" />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{svc.name}</div>
                            <div className="text-sm text-gray-500">Base: {formatCurrencyMWK(svc.monthly_price)}</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <input type="number" defaultValue={initialCustom ?? ''} placeholder="Custom" data-svcid={svc.id} className="w-32 px-2 py-1 border rounded" />
                            <input type="number" defaultValue={initialQty} min={1} data-svcqty={svc.id} className="w-20 px-2 py-1 border rounded" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button onClick={async () => {
                      try {
                        const nodes = Array.from(document.querySelectorAll('[id^="svc_"]')) as HTMLInputElement[];
                        const servicesPayload: any[] = [];
                        nodes.forEach((checkbox) => {
                          const id = checkbox.id.replace('svc_', '');
                          const checked = checkbox.checked;
                          if (checked) {
                            const customInput = document.querySelector(`[data-svcid="${id}"]`) as HTMLInputElement | null;
                            const qtyInput = document.querySelector(`[data-svcqty="${id}"]`) as HTMLInputElement | null;
                            servicesPayload.push({ id: Number(id), custom_price: customInput && customInput.value !== '' ? Number(customInput.value) : null, quantity: qtyInput ? Number(qtyInput.value) : 1 });
                          }
                        });
                        const url = route('admin.clients.services.update', { client: client.id });
                        await axios.post(url, { services: servicesPayload }, { headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' } });
                        // refresh
                        if (onClientUpdated) {
                          const showUrl = route('admin.clients.json', { client: client.id });
                          const resp = await axios.get(showUrl, { headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' } });
                          onClientUpdated(resp.data);
                        }
                      } catch (err) {
                        console.error('Failed to update services', err);
                        alert('Failed to update services.');
                      }
                    }}>Save Services</Button>
                  </div>
                </div>
                <div className="space-y-2">
                  {client.services?.map(service => (
                    <Card key={service.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">{service.name}</h4>
                          <p className="text-sm text-gray-500">Base price: {formatCurrencyMWK(service.monthly_price)}</p>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-sm">
                            <p className="text-gray-500">Quantity</p>
                            <p className="font-medium text-gray-900">{service.quantity || 1}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Rate</p>
                            <p className="text-sm font-medium text-gray-900">{formatCurrencyMWK(service.custom_price ?? service.monthly_price)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Total</p>
                            <p className="text-sm font-medium text-gray-900">{formatCurrencyMWK((service.custom_price ?? service.monthly_price) * (service.quantity || 1))}</p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

        </DialogContent>
    </Dialog>
  );
}