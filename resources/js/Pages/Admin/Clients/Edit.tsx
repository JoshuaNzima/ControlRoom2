import React from 'react';
import { Inertia } from '@inertiajs/inertia';
import { useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

interface ClientData {
  id?: number;
  name?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  contract_start_date?: string;
  contract_end_date?: string;
  monthly_rate?: number;
  notes?: string;
  status?: string;
}

export default function Edit({ client }: { client: ClientData }) {
  const { data, setData, post, processing, errors } = useForm<ClientData>({
    name: client.name || '',
    contact_person: client.contact_person || '',
    phone: client.phone || '',
    email: client.email || '',
    address: client.address || '',
    contract_start_date: client.contract_start_date || '',
    contract_end_date: client.contract_end_date || '',
    monthly_rate: client.monthly_rate || 0,
    notes: client.notes || '',
    status: client.status || 'active',
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    Inertia.put(route('clients.update', { client: client.id }), data as any);
  }

  return (
    <AdminLayout title="Edit Client">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Edit Client</h1>
        <form onSubmit={submit}>
          <div className="mb-4">
            <label className="block">Name</label>
            <input value={data.name} onChange={e => setData('name', e.target.value)} className="mt-1 block w-full" />
            {errors.name && <div className="text-red-600">{errors.name}</div>}
          </div>

          <div className="mb-4">
            <label className="block">Monthly Rate (MWK)</label>
            <input type="number" step="0.01" value={data.monthly_rate as any} onChange={e => setData('monthly_rate', Number(e.target.value) || 0)} className="mt-1 block w-full" />
            {errors.monthly_rate && <div className="text-red-600">{errors.monthly_rate}</div>}
          </div>

          <div className="mb-4">
            <label className="block">Contact Person</label>
            <input value={data.contact_person} onChange={e => setData('contact_person', e.target.value)} className="mt-1 block w-full" />
          </div>

          <div className="mb-4">
            <label className="block">Phone</label>
            <input value={data.phone} onChange={e => setData('phone', e.target.value)} className="mt-1 block w-full" />
          </div>

          <div className="mb-4">
            <label className="block">Address</label>
            <input value={data.address} onChange={e => setData('address', e.target.value)} className="mt-1 block w-full" />
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
