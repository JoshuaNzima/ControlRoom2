import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import Modal from '@/Components/Modal';
import IconMapper from '@/Components/IconMapper';

interface Asset {
  id: number;
  tag: string;
  name: string;
}

interface User {
  id: number;
  name: string;
}

interface Handover {
  id: number;
  asset_type: 'equipment' | 'vehicle';
  asset_id: number;
  asset?: Asset | null;
  handed_over_by: number;
  handed_by?: User | null;
  handed_to: number;
  handed_to_user?: User | null;
  condition_out: string;
  serial?: string | null;
  color?: string | null;
  notes_out?: string | null;
  condition_in?: string | null;
  notes_in?: string | null;
  returned_at?: string | null;
  created_at: string;
}

interface Paginated<T> {
  data: T[];
  links: any[];
  meta: any;
}

interface Props {
  auth?: any;
  handovers?: Paginated<Handover>;
  filters?: { status?: string };
}

const fieldClassName =
  'w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:border-red-500 focus:ring-1 focus:ring-red-500';

const statusBadgeClassName = (status: 'active' | 'returned') => {
  if (status === 'active') {
    return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200';
  }
  return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200';
};

const typeBadgeClassName = (type: string) => {
  if (type === 'vehicle') {
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200';
  }
  return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200';
};

export default function AssetHandovers({ auth = {}, handovers, filters }: Props) {
  const [returnTarget, setReturnTarget] = useState<Handover | null>(null);

  return (
    <AuthenticatedLayout header="Handovers" user={auth?.user as any}>
      <Head title="Asset Handovers" />
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-red-900 dark:text-gray-100">Asset Handovers</h1>
              <p className="text-sm text-red-800/80 dark:text-gray-400 mt-1">Track equipment and vehicle handovers.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={route('assets.index')} className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-white dark:bg-gray-800 text-red-800 dark:text-gray-100 border border-red-200 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-gray-700">
                Assets
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href={route('assets.handovers.index')}
              className={`px-3 py-1.5 rounded-full text-xs border ${filters?.status !== 'returned' && filters?.status !== 'all' ? 'bg-red-600 text-white border-red-600' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700'}`}>
              Active
            </Link>
            <Link href={route('assets.handovers.index', { status: 'returned' } as any)}
              className={`px-3 py-1.5 rounded-full text-xs border ${filters?.status === 'returned' ? 'bg-red-600 text-white border-red-600' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700'}`}>
              Returned
            </Link>
            <Link href={route('assets.handovers.index', { status: 'all' } as any)}
              className={`px-3 py-1.5 rounded-full text-xs border ${filters?.status === 'all' ? 'bg-red-600 text-white border-red-600' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700'}`}>
              All
            </Link>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-[900px] w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="px-3 sm:px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Asset</th>
                    <th className="px-3 sm:px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Type</th>
                    <th className="px-3 sm:px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Handed To</th>
                    <th className="px-3 sm:px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Condition Out</th>
                    <th className="px-3 sm:px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Status</th>
                    <th className="px-3 sm:px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Date</th>
                    <th className="px-3 sm:px-4 py-2 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {handovers?.data?.length ? handovers.data.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-2">
                        <div className="text-gray-900 dark:text-gray-100 font-medium">{item.asset?.name || 'Unknown'}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Tag: {item.asset?.tag || 'N/A'}</div>
                      </td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded text-xs capitalize ${typeBadgeClassName(item.asset_type)}`}>
                          {item.asset_type}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{item.handed_to_user?.name || 'Unknown'}</td>
                      <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{item.condition_out || 'N/A'}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded text-xs ${statusBadgeClassName(item.returned_at ? 'returned' : 'active')}`}>
                          {item.returned_at ? 'Returned' : 'Active'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-gray-700 dark:text-gray-300 text-xs">
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="inline-flex gap-2">
                          {!item.returned_at && (
                            <button
                              onClick={() => setReturnTarget(item)}
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium bg-amber-600 text-white hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950"
                            >
                              <IconMapper name="RotateCcw" size={12} />
                              Return
                            </button>
                          )}
                          {item.returned_at && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(item.returned_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">No handovers found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {(handovers?.meta?.last_page ?? 1) > 1 && (
              <div className="bg-gray-50 dark:bg-gray-950 px-4 py-3 flex flex-wrap justify-center gap-2 border-t border-gray-200 dark:border-gray-800">
                {(handovers?.links ?? []).map((link: any, idx: number) => (
                  <Link key={idx} href={link.url || '#'} className={`px-3 py-1 rounded text-xs ${link.active ? 'bg-red-600 text-white' : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`} dangerouslySetInnerHTML={{ __html: link.label }} />
                ))}
              </div>
            )}
          </div>

          {returnTarget && (
            <ReturnModal
              open={!!returnTarget}
              onClose={() => setReturnTarget(null)}
              handover={returnTarget}
            />
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

function ReturnModal({ open, onClose, handover }: { open: boolean; onClose: () => void; handover: Handover }) {
  const { data, setData, post, processing, errors, reset } = useForm<{ condition_in: string; notes_in: string }>({
    condition_in: '',
    notes_in: '',
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('assets.handovers.return', handover.id), {
      preserveScroll: true,
      onSuccess: () => { reset(); onClose(); },
    });
  };

  const handleClose = () => { if (!processing) onClose(); };

  return (
    <Modal show={open} onClose={handleClose} maxWidth="lg">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white dark:bg-gray-900">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Record Return</h2>
        <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">X</button>
      </div>
      <div className="px-6 py-4 bg-white dark:bg-gray-900 space-y-4">
        <div className="text-sm text-gray-700 dark:text-gray-300">
          <div className="font-semibold text-gray-900 dark:text-gray-100">{handover.asset?.name || 'Asset'}</div>
          <div className="text-gray-600 dark:text-gray-400">Tag: {handover.asset?.tag || 'N/A'}</div>
          <div className="text-gray-600 dark:text-gray-400">Issued to: {handover.handed_to_user?.name || 'Officer'}</div>
          <div className="text-gray-600 dark:text-gray-400">Condition out: {handover.condition_out || 'N/A'}</div>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Condition on return</label>
            <input className={fieldClassName} value={data.condition_in} onChange={(e) => setData('condition_in', e.target.value)} required />
            {errors.condition_in && <p className="text-sm text-red-600 mt-1">{errors.condition_in}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
            <textarea className={fieldClassName} rows={3} value={data.notes_in} onChange={(e) => setData('notes_in', e.target.value)} />
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
            <button type="button" onClick={handleClose} className="w-full sm:w-auto px-4 py-2 text-sm rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600" disabled={processing}>Cancel</button>
            <button type="submit" disabled={processing} className="w-full sm:w-auto px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400 dark:disabled:bg-gray-700">Record return</button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
