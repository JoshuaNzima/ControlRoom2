import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import Modal from '@/Components/Modal';

interface ClientOption { id: number; name: string }
interface ClientEvent {
  id: number;
  client_id: number;
  title: string;
  event_date: string;
  start_time?: string | null;
  end_time?: string | null;
  location?: string | null;
  category: string;
  billing_type: string;
  rate: number | string;
  quantity: number;
  expected_amount: number | string;
  status: string;
  k9_units?: number | null;
  notes?: string | null;
}
interface Paginated<T> { data: T[]; links: any[]; meta: any }

interface Props {
  auth?: any;
  events?: Paginated<ClientEvent>;
  clients?: ClientOption[];
}

const statusColor = (status?: string) => {
  switch (status) {
    case 'confirmed':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200';
    case 'planned':
      return 'bg-coin-100 text-coin-800 dark:bg-coin-900/30 dark:text-coin-200';
    case 'completed':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    case 'cancelled':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  }
};

export default function BusinessDevEvents({ auth = {}, events, clients = [] }: Props) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<ClientEvent | null>(null);

  const openEdit = (event: ClientEvent) => { setSelected(event); setEditOpen(true); };
  const handleDelete = (event: ClientEvent) => {
    if (!confirm('Delete this event? This action cannot be undone.')) return;
    router.delete(route('admin.business-dev.events.destroy', event.id));
  };

  return (
    <AuthenticatedLayout header="Events" user={auth?.user as any}>
      <Head title="Events" />
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-red-900 dark:text-gray-100">Client Events</h1>
              <p className="text-sm text-red-800/80 dark:text-gray-400 mt-1">Manage special events and K9 deployments.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setCreateOpen(true)} className="inline-flex w-full sm:w-auto justify-center items-center px-4 py-2 rounded-lg text-sm font-medium bg-red-700 text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-red-50 dark:focus:ring-offset-gray-900">
                New Event
              </button>
              <Link href={route('admin.business-dev')} className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-white text-red-800 border border-red-200 hover:bg-red-50 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:hover:bg-gray-700">
                Dashboard
              </Link>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 shadow overflow-hidden">
            <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-800">
              {events?.data?.length ? (
                events.data.map((ev) => (
                  <div key={ev.id} className="p-4 flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 break-words">{ev.title}</div>
                        <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                          {ev.event_date} · {clients.find((c) => c.id === ev.client_id)?.name || '—'}
                        </div>
                      </div>
                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColor(ev.status)}`}>
                        {ev.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="text-gray-700 dark:text-gray-300">
                        <span className="font-medium text-gray-900 dark:text-gray-100">Category:</span>{' '}
                        <span className="break-words">{String(ev.category).replace(/_/g, ' ')}</span>
                      </div>
                      <div className="text-gray-700 dark:text-gray-300">
                        <span className="font-medium text-gray-900 dark:text-gray-100">Expected:</span>{' '}
                        MWK {Number(ev.expected_amount || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <button
                        type="button"
                        onClick={() => openEdit(ev)}
                        className="text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-gray-100"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(ev)}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-gray-500 dark:text-gray-400 text-sm">No events yet.</div>
              )}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-300">Date</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-300">Client</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-300">Title</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-300">Category</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-600 dark:text-gray-300">Expected</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-300">Status</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-600 dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {events?.data?.length ? (
                    events.data.map((ev) => (
                      <tr key={ev.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                        <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{ev.event_date}</td>
                        <td className="px-3 py-2 text-gray-700 dark:text-gray-300 max-w-[160px] truncate">
                          {clients.find((c) => c.id === ev.client_id)?.name || '—'}
                        </td>
                        <td className="px-3 py-2 text-gray-900 dark:text-gray-100 max-w-xs truncate">{ev.title}</td>
                        <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{String(ev.category).replace(/_/g, ' ')}</td>
                        <td className="px-3 py-2 text-right text-gray-900 dark:text-gray-100">MWK {Number(ev.expected_amount || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColor(ev.status)}`}>{ev.status}</span>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button type="button" onClick={() => openEdit(ev)} className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">Edit</button>
                            <button type="button" onClick={() => handleDelete(ev)} className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-3 py-6 text-center text-gray-500 dark:text-gray-400">No events yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {(events?.meta?.last_page ?? 1) > 1 && (
              <div className="bg-gray-50 dark:bg-gray-950 px-4 py-3 flex flex-wrap justify-center gap-2 border-t border-gray-200 dark:border-gray-800">
                {(events?.links ?? []).map((link: any, idx: number) => (
                  <Link
                    key={idx}
                    href={link.url || '#'}
                    className={`px-3 py-1 rounded text-xs ${link.active ? 'bg-red-700 text-white' : 'bg-white dark:bg-gray-900/60 text-gray-700 dark:text-gray-100 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/60'}`}
                    dangerouslySetInnerHTML={{ __html: link.label }}
                  />
                ))}
              </div>
            )}
          </div>

          <EventCreateModal open={createOpen} onClose={() => setCreateOpen(false)} clients={clients} />
          {selected && (
            <EventEditModal
              open={editOpen}
              onClose={() => { setEditOpen(false); setSelected(null); }}
              event={selected}
              clients={clients}
            />
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

interface EventForm {
  client_id: number | '';
  title: string;
  event_date: string;
  start_time: string;
  end_time: string;
  location: string;
  category: string;
  billing_type: string;
  rate: string;
  quantity: number;
  status: string;
  k9_units: string;
  notes: string;
}

function EventCreateModal({ open, onClose, clients }: { open: boolean; onClose: () => void; clients: ClientOption[] }) {
  const { data, setData, post, processing, errors, reset } = useForm<EventForm>({
    client_id: '' as any,
    title: '',
    event_date: '',
    start_time: '',
    end_time: '',
    location: '',
    category: 'event_security',
    billing_type: 'per_event',
    rate: '',
    quantity: 1,
    status: 'planned',
    k9_units: '',
    notes: '',
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('admin.business-dev.events.store'), {
      onSuccess: () => { reset(); onClose(); },
    });
  };

  const handleClose = () => { if (!processing) onClose(); };

  return (
    <Modal show={open} onClose={handleClose} maxWidth="2xl">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-950">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">New Client Event</h2>
        <button type="button" onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">✕</button>
      </div>
      <div className="px-6 py-4 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        <form className="grid grid-cols-1 sm:grid-cols-2 gap-4" onSubmit={submit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Client</label>
            <select className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:border-red-500 focus:ring-1 focus:ring-red-500" value={data.client_id} onChange={(e) => setData('client_id', e.target.value ? Number(e.target.value) : ('' as any))}>
              <option value="">Select client</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {errors.client_id && <p className="text-sm text-red-600">{errors.client_id}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Event Date</label>
            <input type="date" className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:border-red-500 focus:ring-1 focus:ring-red-500" value={data.event_date} onChange={(e) => setData('event_date', e.target.value)} />
            {errors.event_date && <p className="text-sm text-red-600">{errors.event_date}</p>}
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
            <input className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:border-red-500 focus:ring-1 focus:ring-red-500" value={data.title} onChange={(e) => setData('title', e.target.value)} />
            {errors.title && <p className="text-sm text-red-600">{errors.title}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Time</label>
            <input type="time" className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:border-red-500 focus:ring-1 focus:ring-red-500" value={data.start_time} onChange={(e) => setData('start_time', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Time</label>
            <input type="time" className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:border-red-500 focus:ring-1 focus:ring-red-500" value={data.end_time} onChange={(e) => setData('end_time', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
            <input className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:border-red-500 focus:ring-1 focus:ring-red-500" value={data.location} onChange={(e) => setData('location', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
            <select className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:border-red-500 focus:ring-1 focus:ring-red-500" value={data.category} onChange={(e) => setData('category', e.target.value)}>
              <option value="event_security">Event security</option>
              <option value="k9">K9 deployment</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Billing Type</label>
            <select className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:border-red-500 focus:ring-1 focus:ring-red-500" value={data.billing_type} onChange={(e) => setData('billing_type', e.target.value)}>
              <option value="per_event">Per event</option>
              <option value="per_hour">Per hour</option>
              <option value="per_day">Per day</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rate (MWK)</label>
            <input type="number" min={0} step="0.01" className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:border-red-500 focus:ring-1 focus:ring-red-500" value={data.rate} onChange={(e) => setData('rate', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantity</label>
            <input type="number" min={1} className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:border-red-500 focus:ring-1 focus:ring-red-500" value={data.quantity} onChange={(e) => setData('quantity', Number(e.target.value) || 1)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:border-red-500 focus:ring-1 focus:ring-red-500" value={data.status} onChange={(e) => setData('status', e.target.value)}>
              <option value="planned">Planned</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">K9 Units</label>
            <input type="number" min={0} className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:border-red-500 focus:ring-1 focus:ring-red-500" value={data.k9_units} onChange={(e) => setData('k9_units', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
            <textarea className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:border-red-500 focus:ring-1 focus:ring-red-500" rows={3} value={data.notes} onChange={(e) => setData('notes', e.target.value)} />
          </div>
          <div className="sm:col-span-2 flex flex-col sm:flex-row justify-end gap-2 pt-2">
            <button type="button" onClick={handleClose} className="w-full sm:w-auto px-4 py-2 text-sm rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700" disabled={processing}>Cancel</button>
            <button type="submit" disabled={processing} className="w-full sm:w-auto px-4 py-2 text-sm rounded-md bg-red-700 text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950 disabled:bg-gray-400">{processing ? 'Saving...' : 'Create Event'}</button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function EventEditModal({ open, onClose, event, clients }: { open: boolean; onClose: () => void; event: ClientEvent; clients: ClientOption[] }) {
  const { data, setData, put, processing, errors, reset } = useForm<EventForm>({
    client_id: event.client_id,
    title: event.title,
    event_date: event.event_date,
    start_time: event.start_time || '',
    end_time: event.end_time || '',
    location: event.location || '',
    category: event.category || 'event_security',
    billing_type: event.billing_type || 'per_event',
    rate: String(event.rate ?? ''),
    quantity: event.quantity ?? 1,
    status: event.status || 'planned',
    k9_units: event.k9_units != null ? String(event.k9_units) : '',
    notes: event.notes || '',
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    put(route('admin.business-dev.events.update', event.id), {
      onSuccess: () => { reset(); onClose(); },
    });
  };

  const handleClose = () => { if (!processing) onClose(); };

  return (
    <Modal show={open} onClose={handleClose} maxWidth="2xl">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-950">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit Client Event</h2>
        <button type="button" onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">✕</button>
      </div>
      <div className="px-6 py-4 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        <form className="grid grid-cols-1 sm:grid-cols-2 gap-4" onSubmit={submit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Client</label>
            <select className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:border-red-500 focus:ring-1 focus:ring-red-500" value={data.client_id} onChange={(e) => setData('client_id', e.target.value ? Number(e.target.value) : ('' as any))}>
              <option value="">Select client</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {errors.client_id && <p className="text-sm text-red-600">{errors.client_id}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Event Date</label>
            <input type="date" className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:border-red-500 focus:ring-1 focus:ring-red-500" value={data.event_date} onChange={(e) => setData('event_date', e.target.value)} />
            {errors.event_date && <p className="text-sm text-red-600">{errors.event_date}</p>}
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
            <input className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:border-red-500 focus:ring-1 focus:ring-red-500" value={data.title} onChange={(e) => setData('title', e.target.value)} />
            {errors.title && <p className="text-sm text-red-600">{errors.title}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Time</label>
            <input type="time" className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:border-red-500 focus:ring-1 focus:ring-red-500" value={data.start_time} onChange={(e) => setData('start_time', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Time</label>
            <input type="time" className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:border-red-500 focus:ring-1 focus:ring-red-500" value={data.end_time} onChange={(e) => setData('end_time', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
            <input className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:border-red-500 focus:ring-1 focus:ring-red-500" value={data.location} onChange={(e) => setData('location', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
            <select className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:border-red-500 focus:ring-1 focus:ring-red-500" value={data.category} onChange={(e) => setData('category', e.target.value)}>
              <option value="event_security">Event security</option>
              <option value="k9">K9 deployment</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Billing Type</label>
            <select className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:border-red-500 focus:ring-1 focus:ring-red-500" value={data.billing_type} onChange={(e) => setData('billing_type', e.target.value)}>
              <option value="per_event">Per event</option>
              <option value="per_hour">Per hour</option>
              <option value="per_day">Per day</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rate (MWK)</label>
            <input type="number" min={0} step="0.01" className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:border-red-500 focus:ring-1 focus:ring-red-500" value={data.rate} onChange={(e) => setData('rate', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantity</label>
            <input type="number" min={1} className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:border-red-500 focus:ring-1 focus:ring-red-500" value={data.quantity} onChange={(e) => setData('quantity', Number(e.target.value) || 1)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:border-red-500 focus:ring-1 focus:ring-red-500" value={data.status} onChange={(e) => setData('status', e.target.value)}>
              <option value="planned">Planned</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">K9 Units</label>
            <input type="number" min={0} className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:border-red-500 focus:ring-1 focus:ring-red-500" value={data.k9_units} onChange={(e) => setData('k9_units', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
            <textarea className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:border-red-500 focus:ring-1 focus:ring-red-500" rows={3} value={data.notes} onChange={(e) => setData('notes', e.target.value)} />
          </div>
          <div className="sm:col-span-2 flex flex-col sm:flex-row justify-end gap-2 pt-2">
            <button type="button" onClick={handleClose} className="w-full sm:w-auto px-4 py-2 text-sm rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700" disabled={processing}>Cancel</button>
            <button type="submit" disabled={processing} className="w-full sm:w-auto px-4 py-2 text-sm rounded-md bg-red-700 text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950 disabled:bg-gray-400">{processing ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
