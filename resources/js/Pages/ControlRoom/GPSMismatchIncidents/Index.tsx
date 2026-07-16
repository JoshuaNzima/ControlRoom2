import React, { useMemo } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'

type Incident = {
  id: number;
  scan_type: string;
  occurred_at: string;
  distance_meters?: number | null;
  radius_meters?: number | null;
  mismatch_count: number;
  threshold: number;
  window_minutes: number;
  escalated: boolean;
  message?: string | null;
  attempted_latitude?: string | null;
  attempted_longitude?: string | null;
  expected_latitude?: string | null;
  expected_longitude?: string | null;
  user?: { id: number; name: string } | null;
  site?: { id: number; name: string } | null;
  checkpoint?: { id: number; name: string; client_site_id?: number } | null;
};

type Paginated<T> = {
  data: T[];
  links: Array<{ url: string | null; label: string; active: boolean }>;
  meta?: any;
};

type Filters = {
  site_id?: string;
  user_id?: string;
  escalated?: string;
  from?: string;
  to?: string;
};

export default function Index() {
  const { props } = usePage<any>();
  const incidents = (props as any).incidents as Paginated<Incident>;
  const filters = ((props as any).filters || {}) as Filters;

  const stats = useMemo(() => {
    const rows = incidents?.data || [];
    const total = rows.length;
    const escalated = rows.filter((r) => r.escalated).length;
    return { total, escalated };
  }, [incidents]);

  const applyFilters = (next: Filters) => {
    router.get(route('control-room.gps-mismatch-incidents.index'), next, { preserveState: true, replace: true });
  };

  const onChange = (key: keyof Filters, value: string) => {
    applyFilters({ ...filters, [key]: value || undefined });
  };

  return (
    <AuthenticatedLayout header="GPS Mismatch Incidents">
      <Head title="GPS Mismatch Incidents" />

      <div className="space-y-4">
        <div className="rounded-xl border border-red-100 bg-white/95 p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900/60">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-red-900 dark:text-gray-100">GPS Mismatch Incidents</h2>
              <p className="text-sm text-red-700/80 dark:text-gray-300">
                {stats.total} shown, {stats.escalated} escalated
              </p>
            </div>
            <div className="text-sm text-red-700 dark:text-gray-300">
              Radius defaults to 10m unless site/checkpoint overrides it.
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-red-800 dark:text-gray-300">Site ID</label>
              <input
                value={filters.site_id || ''}
                onChange={(e) => onChange('site_id', e.target.value)}
                className="w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-coin-600 focus:ring-2 focus:ring-coin-600/20 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                placeholder="e.g. 12"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-red-800 dark:text-gray-300">User ID</label>
              <input
                value={filters.user_id || ''}
                onChange={(e) => onChange('user_id', e.target.value)}
                className="w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-coin-600 focus:ring-2 focus:ring-coin-600/20 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                placeholder="e.g. 5"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-red-800 dark:text-gray-300">Escalated</label>
              <select
                value={filters.escalated || ''}
                onChange={(e) => onChange('escalated', e.target.value)}
                className="w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-coin-600 focus:ring-2 focus:ring-coin-600/20 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
              >
                <option value="">All</option>
                <option value="1">Escalated</option>
                <option value="0">Not escalated</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-red-800 dark:text-gray-300">From</label>
              <input
                type="date"
                value={filters.from || ''}
                onChange={(e) => onChange('from', e.target.value)}
                className="w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-coin-600 focus:ring-2 focus:ring-coin-600/20 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-red-800 dark:text-gray-300">To</label>
              <input
                type="date"
                value={filters.to || ''}
                onChange={(e) => onChange('to', e.target.value)}
                className="w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-coin-600 focus:ring-2 focus:ring-coin-600/20 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-red-100 bg-white/95 shadow-sm dark:border-gray-800 dark:bg-gray-900/60">
          <div className="overflow-x-auto">
            <table className="min-w-[1100px] w-full text-left">
              <thead className="border-b border-red-100 bg-red-50/70 dark:border-gray-800 dark:bg-gray-950/40">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-red-800 dark:text-gray-300">Time</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-red-800 dark:text-gray-300">Type</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-red-800 dark:text-gray-300">User</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-red-800 dark:text-gray-300">Site</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-red-800 dark:text-gray-300">Distance</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-red-800 dark:text-gray-300">Window</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-red-800 dark:text-gray-300">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-red-800 dark:text-gray-300">Map</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-100 dark:divide-gray-800">
                {(incidents?.data || []).map((row) => {
                  const dist = typeof row.distance_meters === 'number' ? `${row.distance_meters}m` : 'N/A';
                  const radius = typeof row.radius_meters === 'number' ? `${row.radius_meters}m` : 'N/A';
                  const mapUrl = (() => {
                    const lat = row.attempted_latitude;
                    const lng = row.attempted_longitude;
                    if (!lat || !lng) return null;
                    return `https://www.google.com/maps?q=${encodeURIComponent(`${lat},${lng}`)}`;
                  })();

                  return (
                    <tr key={row.id} className="hover:bg-red-50/60 dark:hover:bg-gray-950/40">
                      <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200 whitespace-nowrap">
                        {new Date(row.occurred_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200 whitespace-nowrap">{row.scan_type}</td>
                      <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200 whitespace-nowrap">
                        {row.user?.name || row.user?.id || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200 whitespace-nowrap">
                        {row.site?.name || row.site?.id || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200 whitespace-nowrap">
                        {dist} / {radius}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200 whitespace-nowrap">
                        {row.mismatch_count}/{row.threshold} in {row.window_minutes}m
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {row.escalated ? (
                          <span className="inline-flex items-center rounded-full bg-red-700 px-2.5 py-1 text-xs font-semibold text-white">Escalated</span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-amber-600 px-2.5 py-1 text-xs font-semibold text-white">Mismatch</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {mapUrl ? (
                          <a
                            href={mapUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-medium text-coin-700 hover:text-coin-600 dark:text-coin-300"
                          >
                            View
                          </a>
                        ) : (
                          <span className="text-sm text-gray-500 dark:text-gray-400">N/A</span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {(!incidents?.data || incidents.data.length === 0) && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-600 dark:text-gray-300">
                      No GPS mismatch incidents found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-300">Showing {incidents?.data?.length || 0} records</div>
            <div className="flex flex-wrap gap-2">
              {(incidents?.links || []).map((l, idx) => (
                <Link
                  key={`${l.label}-${idx}`}
                  href={l.url || '#'}
                  preserveScroll
                  preserveState
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium border transition ${
                    l.active
                      ? 'bg-coin-700 text-white border-coin-700'
                      : 'bg-white text-red-800 border-red-200 hover:bg-red-50 dark:bg-gray-950 dark:text-gray-200 dark:border-gray-800 dark:hover:bg-gray-900'
                  } ${!l.url ? 'pointer-events-none opacity-50' : ''}`}
                  dangerouslySetInnerHTML={{ __html: l.label }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
