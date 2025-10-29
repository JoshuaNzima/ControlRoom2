import { useState, useEffect, useRef } from "react";
import IconMapper from '@/Components/IconMapper';
import { Link, usePage, router } from "@inertiajs/react";
import { PageProps } from '@/types';
import { motion } from "framer-motion";
import { useTheme } from '@/Providers/ThemeProvider';
import useNotifications from '@/Hooks/useNotifications';
import { Toaster } from 'react-hot-toast';

const navLinks = [
  { href: "/supervisor/dashboard", label: "Dashboard", icon: <IconMapper name="Grid" size={22} /> },
  { href: "/supervisor/attendance", label: "Attendance", icon: <IconMapper name="Clipboard" size={22} /> },
  { href: "/supervisor/guards", label: "Guards", icon: <IconMapper name="Users2" size={22} /> },
];

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
  const { auth, notifications: serverNotifications } = usePage<PageProps<{ auth: { user: any }, notifications?: Notification[] }>>().props;
  const { url } = usePage();
  const { theme, toggle } = useTheme();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(serverNotifications || [
    { id: 1, title: "Guard Absent", message: "James Banda did not check in today", time: "10 min ago", read: false, type: "warning" },
    { id: 2, title: "Shift Updated", message: "Night shift schedule has been modified", time: "1 hour ago", read: false, type: "info" },
    { id: 3, title: "Report Submitted", message: "Mary Phiri submitted incident report", time: "2 hours ago", read: true, type: "success" },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

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
  const isActiveLink = (href: string) => url === href || url.startsWith(href + '/');
  const markAsRead = (id: number) => setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  const markAllAsRead = () => setNotifications(notifications.map(n => ({ ...n, read: true })));

  const getNotificationIcon = (type: string) => {
    switch (type) { case 'warning': return '⚠️'; case 'success': return '✅'; case 'error': return '❌'; default: return '📢'; }
  };

  return (
    <div
      className="flex flex-col h-screen md:flex-row bg-red-50 dark:bg-gray-900"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Mobile Header */}
      <header className="md:hidden bg-white dark:bg-gray-900 border-b border-red-100 dark:border-gray-800 px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-3 rounded-lg hover:bg-gray-100">
          {sidebarOpen ? <IconMapper name="X" size={24} /> : <IconMapper name="Menu" size={24} />}
        </button>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">{title || "CoinSec"}</h1>
        <div className="flex items-center gap-2">
          <button className="p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 relative" onClick={() => setNotificationsOpen(!notificationsOpen)}>
            <IconMapper name="Bell" size={22} />
            {unreadCount > 0 && <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">{unreadCount}</span>}
          </button>
          <button className="p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => setSettingsOpen(!settingsOpen)}>
            <IconMapper name="Settings" size={22} />
          </button>
          <button onClick={toggle} className="text-xs px-2 py-1 rounded-md bg-red-100 text-red-800 hover:bg-red-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">{theme === 'dark' ? 'Light' : 'Dark'}</button>
        </div>
      </header>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: "-100%" }}
        animate={{ x: sidebarOpen || !isMobile ? 0 : "-100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`fixed top-0 left-0 h-full bg-red-900 dark:bg-gray-950 text-white z-50 w-64 md:relative md:translate-x-0`}
      >
        {/* Header */}
          <div className="flex items-center justify-center md:justify-start px-6 py-4 border-b border-red-800 dark:border-gray-800 bg-red-900 dark:bg-gray-950">
          <img src="/images/Coin-logo.png" alt="CoinSec" className="h-8 w-auto" />
          <span className="font-bold text-xl text-white ml-2">CoinSec</span>
        </div>

        {/* User */}
        <div className="px-4 py-3 bg-red-800 dark:bg-gray-900 border-b border-red-700 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white font-bold">{auth.user.name.charAt(0)}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{auth.user.name}</p>
              <p className="text-xs text-red-200 dark:text-gray-400 truncate">{auth.user.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navLinks.map((link, idx) => (
            <Link
              key={`${link.href || link.label}-${idx}`}
              href={link.href}
              onClick={() => isMobile && setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${isActiveLink(link.href) ? 'bg-red-800 text-white font-semibold shadow-sm dark:bg-gray-800' : 'text-red-100 hover:bg-red-800 hover:text-white dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'}`}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-red-800 dark:border-gray-800">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 bg-white text-red-900 hover:bg-red-50 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 py-3 px-4 rounded-lg shadow-md transition-all font-semibold">
            <IconMapper name="LogOut" size={18} /> Logout
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Desktop Header */}
        <header className="hidden md:flex h-16 bg-red-50 dark:bg-gray-900 border-b border-red-100 dark:border-gray-800 px-6 items-center justify-between shadow-sm">
          <h1 className="text-xl font-bold text-red-900 dark:text-gray-100">{title || "Dashboard"}</h1>
          <div className="flex items-center gap-3">
            <button className="p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 relative" onClick={() => setNotificationsOpen(!notificationsOpen)}>
              <IconMapper name="Bell" size={22} />
              {unreadCount > 0 && <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">{unreadCount}</span>}
            </button>
            <button className="p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => setSettingsOpen(!settingsOpen)}>
              <IconMapper name="Settings" size={22} />
            </button>
            <div className="flex items-center gap-2 ml-2 pl-2 border-l">
              <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white font-bold text-sm">{auth.user.name.charAt(0)}</div>
              <span className="text-sm font-medium text-red-900 dark:text-gray-100">{auth.user.name}</span>
            </div>
            <button onClick={toggle} className="ml-2 text-sm px-3 py-1 rounded-md bg-red-100 text-red-800 hover:bg-red-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</button>
          </div>
        </header>

        {/* Page Content */}
              {/* Main Content */}
      <main className="flex-1 bg-red-50 dark:bg-gray-900 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-gray-900 dark:text-gray-100">
          {children}
        </div>
      </main>
      </div>

      {/* Notifications Panel */}
      {notificationsOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
          <div className="fixed top-16 right-4 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-2xl z-50 max-h-[80vh] flex flex-col animate-slideDown">
            <div className="p-4 border-b flex items-center justify-between bg-red-50">
              <h3 className="font-bold text-gray-900">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && <button onClick={markAllAsRead} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">Mark all read</button>}
                <button onClick={() => setNotificationsOpen(false)} className="p-1 rounded hover:bg-gray-200"><IconMapper name="X" size={18} /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto touch-auto">
              {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                  <IconMapper name="Bell" size={48} className="mx-auto mb-2 opacity-50" />
                  <p>No notifications</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map(notification => (
                    <div key={notification.id} className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${!notification.read ? 'bg-blue-50/50' : ''}`} onClick={() => markAsRead(notification.id)}>
                      <div className="flex items-start gap-3">
                        <span className="text-2xl flex-shrink-0">{getNotificationIcon(notification.type)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-gray-900 text-sm">{notification.title}</p>
                            {!notification.read && <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />}
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{notification.message}</p>
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
          <div className="fixed top-16 right-4 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-2xl z-50 animate-slideDown">
                <div className="p-4 border-b bg-red-50 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Quick Settings</h3>
              <button onClick={() => setSettingsOpen(false)} className="p-1 rounded hover:bg-gray-200">
                <IconMapper name="X" size={18} />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <Link href="/profile" onClick={() => setSettingsOpen(false)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors">
                <IconMapper name="User" size={20} className="text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900 text-sm">Profile</p>
                  <p className="text-xs text-gray-500">Manage your account</p>
                </div>
              </Link>
              <Link href="/settings" onClick={() => setSettingsOpen(false)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors">
                <IconMapper name="Settings" size={20} className="text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900 text-sm">Settings</p>
                  <p className="text-xs text-gray-500">App preferences</p>
                </div>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
