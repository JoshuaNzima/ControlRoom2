import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AssetManagementLayout from '@/Layouts/AssetManagementLayout';
import Modal from '@/Components/Modal';

interface Vehicle { id: number; tag: string; make?: string|null; model?: string|null; year?: number|null; status: string; odometer?: number|null; assigned_to?: number|null; notes?: string|null }
interface Paginated<T> { data: T[]; links: any[]; meta: any }
interface UserOpt { id: number; name: string }

interface Props {
  auth?: any;
  vehicles?: Paginated<Vehicle>;
  options?: { statuses: string[]; users: UserOpt[] };
}

export default function AssetVehicles({ auth = {}, vehicles, options }: Props) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<Vehicle | null>(null);

  return (
    <AssetManagementLayout title="Vehicles" user={auth?.user as any}>
      <Head title="Vehicles" />
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-red-900 dark:text-gray-100">Vehicles</h1>
              <p className="text-sm text-red-800/80 dark:text-gray-400 mt-1">Manage fleet vehicles and assignments.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setCreateOpen(true)} className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700">New Vehicle</button>
              <Link href={route('admin.assets.index')} className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-white dark:bg-gray-800 text-red-800 dark:text-gray-100 border border-red-200 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-gray-700">Assets</Link>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-2 text-left">Tag</th>
                    <th className="px-4 py-2 text-left">Make/Model</th>
                    <th className="px-4 py-2 text-left">Year</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Odometer</th>
                    <th className="px-4 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {vehicles?.data?.length ? vehicles.data.map(v => (
                    <tr key={v.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{v.tag}</td>
                      <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{[v.make, v.model].filter(Boolean).join(' ') || '—'}</td>
                      <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{v.year || '—'}</td>
                      <td className="px-4 py-2"><span className="px-2 py-1 rounded text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200">{v.status}</span></td>
                      <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{v.odometer ?? '—'}</td>
                      <td className="px-4 py-2 text-right">
                        <div className="inline-flex gap-2">
                          <button onClick={() => { setSelected(v); setEditOpen(true); }} className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">Edit</button>
                          <button onClick={() => { if (confirm('Delete vehicle?')) router.delete(route('admin.assets.vehicles.destroy', v.id)); }} className="text-red-600 hover:text-red-800">Delete</button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">No vehicles yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {(vehicles?.meta?.last_page ?? 1) > 1 && (
              <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 flex justify-center gap-2">
                {(vehicles?.links ?? []).map((link: any, idx: number) => (
                  <Link key={idx} href={link.url || '#'} className={`px-3 py-1 rounded text-xs ${link.active ? 'bg-red-600 text-white' : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`} dangerouslySetInnerHTML={{ __html: link.label }} />
                ))}
              </div>
            )}
          </div>

          <VehicleModal open={createOpen} onClose={() => setCreateOpen(false)} statuses={options?.statuses || []} users={options?.users || []} />
          {selected && (
            <VehicleModal open={editOpen} onClose={() => { setEditOpen(false); setSelected(null); }} statuses={options?.statuses || []} users={options?.users || []} vehicle={selected} />
          )}
        </div>
      </div>
    </AssetManagementLayout>
  );
}

function VehicleModal({ open, onClose, statuses, users, vehicle }: { open: boolean; onClose: () => void; statuses: string[]; users: UserOpt[]; vehicle?: Vehicle }) {
  const { data, setData, post, put, processing, errors, reset } = useForm<{ tag: string; make: string; model: string; year: string; status: string; odometer: string; assigned_to: number|''; notes: string }>({
    tag: vehicle?.tag || '',
    make: vehicle?.make || '',
    model: vehicle?.model || '',
    year: vehicle?.year ? String(vehicle.year) : '',
    status: vehicle?.status || statuses[0] || 'active',
    odometer: vehicle?.odometer ? String(vehicle.odometer) : '',
    assigned_to: (vehicle?.assigned_to as any) || '',
    notes: vehicle?.notes || '',
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (vehicle) {
      put(route('admin.assets.vehicles.update', vehicle.id), { onSuccess: () => { reset(); onClose(); } });
    } else {
      post(route('admin.assets.vehicles.store'), { onSuccess: () => { reset(); onClose(); } });
    }
  };

  const handleClose = () => { if (!processing) onClose(); };

  return (
    <Modal show={open} onClose={handleClose} maxWidth="2xl">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white dark:bg-gray-900">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{vehicle ? 'Edit Vehicle' : 'New Vehicle'}</h2>
        <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">✕</button>
      </div>
      <div className="px-6 py-4 bg-white dark:bg-gray-900">
        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tag</label>
            <input className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={data.tag} onChange={(e) => setData('tag', e.target.value)} />
            {errors.tag && <p className="text-sm text-red-600">{errors.tag}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Make</label>
            <input className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={data.make} onChange={(e) => setData('make', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Model</label>
            <input className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={data.model} onChange={(e) => setData('model', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Year</label>
            <input type="number" className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={data.year} onChange={(e) => setData('year', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Odometer</label>
            <input type="number" className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={data.odometer} onChange={(e) => setData('odometer', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={data.status} onChange={(e) => setData('status', e.target.value)}>
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assigned to</label>
            <select className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={data.assigned_to as any} onChange={(e) => setData('assigned_to', e.target.value ? Number(e.target.value) : '' as any)}>
              <option value="">Unassigned</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
            <textarea className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" rows={3} value={data.notes} onChange={(e) => setData('notes', e.target.value)} />
          </div>
          <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
            <button type="button" onClick={handleClose} className="px-4 py-2 text-sm rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600" disabled={processing}>Cancel</button>
            <button type="submit" disabled={processing} className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400">Save</button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
