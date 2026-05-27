import React from 'react';
import { Link, Head, usePage } from '@inertiajs/react';
import IconMapper from '@/Components/IconMapper';
import NotificationBell from '@/Components/Common/NotificationBell';
import { User, PageProps } from '@/types';
import { useTheme } from '@/Providers/ThemeProvider';
import BaseShell from './BaseShell';
import { NavSection, SidebarHeader, UserSection, QuickStats } from '@/Components/Layout';
import { useRealtimeNotifications } from '@/Hooks/useRealtimeNotifications';
import AIAssistant from '@/Components/AI/AIAssistant';

interface Props {
  title: string;
  children: React.ReactNode;
  user?: User;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  badge?: string | number;
}

export default function ClientLayout({ title, children, user }: Props) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);
  const { theme, toggle } = useTheme();
  const page = usePage<PageProps>();
  const { appName } = page.props as any;

  const isCurrent = (href: string) => {
    try {
      const hrefPath = new URL(href, window.location.origin).pathname;
      return window.location.pathname === hrefPath;
    } catch {
      return window.location.pathname === href;
    }
  };

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

  const roleDisplay = roles.length > 0 ? roles[0].replace(/_/g, ' ') : 'Client';

  // Main Navigation
  const mainLinks: NavItem[] = [
    { name: 'Dashboard', href: route('client.dashboard'), icon: <IconMapper name="LayoutDashboard" size={20} /> },
    { name: 'My Sites', href: route('client.sites'), icon: <IconMapper name="Building" size={20} /> },
    { name: 'Reports', href: route('client.reports'), icon: <IconMapper name="FileText" size={20} /> },
    { name: 'Schedules', href: route('client.schedules'), icon: <IconMapper name="Calendar" size={20} /> },
    { name: 'Loyalty', href: route('client.loyalty.dashboard'), icon: <IconMapper name="Gift" size={20} /> },
  ];

  // Financial Navigation
  const financialLinks: NavItem[] = [
    { name: 'Invoices', href: route('client.invoices'), icon: <IconMapper name="Receipt" size={20} /> },
  ];

  // Support Navigation
  const supportLinks: NavItem[] = [
    { name: 'Support', href: route('client.support'), icon: <IconMapper name="Headphones" size={20} /> },
  ];

  // Account Navigation
  const accountLinks: NavItem[] = [
    { name: 'Profile', href: route('client.profile'), icon: <IconMapper name="User" size={20} /> },
    { name: 'Settings', href: route('client.settings'), icon: <IconMapper name="Settings" size={20} /> },
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
        <SidebarHeader title="Client Portal" appName={appName} iconName="Building2" />

        <nav className="flex-1 px-3 py-2 space-y-6 overflow-y-auto">
          <NavSection title="Main" items={mainLinks} isCurrent={isCurrent} />
          <NavSection title="Financial" items={financialLinks} isCurrent={isCurrent} />
          <NavSection title="Support" items={supportLinks} isCurrent={isCurrent} />
          <NavSection title="Account" items={accountLinks} isCurrent={isCurrent} />
        </nav>

        <UserSection
          user={user}
          roleDisplay={roleDisplay}
          profileRoute="client.profile"
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
        <BaseShell noHeader fullScreen={false}>
          <div className="transition-all ease-out duration-500">
            {children}
          </div>
        </BaseShell>
      </div>
      <AIAssistant context="client" />
    </div>
  );
}
