import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import BaseShell from './BaseShell';
import IconMapper from '@/Components/IconMapper';
import { User } from '@/types';
import NotificationBell from '@/Components/Common/NotificationBell';
import { useTheme } from '@/Providers/ThemeProvider';
import QuickRequisitionButton from '@/Components/Requisitions/QuickRequisitionButton';
import QuickBudgetButton from '@/Components/Budgets/QuickBudgetButton';
import useCounters from '@/Hooks/useCounters';
import WeeklyTasks from '@/Components/WeeklyTasks';
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
  current: boolean;
  badge?: string;
}

export default function MarketingLayout({ title, children, user }: Props) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [tasksOpen, setTasksOpen] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);
  const isCurrent = (href: string) => typeof window !== 'undefined' && window.location.pathname === href;
  const { theme, toggle } = useTheme();
  const { counters } = useCounters();
  const page = usePage<any>();
  const { weeklyTasks, isExecutiveAssistant } = page.props as any;
  const roles = ((user as any)?.roles ?? (page?.props as any)?.auth?.user?.roles ?? []) as any;
  const isSuperAdmin = Array.isArray(roles) ? roles.includes('super_admin') : roles === 'super_admin';
  const isAdminUser = Array.isArray(roles) && (roles.includes('admin') || roles.includes('super_admin'));

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const nav: NavItem[] = [
    { name: 'Overview', href: route('admin.marketing'), icon: <IconMapper name="megaphone" className="h-6 w-6" />, current: isCurrent(route('admin.marketing')) },
    { name: 'Leads', href: route('admin.marketing.leads.index'), icon: <IconMapper name="users" className="h-6 w-6" />, current: isCurrent(route('admin.marketing.leads.index')) },
    { name: 'Analytics', href: route('admin.marketing.analytics'), icon: <IconMapper name="bar-chart-2" className="h-6 w-6" />, current: isCurrent(route('admin.marketing.analytics')) },
    ...(!isAdminUser ? ([
      { name: 'My Requisitions', href: route('requisitions.index'), icon: <IconMapper name="clipboard-list" className="h-6 w-6" />, current: isCurrent(route('requisitions.index')), badge: (()=>{ const n = Number(counters?.requisitions_my_open||0); return n>0? String(n): undefined; })() },
    ] as NavItem[]) : []),
    { name: 'Settings', href: route('admin.marketing.settings'), icon: <IconMapper name="settings" className="h-6 w-6" />, current: isCurrent(route('admin.marketing.settings')) },
  ];

  return (
    <div className="min-h-screen bg-coin-50 dark:bg-gray-900">
      <Head title={title} />

      <div className={`fixed inset-0 bg-coin-800 bg-opacity-50 z-40 md:hidden ${sidebarOpen ? 'block' : 'hidden'}`} onClick={() => setSidebarOpen(false)} />

      <div className={`fixed top-0 left-0 bottom-0 flex flex-col w-64 bg-coin-900 dark:bg-gray-950 text-white transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out z-50`}>
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <span className="ml-2 text-2xl font-bold text-white">Marketing</span>
          </div>
          <nav className="mt-8 flex-1 px-2 space-y-1">
            {nav.map((item) => (
              <Link key={item.name} href={item.href} className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${item.current ? 'bg-coin-800 text-white dark:bg-gray-800' : 'text-coin-100 hover:bg-coin-800 hover:text-white dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'}`}>
                {item.icon}
                <span className="ml-3">{item.name}</span>
                {item.badge && (
                  <span className="ml-auto inline-block py-0.5 px-2 text-xs font-medium rounded-full bg-white/10 text-white">{item.badge}</span>
                )}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex-shrink-0 border-t border-coin-800 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-coin-800 dark:bg-gray-800 flex items-center justify-center text-white font-semibold text-sm">
              {user?.name?.charAt(0) || 'M'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-coin-200 dark:text-gray-400 truncate">Marketing</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={route('admin.marketing.profile')}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-gray-800 px-3 py-2 text-xs font-medium text-white hover:bg-gray-700 transition-colors"
            >
              <IconMapper name="User" size={14} />
              Profile
            </Link>
            <Link
              href={route('logout')}
              method="post"
              as="button"
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-coin-700 px-3 py-2 text-xs font-medium text-white hover:bg-coin-600 transition-colors"
            >
              <IconMapper name="LogOut" size={14} />
              Logout
            </Link>
          </div>
        </div>
      </div>

      <div className="md:pl-64">
        <div className="sticky top-0 z-10 pl-1 pt-1 sm:pl-3 sm:pt-3 bg-coin-50 dark:bg-gray-900 border-b border-coin-100 dark:border-gray-800">
          <button type="button" className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-coin-700 hover:text-coin-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-coin-500 md:hidden" onClick={() => setSidebarOpen(true)}>
            <span className="sr-only">Open sidebar</span>
            <IconMapper name="menu" className="h-6 w-6" />
          </button>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pb-3">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold text-coin-900 dark:text-gray-100 truncate">{title}</h1>
              <div className="flex items-center justify-end gap-2 sm:gap-4 shrink-0">
                <NotificationBell />
                <button
                  onClick={() => setTasksOpen(!tasksOpen)}
                  className="inline-flex items-center gap-1.5 rounded-md bg-coin-100 text-coin-700 hover:bg-coin-200 px-3 py-1.5 text-sm dark:bg-coin-900/30 dark:text-coin-200 transition-colors"
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
                    className="inline-flex items-center gap-2 rounded-md bg-coin-700 px-2 py-2 sm:px-3 sm:py-1.5 text-sm font-medium text-white hover:bg-coin-600"
                  >
                    <IconMapper name="shield" className="h-4 w-4" />
                    <span className="hidden sm:inline">Super Admin</span>
                    <span className="sm:hidden">SA</span>
                  </Link>
                )}
                <button onClick={toggle} className="text-sm px-3 py-1 rounded-md bg-coin-100 text-coin-800 hover:bg-coin-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">
                  <span className="hidden sm:inline">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                  <span className="sm:hidden">{theme === 'dark' ? 'Light' : 'Dark'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        <BaseShell noHeader fullScreen={false}>
          <div className="animate-slideUp transition-all-smooth">
            <AnimatePresence mode="wait">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className={`grid gap-4 ${tasksOpen ? 'grid-cols-1 xl:grid-cols-4' : 'grid-cols-1'}`}
              >
                <div className={tasksOpen ? 'xl:col-span-3' : ''}>
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
