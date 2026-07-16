import React, { useRef } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import IconMapper from '@/Components/IconMapper';
import NotificationBell from '@/Components/Common/NotificationBell';
import QuickRequisitionButton from '@/Components/Requisitions/QuickRequisitionButton';
import QuickBudgetButton from '@/Components/Budgets/QuickBudgetButton';
import AIAssistant from '@/Components/AI/AIAssistant';
import ScannerModal from '@/Components/Scanner/ScannerModal';
import {
  NavSection,
  SidebarHeader,
  UserSection,
  QuickStats,
  AnimatedCounter,
} from '@/Components/Layout';
import ShellHeader from '@/Components/Layout/ShellHeader';
import ShellTasksPanel from '@/Components/Layout/ShellTasksPanel';
import { useTheme } from '@/Providers/ThemeProvider';
import useCounters from '@/Hooks/useCounters';
import useGpsAlerts from '@/Hooks/useGpsAlerts';
import { useRealtimeNotifications } from '@/Hooks/useRealtimeNotifications';
import { User } from '@/types';
import { NavSection as NavSectionType, getAIContext } from '@/config/navigation';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface AttendanceSummaryItem {
  label: string;
  value: number;
  icon: string;
  color: string;
}

export interface AppShellProps {
  title: string;
  children: React.ReactNode;
  navSections: NavSectionType[];
  profileRoute: string;
  roleDisplay: string;
  sidebarTitle: string;
  sidebarIcon: string;
  aiContext?: string;
  showScanner?: boolean;
  showBudget?: boolean;
  showRequisition?: boolean;
  showTasks?: boolean;
  user?: User;
  isSuperAdmin?: boolean;
  headerExtra?: React.ReactNode;
  attendanceSummary?: AttendanceSummaryItem[];
}

// ===================================================================
// AppShellLayout — the single unified layout
// ===================================================================
export default function AppShellLayout({
  title,
  children,
  navSections,
  profileRoute,
  roleDisplay,
  sidebarTitle,
  sidebarIcon,
  aiContext,
  showScanner = false,
  showBudget = true,
  showRequisition = true,
  showTasks = true,
  user: propUser,
  isSuperAdmin = false,
  headerExtra,
  attendanceSummary,
}: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [scannerOpen, setScannerOpen] = React.useState(false);
  const [tasksOpen, setTasksOpen] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);

  const { theme, toggle } = useTheme();
  const { counters } = useCounters();
  const page = usePage<any>();

  const user = propUser || page?.props?.auth?.user;
  const userId = user?.id;

  const rawRoles: any[] = (user as any)?.roles ?? page?.props?.auth?.user?.roles ?? [];
  const roles: string[] = rawRoles.map((r: any) => (typeof r === 'string' ? r : r.name));

  const weeklyTasks = (page?.props as any)?.weeklyTasks ?? [];
  const isExecutiveAssistant = (page?.props as any)?.isExecutiveAssistant ?? false;
  const appName = (page?.props as any)?.appName ?? 'CoinSec';
  const resolvedAiContext = aiContext || getAIContext(roles);

  useRealtimeNotifications({ userId, userRoles: roles });
  useGpsAlerts();

  // Mobile detection
  React.useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Touch gestures
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchMove = (e: React.TouchEvent) => { touchEndX.current = e.touches[0].clientX; };
  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diff = touchEndX.current - touchStartX.current;
    if (diff > 50) setSidebarOpen(true);
    if (diff < -50) setSidebarOpen(false);
    touchStartX.current = null; touchEndX.current = null;
  };

  // isCurrent helper
  const isCurrent = (href: string) => {
    try {
      const hrefPath = new URL(href, window.location.origin).pathname;
      return window.location.pathname === hrefPath;
    } catch {
      return window.location.pathname === href;
    }
  };

  // Default header actions
  const defaultExtra = (
    <>
      {showTasks && (
        <button
          onClick={() => setTasksOpen(!tasksOpen)}
          className="inline-flex items-center gap-1.5 rounded-md bg-coin-100 text-coin-700 hover:bg-coin-200 px-2 sm:px-3 py-1.5 text-xs sm:text-sm dark:bg-coin-900/30 dark:text-coin-200 transition-colors touch-target-min"
          title="Toggle Tasks Panel"
        >
          <IconMapper name="CheckSquare" size={16} />
          <span className="hidden sm:inline">Tasks</span>
        </button>
      )}
      <div className="hidden sm:flex items-center gap-3">
        {showBudget && <QuickBudgetButton />}
        {showRequisition && <QuickRequisitionButton />}
      </div>
      <button
        onClick={toggle}
        className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 rounded-md bg-red-100 text-red-800 hover:bg-red-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 transition-colors touch-target-min"
      >
        <span className="hidden sm:inline">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        <span className="sm:hidden">{theme === 'dark' ? 'Light' : 'Dark'}</span>
      </button>
    </>
  );

  // ---- Render ----
  return (
    <div
      className="min-h-screen bg-red-50 dark:bg-gray-900 overflow-x-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <Head title={title} />

      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 bg-red-900/50 dark:bg-gray-900/70 z-40 md:hidden ${
          sidebarOpen ? 'block' : 'hidden'
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: sidebarOpen || !isMobile ? 0 : '-100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed top-0 left-0 bottom-0 flex flex-col w-64 bg-red-900 dark:bg-gray-950 text-white z-50 md:translate-x-0"
      >
        <SidebarHeader title={sidebarTitle} appName={appName} iconName={sidebarIcon} />

        <nav className="flex-1 px-3 py-2 space-y-6 overflow-y-auto">
          {navSections.map((section) => (
            <NavSection
              key={section.title}
              title={section.title}
              items={section.items}
              isCurrent={isCurrent}
            />
          ))}

          {attendanceSummary && attendanceSummary.length > 0 && (
            <div className="border-t border-red-700/40 dark:border-gray-700/40 pt-3">
              <p className="px-2 text-[10px] uppercase tracking-wider text-red-300 dark:text-gray-500 font-semibold mb-2">
                Today's Attendance
              </p>
              <div className="grid grid-cols-3 gap-1.5 px-1">
                {attendanceSummary.map((item) => (
                  <div
                    key={item.label}
                    className="flex flex-col items-center justify-center bg-red-800/40 dark:bg-gray-800/60 rounded-lg py-2 px-1"
                  >
                    <IconMapper name={item.icon} size={16} className={item.color} />
                    <span className="text-white font-bold text-sm mt-0.5">
                      <AnimatedCounter value={item.value} duration={600} />
                    </span>
                    <span className="text-[10px] text-red-300/80 dark:text-gray-400 truncate max-w-full text-center leading-tight">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </nav>

        <UserSection
          user={user}
          roleDisplay={roleDisplay}
          profileRoute={profileRoute}
          showSuperAdmin={isSuperAdmin}
          superAdminRoute="superadmin.dashboard"
        />
      </motion.aside>

      {/* Main Content */}
      <div className="md:pl-64">
        <ShellHeader
          title={title}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(true)}
          extraActions={headerExtra || defaultExtra}
        />

        {/* Page Content */}
        <main className="flex-1">
          <div className="py-4 sm:py-6">
            <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-8 text-gray-900 dark:text-gray-100">
              <div className={`grid gap-4 ${tasksOpen && showTasks ? 'grid-cols-1 xl:grid-cols-4' : 'grid-cols-1'}`}>
                <div className={tasksOpen && showTasks ? 'xl:col-span-3' : ''}>
                  {children}
                </div>
                {showTasks && (
                  <ShellTasksPanel
                    tasksOpen={tasksOpen}
                    weeklyTasks={weeklyTasks}
                    isExecutiveAssistant={isExecutiveAssistant}
                    showModule={true}
                    isMobile={isMobile}
                    onClose={() => setTasksOpen(false)}
                  />
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Scanner Modal */}
        {showScanner && (
          <ScannerModal open={scannerOpen} onClose={() => setScannerOpen(false)} />
        )}

        <AIAssistant context={resolvedAiContext} />
      </div>
    </div>
  );
}
