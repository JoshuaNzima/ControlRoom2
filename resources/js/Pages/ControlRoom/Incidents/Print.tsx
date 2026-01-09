import React, { useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import { formatDate } from '@/utils/formatters';

interface IncidentComment {
  id: number;
  comment: string;
  is_internal?: boolean;
  created_at?: string;
  user?: { name?: string };
}

interface Incident {
  id: number;
  title: string;
  type: string;
  severity: string;
  status: string;
  description: string;
  location: string;
  escalation_level: number;
  created_at: string;
  resolved_at?: string;
  reporter?: { name?: string };
  assigned_to?: { name?: string };
  resolved_by?: { name?: string };
  guard_relation?: { name?: string; employee_id?: string };
  client?: { name?: string };
  client_site?: { name?: string };
  comments?: IncidentComment[];
}

function titleize(value: string | null | undefined) {
  const v = (value || '').replace(/_/g, ' ').trim();
  if (!v) return '';
  return v
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default function PrintIncident({ incident }: { incident: Incident }) {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 400);
    return () => clearTimeout(t);
  }, []);

  const comments = Array.isArray(incident.comments) ? incident.comments : [];

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <Head title={`Print Incident #${incident.id}`} />

      <div className="print:hidden sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="font-semibold">Incident #{incident.id}</div>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="px-3 py-1.5 rounded-md bg-coin-700 text-white hover:bg-coin-600">Print</button>
            <Link
              href={route('control-room.incidents.show', incident.id)}
              className="px-3 py-1.5 rounded-md bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
            >
              Back
            </Link>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto p-4 md:p-8 print:p-0">
        <div className="print:bg-white print:text-gray-900 dark:print:bg-white dark:print:text-gray-900">
          <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 mb-6 border-b border-gray-200 dark:border-gray-800 print:border-gray-300">
            <div className="flex items-center gap-3">
              <img src="/images/Coin-logo.png" alt="Logo" className="h-10 w-auto" onError={(e) => ((e.currentTarget.style.display = 'none'))} />
              <div>
                <div className="text-xl font-bold text-coin-700 dark:text-coin-200 print:text-coin-700">Incident Report</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 print:text-gray-600">#{incident.id} • {formatDate(incident.created_at, 'long')}</div>
              </div>
            </div>

            <div className="text-left sm:text-right text-sm">
              <div className="font-semibold">Status: {titleize(incident.status) || '-'}</div>
              <div className="text-gray-600 dark:text-gray-300 print:text-gray-700">Severity: {titleize(incident.severity) || '-'}</div>
              <div className="text-gray-600 dark:text-gray-300 print:text-gray-700">Type: {titleize(incident.type) || '-'}</div>
            </div>
          </header>

          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 print:border-gray-300">
              <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 print:text-gray-600 mb-1">Location</div>
              <div className="font-semibold">{incident.location || '-'}</div>
              {incident.client?.name && (
                <div className="text-sm text-gray-600 dark:text-gray-300 print:text-gray-700 mt-1">Client: {incident.client.name}</div>
              )}
              {incident.client_site?.name && (
                <div className="text-sm text-gray-600 dark:text-gray-300 print:text-gray-700">Site: {incident.client_site.name}</div>
              )}
            </div>

            <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 print:border-gray-300">
              <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 print:text-gray-600 mb-1">People</div>
              <div className="text-sm">
                <div className="flex items-center justify-between gap-3 py-1">
                  <span className="text-gray-600 dark:text-gray-300 print:text-gray-700">Reporter</span>
                  <span className="font-semibold">{incident.reporter?.name || 'Unknown'}</span>
                </div>
                <div className="flex items-center justify-between gap-3 py-1">
                  <span className="text-gray-600 dark:text-gray-300 print:text-gray-700">Assigned To</span>
                  <span className="font-semibold">{incident.assigned_to?.name || 'Unassigned'}</span>
                </div>
                <div className="flex items-center justify-between gap-3 py-1">
                  <span className="text-gray-600 dark:text-gray-300 print:text-gray-700">Guard</span>
                  <span className="font-semibold">
                    {incident.guard_relation?.name
                      ? `${incident.guard_relation.name}${incident.guard_relation.employee_id ? ` (${incident.guard_relation.employee_id})` : ''}`
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 mb-6 print:border-gray-300">
            <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 print:text-gray-600 mb-2">Incident Details</div>
            <div className="space-y-4">
              <div>
                <div className="text-sm font-semibold">Title</div>
                <div className="text-sm text-gray-800 dark:text-gray-200 print:text-gray-900">{incident.title || '-'}</div>
              </div>
              <div>
                <div className="text-sm font-semibold">Description</div>
                <div className="text-sm text-gray-700 dark:text-gray-300 print:text-gray-900 whitespace-pre-wrap">
                  {incident.description || '-'}
                </div>
              </div>
            </div>
          </section>

          {(incident.resolved_at || incident.resolved_by?.name) && (
            <section className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 mb-6 print:border-gray-300">
              <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 print:text-gray-600 mb-2">Resolution</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-600 dark:text-gray-300 print:text-gray-700">Resolved At</div>
                  <div className="font-semibold">{incident.resolved_at ? formatDate(incident.resolved_at, 'long') : '-'}</div>
                </div>
                <div>
                  <div className="text-gray-600 dark:text-gray-300 print:text-gray-700">Resolved By</div>
                  <div className="font-semibold">{incident.resolved_by?.name || '-'}</div>
                </div>
              </div>
            </section>
          )}

          <section className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 print:border-gray-300">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 print:text-gray-600">Comments</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 print:text-gray-600">{comments.length} total</div>
            </div>

            {comments.length === 0 ? (
              <div className="text-sm text-gray-600 dark:text-gray-300 print:text-gray-700">No comments.</div>
            ) : (
              <div className="space-y-3">
                {comments.map((c) => (
                  <div key={c.id} className="rounded-md border border-gray-200 dark:border-gray-800 p-3 print:border-gray-300">
                    <div className="flex items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400 print:text-gray-600">
                      <div>{c.user?.name || 'Unknown'}</div>
                      <div>{c.created_at ? formatDate(c.created_at, 'long') : ''}</div>
                    </div>
                    <div className="mt-2 text-sm text-gray-800 dark:text-gray-200 print:text-gray-900 whitespace-pre-wrap">
                      {c.comment || ''}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <footer className="mt-10 text-center text-xs text-gray-500 dark:text-gray-400 print:text-gray-600">
            Generated by Control Room
          </footer>
        </div>
      </main>
    </div>
  );
}
