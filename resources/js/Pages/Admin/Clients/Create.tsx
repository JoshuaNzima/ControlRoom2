import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function CreateClient(props: { services?: Array<{ id: number; name: string; monthly_price: number }> }) {
  const { data, setData, post, processing, errors } = useForm({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    contract_start_date: '',
    contract_end_date: '',
    monthly_rate: 0,
  billing_start_date: '',
    notes: '',
    status: 'active',
    site: {
      name: '',
      address: '',
      required_guards: 1,
      services_requested: '',
      status: 'active',
      contact_person: '',
      phone: '',
      special_instructions: '',
      latitude: '',
      longitude: '',
    },
    services: [] as number[],
  } as any);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('clients.store'));
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Rate (MWK) *</label>
              <input type="number" step="0.01" value={data.monthly_rate as any} onChange={(e: any) => (setData as any)('monthly_rate', Number(e.target.value) || 0)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
              {errors.monthly_rate && <p className="text-red-600 text-sm mt-1">{errors.monthly_rate}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Billing Start Date</label>
              <input type="date" value={data.billing_start_date} onChange={(e: any) => (setData as any)('billing_start_date', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Assign Services (optional)</label>
              <div className="grid grid-cols-1 gap-2">
                {props.services?.map((s) => {
                  const selected = (data.services || []).some((ds: any) => ds.id === s.id);
                  return (
                    <div key={s.id} className="p-2 border rounded flex items-center gap-4">
                      <input type="checkbox" checked={selected} onChange={(e:any) => {
                        let list = Array.isArray(data.services) ? [...data.services] : [];
                        if (e.target.checked) {
                          list.push({ id: s.id, custom_price: null });
                        } else {
                          list = list.filter((it: any) => it.id !== s.id);
                        }
                        (setData as any)('services', list);
                      }} />
                      <div className="flex-1">
                        <div className="font-semibold">{s.name}</div>
                        <div className="text-sm text-gray-500">Default: {s.monthly_price}</div>
                      </div>
                      {selected && (
                        <input type="number" step="0.01" placeholder="Custom price (optional)" value={(data.services.find((it:any) => it.id === s.id)?.custom_price ?? '') as any} onChange={(e:any) => {
                          const list = (data.services || []).map((it:any) => it.id === s.id ? ({ ...it, custom_price: e.target.value === '' ? null : Number(e.target.value) }) : it);
                          (setData as any)('services', list);
                        }} className="w-32 px-2 py-1 border rounded" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          <div className="pt-6 border-t mt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Add First Site (optional)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Site Name</label>
                <input type="text" value={data.site.name} onChange={(e: any) => (setData as any)('site', { ...data.site, name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                {errors['site.name'] && <p className="text-red-600 text-sm mt-1">{(errors as any)['site.name']}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select value={data.site.status} onChange={(e: any) => (setData as any)('site', { ...data.site, status: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <textarea value={data.site.address} onChange={(e: any) => (setData as any)('site', { ...data.site, address: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Required Guards</label>
                <input type="number" min={1} value={data.site.required_guards} onChange={(e: any) => (setData as any)('site', { ...data.site, required_guards: Number(e.target.value) || 1 })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Services Requested</label>
                <input type="text" value={data.site.services_requested} onChange={(e: any) => (setData as any)('site', { ...data.site, services_requested: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="e.g., Manned guarding, CCTV monitoring" />
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
