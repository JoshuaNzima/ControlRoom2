import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AssetManagementLayout from '@/Layouts/AssetManagementLayout';
import { Card } from '@/Components/ui/card';
import Modal from '@/Components/Modal';

const assetFieldClassName =
  'w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:border-red-500 focus:ring-1 focus:ring-red-500';

interface VehicleOpt { id: number; tag: string; make?: string|null; model?: string|null }
interface DriverOpt { id: number; name: string }
interface SiteOpt { id: number; name: string }
interface OpenDispatch { id: number; vehicle: VehicleOpt; driver: DriverOpt; odometer_out?: number|null; fuel_level_out?: number|null; origin_site_id?: number|null; destination_site_id?: number|null; dispatched_at?: string|null; purpose?: string|null }
interface RecentDispatch { id: number; vehicle: VehicleOpt; driver: DriverOpt; status: string; dispatched_at?: string|null; returned_at?: string|null }

interface Props {
  auth?: any;
  openDispatches: OpenDispatch[];
  recentDispatches: RecentDispatch[];
  vehicles: VehicleOpt[];
  drivers: DriverOpt[];
  sites: SiteOpt[];
}

export default function AssetDispatches({ auth = {}, openDispatches = [], recentDispatches = [], vehicles = [], drivers = [], sites = [] }: Props) {
  const [createOpen, setCreateOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState<{ open: boolean; id: number|null }>(() => ({ open: false, id: null }));

  return (
    <AssetManagementLayout title="Vehicle Dispatches" user={auth?.user as any}>
      <Head title="Vehicle Dispatches" />
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-red-900 dark:text-gray-100">Vehicle Dispatches</h1>
              <p className="text-sm text-red-800/80 dark:text-gray-400 mt-1">Create, track and close vehicle dispatches.</p>
            </div>
            <button
              onClick={() => setCreateOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950"
            >
              New Dispatch
            </button>
          </div>

          <Card className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Open Dispatches</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {openDispatches.length ? openDispatches.map((d) => (
                <div key={d.id} className="p-3 rounded-lg border bg-white dark:bg-gray-800 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{d.vehicle?.tag}</div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200">Dispatched</span>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Driver: {d.driver?.name || '—'}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Out: {d.dispatched_at || '—'}</div>
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => setReturnOpen({ open: true, id: d.id })}
                      className="px-3 py-1.5 text-xs rounded-md bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950"
                    >
                      Record Return
                    </button>
                  </div>
                </div>
              )) : (
                <div className="text-sm text-gray-500 dark:text-gray-400">No open dispatches</div>
              )}
            </div>
          </Card>

          <Card className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Recent</h2>
            <div className="space-y-2">
              {recentDispatches.length ? recentDispatches.map((d) => (
                <div key={d.id} className="p-3 rounded-lg border bg-white dark:bg-gray-800 dark:border-gray-700 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{d.vehicle?.tag}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Driver: {d.driver?.name || '—'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-600 dark:text-gray-400">Out: {d.dispatched_at || '—'}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">In: {d.returned_at || '—'}</div>
                  </div>
                </div>
              )) : (
                <div className="text-sm text-gray-500 dark:text-gray-400">No recent activity</div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <CreateDispatchModal open={createOpen} onClose={() => setCreateOpen(false)} vehicles={vehicles} drivers={drivers} sites={sites} />
      <ReturnDispatchModal open={returnOpen.open} onClose={() => setReturnOpen({ open: false, id: null })} id={returnOpen.id} />
    </AssetManagementLayout>
  );
}

function CreateDispatchModal({ open, onClose, vehicles, drivers, sites }: { open: boolean; onClose: () => void; vehicles: VehicleOpt[]; drivers: DriverOpt[]; sites: SiteOpt[]; }) {
  const { data, setData, post, processing, errors, reset } = useForm<{ vehicle_id: number|''; driver_id: number|''; origin_site_id: number|''; destination_site_id: number|''; odometer_out: number|''; fuel_level_out: number|''; purpose: string; notes_out: string }>({
    vehicle_id: '' as any,
    driver_id: '' as any,
    origin_site_id: '' as any,
    destination_site_id: '' as any,
    odometer_out: '' as any,
    fuel_level_out: '' as any,
    purpose: '',
    notes_out: '',
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('assets.dispatches.store'), { onSuccess: () => { reset(); onClose(); } });
  };

  const handleClose = () => { if (!processing) onClose(); };

  return (
    <Modal show={open} onClose={handleClose} maxWidth="2xl">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white dark:bg-gray-900">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">New Dispatch</h2>
        <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">✕</button>
      </div>
      <div className="px-6 py-4 bg-white dark:bg-gray-900">
        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vehicle</label>
            <select className={assetFieldClassName} value={data.vehicle_id as any} onChange={(e) => setData('vehicle_id', e.target.value ? Number(e.target.value) : '' as any)} required>
              <option value="">Select vehicle</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.tag} {v.make || ''} {v.model || ''}</option>)}
            </select>
            {errors.vehicle_id && <p className="text-sm text-red-600 mt-1">{errors.vehicle_id}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Driver</label>
            <select className={assetFieldClassName} value={data.driver_id as any} onChange={(e) => setData('driver_id', e.target.value ? Number(e.target.value) : '' as any)} required>
              <option value="">Select driver</option>
              {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            {errors.driver_id && <p className="text-sm text-red-600 mt-1">{errors.driver_id}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Origin</label>
            <select className={assetFieldClassName} value={data.origin_site_id as any} onChange={(e) => setData('origin_site_id', e.target.value ? Number(e.target.value) : '' as any)}>
              <option value="">—</option>
              {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Destination</label>
            <select className={assetFieldClassName} value={data.destination_site_id as any} onChange={(e) => setData('destination_site_id', e.target.value ? Number(e.target.value) : '' as any)}>
              <option value="">—</option>
              {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Odometer Out</label>
            <input type="number" className={assetFieldClassName} value={data.odometer_out as any} onChange={(e) => setData('odometer_out', e.target.value ? Number(e.target.value) : '' as any)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fuel Level Out (%)</label>
            <input type="number" min={0} max={100} className={assetFieldClassName} value={data.fuel_level_out as any} onChange={(e) => setData('fuel_level_out', e.target.value ? Number(e.target.value) : '' as any)} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Purpose</label>
            <input className={assetFieldClassName} value={data.purpose} onChange={(e) => setData('purpose', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
            <textarea rows={3} className={assetFieldClassName} value={data.notes_out} onChange={(e) => setData('notes_out', e.target.value)} />
          </div>
          <div className="sm:col-span-2 flex flex-col sm:flex-row justify-end gap-2 pt-2">
            <button type="button" onClick={handleClose} className="w-full sm:w-auto px-4 py-2 text-sm rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600" disabled={processing}>Cancel</button>
            <button type="submit" disabled={processing} className="w-full sm:w-auto px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400 dark:disabled:bg-gray-700">Create</button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function ReturnDispatchModal({ open, onClose, id }: { open: boolean; onClose: () => void; id: number|null }) {
  const { data, setData, post, processing } = useForm<{ odometer_in: number|''; fuel_level_in: number|''; notes_in: string }>({ odometer_in: '' as any, fuel_level_in: '' as any, notes_in: '' });

  const handleClose = () => { if (!processing) onClose(); };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return handleClose();
    post(route('assets.dispatches.return', id), { onSuccess: handleClose });
  };
  return (
    <Modal show={open} onClose={handleClose} maxWidth="md">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white dark:bg-gray-900">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Record Return</h2>
        <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">✕</button>
      </div>
      <div className="px-6 py-4 bg-white dark:bg-gray-900">
        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Odometer In</label>
            <input type="number" className={assetFieldClassName} value={data.odometer_in as any} onChange={(e) => setData('odometer_in', e.target.value ? Number(e.target.value) : '' as any)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fuel Level In (%)</label>
            <input type="number" min={0} max={100} className={assetFieldClassName} value={data.fuel_level_in as any} onChange={(e) => setData('fuel_level_in', e.target.value ? Number(e.target.value) : '' as any)} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
            <textarea rows={3} className={assetFieldClassName} value={data.notes_in} onChange={(e) => setData('notes_in', e.target.value)} />
          </div>
          <div className="sm:col-span-2 flex flex-col sm:flex-row justify-end gap-2 pt-2">
            <button type="button" onClick={handleClose} className="w-full sm:w-auto px-4 py-2 text-sm rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600" disabled={processing}>Cancel</button>
            <button type="submit" disabled={processing} className="w-full sm:w-auto px-4 py-2 text-sm rounded-md bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400 dark:disabled:bg-gray-700">Save</button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
