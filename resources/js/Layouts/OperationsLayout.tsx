import React, { useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import IconMapper from '@/Components/IconMapper';
import NotificationBell from '@/Components/Common/NotificationBell';
import { User } from '@/types';
import { useTheme } from '@/Providers/ThemeProvider';
import useCounters from '@/Hooks/useCounters';
import AIAssistant from '@/Components/AI/AIAssistant';
import { useRealtimeNotifications } from '@/Hooks/useRealtimeNotifications';
import ScannerModal from '@/Components/Scanner/ScannerModal';
import { NavSection, SidebarHeader, UserSection, QuickStats } from '@/Components/Layout';

interface Props {
  title: string;
  children: React.ReactNode;
  user?: User;
  showQrScanner?: boolean;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  badge?: string | number;
}

export default function OperationsLayout({ title, children, user, showQrScanner = true }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const { counters } = useCounters();
  const page = usePage<any>();
  const { appName } = page.props;

  const isCurrent = (href: string) => {
    try {
      const hrefPath = new URL(href, window.location.origin).pathname;
      return window.location.pathname === hrefPath;
    } catch {
      return window.location.pathname === href;
    }
  };

  const rawRoles = ((user as any)?.roles ?? (page?.props as any)?.auth?.user?.roles ?? []) as (string | { id: number; name: string })[];
  const roles = rawRoles.map((r) => (typeof r === 'string' ? r : r.name));
  const userId = (user as any)?.id ?? (page?.props as any)?.auth?.user?.id;

  // Initialize real-time notifications
  useRealtimeNotifications({ userId, userRoles: roles });

  const isSuperAdmin = roles.includes('super_admin');
  const isOperationsManager = roles.includes('operations_manager');
  const isClientUser = roles.includes('client');
  const roleDisplay = roles.length > 0 ? roles[0].replace(/_/g, ' ') : 'Operations';

  const operationsLinks: NavItem[] = [
    { name: 'Dashboard', href: route('operations.dashboard'), icon: <IconMapper name="LayoutDashboard" size={20} /> },
    ...(!isClientUser
      ? ([
          { name: 'Documents', href: route('documents.index'), icon: <IconMapper name="FileText" size={20} /> },
        ] as NavItem[])
      : []),
    { name: 'Site Coverage', href: route('operations.coverage.index'), icon: <IconMapper name="Building" size={20} /> },
    { name: 'Deployments', href: route('operations.coverage.sites'), icon: <IconMapper name="MapPin" size={20} /> },
    { name: 'Guard Roster', href: route('operations.guards.index'), icon: <IconMapper name="Shield" size={20} /> },
    { name: 'Shift Roster', href: route('operations.shifts.index'), icon: <IconMapper name="Calendar" size={20} /> },
    { name: 'Incidents', href: route('operations.reports.incidents'), icon: <IconMapper name="AlertTriangle" size={20} /> },
    { name: 'Reports', href: route('operations.reports.attendance'), icon: <IconMapper name="FileText" size={20} /> },
    { name: 'Requisitions', href: route('requisitions.index'), icon: <IconMapper name="ClipboardList" size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-red-50 dark:bg-gray-900 overflow-x-hidden">
      <Head title={title} />

      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 bg-red-900/50 dark:bg-gray-900/70 z-40 md:hidden ${sidebarOpen ? 'block' : 'hidden'}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 bottom-0 flex flex-col w-64 bg-red-900 dark:bg-gray-950 text-white transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 transition-transform duration-300 ease-in-out z-50`}
      >
        <SidebarHeader title="Field Ops" appName={appName} iconName="MapPin" />

        <nav className="flex-1 px-3 py-2 space-y-6 overflow-y-auto">
          <NavSection title="Field Operations" items={operationsLinks} isCurrent={isCurrent} />
        </nav>

        <UserSection
          user={user}
          roleDisplay={roleDisplay}
          profileRoute="operations.profile"
          showSuperAdmin={isSuperAdmin}
          superAdminRoute="superadmin.dashboard"
        />
      </div>

      {/* Main Content */}
      <div className="md:pl-64">
        {/* Header */}
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
                  <IconMapper name="Menu" size={24} />
                </button>
                <h1 className="text-lg sm:text-xl font-semibold text-red-900 dark:text-gray-100 truncate">{title}</h1>
              </div>
              <div className="flex items-center justify-end gap-1 sm:gap-3">
                <QuickStats />
                <NotificationBell />

                {/* Operations Manager Badge */}
                {isOperationsManager && (
                  <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 text-xs font-medium">
                    Manager View
                  </span>
                )}

                {/* Scan QR - Mobile only */}
                {showQrScanner && (
                  <button
                    onClick={() => setScannerOpen(true)}
                    className="flex sm:hidden items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors touch-target-min"
                    aria-label="Scan QR Code"
                  >
                    <IconMapper name="ScanLine" size={16} />
                    <span className="text-xs font-medium">Scan</span>
                  </button>
                )}

                <button
                  onClick={toggle}
                  className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 rounded-md bg-red-100 text-red-800 hover:bg-red-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 transition-colors touch-target-min"
                >
                  <span className="hidden sm:inline">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                  <span className="sm:hidden">{theme === 'dark' ? 'Light' : 'Dark'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1">
          <div className="py-4 sm:py-6">
            <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-8 text-gray-900 dark:text-gray-100">
              {children}
            </div>
          </div>
        </main>

        {/* AI Assistant */}
        <AIAssistant context="operations" />
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
