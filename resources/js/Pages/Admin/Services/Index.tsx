import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, router } from '@inertiajs/react';

export default function ServicesIndex({ services }: { services: Array<{ id: number; name: string; monthly_price: number; active: boolean }> }) {
  const { data, setData, post, processing, errors } = useForm({ name: '', monthly_price: 0, description: '', active: true } as any);
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [editData, setEditData] = React.useState<any>({});

  const startEdit = (s: any) => {
    setEditingId(s.id);
    setEditData({ name: s.name, monthly_price: s.monthly_price, active: s.active });
  };

  const saveEdit = (id: number) => {
    // send put request via router
    router.put(route('services.update', id), editData);
    setEditingId(null);
  };

  const remove = (id: number) => {
    if (!confirm('Delete this service?')) return;
    router.delete(route('services.destroy', id));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('services.store'));
  };

  return (
    <AdminLayout title="Services">
      <Head title="Services" />
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg">
        <h1 className="text-xl font-semibold mb-4">Services</h1>
        <form onSubmit={submit} className="grid grid-cols-1 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input type="text" value={data.name} onChange={(e:any) => (setData as any)('name', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Monthly Price</label>
            <input type="number" step="0.01" value={data.monthly_price} onChange={(e:any) => (setData as any)('monthly_price', Number(e.target.value) || 0)} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea value={data.description} onChange={(e:any) => (setData as any)('description', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div className="flex gap-2">
            <button disabled={processing} className="px-4 py-2 bg-indigo-600 text-white rounded">Create</button>
          </div>
        </form>

        <div>
          <h2 className="text-lg font-medium mb-2">Existing Services</h2>
          <div className="grid grid-cols-1 gap-2">
            {services.map(s => (
              <div key={s.id} className="p-3 border rounded flex justify-between items-center">
                <div className="flex-1">
                  {editingId === s.id ? (
                    <div className="flex gap-2">
                      <input className="px-2 py-1 border rounded" value={editData.name || ''} onChange={e => setEditData({ ...editData, name: e.target.value })} />
                      <input type="number" className="px-2 py-1 border rounded w-32" value={editData.monthly_price ?? 0} onChange={e => setEditData({ ...editData, monthly_price: Number(e.target.value) })} />
                      <label className="flex items-center gap-2"><input type="checkbox" checked={!!editData.active} onChange={e => setEditData({ ...editData, active: e.target.checked })} /> Active</label>
                    </div>
                  ) : (
                    <>
                      <div className="font-semibold">{s.name}</div>
                      <div className="text-sm text-gray-500">{s.monthly_price}</div>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {editingId === s.id ? (
                    <>
                      <button onClick={() => saveEdit(s.id)} className="px-3 py-1 bg-green-600 text-white rounded">Save</button>
                      <button onClick={() => setEditingId(null)} className="px-3 py-1 border rounded">Cancel</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEdit(s)} className="px-3 py-1 border rounded">Edit</button>
                      <button onClick={() => remove(s.id)} className="px-3 py-1 bg-red-600 text-white rounded">Delete</button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
