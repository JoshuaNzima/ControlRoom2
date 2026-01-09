import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import ControlRoomLayout from '@/Layouts/ControlRoomLayout';
import IconMapper from '@/Components/IconMapper';

interface Intake {
  id: number;
  type: 'ticket' | 'down' | 'incident';
  name: string;
  email: string;
  title?: string;
  status: string;
  created_at: string;
  converted_id?: number | null;
  converted_type?: 'ticket' | 'down' | 'incident' | null;
}

interface Paginated<T> {
  data: T[];
  current_page: number;
  last_page: number;
  prev_page_url: string | null;
  next_page_url: string | null;
}

interface Props {
  intakes: Paginated<Intake>;
  filters: { type?: string | null; status?: string | null };
}

export default function Index({ intakes, filters }: Props) {
  const [type, setType] = React.useState<string>(filters.type || '');
  const [status, setStatus] = React.useState<string>(filters.status || '');

  const apply = (e: React.FormEvent) => {
    e.preventDefault();
    router.get(route('control-room.triage.intakes.index'), { type, status }, { preserveState: true, preserveScroll: true });
  };

  return (
    <ControlRoomLayout title="Public Intake Triage">
      <Head title="Triage — Public Intakes" />

      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end gap-3 md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-red-900 dark:text-gray-100">Public Intakes</h1>
            <p className="text-sm text-red-700/80 dark:text-gray-400">Review and convert incoming public submissions</p>
          </div>
          <form onSubmit={apply} className="flex flex-col sm:flex-row gap-3 items-end">
            <div>
              <label className="block text-xs font-medium text-red-900 dark:text-gray-200 mb-1">Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-lg border border-red-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-red-900 dark:text-gray-100 text-sm">
                <option value="">All</option>
                <option value="ticket">Ticket</option>
                <option value="down">Down</option>
                <option value="incident">Incident</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-red-900 dark:text-gray-200 mb-1">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-red-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-red-900 dark:text-gray-100 text-sm">
                <option value="">All</option>
                <option value="open">Open</option>
                <option value="converted">Converted</option>
              </select>
            </div>
            <button type="submit" className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm">
              Apply
            </button>
          </form>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-red-100 dark:border-gray-800 shadow-sm">
          <ul className="divide-y divide-red-100 dark:divide-gray-800">
            {intakes.data.map((it) => (
              <li key={it.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    it.type === 'ticket'
                      ? 'bg-coin-100 text-coin-800 dark:bg-coin-900/20 dark:text-coin-200'
                      : it.type === 'down'
                        ? 'bg-coin-50 text-coin-800 dark:bg-coin-900/10 dark:text-coin-200'
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-200'
                  }`}>
                    <IconMapper name={it.type === 'ticket' ? 'Inbox' : it.type === 'down' ? 'ArrowDownCircle' : 'AlertTriangle'} className="w-3.5 h-3.5 mr-1" />
                    {it.type}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-red-900 dark:text-gray-100 break-words">{it.title || '(No title)'}</div>
                    <div className="text-xs text-red-700/80 dark:text-gray-400">{it.name} • {new Date(it.created_at).toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                  {it.converted_id ? (
                    <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-200">Converted</span>
                  ) : (
                    <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-200">Open</span>
                  )}
                  <Link href={route('control-room.triage.intakes.show', { intake: it.id })} className="text-sm px-3 py-1.5 rounded-md bg-white border border-red-200 hover:bg-red-50 dark:bg-gray-800 dark:border-gray-700">
                    View
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center justify-between gap-3">
          <button disabled={!intakes.prev_page_url} onClick={() => intakes.prev_page_url && router.get(intakes.prev_page_url)} className="px-3 py-1.5 rounded border border-red-200 dark:border-gray-700 text-sm text-red-900 dark:text-gray-100 bg-white dark:bg-gray-900 disabled:opacity-50">Previous</button>
          <span className="text-sm text-red-700/80 dark:text-gray-400">Page {intakes.current_page} of {intakes.last_page}</span>
          <button disabled={!intakes.next_page_url} onClick={() => intakes.next_page_url && router.get(intakes.next_page_url)} className="px-3 py-1.5 rounded border border-red-200 dark:border-gray-700 text-sm text-red-900 dark:text-gray-100 bg-white dark:bg-gray-900 disabled:opacity-50">Next</button>
        </div>
      </div>
    </ControlRoomLayout>
  );
}
