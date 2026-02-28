import React, { useEffect, useState, useMemo } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { formatCurrencyMWK, formatDateMW, formatDistanceToNow } from '@/Components/format';
import RequisitionsLayout from '@/Layouts/RequisitionsLayout';
import type { PageProps } from '@/types';
import QuickBudgetButton from '@/Components/Budgets/QuickBudgetButton';
import BudgetViewModal from '@/Components/Budgets/BudgetViewModal';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import EmptyState from '@/Components/ui/empty-state';
import IconMapper from '@/Components/IconMapper';

interface BudgetUser {
  id: number;
  name: string;
}

export interface BudgetItem {
  id: number;
  title: string;
  description?: string | null;
  category?: 'general' | 'fuel' | 'vehicle_hire' | 'events' | 'k9' | 'utilities' | 'office_supplies' | 'stationery' | 'cleaning_supplies' | 'security_equipment' | 'uniforms' | 'training_materials' | 'vehicle_maintenance' | 'communications' | 'it_equipment' | 'medical_supplies' | string;
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

const statusConfig: Record<string, { color: string; icon: string; label: string }> = {
  pending_admin: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-300 dark:border-yellow-500/40', icon: 'Clock', label: 'Pending Admin' },
  needs_revision: { color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/40', icon: 'AlertCircle', label: 'Needs Revision' },
  pending_release: { color: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-200 dark:border-indigo-500/40', icon: 'Wallet', label: 'Pending Release' },
  released: { color: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-200 dark:border-emerald-500/40', icon: 'CheckCircle', label: 'Released' },
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

            {budgets.data.length === 0 ? (
              <EmptyState
                title="No budgets found"
                description="Budget requests will appear here when available."
              />
            ) : (
              <div className="space-y-3 p-4">
                {budgets.data.map((b) => {
                  const status = statusConfig[b.status] || statusConfig.pending_admin;
                  return (
                    <Card
                      key={b.id}
                      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => { setSelectedId(b.id); setOpen(true); }}
                    >
                      <div className="flex flex-col sm:flex-row">
                        {/* Left accent bar based on status */}
                        <div className={`w-full sm:w-1.5 ${
                          b.status === 'released' ? 'bg-emerald-500' :
                          b.status === 'needs_revision' ? 'bg-red-500' :
                          b.status === 'pending_release' ? 'bg-indigo-500' : 'bg-yellow-500'
                        }`} />

                        <div className="flex-1 p-4 sm:p-5">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                  {b.title}
                                </h3>
                                <span className="text-xs text-gray-500 dark:text-gray-400">#{b.id}</span>
                                <Badge className={`${status.color} text-xs`}>
                                  <IconMapper name={status.icon} size={12} className="mr-1 inline" />
                                  {status.label}
                                </Badge>
                                {b.category && b.category !== 'general' && (
                                  <span className="inline-flex items-center rounded-full bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-200 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide">
                                    {b.category.replace('_', ' ')}
                                  </span>
                                )}
                              </div>

                              {b.description && (
                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                  {b.description}
                                </p>
                              )}

                              {/* Info Row */}
                              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
                                {b.amount != null && (
                                  <span className="flex items-center gap-1">
                                    <IconMapper name="DollarSign" size={14} className="text-amber-500" />
                                    <span className="font-medium text-gray-900 dark:text-gray-100">
                                      {formatCurrencyMWK(b.amount)}
                                    </span>
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <IconMapper name="User" size={14} />
                                  {getRequestedByLabel(b as any)}
                                </span>
                                {b.created_at && (
                                  <span className="flex items-center gap-1">
                                    <IconMapper name="Clock" size={14} />
                                    {formatDistanceToNow(b.created_at)}
                                  </span>
                                )}
                                {b.needed_by && (
                                  <span className="flex items-center gap-1">
                                    <IconMapper name="Calendar" size={14} className="text-blue-500" />
                                    Needed by {formatDateMW(undefined, b.needed_by)}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Right side: Actions */}
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedId(b.id);
                                  setOpen(true);
                                }}
                              >
                                <IconMapper name="Eye" size={16} />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}

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
