import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { formatCurrencyMWK } from '@/Components/format';
import RequisitionsLayout from '@/Layouts/RequisitionsLayout';
import type { PageProps } from '@/types';
import QuickRequisitionButton from '@/Components/Requisitions/QuickRequisitionButton';
import RequisitionViewModal from '@/Components/Requisitions/RequisitionViewModal';
import { useNotification } from '@/Providers/NotificationProvider';
import TodayBatchModal from '@/Components/Requisitions/TodayBatchModal';
import BatchesHistoryModal from '@/Components/Requisitions/BatchesHistoryModal';
import BatchDetailsModal from '@/Components/Requisitions/BatchDetailsModal';
import RequisitionReportModal from '@/Components/Requisitions/RequisitionReportModal';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import EmptyState from '@/Components/ui/empty-state';
import IconMapper from '@/Components/IconMapper';

interface RequisitionUser {
  id: number;
  name: string;
}

export interface Requisition {
  id: number;
  title: string;
  description?: string | null;
  category?: 'general' | 'fuel' | 'vehicle_hire' | 'events' | 'k9' | 'utilities' | 'office_supplies' | 'stationery' | 'cleaning_supplies' | 'security_equipment' | 'uniforms' | 'training_materials' | 'vehicle_maintenance' | 'communications' | 'it_equipment' | 'medical_supplies' | string;
  status: 'pending_admin' | 'needs_revision' | 'pending_disbursement' | 'pending_funding' | 'disbursed' | 'expired';
  needed_by?: string | null;
  amount?: number | string | null;
  created_at: string;
  updated_at: string;
  requested_by: number;
  requestedBy?: RequisitionUser;
  approvedBy?: RequisitionUser | null;
  disbursedBy?: RequisitionUser | null;
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
  mode?: 'disburse' | 'mine' | string;
  filter?: 'all' | 'pending' | 'approved' | 'expired' | 'rejected' | 'archived' | string;
}>;

const statusConfig: Record<string, { color: string; icon: string; label: string }> = {
  pending_admin: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-300 dark:border-yellow-500/40', icon: 'Clock', label: 'Pending Admin' },
  needs_revision: { color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/40', icon: 'AlertCircle', label: 'Needs Revision' },
  pending_disbursement: { color: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-200 dark:border-indigo-500/40', icon: 'Wallet', label: 'Pending Disbursement' },
  pending_funding: { color: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/20 dark:text-amber-200 dark:border-amber-500/40', icon: 'Banknote', label: 'Pending Funding' },
  disbursed: { color: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-200 dark:border-emerald-500/40', icon: 'CheckCircle', label: 'Disbursed' },
  expired: { color: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700/40 dark:text-gray-300 dark:border-gray-600', icon: 'XCircle', label: 'Expired' },
};

export default function RequisitionsIndex({ requisitions, auth, mode: initialMode, filter: initialFilter }: RequisitionsIndexProps) {
  const rawRoles = (auth.user.roles ?? []) as (string | { id: number; name: string })[];
  const roles = rawRoles.map((r) => (typeof r === 'string' ? r : r.name));
  const isAdmin = roles.includes('admin') || roles.includes('super_admin');
  const isAssetManager = roles.includes('asset_manager') || roles.includes('assets_manager');
  const userId = (auth.user.id as number);
  const [open, setOpen] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState<number | null>(null);
  const [openEdit, setOpenEdit] = React.useState(false);
  const { push } = useNotification();
  const mode: 'disburse' | 'mine' = (initialMode === 'mine' ? 'mine' : 'disburse');
  const selectedFilter: 'all' | 'pending' | 'approved' | 'expired' | 'rejected' | 'archived' = (initialFilter === 'archived' ? 'archived' : (initialFilter === 'rejected' ? 'rejected' : (initialFilter === 'expired' ? 'expired' : (initialFilter === 'approved' ? 'approved' : (initialFilter === 'all' ? 'all' : 'pending')))));
  const [showBatch, setShowBatch] = React.useState(false);
  const [showHistory, setShowHistory] = React.useState(false);
  const [showBatchDetails, setShowBatchDetails] = React.useState(false);
  const [selectedBatchId, setSelectedBatchId] = React.useState<number | null>(null);
  const [showReport, setShowReport] = React.useState(false);

  const getRelationName = (obj: any, camel: string, snake: string) => obj?.[camel]?.name || obj?.[snake]?.name || '';
  const getRequestedByLabel = (req: any) => {
    const name = getRelationName(req, 'requestedBy', 'requested_by');
    if (name) return name;
    const idVal = req?.requested_by;
    return (typeof idVal === 'number' || typeof idVal === 'string') ? `User #${String(idVal)}` : 'User';
  };
  const isMine = (req: any) => String(userId) === String(req?.requested_by ?? '');

  return (
    <RequisitionsLayout title="Requisitions">
      <Head title="Requisitions" />

      <div className="py-4 sm:py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">
          {/* Header with Quick Action */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100">Requisitions</h1>
              <p className="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                {isAdmin
                  ? 'Review and route requisitions for approval or revision.'
                  : isAssetManager
                  ? (mode === 'disburse' ? 'Requisitions pending disbursement.' : 'Your submitted requisitions.')
                  : 'Track your submitted requisitions and their status.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <QuickRequisitionButton className="bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20" />
              {(isAdmin || isAssetManager) && (
                <Button variant="outline" size="sm" onClick={() => setShowBatch(true)}>
                  <IconMapper name="Layers" className="w-4 h-4 mr-1.5" />
                  Today's Batch
                </Button>
              )}
              {(isAdmin || isAssetManager) && (
                <Button variant="outline" size="sm" onClick={() => setShowHistory(true)}>
                  <IconMapper name="History" className="w-4 h-4 mr-1.5" />
                  History
                </Button>
              )}
              {isAdmin && (
                <Button variant="outline" size="sm" onClick={() => setShowReport(true)}>
                  <IconMapper name="FileText" className="w-4 h-4 mr-1.5" />
                  Report
                </Button>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {isAssetManager && (
              <div className="inline-flex rounded-full bg-gray-100 dark:bg-gray-800/40 p-1">
                <Link
                  href={route('requisitions.index', { mode: 'disburse' })}
                  className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors ${mode === 'disburse' ? 'bg-red-600 text-white' : 'text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700/60'}`}
                  preserveScroll
                  preserveState
                >
                  Needs Disbursement
                </Link>
                <Link
                  href={route('requisitions.index', { mode: 'mine' })}
                  className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors ${mode === 'mine' ? 'bg-red-600 text-white' : 'text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700/60'}`}
                  preserveScroll
                  preserveState
                >
                  My Requests
                </Link>
              </div>
            )}
            {(isAdmin || !isAssetManager || (isAssetManager && mode === 'mine')) && (
              <div className="inline-flex rounded-full bg-gray-100 dark:bg-gray-800/40 p-1">
                <Link
                  href={route('requisitions.index', (isAssetManager ? { mode, filter: 'pending' } : { filter: 'pending' }))}
                  className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors ${selectedFilter === 'pending' ? 'bg-red-600 text-white' : 'text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700/60'}`}
                  preserveScroll
                  preserveState
                >
                  Pending
                </Link>
                <Link
                  href={route('requisitions.index', (isAssetManager ? { mode, filter: 'approved' } : { filter: 'approved' }))}
                  className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors ${selectedFilter === 'approved' ? 'bg-emerald-600 text-white' : 'text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700/60'}`}
                  preserveScroll
                  preserveState
                >
                  Approved
                </Link>
                <Link
                  href={route('requisitions.index', (isAssetManager ? { mode, filter: 'rejected' } : { filter: 'rejected' }))}
                  className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors ${selectedFilter === 'rejected' ? 'bg-rose-600 text-white' : 'text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700/60'}`}
                  preserveScroll
                  preserveState
                >
                  Rejected
                </Link>
                <Link
                  href={route('requisitions.index', (isAssetManager ? { mode, filter: 'expired' } : { filter: 'expired' }))}
                  className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors ${selectedFilter === 'expired' ? 'bg-gray-700 text-white dark:bg-gray-600' : 'text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700/60'}`}
                  preserveScroll
                  preserveState
                >
                  Expired
                </Link>
                <Link
                  href={route('requisitions.index', (isAssetManager ? { mode, filter: 'all' } : { filter: 'all' }))}
                  className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors ${selectedFilter === 'all' ? 'bg-gray-900 text-white dark:bg-gray-700' : 'text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700/60'}`}
                  preserveScroll
                  preserveState
                >
                  All
                </Link>
                <Link
                  href={route('requisitions.index', (isAssetManager ? { mode, filter: 'archived' } : { filter: 'archived' }))}
                  className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors ${selectedFilter === 'archived' ? 'bg-purple-600 text-white' : 'text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700/60'}`}
                  preserveScroll
                  preserveState
                >
                  Archived
                </Link>
              </div>
            )}
          </div>

          {/* Requisitions List */}
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="p-3 sm:p-4 flex items-center justify-between border-b border-border">
              <h2 className="text-sm font-medium text-foreground">All requisitions</h2>
              <span className="text-xs text-muted-foreground">
                {requisitions.data.length} record{requisitions.data.length === 1 ? '' : 's'}
              </span>
            </div>

            {requisitions.data.length === 0 ? (
              <EmptyState
                title="No requisitions found"
                description="Create your first requisition to get started."
              />
            ) : (
              <div className="space-y-3 p-4">
                {requisitions.data.map((req) => {
                  const status = statusConfig[req.status] || statusConfig.pending_admin;
                  return (
                    <Card
                      key={req.id}
                      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => { setSelectedId(req.id); setOpen(true); }}
                    >
                      <div className="flex flex-col sm:flex-row">
                        {/* Left accent bar based on status */}
                        <div className={`w-full sm:w-1.5 ${
                          req.status === 'disbursed' ? 'bg-emerald-500' :
                          req.status === 'needs_revision' ? 'bg-red-500' :
                          req.status === 'pending_disbursement' ? 'bg-indigo-500' :
                          req.status === 'expired' ? 'bg-gray-500' : 'bg-yellow-500'
                        }`} />

                        <div className="flex-1 p-4 sm:p-5">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                  {req.title}
                                </h3>
                                <span className="text-xs text-gray-500 dark:text-gray-400">#{req.id}</span>
                                <Badge className={`${status.color} text-xs`}>
                                  <IconMapper name={status.icon} size={12} className="mr-1 inline" />
                                  {status.label}
                                </Badge>
                                {req.category && req.category !== 'general' && (
                                  <span className="inline-flex items-center rounded-full bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-200 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide">
                                    {req.category.replace('_', ' ')}
                                  </span>
                                )}
                              </div>

                              {req.description && (
                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                  {req.description}
                                </p>
                              )}

                              {/* Info Row */}
                              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
                                {req.amount != null && (
                                  <span className="flex items-center gap-1">
                                    <IconMapper name="DollarSign" size={14} className="text-amber-500" />
                                    <span className="font-medium text-gray-900 dark:text-gray-100">
                                      {formatCurrencyMWK(req.amount)}
                                    </span>
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <IconMapper name="User" size={14} />
                                  {getRequestedByLabel(req as any)}
                                </span>
                                {req.created_at && (
                                  <span className="flex items-center gap-1">
                                    <IconMapper name="Clock" size={14} />
                                    {new Date(req.created_at).toLocaleDateString()}
                                  </span>
                                )}
                                {req.needed_by && (
                                  <span className="flex items-center gap-1">
                                    <IconMapper name="Calendar" size={14} className="text-blue-500" />
                                    Needed by {new Date(req.needed_by).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Right side: Actions */}
                            <div className="flex items-center gap-1">
                              {isAssetManager && req.status === 'pending_disbursement' && ((req as any)?.batch?.status === 'acknowledged') && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.post(route('requisitions.disburse', req.id), { notes_disbursement: '' }, {
                                      preserveScroll: true,
                                      onSuccess: () => {
                                        push('Requisition marked as disbursed', 'success');
                                        router.reload();
                                      },
                                    });
                                  }}
                                  className="bg-indigo-600 hover:bg-indigo-700"
                                >
                                  <IconMapper name="DollarSign" size={14} className="mr-1" />
                                  Disburse
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedId(req.id);
                                  setOpen(true);
                                }}
                              >
                                <IconMapper name="Eye" size={16} />
                              </Button>
                              {(isMine(req) && req.status === 'pending_admin') && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedId(req.id);
                                    setOpenEdit(true);
                                    setOpen(true);
                                  }}
                                >
                                  <IconMapper name="Pencil" size={16} />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}

            {requisitions.meta && requisitions.links && requisitions.meta.last_page > 1 && (
              <div className="px-3 sm:px-4 py-3 flex flex-wrap items-center justify-center gap-1 border-t border-border bg-muted/50">
                {requisitions.links.map((link, index) => (
                  <button
                    key={index}
                    disabled={!link.url}
                    onClick={() => { if (link.url) { window.location.href = link.url; } }}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                      link.active
                        ? 'bg-coin-600 text-white shadow-sm'
                        : link.url
                        ? 'bg-muted text-foreground hover:bg-muted/80'
                        : 'bg-transparent text-muted-foreground cursor-default'
                    }`}
                    dangerouslySetInnerHTML={{ __html: link.label }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <RequisitionViewModal open={open} requisitionId={selectedId} initialEdit={openEdit} onClose={() => { setOpen(false); setOpenEdit(false); }} />
      <TodayBatchModal open={showBatch} onClose={() => setShowBatch(false)} isAdmin={isAdmin} isAssetManager={isAssetManager} />
      <BatchesHistoryModal
        open={showHistory}
        onClose={() => setShowHistory(false)}
        isAdmin={isAdmin}
        isAssetManager={isAssetManager}
        onViewBatch={(id) => {
          setSelectedBatchId(id);
          setShowBatchDetails(true);
        }}
      />
      <BatchDetailsModal
        open={showBatchDetails}
        onClose={() => setShowBatchDetails(false)}
        batchId={selectedBatchId}
        isAdmin={isAdmin}
        isAssetManager={isAssetManager}
      />
      <RequisitionReportModal open={showReport} onClose={() => setShowReport(false)} />
    </RequisitionsLayout>
  );
}
