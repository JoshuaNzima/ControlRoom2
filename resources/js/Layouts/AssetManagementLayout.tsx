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

export default function AssetManagementLayout({ title, children, user }: Props) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [tasksOpen, setTasksOpen] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);
  const isCurrent = (href: string) => typeof window !== 'undefined' && window.location.pathname === href;
  const { theme, toggle } = useTheme();
  const { counters } = useCounters();
  const page = usePage<any>();
  const { weeklyTasks, isExecutiveAssistant } = page.props;

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
  const roleDisplay = roles.length > 0 ? roles[0].replace(/_/g, ' ') : 'Asset Manager';

  const nav: NavItem[] = [
    { name: 'Overview', href: route('assets.index'), icon: <IconMapper name="package" className="h-6 w-6" />, current: isCurrent(route('assets.index')), badge: (()=>{ const n = Number(counters?.assets_handovers_outstanding||0); return n>0? String(n): undefined; })() },
    { name: 'Vehicles', href: route('assets.vehicles.index'), icon: <IconMapper name="truck" className="h-6 w-6" />, current: isCurrent(route('assets.vehicles.index')) },
    { name: 'Equipment', href: route('assets.equipment.index'), icon: <IconMapper name="wrench" className="h-6 w-6" />, current: isCurrent(route('assets.equipment.index')) },
    { name: 'Uniforms', href: route('assets.equipment.index', { category: 'uniform' } as any), icon: <IconMapper name="shirt" className="h-6 w-6" />, current: typeof window !== 'undefined' && window.location.pathname === route('assets.equipment.index') && new URLSearchParams(window.location.search).get('category') === 'uniform' },
    { name: 'Weapons', href: route('assets.equipment.index', { category: 'weapon' } as any), icon: <IconMapper name="target" className="h-6 w-6" />, current: typeof window !== 'undefined' && window.location.pathname === route('assets.equipment.index') && new URLSearchParams(window.location.search).get('category') === 'weapon' },
    { name: 'Utilization', href: route('assets.utilization.index'), icon: <IconMapper name="activity" className="h-6 w-6" />, current: isCurrent(route('assets.utilization.index')) },
    { name: 'Fuel', href: route('assets.fuel.index'), icon: <IconMapper name="flame" className="h-6 w-6" />, current: isCurrent(route('assets.fuel.index')) },
    { name: 'Maintenance', href: route('assets.maintenance.index'), icon: <IconMapper name="tool" className="h-6 w-6" />, current: isCurrent(route('assets.maintenance.index')) },
    { name: 'Dispatches', href: route('assets.dispatches.index'), icon: <IconMapper name="navigation" className="h-6 w-6" />, current: isCurrent(route('assets.dispatches.index')) },
    ...(!isAdminUser ? ([
      { name: 'My Requisitions', href: route('requisitions.index'), icon: <IconMapper name="clipboard-list" className="h-6 w-6" />, current: isCurrent(route('requisitions.index')), badge: (()=>{ const n = Number(counters?.requisitions_my_open||0); return n>0? String(n): undefined; })() },
    ] as NavItem[]) : []),
    { name: 'Settings', href: route('assets.settings'), icon: <IconMapper name="settings" className="h-6 w-6" />, current: isCurrent(route('assets.settings')) },
  ];

  return (
    <div className="min-h-screen bg-red-50 dark:bg-gray-900">
      <Head title={title} />

      <div className={`fixed inset-0 bg-red-800 bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-70 z-40 md:hidden ${sidebarOpen ? 'block' : 'hidden'}`} onClick={() => setSidebarOpen(false)} />

      <div className={`fixed top-0 left-0 bottom-0 flex flex-col w-64 bg-red-900 dark:bg-gray-950 text-white transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out z-50`}>
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <span className="ml-2 text-2xl font-bold text-white">Asset Management</span>
          </div>
          <nav className="mt-8 flex-1 px-2 space-y-1">
            {nav.map((item) => (
              <Link key={item.name} href={item.href} className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${item.current ? 'bg-red-800 text-white dark:bg-gray-800' : 'text-red-100 hover:bg-red-800 hover:text-white dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'}`}>
                {item.icon}
                <span className="ml-3">{item.name}</span>
                {item.badge && (
                  <span className="ml-auto inline-block py-0.5 px-2 text-xs font-medium rounded-full bg-white/10 text-white">{item.badge}</span>
                )}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex-shrink-0 border-t border-red-800 dark:border-gray-800 p-4 bg-red-900 dark:bg-gray-950">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-red-800 dark:bg-gray-800 border-2 border-red-700 dark:border-gray-700 flex items-center justify-center text-white font-semibold text-sm">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs border font-medium bg-red-500/20 text-red-200 border-red-500/30">
                {roleDisplay}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={route('assets.profile')}
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
                  <IconMapper name="menu" className="h-6 w-6" />
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
                </div>
                {isSuperAdmin && (
                  <Link
                    href={route('superadmin.dashboard')}
                    className="inline-flex items-center gap-2 rounded-md bg-red-700 px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-white hover:bg-red-600 touch-target-min"
                  >
                    <IconMapper name="shield" className="h-4 w-4" />
                    <span className="hidden sm:inline">Super Admin</span>
                    <span className="sm:hidden">SA</span>
                  </Link>
                )}
                <button onClick={toggle} className="text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-md bg-red-100 text-red-800 hover:bg-red-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 touch-target-min">
                  <span className="hidden sm:inline">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                  <span className="sm:hidden">{theme === 'dark' ? 'Light' : 'Dark'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        <BaseShell noHeader fullScreen={false}>
          <div className="animate-slideUp transition-all-smooth">
            <div className={`grid gap-4 ${tasksOpen ? 'grid-cols-1 xl:grid-cols-4' : 'grid-cols-1'}`}>
              <div className={tasksOpen ? 'xl:col-span-3' : ''}>
                <TutorialSection dashboard="assets" canManage={true} />
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
        <FloatingNavButton />
      </div>
    </div>
  );
}
