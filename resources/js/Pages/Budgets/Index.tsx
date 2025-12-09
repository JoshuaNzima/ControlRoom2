import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { formatCurrencyMWK } from '@/Components/format';
import RequisitionsLayout from '@/Layouts/RequisitionsLayout';
import type { PageProps } from '@/types';
import QuickBudgetButton from '@/Components/Budgets/QuickBudgetButton';
import BudgetViewModal from '@/Components/Budgets/BudgetViewModal';

interface BudgetUser {
  id: number;
  name: string;
}

export interface BudgetItem {
  id: number;
  title: string;
  description?: string | null;
  category?: 'general' | 'fuel' | 'vehicle_hire' | string;
  status: 'pending_admin' | 'needs_revision' | 'pending_release' | 'released';
  needed_by?: string | null;
  amount?: number | string | null;
  created_at: string;
  updated_at: string;
  requested_by: number;
  requestedBy?: BudgetUser;
  approvedBy?: BudgetUser | null;
  releasedBy?: BudgetUser | null;
}

interface PaginationMeta { current_page: number; last_page: number; }
interface PaginationLink { url: string | null; label: string; active: boolean; }

type BudgetsIndexProps = PageProps<{
  budgets: { data: BudgetItem[]; meta?: PaginationMeta; links?: PaginationLink[] };
  mode?: 'release' | 'mine' | string;
}>;

const statusColors: Record<string, string> = {
  pending_admin: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40',
  needs_revision: 'bg-red-500/10 text-red-300 border border-red-500/40',
  pending_release: 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/40',
  released: 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40',
};

export default function BudgetsIndex({ budgets, auth, mode: initialMode }: BudgetsIndexProps) {
  const roles = (auth.user.roles ?? []) as string[];
  const isAdmin = roles.includes('admin') || roles.includes('super_admin');
  const isFinance = roles.some((r) => ['finance_officer','accountant','finance','accounting'].includes(r));
  const [open, setOpen] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState<number | null>(null);
  const mode: 'release' | 'mine' = (initialMode === 'mine' ? 'mine' : 'release');

  const getRelationName = (obj: any, camel: string, snake: string) => obj?.[camel]?.name || obj?.[snake]?.name || '';
  const getRequestedByLabel = (req: any) => {
    const name = getRelationName(req, 'requestedBy', 'requested_by');
    if (name) return name;
    const idVal = req?.requested_by;
    return (typeof idVal === 'number' || typeof idVal === 'string') ? `User #${String(idVal)}` : 'User';
  };

  return (
    <RequisitionsLayout title="Budgets">
      <Head title="Budgets" />

      <div className="py-4 sm:py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-100">Budgets</h1>
              <p className="mt-1 text-xs sm:text-sm text-gray-400">
                {isAdmin
                  ? 'Review and route budget requests for approval or revision.'
                  : isFinance
                  ? (mode === 'release' ? 'Budget requests pending release.' : 'Your submitted budget requests.')
                  : 'Track your submitted budget requests and their status.'}
              </p>
              {isFinance && (
                <div className="mt-2 inline-flex rounded-full bg-gray-800/40 p-1">
                  <Link
                    href={route('budgets.index', { mode: 'release' })}
                    className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium ${mode === 'release' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700/60'}`}
                    preserveScroll
                    preserveState
                  >
                    Needs Release
                  </Link>
                  <Link
                    href={route('budgets.index', { mode: 'mine' })}
                    className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium ${mode === 'mine' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700/60'}`}
                    preserveScroll
                    preserveState
                  >
                    My Requests
                  </Link>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <QuickBudgetButton />
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
              <h2 className="text-sm font-medium text-gray-200">All budgets</h2>
              <span className="text-xs text-gray-500">
                {budgets.data.length} record{budgets.data.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="divide-y divide-gray-800/80">
              {budgets.data.length === 0 && (
                <div className="p-4 text-center text-sm text-gray-500">No budgets found.</div>
              )}

              {budgets.data.map((b) => (
                <div key={b.id} className="">
                  <button
                    type="button"
                    onClick={() => { setSelectedId(b.id); setOpen(true); }}
                    className="w-full text-left px-3 sm:px-4 py-3 hover:bg-gray-800/80 transition-colors"
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-100 truncate">{b.title}</p>
                          {b.category && b.category !== 'general' && (
                            <span className="mt-1 inline-flex items-center rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-red-200">
                              {String(b.category).replace('_', ' ')}
                            </span>
                          )}
                          {b.description && (
                            <p className="mt-0.5 text-xs text-gray-400 line-clamp-2">{b.description}</p>
                          )}
                        </div>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide ${
                            statusColors[b.status] ?? 'bg-gray-700 text-gray-200 border border-gray-600'
                          }`}
                        >
                          {String(b.status).replace('_', ' ')}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-500">
                        <span>
                          Created {new Date(b.created_at).toLocaleDateString()} • Needed by{' '}
                          {b.needed_by ? new Date(b.needed_by).toLocaleDateString() : 'Not set'}
                        </span>
                        <span className="flex flex-wrap items-center gap-2">
                          {b.amount != null && (
                            <span className="text-gray-300">{formatCurrencyMWK(b.amount)}</span>
                          )}
                          <span>Requested by {getRequestedByLabel(b as any)}</span>
                          {(getRelationName(b as any, 'approvedBy', 'approved_by')) && (
                            <>
                              <span>•</span>
                              <span>Approved by {getRelationName(b as any, 'approvedBy', 'approved_by')}</span>
                            </>
                          )}
                          {(b.status === 'released' && getRelationName(b as any, 'releasedBy', 'released_by')) && (
                            <>
                              <span>•</span>
                              <span>Released by {getRelationName(b as any, 'releasedBy', 'released_by')} on {new Date(b.updated_at).toLocaleString()}</span>
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  </button>
                </div>
              ))}
            </div>

            {budgets.meta && budgets.links && budgets.meta.last_page > 1 && (
              <div className="px-3 sm:px-4 py-3 flex flex-wrap items-center justify-center gap-1 border-t border-gray-800/80 bg-gray-950/60">
                {budgets.links.map((link, index) => (
                  <button
                    key={index}
                    disabled={!link.url}
                    onClick={() => { if (link.url) { window.location.href = link.url; } }}
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
      <BudgetViewModal open={open} budgetId={selectedId} onClose={() => setOpen(false)} />
    </RequisitionsLayout>
  );
}
