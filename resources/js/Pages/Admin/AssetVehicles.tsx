import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import Modal from '@/Components/Modal';

interface Vehicle { id: number; tag: string; make?: string|null; model?: string|null; year?: number|null; status: string; odometer?: number|null; assigned_to?: number|null; notes?: string|null }
interface Paginated<T> { data: T[]; links: any[]; meta: any }
interface UserOpt { id: number; name: string }
interface Handover { id: number; asset_id: number; handed_to: number; handed_to_user?: { id: number; name: string }; condition_out: string; serial?: string|null; color?: string|null; notes_out?: string|null }

const assetFieldClassName =
  'w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:border-red-500 focus:ring-1 focus:ring-red-500';

const vehicleStatusBadgeClassName = (status: string) => {
  const s = (status || '').toLowerCase();
  if (s.includes('active') || s.includes('available')) {
    return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200';
  }
  if (s.includes('maint') || s.includes('repair') || s.includes('service')) {
    return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200';
  }
  if (s.includes('inactive') || s.includes('disabled') || s.includes('retired')) {
    return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  }
  return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
};

interface Props {
  auth?: any;
  vehicles?: Paginated<Vehicle>;
  options?: { statuses: string[]; users: UserOpt[] };
  openHandovers?: Record<number, Handover>;
}

export default function AssetVehicles({ auth = {}, vehicles, options, openHandovers = {} }: Props) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<Vehicle | null>(null);
  const [handoverTarget, setHandoverTarget] = useState<Vehicle | null>(null);
  const [returnTarget, setReturnTarget] = useState<{ asset: Vehicle; handover: Handover } | null>(null);

  return (
    <AuthenticatedLayout header="Vehicles" user={auth?.user as any}>
      <Head title="Vehicles" />
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-red-900 dark:text-gray-100">Vehicles</h1>
              <p className="text-sm text-red-800/80 dark:text-gray-400 mt-1">Manage fleet vehicles and assignments.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setCreateOpen(true)}
                className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950"
              >
                New Vehicle
              </button>
              <Link href={route('assets.index')} className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-white dark:bg-gray-800 text-red-800 dark:text-gray-100 border border-red-200 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-gray-700">Assets</Link>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-[980px] w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="px-3 sm:px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Tag</th>
                    <th className="px-3 sm:px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Make/Model</th>
                    <th className="px-3 sm:px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Year</th>
                    <th className="px-3 sm:px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Status</th>
                    <th className="px-3 sm:px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Odometer</th>
                    <th className="px-3 sm:px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Handover</th>
                    <th className="px-3 sm:px-4 py-2 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {vehicles?.data?.length ? vehicles.data.map(v => (
                    <tr key={v.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{v.tag}</td>
                      <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{[v.make, v.model].filter(Boolean).join(' ') || '—'}</td>
                      <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{v.year || '—'}</td>
                      <td className="px-4 py-2"><span className={`px-2 py-1 rounded text-xs ${vehicleStatusBadgeClassName(v.status)}`}>{v.status}</span></td>
                      <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{v.odometer ?? '—'}</td>
                      <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                        {openHandovers[v.id] ? (
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex items-center gap-2 text-amber-500">
                              <span className="h-2 w-2 rounded-full bg-amber-500" />
                              Out with {openHandovers[v.id].handed_to_user?.name || 'Officer'}
                            </span>
                            <button
                              onClick={() => setReturnTarget({ asset: v, handover: openHandovers[v.id] })}
                              className="text-xs inline-flex items-center gap-1 text-amber-600 hover:text-amber-700 dark:text-amber-300 dark:hover:text-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950 rounded-md px-2 py-1 -ml-2"
                            >
                              Record return
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setHandoverTarget(v)}
                            className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950"
                          >
                            Handover
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="inline-flex gap-2">
                          <button
                            onClick={() => { setSelected(v); setEditOpen(true); }}
                            className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950 rounded-md px-2 py-1"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => { if (confirm('Delete vehicle?')) router.delete(route('assets.vehicles.destroy', v.id)); }}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950 rounded-md px-2 py-1"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">No vehicles yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {(vehicles?.meta?.last_page ?? 1) > 1 && (
              <div className="bg-gray-50 dark:bg-gray-950 px-4 py-3 flex flex-wrap justify-center gap-2 border-t border-gray-200 dark:border-gray-800">
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
          {handoverTarget && (
            <HandoverModal
              open={!!handoverTarget}
              onClose={() => setHandoverTarget(null)}
              asset={handoverTarget}
              users={options?.users || []}
            />
          )}
          {returnTarget && (
            <ReturnModal
              open={!!returnTarget}
              onClose={() => setReturnTarget(null)}
              asset={returnTarget.asset}
              handover={returnTarget.handover}
            />
          )}
        </div>
      </div>
    </AuthenticatedLayout>
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
      put(route('assets.vehicles.update', vehicle.id), { onSuccess: () => { reset(); onClose(); } });
    } else {
      post(route('assets.vehicles.store'), { onSuccess: () => { reset(); onClose(); } });
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
            <input className={assetFieldClassName} value={data.tag} onChange={(e) => setData('tag', e.target.value)} />
            {errors.tag && <p className="text-sm text-red-600">{errors.tag}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Make</label>
            <input className={assetFieldClassName} value={data.make} onChange={(e) => setData('make', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Model</label>
            <input className={assetFieldClassName} value={data.model} onChange={(e) => setData('model', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Year</label>
            <input type="number" className={assetFieldClassName} value={data.year} onChange={(e) => setData('year', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Odometer</label>
            <input type="number" className={assetFieldClassName} value={data.odometer} onChange={(e) => setData('odometer', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select className={assetFieldClassName} value={data.status} onChange={(e) => setData('status', e.target.value)}>
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assigned to</label>
            <select className={assetFieldClassName} value={data.assigned_to as any} onChange={(e) => setData('assigned_to', e.target.value ? Number(e.target.value) : '' as any)}>
              <option value="">Unassigned</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
            <textarea className={assetFieldClassName} rows={3} value={data.notes} onChange={(e) => setData('notes', e.target.value)} />
          </div>
          <div className="sm:col-span-2 flex flex-col sm:flex-row justify-end gap-2 pt-2">
            <button type="button" onClick={handleClose} className="w-full sm:w-auto px-4 py-2 text-sm rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600" disabled={processing}>Cancel</button>
            <button type="submit" disabled={processing} className="w-full sm:w-auto px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400 dark:disabled:bg-gray-700">Save</button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function HandoverModal({ open, onClose, asset, users }: { open: boolean; onClose: () => void; asset: Vehicle; users: UserOpt[] }) {
  const { data, setData, post, processing, errors, reset } = useForm<{ asset_type: 'vehicle'; asset_id: number; handed_to: number|''; condition_out: string; serial: string; color: string; notes_out: string }>({
    asset_type: 'vehicle',
    asset_id: asset.id,
    handed_to: '',
    condition_out: '',
    serial: '',
    color: '',
    notes_out: '',
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('assets.handovers.store'), {
      preserveScroll: true,
      onSuccess: () => { reset(); onClose(); },
    });
  };

  const handleClose = () => { if (!processing) onClose(); };

  return (
    <Modal show={open} onClose={handleClose} maxWidth="2xl">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white dark:bg-gray-900">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Handover Vehicle</h2>
        <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">✕</button>
      </div>
      <div className="px-6 py-4 bg-white dark:bg-gray-900">
        <form onSubmit={submit} className="space-y-4">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            <div className="font-semibold text-gray-900 dark:text-gray-100">{[asset.make, asset.model].filter(Boolean).join(' ') || 'Vehicle'}</div>
            <div className="text-gray-600 dark:text-gray-400">Tag: {asset.tag}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hand over to</label>
            <select
              className={assetFieldClassName}
              value={data.handed_to as any}
              onChange={(e) => setData('handed_to', e.target.value ? Number(e.target.value) : '' as any)}
              required
            >
              <option value="">Select person</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            {errors.handed_to && <p className="text-sm text-red-600 mt-1">{errors.handed_to}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Condition (out)</label>
              <input className={assetFieldClassName} value={data.condition_out} onChange={(e) => setData('condition_out', e.target.value)} required />
              {errors.condition_out && <p className="text-sm text-red-600 mt-1">{errors.condition_out}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Serial</label>
              <input className={assetFieldClassName} value={data.serial} onChange={(e) => setData('serial', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Color</label>
              <input className={assetFieldClassName} value={data.color} onChange={(e) => setData('color', e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
              <textarea className={assetFieldClassName} rows={3} value={data.notes_out} onChange={(e) => setData('notes_out', e.target.value)} />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
            <button type="button" onClick={handleClose} className="w-full sm:w-auto px-4 py-2 text-sm rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600" disabled={processing}>Cancel</button>
            <button type="submit" disabled={processing} className="w-full sm:w-auto px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400 dark:disabled:bg-gray-700">Handover</button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function ReturnModal({ open, onClose, asset, handover }: { open: boolean; onClose: () => void; asset: Vehicle; handover: Handover }) {
  const { data, setData, post, processing, errors, reset } = useForm<{ condition_in: string; notes_in: string }>({
    condition_in: '',
    notes_in: '',
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('assets.handovers.return', handover.id), {
      preserveScroll: true,
      onSuccess: () => { reset(); onClose(); },
    });
  };

  const handleClose = () => { if (!processing) onClose(); };

  return (
    <Modal show={open} onClose={handleClose} maxWidth="2xl">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white dark:bg-gray-900">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Record Return</h2>
        <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">✕</button>
      </div>
      <div className="px-6 py-4 bg-white dark:bg-gray-900 space-y-4">
        <div className="text-sm text-gray-700 dark:text-gray-300">
          <div className="font-semibold text-gray-900 dark:text-gray-100">{[asset.make, asset.model].filter(Boolean).join(' ') || 'Vehicle'}</div>
          <div className="text-gray-600 dark:text-gray-400">Tag: {asset.tag}</div>
          <div className="text-gray-600 dark:text-gray-400">Issued to: {handover.handed_to_user?.name || 'Officer'}</div>
          <div className="text-gray-600 dark:text-gray-400">Condition out: {handover.condition_out || '—'}</div>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Condition on return</label>
            <input className={assetFieldClassName} value={data.condition_in} onChange={(e) => setData('condition_in', e.target.value)} required />
            {errors.condition_in && <p className="text-sm text-red-600 mt-1">{errors.condition_in}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
            <textarea className={assetFieldClassName} rows={3} value={data.notes_in} onChange={(e) => setData('notes_in', e.target.value)} />
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
            <button type="button" onClick={handleClose} className="w-full sm:w-auto px-4 py-2 text-sm rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600" disabled={processing}>Cancel</button>
            <button type="submit" disabled={processing} className="w-full sm:w-auto px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400 dark:disabled:bg-gray-700">Record return</button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
