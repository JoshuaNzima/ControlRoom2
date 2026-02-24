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
  const isCurrent = (href: string) => typeof window !== 'undefined' && window.location.pathname === href;
  const { theme, toggle } = useTheme();
  const { counters } = useCounters();
  const page = usePage<any>();
  const roles = ((user as any)?.roles ?? (page?.props as any)?.auth?.user?.roles ?? []) as any;
  const isSuperAdmin = Array.isArray(roles) ? roles.includes('super_admin') : roles === 'super_admin';

  const nav: NavItem[] = [
    { name: 'Dashboard', href: route('training.dashboard'), icon: <IconMapper name="LayoutDashboard" className="h-6 w-6" />, current: isCurrent(route('training.dashboard')) },
    { name: 'Trainees', href: route('training.trainees.index'), icon: <IconMapper name="GraduationCap" className="h-6 w-6" />, current: isCurrent(route('training.trainees.index')) },
    { name: 'Attendance', href: route('training.attendance.index'), icon: <IconMapper name="CalendarCheck" className="h-6 w-6" />, current: isCurrent(route('training.attendance.index')) },
    { name: 'Crash Courses', href: route('training.crash-courses.index'), icon: <IconMapper name="Zap" className="h-6 w-6" />, current: isCurrent(route('training.crash-courses.index')) },
    { name: 'Refreshers', href: route('training.refreshers.index'), icon: <IconMapper name="RefreshCw" className="h-6 w-6" />, current: isCurrent(route('training.refreshers.index')) },
    { name: 'Regimens', href: route('training.regimens.index'), icon: <IconMapper name="ClipboardList" className="h-6 w-6" />, current: isCurrent(route('training.regimens.index')) },
    { name: 'Trainer Guards', href: route('training.trainer-guards.index'), icon: <IconMapper name="UserCheck" className="h-6 w-6" />, current: isCurrent(route('training.trainer-guards.index')) },
    { name: 'Requisitions', href: route('requisitions.index'), icon: <IconMapper name="ClipboardList" className="h-6 w-6" />, current: isCurrent(route('requisitions.index')), badge: (() => { const n = Number(counters?.requisitions_my_open || 0); return n > 0 ? String(n) : undefined; })() },
  ];

  return (
    <div className="min-h-screen bg-red-50 dark:bg-gray-900">
      <Head title={title} />

      <div className={`fixed inset-0 bg-red-800 bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-70 z-40 md:hidden ${sidebarOpen ? 'block' : 'hidden'}`} onClick={() => setSidebarOpen(false)} />

      <div className={`fixed top-0 left-0 bottom-0 flex flex-col w-64 bg-red-900 dark:bg-gray-950 text-white transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out z-50`}>
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <span className="ml-2 text-2xl font-bold text-white">Training</span>
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
        <div className="flex-shrink-0 flex border-t border-red-800 dark:border-gray-800 p-4">
          <div className="flex items-center">
            <div>
              <div className="text-base font-medium text-white">{user?.name}</div>
              <div className="text-sm font-medium text-red-200 dark:text-gray-400">Training</div>
            </div>
          </div>
        </div>
      </div>

      <div className="md:pl-64">
        <div className="sticky top-0 z-30 border-b border-red-100 bg-white/95 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  className="h-10 w-10 inline-flex items-center justify-center rounded-md text-red-700 hover:bg-red-100 hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-coin-600 md:hidden"
                  onClick={() => setSidebarOpen(true)}
                >
                  <span className="sr-only">Open sidebar</span>
                  <IconMapper name="Menu" size={24} />
                </button>
                <h1 className="text-xl font-semibold text-red-900 dark:text-gray-100 truncate">{title}</h1>
              </div>
              <div className="flex items-center justify-end gap-2 sm:gap-4 shrink-0">
                <NotificationBell />
                <div className="hidden sm:flex items-center gap-4">
                  <QuickBudgetButton />
                  <QuickRequisitionButton />
                </div>
                {isSuperAdmin && (
                  <Link
                    href={route('superadmin.dashboard')}
                    className="inline-flex items-center gap-2 rounded-md bg-red-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-600"
                  >
                    <IconMapper name="Shield" size={16} />
                    <span className="hidden sm:inline">Super Admin</span>
                    <span className="sm:hidden">SA</span>
                  </Link>
                )}
                <button onClick={toggle} className="text-sm px-3 py-1 rounded-md bg-red-100 text-red-800 hover:bg-red-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">
                  <span className="hidden sm:inline">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                  <span className="sm:hidden">{theme === 'dark' ? 'Light' : 'Dark'}</span>
                </button>
                <div className="hidden sm:block text-sm text-red-700 dark:text-gray-300 max-w-[10rem] truncate">{user?.name}</div>
                <Link href={route('logout')} method="post" as="button" className="inline-flex items-center justify-center rounded-md bg-white text-red-700 hover:bg-red-50 border border-red-200 px-2 py-2 sm:px-3 sm:py-1 text-sm dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">
                  <IconMapper name="LogOut" className="h-5 w-5 sm:hidden" />
                  <span className="hidden sm:inline">Logout</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
        <BaseShell noHeader fullScreen={false}>
          <div className="animate-slideUp transition-all-smooth">{children}</div>
        </BaseShell>
      </div>
    </div>
  );
}
