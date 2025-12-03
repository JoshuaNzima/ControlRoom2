import React from 'react';
import { router, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/Components/ui/button';
import EditSiteModal from '@/Components/Clients/EditSiteModal';
import AddSiteModal from '@/Components/Clients/AddSiteModal';

type Service = { id: number; name: string; monthly_price: number };
type Zone = { id: number; name: string };

export default function Edit({ client, services, zones = [] }: { client: any; services?: Service[]; zones?: Zone[] }) {
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

  const [addSiteOpen, setAddSiteOpen] = React.useState(false);
  const [editSiteOpen, setEditSiteOpen] = React.useState(false);
  const [selectedSiteId, setSelectedSiteId] = React.useState<number | null>(null);

  const refreshClient = React.useCallback(() => {
    router.reload({ only: ['client'] });
  }, []);

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

        {/* Sites Management */}
        <div className="mt-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold">Sites</h2>
            <Button size="sm" onClick={() => setAddSiteOpen(true)}>Add Site</Button>
          </div>
          <div className="space-y-2">
            {(client.sites || []).length === 0 && (
              <div className="text-sm text-gray-600">No sites yet.</div>
            )}
            {(client.sites || []).map((s: any) => (
              <div key={s.id} className="p-3 border rounded-md flex items-center justify-between dark:border-gray-700">
                <div className="min-w-0">
                  <div className="font-medium truncate">{s.name}</div>
                  <div className="text-xs text-gray-500 truncate">{s.address}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${s.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{s.status}</span>
                  <Button size="sm" variant="outline" onClick={() => { setSelectedSiteId(s.id); setEditSiteOpen(true); }} className="dark:border-gray-600">Edit</Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modals */}
        <AddSiteModal
          open={addSiteOpen}
          onClose={() => setAddSiteOpen(false)}
          clientId={client.id}
          onAdded={refreshClient}
          zones={zones}
        />
        <EditSiteModal
          open={editSiteOpen}
          onClose={() => setEditSiteOpen(false)}
          clientId={client.id}
          siteId={selectedSiteId}
          onSaved={refreshClient}
          zones={zones}
        />
      </div>
    </AdminLayout>
  );
}
