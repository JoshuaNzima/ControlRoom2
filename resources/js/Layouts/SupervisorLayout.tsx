import { useState, useEffect, useRef } from "react";
import IconMapper from '@/Components/IconMapper';
import BaseShell from './BaseShell';
import { Link, usePage, router } from "@inertiajs/react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from '@/Providers/ThemeProvider';
import { useRealtimeNotifications } from '@/Hooks/useRealtimeNotifications';
import NotificationBell from '@/Components/Common/NotificationBell';
import WeeklyTasks from '@/Components/WeeklyTasks';
import AIAssistant from '@/Components/AI/AIAssistant';
import useCounters from '@/Hooks/useCounters';
import { NavSection, SidebarHeader, UserSection, QuickStats, AnimatedCounter } from '@/Components/Layout';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

interface SupervisorLayoutProps {
  children: React.ReactNode;
  title?: string;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'info' | 'warning' | 'success' | 'error';
}

export default function SupervisorLayout({ children, title }: SupervisorLayoutProps) {
  const pageProps = usePage<any>().props;
  const { auth, roleType, isSergeant: pageIsSergeant, notifications: serverNotifications, weeklyTasks, isExecutiveAssistant } = pageProps;
  const appName = pageProps.appName ?? 'CoinSec';
  const { url } = usePage();
  const { theme, toggle } = useTheme();

  // Normalize roles to string array
  const rawRoles = ((auth?.user as any)?.roles ?? []) as (string | { id: number; name: string })[];
  const roles = rawRoles.map((r) => (typeof r === 'string' ? r : r.name));

  // Initialize real-time notifications for QR scans and messages
  useRealtimeNotifications({
    userId: auth?.user?.id,
    userRoles: roles,
  });

  const isSuperAdmin = roles.includes('super_admin');

  // Sergeant and supervisor are now consolidated into one unified role
  const isSergeant = pageIsSergeant || roles.includes('sergeant') || roleType === 'sergeant';
  const roleLabel = 'Supervisor';
  const displayTitle = title ? `${roleLabel} - ${title}` : `${roleLabel} Dashboard`;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [tasksOpen, setTasksOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(serverNotifications || [
    { id: 1, title: "Guard Absent", message: "James Banda did not check in today", time: "10 min ago", read: false, type: "warning" },
    { id: 2, title: "Shift Updated", message: "Night shift schedule has been modified", time: "1 hour ago", read: false, type: "info" },
    { id: 3, title: "Report Submitted", message: "Mary Phiri submitted incident report", time: "2 hours ago", read: true, type: "success" },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const isCurrent = (href: string) => {
    try {
      const hrefPath = new URL(href, window.location.origin).pathname;
      return window.location.pathname === hrefPath || url === href || url.startsWith(href + '/');
    } catch {
      return url === href || url.startsWith(href + '/');
    }
  };

  const navLinks: NavItem[] = [
    { name: "Overview", href: route('supervisor.overview'), icon: <IconMapper name="LayoutDashboard" size={20} /> },
    { name: "Guards", href: route('supervisor.guards'), icon: <IconMapper name="Users" size={20} /> },
    { name: "Analytics", href: route('supervisor.analytics'), icon: <IconMapper name="BarChart3" size={20} /> },
    { name: "Attendance", href: route('supervisor.attendance'), icon: <IconMapper name="ClipboardList" size={20} /> },
    { name: "Reports", href: route('supervisor.reports'), icon: <IconMapper name="FileText" size={20} /> },
  ];

  // Touch gestures for mobile sidebar
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

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLogout = (e?: React.FormEvent) => { e?.preventDefault(); router.post("/logout"); };
  const markAsRead = (id: number) => setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  const markAllAsRead = () => setNotifications(notifications.map(n => ({ ...n, read: true })));

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'warning': return <IconMapper name="AlertTriangle" size={20} className="text-yellow-500" />;
      case 'success': return <IconMapper name="CheckCircle" size={20} className="text-green-500" />;
      case 'error': return <IconMapper name="XCircle" size={20} className="text-red-500" />;
      default: return <IconMapper name="Bell" size={20} className="text-blue-500" />;
    }
  };

  // Attendance summary from global counters
  const { counters } = useCounters();
  const attendanceSummaryItems = [
    { label: 'Checked In', value: counters?.attendance_checked_in_today ?? 0, icon: 'LogIn', color: 'text-emerald-400' },
    { label: 'Absent', value: counters?.attendance_absent_today ?? 0, icon: 'XCircle', color: 'text-red-400' },
    { label: 'Covered', value: counters?.attendance_covered_today ?? 0, icon: 'UserCheck', color: 'text-blue-400' },
  ];

  return (
    <div
      className="flex flex-col h-screen md:flex-row bg-red-50 dark:bg-gray-900 overflow-x-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Mobile Header */}
      <header className="md:hidden bg-white dark:bg-gray-900 border-b border-red-100 dark:border-gray-800 px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 touch-target-min">
          {sidebarOpen ? <IconMapper name="X" size={24} /> : <IconMapper name="Menu" size={24} />}
        </button>
        <div className="flex flex-col items-center">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">{displayTitle || "CoinSec"}</h1>
        </div>
        <div className="flex items-center justify-end gap-2 shrink-0">
          <NotificationBell />
          {isSuperAdmin && (
            <Link href={route('superadmin.dashboard')} className="inline-flex items-center gap-2 rounded-md bg-red-700 px-2 py-2 text-xs font-medium text-white touch-target-min">
              <IconMapper name="Shield" size={14} />
              <span className="hidden sm:inline">Super Admin</span>
              <span className="sm:hidden">SA</span>
            </Link>
          )}
          <button className="p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 touch-target-min" onClick={() => setSettingsOpen(!settingsOpen)}>
            <IconMapper name="Settings" size={22} />
          </button>
          <button onClick={toggle} className="text-xs px-2 py-1.5 rounded-md bg-red-100 text-red-800 hover:bg-red-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 touch-target-min">{theme === 'dark' ? 'Light' : 'Dark'}</button>
        </div>
      </header>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: "-100%" }}
        animate={{ x: sidebarOpen || !isMobile ? 0 : "-100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`fixed top-0 left-0 h-full bg-red-900 dark:bg-gray-950 text-white z-50 w-64 md:relative md:translate-x-0 flex flex-col`}
      >
        <SidebarHeader title="Supervisor" appName={appName} iconName="UserCheck" />

        <nav className="flex-1 px-3 py-2 space-y-4 overflow-y-auto">
          <NavSection title="Navigation" items={navLinks} isCurrent={isCurrent} />

          {/* Attendance Summary Badges */}
          <div className="border-t border-red-700/40 dark:border-gray-700/40 pt-3">
            <p className="px-2 text-[10px] uppercase tracking-wider text-red-300 dark:text-gray-500 font-semibold mb-2">
              Today's Attendance
            </p>
            <div className="grid grid-cols-3 gap-1.5 px-1">
              {attendanceSummaryItems.map((item) => (
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
        </nav>

        <UserSection
          user={auth?.user}
          roleDisplay={roleLabel}
          profileRoute="supervisor.profile"
          showSuperAdmin={isSuperAdmin}
          superAdminRoute="superadmin.dashboard"
        />
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Desktop Header */}
        <header className="hidden md:flex h-16 bg-red-50 dark:bg-gray-900 border-b border-red-100 dark:border-gray-800 px-6 items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-red-900 dark:text-gray-100">{displayTitle || "Dashboard"}</h1>
          </div>
          <div className="flex items-center gap-3">
            <QuickStats />
            <NotificationBell />
            <button
              onClick={() => setTasksOpen(!tasksOpen)}
              className="inline-flex items-center gap-1.5 rounded-md bg-coin-100 text-coin-700 hover:bg-coin-200 px-3 py-1.5 text-sm dark:bg-coin-900/30 dark:text-coin-200 transition-colors touch-target-min"
              title="Toggle Tasks Panel"
            >
              <IconMapper name="CheckSquare" size={16} />
              Tasks
            </button>
            <button className="p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 touch-target-min" onClick={() => setSettingsOpen(!settingsOpen)}>
              <IconMapper name="Settings" size={22} />
            </button>
            <button onClick={toggle} className="text-sm px-3 py-1.5 rounded-md bg-red-100 text-red-800 hover:bg-red-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 touch-target-min">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 bg-red-50 dark:bg-gray-900 overflow-y-auto">
          <BaseShell noHeader fullScreen={false}>
            <div className="transition-all ease-out duration-500">
              <div className={`grid gap-4 ${tasksOpen ? 'grid-cols-1 xl:grid-cols-4' : 'grid-cols-1'}`}>
                <div className={tasksOpen ? 'xl:col-span-3' : ''}>
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
                      <WeeklyTasks tasks={weeklyTasks || []} showModule={false} isExecutiveAssistant={isExecutiveAssistant || false} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </BaseShell>
        </div>
      </div>

      {/* Notifications Panel */}
      {notificationsOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
          <div className="fixed top-16 right-4 w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-900 rounded-xl shadow-2xl z-50 max-h-[80vh] flex flex-col animate-slideDown">
            <div className="p-4 border-b flex items-center justify-between bg-red-50 dark:bg-gray-800">
              <h3 className="font-bold text-gray-900 dark:text-gray-100">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && <button onClick={markAllAsRead} className="text-xs text-red-600 hover:text-red-800 font-medium">Mark all read</button>}
                <button onClick={() => setNotificationsOpen(false)} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"><IconMapper name="X" size={18} /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto touch-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <IconMapper name="Bell" size={48} className="mx-auto mb-2 opacity-50" />
                  <p>No notifications</p>
                </div>
              ) : (
                <div className="divide-y dark:divide-gray-700">
                  {notifications.map(notification => (
                    <div key={notification.id} className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer ${!notification.read ? 'bg-red-50/50 dark:bg-red-900/20' : ''}`} onClick={() => markAsRead(notification.id)}>
                      <div className="flex items-start gap-3">
                        <span className="text-2xl flex-shrink-0">{getNotificationIcon(notification.type)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{notification.title}</p>
                            {!notification.read && <span className="w-2 h-2 bg-red-600 rounded-full flex-shrink-0" />}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">{notification.message}</p>
                          <p className="text-xs text-gray-400">{notification.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Settings Panel */}
      {settingsOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setSettingsOpen(false)} />
          <div className="fixed top-16 right-4 w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-900 rounded-xl shadow-2xl z-50 animate-slideDown">
            <div className="p-4 border-b bg-red-50 dark:bg-gray-800 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 dark:text-gray-100">Quick Settings</h3>
              <button onClick={() => setSettingsOpen(false)} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700">
                <IconMapper name="X" size={18} />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <Link href={route('supervisor.profile')} onClick={() => setSettingsOpen(false)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <IconMapper name="User" size={20} className="text-gray-600 dark:text-gray-300" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">Profile</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Manage your account</p>
                </div>
              </Link>
              <Link href="/settings" onClick={() => setSettingsOpen(false)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <IconMapper name="Settings" size={20} className="text-gray-600 dark:text-gray-300" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">Settings</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">App preferences</p>
                </div>
              </Link>
            </div>
          </div>
        </>
      )}

      <AIAssistant context="supervisor" />
    </div>
  );
}
