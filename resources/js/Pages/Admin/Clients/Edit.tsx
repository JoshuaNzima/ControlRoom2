import React from 'react';
import { router, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

type Service = { id: number; name: string; monthly_price: number };

export default function Edit({ client, services }: { client: any; services?: Service[] }) {
  const { data, setData, put, processing, errors } = useForm({
    name: client.name || '',
    contact_person: client.contact_person || '',
    phone: client.phone || '',
    email: client.email || '',
    address: client.address || '',
    contract_start_date: client.contract_start_date || '',
    contract_end_date: client.contract_end_date || '',
    monthly_rate: client.monthly_rate || 0,
    billing_start_date: client.billing_start_date || '',
    notes: client.notes || '',
    status: client.status || 'active',
    services: (client.services || []).map((s: any) => ({ id: s.id, custom_price: s.pivot?.custom_price ?? null })),
  } as any);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    put(route('admin.clients.update', client.id));
  }

  return (
    <AdminLayout title="Edit Client">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Edit Client</h1>
        <form onSubmit={submit}>
          <div className="mb-4">
            <label className="block">Name</label>
            <input value={data.name} onChange={e => (setData as any)('name', e.target.value)} className="mt-1 block w-full" />
            {errors.name && <div className="text-red-600">{errors.name}</div>}
          </div>

          <div className="mb-4">
            <label className="block">Monthly Rate (MWK)</label>
            <input type="number" step="0.01" value={data.monthly_rate as any} onChange={e => (setData as any)('monthly_rate', Number(e.target.value) || 0)} className="mt-1 block w-full" />
            {errors.monthly_rate && <div className="text-red-600">{errors.monthly_rate}</div>}
          </div>

          <div className="mb-4">
            <label className="block">Billing Start Date</label>
            <input type="date" value={data.billing_start_date} onChange={e => (setData as any)('billing_start_date', e.target.value)} className="mt-1 block w-full" />
          </div>

          <div className="mb-4">
            <label className="block">Services</label>
            <div className="grid grid-cols-1 gap-2">
              {services?.map(s => {
                const selected = (data.services || []).some((it: any) => it.id === s.id);
                return (
                  <div key={s.id} className="p-2 border rounded flex items-center gap-4">
                    <input type="checkbox" checked={selected} onChange={(e: any) => {
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
                      <input type="number" step="0.01" placeholder="Custom price (optional)" value={(data.services.find((it: any) => it.id === s.id)?.custom_price ?? '') as any} onChange={(e: any) => {
                        const list = (data.services || []).map((it: any) => it.id === s.id ? ({ ...it, custom_price: e.target.value === '' ? null : Number(e.target.value) }) : it);
                        (setData as any)('services', list);
                      }} className="w-32 px-2 py-1 border rounded" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mb-4">
            <label className="block">Contact Person</label>
            <input value={data.contact_person} onChange={e => (setData as any)('contact_person', e.target.value)} className="mt-1 block w-full" />
          </div>

          <div className="mb-4">
            <label className="block">Phone</label>
            <input value={data.phone} onChange={e => (setData as any)('phone', e.target.value)} className="mt-1 block w-full" />
          </div>

          <div className="mb-4">
            <label className="block">Address</label>
            <input value={data.address} onChange={e => (setData as any)('address', e.target.value)} className="mt-1 block w-full" />
          </div>

          <div className="flex gap-2">
            <button disabled={processing} className="btn btn-primary">Save</button>
            <a href={route('admin.clients.index')} className="btn">Cancel</a>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
