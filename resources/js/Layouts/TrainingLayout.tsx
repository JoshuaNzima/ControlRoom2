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
import FloatingNavButton from '@/Components/FloatingNavButton';
import WeeklyTasks from '@/Components/WeeklyTasks';
import TutorialSection from '@/Components/Tutorials/TutorialSection';

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

export default function TrainingLayout({ title, children, user }: Props) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [tasksOpen, setTasksOpen] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);
  const [logoOk, setLogoOk] = React.useState<boolean>(true);
  const isCurrent = (href: string) => typeof window !== 'undefined' && window.location.pathname === href;
  const { theme, toggle } = useTheme();
  const { counters } = useCounters();
  const page = usePage<any>();
  const { weeklyTasks, isExecutiveAssistant } = page.props;
  const appName = page.props?.appName ?? 'CoinSec';

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  const rawRoles = ((user as any)?.roles ?? (page?.props as any)?.auth?.user?.roles ?? []) as (string | { id: number; name: string })[];
  const roles = rawRoles.map((r) => (typeof r === 'string' ? r : r.name));
  const userId = (user as any)?.id ?? (page?.props as any)?.auth?.user?.id;

  // Initialize real-time notifications
  useRealtimeNotifications({ userId, userRoles: roles });

  const isSuperAdmin = roles.includes('super_admin');
  const isAdminUser = roles.includes('admin') || roles.includes('super_admin');
  const roleDisplay = roles.length > 0 ? roles[0].replace(/_/g, ' ') : 'Training';

  // Main Training Navigation
  const mainLinks: NavItem[] = [
    { name: 'Dashboard', href: route('training.dashboard'), icon: <IconMapper name="LayoutDashboard" className="h-6 w-6" />, current: isCurrent(route('training.dashboard')) },
    { name: 'Trainees', href: route('training.trainees.index'), icon: <IconMapper name="GraduationCap" className="h-6 w-6" />, current: isCurrent(route('training.trainees.index')) },
    { name: 'Attendance', href: route('training.attendance.index'), icon: <IconMapper name="CalendarCheck" className="h-6 w-6" />, current: isCurrent(route('training.attendance.index')) },
  ];

  // Training Programs
  const programLinks: NavItem[] = [
    { name: 'Crash Courses', href: route('training.crash-courses.index'), icon: <IconMapper name="Zap" className="h-6 w-6" />, current: isCurrent(route('training.crash-courses.index')) },
    { name: 'Refreshers', href: route('training.refreshers.index'), icon: <IconMapper name="RefreshCw" className="h-6 w-6" />, current: isCurrent(route('training.refreshers.index')) },
    { name: 'Regimens', href: route('training.regimens.index'), icon: <IconMapper name="ClipboardList" className="h-6 w-6" />, current: isCurrent(route('training.regimens.index')) },
    { name: 'Refresher Guards', href: route('training.trainer-guards.index'), icon: <IconMapper name="UserCheck" className="h-6 w-6" />, current: isCurrent(route('training.trainer-guards.index')) },
    { name: 'Guards Directory', href: route('training.guards.index'), icon: <IconMapper name="Shield" className="h-6 w-6" />, current: isCurrent(route('training.guards.index')) },
  ];

  // Tools
  const toolsLinks: NavItem[] = [
    ...(!isAdminUser ? ([
      { name: 'My Requisitions', href: route('requisitions.index'), icon: <IconMapper name="ClipboardList" className="h-6 w-6" />, current: isCurrent(route('requisitions.index')), badge: (() => { const n = Number(counters?.requisitions_my_open || 0); return n > 0 ? String(n) : undefined; })() },
    ] as NavItem[]) : []),
    { name: 'Budgets', href: route('budgets.index'), icon: <IconMapper name="PieChart" className="h-6 w-6" />, current: isCurrent(route('budgets.index')) },
  ];

  return (
    <div className="min-h-screen bg-red-50 dark:bg-gray-900">
      <Head title={title} />

      <div className={`fixed inset-0 bg-red-800 bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-70 z-40 md:hidden ${sidebarOpen ? 'block' : 'hidden'}`} onClick={() => setSidebarOpen(false)} />

      <div className={`fixed top-0 left-0 bottom-0 flex flex-col w-64 bg-red-900 dark:bg-gray-950 text-white transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out z-50`}>
        {/* Logo / App Name */}
        <div className="flex items-center flex-shrink-0 px-4 py-5 border-b border-red-800 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
              <IconMapper name="graduation-cap" className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight text-white">Training</h1>
              <p className="text-xs text-red-200 dark:text-gray-400">{appName}</p>
            </div>
          </div>
        </div>
        <div className="flex-1 flex flex-col overflow-y-auto">
          <nav className="flex-1 px-2 py-4 space-y-8">
            <div className="space-y-1">
              <h3 className="px-3 text-xs font-semibold text-red-200 dark:text-gray-400 uppercase tracking-wider">Training</h3>
              {mainLinks.map((item) => (
                <Link key={item.name} href={item.href} className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${item.current ? 'bg-red-800 text-white dark:bg-gray-800' : 'text-red-100 hover:bg-red-800 hover:text-white dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'}`}>
                  {item.icon}
                  <span className="ml-3">{item.name}</span>
                  {item.badge && (
                    <span className="ml-auto inline-block py-0.5 px-2 text-xs font-medium rounded-full bg-white/10 text-white">{item.badge}</span>
                  )}
                </Link>
              ))}
            </div>

            <div className="space-y-1">
              <h3 className="px-3 text-xs font-semibold text-red-200 dark:text-gray-400 uppercase tracking-wider">Programs</h3>
              {programLinks.map((item) => (
                <Link key={item.name} href={item.href} className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${item.current ? 'bg-red-800 text-white dark:bg-gray-800' : 'text-red-100 hover:bg-red-800 hover:text-white dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'}`}>
                  {item.icon}
                  <span className="ml-3">{item.name}</span>
                  {item.badge && (
                    <span className="ml-auto inline-block py-0.5 px-2 text-xs font-medium rounded-full bg-white/10 text-white">{item.badge}</span>
                  )}
                </Link>
              ))}
            </div>

            <div className="space-y-1">
              <h3 className="px-3 text-xs font-semibold text-red-200 dark:text-gray-400 uppercase tracking-wider">Tools</h3>
              {toolsLinks.map((item) => (
                <Link key={item.name} href={item.href} className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${item.current ? 'bg-red-800 text-white dark:bg-gray-800' : 'text-red-100 hover:bg-red-800 hover:text-white dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'}`}>
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
              {user?.name?.charAt(0) || 'T'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs border font-medium bg-red-500/20 text-red-200 border-red-500/30">
                {roleDisplay || 'Training'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={route('training.profile')}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-gray-800 px-3 py-2 text-xs font-medium text-white hover:bg-gray-700 transition-colors"
            >
              <IconMapper name="User" size={14} />
              Profile
            </Link>
            <Link
              href={route('logout')}
              method="post"
              as="button"
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-red-700 px-3 py-2 text-xs font-medium text-white hover:bg-red-600 transition-colors"
            >
              <IconMapper name="LogOut" size={14} />
              Logout
            </Link>
          </div>
        </div>
      </div>

      <div className="md:pl-64">
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
                  <IconMapper name="Menu" size={24} />
                </button>
                <h1 className="text-lg sm:text-xl font-semibold text-red-900 dark:text-gray-100 truncate">{title}</h1>
              </div>
              <div className="flex items-center justify-end gap-1 sm:gap-4 shrink-0">
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
                  <QuickRequisitionButton />
                  <Link
                    href={route('training.profile')}
                    className="inline-flex items-center px-3 py-1.5 rounded-md bg-gray-800 text-white hover:bg-gray-700 text-sm"
                  >
                    My Profile
                  </Link>
                </div>
                {isSuperAdmin && (
                  <Link
                    href={route('superadmin.dashboard')}
                    className="inline-flex items-center gap-2 rounded-md bg-red-700 px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-white hover:bg-red-600 touch-target-min"
                  >
                    <IconMapper name="Shield" size={16} />
                    <span className="hidden sm:inline">Super Admin</span>
                    <span className="sm:hidden">SA</span>
                  </Link>
                )}
                <button onClick={toggle} className="text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-md bg-red-100 text-red-800 hover:bg-red-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 touch-target-min">
                  <span className="hidden sm:inline">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                  <span className="sm:hidden">{theme === 'dark' ? 'Light' : 'Dark'}</span>
                </button>
                <div className="hidden sm:block text-sm text-red-700 dark:text-gray-300 max-w-[10rem] truncate">{user?.name}</div>
                <Link href={route('logout')} method="post" as="button" className="inline-flex items-center justify-center rounded-md bg-white text-red-700 hover:bg-red-50 border border-red-200 px-2 py-2 sm:px-3 sm:py-1 text-xs sm:text-sm dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 touch-target-min">
                  <IconMapper name="LogOut" className="h-5 w-5 sm:hidden" />
                  <span className="hidden sm:inline">Logout</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
        <BaseShell noHeader fullScreen={false}>
          <div className="animate-slideUp transition-all-smooth">
            <div className={`grid gap-4 ${tasksOpen ? 'grid-cols-1 xl:grid-cols-4' : 'grid-cols-1'}`}>
              <div className={tasksOpen ? 'xl:col-span-3' : ''}>
                <TutorialSection dashboard="admin" canManage={false} />
                {children}
              </div>
              {tasksOpen && !isMobile && (
                <div className="xl:col-span-1 hidden xl:block">
                  <WeeklyTasks
                    tasks={weeklyTasks || []}
                    showModule={true}
                    isExecutiveAssistant={isExecutiveAssistant}
                  />
                </div>
              )}
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
      </div>
    </div>
  );
}
