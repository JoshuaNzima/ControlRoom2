import React, { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import IconMapper from '@/Components/IconMapper';
import NotificationBell from '@/Components/Common/NotificationBell';
import { User } from '@/types';
import { useTheme } from '@/Providers/ThemeProvider';
import FloatingNavButton from '@/Components/FloatingNavButton';
import useCounters from '@/Hooks/useCounters';
import { useRealtimeNotifications } from '@/Hooks/useRealtimeNotifications';
import ScannerModal from '@/Components/Scanner/ScannerModal';
import TutorialSection from '@/Components/Tutorials/TutorialSection';

interface Props {
  title: string;
  children: React.ReactNode;
  user?: User;
  showQrScanner?: boolean;
}

interface ModuleNavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  current: boolean;
  badge?: string;
}

export default function OperationsLayout({ title, children, user, showQrScanner = true }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const { counters } = useCounters();
  const page = usePage<any>();
  const { appName } = page.props;

  const rawRoles = ((user as any)?.roles ?? (page?.props as any)?.auth?.user?.roles ?? []) as (string | { id: number; name: string })[];
  const roles = rawRoles.map((r) => (typeof r === 'string' ? r : r.name));
  const userId = (user as any)?.id ?? (page?.props as any)?.auth?.user?.id;

  // Initialize real-time notifications
  useRealtimeNotifications({ userId, userRoles: roles });

  const isSuperAdmin = roles.includes('super_admin');
  const isOperationsManager = roles.includes('operations_manager');
  const roleDisplay = roles.length > 0 ? roles[0].replace(/_/g, ' ') : 'Operations';

  const isCurrent = (href: string) => window.location.pathname === href;

  const operationsLinks: ModuleNavItem[] = [
    { name: 'Dashboard', href: route('operations.dashboard'), icon: <IconMapper name="home" className="h-6 w-6" />, current: isCurrent(route('operations.dashboard')) },
    { name: 'Site Coverage', href: route('operations.coverage.index'), icon: <IconMapper name="building" className="h-6 w-6" />, current: false },
    { name: 'Deployments', href: route('operations.coverage.sites'), icon: <IconMapper name="map-pin" className="h-6 w-6" />, current: false },
    { name: 'Guard Roster', href: route('operations.guards.index'), icon: <IconMapper name="shield" className="h-6 w-6" />, current: false },
    { name: 'Shift Roster', href: route('operations.shifts.index'), icon: <IconMapper name="calendar" className="h-6 w-6" />, current: false },
    { name: 'Incidents', href: route('operations.reports.incidents'), icon: <IconMapper name="alert-triangle" className="h-6 w-6" />, current: false },
    { name: 'Reports', href: route('operations.reports.attendance'), icon: <IconMapper name="file-text" className="h-6 w-6" />, current: false },
    { name: 'Requisitions', href: route('requisitions.index'), icon: <IconMapper name="clipboard-list" className="h-6 w-6" />, current: false },
  ];

  return (
    <div className="min-h-screen bg-red-50 dark:bg-gray-900">
      <Head title={title} />

      <div className={`fixed inset-0 bg-red-900 bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-70 z-40 md:hidden ${sidebarOpen ? 'block' : 'hidden'}`} onClick={() => setSidebarOpen(false)} />

      <div className={`fixed top-0 left-0 bottom-0 flex flex-col w-64 bg-red-900 dark:bg-gray-950 text-white transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out z-50`}>
        {/* Logo / App Name */}
        <div className="flex items-center flex-shrink-0 px-4 py-5 border-b border-red-800 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
              <IconMapper name="map-pin" className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight text-white">Field Ops</h1>
              <p className="text-xs text-red-200 dark:text-gray-400">{appName}</p>
            </div>
          </div>
        </div>
        <div className="flex-1 flex flex-col overflow-y-auto">
          <nav className="flex-1 px-2 py-4 space-y-8">
            <div className="space-y-1">
              <h3 className="px-3 text-xs font-semibold text-red-200 dark:text-gray-400 uppercase tracking-wider">Field Operations</h3>
              {operationsLinks.map((item) => (
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
        <div className="flex-shrink-0 border-t border-red-800 dark:border-gray-800 p-4 bg-red-900 dark:bg-gray-950">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-red-800 dark:bg-gray-800 border-2 border-red-700 dark:border-gray-700 flex items-center justify-center text-white font-semibold text-sm">
              {user?.name?.charAt(0) || 'O'}
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
              href={route('operations.profile')}
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
                  className="h-10 w-10 inline-flex items-center justify-center rounded-md text-red-700 hover:bg-red-100 hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-600 md:hidden touch-target-min"
                  onClick={() => setSidebarOpen(true)}
                >
                  <span className="sr-only">Open sidebar</span>
                  <IconMapper name="menu" className="h-6 w-6" />
                </button>
                <h1 className="text-lg sm:text-xl font-semibold text-red-900 dark:text-gray-100 truncate">{title}</h1>
              </div>
              <div className="flex items-center justify-end gap-1 sm:gap-4 shrink-0">
                <NotificationBell />

                {/* Operations Manager Badge */}
                {isOperationsManager && (
                  <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 text-xs font-medium">
                    Manager View
                  </span>
                )}

                {isSuperAdmin && (
                  <Link
                    href={route('superadmin.dashboard')}
                    className="inline-flex items-center gap-2 rounded-md bg-red-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-600"
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
        <main className="flex-1">
          <div className="py-4 sm:py-6">
            <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-8 text-gray-900 dark:text-gray-100">
              <div className="animate-slideUp transition-all-smooth">
                <TutorialSection dashboard="admin" canManage={false} />
                {children}
              </div>
            </div>
          </div>
        </main>

        {/* Floating QR Scanner FAB - Available to both Officer and Manager */}
        {showQrScanner && (
          <button
            onClick={() => setScannerOpen(true)}
            className="fixed bottom-20 right-4 sm:bottom-24 sm:right-6 z-40 inline-flex items-center justify-center gap-2 rounded-full bg-red-600 text-white hover:bg-red-700 shadow-lg hover:shadow-xl transition-all px-4 py-3 sm:px-5 sm:py-4 touch-target-min"
            aria-label="Scan QR Code"
          >
            <IconMapper name="ScanLine" className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-sm sm:text-base font-medium">Scan QR</span>
          </button>
        )}
      </div>

      {/* QR Scanner Modal */}
      {showQrScanner && (
        <ScannerModal
          open={scannerOpen}
          onClose={() => setScannerOpen(false)}
        />
      )}
    </div>
  );
}
