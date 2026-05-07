import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import BaseShell from './BaseShell';
import IconMapper from '@/Components/IconMapper';
import { User } from '@/types';
import { useTheme } from '@/Providers/ThemeProvider';
import QuickRequisitionButton from '@/Components/Requisitions/QuickRequisitionButton';
import QuickBudgetButton from '@/Components/Budgets/QuickBudgetButton';
import NotificationBell from '@/Components/Common/NotificationBell';
import useCounters from '@/Hooks/useCounters';
import { useRealtimeNotifications } from '@/Hooks/useRealtimeNotifications';
import WeeklyTasks from '@/Components/WeeklyTasks';
import AIAssistant from '@/Components/AI/AIAssistant';
import { NavSection, SidebarHeader, UserSection, QuickStats } from '@/Components/Layout';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  title: string;
  children: React.ReactNode;
  user?: User;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  badge?: string | number;
}

export default function HRLayout({ title, children, user }: Props) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [tasksOpen, setTasksOpen] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);
  const { theme, toggle } = useTheme();
  const { counters } = useCounters();
  const { weeklyTasks, isExecutiveAssistant, appName } = usePage().props as any;

  const isCurrent = (href: string) => {
    try {
      const hrefPath = new URL(href, window.location.origin).pathname;
      return window.location.pathname === hrefPath;
    } catch {
      return window.location.pathname === href;
    }
  };

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const roles = (() => {
    const r: any = (user as any)?.roles;
    if (Array.isArray(r)) return r.map(String);
    if (typeof r === 'string' && r.length) return [r];
    return [] as string[];
  })();

  // Initialize real-time notifications
  const userId = (user as any)?.id;
  useRealtimeNotifications({ userId, userRoles: roles });

  const isAdminUser = roles.includes('admin') || roles.includes('super_admin');
  const isSuperAdmin = roles.includes('super_admin');
  const roleDisplay = (() => {
    const r: any = (user as any)?.roles;
    if (Array.isArray(r) && r.length) {
      const first = r[0];
      const name = typeof first === 'string' ? first : first?.name;
      return String(name).replaceAll('_', ' ');
    }
    if (typeof r === 'string') return String(r).replaceAll('_', ' ');
    return 'HR';
  })();

  // Main HR Navigation
  const hrLinks: NavItem[] = [
    { name: 'Dashboard', href: route('hr.dashboard'), icon: <IconMapper name="LayoutDashboard" size={20} /> },
    { name: 'Employees', href: route('hr.employees.index'), icon: <IconMapper name="Users" size={20} /> },
    { name: 'Downs', href: route('hr.downs.index'), icon: <IconMapper name="AlertTriangle" size={20} />, badge: counters?.control_downs_active },
    { name: 'Roster', href: route('hr.leaves'), icon: <IconMapper name="Calendar" size={20} /> },
    { name: 'Careers', href: route('hr.jobs.index'), icon: <IconMapper name="Megaphone" size={20} /> },
  ];

  // Development & Benefits
  const developmentLinks: NavItem[] = [
    { name: 'Training', href: route('hr.training'), icon: <IconMapper name="GraduationCap" size={20} /> },
    { name: 'Benefits', href: route('hr.benefits.index'), icon: <IconMapper name="Gift" size={20} /> },
    { name: 'Medical', href: route('hr.medical.index'), icon: <IconMapper name="Stethoscope" size={20} /> },
    { name: 'Pensions', href: route('hr.pensions.index'), icon: <IconMapper name="Banknote" size={20} /> },
    // { name: 'Compensation', href: route('hr.compensation.index'), icon: <IconMapper name="DollarSign" size={20} /> },
  ];

  // Management & Compliance
  const managementLinks: NavItem[] = [
    // { name: 'Incentive Settings', href: route('hr.incentive-settings.index'), icon: <IconMapper name="Settings" size={20} /> },
    // { name: 'Supervisor Incentives', href: route('hr.supervisor-incentives.index'), icon: <IconMapper name="Award" size={20} /> },
    // { name: 'Safety', href: route('hr.safety.index'), icon: <IconMapper name="Shield" size={20} /> },
    { name: 'Policies', href: route('hr.policies.index'), icon: <IconMapper name="FileText" size={20} /> },
    { name: 'Disciplinary', href: route('hr.disciplinary.index'), icon: <IconMapper name="AlertTriangle" size={20} /> },
  ];

  // Tools
  const toolsLinks: NavItem[] = [
    ...(!isAdminUser ? ([
      { name: 'My Requisitions', href: route('requisitions.index'), icon: <IconMapper name="ClipboardList" size={20} />, badge: counters?.requisitions_my_open },
    ] as NavItem[]) : []),
    { name: 'Budgets', href: route('budgets.index'), icon: <IconMapper name="PieChart" size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-red-50 dark:bg-gray-900 overflow-x-hidden">
      <Head title={title} />

      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 bg-red-900/50 dark:bg-gray-900/70 z-40 md:hidden ${sidebarOpen ? 'block' : 'hidden'}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 bottom-0 flex flex-col w-64 bg-red-900 dark:bg-gray-950 text-white transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 transition-transform duration-300 ease-in-out z-50`}
      >
        <SidebarHeader title="Human Resources" appName={appName} iconName="Users2" />

        <nav className="flex-1 px-3 py-2 space-y-6 overflow-y-auto">
          <NavSection title="HR" items={hrLinks} isCurrent={isCurrent} />
          <NavSection title="Development & Benefits" items={developmentLinks} isCurrent={isCurrent} />
          <NavSection title="Management & Compliance" items={managementLinks} isCurrent={isCurrent} />
          <NavSection title="Tools" items={toolsLinks} isCurrent={isCurrent} />
        </nav>

        <UserSection
          user={user}
          roleDisplay={roleDisplay}
          profileRoute="hr.profile"
          showSuperAdmin={isSuperAdmin}
          superAdminRoute="superadmin.dashboard"
        />
      </div>

      {/* Main Content */}
      <div className="md:pl-64">
        {/* Header */}
        <div className="sticky top-0 z-30 border-b border-red-100 bg-white/95 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/80">
          <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-8 py-2 sm:py-3">
            <div className="flex items-center justify-between gap-2 sm:gap-3">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <button
                  type="button"
                  className="h-10 w-10 inline-flex items-center justify-center rounded-md text-red-700 hover:bg-red-100 hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-600 md:hidden touch-target-min"
                  onClick={() => setSidebarOpen(true)}
                >
                  <span className="sr-only">Open sidebar</span>
                  <IconMapper name="Menu" size={24} />
                </button>
                <h1 className="text-lg sm:text-xl font-semibold text-red-900 dark:text-gray-100 truncate">{title}</h1>
              </div>
              <div className="flex items-center justify-end gap-1 sm:gap-3">
                <QuickStats />
                <NotificationBell />
                <button
                  onClick={() => setTasksOpen(!tasksOpen)}
                  className="inline-flex items-center gap-1.5 rounded-md bg-coin-100 text-coin-700 hover:bg-coin-200 px-2 sm:px-3 py-1.5 text-xs sm:text-sm dark:bg-coin-900/30 dark:text-coin-200 transition-colors touch-target-min"
                  title="Toggle Tasks Panel"
                >
                  <IconMapper name="CheckSquare" size={16} />
                  <span className="hidden sm:inline">Tasks</span>
                </button>
                <div className="hidden sm:flex items-center gap-3">
                  <QuickBudgetButton />
                  <QuickRequisitionButton />
                </div>
                <button
                  onClick={toggle}
                  className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 rounded-md bg-red-100 text-red-800 hover:bg-red-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 transition-colors touch-target-min"
                >
                  <span className="hidden sm:inline">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                  <span className="sm:hidden">{theme === 'dark' ? 'Light' : 'Dark'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <BaseShell noHeader fullScreen={false}>
          <div className="transition-all ease-out duration-500">
            <div className={`grid gap-4 ${tasksOpen ? 'grid-cols-1 xl:grid-cols-4' : 'grid-cols-1'}`}>
              <div className={tasksOpen ? 'xl:col-span-3' : ''}>
                {children}
              </div>
              <AnimatePresence>
                {tasksOpen && (
                  <motion.div
                    initial={{ opacity: 0, x: 50, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 50, scale: 0.95 }}
                    transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="xl:col-span-1"
                  >
                    <WeeklyTasks
                      tasks={weeklyTasks || []}
                      showModule={true}
                      isExecutiveAssistant={isExecutiveAssistant}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </BaseShell>
        {tasksOpen && isMobile && (
          <WeeklyTasks
            tasks={weeklyTasks || []}
            showModule={true}
            isExecutiveAssistant={isExecutiveAssistant}
            isOpen={tasksOpen}
            onClose={() => setTasksOpen(false)}
          />
        )}
        <AIAssistant context="hr" />
      </div>
    </div>
  );
}
