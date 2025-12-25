import React, { useMemo, useState } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import AssetManagementLayout from '@/Layouts/AssetManagementLayout';

export default function AssetUtilization() {
  const { auth, logs, vehicles, filters }: any = usePage().props;
  const [vehicleId, setVehicleId] = useState<number>(filters?.vehicle_id || 0);
  const [perPage, setPerPage] = useState<number>(filters?.perPage || 15);
  const [openCreate, setOpenCreate] = useState(false);
  const rows = useMemo(() => (logs?.data || logs || []), [logs]);
  const links = logs?.links || [];

  const doFilter = () => router.get(route('assets.utilization.index'), { vehicle_id: vehicleId, perPage }, { preserveState: true, replace: true });
  const reset = () => { setVehicleId(0); setPerPage(15); router.get(route('assets.utilization.index'), {}, { preserveState: false }); };

  return (
    <AssetManagementLayout title="Utilization" user={auth?.user as any}>
      <Head title="Utilization" />
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-red-900 dark:text-gray-100">Vehicle Utilization</h1>
              <p className="text-sm text-red-800/80 dark:text-gray-400 mt-1">Log hours and kilometers per shift/site.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href={route('assets.utilization.export', { vehicle_id: vehicleId })} className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-white dark:bg-gray-800 text-red-800 dark:text-gray-100 border border-red-200 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-gray-700">Export CSV</a>
              <button onClick={() => setOpenCreate(true)} className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700">New Log</button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <select value={vehicleId} onChange={(e) => setVehicleId(parseInt(e.target.value))} className="w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                <option value={0}>All Vehicles</option>
                {(vehicles || []).map((v: any) => (
                  <option key={v.id} value={v.id}>{v.tag} {v.make || ''} {v.model || ''}</option>
                ))}
              </select>
              <select value={perPage} onChange={(e) => setPerPage(parseInt(e.target.value))} className="w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                {[15,25,50].map((n) => <option key={n} value={n}>{n}/page</option>)}
              </select>
              <div className="flex gap-3">
                <button onClick={doFilter} className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200">Filter</button>
                <button onClick={reset} className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200">Reset</button>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Vehicle</th>
                  <th className="px-4 py-2 text-left">Hours</th>
                  <th className="px-4 py-2 text-left">Km</th>
                  <th className="px-4 py-2 text-left">Shift</th>
                  <th className="px-4 py-2 text-left">Site</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {rows.map((r: any) => (
                  <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{r.date}</td>
                    <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{r.vehicle?.tag || '-'} {r.vehicle?.name ? `• ${r.vehicle.name}` : ''}</td>
                    <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{r.hours ?? '-'}</td>
                    <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{r.kilometers ?? '-'}</td>
                    <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{r.shift || '-'}</td>
                    <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{r.site || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(logs?.meta?.last_page ?? 1) > 1 && (
              <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 flex justify-center gap-2">
                {(links || []).map((link: any, idx: number) => (
                  <a key={idx} href={link.url || '#'} className={`px-3 py-1 rounded text-xs ${link.active ? 'bg-red-600 text-white' : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`} dangerouslySetInnerHTML={{ __html: link.label }} />
                ))}
              </div>
            )}
          </div>

          <CreateUtilizationModal open={openCreate} onClose={() => setOpenCreate(false)} vehicles={vehicles || []} />
        </div>
      </div>
    </AssetManagementLayout>
  );
}

function CreateUtilizationModal({ open, onClose, vehicles }: { open: boolean; onClose: () => void; vehicles: any[] }) {
  const { data, setData, post, processing, reset, errors } = useForm<{ vehicle_id: number|''; date: string; hours: string; kilometers: string; shift: string; site: string }>({
    vehicle_id: '' as any,
    date: '',
    hours: '',
    kilometers: '',
    shift: '',
    site: '',
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('assets.utilization.store'), { onSuccess: () => { reset(); onClose(); } });
  };

  return (
    <div className={`fixed inset-0 z-50 ${open ? 'block' : 'hidden'}`}>
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 md:inset-0 md:m-auto md:max-w-xl bg-white dark:bg-gray-900 rounded-t-2xl md:rounded-2xl shadow-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">New Utilization Log</div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">✕</button>
        </div>
        <form onSubmit={submit} className="px-6 py-4 grid grid-cols-1 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vehicle</label>
            <select required className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={data.vehicle_id as any} onChange={(e) => setData('vehicle_id', e.target.value ? Number(e.target.value) : '' as any)}>
              <option value="">Select vehicle…</option>
              {vehicles.map((v: any) => <option key={v.id} value={v.id}>{v.tag} {v.make || ''} {v.model || ''}</option>)}
            </select>
            {errors.vehicle_id && <p className="text-xs text-red-600 mt-1">{errors.vehicle_id}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
            <input type="date" required className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={data.date} onChange={(e) => setData('date', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hours</label>
              <input type="number" step="0.01" className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={data.hours} onChange={(e) => setData('hours', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kilometers</label>
              <input type="number" className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={data.kilometers} onChange={(e) => setData('kilometers', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Shift</label>
              <input className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={data.shift} onChange={(e) => setData('shift', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Site</label>
              <input className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={data.site} onChange={(e) => setData('site', e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600" disabled={processing}>Cancel</button>
            <button type="submit" disabled={processing} className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}
