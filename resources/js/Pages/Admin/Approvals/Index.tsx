import React, { useEffect, useState, useMemo } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { formatCurrencyMWK, formatDateMW, formatDistanceToNow } from '@/Components/format';
import RequisitionViewModal from '@/Components/Requisitions/RequisitionViewModal';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { EmptyState } from '@/Components/ui/empty-state';
import IconMapper from '@/Components/IconMapper';

// Animated Counter Component
const AnimatedCounter: React.FC<{ value: number; duration?: number }> = ({ value, duration = 1000 }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let startTime: number;
    let animationFrame: number;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * value));
      if (progress < 1) animationFrame = requestAnimationFrame(animate);
    };
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);
  return <span>{count.toLocaleString()}</span>;
};

// StatCard Component
const StatCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  value: number;
  subtitle: string;
  color: 'red' | 'blue' | 'green' | 'amber' | 'purple' | 'cyan';
}> = ({ icon, title, value, subtitle, color }) => {
  const colorMap = {
    red: { bg: 'bg-red-50 dark:bg-red-950/20', border: 'border-red-200 dark:border-red-800', icon: 'bg-red-600 text-white', text: 'text-red-700 dark:text-red-300' },
    blue: { bg: 'bg-blue-50 dark:bg-blue-950/20', border: 'border-blue-200 dark:border-blue-800', icon: 'bg-blue-600 text-white', text: 'text-blue-700 dark:text-blue-300' },
    green: { bg: 'bg-emerald-50 dark:bg-emerald-950/20', border: 'border-emerald-200 dark:border-emerald-800', icon: 'bg-emerald-600 text-white', text: 'text-emerald-700 dark:text-emerald-300' },
    amber: { bg: 'bg-amber-50 dark:bg-amber-950/20', border: 'border-amber-200 dark:border-amber-800', icon: 'bg-amber-600 text-white', text: 'text-amber-700 dark:text-amber-300' },
    purple: { bg: 'bg-purple-50 dark:bg-purple-950/20', border: 'border-purple-200 dark:border-purple-800', icon: 'bg-purple-600 text-white', text: 'text-purple-700 dark:text-purple-300' },
    cyan: { bg: 'bg-cyan-50 dark:bg-cyan-950/20', border: 'border-cyan-200 dark:border-cyan-800', icon: 'bg-cyan-600 text-white', text: 'text-cyan-700 dark:text-cyan-300' },
  };
  const colors = colorMap[color];
  return (
    <div className={`${colors.bg} ${colors.border} rounded-xl border p-4 transition-all duration-300 hover:scale-[1.02]`}>
      <div className="flex items-start justify-between">
        <div className={`${colors.icon} p-2.5 rounded-lg shadow-md`}>{icon}</div>
      </div>
      <div className="mt-3">
        <p className="text-xl font-bold text-gray-900 dark:text-gray-100"><AnimatedCounter value={value} /></p>
        <p className={`text-sm font-medium ${colors.text} mt-0.5`}>{title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
};

// Action Tile Component
const ActionTile: React.FC<{ icon: React.ReactNode; title: string; description: string; color: string; onClick?: () => void }> = ({ icon, title, description, color, onClick }) => (
  <button onClick={onClick} className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all text-left">
    <div className={`${color} p-2.5 rounded-lg text-white shadow-md shrink-0`}>{icon}</div>
    <div className="min-w-0">
      <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">{title}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{description}</p>
    </div>
  </button>
);

interface BudgetLite {
  id: number;
  fiscal_year: number;
  fiscal_month: number;
  user?: { id: number; name: string };
}

interface Props {
  budgets: { data: BudgetLite[]; meta?: any } | BudgetLite[];
  selectedTab?: 'requisitions' | 'budgets';
  requisitionsPending?: RequisitionLite[];
  requisitionsExpired?: RequisitionLite[];
  reqFilter?: 'pending' | 'expired';
}

interface RequisitionLite {
  id: number;
  title: string;
  amount?: number | string | null;
  status: 'pending_admin' | 'needs_revision' | 'pending_disbursement' | 'pending_funding' | 'disbursed' | 'expired';
  requested_by?: number;
  requestedBy?: { id: number; name: string } | null;
  created_at?: string;
  needed_by?: string | null;
  category?: string;
  description?: string;
}

const statusConfig: Record<string, { color: string; icon: string; label: string }> = {
  pending_admin: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-300 dark:border-yellow-500/40', icon: 'Clock', label: 'Pending Admin' },
  needs_revision: { color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/40', icon: 'AlertCircle', label: 'Needs Revision' },
  pending_disbursement: { color: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-200 dark:border-indigo-500/40', icon: 'Wallet', label: 'Pending Disbursement' },
  pending_funding: { color: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/20 dark:text-amber-200 dark:border-amber-500/40', icon: 'DollarSign', label: 'Pending Funding' },
  disbursed: { color: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-200 dark:border-emerald-500/40', icon: 'CheckCircle', label: 'Disbursed' },
  expired: { color: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700/40 dark:text-gray-300 dark:border-gray-600', icon: 'XCircle', label: 'Expired' },
};

export default function AdminApprovalsIndex({ budgets, selectedTab = 'requisitions', requisitionsPending = [], requisitionsExpired = [], reqFilter = 'pending' }: Props) {
  const [tab, setTab] = useState<'requisitions' | 'budgets'>(selectedTab);
  const [reqOpen, setReqOpen] = useState(false);
  const [reqId, setReqId] = useState<number | null>(null);

  useEffect(() => {
    if (tab !== selectedTab) {
      router.get(route('admin.approvals.index'), { tab }, { preserveState: true, replace: true });
    }
  }, [tab, selectedTab]);

  useEffect(() => {
    setTab(selectedTab);
  }, [selectedTab]);

  const approveReq = (r: RequisitionLite) => {
    if (!confirm('Approve this requisition?')) return;
    router.post(route('requisitions.approve', r.id), {}, { preserveScroll: true });
  };

  const declineReq = (r: RequisitionLite) => {
    const reason = prompt('Reason (optional)') || '';
    if (!confirm('Decline this requisition?')) return;
    router.post(route('requisitions.decline', r.id), { notes_admin: reason }, { preserveScroll: true });
  };

  const requestedByLabel = (r: RequisitionLite) => {
    return r.requestedBy?.name
      ?? (typeof (r as any).requested_by === 'object'
        ? ((r as any).requested_by?.name ?? '-')
        : ((r as any).requested_by ? `User #${(r as any).requested_by}` : '-'));
  };

  const reqStatusColors: Record<string, string> = {
    pending_admin: 'px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-200 border border-yellow-500/30',
    needs_revision: 'px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-300 border border-red-500/30',
    pending_disbursement: 'px-2 py-1 rounded text-xs font-medium bg-coin-100 text-coin-800 dark:bg-coin-900/30 dark:text-coin-200 border border-coin-500/30',
    pending_funding: 'px-2 py-1 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200 border border-amber-500/30',
    disbursed: 'px-2 py-1 rounded text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200 border border-emerald-500/30',
    expired: 'px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700/40 dark:text-gray-300 border border-gray-300 dark:border-gray-600',
  };

  const reqs = reqFilter === 'expired' ? (requisitionsExpired || []) : (requisitionsPending || []);
  const budgetsArr: BudgetLite[] = Array.isArray(budgets) ? budgets : (budgets?.data || []);

  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => { const timer = setInterval(() => setCurrentTime(new Date()), 60000); return () => clearInterval(timer); }, []);

  const statCards = useMemo(() => [
    { icon: <IconMapper name="FileText" size={20} />, title: 'Pending', value: requisitionsPending?.length || 0, subtitle: 'Awaiting approval', color: 'amber' as const },
    { icon: <IconMapper name="Clock" size={20} />, title: 'Expired', value: requisitionsExpired?.length || 0, subtitle: 'Past due date', color: 'red' as const },
    { icon: <IconMapper name="Wallet" size={20} />, title: 'Budgets', value: budgetsArr.length, subtitle: 'Active periods', color: 'blue' as const },
    { icon: <IconMapper name="CheckCircle" size={20} />, title: 'Total', value: reqs.length + budgetsArr.length, subtitle: 'Items to review', color: 'green' as const },
  ], [requisitionsPending, requisitionsExpired, budgetsArr, reqs]);

  const quickActions = [
    { icon: <IconMapper name="RefreshCw" size={18} />, title: 'Refresh', description: 'Reload data', color: 'bg-blue-600', onClick: () => router.reload() },
    { icon: <IconMapper name="Filter" size={18} />, title: 'Filters', description: 'Advanced options', color: 'bg-purple-600', onClick: () => {} },
  ];

  const EmptyState: React.FC<{ title: string; description: string }> = ({ title, description }) => (
    <div className="p-8 text-center">
      <div className="inline-flex p-4 rounded-full bg-gray-100 dark:bg-gray-800 mb-3">
        <IconMapper name="Inbox" size={32} className="text-gray-400" />
      </div>
      <p className="text-gray-900 dark:text-gray-100 font-medium">{title}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
    </div>
  );

  return (
    <AdminLayout title="Approvals">
      <Head title="Approvals" />
      
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Hero Header */}
        <div className="bg-gradient-to-br from-red-900 via-red-800 to-red-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white/10 rounded-lg backdrop-blur-sm">
                    <IconMapper name="CheckCircle" size={24} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Approvals</h1>
                    <p className="text-red-100 text-sm mt-0.5">Review requisitions and budgets</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-2xl font-mono font-semibold">
                    {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-red-200 text-xs">
                    {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
            {statCards.map((stat, idx) => (
              <StatCard key={idx} {...stat} />
            ))}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {quickActions.map((action, idx) => (
              <ActionTile key={idx} {...action} />
            ))}
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 mb-6">
            <button
              onClick={() => setTab('requisitions')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'requisitions' ? 'bg-red-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'}`}
            >
              <span className="flex items-center gap-2">
                <IconMapper name="FileText" size={16} />
                Requisitions
              </span>
            </button>
            <button
              onClick={() => setTab('budgets')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'budgets' ? 'bg-red-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'}`}
            >
              <span className="flex items-center gap-2">
                <IconMapper name="Wallet" size={16} />
                Budgets
              </span>
            </button>
          </div>

          {/* Content */}
          <Card className="overflow-hidden">
            {tab === 'requisitions' && (
              <>
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Requisitions</h2>
                  <div className="inline-flex rounded-full bg-gray-100 dark:bg-gray-800/60 p-1">
                    <button
                      onClick={() => router.get(route('admin.approvals.index'), { tab: 'requisitions', req_filter: 'pending' }, { preserveState: true, replace: true })}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium ${reqFilter === 'pending' ? 'bg-red-600 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                    >
                      Pending
                    </button>
                    <button
                      onClick={() => router.get(route('admin.approvals.index'), { tab: 'requisitions', req_filter: 'expired' }, { preserveState: true, replace: true })}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium ${reqFilter === 'expired' ? 'bg-gray-700 text-white dark:bg-gray-600' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                    >
                      Expired
                    </button>
                  </div>
                </div>

                {reqs.length === 0 ? (
                  <EmptyState
                    title={reqFilter === 'expired' ? 'No expired requisitions' : 'No pending requisitions'}
                    description={reqFilter === 'expired' ? 'No expired requisitions to review.' : 'Requisitions needing approval will appear here.'}
                  />
                ) : (
                  <div className="space-y-3 p-4">
                    {reqs.map((r) => {
                      const status = statusConfig[r.status] || statusConfig.pending_admin;
                      return (
                        <Card
                          key={r.id}
                          className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                          onClick={() => { setReqId(r.id); setReqOpen(true); }}
                        >
                          <div className="flex flex-col sm:flex-row">
                            {/* Left accent bar based on status */}
                            <div className={`w-full sm:w-1.5 ${
                              r.status === 'expired' ? 'bg-gray-500' :
                              r.status === 'needs_revision' ? 'bg-red-500' :
                              r.status === 'disbursed' ? 'bg-emerald-500' :
                              r.status === 'pending_disbursement' ? 'bg-indigo-500' :
                              r.status === 'pending_funding' ? 'bg-amber-500' : 'bg-yellow-500'
                            }`} />

                            <div className="flex-1 p-4 sm:p-5">
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                      {r.title}
                                    </h3>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">#{r.id}</span>
                                    <Badge className={`${status.color} text-xs`}>
                                      <IconMapper name={status.icon} size={12} className="mr-1 inline" />
                                      {status.label}
                                    </Badge>
                                    {r.category && r.category !== 'general' && (
                                      <span className="inline-flex items-center rounded-full bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-200 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide">
                                        {r.category.replace('_', ' ')}
                                      </span>
                                    )}
                                  </div>

                                  {r.description && (
                                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                      {r.description}
                                    </p>
                                  )}

                                  {/* Info Row */}
                                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
                                    {r.amount != null && (
                                      <span className="flex items-center gap-1">
                                        <IconMapper name="DollarSign" size={14} className="text-amber-500" />
                                        <span className="font-medium text-gray-900 dark:text-gray-100">
                                          {formatCurrencyMWK(r.amount)}
                                        </span>
                                      </span>
                                    )}
                                    <span className="flex items-center gap-1">
                                      <IconMapper name="User" size={14} />
                                      {requestedByLabel(r)}
                                    </span>
                                    {r.created_at && (
                                      <span className="flex items-center gap-1">
                                        <IconMapper name="Clock" size={14} />
                                        {formatDistanceToNow(r.created_at)}
                                      </span>
                                    )}
                                    {r.needed_by && (
                                      <span className="flex items-center gap-1">
                                        <IconMapper name="Calendar" size={14} className="text-blue-500" />
                                        Needed by {formatDateMW(undefined, r.needed_by)}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Right side: Actions */}
                                <div className="flex flex-col items-end gap-2">
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setReqId(r.id);
                                        setReqOpen(true);
                                      }}
                                    >
                                      <IconMapper name="Eye" size={16} />
                                    </Button>
                                  </div>
                                  {reqFilter === 'pending' && r.status === 'pending_admin' && (
                                    <div className="flex items-center gap-2">
                                      <Button
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          approveReq(r);
                                        }}
                                        className="bg-emerald-600 hover:bg-emerald-700"
                                      >
                                        <IconMapper name="Check" size={14} className="mr-1" />
                                        Approve
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          declineReq(r);
                                        }}
                                        className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400"
                                      >
                                        <IconMapper name="X" size={14} className="mr-1" />
                                        Decline
                                      </Button>
                                    </div>
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
              </>
            )}

            {tab === 'budgets' && (
              <>
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Budgets</h2>
                </div>
                {budgetsArr.length === 0 ? (
                  <EmptyState title="No budgets found" description="Budgets will appear here when available." />
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {budgetsArr.map((b) => (
                      <div key={b.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{String(b.fiscal_month).padStart(2, '0')}/{b.fiscal_year}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Owner: {b.user?.name ?? '-'}</p>
                        </div>
                        <IconMapper name="Wallet" size={20} className="text-gray-400" />
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </Card>
        </div>
      </div>

      <RequisitionViewModal open={reqOpen} requisitionId={reqId} onClose={() => setReqOpen(false)} />
    </AdminLayout>
  );
}
