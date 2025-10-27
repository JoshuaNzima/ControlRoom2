import React from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Card } from '@/Components/ui/card';
import IconMapper from '@/Components/IconMapper';
import { formatCurrencyMWK } from '@/Components/format';
import { Button } from '@/Components/ui/button';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, AreaChart, Area, BarChart, Bar } from 'recharts';
import QRCodeGenerator from '@/Components/QRCodeGenerator';

// Type assertions for Recharts components to fix React 18 compatibility
const ResponsiveContainerFixed = ResponsiveContainer as React.ComponentType<any>;
const LineChartFixed = LineChart as React.ComponentType<any>;
const AreaChartFixed = AreaChart as React.ComponentType<any>;
const BarChartFixed = BarChart as React.ComponentType<any>;
const CartesianGridFixed = CartesianGrid as React.ComponentType<any>;
const XAxisFixed = XAxis as React.ComponentType<any>;
const YAxisFixed = YAxis as React.ComponentType<any>;
const TooltipFixed = Tooltip as React.ComponentType<any>;
const LineFixed = Line as React.ComponentType<any>;
const AreaFixed = Area as React.ComponentType<any>;
const BarFixed = Bar as React.ComponentType<any>;

type Stats = {
  total_guards?: number;
  active_guards?: number;
  on_duty_today?: number;
  total_users?: number;
  active_clients?: number;
  total_sites?: number;
  shifts_today?: number;
  attendance_rate?: number;
};

type AttendancePoint = { date: string; present: number; absent?: number };
type CoveragePoint = { date: string; coverage: number };
type GuardStats = { active?: number; inactive?: number; suspended?: number };
type Activity = { id: string | number; message: string; time: string; type: string };
type TopGuard = { name: string; employee_id: string; attendance_rate: number };
type SystemHealth = { database?: string; cache?: string; queue?: string; storage?: number };
type QuickAction = { title: string; description: string; route: string; icon?: string; color?: string };
type AuthShape = { user?: { name?: string } };
type KPIs = {
  hr?: any;
  hr_users?: any;
  hr_guards?: any;
  finance?: any;
  it?: any;
  control_room?: any;
  operations?: any;
  k9?: any;
  administration?: any;
  cross_module?: any;
};

interface Props {
  stats?: Stats;
  attendanceTrend?: AttendancePoint[];
  zoneCoverage?: CoveragePoint[];
  guardStats?: GuardStats;
  recentActivity?: Activity[];
  topGuards?: TopGuard[];
  kpis?: KPIs;
  coverageSummary?: {
    guards_deployed_today?: number;
    guards_required_total?: number;
    sites_covered_today?: number;
    sites_total?: number;
    guards_coverage_pct?: number;
    sites_coverage_pct?: number;
    clients_with_outstanding?: number;
    outstanding_value?: number;
    clients_total?: number;
  };
  auth?: AuthShape;
  paymentsSummary?: {
    clients_with_outstanding?: number;
    outstanding_value?: number;
    total_clients?: number;
  };
}

export default function Dashboard({
  stats = {},
  attendanceTrend = [],
  zoneCoverage = [],
  guardStats = {},
  recentActivity = [],
  topGuards = [],
  kpis = {},
  coverageSummary = {},
  auth = {},
  paymentsSummary = undefined,
}: Props) {
  const [showClientManagement, setShowClientManagement] = React.useState(true);
  const [showZoneHero, setShowZoneHero] = React.useState(true);
  const [showCoverageCards, setShowCoverageCards] = React.useState(true);
  const [showRecent, setShowRecent] = React.useState(true);
  return (
    <AdminLayout title="Admin Dashboard" user={auth?.user as any}>
      <Head title="Admin Dashboard" />

      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Client Management Overview */}
          <Card className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Client Management</h1>
                <p className="text-gray-600">Overview of client services and performance</p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" asChild>
                  <a href={route('admin.payments.index')}>
                    <IconMapper name="DollarSign" className="w-5 h-5 mr-2" />
                    View Payments
                  </a>
                </Button>
                <Button asChild>
                  <a href={route('admin.clients.create')} className="flex items-center">
                    <IconMapper name="Plus" className="w-5 h-5 mr-2" />
                    Add Client
                  </a>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-blue-900">Total Clients</h3>
                  <IconMapper name="Users" className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-2xl font-bold text-blue-900">{kpis.finance?.total_clients || 0}</p>
                <p className="text-sm text-blue-700 mt-1">Active accounts</p>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-green-900">Active Sites</h3>
                  <IconMapper name="MapPin" className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-2xl font-bold text-green-900">{coverageSummary.sites_total || 0}</p>
                <p className="text-sm text-green-700 mt-1">Managed locations</p>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-yellow-900">Monthly Revenue</h3>
                  <IconMapper name="DollarSign" className="w-5 h-5 text-yellow-500" />
                </div>
                <p className="text-2xl font-bold text-yellow-900">
                  {formatCurrencyMWK(kpis.finance?.mtd_revenue || 0)}
                </p>
                <p className="text-sm text-yellow-700 mt-1">Month to date</p>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-red-900">Overdue Payments</h3>
                  <IconMapper name="AlertCircle" className="w-5 h-5 text-red-500" />
                </div>
                <p className="text-2xl font-bold text-red-900">
                  {kpis.finance?.clients_with_outstanding || 0}
                </p>
                <p className="text-sm text-red-700 mt-1">Require attention</p>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" asChild className="h-auto py-3 flex flex-col items-center justify-center gap-2">
                    <a href={route('admin.clients.index')}>
                      <IconMapper name="Users" className="w-5 h-5" />
                      <span>View Clients</span>
                    </a>
                  </Button>
                  <Button variant="outline" asChild className="h-auto py-3 flex flex-col items-center justify-center gap-2">
                    <a href={route('admin.services.index')}>
                      <IconMapper name="Package" className="w-5 h-5" />
                      <span>Manage Services</span>
                    </a>
                  </Button>
                  <Button variant="outline" asChild className="h-auto py-3 flex flex-col items-center justify-center gap-2">
                    <a href={route('admin.reports.index')}>
                      <IconMapper name="FileText" className="w-5 h-5" />
                      <span>View Reports</span>
                    </a>
                  </Button>
                  <Button variant="outline" asChild className="h-auto py-3 flex flex-col items-center justify-center gap-2">
                    <a href={route('admin.settings.index')}>
                      <IconMapper name="Settings" className="w-5 h-5" />
                      <span>Settings</span>
                    </a>
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Client Activity</h3>
                <div className="space-y-3">
                  {recentActivity.filter(a => a.type === 'client').slice(0, 3).map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg border bg-white">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{activity.message}</div>
                        <div className="text-xs text-gray-500">{activity.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Zone Coverage - Hero (collapsible) */}
          <Card className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">Zone Coverage</h1>
                <button
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm transition ${showZoneHero ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  onClick={() => setShowZoneHero(!showZoneHero)}
                  aria-expanded={showZoneHero}
                >
                  {showZoneHero ? 'Hide' : 'Show'}
                </button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Refresh</Button>
                <Button size="sm" onClick={() => window.location.href = route('reports.index')}>View Reports</Button>
                <Button size="sm" onClick={() => window.location.href = route('admin.payments.index')}>Payments Checker</Button>
              </div>
            </div>
            {/* Payments Summary */}
            <div className="mb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 rounded-lg border bg-white">
                  <div className="text-xs text-gray-500">Clients With Outstanding</div>
                  <div className="text-2xl font-bold text-gray-900">{(paymentsSummary?.clients_with_outstanding ?? kpis.finance?.clients_with_outstanding ?? coverageSummary.clients_with_outstanding) || 0}</div>
                </div>
                <div className="p-3 rounded-lg border bg-white">
                  <div className="text-xs text-gray-500">Outstanding Value</div>
                  <div className="text-2xl font-bold text-gray-900">{formatCurrencyMWK(paymentsSummary?.outstanding_value ?? kpis.finance?.outstanding_value ?? coverageSummary.outstanding_value ?? 0)}</div>
                </div>
                <div className="p-3 rounded-lg border bg-white">
                  <div className="text-xs text-gray-500">Total Clients</div>
                  <div className="text-2xl font-bold text-gray-900">{paymentsSummary?.total_clients ?? kpis.finance?.total_clients ?? coverageSummary.clients_total ?? 0}</div>
                </div>
              </div>
            </div>
            {showZoneHero && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <ClickableStat label="Total Guards" value={stats.total_guards} routeName="guards.index" />
                  <ClickableStat label="Active Guards" value={stats.active_guards} routeName="guards.index" />
                  <Stat label="On Duty Now" value={stats.on_duty_today} trend="" />
                  <Stat label="Attendance Rate" value={`${stats.attendance_rate ?? 0}%`} trend="" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Attendance (7 days)</h3>
                    <ResponsiveContainerFixed width="100%" height={260}>
                      <LineChartFixed data={attendanceTrend}>
                        <CartesianGridFixed strokeDasharray="3 3" />
                        <XAxisFixed dataKey="date" />
                        <YAxisFixed allowDecimals={false} />
                        <TooltipFixed />
                        <LineFixed type="monotone" dataKey="present" stroke="#10b981" name="Present" strokeWidth={2} />
                        <LineFixed type="monotone" dataKey="absent" stroke="#ef4444" name="Absent" strokeWidth={2} />
                      </LineChartFixed>
                    </ResponsiveContainerFixed>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Coverage (7 days)</h3>
                    <ResponsiveContainerFixed width="100%" height={260}>
                      <AreaChartFixed data={zoneCoverage}>
                        <defs>
                          <linearGradient id="coverage" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGridFixed strokeDasharray="3 3" />
                        <XAxisFixed dataKey="date" />
                        <YAxisFixed domain={[0, 100]} tickFormatter={(v: any) => `${v}%`} />
                        <TooltipFixed formatter={(v: any) => `${v}%`} />
                        <AreaFixed type="monotone" dataKey="coverage" stroke="#6366f1" fillOpacity={1} fill="url(#coverage)" />
                      </AreaChartFixed>
                    </ResponsiveContainerFixed>
                  </div>
                </div>
              </>
            )}
          </Card>

          {/* Coverage Summary Cards (collapsible) */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Coverage Summary</h2>
                <p className="text-xs text-gray-500 mt-1">Today’s guards and sites coverage across all zones</p>
              </div>
              <button
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm transition ${showCoverageCards ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                onClick={() => setShowCoverageCards(!showCoverageCards)}
                aria-expanded={showCoverageCards}
                aria-controls="coverage-summary-content"
              >
                {showCoverageCards ? 'Hide' : 'Show'}
              </button>
            </div>
            {showCoverageCards && (
            <div id="coverage-summary-content" className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Guards Coverage</h2>
              <div className="grid grid-cols-2 gap-4">
                <ClickableStat label="Deployed Today" value={coverageSummary.guards_deployed_today ?? 0} routeName="guards.index" />
                <ClickableStat label="Required (Total)" value={coverageSummary.guards_required_total ?? 0} routeName="zone.dashboard" />
                <div className="col-span-2">
                  <ResponsiveContainerFixed width="100%" height={200}>
                    <BarChartFixed data={[{ name: 'Coverage', value: coverageSummary.guards_coverage_pct ?? 0 }] }>
                      <CartesianGridFixed strokeDasharray="3 3" />
                      <XAxisFixed dataKey="name" />
                      <YAxisFixed domain={[0, 100]} tickFormatter={(v: any) => `${v}%`} />
                      <TooltipFixed formatter={(v: any) => `${v}%`} />
                      <BarFixed dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} />
                    </BarChartFixed>
                  </ResponsiveContainerFixed>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Sites Coverage</h2>
              <div className="grid grid-cols-2 gap-4">
                <ClickableStat label="Sites Covered Today" value={coverageSummary.sites_covered_today ?? 0} routeName="clients.index" />
                <ClickableStat label="Total Sites" value={coverageSummary.sites_total ?? 0} routeName="clients.index" />
                <div className="col-span-2">
                  <ResponsiveContainerFixed width="100%" height={200}>
                    <BarChartFixed data={[{ name: 'Coverage', value: coverageSummary.sites_coverage_pct ?? 0 }] }>
                      <CartesianGridFixed strokeDasharray="3 3" />
                      <XAxisFixed dataKey="name" />
                      <YAxisFixed domain={[0, 100]} tickFormatter={(v: any) => `${v}%`} />
                      <TooltipFixed formatter={(v: any) => `${v}%`} />
                      <BarFixed dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} />
                    </BarChartFixed>
                  </ResponsiveContainerFixed>
                </div>
              </div>
            </Card>
            </div>
            )}
          </Card>


          {/* Collapsible KPI Sections */}
          <KpiSection title="HR - System Users" subtitle="User accounts overview" data={kpis.hr_users} items={[
            { label: 'Total Users', key: 'total_users' },
            { label: 'Active Users', key: 'active_users' },
            { label: 'Inactive Users', key: 'inactive_users' },
            { label: 'New Hires (Month)', key: 'new_hires_this_month' },
            { label: 'Turnover Rate', key: 'turnover_rate', suffix: '%' },
            { label: 'Pending Leave Requests', key: 'pending_leave_requests' },
            { label: 'Training Compliance', key: 'training_compliance', suffix: '%' },
          ]} />

          <KpiSection title="HR - Guards" subtitle="Guard workforce overview" data={kpis.hr_guards} items={[
            { label: 'Total Guards', key: 'total_guards' },
            { label: 'Active Guards', key: 'active_guards' },
            { label: 'Inactive Guards', key: 'inactive_guards' },
            { label: 'Suspended Guards', key: 'suspended_guards' },
            { label: 'New Guards (Month)', key: 'new_guards_this_month' },
            { label: 'Turnover Rate', key: 'turnover_rate', suffix: '%' },
          ]} />

          <KpiSection title="Finance" subtitle="Month-to-date financial KPIs" data={kpis.finance} items={[
            { label: 'Outstanding Payroll', key: 'outstanding_payroll', prefix: '$' },
            { label: 'Expenses (MTD)', key: 'mtd_expenses', prefix: '$' },
            { label: 'Budget (MTD)', key: 'mtd_budget', prefix: '$' },
            { label: 'Unpaid Invoices (Count)', key: 'unpaid_invoices_count' },
            { label: 'Unpaid Invoices (Value)', key: 'unpaid_invoices_value', prefix: '$' },
            { label: 'Cash Flow', key: 'cash_flow_indicator' },
          ]} />

          <KpiSection title="IT" subtitle="Systems and support status" data={kpis.it} items={[
            { label: 'Uptime (30d)', key: 'uptime_30d', suffix: '%' },
            { label: 'Open Tickets', key: 'open_tickets' },
            { label: 'Critical Alerts', key: 'critical_alerts' },
            { label: 'Pending Updates', key: 'pending_updates' },
            { label: 'Suspicious Logins', key: 'suspicious_logins' },
          ]} />

          <KpiSection title="Control Room" subtitle="Operations and monitoring" data={kpis.control_room} items={[
            { label: 'Active Incidents', key: 'active_incidents' },
            { label: 'Resolved Incidents', key: 'resolved_incidents' },
            { label: 'Guards On Duty', key: 'guards_on_duty' },
            { label: 'Cameras Online', key: 'cameras_online' },
            { label: 'Cameras Offline', key: 'cameras_offline' },
            { label: 'Dispatches Today', key: 'dispatches_today' },
            { label: 'Avg Response (min)', key: 'avg_response_time_min' },
          ]} />

          <KpiSection title="Operations" subtitle="Contracts, shifts and reports" data={kpis.operations} items={[
            { label: 'Active Contracts', key: 'active_contracts' },
            { label: 'Expired Contracts', key: 'expired_contracts' },
            { label: 'Shift Coverage', key: 'shift_coverage_pct', suffix: '%' },
            { label: 'Guards On Duty', key: 'guards_on_duty' },
            { label: 'Field Reports Pending', key: 'field_reports_pending' },
            { label: 'Incidents Today', key: 'operational_incidents_today' },
          ]} />

          <KpiSection title="K9 Unit" subtitle="Readiness and activities" data={kpis.k9} items={[
            { label: 'Active K9s', key: 'active_k9s' },
            { label: 'On Patrol', key: 'k9_on_patrol' },
            { label: 'Training Sessions (Month)', key: 'training_sessions_month' },
            { label: 'Medical Checkups Pending', key: 'medical_checkups_pending' },
            { label: 'K9 Incidents (Month)', key: 'k9_incidents_month' },
          ]} />

          <KpiSection title="Administration" subtitle="Assets, users and compliance" data={kpis.administration} items={[
            { label: 'Assets Active', key: 'assets_active' },
            { label: 'Assets Depreciated', key: 'assets_depreciated' },
            { label: 'Pending Approvals', key: 'pending_approvals' },
            { label: 'Users Total', key: 'system_users_total' },
            { label: 'Users Active', key: 'system_users_active' },
            { label: 'Users Inactive', key: 'system_users_inactive' },
            { label: 'New Documents (Month)', key: 'documents_new_month' },
            { label: 'Compliance Updates Pending', key: 'compliance_updates_pending' },
          ]} />

          <KpiSection title="System-Wide KPIs" subtitle="Cross-module signals" data={kpis.cross_module} items={[
            { label: 'Critical Alerts Today', key: 'critical_alerts_today' },
            { label: 'Overall Incident Trend', key: 'overall_incident_trend' },
            { label: 'Financial Health', key: 'financial_health' },
            { label: 'Employee Utilization', key: 'employee_utilization_pct', suffix: '%' },
            { label: 'Resource Utilization', key: 'resource_utilization' },
            { label: 'Security Incidents Open', key: 'security_status_open_incidents' },
          ]} />

          {/* QR Code Generator */}
          <QRCodeGenerator />

          {/* Recent Activity (collapsible) */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">Recent Activity</h2>
                <p className="text-xs text-gray-500 mt-1">Latest events across the platform</p>
              </div>
              <button className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm transition ${showRecent ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`} onClick={() => setShowRecent(!showRecent)} aria-expanded={showRecent}>{showRecent ? 'Hide' : 'Show'}</button>
            </div>
            {showRecent && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {(recentActivity || []).length === 0 && (
                <p className="text-sm text-gray-500">No recent activity</p>
              )}
              {(recentActivity || []).map((item: Activity) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border bg-white">
                  <div>
                    <div className="font-medium text-gray-900">{item.message}</div>
                    <div className="text-xs text-gray-500">{item.time}</div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">{item.type}</span>
                </div>
              ))}
            </div>
            )}
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

function Stat({ label, value, trend }: { label: string; value?: number | string; trend?: string }) {
  return (
    <div className="p-4 rounded-lg border bg-white">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-2xl font-bold text-gray-900">{value ?? 0}</div>
    </div>
  );
}

function Health({ name, status }: { name: string; status: string | number | undefined }) {
  const ok = typeof status === 'string' ? status === 'healthy' : (status ?? 0) > 50;
  return (
    <div className={`p-4 rounded-lg border ${ok ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
      <div className="text-xs text-gray-500">{name}</div>
      <div className="text-sm font-semibold text-gray-900">{String(status)}</div>
    </div>
  );
}

function ClickableStat({ label, value, routeName }: { label: string; value?: number | string; routeName: string }) {
  return (
    <button onClick={() => window.location.href = route(routeName)} className="text-left p-4 rounded-lg border bg-white hover:bg-gray-50 transition">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-2xl font-bold text-gray-900">{value ?? 0}</div>
    </button>
  );
}

type KpiItem = { label: string; key: string; prefix?: string; suffix?: string };
function KpiSection({ title, subtitle = '', data = {}, items = [] as KpiItem[], linkMap = {} as Record<string, string> }: { title: string; subtitle?: string; data?: Record<string, any>; items?: KpiItem[]; linkMap?: Record<string, string> }) {
  const [open, setOpen] = React.useState(true);
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <button className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm transition ${open ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`} onClick={() => setOpen(!open)} aria-expanded={open}>{open ? 'Hide' : 'Show'}</button>
      </div>
      {open && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {items.map((i) => {
            const rawValue = data?.[i.key] ?? 0;
            const isCurrency = i.prefix === '$';
            const display = isCurrency ? formatCurrencyMWK(Number(rawValue)) : `${i.prefix ?? ''}${rawValue}${i.suffix ?? ''}`;
            const content = (
              <>
                <div className="text-xs text-gray-500">{i.label}</div>
                <div className="text-xl font-bold text-gray-900">{display}</div>
              </>
            );
            const routeName = linkMap[i.key];
            return routeName ? (
              <button key={i.key} onClick={() => window.location.href = route(routeName)} className="text-left p-4 rounded-lg border bg-white hover:bg-gray-50 transition">
                {content}
              </button>
            ) : (
              <div key={i.key} className="p-4 rounded-lg border bg-white">{content}</div>
            );
          })}
        </div>
      )}
    </Card>
  );
}