import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import IconMapper from '@/Components/IconMapper';
import NotificationBell from '@/Components/Common/NotificationBell';
import { User } from '@/types';
import { useTheme } from '@/Providers/ThemeProvider';
import QuickRequisitionButton from '@/Components/Requisitions/QuickRequisitionButton';
import QuickBudgetButton from '@/Components/Budgets/QuickBudgetButton';
import AIAssistant from '@/Components/AI/AIAssistant';
import useCounters from '@/Hooks/useCounters';
import useGpsAlerts from '@/Hooks/useGpsAlerts';
import { useRealtimeNotifications } from '@/Hooks/useRealtimeNotifications';
import WeeklyTasks from '@/Components/WeeklyTasks';
import TutorialSection from '@/Components/Tutorials/TutorialSection';
import { NavSection, SidebarHeader, UserSection, QuickStats } from '@/Components/Layout';
import { motion, AnimatePresence } from 'framer-motion';

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

export default function ControlRoomLayout({ title, children, user }: Props) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [tasksOpen, setTasksOpen] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);
  const { theme, toggle } = useTheme();
  const { counters } = useCounters();
  const page = usePage<any>();
  const { weeklyTasks, isExecutiveAssistant, appName } = page.props;

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

  useGpsAlerts();

  // Initialize real-time notifications for QR scans and messages
  const rawRoles = ((user as any)?.roles ?? (page?.props as any)?.auth?.user?.roles ?? []) as (string | { id: number; name: string })[];
  const roles = rawRoles.map((r) => (typeof r === 'string' ? r : r.name));
  const userId = (user as any)?.id ?? (page?.props as any)?.auth?.user?.id;
  useRealtimeNotifications({
    userId,
    userRoles: roles,
  });
  const isSuperAdmin = roles.includes('super_admin');
  const isAdminUser = roles.includes('admin') || roles.includes('super_admin');
  const roleDisplay = roles.length > 0 ? roles[0].replace(/_/g, ' ') : 'Control Room';

  const controlRoomLinks: NavItem[] = [
    { name: 'Dashboard', href: route('control-room.dashboard'), icon: <IconMapper name="LayoutDashboard" size={20} /> },
    { name: 'Live Monitoring', href: route('control-room.monitoring'), icon: <IconMapper name="Activity" size={20} /> },
    { name: 'GPS Mismatch Incidents', href: route('control-room.gps-mismatch-incidents.index'), icon: <IconMapper name="MapPin" size={20} /> },
    { name: 'Incident Management', href: route('control-room.incidents.index'), icon: <IconMapper name="AlertTriangle" size={20} />, badge: counters?.control_incidents_open },
    { name: 'Camera Systems', href: route('control-room.cameras.index'), icon: <IconMapper name="Camera" size={20} /> },
    { name: 'Zone Management', href: route('control-room.zones.index'), icon: <IconMapper name="MapPin" size={20} /> },
    { name: 'Shift Management', href: route('control-room.shifts.index'), icon: <IconMapper name="Clock" size={20} /> },
    { name: 'Roster', href: route('control-room.roster.index'), icon: <IconMapper name="Calendar" size={20} /> },
    { name: 'Attendance History', href: route('control-room.attendance.index'), icon: <IconMapper name="ClipboardList" size={20} /> },
    { name: 'Tickets', href: route('control-room.tickets.index'), icon: <IconMapper name="Briefcase" size={20} />, badge: counters?.control_tickets_open },
    { name: 'Flags', href: route('control-room.flags.index'), icon: <IconMapper name="Flag" size={20} />, badge: counters?.control_flags_pending },
    { name: 'Downs', href: route('control-room.downs.index'), icon: <IconMapper name="Activity" size={20} />, badge: counters?.control_downs_active },
    { name: 'Public Intake Triage', href: route('control-room.triage.intakes.index'), icon: <IconMapper name="Inbox" size={20} /> },
  ];

  const communicationLinks: NavItem[] = [
    { name: 'Messaging', href: route('messages.conversations.index'), icon: <IconMapper name="MessageSquareText" size={20} /> },
    { name: 'Emergency Alerts', href: route('control-room.alerts'), icon: <IconMapper name="AlertTriangle" size={20} />, badge: counters?.alerts_active },
    { name: 'Support Chats', href: route('control-room.chats.index'), icon: <IconMapper name="Headphones" size={20} />, badge: counters?.chat_transfers_pending },
  ];

  const systemLinks: NavItem[] = [
    { name: 'Guards', href: route('control-room.guards'), icon: <IconMapper name="ShieldCheck" size={20} /> },
    { name: 'Assignments', href: route('control-room.assignments.index'), icon: <IconMapper name="Briefcase" size={20} /> },
    { name: 'Clients', href: route('control-room.clients'), icon: <IconMapper name="Building2" size={20} /> },
    { name: 'Checkpoints', href: route('control-room.checkpoints.index'), icon: <IconMapper name="MapPin" size={20} /> },
    { name: 'QR Codes', href: route('control-room.qr-codes.index'), icon: <IconMapper name="QrCode" size={20} /> },
    { name: 'Reports', href: route('control-room.reports'), icon: <IconMapper name="BarChart2" size={20} /> },
    { name: 'Settings', href: route('control-room.settings'), icon: <IconMapper name="Settings" size={20} /> },
    ...(!isAdminUser ? ([
      { name: 'My Requisitions', href: route('requisitions.index'), icon: <IconMapper name="ClipboardList" size={20} />, badge: counters?.requisitions_my_open },
    ] as NavItem[]) : []),
    { name: 'Budgets', href: route('budgets.index'), icon: <IconMapper name="PieChart" size={20} /> },
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
        <SidebarHeader title="Control Room" appName={appName} iconName="Activity" />

        <nav className="flex-1 px-3 py-2 space-y-6 overflow-y-auto">
          <NavSection title="Control Room" items={controlRoomLinks} isCurrent={isCurrent} />
          <NavSection title="Communication" items={communicationLinks} isCurrent={isCurrent} />
          <NavSection title="System" items={systemLinks} isCurrent={isCurrent} />
        </nav>

        <UserSection
          user={user}
          roleDisplay={roleDisplay}
          profileRoute="control-room.profile"
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
                <button
                  onClick={() => setTasksOpen(!tasksOpen)}
                  className="inline-flex items-center gap-1.5 rounded-md bg-coin-100 text-coin-700 hover:bg-coin-200 px-2 sm:px-3 py-1.5 text-xs sm:text-sm dark:bg-coin-900/30 dark:text-coin-200 transition-colors touch-target-min"
                  title="Toggle Tasks Panel"
                >
                  <IconMapper name="CheckSquare" size={16} />
                  <span className="hidden sm:inline">Tasks</span>
                </button>
                <div className="hidden sm:flex items-center gap-3">
                  <QuickBudgetButton />
                  <QuickRequisitionButton />
                </div>
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
              <div className={`grid gap-4 ${tasksOpen ? 'grid-cols-1 xl:grid-cols-4' : 'grid-cols-1'}`}>
                <div className={tasksOpen ? 'xl:col-span-3' : ''}>
                  <TutorialSection dashboard="control-room" canManage={false} />
                  {children}
                </div>
                <AnimatePresence>
                  {tasksOpen && (
                    <motion.div
                      initial={{ opacity: 0, x: 50, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: 50, scale: 0.95 }}
                      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                      className="xl:col-span-1"
                    >
                      <WeeklyTasks
                        tasks={weeklyTasks || []}
                        showModule={true}
                        isExecutiveAssistant={isExecutiveAssistant}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </main>
        {tasksOpen && isMobile && (
          <WeeklyTasks
            tasks={weeklyTasks || []}
            showModule={true}
            isExecutiveAssistant={isExecutiveAssistant}
            isOpen={tasksOpen}
            onClose={() => setTasksOpen(false)}
          />
        )}
        <AIAssistant context="control-room" />
      </div>
    </div>
  );
}
