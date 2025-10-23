import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/Components/ui/button';
import { useForm } from '@inertiajs/react';

interface Service {
  id: number;
  name: string;
  monthly_price: number;
  pivot?: { custom_price?: number };
}

interface Site {
  id: number;
  name: string;
  address?: string;
}

interface ClientProps {
  client: {
    id: number;
    name: string;
    contact_person?: string;
    phone?: string;
    email?: string;
    address?: string;
    sites?: Site[];
    services?: Service[];
  };
}

export default function Show({ client }: ClientProps) {
  const initialServices = (client.services || []).map((s) => ({
    id: s.id,
    custom_price: s.pivot?.custom_price ?? null,
  }));

  const form = useForm({ services: initialServices });

  function toggleService(id: number) {
    const exists = form.data.services.find((s: any) => s.id === id);
    if (exists) {
      form.setData('services', form.data.services.filter((s: any) => s.id !== id));
    } else {
      form.setData('services', [...form.data.services, { id, custom_price: null }]);
    }
  }

  function setCustomPrice(id: number, val: string) {
    form.setData('services', form.data.services.map((s: any) => (s.id === id ? { ...s, custom_price: val === '' ? null : parseFloat(val) } : s)));
  }

  function submitServices(e: React.FormEvent) {
    e.preventDefault();
    form.post(route('admin.clients.services.update', { client: client.id }));
  }
  return (
    <AdminLayout title="Client Details">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">{client.name}</h1>

        <div className="mb-6">
          <h2 className="font-semibold">Contact</h2>
          <p>{client.contact_person}</p>
          <p>{client.phone}</p>
          <p>{client.email}</p>
          <p>{client.address}</p>
        </div>

        <div>
          <h2 className="font-semibold mb-2">Sites</h2>
          <div className="mb-3">
            <Button asChild size="sm">
              <a href={route('admin.clients.sites.create', { client: client.id })}>Add Site</a>
            </Button>
          </div>
          <ul className="space-y-2">
            {client.sites && client.sites.length ? (
              client.sites.map((site: Site) => (
                <li key={site.id} className="p-3 border rounded">
                  <div className="flex justify-between">
                    <div>

                    <div className="mt-8">
                      <h2 className="font-semibold mb-2">Services & Pricing</h2>
                      {(client.services && client.services.length) ? (
                        <form onSubmit={submitServices} className="space-y-3">
                          <ul className="space-y-2">
                            {client.services.map((svc: Service) => {
                              const selected = !!form.data.services.find((s: any) => s.id === svc.id);
                              const currentCustom = form.data.services.find((s: any) => s.id === svc.id)?.custom_price ?? '';
                              return (
                                <li key={svc.id} className="p-3 border rounded flex items-center justify-between">
                                  <div>
                                    <div className="font-semibold">{svc.name}</div>
                                    <div className="text-sm text-gray-600">Default: {svc.monthly_price}</div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <label className="flex items-center gap-2">
                                      <input type="checkbox" checked={selected} onChange={() => toggleService(svc.id)} />
                                      <span className="text-sm">Assigned</span>
                                    </label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      placeholder="Custom price"
                                      value={currentCustom}
                                      onChange={(e) => setCustomPrice(svc.id, e.target.value)}
                                      className="border rounded px-2 py-1 w-36"
                                    />
                                  </div>
                                </li>
                              );
                            })}
                          </ul>

                          <div className="pt-3">
                            <Button type="submit" disabled={form.processing}>Save Services</Button>
                          </div>
                        </form>
                      ) : (
                        <div>No services available for this client.</div>
                      )}
                    </div>
                      <div className="font-semibold">{site.name}</div>
                      <div className="text-sm text-gray-600">{site.address}</div>
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <div>No sites available.</div>
            )}
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
}
