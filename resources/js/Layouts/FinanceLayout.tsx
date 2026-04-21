import React from 'react';
import { Link, Head, router, usePage } from '@inertiajs/react';
import IconMapper from '@/Components/IconMapper';
import NotificationBell from '@/Components/Common/NotificationBell';
import { User, PageProps } from '@/types';
import { useTheme } from '@/Providers/ThemeProvider';
import QuickRequisitionButton from '@/Components/Requisitions/QuickRequisitionButton';
import QuickBudgetButton from '@/Components/Budgets/QuickBudgetButton';
import useCounters from '@/Hooks/useCounters';
import FloatingNavButton from '@/Components/FloatingNavButton';
import WeeklyTasks from '@/Components/WeeklyTasks';
import TutorialSection from '@/Components/Tutorials/TutorialSection';
import { motion, AnimatePresence } from 'framer-motion';
import useGpsAlerts from '@/Hooks/useGpsAlerts';
import { useRealtimeNotifications } from '@/Hooks/useRealtimeNotifications';

interface Props {
  title: string;
  children: React.ReactNode;
  user?: User;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  current: boolean;
  badge?: string;
}

// Quick Stats Component for Header
const QuickStats: React.FC = () => {
  const { counters } = useCounters();
  const stats = [
    { label: 'Approvals', value: (Number(counters?.requisitions_pending_admin || 0) + Number(counters?.finance_approvals_pending || 0)), color: 'bg-amber-500' },
    { label: 'Open Downs', value: counters?.control_downs_active || 0, color: 'bg-red-500' },
    { label: 'Messages', value: counters?.notifications_unread || 0, color: 'bg-blue-500' },
  ].filter(s => s.value > 0);

  if (stats.length === 0) return null;

  return (
    <div className="hidden lg:flex items-center gap-2 mr-4">
      {stats.map((stat) => (
        <div key={stat.label} className={`${stat.color} text-white px-3 py-1 rounded-full text-xs font-medium`}>
          {stat.value} {stat.label}
        </div>
      ))}
    </div>
  );
};

export default function FinanceLayout({ title, children, user }: Props) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [tasksOpen, setTasksOpen] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);
  const [logoOk, setLogoOk] = React.useState<boolean>(true);
  const { theme, toggle } = useTheme();
  const page = usePage<PageProps>();
  const { counters, weeklyTasks, isExecutiveAssistant, appName } = usePage().props as any;

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useGpsAlerts();
  const currentUser = (page?.props?.auth?.user as any) as (User & { roles?: (string | { id: number; name: string })[]; permissions?: string[] }) | undefined;
  const permissions = currentUser?.permissions ?? [];
  const rawRoles = (currentUser?.roles ?? []) as (string | { id: number; name: string })[];
  const roles = rawRoles.map((r) => (typeof r === 'string' ? r : r.name));

  // Initialize real-time notifications
  useRealtimeNotifications({ userId: currentUser?.id, userRoles: roles });

  const isAdminUser = roles.includes('admin') || roles.includes('super_admin');
  const isGuard = roles.includes('guard');
  const isClient = roles.includes('client');
  const isFinanceUser = roles.some((r) => ['super_admin', 'finance_officer', 'accountant', 'finance', 'accounting', 'admin'].includes(String(r)));
  const canViewPayroll = isFinanceUser || isAdminUser;
  const canViewAllInvoices = isFinanceUser || isAdminUser;
  const canViewAllPayments = isFinanceUser || isAdminUser;
  const allowedRoles = ['admin', 'super_admin', 'finance_officer', 'accountant'];
  const hasRoleApproval = roles.some((r) => allowedRoles.includes(String(r)));
  const hasPermApproval = permissions.some((p) => (
    p === 'approve_expense' || p === 'manage_expense' || p === 'finance.approvals'
  ));
  const canApproveRequisitions = hasRoleApproval || hasPermApproval;

  const safeRoute = (name: string, fallback: string) => {
    try { return route(name) as unknown as string; } catch { return fallback; }
  };
  const normalizePath = (href: string) => {
    try { return new URL(href, window.location.origin).pathname; } catch { return href; }
  };
  const isCurrent = (href: string) => {
    try {
      const hrefPath = new URL(href, window.location.origin).pathname;
      return window.location.pathname === hrefPath;
    } catch {
      return window.location.pathname === href;
    }
  };

  // Main Finance Navigation (role-based)
  const financeLinks: NavItem[] = [
    { name: 'Dashboard', href: safeRoute('finance.dashboard', '/finance'), icon: <IconMapper name="home" className="h-6 w-6" />, current: isCurrent(safeRoute('finance.dashboard', '/finance')) },
    ...(canViewAllInvoices ? [
      { name: 'Invoices', href: safeRoute('finance.invoices.index', '/finance/invoices'), icon: <IconMapper name="file-text" className="h-6 w-6" />, current: isCurrent(safeRoute('finance.invoices.index', '/finance/invoices')) }
    ] : []),
    ...(canViewAllPayments ? [
      { name: 'Payments', href: safeRoute('finance.payments.index', '/finance/payments'), icon: <IconMapper name="check-square" className="h-6 w-6" />, current: isCurrent(safeRoute('finance.payments.index', '/finance/payments')) }
    ] : []),
    ...(canViewPayroll ? [
      { name: 'Payroll', href: safeRoute('finance.payroll.index', '/finance/payroll'), icon: <IconMapper name="users" className="h-6 w-6" />, current: isCurrent(safeRoute('finance.payroll.index', '/finance/payroll')) }
    ] : []),
  ];

  // Directory & Reference Links
  const directoryLinks: NavItem[] = [
    { name: 'Clients', href: safeRoute('admin.clients.index', '/admin/clients'), icon: <IconMapper name="building" className="h-6 w-6" />, current: isCurrent(safeRoute('admin.clients.index', '/admin/clients')) },
    { name: 'Guard Directory', href: safeRoute('admin.guards.index', '/admin/guards'), icon: <IconMapper name="shield" className="h-6 w-6" />, current: isCurrent(safeRoute('admin.guards.index', '/admin/guards')) },
  ];

  // Budget & Requisitions
  const managementLinks: NavItem[] = [
    { name: 'Requisitions', href: route('requisitions.index') as unknown as string, icon: <IconMapper name="clipboard-list" className="h-6 w-6" />, current: isCurrent(route('requisitions.index') as unknown as string), badge: (()=>{ const n = Number(counters?.requisitions_my_open||0); return n>0? String(n): undefined; })() },
    { name: 'Expenses', href: safeRoute('finance.expenses.index', '/finance/expenses'), icon: <IconMapper name="trending-down" className="h-6 w-6" />, current: isCurrent(safeRoute('finance.expenses.index', '/finance/expenses')), badge: (()=>{ const n = Number(counters?.finance_approvals_pending || counters?.finance_expenses_pending_mine || 0); return n>0? String(n): undefined; })() },
    { name: 'Quotations', href: safeRoute('finance.quotations.index', '/finance/quotations'), icon: <IconMapper name="file-text" className="h-6 w-6" />, current: isCurrent(safeRoute('finance.quotations.index', '/finance/quotations')) },
    { name: 'Budgets', href: safeRoute('finance.budgets.index', '/finance/budgets'), icon: <IconMapper name="pie-chart" className="h-6 w-6" />, current: isCurrent(safeRoute('finance.budgets.index', '/finance/budgets')) },
  ];

  const handleLogout = (e: React.FormEvent) => {
    e.preventDefault();
    router.post(route('logout'));
  };

  return (
    <div className="min-h-screen bg-red-50 dark:bg-gray-900">
      <Head title={title} />

      {/* Sidebar overlay for mobile */}
      <div
        className={`fixed inset-0 bg-red-900 bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-70 z-40 md:hidden ${sidebarOpen ? 'block' : 'hidden'}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 bottom-0 flex flex-col w-64 bg-red-900 dark:bg-gray-950 text-white transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 transition-transform duration-300 ease-in-out z-50`}
      >
        {/* Logo / App Name */}
        <div className="flex items-center flex-shrink-0 px-4 py-5 border-b border-red-800 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
              <IconMapper name="wallet" className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight text-white">Finance</h1>
              <p className="text-xs text-red-200 dark:text-gray-400">{appName}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-y-auto">
          <nav className="flex-1 px-2 py-4 space-y-8">
            <div className="space-y-1">
              <h3 className="px-3 text-xs font-semibold text-red-200 dark:text-gray-400 uppercase tracking-wider">Finance</h3>
              {financeLinks.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${item.current ? 'bg-red-800 text-white dark:bg-gray-800' : 'text-red-100 hover:bg-red-800 hover:text-white dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'}`}
                >
                  {item.icon}
                  <span className="ml-3">{item.name}</span>
                  {item.badge && (
                    <span className="ml-auto inline-block py-0.5 px-2 text-xs font-medium rounded-full bg-white/10 text-white">{item.badge}</span>
                  )}
                </Link>
              ))}
            </div>

            <div className="space-y-1">
              <h3 className="px-3 text-xs font-semibold text-red-200 dark:text-gray-400 uppercase tracking-wider">Management</h3>
              {managementLinks.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${item.current ? 'bg-red-800 text-white dark:bg-gray-800' : 'text-red-100 hover:bg-red-800 hover:text-white dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'}`}
                >
                  {item.icon}
                  <span className="ml-3">{item.name}</span>
                  {item.badge && (
                    <span className="ml-auto inline-block py-0.5 px-2 text-xs font-medium rounded-full bg-white/10 text-white">{item.badge}</span>
                  )}
                </Link>
              ))}
            </div>

            <div className="space-y-1">
              <h3 className="px-3 text-xs font-semibold text-red-200 dark:text-gray-400 uppercase tracking-wider">Directory</h3>
              {directoryLinks.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${item.current ? 'bg-red-800 text-white dark:bg-gray-800' : 'text-red-100 hover:bg-red-800 hover:text-white dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'}`}
                >
                  {item.icon}
                  <span className="ml-3">{item.name}</span>
                  {item.badge && (
                    <span className="ml-auto inline-block py-0.5 px-2 text-xs font-medium rounded-full bg-white/10 text-white">{item.badge}</span>
                  )}
                </Link>
              ))}
            </div>
          </nav>
        </div>

        <div className="flex-shrink-0 border-t border-red-800 dark:border-gray-800 p-4 bg-red-900 dark:bg-gray-950">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-red-800 dark:bg-gray-800 border-2 border-red-700 dark:border-gray-700 flex items-center justify-center text-white font-semibold text-sm">
              {user?.name?.charAt(0) || 'F'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs border font-medium bg-red-500/20 text-red-200 border-red-500/30">
                {Array.isArray(roles) ? roles[0] : 'Finance User'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={route('finance.profile') as unknown as string}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-gray-800 px-3 py-2 text-xs font-medium text-white hover:bg-gray-700 transition-colors"
            >
              <IconMapper name="User" size={14} />
              Profile
            </Link>
            <form method="POST" action={route('logout')} onSubmit={handleLogout} className="flex-1">
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-md bg-red-700 px-3 py-2 text-xs font-medium text-white hover:bg-red-600 transition-colors"
              >
                <IconMapper name="LogOut" size={14} />
                Logout
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        {/* Top bar */}
        <div className="sticky top-0 z-30 border-b border-red-100 bg-white/95 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/80">
          <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-8 py-2 sm:py-3">
            <div className="flex items-center justify-between gap-2 sm:gap-3">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <button
                  type="button"
                  className="h-10 w-10 inline-flex items-center justify-center rounded-md text-red-700 hover:bg-red-100 hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-coin-600 md:hidden touch-target-min"
                  onClick={() => setSidebarOpen(true)}
                >
                  <span className="sr-only">Open sidebar</span>
                  <IconMapper name="menu" className="h-6 w-6" />
                </button>
                <h1 className="text-lg sm:text-xl font-semibold text-red-900 dark:text-gray-100 truncate">{title}</h1>
              </div>
              <div className="flex items-center justify-end gap-1 sm:gap-4 shrink-0">
                <QuickStats />
                <NotificationBell />
                <button
                  onClick={() => setTasksOpen(!tasksOpen)}
                  className="inline-flex items-center gap-1.5 rounded-md bg-red-100 text-red-700 hover:bg-red-200 px-2 sm:px-3 py-1.5 text-xs sm:text-sm dark:bg-red-900/30 dark:text-red-200 transition-colors touch-target-min"
                  title="Toggle Tasks Panel"
                >
                  <IconMapper name="CheckSquare" size={16} />
                  <span className="hidden sm:inline">Tasks</span>
                </button>
                <div className="hidden sm:flex items-center gap-4">
                  <QuickBudgetButton />
                </div>
                {Array.isArray(roles) && roles.includes('super_admin') && (
                  <Link
                    href={route('superadmin.dashboard') as unknown as string}
                    className="inline-flex items-center gap-2 rounded-md bg-red-700 px-2 py-2 sm:px-3 sm:py-1.5 text-sm font-medium text-white hover:bg-red-600"
                  >
                    <IconMapper name="shield" className="h-4 w-4" />
                    <span className="hidden sm:inline">Super Admin</span>
                    <span className="sm:hidden">SA</span>
                  </Link>
                )}
                <button
                  onClick={toggle}
                  className="rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                >
                  {theme === 'dark' ? (
                    <IconMapper name="sun" className="h-5 w-5" />
                  ) : (
                    <IconMapper name="moon" className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <div className="py-4 sm:py-6 px-2 sm:px-4 md:px-6 lg:px-8">
            <AnimatePresence mode="wait">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className={`grid gap-4 ${tasksOpen ? 'grid-cols-1 xl:grid-cols-4' : 'grid-cols-1'}`}
              >
                <div className={tasksOpen ? 'xl:col-span-3' : ''}>
                  <TutorialSection dashboard="admin" canManage={false} />
                  {children}
                </div>
                {tasksOpen && !isMobile && (
                  <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 50 }}
                    transition={{ duration: 0.3 }}
                    className="xl:col-span-1 hidden xl:block"
                  >
                    <WeeklyTasks
                      tasks={weeklyTasks || []}
                      showModule={true}
                      isExecutiveAssistant={isExecutiveAssistant}
                    />
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
        {tasksOpen && isMobile && (
          <WeeklyTasks
            tasks={weeklyTasks || []}
            showModule={true}
            isExecutiveAssistant={isExecutiveAssistant}
            isOpen={tasksOpen}
            onClose={() => setTasksOpen(false)}
          />
        )}
        <FloatingNavButton />
      </div>
    </div>
  );
}
