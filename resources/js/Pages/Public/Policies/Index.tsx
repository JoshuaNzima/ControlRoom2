import React from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';
import IconMapper from '@/Components/IconMapper';

export default function PublicPoliciesIndex() {
  const { categories = [], policies, filters = {} } = usePage().props as any;
  const [flt, setFlt] = React.useState<any>({ q: filters.q || '', category_id: filters.category_id || '', perPage: filters.perPage || 12 });
  React.useEffect(() => { setFlt({ q: filters.q || '', category_id: filters.category_id || '', perPage: filters.perPage || 12 }); }, [filters]);
  const apply = () => router.get(route('public.policies.index'), { ...flt }, { preserveState: true, replace: true, preserveScroll: true });
  const reset = () => { const base = { q: '', category_id: '', perPage: 12 }; setFlt(base); router.get(route('public.policies.index'), base, { preserveState: true, replace: true, preserveScroll: true }); };

  return (
    <PublicLayout title="Policies">
      <Head title="Policies" />
      <section className="py-12 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Company Policies</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Browse publicly available policies.</p>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="col-span-2 sm:col-span-3">
                <input placeholder="Search policies..." value={flt.q} onChange={(e) => setFlt((s: any) => ({ ...s, q: e.target.value }))} onKeyDown={(e) => { if (e.key === 'Enter') apply(); }} className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" />
              </div>
              <select value={flt.category_id} onChange={(e) => setFlt((s: any) => ({ ...s, category_id: e.target.value }))} className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
                <option value="">All categories</option>
                {(categories || []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select value={flt.perPage} onChange={(e) => setFlt((s: any) => ({ ...s, perPage: Number(e.target.value) }))} className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
                {[6,12,18,24].map(n => <option key={n} value={n}>{n}/page</option>)}
              </select>
              <div className="flex items-center gap-2">
                <button onClick={apply} className="px-3 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white w-full">Apply</button>
                <button onClick={reset} className="px-3 py-2 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 w-full">Reset</button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(!policies || (policies.data || []).length === 0) && (
              <div className="text-sm text-gray-600 dark:text-gray-400 py-8">No policies available.</div>
            )}
            {(policies?.data || []).map((p: any) => (
              <Link key={p.id} href={route('public.policies.show', p.slug)} className="group rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4 hover:shadow">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-indigo-500">{p.title}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">{p.category?.name || 'Uncategorized'} · {p.version ? `v${p.version} · ` : ''}{p.effective_date || '-'}</div>
                    {p.summary && <div className="text-xs text-gray-700 dark:text-gray-300 mt-2 line-clamp-2">{p.summary}</div>}
                  </div>
                  <IconMapper name="ArrowRight" className="w-4 h-4 text-gray-400 group-hover:text-indigo-500" />
                </div>
              </Link>
            ))}
          </div>

          {policies && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-xs text-gray-600 dark:text-gray-400">Page {policies.current_page} of {policies.last_page}</div>
              <div className="flex items-center gap-2">
                <button disabled={!policies.prev_page_url} onClick={() => router.visit(policies.prev_page_url, { preserveState: true, replace: true, preserveScroll: true })} className="px-3 py-1.5 text-sm rounded bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">Prev</button>
                <button disabled={!policies.next_page_url} onClick={() => router.visit(policies.next_page_url, { preserveState: true, replace: true, preserveScroll: true })} className="px-3 py-1.5 text-sm rounded bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">Next</button>
              </div>
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
