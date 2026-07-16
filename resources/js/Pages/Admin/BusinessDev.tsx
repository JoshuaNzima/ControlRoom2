import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card } from '@/Components/ui/card';
import IconMapper from '@/Components/IconMapper';
import Modal from '@/Components/Modal';

interface ClientOption {
  id: number;
  name: string;
}

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
  client?: ClientOption;
}

interface Paginated<T> {
  data: T[];
  links: any[];
  meta: any;
}

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

interface Props {
  auth?: any;
  summary?: Summary;
  events?: Paginated<ClientEvent>;
  clients?: ClientOption[];
}

const statusColor = (status?: string) => {
  switch (status) {
    case 'confirmed':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200';
    case 'planned':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200';
    case 'completed':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    case 'cancelled':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
  }
};

const categoryLabel = (category: string) => {
  if (!category) return 'General';
  return category.replace(/_/g, ' ');
};

export default function BusinessDevPage({
  auth = {} as any,
  summary = {},
  events,
  clients = [],
}: Props) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [selected, setSelected] = useState<ClientEvent | null>(null);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const openView = async (event: ClientEvent) => {
    setLoadingId(event.id);
    try {
      const response = await fetch(route('admin.business-dev.events.json', event.id), {
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
      if (!response.ok) throw new Error('Failed to load event');
      const json = await response.json();
      setSelected(json as ClientEvent);
      setViewOpen(true);
    } catch (e) {
      setSelected(event);
      setViewOpen(true);
    } finally {
      setLoadingId(null);
    }
  };

  const openEdit = (event: ClientEvent) => {
    setSelected(event);
    setEditOpen(true);
  };

  const openInvoice = (event: ClientEvent) => {
    setSelected(event);
    setInvoiceOpen(true);
  };

  const handleDelete = (event: ClientEvent) => {
    if (!confirm('Delete this event? This action cannot be undone.')) return;
    router.delete(route('admin.business-dev.events.destroy', event.id));
  };

  const monthRevenue = summary.month_event_revenue ?? 0;

  return (
    <AuthenticatedLayout header="Business Development" user={auth?.user as any}>
      <Head title="Business Development" />
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">Business Development</h1>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Liaise with clients, manage K9 and special events, and track per-event revenue.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="inline-flex w-full sm:w-auto justify-center items-center px-4 py-2 rounded-lg text-sm font-medium bg-coin-700 text-white hover:bg-coin-600 focus:outline-none focus:ring-2 focus:ring-coin-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950"
              >
                <IconMapper name="calendar-plus" className="w-4 h-4 mr-2" />
                New Event
              </button>
              <Link
                href={route('admin.clients.index')}
                className="inline-flex w-full sm:w-auto justify-center items-center px-4 py-2 rounded-lg text-sm font-medium bg-white dark:bg-gray-900/60 text-gray-700 dark:text-gray-100 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/60"
              >
                <IconMapper name="building-2" className="w-4 h-4 mr-2" />
                Clients
              </Link>
              <Link
                href={route('admin.business-dev.k9.dashboard')}
                className="inline-flex w-full sm:w-auto justify-center items-center px-4 py-2 rounded-lg text-sm font-medium bg-white dark:bg-gray-900/60 text-gray-700 dark:text-gray-100 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/60"
              >
                <IconMapper name="shield" className="w-4 h-4 mr-2" />
                K9 Module
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-gradient-to-br from-coin-50 to-coin-100 border-coin-200 dark:from-coin-900/20 dark:to-coin-900/10 dark:border-coin-900/30">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-coin-900 dark:text-coin-100">Upcoming Events</h3>
                <IconMapper name="calendar" className="w-5 h-5 text-coin-600 dark:text-coin-300" />
              </div>
              <p className="text-2xl font-bold text-coin-900 dark:text-coin-100">
                {summary.upcoming_events ?? 0}
              </p>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 dark:from-emerald-900/20 dark:to-emerald-900/10 dark:border-emerald-900/30">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-emerald-900 dark:text-emerald-100">Event Revenue (This Month)</h3>
                <IconMapper name="wallet" className="w-5 h-5 text-emerald-500 dark:text-emerald-300" />
              </div>
              <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                MWK {Number(monthRevenue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-coin-50 to-coin-100 border-coin-200 dark:from-coin-900/20 dark:to-coin-900/10 dark:border-coin-900/30">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-coin-900 dark:text-coin-100">K9 Events (This Month)</h3>
                <IconMapper name="shield" className="w-5 h-5 text-coin-600 dark:text-coin-300" />
              </div>
              <p className="text-2xl font-bold text-coin-900 dark:text-coin-100">
                {summary.k9_events_month ?? 0}
              </p>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 dark:from-gray-900 dark:to-gray-800 dark:border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Clients with Events</h3>
                <IconMapper name="users-2" className="w-5 h-5 text-gray-500 dark:text-gray-300" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {summary.active_clients_with_events ?? 0}
              </p>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200 dark:from-rose-900/20 dark:to-rose-900/10 dark:border-rose-900/30">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-rose-900 dark:text-rose-100">Active Sites</h3>
                <IconMapper name="map-pin" className="w-5 h-5 text-rose-500 dark:text-rose-300" />
              </div>
              <p className="text-2xl font-bold text-rose-900 dark:text-rose-100">{summary.active_sites ?? 0}</p>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 dark:from-amber-900/20 dark:to-amber-900/10 dark:border-amber-900/30">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-amber-900 dark:text-amber-100">Active Contracts</h3>
                <IconMapper name="file-check" className="w-5 h-5 text-amber-500 dark:text-amber-300" />
              </div>
              <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">{summary.contracts_active ?? 0}</p>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-coin-50 to-coin-100 border-coin-200 dark:from-coin-900/20 dark:to-coin-900/10 dark:border-coin-900/30">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-coin-900 dark:text-coin-100">K9 Units (This Month)</h3>
                <IconMapper name="shield" className="w-5 h-5 text-coin-600 dark:text-coin-300" />
              </div>
              <p className="text-2xl font-bold text-coin-900 dark:text-coin-100">{summary.k9_units_month ?? 0}</p>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200 dark:from-slate-900/20 dark:to-slate-900/10 dark:border-slate-900/30">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">Contracts (Draft/Expired)</h3>
                <IconMapper name="file-warning" className="w-5 h-5 text-slate-500 dark:text-slate-300" />
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Draft: {summary.contracts_draft ?? 0} • Expired: {summary.contracts_expired ?? 0}
              </p>
            </Card>
          </div>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Upcoming & Recent Events</h2>
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="inline-flex w-full sm:w-auto justify-center items-center px-3 py-2 rounded-md bg-coin-700 text-white text-sm hover:bg-coin-600 focus:outline-none focus:ring-2 focus:ring-coin-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950"
              >
                <IconMapper name="plus" className="w-4 h-4 mr-1" />
                New Event
              </button>
            </div>

            <div className="md:hidden space-y-3">
              {events?.data?.length ? (
                events.data.map((ev) => {
                  const clientName = ev.client?.name || clients.find((c) => c.id === ev.client_id)?.name || '—';
                  return (
                    <div key={ev.id} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 break-words">{ev.title}</div>
                          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{ev.event_date}</div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColor(ev.status)}`}>{ev.status}</span>
                      </div>

                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div className="min-w-0">
                          <div className="text-xs text-gray-500 dark:text-gray-400">Client</div>
                          <div className="text-gray-700 dark:text-gray-200 break-words">{clientName}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Category</div>
                          <div className="text-gray-700 dark:text-gray-200">{categoryLabel(ev.category)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Expected</div>
                          <div className="font-semibold text-gray-900 dark:text-gray-100">MWK {Number(ev.expected_amount || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => openView(ev)}
                          className="w-full rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-coin-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950 disabled:opacity-50"
                          disabled={loadingId === ev.id}
                        >
                          {loadingId === ev.id ? 'Opening…' : 'View Details'}
                        </button>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(ev)}
                            className="w-full rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-200 dark:bg-gray-900/60 dark:text-gray-100 dark:hover:bg-gray-800/60 focus:outline-none focus:ring-2 focus:ring-coin-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => openInvoice(ev)}
                            className="w-full rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-coin-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950"
                          >
                            Invoice
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDelete(ev)}
                          className="w-full rounded-lg bg-red-700 px-3 py-2 text-xs font-semibold text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-coin-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  No events yet.
                </div>
              )}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-[900px] w-full text-xs">
                <thead className="bg-gray-50 dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
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
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                  {events?.data?.length ? (
                    events.data.map((ev) => (
                      <tr key={ev.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                        <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{ev.event_date}</td>
                        <td className="px-3 py-2 text-gray-700 dark:text-gray-200 max-w-[160px] truncate">
                          {ev.client?.name || clients.find((c) => c.id === ev.client_id)?.name || '—'}
                        </td>
                        <td className="px-3 py-2 text-gray-900 dark:text-gray-100 max-w-xs truncate">{ev.title}</td>
                        <td className="px-3 py-2 text-gray-700 dark:text-gray-200">{categoryLabel(ev.category)}</td>
                        <td className="px-3 py-2 text-right text-gray-900 dark:text-gray-100">
                          MWK {Number(ev.expected_amount || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColor(ev.status)}`}>
                            {ev.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openView(ev)}
                              className="text-coin-700 dark:text-coin-300 hover:text-coin-800 dark:hover:text-coin-200 disabled:opacity-50"
                              disabled={loadingId === ev.id}
                            >
                              {loadingId === ev.id ? 'Opening…' : 'View'}
                            </button>
                            <button
                              type="button"
                              onClick={() => openEdit(ev)}
                              className="text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-gray-100"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => openInvoice(ev)}
                              className="text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-200"
                            >
                              Invoice
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(ev)}
                              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-3 py-6 text-center text-gray-500 dark:text-gray-400">
                        No events yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {(events?.meta?.last_page ?? 1) > 1 && (
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {(events?.links ?? []).map((link: any, idx: number) => (
                  <Link
                    key={idx}
                    href={link.url || '#'}
                    className={`px-3 py-1 rounded text-xs ${
                      link.active
                        ? 'bg-coin-700 text-white'
                        : 'bg-white dark:bg-gray-900/60 text-gray-700 dark:text-gray-100 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/60'
                    }`}
                    dangerouslySetInnerHTML={{ __html: link.label }}
                  />
                ))}
              </div>
            )}
          </Card>

          <EventCreateModal
            open={createOpen}
            onClose={() => setCreateOpen(false)}
            clients={clients}
          />

          {selected && (
            <EventEditModal
              open={editOpen}
              onClose={() => {
                setEditOpen(false);
                setSelected(null);
              }}
              event={selected}
              clients={clients}
            />
          )}

          {selected && (
            <EventViewModal
              open={viewOpen}
              onClose={() => {
                setViewOpen(false);
                setSelected(null);
              }}
              event={selected}
            />
          )}

          {selected && (
            <EventInvoiceModal
              open={invoiceOpen}
              onClose={() => {
                setInvoiceOpen(false);
                setSelected(null);
              }}
              event={selected}
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

interface EventModalBaseProps {
  open: boolean;
  onClose: () => void;
  clients: ClientOption[];
}

const businessDevModalFieldClassName =
  'w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:border-coin-500 focus:ring-1 focus:ring-coin-500';

function EventCreateModal({ open, onClose, clients }: EventModalBaseProps) {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('admin.business-dev.events.store'), {
      onSuccess: () => {
        reset();
        onClose();
      },
    });
  };

  const handleClose = () => {
    if (!processing) {
      onClose();
    }
  };

  return (
    <Modal show={open} onClose={handleClose} maxWidth="2xl">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-950">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">New Client Event</h2>
        <button
          type="button"
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <span className="sr-only">Close</span>
          <svg
            className="h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
      <div className="px-6 py-4 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        <form className="grid grid-cols-1 sm:grid-cols-2 gap-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Client</label>
            <select
              className={businessDevModalFieldClassName}
              value={data.client_id}
              onChange={(e) => setData('client_id', e.target.value ? Number(e.target.value) : ('' as any))}
            >
              <option value="">Select client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.client_id && <p className="text-sm text-red-600">{errors.client_id}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Event Date</label>
            <input
              type="date"
              className={businessDevModalFieldClassName}
              value={data.event_date}
              onChange={(e) => setData('event_date', e.target.value)}
            />
            {errors.event_date && <p className="text-sm text-red-600">{errors.event_date}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
            <input
              className={businessDevModalFieldClassName}
              value={data.title}
              onChange={(e) => setData('title', e.target.value)}
              placeholder="e.g. K9 demo at client HQ, VIP event security"
            />
            {errors.title && <p className="text-sm text-red-600">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Time</label>
            <input
              type="time"
              className={businessDevModalFieldClassName}
              value={data.start_time}
              onChange={(e) => setData('start_time', e.target.value)}
            />
            {errors.start_time && <p className="text-sm text-red-600">{errors.start_time}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Time</label>
            <input
              type="time"
              className={businessDevModalFieldClassName}
              value={data.end_time}
              onChange={(e) => setData('end_time', e.target.value)}
            />
            {errors.end_time && <p className="text-sm text-red-600">{errors.end_time}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
            <input
              className={businessDevModalFieldClassName}
              value={data.location}
              onChange={(e) => setData('location', e.target.value)}
            />
            {errors.location && <p className="text-sm text-red-600">{errors.location}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
            <select
              className={businessDevModalFieldClassName}
              value={data.category}
              onChange={(e) => setData('category', e.target.value)}
            >
              <option value="event_security">Event security</option>
              <option value="k9">K9 deployment</option>
              <option value="other">Other</option>
            </select>
            {errors.category && <p className="text-sm text-red-600">{errors.category}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Billing Type</label>
            <select
              className={businessDevModalFieldClassName}
              value={data.billing_type}
              onChange={(e) => setData('billing_type', e.target.value)}
            >
              <option value="per_event">Per event</option>
              <option value="per_hour">Per hour</option>
              <option value="per_day">Per day</option>
            </select>
            {errors.billing_type && <p className="text-sm text-red-600">{errors.billing_type}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rate (MWK)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              className={businessDevModalFieldClassName}
              value={data.rate}
              onChange={(e) => setData('rate', e.target.value)}
            />
            {errors.rate && <p className="text-sm text-red-600">{errors.rate}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantity</label>
            <input
              type="number"
              min={1}
              className={businessDevModalFieldClassName}
              value={data.quantity}
              onChange={(e) => setData('quantity', Number(e.target.value) || 1)}
            />
            {errors.quantity && <p className="text-sm text-red-600">{errors.quantity}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select
              className={businessDevModalFieldClassName}
              value={data.status}
              onChange={(e) => setData('status', e.target.value)}
            >
              <option value="planned">Planned</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            {errors.status && <p className="text-sm text-red-600">{errors.status}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">K9 Units</label>
            <input
              type="number"
              min={0}
              className={businessDevModalFieldClassName}
              value={data.k9_units}
              onChange={(e) => setData('k9_units', e.target.value)}
            />
            {errors.k9_units && <p className="text-sm text-red-600">{errors.k9_units}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
            <textarea
              className={businessDevModalFieldClassName}
              rows={3}
              value={data.notes}
              onChange={(e) => setData('notes', e.target.value)}
            />
            {errors.notes && <p className="text-sm text-red-600">{errors.notes}</p>}
          </div>

          <div className="sm:col-span-2 flex flex-col sm:flex-row justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="w-full sm:w-auto px-4 py-2 text-sm rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
              disabled={processing}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={processing}
              className="w-full sm:w-auto px-4 py-2 text-sm rounded-md bg-coin-700 text-white hover:bg-coin-600 disabled:bg-gray-400 dark:disabled:bg-gray-700"
            >
              {processing ? 'Saving...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

interface EventEditModalProps extends EventModalBaseProps {
  event: ClientEvent;
}

function EventEditModal({ open, onClose, event, clients }: EventEditModalProps) {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    put(route('admin.business-dev.events.update', event.id), {
      onSuccess: () => {
        reset();
        onClose();
      },
    });
  };

  const handleClose = () => {
    if (!processing) {
      onClose();
    }
  };

  return (
    <Modal show={open} onClose={handleClose} maxWidth="2xl">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-950">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit Client Event</h2>
        <button
          type="button"
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <span className="sr-only">Close</span>
          <svg
            className="h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
      <div className="px-6 py-4 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        <form className="grid grid-cols-1 sm:grid-cols-2 gap-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Client</label>
            <select
              className={businessDevModalFieldClassName}
              value={data.client_id}
              onChange={(e) => setData('client_id', e.target.value ? Number(e.target.value) : ('' as any))}
            >
              <option value="">Select client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.client_id && <p className="text-sm text-red-600">{errors.client_id}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Event Date</label>
            <input
              type="date"
              className={businessDevModalFieldClassName}
              value={data.event_date}
              onChange={(e) => setData('event_date', e.target.value)}
            />
            {errors.event_date && <p className="text-sm text-red-600">{errors.event_date}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
            <input
              className={businessDevModalFieldClassName}
              value={data.title}
              onChange={(e) => setData('title', e.target.value)}
              placeholder="e.g. K9 demo at client HQ, VIP event security"
            />
            {errors.title && <p className="text-sm text-red-600">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Time</label>
            <input
              type="time"
              className={businessDevModalFieldClassName}
              value={data.start_time}
              onChange={(e) => setData('start_time', e.target.value)}
            />
            {errors.start_time && <p className="text-sm text-red-600">{errors.start_time}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Time</label>
            <input
              type="time"
              className={businessDevModalFieldClassName}
              value={data.end_time}
              onChange={(e) => setData('end_time', e.target.value)}
            />
            {errors.end_time && <p className="text-sm text-red-600">{errors.end_time}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
            <input
              className={businessDevModalFieldClassName}
              value={data.location}
              onChange={(e) => setData('location', e.target.value)}
            />
            {errors.location && <p className="text-sm text-red-600">{errors.location}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
            <select
              className={businessDevModalFieldClassName}
              value={data.category}
              onChange={(e) => setData('category', e.target.value)}
            >
              <option value="event_security">Event security</option>
              <option value="k9">K9 deployment</option>
              <option value="other">Other</option>
            </select>
            {errors.category && <p className="text-sm text-red-600">{errors.category}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Billing Type</label>
            <select
              className={businessDevModalFieldClassName}
              value={data.billing_type}
              onChange={(e) => setData('billing_type', e.target.value)}
            >
              <option value="per_event">Per event</option>
              <option value="per_hour">Per hour</option>
              <option value="per_day">Per day</option>
            </select>
            {errors.billing_type && <p className="text-sm text-red-600">{errors.billing_type}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rate (MWK)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              className={businessDevModalFieldClassName}
              value={data.rate}
              onChange={(e) => setData('rate', e.target.value)}
            />
            {errors.rate && <p className="text-sm text-red-600">{errors.rate}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantity</label>
            <input
              type="number"
              min={1}
              className={businessDevModalFieldClassName}
              value={data.quantity}
              onChange={(e) => setData('quantity', Number(e.target.value) || 1)}
            />
            {errors.quantity && <p className="text-sm text-red-600">{errors.quantity}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select
              className={businessDevModalFieldClassName}
              value={data.status}
              onChange={(e) => setData('status', e.target.value)}
            >
              <option value="planned">Planned</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            {errors.status && <p className="text-sm text-red-600">{errors.status}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">K9 Units</label>
            <input
              type="number"
              min={0}
              className={businessDevModalFieldClassName}
              value={data.k9_units}
              onChange={(e) => setData('k9_units', e.target.value)}
            />
            {errors.k9_units && <p className="text-sm text-red-600">{errors.k9_units}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
            <textarea
              className={businessDevModalFieldClassName}
              rows={3}
              value={data.notes}
              onChange={(e) => setData('notes', e.target.value)}
            />
            {errors.notes && <p className="text-sm text-red-600">{errors.notes}</p>}
          </div>

          <div className="sm:col-span-2 flex flex-col sm:flex-row justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="w-full sm:w-auto px-4 py-2 text-sm rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
              disabled={processing}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={processing}
              className="w-full sm:w-auto px-4 py-2 text-sm rounded-md bg-coin-700 text-white hover:bg-coin-600 disabled:bg-gray-400 dark:disabled:bg-gray-700"
            >
              {processing ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

interface EventViewModalProps {
  open: boolean;
  onClose: () => void;
  event: ClientEvent;
}

function EventViewModal({ open, onClose, event }: EventViewModalProps) {
  return (
    <Modal show={open} onClose={onClose} maxWidth="xl">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-950">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Event • {event.title}</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <span className="sr-only">Close</span>
          <svg
            className="h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
      <div className="px-6 py-4 bg-white dark:bg-gray-950 space-y-4 text-sm text-gray-900 dark:text-gray-100">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="font-medium text-gray-700 dark:text-gray-300">Date</div>
            <div className="text-gray-900 dark:text-gray-100">{event.event_date}</div>
          </div>
          <div>
            <div className="font-medium text-gray-700 dark:text-gray-300">Status</div>
            <span className={`inline-flex mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColor(event.status)}`}>
              {event.status}
            </span>
          </div>
          <div>
            <div className="font-medium text-gray-700 dark:text-gray-300">Category</div>
            <div className="text-gray-900 dark:text-gray-100">{categoryLabel(event.category)}</div>
          </div>
          <div>
            <div className="font-medium text-gray-700 dark:text-gray-300">Billing</div>
            <div className="text-gray-900 dark:text-gray-100">
              {event.billing_type} • Rate MWK {Number(event.rate || 0).toLocaleString()} × {event.quantity}
            </div>
          </div>
          <div>
            <div className="font-medium text-gray-700 dark:text-gray-300">Expected Amount</div>
            <div className="text-gray-900 dark:text-gray-100">
              MWK {Number(event.expected_amount || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>
          <div>
            <div className="font-medium text-gray-700 dark:text-gray-300">K9 Units</div>
            <div className="text-gray-900 dark:text-gray-100">{event.k9_units ?? 0}</div>
          </div>
        </div>

        {event.location && (
          <div>
            <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">Location</div>
            <div className="text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-900 rounded px-3 py-2 whitespace-pre-wrap">
              {event.location}
            </div>
          </div>
        )}

        {event.notes && (
          <div>
            <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</div>
            <div className="text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-900 rounded px-3 py-2 whitespace-pre-wrap">
              {event.notes}
            </div>
          </div>
        )}
      </div>
      <div className="px-6 py-3 bg-gray-50 dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 flex justify-end text-sm">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-md bg-coin-700 text-white hover:bg-coin-600 focus:outline-none focus:ring-2 focus:ring-coin-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}

interface EventInvoiceModalProps {
  open: boolean;
  onClose: () => void;
  event: ClientEvent;
}

function EventInvoiceModal({ open, onClose, event }: EventInvoiceModalProps) {
  const today = new Date().toISOString().slice(0, 10);
  const defaultDate = event.event_date || today;
  const subtotal = Number(event.expected_amount || Number(event.rate || 0) * (event.quantity || 1));

  const { data, setData, post, processing, errors, reset } = useForm({
    billing_mode: 'immediate',
    invoice_date: defaultDate,
    due_date: defaultDate,
    tax_percentage: '',
    tax_amount: '',
    discount_amount: '',
    billing_year: '',
    billing_month: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('admin.business-dev.events.invoice', event.id), {
      onSuccess: () => {
        reset();
        onClose();
      },
    });
  };

  const handleClose = () => {
    if (!processing) {
      onClose();
    }
  };

  const numericSubtotal = isNaN(subtotal) ? 0 : subtotal;

  return (
    <Modal show={open} onClose={handleClose} maxWidth="2xl">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-950">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Create Invoice for Event</h2>
        <button
          type="button"
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <span className="sr-only">Close</span>
          <svg
            className="h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
      <div className="px-6 py-4 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        <form className="grid grid-cols-1 sm:grid-cols-2 gap-4" onSubmit={handleSubmit}>
          <div className="sm:col-span-2 text-sm text-gray-600 dark:text-gray-300 mb-2">
            <div className="font-medium text-gray-800 dark:text-gray-100">{event.title}</div>
            <div>
              Subtotal:&nbsp;
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                MWK {numericSubtotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Billing Mode</label>
            <select
              className={businessDevModalFieldClassName}
              value={data.billing_mode}
              onChange={(e) => setData('billing_mode', e.target.value)}
            >
              <option value="immediate">Immediate (per event)</option>
              <option value="monthly">Monthly (assign to period)</option>
            </select>
            {errors.billing_mode && <p className="text-sm text-red-600">{errors.billing_mode as string}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Invoice Date</label>
            <input
              type="date"
              className={businessDevModalFieldClassName}
              value={data.invoice_date}
              onChange={(e) => setData('invoice_date', e.target.value)}
            />
            {errors.invoice_date && <p className="text-sm text-red-600">{errors.invoice_date as string}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
            <input
              type="date"
              className={businessDevModalFieldClassName}
              value={data.due_date}
              onChange={(e) => setData('due_date', e.target.value)}
            />
            {errors.due_date && <p className="text-sm text-red-600">{errors.due_date as string}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tax % (optional)</label>
            <input
              type="number"
              min={0}
              max={100}
              step="0.01"
              className={businessDevModalFieldClassName}
              value={data.tax_percentage}
              onChange={(e) => setData('tax_percentage', e.target.value)}
            />
            {errors.tax_percentage && <p className="text-sm text-red-600">{errors.tax_percentage as string}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tax Amount (MWK)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              className={businessDevModalFieldClassName}
              value={data.tax_amount}
              onChange={(e) => setData('tax_amount', e.target.value)}
            />
            {errors.tax_amount && <p className="text-sm text-red-600">{errors.tax_amount as string}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Discount (MWK)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              className={businessDevModalFieldClassName}
              value={data.discount_amount}
              onChange={(e) => setData('discount_amount', e.target.value)}
            />
            {errors.discount_amount && <p className="text-sm text-red-600">{errors.discount_amount as string}</p>}
          </div>

          {data.billing_mode === 'monthly' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Billing Year</label>
                <input
                  type="number"
                  min={2000}
                  max={2100}
                  className={businessDevModalFieldClassName}
                  value={data.billing_year}
                  onChange={(e) => setData('billing_year', e.target.value)}
                />
                {errors.billing_year && <p className="text-sm text-red-600">{errors.billing_year as string}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Billing Month (1-12)</label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  className={businessDevModalFieldClassName}
                  value={data.billing_month}
                  onChange={(e) => setData('billing_month', e.target.value)}
                />
                {errors.billing_month && <p className="text-sm text-red-600">{errors.billing_month as string}</p>}
              </div>
            </>
          )}

          <div className="sm:col-span-2 flex flex-col sm:flex-row justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="w-full sm:w-auto px-4 py-2 text-sm rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
              disabled={processing}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={processing}
              className="w-full sm:w-auto px-4 py-2 text-sm rounded-md bg-coin-700 text-white hover:bg-coin-600 disabled:bg-gray-400 dark:disabled:bg-gray-700"
            >
              {processing ? 'Creating…' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
