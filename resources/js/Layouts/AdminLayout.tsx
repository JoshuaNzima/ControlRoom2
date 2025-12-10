import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import BaseShell from './BaseShell';
import IconMapper from '@/Components/IconMapper';
import { User } from '@/types';
import NotificationBell from '@/Components/Common/NotificationBell';
import { useTheme } from '@/Providers/ThemeProvider';
import useCounters from '@/Hooks/useCounters';

interface Props {
  title: string;
  children: React.ReactNode;
  user?: User;
}

interface ModuleNavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  current: boolean;
  badge?: string;
}

export default function AdminLayout({ title, children, user }: Props) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [logoOk, setLogoOk] = React.useState<boolean>(true);
  const { theme, toggle } = useTheme();
  const { props } = usePage<any>();
  const { counters } = useCounters();
  const effectiveUser: User | undefined = (user as any) ?? (props?.auth?.user as any) ?? undefined;
  const roleDisplay = (() => {
    const r: any = (effectiveUser as any)?.roles;
    if (Array.isArray(r) && r.length) return String(r[0]).replaceAll('_', ' ');
    if (typeof r === 'string') return String(r).replaceAll('_', ' ');
    return 'Admin';
  })();

  const isCurrent = (href: string) => {
    try {
      const hrefPath = new URL(href, window.location.origin).pathname;
      return window.location.pathname === hrefPath;
    } catch {
      return window.location.pathname === href;
    }
  };

  const adminLinks: ModuleNavItem[] = [
     { name: 'Admin Dashboard', href: route('admin.dashboard'), icon: <IconMapper name="home" className="h-6 w-6" />, current: isCurrent(route('admin.dashboard')) },
     { name: 'Services', href: route('admin.services.index'), icon: <IconMapper name="package" className="h-6 w-6" />, current: isCurrent(route('admin.services.index')) },
     { name: 'Users', href: route('admin.users.index'), icon: <IconMapper name="users-2" className="h-6 w-6" />, current: isCurrent(route('admin.users.index')) },
     { name: 'Approvals', href: route('admin.approvals.index'), icon: <IconMapper name="check-circle" className="h-6 w-6" />, current: isCurrent(route('admin.approvals.index')), badge: (() => { const n = (Number(counters?.requisitions_pending_admin||0) + Number(counters?.finance_approvals_pending||0) + Number(counters?.requisition_batches_pending_ack||0)); return n>0 ? String(n) : undefined; })() },
     { name: 'Messaging', href: route('control-room.messaging.index'), icon: <IconMapper name="message-square-text" className="h-6 w-6" />, current: isCurrent(route('control-room.messaging.index')) },
    { name: 'Reports', href: route('admin.reports.index'), icon: <IconMapper name="bar-chart-2" className="h-6 w-6" />, current: isCurrent(route('admin.reports.index')) },
    { name: 'Payments Checker', href: route('admin.payments.index'), icon: <IconMapper name="wallet" className="h-6 w-6" />, current: isCurrent(route('admin.payments.index')) },
    { name: 'Requisitions', href: route('requisitions.index'), icon: <IconMapper name="clipboard-list" className="h-6 w-6" />, current: isCurrent(route('requisitions.index')), badge: (()=>{ const n = Number(counters?.requisitions_my_open||0); return n>0? String(n): undefined; })() },
    { name: 'Budgets', href: route('budgets.index'), icon: <IconMapper name="pie-chart" className="h-6 w-6" />, current: isCurrent(route('budgets.index')) },
    { name: 'Settings', href: route('admin.settings.index'), icon: <IconMapper name="settings" className="h-6 w-6" />, current: isCurrent(route('admin.settings.index')) },
  ];

  const canSeeFinance = (() => {
    if (!effectiveUser) return false;
    const allowedRoles = ['super_admin', 'finance_officer', 'accountant'];
    const roles = (effectiveUser as any).roles ?? [];
    if (Array.isArray(roles) && roles.some((r) => allowedRoles.includes(String(r)))) return true;
    if (typeof roles === 'string' && allowedRoles.includes(roles)) return true;
    const perms = (effectiveUser as any).permissions ?? [];
    if (Array.isArray(perms) && perms.includes('finance.access')) return true;
    if (typeof perms === 'string' && perms === 'finance.access') return true;
    return false;
  })();

  const canAccessMarketing = (() => {
    if (!effectiveUser) return false;
    const allowedRoles = ['super_admin', 'marketing', 'marketing_officer', 'marketing_manager'];
    const roles = (effectiveUser as any).roles ?? [];
    if (Array.isArray(roles) && roles.some((r) => allowedRoles.includes(String(r)))) return true;
    if (typeof roles === 'string' && allowedRoles.includes(roles)) return true;
    const perms = (effectiveUser as any).permissions ?? [];
    if (Array.isArray(perms) && perms.includes('marketing.access')) return true;
    if (typeof perms === 'string' && perms === 'marketing.access') return true;
    return false;
  })();

  const hasAnyRole = (list: string[]) => {
    const roles = (effectiveUser as any)?.roles ?? [];
    if (Array.isArray(roles)) return roles.some((r) => list.includes(String(r)));
    if (typeof roles === 'string') return list.includes(roles);
    return false;
  };
  const hasPerm = (perm: string) => {
    const perms = (effectiveUser as any)?.permissions ?? [];
    if (Array.isArray(perms)) return perms.includes(perm);
    if (typeof perms === 'string') return perms === perm;
    return false;
  };

  const canAccessHR = hasAnyRole(['super_admin','hr','hr_manager']) || hasPerm('hr.employees.view') || hasPerm('hr.careers.manage');
  const canAccessK9 = hasAnyRole(['super_admin','k9','k9_manager']) || hasPerm('k9.view');
  const canAccessAssets = hasAnyRole(['super_admin','assets_manager']) || hasPerm('assets.access');
  const canAccessClients = hasAnyRole(['super_admin','client_manager']) || hasPerm('clients.access');
  const canAccessGuards = hasAnyRole(['super_admin','guards','guard_manager']) || hasPerm('guards.access');
  const canAccessBusinessDev = hasAnyRole(['super_admin','business_dev','business_development','bdo']) || hasPerm('business_dev.access');
  const canAccessControlRoom = hasAnyRole(['super_admin','control_room','dispatcher','operations_officer']) || hasPerm('control_room.access');
  const canAccessReports = hasAnyRole(['super_admin','supervisor','reports']) || hasPerm('reports.access');

  const marketingHref = route('admin.modules.summary', 'marketing');
  const controlRoomHref = route('admin.modules.summary', 'control_room');
  const clientsHref = route('admin.modules.summary', 'clients');
  const guardsHref = route('admin.modules.summary', 'guards');
  const hrHref = route('admin.modules.summary', 'hr');
  const k9Href = route('admin.modules.summary', 'k9');
  const bizDevHref = route('admin.modules.summary', 'business_dev');
  const assetsHref = route('admin.modules.summary', 'assets');
  const financeHref = route('admin.modules.summary', 'finance');
  const moduleLinks: ModuleNavItem[] = [
  { name: 'Control Room', href: controlRoomHref, icon: <IconMapper name="briefcase" className="h-6 w-6" />, current: isCurrent(controlRoomHref) },
  { name: 'Clients', href: clientsHref, icon: <IconMapper name="building-2" className="h-6 w-6" />, current: isCurrent(clientsHref) },
  { name: 'Guards', href: guardsHref, icon: <IconMapper name="shield-check" className="h-6 w-6" />, current: isCurrent(guardsHref) },
  { name: 'HR', href: hrHref, icon: <IconMapper name="users-2" className="h-6 w-6" />, current: isCurrent(hrHref) },
  { name: 'K9', href: k9Href, icon: <IconMapper name="shield" className="h-6 w-6" />, current: isCurrent(k9Href) },
  { name: 'Business Dev', href: bizDevHref, icon: <IconMapper name="handshake" className="h-6 w-6" />, current: isCurrent(bizDevHref) },
  { name: 'Assets', href: assetsHref, icon: <IconMapper name="boxes" className="h-6 w-6" />, current: isCurrent(assetsHref) },
  { name: 'Finance', href: financeHref, icon: <IconMapper name="wallet" className="h-6 w-6" />, current: isCurrent(financeHref) },
  { name: 'Marketing', href: marketingHref, icon: <IconMapper name="megaphone" className="h-6 w-6" />, current: isCurrent(marketingHref) },
  ];

  return (
    <div className="min-h-screen bg-red-50 dark:bg-gray-900">
      <Head title={title} />

      <div className={`fixed inset-0 bg-red-800 bg-opacity-50 z-40 md:hidden ${sidebarOpen ? 'block' : 'hidden'}`} onClick={() => setSidebarOpen(false)} />

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
              <span className="ml-2 text-2xl font-bold text-white">CoinSec</span>
            )}
          </div>
          <nav className="mt-8 flex-1 px-2 space-y-8">
            <div className="space-y-1">
              <h3 className="px-3 text-xs font-semibold text-red-200 dark:text-gray-400 uppercase tracking-wider">Administration</h3>
              {adminLinks.map((item) => (
                <Link key={item.name} href={item.href} className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${isCurrent(item.href) ? 'bg-red-800 text-white dark:bg-gray-800' : 'text-red-100 hover:bg-red-800 hover:text-white dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'}`}>
                  {item.icon}
                  <span className="ml-3">{item.name}</span>
                  {item.badge && (
                    <span className="ml-auto inline-block py-0.5 px-2 text-xs font-medium rounded-full bg-white/10 text-white">{item.badge}</span>
                  )}
                </Link>
              ))}
            </div>

            <div className="space-y-1">
              <h3 className="px-3 text-xs font-semibold text-red-200 dark:text-gray-400 uppercase tracking-wider">Modules</h3>
              {moduleLinks.map((item) => (
                <Link key={item.name} href={item.href} className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${isCurrent(item.href) ? 'bg-red-800 text-white dark:bg-gray-800' : 'text-red-100 hover:bg-red-800 hover:text-white dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'}`}>
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
            <div className="text-base font-medium text-white">{effectiveUser?.name}</div>
            <div className="text-sm font-medium text-red-200 dark:text-gray-400">{roleDisplay}</div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={route('profile.dashboard')}
              className="inline-flex items-center gap-2 rounded-md bg-gray-800 px-3 py-2 text-sm font-medium text-white hover:bg-gray-700"
            >
              My Profile
            </Link>
          </div>
        </div>
      </div>

      <div className="md:pl-64">
        <div className="sticky top-0 z-10 pl-1 pt-1 sm:pl-3 sm:pt-3 bg-red-50 dark:bg-gray-900 border-b border-red-100 dark:border-gray-800">
            <button type="button" className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-red-700 hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-500 md:hidden" onClick={() => setSidebarOpen(true)}>
            <span className="sr-only">Open sidebar</span>
            <IconMapper name="menu" className="h-6 w-6" />
          </button>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pb-3">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold text-red-900 dark:text-gray-100">{title}</h1>
              <div className="flex items-center gap-4">
                <NotificationBell />
                <button onClick={toggle} className="text-sm px-3 py-1 rounded-md bg-red-100 text-red-800 hover:bg-red-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </button>
                <div className="text-sm text-red-700 dark:text-gray-300">{effectiveUser?.name}</div>
                {hasAnyRole(['super_admin']) && (
                  <Link
                    href={route('superadmin.dashboard')}
                    className="inline-flex items-center gap-2 rounded-md bg-red-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-600"
                  >
                    <IconMapper name="shield" className="h-4 w-4" />
                    Super Admin
                  </Link>
                )}
                <Link
                  href={route('logout')}
                  method="post"
                  as="button"
                  className="text-sm px-3 py-1 rounded-md bg-white text-red-700 hover:bg-red-50 border border-red-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
                >
                  Logout
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
      </div>
    </div>
  );
}