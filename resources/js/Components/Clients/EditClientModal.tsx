import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Button } from '@/Components/ui/button';
import { useForm, router } from '@inertiajs/react';
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
  monthly_rate?: number;
}

interface EditClientModalProps {
  client: Client;
  open: boolean;
  onClose: () => void;
  services?: Array<{ id: number; name: string; monthly_price: number; required_guards?: number }>;
}

const clientFieldClassName =
  'mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-coin-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950 sm:text-sm';

const clientInlineFieldClassName =
  'rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 px-3 py-1 focus:outline-none focus:ring-2 focus:ring-coin-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950';

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
    monthly_rate: (client as any).monthly_rate ?? 0,
    // services array: { id, custom_price, quantity }
    services: (client as any).services ? (client as any).services.map((s: any) => ({ id: s.id, custom_price: s.pivot?.custom_price ?? null, quantity: s.pivot?.quantity ?? 1 })) : [] as Array<{ id: number; custom_price: number | null; quantity: number }>,
  });
  const { data, setData, put, processing, errors } = _form as any;

  React.useEffect(() => {
    const selectedServices = Array.isArray(data.services) ? data.services : [];
    let totalMonthlyRate = 0;

    selectedServices.forEach((selectedService: { id: number; custom_price: number | null; quantity: number }) => {
      const service = services.find((s) => s.id === selectedService.id);
      if (service) {
        const serviceRate = selectedService.custom_price ?? service.monthly_price;
        const quantity = selectedService.quantity || 1;
        totalMonthlyRate += serviceRate * quantity;
      }
    });

    setData('monthly_rate', totalMonthlyRate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.services]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    put(route('admin.clients.update', client.id), {
      onSuccess: () => {
        onClose();
        router.reload({ only: ['clients'] });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={() => !processing && onClose()}>
      <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 p-6">
        <DialogHeader>
          <DialogTitle>Edit Client</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Client Name
                  </label>
                  <input
                    type="text"
                    value={data.name}
                    onChange={e => setData('name', e.target.value)}
                    className={clientFieldClassName}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={data.contact_person}
                    onChange={e => setData('contact_person', e.target.value)}
                    className={clientFieldClassName}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={data.phone}
                    onChange={e => setData('phone', e.target.value)}
                    className={clientFieldClassName}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Email
                  </label>
                  <input
                    type="email"
                    value={data.email}
                    onChange={e => setData('email', e.target.value)}
                    className={clientFieldClassName}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Billing Start Date
                  </label>
                  <input
                    type="date"
                    value={data.billing_start_date}
                    onChange={e => setData('billing_start_date', e.target.value)}
                    className={clientFieldClassName}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Status
                  </label>
                  <select
                    value={data.status}
                    onChange={e => setData('status', e.target.value)}
                    className={clientFieldClassName}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Address
                  </label>
                  <textarea
                    value={data.address}
                    onChange={e => setData('address', e.target.value)}
                    rows={2}
                    className={clientFieldClassName}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Notes
                  </label>
                  <textarea
                    value={data.notes}
                    onChange={e => setData('notes', e.target.value)}
                    rows={3}
                    className={clientFieldClassName}
                  />
                </div>
              </div>

              {/* Services selection - allow toggling services and setting custom price/quantity */}
              <div className="pt-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Services</h3>
                <div className="grid grid-cols-1 gap-2">
                  {services.map((s) => {
                    const selected = (data.services || []).some((ds: any) => ds.id === s.id);
                    return (
                      <div key={s.id} className="p-3 border border-gray-200 dark:border-gray-800 rounded-lg flex items-center gap-4 bg-white dark:bg-gray-950 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
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
                          className="h-4 w-4 text-coin-600 focus:ring-coin-500 border-gray-300 dark:border-gray-700 rounded"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-gray-100">{s.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">Base Rate: {new Intl.NumberFormat('en-MW', { style: 'currency', currency: 'MWK' }).format(s.monthly_price)}</div>
                        </div>
                        {selected && (
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-500 dark:text-gray-400">Custom Rate:</span>
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
                                className={`w-32 ${clientInlineFieldClassName}`}
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-500 dark:text-gray-400">Quantity:</span>
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
                                className={`w-20 ${clientInlineFieldClassName}`}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

          <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => !processing && onClose()} disabled={processing} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" disabled={processing} className="w-full sm:w-auto">
              <IconMapper name="Save" className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}