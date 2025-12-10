import React from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import IconMapper from '@/Components/IconMapper';
import NotificationBell from '@/Components/Common/NotificationBell';
import { User, PageProps } from '@/types';
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

export default function FrontOfficeLayout({ title, children, user }: Props) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [logoOk, setLogoOk] = React.useState<boolean>(true);
  const { theme, toggle } = useTheme();
  const page = usePage<PageProps>();
  const roles = (((page.props as any)?.auth?.user?.roles) ?? []) as any;
  const isSuperAdmin = Array.isArray(roles) ? roles.includes('super_admin') : roles === 'super_admin';

  const normalizePath = (href: string) => {
    try { return new URL(href, window.location.origin).pathname; } catch { return href; }
  };
  const isCurrent = (href: string) => window.location.pathname === normalizePath(href);

  const safeRoute = (name: string, fallback: string) => {
    try { return route(name) as unknown as string; } catch { return fallback; }
  };

  const links: ModuleNavItem[] = [
    { name: 'Dashboard', href: safeRoute('front-office.dashboard', '/front-office'), icon: <IconMapper name="home" className="h-6 w-6" />, current: isCurrent(safeRoute('front-office.dashboard', '/front-office')) },
  ];

  const handleLogout = (e: React.FormEvent) => {
    e.preventDefault();
    router.post(route('logout'));
  };

  return (
    <div className="min-h-screen bg-red-50 dark:bg-gray-900">
      <Head title={title} />

      {/* Sidebar overlay */}
      <div className={`fixed inset-0 bg-red-900 bg-opacity-50 z-40 md:hidden ${sidebarOpen ? 'block' : 'hidden'}`} onClick={() => setSidebarOpen(false)} />

      {/* Sidebar */}
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
              <span className="text-white font-bold text-lg">CoinSec</span>
            )}
          </div>

          <nav className="mt-5 flex-1 px-2 space-y-1">
            {links.map((item, idx) => (
              <Link key={idx} href={item.href} className={`group flex items-center px-2 py-3 text-sm font-medium rounded-md transition-colors ${item.current ? 'bg-red-800 text-white' : 'text-red-100 hover:bg-red-800 hover:text-white'}`}>
                {item.icon}
                <span className="ml-3">{item.name}</span>
                {item.badge && (
                  <span className="ml-auto inline-block py-0.5 px-2 text-xs font-medium rounded-full bg-white/10 text-white">{item.badge}</span>
                )}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Main */}
      <div className="md:pl-64 flex flex-col flex-1">
        {/* Top bar */}
        <div className="sticky top-0 z-30 flex h-16 bg-white dark:bg-gray-800 border-b border-red-100 dark:border-gray-700">
          <button type="button" className="px-4 border-r border-gray-200 dark:border-gray-700 text-gray-500 focus:outline-none md:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex-1 flex items-center justify-between px-4">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h1>
            <div className="flex items-center space-x-4">
              <NotificationBell />
              {isSuperAdmin && (
                <Link
                  href={route('superadmin.dashboard')}
                  className="inline-flex items-center gap-2 rounded-md bg-red-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-600"
                >
                  <IconMapper name="shield" className="h-4 w-4" />
                  Super Admin
                </Link>
              )}
              <button onClick={toggle} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" title="Toggle Theme">
                {theme === 'dark' ? (
                  <IconMapper name="sun" className="h-5 w-5" />
                ) : (
                  <IconMapper name="moon" className="h-5 w-5" />
                )}
              </button>
              <Link href={route('profile.dashboard')} className="inline-flex items-center px-3 py-1.5 rounded-md bg-gray-800 text-white hover:bg-gray-700 text-sm">
                My Profile
              </Link>
              <form method="POST" action={route('logout')} onSubmit={handleLogout} className="inline">
                <button type="submit" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" title="Logout">
                  <IconMapper name="log-out" className="h-5 w-5" />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="animate-slideUp transition-all-smooth">
                {children}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
