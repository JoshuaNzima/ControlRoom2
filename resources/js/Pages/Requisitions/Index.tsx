import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { formatCurrencyMWK } from '@/Components/format';
import RequisitionsLayout from '@/Layouts/RequisitionsLayout';
import type { PageProps } from '@/types';
import QuickRequisitionButton from '@/Components/Requisitions/QuickRequisitionButton';
import RequisitionViewModal from '@/Components/Requisitions/RequisitionViewModal';

interface RequisitionUser {
  id: number;
  name: string;
}

export interface Requisition {
  id: number;
  title: string;
  description?: string | null;
  category?: 'general' | 'fuel' | 'vehicle_hire' | string;
  status: 'pending_admin' | 'needs_revision' | 'pending_disbursement' | 'disbursed';
  needed_by?: string | null;
  amount?: number | string | null;
  created_at: string;
  requested_by: number;
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
}

interface PaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

type RequisitionsIndexProps = PageProps<{
  requisitions: {
    data: Requisition[];
    meta?: PaginationMeta;
    links?: PaginationLink[];
  };
}>;

const statusColors: Record<string, string> = {
  pending_admin: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40',
  needs_revision: 'bg-red-500/10 text-red-300 border border-red-500/40',
  pending_disbursement: 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/40',
  disbursed: 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40',
};

export default function RequisitionsIndex({ requisitions, auth }: RequisitionsIndexProps) {
  const roles = (auth.user.roles ?? []) as string[];
  const isAdmin = roles.includes('admin') || roles.includes('super_admin');
  const isAssetManager = roles.includes('asset_manager') || roles.includes('assets_manager');
  const [open, setOpen] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState<number | null>(null);

  return (
    <RequisitionsLayout title="Requisitions">
      <Head title="Requisitions" />

      <div className="py-4 sm:py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-100">Requisitions</h1>
              <p className="mt-1 text-xs sm:text-sm text-gray-400">
                {isAdmin
                  ? 'Review and route requisitions for approval or revision.'
                  : isAssetManager
                  ? 'View requisitions pending disbursement.'
                  : 'Track your submitted requisitions and their status.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <QuickRequisitionButton />
              <Link
                href={route('dashboard')}
                className="inline-flex items-center justify-center rounded-lg border border-red-500/50 bg-red-600/20 px-3 py-2 text-xs sm:text-sm font-medium text-red-100 hover:bg-red-600/30 transition"
              >
                Back to dashboard
              </Link>
            </div>
          </div>

          <div className="bg-gray-900/70 border border-gray-700/70 rounded-xl shadow-sm overflow-hidden">
            <div className="p-3 sm:p-4 flex items-center justify-between border-b border-gray-800/80">
              <h2 className="text-sm font-medium text-gray-200">All requisitions</h2>
              <span className="text-xs text-gray-500">
                {requisitions.data.length} record{requisitions.data.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="divide-y divide-gray-800/80">
              {requisitions.data.length === 0 && (
                <div className="p-4 text-center text-sm text-gray-500">No requisitions found.</div>
              )}

              {requisitions.data.map((req) => (
                <button
                  key={req.id}
                  type="button"
                  onClick={() => { setSelectedId(req.id); setOpen(true); }}
                  className="w-full text-left px-3 sm:px-4 py-3 hover:bg-gray-800/80 transition-colors"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-100 truncate">{req.title}</p>
                        {req.category && req.category !== 'general' && (
                          <span className="mt-1 inline-flex items-center rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-red-200">
                            {req.category.replace('_', ' ')}
                          </span>
                        )}
                        {req.description && (
                          <p className="mt-0.5 text-xs text-gray-400 line-clamp-2">{req.description}</p>
                        )}
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide ${
                          statusColors[req.status] ?? 'bg-gray-700 text-gray-200 border border-gray-600'
                        }`}
                      >
                        {req.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-500">
                      <span>
                        Created {new Date(req.created_at).toLocaleDateString()} • Needed by{' '}
                        {req.needed_by ? new Date(req.needed_by).toLocaleDateString() : 'Not set'}
                      </span>
                      <span className="flex items-center gap-2">
                        {req.amount != null && (
                          <span className="text-gray-300">{formatCurrencyMWK(req.amount)}</span>
                        )}
                        <span>Requested by {'User #' + req.requested_by}</span>
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {requisitions.meta && requisitions.links && requisitions.meta.last_page > 1 && (
              <div className="px-3 sm:px-4 py-3 flex flex-wrap items-center justify-center gap-1 border-t border-gray-800/80 bg-gray-950/60">
                {requisitions.links.map((link, index) => (
                  <button
                    key={index}
                    disabled={!link.url}
                    onClick={() => {
                      if (link.url) {
                        window.location.href = link.url;
                      }
                    }}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                      link.active
                        ? 'bg-red-600 text-white shadow-sm'
                        : link.url
                        ? 'bg-gray-800/80 text-gray-300 hover:bg-gray-700'
                        : 'bg-transparent text-gray-600 cursor-default'
                    }`}
                    dangerouslySetInnerHTML={{ __html: link.label }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <RequisitionViewModal open={open} requisitionId={selectedId} onClose={() => setOpen(false)} />
    </RequisitionsLayout>
  );
}
