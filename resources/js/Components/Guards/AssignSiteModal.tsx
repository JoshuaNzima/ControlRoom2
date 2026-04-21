import React from 'react';
import Modal from '@/Components/Modal';
import { router } from '@inertiajs/react';

type Site = { id: number; name: string; client_name: string };

export default function AssignSiteModal({
  open,
  guardId,
  zones = [],
  onClose,
  onSuccess,
  scope = 'control-room',
  currentAssignment,
}: {
  open: boolean;
  guardId: number | null;
  zones: Array<{ id: number; name: string }>;
  onClose: () => void;
  onSuccess: () => void;
  scope?: 'control-room' | 'admin' | 'zone' | 'superadmin';
  currentAssignment?: { site_id?: number | null; site_name?: string | null; client_name?: string | null } | null;
}) {
  const [search, setSearch] = React.useState('');
  const [zoneId, setZoneId] = React.useState<string>('');
  const [loading, setLoading] = React.useState(false);
  const [sites, setSites] = React.useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = React.useState<number | ''>('');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string>('');
  const zonesList = React.useMemo(() => (Array.isArray(zones) ? zones : []), [zones]);

  const loadSites = React.useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (scope !== 'zone' && zoneId) params.set('zone_id', zoneId);
      const listRoute = scope === 'admin'
        ? 'admin.clients.sites.json'
        : scope === 'zone'
          ? 'zone.sites.json'
          : scope === 'superadmin'
            ? 'superadmin.sites.json'
            : 'control-room.clients.sites.json';
      const qs = params.toString();
      const url = qs ? `${route(listRoute)}?${qs}` : route(listRoute);
      const res = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        credentials: 'same-origin',
      });
      if (!res.ok) { setSites([]); return; }
      const data = await res.json();
      setSites(Array.isArray(data) ? (data as Site[]) : []);
    } catch {}
    finally { setLoading(false); }
  }, [search, zoneId, scope]);

  React.useEffect(() => {
    if (open) {
      loadSites();
    }
  }, [open, loadSites]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guardId || !selectedSite) return;
    if (currentAssignment && currentAssignment.site_id && selectedSite === currentAssignment.site_id) return; // prevent duplicate submit
    setSubmitting(true);
    setError('');
    const assignRoute = scope === 'admin'
      ? 'admin.guards.assign-site'
      : scope === 'zone'
        ? 'zone.guards.assign-site'
        : scope === 'superadmin'
          ? 'admin.guards.assign-site'
          : 'control-room.guards.assign-site';
    router.post(route(assignRoute), {
      guard_id: guardId,
      client_site_id: selectedSite,
    }, {
      preserveScroll: true,
      onSuccess: () => { onSuccess(); onClose(); },
      onFinish: () => setSubmitting(false),
      onError: (errs: any) => setError(Object.values(errs)[0] as string || 'Failed to assign site'),
    });
  };

  const [unassigning, setUnassigning] = React.useState(false);

  const unassign = () => {
    if (!guardId) return;
    if (!confirm('Unassign guard from current site?')) return;
    setUnassigning(true);
    setError('');
    const unassignRoute = scope === 'admin'
      ? 'admin.guards.unassign-site'
      : scope === 'zone'
        ? 'zone.guards.unassign-site'
        : scope === 'superadmin'
          ? 'admin.guards.unassign-site'
          : 'control-room.guards.unassign-site';
    router.post(route(unassignRoute), { guard_id: guardId }, {
      preserveScroll: true,
      onSuccess: () => { onSuccess(); onClose(); },
      onFinish: () => setUnassigning(false),
      onError: (errs: any) => setError(Object.values(errs)[0] as string || 'Failed to unassign site'),
    });
  };

  return (
    <Modal show={open} onClose={onClose} maxWidth="lg">
      <form onSubmit={submit} className="p-4 sm:p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Assign to Client Site</h3>
        {currentAssignment && currentAssignment.site_id ? (
          <div className="text-sm text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 px-3 py-2 rounded">
            Currently assigned: <span className="font-medium">{currentAssignment.client_name || 'Client'}</span> • {currentAssignment.site_name || 'Site'}
          </div>
        ) : null}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Search</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), loadSites())}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              placeholder="Search site or client name"
            />
          </div>
          {scope !== 'zone' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Zone</label>
              <select
                value={zoneId}
                onChange={(e) => setZoneId(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              >
                <option value="">All zones</option>
                {zonesList.map(z => (<option key={z.id} value={z.id}>{z.name}</option>))}
              </select>
            </div>
          )}
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-300">Select Site</span>
            <button type="button" onClick={loadSites} className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800">{loading ? 'Loading...' : 'Refresh'}</button>
          </div>
          <div className="max-h-64 overflow-y-auto rounded border border-gray-200 dark:border-gray-700">
            {sites.length === 0 ? (
              <div className="p-3 text-sm text-gray-500">{loading ? 'Loading...' : 'No sites found'}</div>
            ) : (
              <ul>
                {sites.map(s => (
                  <li key={s.id}>
                    <label className="flex items-center gap-3 px-3 py-2 border-b last:border-0 border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <input type="radio" name="site" value={s.id} checked={selectedSite === s.id}
                        onChange={() => setSelectedSite(s.id)}
                        disabled={!!currentAssignment?.site_id && currentAssignment?.site_id === s.id}
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{s.client_name}</div>
                        <div className="text-xs text-gray-500">
                          {s.name}
                          {currentAssignment?.site_id === s.id ? <span className="ml-2 text-[11px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">current</span> : null}
                        </div>
                      </div>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        {error && (
          <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">{error}</div>
        )}
        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200">Cancel</button>
          <button
            type="button"
            onClick={unassign}
            disabled={unassigning}
            className="px-4 py-2 rounded-md bg-yellow-600 hover:bg-yellow-700 text-white disabled:opacity-60 flex items-center gap-2"
          >
            {unassigning && (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            {unassigning ? 'Unassigning...' : 'Unassign'}
          </button>
          <button
            type="submit"
            disabled={!selectedSite || !guardId || (!!currentAssignment?.site_id && selectedSite === currentAssignment.site_id) || submitting}
            className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-60 flex items-center gap-2"
          >
            {submitting && (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            {submitting ? 'Assigning...' : 'Assign'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
