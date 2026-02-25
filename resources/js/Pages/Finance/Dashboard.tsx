import React, { useState, useEffect, useMemo } from 'react';
import { Head, Link } from '@inertiajs/react';
import FinanceLayout from '@/Layouts/FinanceLayout';
import IconMapper from '@/Components/IconMapper';
import { formatCurrencyMWK } from '@/Components/format';
import { Card } from '@/Components/ui/card';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, AreaChart, Area } from 'recharts';
import FinanceDrilldownPanel from '@/Components/FinanceDrilldownPanel';
import QuickRequisitionModal from '@/Components/Requisitions/QuickRequisitionModal';
import RequisitionSummary from '@/Components/Requisitions/RequisitionSummary';

// Animated Counter Component
const AnimatedCounter: React.FC<{ value: number; duration?: number; prefix?: string; suffix?: string }> = ({ 
  value, duration = 1000, prefix = '', suffix = '' 
}) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let startTime: number;
    let animationFrame: number;
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * value));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);
  
  return <span>{prefix}{count.toLocaleString()}{suffix}</span>;
};

// Modern Stat Card
interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: number | string;
  subtitle: string;
  color: 'red' | 'blue' | 'green' | 'amber' | 'purple' | 'cyan' | 'emerald';
  onClick?: () => void;
  isCurrency?: boolean;
}

const colorMap = {
  red: { bg: 'bg-red-50 dark:bg-red-950/20', border: 'border-red-200 dark:border-red-800', icon: 'bg-red-600 text-white', text: 'text-red-700 dark:text-red-300' },
  blue: { bg: 'bg-blue-50 dark:bg-blue-950/20', border: 'border-blue-200 dark:border-blue-800', icon: 'bg-blue-600 text-white', text: 'text-blue-700 dark:text-blue-300' },
  green: { bg: 'bg-emerald-50 dark:bg-emerald-950/20', border: 'border-emerald-200 dark:border-emerald-800', icon: 'bg-emerald-600 text-white', text: 'text-emerald-700 dark:text-emerald-300' },
  amber: { bg: 'bg-amber-50 dark:bg-amber-950/20', border: 'border-amber-200 dark:border-amber-800', icon: 'bg-amber-600 text-white', text: 'text-amber-700 dark:text-amber-300' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-950/20', border: 'border-purple-200 dark:border-purple-800', icon: 'bg-purple-600 text-white', text: 'text-purple-700 dark:text-purple-300' },
  cyan: { bg: 'bg-cyan-50 dark:bg-cyan-950/20', border: 'border-cyan-200 dark:border-cyan-800', icon: 'bg-cyan-600 text-white', text: 'text-cyan-700 dark:text-cyan-300' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-950/20', border: 'border-emerald-200 dark:border-emerald-800', icon: 'bg-emerald-600 text-white', text: 'text-emerald-700 dark:text-emerald-300' },
};

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, subtitle, color, onClick, isCurrency }) => {
  const colors = colorMap[color];
  const numericValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) || 0 : value;
  
  return (
    <div 
      onClick={onClick}
      className={`${colors.bg} ${colors.border} ${onClick ? 'cursor-pointer hover:shadow-lg' : ''} 
        rounded-xl border p-5 transition-all duration-300 hover:scale-[1.02]`}
    >
      <div className="flex items-start justify-between">
        <div className={`${colors.icon} p-3 rounded-lg shadow-md`}>
          {icon}
        </div>
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {isCurrency ? formatCurrencyMWK(numericValue) : 
           typeof value === 'number' ? <AnimatedCounter value={numericValue} /> : value}
        </p>
        <p className={`text-sm font-medium ${colors.text} mt-1`}>{title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
};

// Quick Action Tile
const ActionTile: React.FC<{ 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  href: string; 
  color: string;
}> = ({ icon, title, description, href, color }) => {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 
        bg-white dark:bg-gray-800 p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
    >
      <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10 ${color}`} />
      <div className={`inline-flex p-3 rounded-lg ${color} text-white shadow-md group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="mt-4 font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
      <div className="mt-4 flex items-center text-sm font-medium text-red-600 dark:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
        <span>Access</span>
        <IconMapper name="ArrowRight" size={16} className="ml-1" />
      </div>
    </Link>
  );
};

// Recharts type assertions
const ResponsiveContainerFixed = ResponsiveContainer as unknown as React.ComponentType<any>;
const CartesianGridFixed = CartesianGrid as unknown as React.ComponentType<any>;
const XAxisFixed = XAxis as unknown as React.ComponentType<any>;
const YAxisFixed = YAxis as unknown as React.ComponentType<any>;
const AreaFixed = Area as unknown as React.ComponentType<any>;
const LineFixed = Line as unknown as React.ComponentType<any>;
const TooltipFixed = Tooltip as unknown as React.ComponentType<any>;
const AreaChartFixed = AreaChart as unknown as React.ComponentType<any>;
type Props = {
  invoicesSummary?: any;
  expensesSummary?: any;
  months?: string[];
  monthlyRevenue?: number[];
  monthlyExpenses?: number[];
  budgets?: any[];
  recent?: any[];
  kpis?: any;
  aging?: any;
  topCategories?: { category: string; total: number }[];
};

export default function FinanceDashboard(props: Props) {
  const {
    auth = {} as any,
    invoicesSummary = {},
    expensesSummary = {},
    months = [],
    monthlyRevenue = [],
    monthlyExpenses = [],
    budgets = [],
    recent = [],
    kpis = {},
    aging = {},
    topCategories = [],
  } = props as any;

  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'activity'>('overview');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalData, setModalData] = useState<any | null>(null);

  const paidTotal = Number(invoicesSummary.paid || 0);
  const approvedExpensesTotal = Number(expensesSummary.approved || 0);
  const netCashflow = paidTotal - approvedExpensesTotal;
  const overdueCount = Number(invoicesSummary.overdue_count || 0);
  const overdueAmount = Number(invoicesSummary.overdue_amount || 0);
  
  const roles = (auth?.user as any)?.roles ?? [];
  const isAdmin = Array.isArray(roles) ? roles.includes('admin') || roles.includes('super_admin') : (roles === 'admin' || roles === 'super_admin');

  const budgetStats = useMemo(() => {
    const list = budgets || [];
    let exceeded = 0;
    let critical = 0;
    list.forEach((b: any) => {
      const pct = Number(b.percentageSpent || 0);
      if (b.isExceeded) {
        exceeded += 1;
      } else if (pct >= 80) {
        critical += 1;
      }
    });
    return { total: list.length, exceeded, critical };
  }, [budgets]);

  const chartData = useMemo(() => {
    return (months as string[]).map((month: string, idx: number) => ({
      name: month,
      revenue: monthlyRevenue[idx] || 0,
      expenses: monthlyExpenses[idx] || 0,
    }));
  }, [months, monthlyRevenue, monthlyExpenses]);

  const formatPercent = (value: number) => `${Math.round((value || 0) * 100)}%`;

  const handleChartClick = (data: any) => {
    if (data && data.activeLabel) {
      const idx = months.indexOf(data.activeLabel);
      if (idx >= 0) {
        handleMonthClick(idx);
      }
    }
  };

  const handleMonthClick = async (index: number) => {
    const label = months[index];
    if (!label) return;
    const parts = label.split(' ');
    const monthName = parts[0];
    const year = Number(parts[1]);
    const month = new Date(`${monthName} 1, ${year}`).getMonth() + 1;

    setModalTitle(`Details — ${label}`);
    setModalOpen(true);
    setModalData(null);

    try {
      const res = await fetch(`/finance/drilldown/month/${year}/${month}`, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error('Failed to load');
      const json = await res.json();
      setModalData(json);
    } catch (e) {
      setModalData({ error: 'Could not load details.' });
    }
  };

  const handleBudgetClick = async (budgetId: number, budgetName?: string) => {
    setModalTitle(`Budget — ${budgetName ?? budgetId}`);
    setModalOpen(true);
    setModalData(null);
    try {
      const res = await fetch(`/finance/drilldown/budget/${budgetId}`, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error('Failed to load');
      const json = await res.json();
      setModalData(json);
    } catch (e) {
      setModalData({ error: 'Could not load budget details.' });
    }
  };

  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <FinanceLayout title="Finance Dashboard" user={auth?.user}>
      <Head title="Finance Dashboard" />
      
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-red-900 via-red-800 to-red-900 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Finance Dashboard</h1>
              <p className="text-red-200 dark:text-gray-400 mt-1">
                Financial overview and analytics • {formatTime(currentTime)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-sm font-medium border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse" />
                System Active
              </span>
            </div>
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <p className="text-red-200 dark:text-gray-400 text-sm">Net Cashflow</p>
              <p className={`text-2xl font-bold ${netCashflow >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {formatCurrencyMWK(netCashflow)}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <p className="text-red-200 dark:text-gray-400 text-sm">Paid Revenue</p>
              <p className="text-2xl font-bold text-emerald-400">{formatCurrencyMWK(paidTotal)}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <p className="text-red-200 dark:text-gray-400 text-sm">Approved Expenses</p>
              <p className="text-2xl font-bold text-amber-400">{formatCurrencyMWK(approvedExpensesTotal)}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <p className="text-red-200 dark:text-gray-400 text-sm">Overdue</p>
              <p className="text-2xl font-bold text-red-400">{overdueCount} ({formatCurrencyMWK(overdueAmount)})</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: 'LayoutDashboard' },
              { id: 'analytics', label: 'Analytics', icon: 'BarChart3' },
              { id: 'activity', label: 'Activity', icon: 'Activity' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-red-600 text-red-600 dark:border-red-400 dark:text-red-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <IconMapper name={tab.icon} size={18} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <QuickRequisitionModal />
        <RequisitionSummary />

        {activeTab === 'overview' && (
          <div className="space-y-6 animate-slideUp">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={<IconMapper name="file-text" className="h-6 w-6" />}
                title="Total Invoiced"
                value={invoicesSummary.total || 0}
                subtitle="All time invoices"
                color="blue"
                isCurrency
              />
              <StatCard
                icon={<IconMapper name="check-circle" className="h-6 w-6" />}
                title="Paid"
                value={invoicesSummary.paid || 0}
                subtitle="Revenue collected"
                color="green"
                isCurrency
              />
              <StatCard
                icon={<IconMapper name="clock" className="h-6 w-6" />}
                title="Unpaid"
                value={invoicesSummary.unpaid || 0}
                subtitle="Pending payments"
                color="amber"
                isCurrency
              />
              <StatCard
                icon={<IconMapper name="alert-triangle" className="h-6 w-6" />}
                title="Overdue"
                value={overdueCount}
                subtitle={formatCurrencyMWK(overdueAmount)}
                color="red"
              />
            </div>

            {/* Action Tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <ActionTile
                icon={<IconMapper name="file-plus" className="h-6 w-6" />}
                title="New Invoice"
                description="Create and send invoice"
                href={route('finance.invoices.create')}
                color="bg-blue-600"
              />
              <ActionTile
                icon={<IconMapper name="trending-down" className="h-6 w-6" />}
                title="New Requisition"
                description="Submit expense request"
                href={route('finance.expenses.create')}
                color="bg-red-600"
              />
              <ActionTile
                icon={<IconMapper name="pie-chart" className="h-6 w-6" />}
                title="Budgets"
                description="View and manage budgets"
                href={route('finance.budgets.index')}
                color="bg-purple-600"
              />
              <ActionTile
                icon={<IconMapper name="users" className="h-6 w-6" />}
                title="Payroll"
                description="Process payroll"
                href={route('finance.payroll.index')}
                color="bg-emerald-600"
              />
            </div>

            {/* My Requisitions + Last Payroll */}
            {(props as any).myRequisitions || (props as any).lastPayroll ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(props as any).myRequisitions && (
                  <Card className="p-5 dark:bg-gray-800 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">My Requisitions</h3>
                    <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                      {formatCurrencyMWK((props as any).myRequisitions.this_month_total || 0)}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">This month</p>
                    <div className="mt-4 flex gap-6">
                      <div>
                        <span className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                          {Number((props as any).myRequisitions.pending_count || 0)}
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Pending</p>
                      </div>
                      <div>
                        <span className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
                          {Number((props as any).myRequisitions.approved_count || 0)}
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Approved</p>
                      </div>
                      <div>
                        <span className="text-2xl font-semibold text-red-600 dark:text-red-400">
                          {Number((props as any).myRequisitions.rejected_count || 0)}
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Rejected</p>
                      </div>
                    </div>
                  </Card>
                )}
                {(props as any).lastPayroll && (
                  <Card className="p-5 dark:bg-gray-800 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Last Payroll</h3>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-800 text-xs font-medium dark:bg-emerald-900/30 dark:text-emerald-300">
                        {(props as any).lastPayroll.status}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {(props as any).lastPayroll.period_start} → {(props as any).lastPayroll.period_end}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Gross Total</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {formatCurrencyMWK(Number((props as any).lastPayroll.gross_total || 0))}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Net Total</p>
                        <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                          {formatCurrencyMWK(Number((props as any).lastPayroll.net_total || 0))}
                        </p>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            ) : null}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-slideUp">
            {/* KPI Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <StatCard
                icon={<IconMapper name="file-text" className="h-5 w-5" />}
                title="Invoices"
                value={kpis.invoices_count || 0}
                subtitle="Total count"
                color="blue"
              />
              {isAdmin && (
                <StatCard
                  icon={<IconMapper name="clock" className="h-5 w-5" />}
                  title="Pending Approvals"
                  value={kpis.pending_expenses_count || 0}
                  subtitle="Awaiting review"
                  color="amber"
                />
              )}
              <StatCard
                icon={<IconMapper name="calculator" className="h-5 w-5" />}
                title="Avg Invoice"
                value={kpis.avg_invoice || 0}
                subtitle="Per invoice"
                color="cyan"
                isCurrency
              />
              <StatCard
                icon={<IconMapper name="percent" className="h-5 w-5" />}
                title="Collection Rate"
                value={formatPercent(kpis.collection_rate || 0)}
                subtitle="Paid vs invoiced"
                color="green"
              />
              <StatCard
                icon={<IconMapper name="calendar" className="h-5 w-5" />}
                title="Due Next 30d"
                value={kpis.upcoming_due_30d || 0}
                subtitle="Upcoming payments"
                color="purple"
                isCurrency
              />
            </div>

            {/* Revenue Chart */}
            <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Revenue vs Expenses (Last 12 months)
              </h2>
              <div className="h-80">
                <ResponsiveContainerFixed width="100%" height="100%">
                  <AreaChartFixed data={chartData} onClick={handleChartClick}>
                    <CartesianGridFixed strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                    <XAxisFixed dataKey="name" stroke="#6B7280" fontSize={12} />
                    <YAxisFixed stroke="#6B7280" fontSize={12} tickFormatter={(v: number) => `MWK ${(v / 1000000).toFixed(1)}M`} />
                    <TooltipFixed 
                      contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                      formatter={(value: number) => formatCurrencyMWK(value)}
                    />
                    <AreaFixed 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#10b981" 
                      fill="#10b981" 
                      fillOpacity={0.1}
                      strokeWidth={2}
                      name="Revenue (Paid)"
                    />
                    <AreaFixed 
                      type="monotone" 
                      dataKey="expenses" 
                      stroke="#ef4444" 
                      fill="#ef4444" 
                      fillOpacity={0.1}
                      strokeWidth={2}
                      name="Expenses (Approved)"
                    />
                  </AreaChartFixed>
                </ResponsiveContainerFixed>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">Click on chart points to drill down</p>
            </Card>

            {/* Budgets & A/R Aging */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="p-5 dark:bg-gray-800 dark:border-gray-700 lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Active Budgets</h3>
                  {budgets.length > 0 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {budgetStats.exceeded} exceeded / {budgetStats.critical} at risk
                    </span>
                  )}
                </div>
                <div className="space-y-3">
                  {budgets.length === 0 && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No active budgets</div>
                  )}
                  {budgets.map((b: any) => {
                    const pct = Number(b.percentageSpent || 0);
                    const isExceeded = !!b.isExceeded;
                    const isCritical = !isExceeded && pct >= 80;
                    return (
                      <div 
                        key={b.id} 
                        className={`p-4 rounded-lg border ${
                          isExceeded 
                            ? 'border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10' 
                            : isCritical 
                              ? 'border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10'
                              : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{b.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{b.category}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{formatCurrencyMWK(b.budgeted_amount || 0)}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Budgeted</p>
                          </div>
                        </div>
                        <div className="mt-3">
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              style={{ width: `${Math.min(100, pct)}%` }}
                              className={`h-2 rounded-full ${isExceeded ? 'bg-red-500' : isCritical ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            />
                          </div>
                          <div className="flex justify-between mt-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400">{pct.toFixed(0)}% used</span>
                            <span className="text-xs font-medium">{formatCurrencyMWK(b.spent || 0)} spent</span>
                          </div>
                        </div>
                        {isExceeded && (
                          <p className="text-xs text-red-600 dark:text-red-400 mt-2 font-medium">Budget exceeded</p>
                        )}
                        {!isExceeded && isCritical && (
                          <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 font-medium">At or above 80% of budget</p>
                        )}
                        <button 
                          onClick={() => handleBudgetClick(b.id, b.name)}
                          className="mt-2 text-xs px-3 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                        >
                          View details
                        </button>
                      </div>
                    );
                  })}
                </div>
              </Card>

              <Card className="p-5 dark:bg-gray-800 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">A/R Aging</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Current', value: aging.current || 0, color: 'text-emerald-600 dark:text-emerald-400' },
                    { label: '1–30 days', value: aging.one_to_30 || 0, color: 'text-blue-600 dark:text-blue-400' },
                    { label: '31–60 days', value: aging.thirty_one_to_60 || 0, color: 'text-amber-600 dark:text-amber-400' },
                    { label: '61–90 days', value: aging.sixty_one_to_90 || 0, color: 'text-orange-600 dark:text-orange-400' },
                    { label: '90+ days', value: aging.over_90 || 0, color: 'text-red-600 dark:text-red-400' },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{item.label}</span>
                      <span className={`font-medium ${item.color}`}>{formatCurrencyMWK(item.value)}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-6 animate-slideUp">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="p-5 dark:bg-gray-800 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {recent.length === 0 && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No recent finance activity</div>
                  )}
                  {recent.map((r: any, idx: number) => (
                    <div 
                      key={`${r.type}-${r.id}-${idx}`} 
                      className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {r.type === 'expense' ? 'Requisition' : 'Invoice'} #{r.id}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {r.user ? `${r.user} • ` : ''}{r.date}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${r.type === 'expense' ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {formatCurrencyMWK(r.amount || 0)}
                        </p>
                        {r.status && (
                          <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                            {r.status}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-5 dark:bg-gray-800 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Top Requisition Categories</h3>
                {topCategories.length === 0 ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No data available</div>
                ) : (
                  <div className="space-y-2">
                    {topCategories.map((c: { category: string; total: number }, idx: number) => (
                      <div 
                        key={c.category} 
                        className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold dark:bg-red-900/30 dark:text-red-400">
                            {idx + 1}
                          </span>
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {String(c.category).replace(/_/g, ' ')}
                          </span>
                        </div>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {formatCurrencyMWK(c.total)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}
      </div>

      <FinanceDrilldownPanel open={modalOpen} title={modalTitle} data={modalData} onClose={() => setModalOpen(false)} />
    </FinanceLayout>
  );
}


