import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Button } from '@/Components/ui/button';
import { useForm } from '@inertiajs/react';
import IconMapper from '@/Components/IconMapper';

interface Client {
  id: number;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  billing_start_date?: string;
  notes?: string;
  status?: string;
}

interface EditClientModalProps {
  client: Client;
  open: boolean;
  onClose: () => void;
  services?: Array<{ id: number; name: string; monthly_price: number; required_guards?: number }>;
}

export default function EditClientModal({ client, open, onClose, services = [] }: EditClientModalProps) {
  const _form: any = useForm({
    name: client.name,
    contact_person: client.contact_person || '',
    phone: client.phone || '',
    email: client.email || '',
    address: client.address || '',
    billing_start_date: client.billing_start_date || '',
    notes: client.notes || '',
    status: client.status || 'active',
    // services array: { id, custom_price, quantity }
    services: (client as any).services ? (client as any).services.map((s: any) => ({ id: s.id, custom_price: s.pivot?.custom_price ?? null, quantity: s.pivot?.quantity ?? 1 })) : [] as Array<{ id: number; custom_price: number | null; quantity: number }>,
  });
  const { data, setData, put, processing, errors } = _form as any;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    put(route('admin.clients.update', client.id), {
      onSuccess: () => onClose(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-2xl rounded-2xl bg-white p-6">
        <DialogHeader>
          <DialogTitle>Edit Client</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Client Name
                  </label>
                  <input
                    type="text"
                    value={data.name}
                    onChange={e => setData('name', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={data.contact_person}
                    onChange={e => setData('contact_person', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={data.phone}
                    onChange={e => setData('phone', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    value={data.email}
                    onChange={e => setData('email', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Billing Start Date
                  </label>
                  <input
                    type="date"
                    value={data.billing_start_date}
                    onChange={e => setData('billing_start_date', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    value={data.status}
                    onChange={e => setData('status', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <textarea
                    value={data.address}
                    onChange={e => setData('address', e.target.value)}
                    rows={2}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Notes
                  </label>
                  <textarea
                    value={data.notes}
                    onChange={e => setData('notes', e.target.value)}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              {/* Services selection - allow toggling services and setting custom price/quantity */}
              <div className="pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Services</h3>
                <div className="grid grid-cols-1 gap-2">
                  {services.map((s) => {
                    const selected = (data.services || []).some((ds: any) => ds.id === s.id);
                    return (
                      <div key={s.id} className="p-3 border rounded-lg flex items-center gap-4 bg-white hover:bg-gray-50 transition-colors">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={(e: any) => {
                            let list = Array.isArray(data.services) ? [...data.services] : [];
                            if (e.target.checked) {
                              list.push({ id: s.id, custom_price: null, quantity: 1 });
                            } else {
                              list = list.filter((it: any) => it.id !== s.id);
                            }
                            setData('services', list);
                          }}
                          className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{s.name}</div>
                          <div className="text-sm text-gray-500">Base Rate: {new Intl.NumberFormat('en-MW', { style: 'currency', currency: 'MWK' }).format(s.monthly_price)}</div>
                        </div>
                        {selected && (
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-500">Custom Rate:</span>
                              <input
                                type="number"
                                step="0.01"
                                placeholder="Optional"
                                value={(data.services.find((it: any) => it.id === s.id)?.custom_price ?? '') as any}
                                onChange={(e: any) => {
                                  const list = (data.services || []).map((it: any) =>
                                    it.id === s.id ? ({ ...it, custom_price: e.target.value === '' ? null : Number(e.target.value) }) : it
                                  );
                                  setData('services', list);
                                }}
                                className="w-32 px-3 py-1 border rounded-md focus:ring-1 focus:ring-red-500"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-500">Quantity:</span>
                              <input
                                type="number"
                                min="1"
                                value={data.services.find((it: any) => it.id === s.id)?.quantity || 1}
                                onChange={(e: any) => {
                                  const quantity = Math.max(1, parseInt(e.target.value) || 1);
                                  const list = (data.services || []).map((it: any) =>
                                    it.id === s.id ? ({ ...it, quantity }) : it
                                  );
                                  setData('services', list);
                                }}
                                className="w-20 px-3 py-1 border rounded-md focus:ring-1 focus:ring-red-500"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={processing}>
              <IconMapper name="Save" className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}