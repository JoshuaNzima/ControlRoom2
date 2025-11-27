import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import FrontDeskLayout from '@/Layouts/FrontDeskLayout';
import Modal from '@/Components/Modal';

interface Ticket { id: number; ticket_number?: string|null; title: string; category: string; priority: string; status: string; assigned_to?: number|null; description?: string|null }
interface Paginated<T> { data: T[]; links: any[]; meta: any }
interface UserOpt { id: number; name: string }

interface Props {
  auth?: any;
  tickets?: Paginated<Ticket>;
  filters?: { status?: string; priority?: string; search?: string };
  options?: { statuses: string[]; priorities: string[]; categories: string[]; users: UserOpt[] };
}

export default function FrontDeskTickets({ auth = {}, tickets, filters = {}, options }: Props) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<Ticket | null>(null);

  const [status, setStatus] = useState(filters.status || '');
  const [priority, setPriority] = useState(filters.priority || '');
  const [search, setSearch] = useState(filters.search || '');

  const applyFilters = () => router.get(route('admin.front-desk.tickets.index'), { status, priority, search }, { preserveState: true });

  return (
    <FrontDeskLayout title="Tickets" user={auth?.user as any}>
      <Head title="Tickets" />
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-red-900 dark:text-gray-100">Tickets</h1>
              <p className="text-sm text-red-800/80 dark:text-gray-400 mt-1">Manage front-desk tickets and assignments.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setCreateOpen(true)} className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700">New Ticket</button>
              <Link href={route('admin.front-desk')} className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-white dark:bg-gray-800 text-red-800 dark:text-gray-100 border border-red-200 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-gray-700">Front Desk</Link>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title or number" className="px-3 py-2 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" />
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-3 py-2 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
                <option value="">All Status</option>
                {(options?.statuses || []).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className="px-3 py-2 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
                <option value="">All Priority</option>
                {(options?.priorities || []).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <div className="md:col-span-2 flex gap-2">
                <button onClick={applyFilters} className="px-4 py-2 bg-red-600 text-white rounded">Apply</button>
                <button onClick={() => { setStatus(''); setPriority(''); setSearch(''); router.get(route('admin.front-desk.tickets.index')); }} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded">Reset</button>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-2 text-left">#</th>
                    <th className="px-4 py-2 text-left">Title</th>
                    <th className="px-4 py-2 text-left">Category</th>
                    <th className="px-4 py-2 text-left">Priority</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {tickets?.data?.length ? tickets.data.map(t => (
                    <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{t.ticket_number || t.id}</td>
                      <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{t.title}</td>
                      <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{t.category}</td>
                      <td className="px-4 py-2"><span className="px-2 py-1 rounded text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200">{t.priority}</span></td>
                      <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{t.status}</td>
                      <td className="px-4 py-2 text-right">
                        <div className="inline-flex gap-2">
                          <button onClick={() => { setSelected(t); setEditOpen(true); }} className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">Edit</button>
                          <button onClick={() => { if (confirm('Delete ticket?')) router.delete(route('admin.front-desk.tickets.destroy', t.id)); }} className="text-red-600 hover:text-red-800">Delete</button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">No tickets yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {(tickets?.meta?.last_page ?? 1) > 1 && (
              <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 flex justify-center gap-2">
                {(tickets?.links ?? []).map((link: any, idx: number) => (
                  <Link key={idx} href={link.url || '#'} className={`px-3 py-1 rounded text-xs ${link.active ? 'bg-red-600 text-white' : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`} dangerouslySetInnerHTML={{ __html: link.label }} />
                ))}
              </div>
            )}
          </div>

          <TicketModal open={createOpen} onClose={() => setCreateOpen(false)} categories={options?.categories || []} priorities={options?.priorities || []} statuses={options?.statuses || []} users={options?.users || []} />
          {selected && (
            <TicketModal open={editOpen} onClose={() => { setEditOpen(false); setSelected(null); }} categories={options?.categories || []} priorities={options?.priorities || []} statuses={options?.statuses || []} users={options?.users || []} ticket={selected} />
          )}
        </div>
      </div>
    </FrontDeskLayout>
  );
}

function TicketModal({ open, onClose, categories, priorities, statuses, users, ticket }: { open: boolean; onClose: () => void; categories: string[]; priorities: string[]; statuses: string[]; users: UserOpt[]; ticket?: Ticket }) {
  const { data, setData, post, put, processing, errors, reset } = useForm<{ title: string; category: string; priority: string; status: string; assigned_to: number|''; description: string }>({
    title: ticket?.title || '',
    category: ticket?.category || (categories[0] || 'request'),
    priority: ticket?.priority || (priorities[0] || 'low'),
    status: ticket?.status || (statuses[0] || 'open'),
    assigned_to: (ticket?.assigned_to as any) || '',
    description: ticket?.description || '',
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ticket) {
      put(route('admin.front-desk.tickets.update', ticket.id), { onSuccess: () => { reset(); onClose(); } });
    } else {
      post(route('admin.front-desk.tickets.store'), { onSuccess: () => { reset(); onClose(); } });
    }
  };

  const handleClose = () => { if (!processing) onClose(); };

  return (
    <Modal show={open} onClose={handleClose} maxWidth="2xl">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white dark:bg-gray-900">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{ticket ? 'Edit Ticket' : 'New Ticket'}</h2>
        <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">✕</button>
      </div>
      <div className="px-6 py-4 bg-white dark:bg-gray-900">
        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
            <input className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={data.title} onChange={(e) => setData('title', e.target.value)} />
            {errors.title && <p className="text-sm text-red-600">{errors.title}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
            <select className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={data.category} onChange={(e) => setData('category', e.target.value)}>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
            <select className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={data.priority} onChange={(e) => setData('priority', e.target.value)}>
              {priorities.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={data.status} onChange={(e) => setData('status', e.target.value)}>
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assigned to</label>
            <select className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={data.assigned_to as any} onChange={(e) => setData('assigned_to', e.target.value ? Number(e.target.value) : '' as any)}>
              <option value="">Unassigned</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" rows={4} value={data.description} onChange={(e) => setData('description', e.target.value)} />
          </div>
          <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
            <button type="button" onClick={handleClose} className="px-4 py-2 text-sm rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600" disabled={processing}>Cancel</button>
            <button type="submit" disabled={processing} className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400">Save</button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
