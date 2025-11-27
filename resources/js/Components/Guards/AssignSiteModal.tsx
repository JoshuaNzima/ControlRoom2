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
}: {
  open: boolean;
  guardId: number | null;
  zones: Array<{ id: number; name: string }>;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [search, setSearch] = React.useState('');
  const [zoneId, setZoneId] = React.useState<string>('');
  const [loading, setLoading] = React.useState(false);
  const [sites, setSites] = React.useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = React.useState<number | ''>('');

  const loadSites = React.useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (zoneId) params.set('zone_id', zoneId);
      const url = `${route('admin.clients.sites.json')}?${params.toString()}`;
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      const data: Site[] = await res.json();
      setSites(data);
    } catch {}
    finally { setLoading(false); }
  }, [search, zoneId]);

  React.useEffect(() => {
    if (open) {
      loadSites();
    }
  }, [open, loadSites]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guardId || !selectedSite) return;
    router.post(route('admin.guards.assign-site'), {
      guard_id: guardId,
      client_site_id: selectedSite,
    }, {
      preserveScroll: true,
      onSuccess: () => { onSuccess(); onClose(); },
    });
  };

  const unassign = () => {
    if (!guardId) return;
    if (!confirm('Unassign guard from current site?')) return;
    router.post(route('admin.guards.unassign-site'), { guard_id: guardId }, {
      preserveScroll: true,
      onSuccess: () => { onSuccess(); onClose(); },
    });
  };

  return (
    <Modal show={open} onClose={onClose} maxWidth="lg">
      <form onSubmit={submit} className="p-4 sm:p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Assign to Client Site</h3>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Zone</label>
            <select
              value={zoneId}
              onChange={(e) => setZoneId(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            >
              <option value="">All zones</option>
              {zones.map(z => (<option key={z.id} value={z.id}>{z.name}</option>))}
            </select>
          </div>
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
                        onChange={() => setSelectedSite(s.id)} />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{s.client_name}</div>
                        <div className="text-xs text-gray-500">{s.name}</div>
                      </div>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200">Cancel</button>
          <button type="button" onClick={unassign} className="px-4 py-2 rounded-md bg-yellow-600 hover:bg-yellow-700 text-white">Unassign</button>
          <button type="submit" disabled={!selectedSite || !guardId} className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white">Assign</button>
        </div>
      </form>
    </Modal>
  );
}
