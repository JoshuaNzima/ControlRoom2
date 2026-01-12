/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import { formatDateMW, LOCALE_MW } from '@/Components/format';
import { Head, Link, router } from '@inertiajs/react';
import SuperAdminLayout from '@/Layouts/SuperAdminLayout';
import ModuleCard from '@/Components/ModuleCard';
import { route } from 'ziggy-js';
import IconMapper from '@/Components/IconMapper';
import QRCodeGenerator from '@/Components/QRCodeGenerator';
import RequisitionSummary from '@/Components/Requisitions/RequisitionSummary';
import useCounters from '@/Hooks/useCounters';
import EmptyState from '@/Components/ui/empty-state';

// Type Definitions
interface Auth {
  user: {
    id: number;
    name: string;
    email: string;
  };
}

interface SystemStats {
  total_users: number;
  active_users: number;
  total_guards: number;
  active_guards: number;
  database_size: string;
  cache_size: string;
}

interface Module {
  id: number;
  display_name: string;
  version: string;
  is_active: boolean;
  is_core: boolean;
  description: string;
  icon: string;
  category: string;
  route: string;
  order: number;
}

interface SystemHealth {
  php_version: string;
  laravel_version: string;
  database: string;
  cache: string;
  storage_free: string;
  memory_usage: string;
  uptime: string;
}

interface Log {
  message: string;
  time: string;
}

interface UserActivity {
  name: string;
  role: string;
  last_active: string;
}

interface DatabaseInfo {
  tables: number;
  records: number;
}

interface AuditTrail {
  user: string;
  action: string;
  time: string;
  ip: string;
}

interface AdminAction {
  route: string;
  icon: React.ReactNode;
  color: string;
  title: string;
  description: string;
}

interface SuperAdminDashboardProps {
  auth: Auth;
  systemStats: SystemStats;
  modules: Module[];
  systemHealth: SystemHealth;
  recentLogs: Log[];
  userActivity: UserActivity[];
  databaseInfo: DatabaseInfo;
  auditTrail: AuditTrail[];
  adminActions: AdminAction[];
  isSuperAdmin: boolean;
  isMaintenance?: boolean;
  canSeePendingAdmin?: boolean;
  canSeeFinanceApprovals?: boolean;
}

interface SystemStatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtitle: string;
  color: string;
}

interface HealthCardProps {
  label: string;
  value: string;
  status: boolean;
}

interface SparklineProps {
  values?: number[];
}

// Helper Components
const SystemStatCard: React.FC<SystemStatCardProps> = ({ icon, title, value, subtitle, color }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-red-100 dark:border-gray-700">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300">
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
        </div>
      </div>
    </div>
  );
};

const Sparkline: React.FC<SparklineProps> = ({ values }) => {
  if (!values || values.length === 0) return null;
  const width = 80;
  const height = 24;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const points = values.map((v, i) => {
    const x = values.length === 1 ? width / 2 : (width / (values.length - 1)) * i;
    const y = max === min ? height / 2 : height - ((v - min) / Math.max(max - min, 1)) * height;
    return { x, y };
  });
  const d = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mt-2 w-full h-5 text-red-500 dark:text-red-300">
      <path d={d} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const HealthCard: React.FC<HealthCardProps> = ({ label, value, status }) => {
  return (
    <div className="bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</span>
        <span className={`w-2 h-2 rounded-full ${status ? 'bg-green-500' : 'bg-yellow-500'}`} />
      </div>
      <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  );
};

// Main Component
const Dashboard: React.FC<SuperAdminDashboardProps> = ({
  auth,
  systemStats,
  modules,
  systemHealth,
  recentLogs,
  userActivity,
  databaseInfo,
  auditTrail,
  adminActions,
  isSuperAdmin,
  isMaintenance,
  canSeePendingAdmin,
  canSeeFinanceApprovals,
}) => {
  const { counters } = useCounters();
  const [kpiHistory, setKpiHistory] = React.useState<Record<string, number[]>>({});

  React.useEffect(() => {
    if (!counters) return;
    const keys = [
      'notifications_unread',
      'requisitions_my_open',
      'requisitions_needs_revision',
      'requisitions_pending_admin',
      'finance_approvals_pending',
      'finance_expenses_pending_mine',
      'control_tickets_open',
      'control_incidents_open',
      'control_flags_pending',
      'control_downs_active',
      'alerts_active',
      'assets_handovers_outstanding',
    ];
    setKpiHistory((prev) => {
      const next: Record<string, number[]> = { ...prev };
      keys.forEach((key) => {
        const raw = (counters as any)?.[key];
        const v = Number(raw ?? 0);
        const series = next[key] ?? [];
        if (series.length === 0 || series[series.length - 1] !== v) {
          next[key] = [...series.slice(-19), v];
        }
      });
      return next;
    });
  }, [counters]);

  const isDbOk = systemHealth.database === 'Connected';
  const isCacheOk = systemHealth.cache === 'Working';
  const isHealthy = isDbOk && isCacheOk;
  const isDegraded = !isHealthy && (isDbOk || isCacheOk);
  const statusLabel = isHealthy ? 'Operational' : isDegraded ? 'Degraded' : 'Issue';
  const statusColor = isHealthy ? 'bg-emerald-500' : isDegraded ? 'bg-amber-500' : 'bg-red-600';
  const handleToggleModule = (moduleId: number) => {
    router.post(route('superadmin.modules.toggle', { module: moduleId }));
  };

  const handleClearCache = () => {
    if (confirm('Clear all system caches?')) {
      router.post(route('superadmin.cache.clear'));
    }
  };

  const modulesByCategory = React.useMemo(() => {
    return modules.reduce((acc, module) => {
      const category = module.category || 'system';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(module);
      return acc;
    }, {} as Record<string, Module[]>);
  }, [modules]);

  return (
    <SuperAdminLayout title="Super Admin Dashboard" user={auth.user}>
      <Head title="Super Admin Dashboard" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Header with Admin Badge */}
        <div className="bg-gradient-to-r from-red-700 via-rose-600 to-pink-600 rounded-2xl shadow-2xl p-8 text-white">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
                <div className="flex items-center gap-3 mb-2 min-w-0">
                  <IconMapper name="Shield" size={40} />
                  <h1 className="text-2xl sm:text-4xl font-black break-words">Super Admin Control Center</h1>
                </div>
              <p className="text-red-100">Complete system access and control</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-sm opacity-90">System Status</p>
              <div className="mt-1 inline-flex items-center gap-2 rounded-full px-3 py-1 bg-white/10 backdrop-blur text-xs font-medium">
                <span className={`inline-block h-2 w-2 rounded-full ${statusColor}`} />
                <span>{statusLabel}</span>
              </div>
            </div>
          </div>
        </div>

        {/* KPIs at a glance */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-red-100 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400">Unread Notifications</div>
            <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{Number(counters?.notifications_unread || 0)}</div>
            <Sparkline values={kpiHistory['notifications_unread']} />
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-red-100 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400">My Requisitions</div>
            <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{Number(counters?.requisitions_my_open || 0)}</div>
            <Sparkline values={kpiHistory['requisitions_my_open']} />
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-red-100 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400">Needs Revision</div>
            <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{Number(counters?.requisitions_needs_revision || 0)}</div>
            <Sparkline values={kpiHistory['requisitions_needs_revision']} />
          </div>
          {canSeePendingAdmin && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-red-100 dark:border-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400">Pending Admin</div>
              <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{Number(counters?.requisitions_pending_admin || 0)}</div>
              <Sparkline values={kpiHistory['requisitions_pending_admin']} />
            </div>
          )}
          {canSeeFinanceApprovals && (
            <>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-red-100 dark:border-gray-700">
                <div className="text-xs text-gray-500 dark:text-gray-400">Finance Approvals</div>
                <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{Number(counters?.finance_approvals_pending || 0)}</div>
                <Sparkline values={kpiHistory['finance_approvals_pending']} />
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-red-100 dark:border-gray-700">
                <div className="text-xs text-gray-500 dark:text-gray-400">My Expenses Pending</div>
                <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{Number(counters?.finance_expenses_pending_mine || 0)}</div>
                <Sparkline values={kpiHistory['finance_expenses_pending_mine']} />
              </div>
            </>
          )}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-red-100 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400">Tickets Open</div>
            <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{Number(counters?.control_tickets_open || 0)}</div>
            <Sparkline values={kpiHistory['control_tickets_open']} />
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-red-100 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400">Incidents Open</div>
            <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{Number(counters?.control_incidents_open || 0)}</div>
            <Sparkline values={kpiHistory['control_incidents_open']} />
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-red-100 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400">Flags Pending</div>
            <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{Number(counters?.control_flags_pending || 0)}</div>
            <Sparkline values={kpiHistory['control_flags_pending']} />
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-red-100 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400">Downs Active</div>
            <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{Number(counters?.control_downs_active || 0)}</div>
            <Sparkline values={kpiHistory['control_downs_active']} />
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-red-100 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400">Alerts Active</div>
            <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{Number(counters?.alerts_active || 0)}</div>
            <Sparkline values={kpiHistory['alerts_active']} />
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-red-100 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400">Asset Handovers</div>
            <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{Number(counters?.assets_handovers_outstanding || 0)}</div>
            <Sparkline values={kpiHistory['assets_handovers_outstanding']} />
          </div>
        </div>

        <RequisitionSummary />

        {/* System Statistics */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">System Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SystemStatCard
              icon={<IconMapper name="Server" size={24} />}
              title="Total Users"
              value={systemStats.total_users}
              subtitle={`${systemStats.active_users} active`}
              color="blue"
            />
            <SystemStatCard
              icon={<IconMapper name="Shield" size={24} />}
              title="Total Guards"
              value={systemStats.total_guards}
              subtitle={`${systemStats.active_guards} active`}
              color="green"
            />
            <SystemStatCard
              icon={<IconMapper name="Database" size={24} />}
              title="Database Size"
              value={systemStats.database_size}
              subtitle={`${databaseInfo.tables} tables`}
              color="purple"
            />
            <SystemStatCard
              icon={<IconMapper name="Cpu" size={24} />}
              title="Cache Size"
              value={systemStats.cache_size}
              subtitle="Redis memory"
              color="orange"
            />
          </div>
        </div>

        {/* System Health */}
        {isSuperAdmin && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">System Health</h2>
              <button
                onClick={() => router.reload({ only: ['systemHealth'] })}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                <IconMapper name="RefreshCw" size={20} />
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <HealthCard label="PHP Version" value={systemHealth.php_version} status={true} />
              <HealthCard label="Laravel" value={systemHealth.laravel_version} status={true} />
              <HealthCard label="Database" value={systemHealth.database} status={true} />
              <HealthCard label="Cache" value={systemHealth.cache} status={true} />
              <HealthCard label="Storage Free" value={systemHealth.storage_free} status={true} />
              <HealthCard label="Memory Usage" value={systemHealth.memory_usage} status={true} />
              <HealthCard label="Uptime" value={systemHealth.uptime} status={true} />
              <HealthCard
                label="Records"
                value={databaseInfo.records.toLocaleString('en-MW')}
                status={true}
              />
            </div>
          </div>
        )}

        {/* Quick Admin Actions */}
        {isSuperAdmin && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(adminActions || []).length === 0 ? (
                <div className="col-span-full">
                  <EmptyState
                    title="No quick actions"
                    description="No admin actions are configured for this dashboard."
                    size="sm"
                    variant="card"
                  />
                </div>
              ) : (
                adminActions.map((action) => (
                  <Link
                    key={action.route}
                    href={route(action.route)}
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-xl transition-all transform hover:-translate-y-1 text-center group border border-red-100 dark:border-gray-700"
                  >
                    <div
                      className={`w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform`}
                      style={{ backgroundColor: `${action.color}20` }}
                    >
                      {action.icon}
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm mb-1">{action.title}</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{action.description}</p>
                  </Link>
                ))
              )}
            </div>
          </div>
        )}

        {/* Modules by Category */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Available Modules</h2>
          {(modules || []).length === 0 ? (
            <EmptyState
              title="No modules"
              description="No modules are available for this environment."
              variant="card"
            />
          ) : (
            Object.entries(modulesByCategory).map(([category, categoryModules]) => (
              <div key={category} className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 capitalize">
                  {category.replace('_', ' ')} Modules
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categoryModules.map((module) => (
                    <div
                      key={module.id}
                      className={`p-6 rounded-xl shadow-md border transition-all ${
                        module.is_active
                          ? 'border-red-300 bg-white dark:bg-gray-800 hover:shadow-xl hover:-translate-y-1'
                          : 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900/30'
                      }`}
                      role="group"
                      aria-label={`${module.display_name} module card`}
                    >
                      <div className="text-center">
                        <div className="mb-2 flex items-center justify-center">
                          <IconMapper name={module.icon || 'Puzzle'} size={36} />
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg mb-1">{module.display_name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">v{module.version}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{module.description}</p>
                        {module.is_core && (
                          <p className="text-xs text-red-600 dark:text-red-300 mt-2">Core module</p>
                        )}
                      </div>
                      <div className="mt-4 flex items-center justify-center">
                        <button
                          onClick={() => handleToggleModule(module.id)}
                          className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium shadow ${
                            module.is_active
                              ? 'bg-rose-600 hover:bg-rose-700 text-white'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                          }`}
                          aria-pressed={module.is_active}
                        >
                          {module.is_active ? 'Disable' : 'Enable'}
                        </button>
                        {(() => {
                          if (!module.is_active || !module.route) return null;
                          let href = '#';
                          try { href = route(module.route) as unknown as string; } catch (e) { href = '#'; }
                          if (href === '#') return null;
                          return (
                            <Link
                              href={href}
                              className="ml-3 inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                              Open
                            </Link>
                          );
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* QR Code Generator */}
        <QRCodeGenerator />

        {/* Bottom Grid: User Activity, Logs, Audit Trail */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4">Recent User Activity</h3>
            {(userActivity || []).length === 0 ? (
              <EmptyState title="No recent activity" description="No user activity recorded yet." size="sm" contentClassName="px-0" />
            ) : (
              <div className="space-y-3">
                {userActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{activity.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{activity.role}</p>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-400">{activity.last_active}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4">Recent System Logs</h3>
            {(recentLogs || []).length === 0 ? (
              <EmptyState title="No logs" description="No recent system logs available." size="sm" contentClassName="px-0" />
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {recentLogs.map((log, index) => (
                  <div key={index} className="p-2 bg-gray-50 dark:bg-gray-900/30 rounded text-xs">
                    <p className="text-gray-700 dark:text-gray-300 truncate">{log.message}</p>
                    <p className="text-gray-400 dark:text-gray-500 text-[10px]">{log.time}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4">Audit Trail</h3>
            {(auditTrail || []).length === 0 ? (
              <EmptyState title="No audit events" description="No audit trail events recorded yet." size="sm" contentClassName="px-0" />
            ) : (
              <div className="space-y-3">
                {auditTrail.map((audit, index) => (
                  <div key={index} className="p-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{audit.user}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{audit.action}</p>
                    <div className="flex justify-between mt-1">
                      <p className="text-xs text-gray-400 dark:text-gray-500">{audit.time}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{audit.ip}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-50 dark:bg-red-950/30 border-2 border-red-300 dark:border-red-900 rounded-xl p-6">
          <h2 className="text-xl font-bold text-red-900 dark:text-red-200 mb-4">Danger Zone</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={handleClearCache}
              className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-bold transition"
            >
              Clear All Caches
            </button>
            {!isMaintenance ? (
              <button
                onClick={() => router.post(route('superadmin.maintenance.enable'))}
                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold transition"
              >
                Enable Maintenance
              </button>
            ) : (
              <button
                onClick={() => {
                  if (confirm('Disable maintenance mode?')) {
                    router.post(route('superadmin.maintenance.disable'))
                  }
                }}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition"
              >
                Disable Maintenance
              </button>
            )}
            <Link
              href={route('superadmin.backup')}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition text-center"
            >
              Backup Database
            </Link>
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
};

export default Dashboard;
