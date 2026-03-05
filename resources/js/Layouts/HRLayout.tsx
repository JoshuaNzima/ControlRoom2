import React from 'react';
import { Head, Link } from '@inertiajs/react';
import BaseShell from './BaseShell';
import IconMapper from '@/Components/IconMapper';
import { User } from '@/types';
import { useTheme } from '@/Providers/ThemeProvider';
import QuickRequisitionButton from '@/Components/Requisitions/QuickRequisitionButton';
import QuickBudgetButton from '@/Components/Budgets/QuickBudgetButton';
import NotificationBell from '@/Components/Common/NotificationBell';
import useCounters from '@/Hooks/useCounters';
import FloatingNavButton from '@/Components/FloatingNavButton';

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

export default function HRLayout({ title, children, user }: Props) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [logoOk, setLogoOk] = React.useState<boolean>(true);
  const isCurrent = (href: string) => typeof window !== 'undefined' && window.location.pathname === href;
  const { theme, toggle } = useTheme();
  const { counters } = useCounters();
  const roles = (() => {
    const r: any = (user as any)?.roles;
    if (Array.isArray(r)) return r.map(String);
    if (typeof r === 'string' && r.length) return [r];
    return [] as string[];
  })();
  const isAdminUser = roles.includes('admin') || roles.includes('super_admin');
  const roleDisplay = (() => {
    const r: any = (user as any)?.roles;
    if (Array.isArray(r) && r.length) return String(r[0]).replaceAll('_', ' ');
    if (typeof r === 'string') return String(r).replaceAll('_', ' ');
    return 'HR';
  })();

  // Main HR Navigation
  const hrLinks: NavItem[] = [
    { name: 'Dashboard', href: route('hr.dashboard'), icon: <IconMapper name="layout-dashboard" className="h-6 w-6" />, current: isCurrent(route('hr.dashboard')) },
    { name: 'Employees', href: route('hr.employees.index'), icon: <IconMapper name="users" className="h-6 w-6" />, current: isCurrent(route('hr.employees.index')) },
    { name: 'Downs', href: route('hr.downs.index'), icon: <IconMapper name="alert-triangle" className="h-6 w-6" />, current: isCurrent(route('hr.downs.index')), badge: (()=>{ const n = Number(counters?.control_downs_active||0); return n>0? String(n): undefined; })() },
    { name: 'Roster', href: route('hr.leaves'), icon: <IconMapper name="calendar" className="h-6 w-6" />, current: isCurrent(route('hr.leaves')) },
    { name: 'Careers', href: route('hr.jobs.index'), icon: <IconMapper name="megaphone" className="h-6 w-6" />, current: isCurrent(route('hr.jobs.index')) },
  ];

  // Development & Benefits
  const developmentLinks: NavItem[] = [
    { name: 'Training', href: route('hr.training'), icon: <IconMapper name="graduation-cap" className="h-6 w-6" />, current: isCurrent(route('hr.training')) },
    { name: 'Benefits', href: route('hr.benefits.index'), icon: <IconMapper name="gift" className="h-6 w-6" />, current: isCurrent(route('hr.benefits.index')) },
    { name: 'Medical', href: route('hr.medical.index'), icon: <IconMapper name="stethoscope" className="h-6 w-6" />, current: isCurrent(route('hr.medical.index')) },
    { name: 'Pensions', href: route('hr.pensions.index'), icon: <IconMapper name="banknote" className="h-6 w-6" />, current: isCurrent(route('hr.pensions.index')) },
    { name: 'Compensation', href: route('hr.compensation.index'), icon: <IconMapper name="dollar-sign" className="h-6 w-6" />, current: isCurrent(route('hr.compensation.index')) },
  ];

  // Management & Compliance
  const managementLinks: NavItem[] = [
    { name: 'Incentive Settings', href: route('hr.incentive-settings.index'), icon: <IconMapper name="settings" className="h-6 w-6" />, current: isCurrent(route('hr.incentive-settings.index')) },
    { name: 'Supervisor Incentives', href: route('hr.supervisor-incentives.index'), icon: <IconMapper name="award" className="h-6 w-6" />, current: isCurrent(route('hr.supervisor-incentives.index')) },
    { name: 'Safety', href: route('hr.safety.index'), icon: <IconMapper name="shield" className="h-6 w-6" />, current: isCurrent(route('hr.safety.index')) },
    { name: 'Policies', href: route('hr.policies.index'), icon: <IconMapper name="file-text" className="h-6 w-6" />, current: isCurrent(route('hr.policies.index')) },
    { name: 'Disciplinary', href: route('hr.disciplinary.index'), icon: <IconMapper name="alert-triangle" className="h-6 w-6" />, current: isCurrent(route('hr.disciplinary.index')) },
  ];

  // Tools
  const toolsLinks: NavItem[] = [
    ...(!isAdminUser ? ([
      { name: 'My Requisitions', href: route('requisitions.index'), icon: <IconMapper name="clipboard-list" className="h-6 w-6" />, current: isCurrent(route('requisitions.index')), badge: (()=>{ const n = Number(counters?.requisitions_my_open||0); return n>0? String(n): undefined; })() },
    ] as NavItem[]) : []),
    { name: 'Budgets', href: route('budgets.index'), icon: <IconMapper name="pie-chart" className="h-6 w-6" />, current: isCurrent(route('budgets.index')) },
  ];

  return (
    <div className="min-h-screen bg-red-50 dark:bg-gray-900 overflow-x-hidden">
      <Head title={title} />
      <div className={`fixed inset-0 bg-red-800 bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-70 z-40 md:hidden ${sidebarOpen ? 'block' : 'hidden'}`} onClick={() => setSidebarOpen(false)} />
      <div className={`fixed top-0 left-0 bottom-0 flex flex-col w-64 bg-red-900 dark:bg-gray-950 text-white transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out z-50`}>
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <img
              src="/images/Coin-logo.png"
              alt="Coin Security"
              className="h-10 w-auto"
              style={{ display: logoOk ? 'block' : 'none' }}
              onLoad={() => setLogoOk(true)}
              onError={() => setLogoOk(false)}
            />
            {!logoOk && (
              <span className="ml-2 text-2xl font-bold text-white">Human Resources</span>
            )}
          </div>
          <nav className="mt-8 flex-1 px-2 space-y-8">
            <div className="space-y-1">
              <h3 className="px-3 text-xs font-semibold text-red-200 dark:text-gray-400 uppercase tracking-wider">HR</h3>
              {hrLinks.map((item) => (
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
              <h3 className="px-3 text-xs font-semibold text-red-200 dark:text-gray-400 uppercase tracking-wider">Development & Benefits</h3>
              {developmentLinks.map((item) => (
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
              <h3 className="px-3 text-xs font-semibold text-red-200 dark:text-gray-400 uppercase tracking-wider">Management & Compliance</h3>
              {managementLinks.map((item) => (
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
        <div className="flex-shrink-0 flex items-center justify-between border-t border-red-800 dark:border-gray-800 p-4">
          <div>
            <div className="text-base font-medium text-white">{user?.name}</div>
            <div className="text-sm font-medium text-red-200 dark:text-gray-400">{roleDisplay}</div>
          </div>
          <Link href={route('hr.profile')} className="inline-flex items-center gap-2 rounded-md bg-gray-800 px-3 py-2 text-sm font-medium text-white hover:bg-gray-700">
            My Profile
          </Link>
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
                  <IconMapper name="menu" className="h-6 w-6" />
                </button>
                <h1 className="text-xl font-semibold text-red-900 dark:text-gray-100 truncate">{title}</h1>
              </div>
              <div className="flex items-center justify-end gap-2 sm:gap-3 shrink-0">
                <NotificationBell />
                <div className="hidden sm:flex items-center gap-3">
                  <QuickBudgetButton label="Budget" />
                  <QuickRequisitionButton label="Requisition" />
                </div>
                <button onClick={toggle} className="text-sm px-3 py-1 rounded-md bg-red-100 text-red-800 hover:bg-red-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">
                  <span className="hidden sm:inline">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                  <span className="sm:hidden">{theme === 'dark' ? 'Light' : 'Dark'}</span>
                </button>
                <div className="hidden sm:block text-sm text-red-700 dark:text-gray-300 max-w-[10rem] truncate">{user?.name}</div>
                <Link href={route('logout')} method="post" as="button" className="inline-flex items-center justify-center rounded-md bg-white text-red-700 hover:bg-red-50 border border-red-200 px-2 py-2 sm:px-3 sm:py-1 text-sm dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">
                  <IconMapper name="log-out" className="h-5 w-5 sm:hidden" />
                  <span className="hidden sm:inline">Logout</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
        <BaseShell noHeader fullScreen={false}>
          <div className="animate-slideUp transition-all-smooth">
            {children}
          </div>
        </BaseShell>
        <FloatingNavButton />
      </div>
    </div>
  );
}
