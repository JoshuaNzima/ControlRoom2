import React, { useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import IconMapper from '@/Components/IconMapper';

export default function CreateClient(props: { services?: Array<{ id: number; name: string; monthly_price: number; required_guards?: number }> }) {
  const { data, setData, post, processing, errors } = useForm({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    contract_start_date: '',
    contract_end_date: '',
    monthly_rate: 0,
    billing_start_date: new Date().toISOString().split('T')[0], // Default to today
    notes: '',
    status: 'active',
    site: {
      name: 'Home/Residence', // Default site name
      address: '',
      status: 'active',
      contact_person: '',
      phone: '',
      special_instructions: '',
      latitude: '',
      longitude: '',
    },
    services: [] as Array<{ id: number; custom_price: number | null; quantity: number }>,
  } as any);

  // Calculate total monthly rate and required guards based on selected services
  type FormData = {
    name: string;
    contact_person: string;
    phone: string;
    email: string;
    address: string;
    contract_start_date: string;
    contract_end_date: string;
    monthly_rate: number;
    billing_start_date: string;
    notes: string;
    status: string;
    site: {
      name: string;
      address: string;
      status: string;
      contact_person: string;
      phone: string;
      special_instructions: string;
      latitude: string;
      longitude: string;
    };
    services: Array<{ id: number; custom_price: number | null; quantity: number }>;
  };

  useEffect(() => {
    const selectedServices = data.services || [];
    let totalMonthlyRate = 0;

    selectedServices.forEach((selectedService: { id: number; custom_price: number | null; quantity: number }) => {
      const service = props.services?.find(s => s.id === selectedService.id);
      if (service) {
        const serviceRate = selectedService.custom_price ?? service.monthly_price;
        const quantity = selectedService.quantity || 1;
        totalMonthlyRate += serviceRate * quantity;
      }
    });

    setData((prev: FormData) => ({
      ...prev,
      monthly_rate: totalMonthlyRate
    }));
  }, [data.services]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('admin.clients.store'));
  };

  return (
    <AdminLayout title="Add Client">
      <Head title="Add Client" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Client</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Client Name *</label>
              <input
                type="text"
                value={data.name}
                onChange={(e: any) => {
                  const value = e.target.value;
                  (setData as any)('name', value);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                required
              />
              {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Rate (MWK)</label>
              <input 
                type="number" 
                step="0.01" 
                value={data.monthly_rate} 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50" 
                disabled 
                title="Monthly rate is automatically calculated based on selected services"
              />
              {errors.monthly_rate && <p className="text-red-600 text-sm mt-1">{errors.monthly_rate}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Billing Start Date</label>
              <input 
                type="date" 
                value={data.billing_start_date} 
                onChange={(e: any) => (setData as any)('billing_start_date', e.target.value)} 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg" 
              />
              <p className="text-xs text-gray-500 mt-1">Defaults to today if not specified</p>
              {errors.billing_start_date && <p className="text-red-600 text-sm mt-1">{errors.billing_start_date}</p>}
            </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Person</label>
                <input type="text" value={data.contact_person} onChange={(e: any) => (setData as any)('contact_person', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input type="tel" value={data.phone} onChange={(e: any) => (setData as any)('phone', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              </div>
            </div>

            <div className="flex gap-4">
              <button type="submit" disabled={processing} className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold">{processing ? 'Saving...' : 'Create Client'}</button>
              <button type="button" onClick={() => window.history.back()} className="px-6 py-3 bg-red-50 text-red-800 rounded-lg font-bold border border-red-200">Cancel</button>
            </div>

            <div className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Select Services *</label>
                <div className="text-sm text-gray-500">
                  Total Monthly Rate: <span className="font-semibold">{new Intl.NumberFormat('en-MW', { style: 'currency', currency: 'MWK' }).format(data.monthly_rate)}</span>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {props.services?.map((s) => {
                  const selected = (data.services || []).some((ds: any) => ds.id === s.id);
                  return (
                    <div key={s.id} className="p-4 border rounded-lg flex items-center gap-4 bg-white hover:bg-gray-50 transition-colors">
                      <input 
                        type="checkbox" 
                        checked={selected} 
                        onChange={(e:any) => {
                          let list = Array.isArray(data.services) ? [...data.services] : [];
                        if (e.target.checked) {
                          list.push({ id: s.id, custom_price: null, quantity: 1 });
                        } else {
                          list = list.filter((it: any) => it.id !== s.id);
                        }
                          (setData as any)('services', list);
                        }}
                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{s.name}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-4">
                          <span>Base Rate: {new Intl.NumberFormat('en-MW', { style: 'currency', currency: 'MWK' }).format(s.monthly_price)}</span>
                        </div>
                      </div>
                      {selected && (
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Custom Rate:</span>
                            <input 
                              type="number" 
                              step="0.01" 
                              placeholder="Optional" 
                              value={(data.services.find((it:any) => it.id === s.id)?.custom_price ?? '') as any} 
                              onChange={(e:any) => {
                                const list = (data.services || []).map((it:any) => 
                                  it.id === s.id ? ({ ...it, custom_price: e.target.value === '' ? null : Number(e.target.value) }) : it
                                );
                                (setData as any)('services', list);
                              }} 
                              className="w-32 px-3 py-1 border rounded-md focus:ring-1 focus:ring-red-500" 
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Quantity:</span>
                            <input 
                              type="number" 
                              min="1"
                              value={data.services.find((it:any) => it.id === s.id)?.quantity || 1} 
                              onChange={(e:any) => {
                                const quantity = Math.max(1, parseInt(e.target.value) || 1);
                                const list = (data.services || []).map((it:any) => 
                                  it.id === s.id ? ({ ...it, quantity }) : it
                                );
                                (setData as any)('services', list);
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
              <p className="text-sm text-gray-500 mt-2">* Monthly rate and required guards will be automatically calculated based on selected services</p>
            </div>

          <div className="pt-6 border-t mt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Site Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Site Name</label>
                <input 
                  type="text" 
                  value={data.site.name} 
                  onChange={(e: any) => (setData as any)('site', { ...data.site, name: e.target.value })} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg" 
                  placeholder="Home/Residence"
                />
                <p className="text-xs text-gray-500 mt-1">Defaults to Home/Residence if not specified</p>
                {errors['site.name'] && <p className="text-red-600 text-sm mt-1">{(errors as any)['site.name']}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select 
                  value={data.site.status} 
                  onChange={(e: any) => (setData as any)('site', { ...data.site, status: e.target.value })} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <textarea 
                  value={data.site.address} 
                  onChange={(e: any) => (setData as any)('site', { ...data.site, address: e.target.value })} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Site Contact</label>
                <input type="text" value={data.site.contact_person} onChange={(e: any) => (setData as any)('site', { ...data.site, contact_person: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Site Phone</label>
                <input type="tel" value={data.site.phone} onChange={(e: any) => (setData as any)('site', { ...data.site, phone: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Special Instructions</label>
                <textarea value={data.site.special_instructions} onChange={(e: any) => (setData as any)('site', { ...data.site, special_instructions: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              </div>
            </div>
          </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
