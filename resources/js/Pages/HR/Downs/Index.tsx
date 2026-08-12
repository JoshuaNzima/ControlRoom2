import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Head, router, usePage } from '@inertiajs/react';
import { Card } from '@/Components/ui/card';
import { StatCard } from '@/Components/StatCard';
import IconMapper from '@/Components/IconMapper';
import EmptyState from '@/Components/ui/empty-state';

type Down = {
  id: number;
  title: string;
  type: 'guard_absent' | 'site_unmanned' | 'other';
  status: 'open' | 'escalated' | 'resolved' | 'absconding';
  description?: string;
  escalation_level: number;
  reporter?: { id: number; name: string };
  client?: { id: number; name: string };
  client_site?: { id: number; name: string };
  guard_relation?: { id: number; name: string; employee_id?: string; status?: string };
};

type PageProps = {
  auth: { user?: { name?: string } };
  downs: {
    data: Down[];
    links?: Array<{ url: string | null; label: string; active: boolean }>;
    meta?: { current_page: number; last_page: number; total?: number };
  };
};

export default function HRDownsIndex() {
  const { auth, downs } = usePage().props as any;

  function escalate(id: number) {
    router.post(route('hr.downs.escalate', id));
  }

  function resolve(id: number) {
    router.post(route('hr.downs.resolve', id));
  }

  function abscond(id: number) {
    router.post(route('hr.downs.abscond', id));
  }

  return (
    <AuthenticatedLayout header="Downs" user={auth?.user as any}>
      <Head title="Downs" />

      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-700 via-red-600 to-rose-600 text-white shadow-2xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20" />
          <div className="relative p-6 sm:p-8">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                <IconMapper name="AlertTriangle" size={32} />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Downs</h1>
                <p className="text-red-100 mt-1">HR visibility into operational coverage downs</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={<IconMapper name="AlertCircle" size={24} />} title="Open" value={downs.data.filter((d: Down) => d.status === 'open').length} subtitle="Awaiting resolution" color="red" />
          <StatCard icon={<IconMapper name="TrendingUp" size={24} />} title="Escalated" value={downs.data.filter((d: Down) => d.status === 'escalated').length} subtitle="Needs attention" color="amber" />
          <StatCard icon={<IconMapper name="CheckCircle" size={24} />} title="Resolved" value={downs.data.filter((d: Down) => d.status === 'resolved').length} subtitle="This session" color="green" />
          <StatCard icon={<IconMapper name="ShieldAlert" size={24} />} title="Absconding" value={downs.data.filter((d: Down) => d.status === 'absconding').length} subtitle="Guard issues" color="purple" />
        </div>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Downs List</h2>

          <div className="divide-y dark:divide-gray-700">
            {downs.data.map((d: any) => (
              <div key={d.id} className="py-3 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {d.title}{' '}
                    <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-gray-700 dark:text-gray-100">{d.type.replace('_', ' ')}</span>
                  </div>
                  <div className="mt-1 text-sm text-gray-600 dark:text-gray-300 flex flex-wrap items-center gap-2">
                    <span>Status: {d.status}{d.escalation_level ? ` • Escalation ${d.escalation_level}` : ''}</span>
                    {d.client?.name && (
                      <>
                        <span>•</span>
                        <span>Client: {d.client.name}</span>
                      </>
                    )}
                    {d.guard_relation?.employee_id && (
                      <>
                        <span>•</span>
                        <span>Guard: {d.guard_relation.employee_id}</span>
                      </>
                    )}
                  </div>
                  {d.description && <div className="mt-1 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{d.description}</div>}
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  {d.status !== 'resolved' && <button onClick={() => escalate(d.id)} className="px-3 py-1 rounded-md bg-yellow-500 text-white hover:bg-yellow-600">Escalate</button>}
                  {d.status !== 'resolved' && <button onClick={() => resolve(d.id)} className="px-3 py-1 rounded-md bg-green-600 text-white hover:bg-green-700">Resolve</button>}
                  {d.status !== 'resolved' && d.status !== 'absconding' && <button onClick={() => abscond(d.id)} className="px-3 py-1 rounded-md bg-red-600 text-white hover:bg-red-700">Absconding</button>}
                </div>
              </div>
            ))}

            {downs.data.length === 0 && (
              <EmptyState title="No downs" description="No downs are currently listed." size="sm" contentClassName="py-6" />
            )}
          </div>

          {(downs as any)?.links && (downs as any).meta?.last_page > 1 && (
            <div className="mt-4 flex flex-wrap gap-2 items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">Page {downs?.meta?.current_page ?? ''} of {downs?.meta?.last_page ?? ''}</div>
              <div className="flex flex-wrap gap-2">
                {(downs as any).links
                  ?.filter((l: any) => l.url)
                  .map((l: any, idx: number) => (
                    <button
                      key={idx}
                      className={`px-3 py-1 rounded border dark:border-gray-700 ${l.active ? 'bg-coin-600 text-white' : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200'}`}
                      onClick={() => router.get(l.url, {}, { preserveScroll: true, preserveState: true })}
                      dangerouslySetInnerHTML={{ __html: l.label }}
                    />
                  ))}
              </div>
            </div>
          )}
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
