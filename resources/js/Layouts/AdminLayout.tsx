import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Home, Users2, Briefcase, BarChart2, Menu, UserCircle2, Building2, ShieldCheck, Wallet, Settings as SettingsIcon, Shield, MessageSquareText, Megaphone } from 'lucide-react';
import { User } from '@/types';
import { useTheme } from '@/Providers/ThemeProvider';

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

  const isCurrent = (href: string) => window.location.pathname === href;

  const adminLinks: ModuleNavItem[] = [
    { name: 'Admin Dashboard', href: route('admin.dashboard'), icon: <Home className="h-6 w-6" />, current: isCurrent(route('admin.dashboard')) },
    { name: 'Users', href: route('admin.users.index'), icon: <UserCircle2 className="h-6 w-6" />, current: false },
    { name: 'Messaging', href: route('control-room.messaging.index'), icon: <MessageSquareText className="h-6 w-6" />, current: false },
    { name: 'Reports', href: route('admin.reports.index'), icon: <BarChart2 className="h-6 w-6" />, current: false },
    { name: 'Payments Checker', href: route('admin.payments.index'), icon: <Wallet className="h-6 w-6" />, current: false },
    { name: 'Settings', href: route('admin.settings.index'), icon: <SettingsIcon className="h-6 w-6" />, current: false },
  ];

  const moduleLinks: ModuleNavItem[] = [
    { name: 'Control Room', href: route('admin.control-room.dashboard'), icon: <Briefcase className="h-6 w-6" />, current: isCurrent(route('admin.control-room.dashboard')) },
    { name: 'Clients', href: route('admin.clients.dashboard'), icon: <Building2 className="h-6 w-6" />, current: false },
    { name: 'Guards', href: route('admin.guards.dashboard'), icon: <ShieldCheck className="h-6 w-6" />, current: false },
    { name: 'HR', href: route('hr.dashboard'), icon: <Users2 className="h-6 w-6" />, current: false },
    { name: 'K9', href: route('k9.dashboard'), icon: <Shield className="h-6 w-6" />, current: false },
    { name: 'Finance', href: route('finance.dashboard'), icon: <Wallet className="h-6 w-6" />, current: false },
    { name: 'Marketing', href: route('admin.marketing'), icon: <Megaphone className="h-6 w-6" />, current: false },
  ];

  return (
    <div className="min-h-screen bg-red-50 dark:bg-gray-900">
      <Head title={title} />

      <div className={`fixed inset-0 bg-red-800 bg-opacity-50 z-40 md:hidden ${sidebarOpen ? 'block' : 'hidden'}`} onClick={() => setSidebarOpen(false)} />

      <div className={`fixed top-0 left-0 bottom-0 flex flex-col w-64 bg-red-900 dark:bg-gray-950 text-white transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out z-50`}>
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <img
              src="/images/coin-logo.png"
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
        <div className="flex-shrink-0 flex border-t border-red-800 dark:border-gray-800 p-4">
          <div className="flex items-center">
            <div>
              <div className="text-base font-medium text-white">{user?.name}</div>
              <div className="text-sm font-medium text-red-200 dark:text-gray-400">Admin</div>
            </div>
          </div>
        </div>
      </div>

      <div className="md:pl-64">
        <div className="sticky top-0 z-10 pl-1 pt-1 sm:pl-3 sm:pt-3 bg-red-50 dark:bg-gray-900 border-b border-red-100 dark:border-gray-800">
          <button type="button" className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-red-700 hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-500 md:hidden" onClick={() => setSidebarOpen(true)}>
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" />
          </button>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pb-3">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold text-red-900 dark:text-gray-100">{title}</h1>
              <div className="flex items-center gap-4">
                <button onClick={toggle} className="text-sm px-3 py-1 rounded-md bg-red-100 text-red-800 hover:bg-red-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </button>
                <div className="text-sm text-red-700 dark:text-gray-300">{user?.name}</div>
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
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 text-gray-900 dark:text-gray-100">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}