import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import BusinessDevLayout from '@/Layouts/BusinessDevLayout';
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
  active_clients_with_events?: number;
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
      return 'bg-emerald-100 text-emerald-800';
    case 'planned':
      return 'bg-blue-100 text-blue-800';
    case 'completed':
      return 'bg-gray-100 text-gray-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
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
    <BusinessDevLayout title="Business Development" user={auth?.user as any}>
      <Head title="Business Development" />
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-red-900">Business Development</h1>
              <p className="text-sm text-red-800/80 mt-1">
                Liaise with clients, manage K9 and special events, and track per-event revenue.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700"
              >
                <IconMapper name="calendar-plus" className="w-4 h-4 mr-2" />
                New Event
              </button>
              <Link
                href={route('admin.clients.index')}
                className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-white text-red-800 border border-red-200 hover:bg-red-50"
              >
                <IconMapper name="building-2" className="w-4 h-4 mr-2" />
                Clients
              </Link>
              <Link
                href={route('k9.dashboard')}
                className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-white text-red-800 border border-red-200 hover:bg-red-50"
              >
                <IconMapper name="shield" className="w-4 h-4 mr-2" />
                K9 Module
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-indigo-900">Upcoming Events</h3>
                <IconMapper name="calendar" className="w-5 h-5 text-indigo-500" />
              </div>
              <p className="text-2xl font-bold text-indigo-900">
                {summary.upcoming_events ?? 0}
              </p>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-emerald-900">Event Revenue (This Month)</h3>
                <IconMapper name="wallet" className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold text-emerald-900">
                MWK {Number(monthRevenue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-blue-900">K9 Events (This Month)</h3>
                <IconMapper name="shield" className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-blue-900">
                {summary.k9_events_month ?? 0}
              </p>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-900">Clients with Events</h3>
                <IconMapper name="users-2" className="w-5 h-5 text-gray-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {summary.active_clients_with_events ?? 0}
              </p>
            </Card>
          </div>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Upcoming & Recent Events</h2>
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="inline-flex items-center px-3 py-2 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700"
              >
                <IconMapper name="plus" className="w-4 h-4 mr-1" />
                New Event
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">Date</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">Client</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">Title</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">Category</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-600">Expected</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">Status</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {events?.data?.length ? (
                    events.data.map((ev) => (
                      <tr key={ev.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-900">{ev.event_date}</td>
                        <td className="px-3 py-2 text-gray-700 max-w-[160px] truncate">
                          {ev.client?.name || clients.find((c) => c.id === ev.client_id)?.name || '—'}
                        </td>
                        <td className="px-3 py-2 text-gray-900 max-w-xs truncate">{ev.title}</td>
                        <td className="px-3 py-2 text-gray-700">{categoryLabel(ev.category)}</td>
                        <td className="px-3 py-2 text-right text-gray-900">
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
                              className="text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                              disabled={loadingId === ev.id}
                            >
                              {loadingId === ev.id ? 'Opening…' : 'View'}
                            </button>
                            <button
                              type="button"
                              onClick={() => openEdit(ev)}
                              className="text-gray-700 hover:text-gray-900"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => openInvoice(ev)}
                              className="text-emerald-700 hover:text-emerald-900"
                            >
                              Invoice
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(ev)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-3 py-6 text-center text-gray-500">
                        No events yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {(events?.meta?.last_page ?? 1) > 1 && (
              <div className="mt-4 flex justify-center gap-2">
                {(events?.links ?? []).map((link: any, idx: number) => (
                  <Link
                    key={idx}
                    href={link.url || '#'}
                    className={`px-3 py-1 rounded text-xs ${
                      link.active
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
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
    </BusinessDevLayout>
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
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white">
        <h2 className="text-lg font-semibold text-gray-900">New Client Event</h2>
        <button
          type="button"
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600"
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
      <div className="px-6 py-4 bg-white">
        <form className="grid grid-cols-1 sm:grid-cols-2 gap-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
            <select
              className="w-full border rounded-md p-2"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Date</label>
            <input
              type="date"
              className="w-full border rounded-md p-2"
              value={data.event_date}
              onChange={(e) => setData('event_date', e.target.value)}
            />
            {errors.event_date && <p className="text-sm text-red-600">{errors.event_date}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              className="w-full border rounded-md p-2"
              value={data.title}
              onChange={(e) => setData('title', e.target.value)}
              placeholder="e.g. K9 demo at client HQ, VIP event security"
            />
            {errors.title && <p className="text-sm text-red-600">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
            <input
              type="time"
              className="w-full border rounded-md p-2"
              value={data.start_time}
              onChange={(e) => setData('start_time', e.target.value)}
            />
            {errors.start_time && <p className="text-sm text-red-600">{errors.start_time}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
            <input
              type="time"
              className="w-full border rounded-md p-2"
              value={data.end_time}
              onChange={(e) => setData('end_time', e.target.value)}
            />
            {errors.end_time && <p className="text-sm text-red-600">{errors.end_time}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              className="w-full border rounded-md p-2"
              value={data.location}
              onChange={(e) => setData('location', e.target.value)}
            />
            {errors.location && <p className="text-sm text-red-600">{errors.location}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              className="w-full border rounded-md p-2"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Billing Type</label>
            <select
              className="w-full border rounded-md p-2"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Rate (MWK)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              className="w-full border rounded-md p-2"
              value={data.rate}
              onChange={(e) => setData('rate', e.target.value)}
            />
            {errors.rate && <p className="text-sm text-red-600">{errors.rate}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
            <input
              type="number"
              min={1}
              className="w-full border rounded-md p-2"
              value={data.quantity}
              onChange={(e) => setData('quantity', Number(e.target.value) || 1)}
            />
            {errors.quantity && <p className="text-sm text-red-600">{errors.quantity}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              className="w-full border rounded-md p-2"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">K9 Units</label>
            <input
              type="number"
              min={0}
              className="w-full border rounded-md p-2"
              value={data.k9_units}
              onChange={(e) => setData('k9_units', e.target.value)}
            />
            {errors.k9_units && <p className="text-sm text-red-600">{errors.k9_units}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              className="w-full border rounded-md p-2"
              rows={3}
              value={data.notes}
              onChange={(e) => setData('notes', e.target.value)}
            />
            {errors.notes && <p className="text-sm text-red-600">{errors.notes}</p>}
          </div>

          <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300"
              disabled={processing}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={processing}
              className="px-4 py-2 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-400"
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
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white">
        <h2 className="text-lg font-semibold text-gray-900">Edit Client Event</h2>
        <button
          type="button"
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600"
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
      <div className="px-6 py-4 bg-white">
        <form className="grid grid-cols-1 sm:grid-cols-2 gap-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
            <select
              className="w-full border rounded-md p-2"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Date</label>
            <input
              type="date"
              className="w-full border rounded-md p-2"
              value={data.event_date}
              onChange={(e) => setData('event_date', e.target.value)}
            />
            {errors.event_date && <p className="text-sm text-red-600">{errors.event_date}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              className="w-full border rounded-md p-2"
              value={data.title}
              onChange={(e) => setData('title', e.target.value)}
              placeholder="e.g. K9 demo at client HQ, VIP event security"
            />
            {errors.title && <p className="text-sm text-red-600">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
            <input
              type="time"
              className="w-full border rounded-md p-2"
              value={data.start_time}
              onChange={(e) => setData('start_time', e.target.value)}
            />
            {errors.start_time && <p className="text-sm text-red-600">{errors.start_time}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
            <input
              type="time"
              className="w-full border rounded-md p-2"
              value={data.end_time}
              onChange={(e) => setData('end_time', e.target.value)}
            />
            {errors.end_time && <p className="text-sm text-red-600">{errors.end_time}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              className="w-full border rounded-md p-2"
              value={data.location}
              onChange={(e) => setData('location', e.target.value)}
            />
            {errors.location && <p className="text-sm text-red-600">{errors.location}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              className="w-full border rounded-md p-2"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Billing Type</label>
            <select
              className="w-full border rounded-md p-2"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Rate (MWK)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              className="w-full border rounded-md p-2"
              value={data.rate}
              onChange={(e) => setData('rate', e.target.value)}
            />
            {errors.rate && <p className="text-sm text-red-600">{errors.rate}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
            <input
              type="number"
              min={1}
              className="w-full border rounded-md p-2"
              value={data.quantity}
              onChange={(e) => setData('quantity', Number(e.target.value) || 1)}
            />
            {errors.quantity && <p className="text-sm text-red-600">{errors.quantity}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              className="w-full border rounded-md p-2"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">K9 Units</label>
            <input
              type="number"
              min={0}
              className="w-full border rounded-md p-2"
              value={data.k9_units}
              onChange={(e) => setData('k9_units', e.target.value)}
            />
            {errors.k9_units && <p className="text-sm text-red-600">{errors.k9_units}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              className="w-full border rounded-md p-2"
              rows={3}
              value={data.notes}
              onChange={(e) => setData('notes', e.target.value)}
            />
            {errors.notes && <p className="text-sm text-red-600">{errors.notes}</p>}
          </div>

          <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300"
              disabled={processing}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={processing}
              className="px-4 py-2 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-400"
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
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white">
        <h2 className="text-lg font-semibold text-gray-900">Event • {event.title}</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
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
      <div className="px-6 py-4 bg-white space-y-4 text-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="font-medium text-gray-700">Date</div>
            <div className="text-gray-900">{event.event_date}</div>
          </div>
          <div>
            <div className="font-medium text-gray-700">Status</div>
            <span className={`inline-flex mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColor(event.status)}`}>
              {event.status}
            </span>
          </div>
          <div>
            <div className="font-medium text-gray-700">Category</div>
            <div className="text-gray-900">{categoryLabel(event.category)}</div>
          </div>
          <div>
            <div className="font-medium text-gray-700">Billing</div>
            <div className="text-gray-900">
              {event.billing_type} • Rate MWK {Number(event.rate || 0).toLocaleString()} × {event.quantity}
            </div>
          </div>
          <div>
            <div className="font-medium text-gray-700">Expected Amount</div>
            <div className="text-gray-900">
              MWK {Number(event.expected_amount || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>
          <div>
            <div className="font-medium text-gray-700">K9 Units</div>
            <div className="text-gray-900">{event.k9_units ?? 0}</div>
          </div>
        </div>

        {event.location && (
          <div>
            <div className="font-medium text-gray-700 mb-1">Location</div>
            <div className="text-gray-900 bg-gray-50 rounded px-3 py-2 whitespace-pre-wrap">
              {event.location}
            </div>
          </div>
        )}

        {event.notes && (
          <div>
            <div className="font-medium text-gray-700 mb-1">Notes</div>
            <div className="text-gray-900 bg-gray-50 rounded px-3 py-2 whitespace-pre-wrap">
              {event.notes}
            </div>
          </div>
        )}
      </div>
      <div className="px-6 py-3 bg-gray-50 border-t flex justify-end text-sm">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
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
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white">
        <h2 className="text-lg font-semibold text-gray-900">Create Invoice for Event</h2>
        <button
          type="button"
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600"
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
      <div className="px-6 py-4 bg-white">
        <form className="grid grid-cols-1 sm:grid-cols-2 gap-4" onSubmit={handleSubmit}>
          <div className="sm:col-span-2 text-sm text-gray-600 mb-2">
            <div className="font-medium text-gray-800">{event.title}</div>
            <div>
              Subtotal:&nbsp;
              <span className="font-semibold text-gray-900">
                MWK {numericSubtotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Billing Mode</label>
            <select
              className="w-full border rounded-md p-2"
              value={data.billing_mode}
              onChange={(e) => setData('billing_mode', e.target.value)}
            >
              <option value="immediate">Immediate (per event)</option>
              <option value="monthly">Monthly (assign to period)</option>
            </select>
            {errors.billing_mode && <p className="text-sm text-red-600">{errors.billing_mode as string}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
            <input
              type="date"
              className="w-full border rounded-md p-2"
              value={data.invoice_date}
              onChange={(e) => setData('invoice_date', e.target.value)}
            />
            {errors.invoice_date && <p className="text-sm text-red-600">{errors.invoice_date as string}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <input
              type="date"
              className="w-full border rounded-md p-2"
              value={data.due_date}
              onChange={(e) => setData('due_date', e.target.value)}
            />
            {errors.due_date && <p className="text-sm text-red-600">{errors.due_date as string}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tax % (optional)</label>
            <input
              type="number"
              min={0}
              max={100}
              step="0.01"
              className="w-full border rounded-md p-2"
              value={data.tax_percentage}
              onChange={(e) => setData('tax_percentage', e.target.value)}
            />
            {errors.tax_percentage && <p className="text-sm text-red-600">{errors.tax_percentage as string}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tax Amount (MWK)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              className="w-full border rounded-md p-2"
              value={data.tax_amount}
              onChange={(e) => setData('tax_amount', e.target.value)}
            />
            {errors.tax_amount && <p className="text-sm text-red-600">{errors.tax_amount as string}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Discount (MWK)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              className="w-full border rounded-md p-2"
              value={data.discount_amount}
              onChange={(e) => setData('discount_amount', e.target.value)}
            />
            {errors.discount_amount && <p className="text-sm text-red-600">{errors.discount_amount as string}</p>}
          </div>

          {data.billing_mode === 'monthly' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Billing Year</label>
                <input
                  type="number"
                  min={2000}
                  max={2100}
                  className="w-full border rounded-md p-2"
                  value={data.billing_year}
                  onChange={(e) => setData('billing_year', e.target.value)}
                />
                {errors.billing_year && <p className="text-sm text-red-600">{errors.billing_year as string}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Billing Month (1-12)</label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  className="w-full border rounded-md p-2"
                  value={data.billing_month}
                  onChange={(e) => setData('billing_month', e.target.value)}
                />
                {errors.billing_month && <p className="text-sm text-red-600">{errors.billing_month as string}</p>}
              </div>
            </>
          )}

          <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300"
              disabled={processing}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={processing}
              className="px-4 py-2 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-400"
            >
              {processing ? 'Creating…' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
