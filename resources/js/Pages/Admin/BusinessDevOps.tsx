import React, { useEffect, useMemo, useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import BusinessDevLayout from '@/Layouts/BusinessDevLayout';
import { Card } from '@/Components/ui/card';
import IconMapper from '@/Components/IconMapper';

interface Summary {
  upcoming_events?: number;
  month_event_revenue?: number;
  k9_events_month?: number;
  k9_units_month?: number;
  active_clients_with_events?: number;
  active_sites?: number;
  total_clients?: number;
  contracts_active?: number;
  contracts_draft?: number;
  contracts_expired?: number;
  month_event_status?: {
    planned?: number;
    confirmed?: number;
    completed?: number;
    cancelled?: number;
  };
}

interface SiteLite { id: number; name: string; client_name?: string }

export default function BusinessDevOps() {
  const { auth, summary = {} as Summary } = (usePage().props as any);
  const [search, setSearch] = useState('');
  const [sites, setSites] = useState<SiteLite[] | null>(null);
  const [loading, setLoading] = useState(false);

  const monthRevenue = useMemo(() => summary.month_event_revenue ?? 0, [summary]);

  useEffect(() => {
    const ctrl = new AbortController();
    const run = async () => {
      if (!search || search.length < 2) { setSites(null); return; }
      setLoading(true);
      try {
        const url = new URL(route('admin.business-dev.sites.json'));
        url.searchParams.set('search', search);
        const res = await fetch(url.toString(), { headers: { Accept: 'application/json' }, signal: ctrl.signal });
        if (!res.ok) throw new Error('Failed to fetch');
        const json = await res.json();
        setSites(json as SiteLite[]);
      } catch (_) {
      } finally {
        setLoading(false);
      }
    };
    const t = setTimeout(run, 300);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [search]);

  return (
    <BusinessDevLayout title="Business Dev • Ops" user={auth?.user as any}>
      <Head title="Business Dev Ops" />
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-red-900 dark:text-gray-100">Operations & KPIs</h1>
              <p className="text-sm text-red-800/80 dark:text-gray-400 mt-1">Quick glance at pipeline metrics and site lookups.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={route('admin.business-dev')} className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-white text-red-800 border border-red-200 hover:bg-red-50 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:hover:bg-gray-700">
                <IconMapper name="handshake" className="w-4 h-4 mr-2" />
                Overview
              </Link>
              <Link href={route('admin.business-dev.contracts.index')} className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-white text-red-800 border border-red-200 hover:bg-red-50 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:hover:bg-gray-700">
                <IconMapper name="file-text" className="w-4 h-4 mr-2" />
                Contracts
              </Link>
              <Link href={route('admin.business-dev.k9.dashboard')} className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-white text-red-800 border border-red-200 hover:bg-red-50 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:hover:bg-gray-700">
                <IconMapper name="layout-dashboard" className="w-4 h-4 mr-2" />
                K9
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200 dark:from-indigo-900/20 dark:to-indigo-900/10 dark:border-indigo-900/40">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-indigo-900 dark:text-indigo-200">Upcoming Events</h3>
                <IconMapper name="calendar" className="w-5 h-5 text-indigo-500" />
              </div>
              <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">{summary.upcoming_events ?? 0}</p>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 dark:from-emerald-900/20 dark:to-emerald-900/10 dark:border-emerald-900/40">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-emerald-900 dark:text-emerald-200">Event Revenue (This Month)</h3>
                <IconMapper name="wallet" className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">MWK {Number(monthRevenue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 dark:from-blue-900/20 dark:to-blue-900/10 dark:border-blue-900/40">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200">K9 Events (This Month)</h3>
                <IconMapper name="shield" className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{summary.k9_events_month ?? 0}</p>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-fuchsia-50 to-fuchsia-100 border-fuchsia-200 dark:from-fuchsia-900/20 dark:to-fuchsia-900/10 dark:border-fuchsia-900/40">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-fuchsia-900 dark:text-fuchsia-200">K9 Units (This Month)</h3>
                <IconMapper name="shield" className="w-5 h-5 text-fuchsia-500" />
              </div>
              <p className="text-2xl font-bold text-fuchsia-900 dark:text-fuchsia-100">{summary.k9_units_month ?? 0}</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200 dark:from-rose-900/20 dark:to-rose-900/10 dark:border-rose-900/40">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-rose-900 dark:text-rose-200">Active Sites</h3>
                <IconMapper name="map-pin" className="w-5 h-5 text-rose-500" />
              </div>
              <p className="text-2xl font-bold text-rose-900 dark:text-rose-100">{summary.active_sites ?? 0}</p>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 dark:from-amber-900/20 dark:to-amber-900/10 dark:border-amber-900/40">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-amber-900 dark:text-amber-200">Active Contracts</h3>
                <IconMapper name="file-check" className="w-5 h-5 text-amber-500" />
              </div>
              <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">{summary.contracts_active ?? 0}</p>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200 dark:from-slate-900/20 dark:to-slate-900/10 dark:border-slate-900/40">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-900 dark:text-slate-200">Contracts (Draft/Expired)</h3>
                <IconMapper name="file-warning" className="w-5 h-5 text-slate-500" />
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Draft: {summary.contracts_draft ?? 0} • Expired: {summary.contracts_expired ?? 0}</p>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 dark:from-gray-900/20 dark:to-gray-900/10 dark:border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-200">Clients</h3>
                <IconMapper name="users" className="w-5 h-5 text-gray-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{summary.total_clients ?? 0}</p>
            </Card>
          </div>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Quick Site Lookup</h2>
              <input
                className="w-full md:w-72 border rounded-md p-2 bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                placeholder="Search active sites by name or client…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              {loading && <div className="text-sm text-gray-500 dark:text-gray-400">Searching…</div>}
              {sites && sites.length === 0 && <div className="text-sm text-gray-500 dark:text-gray-400">No results.</div>}
              {sites && sites.length > 0 && (
                <ul className="divide-y divide-gray-200 dark:divide-gray-800">
                  {sites.map((s) => (
                    <li key={s.id} className="py-2 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{s.name}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">{s.client_name || '—'}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
        </div>
      </div>
    </BusinessDevLayout>
  );
}
