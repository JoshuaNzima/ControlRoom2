import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import IconMapper from '@/Components/IconMapper';
import NotificationBell from '@/Components/Common/NotificationBell';
import { User } from '@/types';
import { useTheme } from '@/Providers/ThemeProvider';
import useCounters from '@/Hooks/useCounters';
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

export default function TaskTrackerLayout({ title, children, user }: Props) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [logoOk, setLogoOk] = React.useState<boolean>(true);
  const { theme, toggle } = useTheme();
  const { counters } = useCounters();
  const page = usePage<any>();
  const appName = (page?.props as any)?.appName ?? 'CoinSec';
  const rawRoles = ((user as any)?.roles ?? (page?.props as any)?.auth?.user?.roles ?? []) as (string | { id: number; name: string })[];
  const roles = rawRoles.map((r) => (typeof r === 'string' ? r : r.name));
  const userId = (user as any)?.id ?? (page?.props as any)?.auth?.user?.id;

  // Initialize real-time notifications
  useRealtimeNotifications({ userId, userRoles: roles });

  const isExecutiveAssistant = roles.includes('executive_assistant') || roles.includes('super_admin');

  const isCurrent = (href: string) => window.location.pathname === href;

  const mainLinks: NavItem[] = [
    {
      name: 'Tasks',
      href: route('tasks.dashboard'),
      icon: <IconMapper name="clipboard-list" className="h-6 w-6" />,
      current: isCurrent(route('tasks.dashboard')) || isCurrent(route('tasks.my')),
      badge: (() => {
        const n = Number(counters?.tasks_my_open || 0);
        return n > 0 ? String(n) : undefined;
      })(),
    },
  ];

  const navSections = [
    { title: 'Tasks', items: mainLinks },
  ];

  return (
    <div className="min-h-screen bg-red-50 dark:bg-gray-900">
      <Head title={title} />

      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 bg-red-800/50 dark:bg-gray-900/70 z-40 md:hidden ${sidebarOpen ? 'block' : 'hidden'}`}
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
              <IconMapper name="check-square" className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight text-white">Task Tracker</h1>
              <p className="text-xs text-red-200 dark:text-gray-400">{appName}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-y-auto">
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navSections.map((section) => (
              <div key={section.title} className="mb-4">
                <h3 className="px-3 text-xs font-semibold text-red-200 dark:text-gray-400 uppercase tracking-wider mb-2">
                  {section.title}
                </h3>
                {section.items.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                      item.current
                        ? 'bg-red-800 dark:bg-gray-800 text-white'
                        : 'text-red-100 dark:text-gray-300 hover:bg-red-800 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="mr-3 flex-shrink-0">{item.icon}</div>
                    <span className="flex-1 truncate">{item.name}</span>
                    {item.badge && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-600 dark:bg-red-500 text-white">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            ))}
          </nav>
        </div>

        <div className="flex-shrink-0 border-t border-red-800 dark:border-gray-800 p-4 bg-red-900 dark:bg-gray-950">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-red-800 dark:bg-gray-800 border-2 border-red-700 dark:border-gray-700 flex items-center justify-center text-white font-semibold text-sm">
              {(user as any)?.name?.charAt(0) || 'T'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{(user as any)?.name}</p>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs border font-medium bg-red-500/20 text-red-200 border-red-500/30">
                Task Tracker
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-red-900 dark:bg-gray-950 shadow-sm">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              className="md:hidden -ml-0.5 -mt-0.5 inline-flex items-center justify-center p-2 rounded-md text-red-200 dark:text-gray-400 hover:text-white hover:bg-red-800 dark:hover:bg-gray-800 focus:outline-none"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <IconMapper name="menu" className="h-6 w-6" />
            </button>

            <div className="flex-1" />

            <div className="flex items-center gap-4">
              <button
                onClick={toggle}
                className="p-2 rounded-lg text-red-200 dark:text-gray-400 hover:text-white hover:bg-red-800 dark:hover:bg-gray-800"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <IconMapper name="sun" className="h-5 w-5" />
                ) : (
                  <IconMapper name="moon" className="h-5 w-5" />
                )}
              </button>
              <NotificationBell />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 py-6 px-4 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
