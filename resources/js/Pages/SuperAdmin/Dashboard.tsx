/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import { formatDateMW, LOCALE_MW } from '@/Components/format';
import { Head, Link, router } from '@inertiajs/react';
import SuperAdminLayout from '@/Layouts/SuperAdminLayout';
import ModuleCard from '@/Components/ModuleCard';
import { route } from 'ziggy-js';
import {
  Server,
  Database,
  Cpu,
  Clock,
  Shield,
  RefreshCw,
} from 'lucide-react';
import QRCodeGenerator from '@/Components/QRCodeGenerator';

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
  icon: React.ReactNode;
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

// Helper Components
const SystemStatCard: React.FC<SystemStatCardProps> = ({ icon, title, value, subtitle, color }) => {
  return (
    <div className={`bg-white rounded-xl shadow-md p-6 border-l-4 border-${color}-500`}>
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg bg-${color}-100 text-${color}-600`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
      </div>
    </div>
  );
};

const HealthCard: React.FC<HealthCardProps> = ({ label, value, status }) => {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-600">{label}</span>
        <span className={`w-2 h-2 rounded-full ${status ? 'bg-green-500' : 'bg-yellow-500'}`} />
      </div>
      <p className="text-lg font-semibold text-gray-900">{value}</p>
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
}) => {
  const handleToggleModule = (moduleId: number) => {
    router.post(route('superadmin.modules.toggle', { id: moduleId }));
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
    <SuperAdminLayout title="Control Room Dashboard" user={auth.user}>
      <Head title="Super Admin Dashboard" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Header with Admin Badge */}
        <div className="bg-gradient-to-r from-red-700 via-rose-600 to-pink-600 rounded-2xl shadow-2xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Shield size={40} />
                <h1 className="text-4xl font-black">Super Admin Control Center</h1>
              </div>
              <p className="text-red-100">Complete system access and control</p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-90">System Status</p>
              <p className="text-2xl font-bold">Operational</p>
            </div>
          </div>
        </div>

        {/* System Statistics */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">System Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SystemStatCard
              icon={<Server size={24} />}
              title="Total Users"
              value={systemStats.total_users}
              subtitle={`${systemStats.active_users} active`}
              color="blue"
            />
            <SystemStatCard
              icon={<Shield size={24} />}
              title="Total Guards"
              value={systemStats.total_guards}
              subtitle={`${systemStats.active_guards} active`}
              color="green"
            />
            <SystemStatCard
              icon={<Database size={24} />}
              title="Database Size"
              value={systemStats.database_size}
              subtitle={`${databaseInfo.tables} tables`}
              color="purple"
            />
            <SystemStatCard
              icon={<Cpu size={24} />}
              title="Cache Size"
              value={systemStats.cache_size}
              subtitle="Redis memory"
              color="orange"
            />
          </div>
        </div>

        {/* System Health */}
        {isSuperAdmin && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">System Health</h2>
              <button
                onClick={() => router.reload({ only: ['systemHealth'] })}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <RefreshCw size={20} />
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
            <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {adminActions.map((action) => (
                <Link
                  key={action.route}
                  href={route(action.route)}
                  className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all transform hover:-translate-y-1 text-center group"
                >
                  <div
                    className={`w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform`}
                    style={{ backgroundColor: `${action.color}20` }}
                  >
                    {action.icon}
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm mb-1">{action.title}</h3>
                  <p className="text-xs text-gray-600">{action.description}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Modules by Category */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Available Modules</h2>
          {Object.entries(modulesByCategory).map(([category, categoryModules]) => (
            <div key={category} className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 capitalize">
                {category.replace('_', ' ')} Modules
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryModules.map((module) => {
                  const moduleRoute = module.is_active && module.route ? route(module.route) : '#';
                  return (
                    <Link
                      key={module.id}
                      href={moduleRoute}
                      className={`block p-6 rounded-xl shadow-md border-2 transition-all text-center ${
                        module.is_active
                          ? 'border-indigo-400 bg-white hover:shadow-xl hover:-translate-y-1'
                          : 'border-gray-200 bg-gray-100 opacity-60 cursor-not-allowed'
                      }`}
                      tabIndex={module.is_active ? 0 : -1}
                      aria-disabled={!module.is_active}
                    >
                      <div className="text-4xl mb-2">{module.icon}</div>
                      <h3 className="font-bold text-gray-900 text-lg mb-1">{module.display_name}</h3>
                      <p className="text-xs text-gray-500 mb-2">v{module.version}</p>
                      <p className="text-xs text-gray-600">{module.description}</p>
                      {module.is_core && (
                        <p className="text-xs text-red-600 mt-2">Core module</p>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* QR Code Generator */}
        <QRCodeGenerator />

        {/* Bottom Grid: User Activity, Logs, Audit Trail */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="font-bold text-gray-900 mb-4">Recent User Activity</h3>
            <div className="space-y-3">
              {userActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{activity.name}</p>
                    <p className="text-xs text-gray-500">{activity.role}</p>
                  </div>
                  <p className="text-xs text-gray-400">{activity.last_active}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="font-bold text-gray-900 mb-4">Recent System Logs</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {recentLogs.map((log, index) => (
                <div key={index} className="p-2 bg-gray-50 rounded text-xs">
                  <p className="text-gray-700 truncate">{log.message}</p>
                  <p className="text-gray-400 text-[10px]">{log.time}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="font-bold text-gray-900 mb-4">Audit Trail</h3>
            <div className="space-y-3">
              {auditTrail.map((audit, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">{audit.user}</p>
                  <p className="text-xs text-gray-600">{audit.action}</p>
                  <div className="flex justify-between mt-1">
                    <p className="text-xs text-gray-400">{audit.time}</p>
                    <p className="text-xs text-gray-400">{audit.ip}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6">
          <h2 className="text-xl font-bold text-red-900 mb-4">Danger Zone</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={handleClearCache}
              className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-bold transition"
            >
              Clear All Caches
            </button>
            <button
              onClick={() => router.post(route('superadmin.maintenance.enable'))}
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold transition"
            >
              Enable Maintenance
            </button>
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
