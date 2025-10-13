import React from 'react';
import { Head, Link } from '@inertiajs/react';
import IconMapper from '@/Components/IconMapper';
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

export default function ControlRoomLayout({ title, children, user }: Props) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [logoOk, setLogoOk] = React.useState<boolean>(true);
  const { theme, toggle } = useTheme();

  const isCurrent = (href: string) => window.location.pathname === href;

  const controlRoomLinks: ModuleNavItem[] = [
  { name: 'Control Room Dashboard', href: route('control-room.dashboard'), icon: <IconMapper name="home" className="h-6 w-6" />, current: isCurrent(route('control-room.dashboard')) },
  { name: 'Live Monitoring', href: route('control-room.monitoring'), icon: <IconMapper name="activity" className="h-6 w-6" />, current: false },
  { name: 'Incident Management', href: route('control-room.incidents.index'), icon: <IconMapper name="alert-triangle" className="h-6 w-6" />, current: false },
  { name: 'Camera Systems', href: route('control-room.cameras.index'), icon: <IconMapper name="camera" className="h-6 w-6" />, current: false },
  { name: 'Zone Management', href: route('control-room.zones'), icon: <IconMapper name="map-pin" className="h-6 w-6" />, current: false },
  { name: 'Shift Management', href: route('control-room.shifts.index'), icon: <IconMapper name="clock" className="h-6 w-6" />, current: false },
  { name: 'Tickets', href: route('control-room.tickets.index'), icon: <IconMapper name="briefcase" className="h-6 w-6" />, current: false },
  { name: 'Flags', href: route('control-room.flags.index'), icon: <IconMapper name="alert-triangle" className="h-6 w-6" />, current: false },
  { name: 'Downs', href: route('control-room.downs.index'), icon: <IconMapper name="activity" className="h-6 w-6" />, current: false },
  ];

    const communicationLinks: ModuleNavItem[] = [
    { name: 'Messaging', href: (() => {
      try {
        // User type may not include roles in all contexts; cast to any for safety
        const role = (user as any)?.roles?.[0]?.name;
        if (role === 'admin') return route('messaging.admin.index');
        if (role === 'guard') return route('messaging.guards.index');
        return route('control-room.messaging.index');
      } catch (e) {
        return route('control-room.messaging.index');
      }
    })(), icon: <IconMapper name="message-square-text" className="h-6 w-6" />, current: false },
    { name: 'Emergency Alerts', href: route('control-room.alerts'), icon: <IconMapper name="alert-triangle" className="h-6 w-6" />, current: false },
  ];

  const systemLinks: ModuleNavItem[] = [
    { name: 'Guards', href: route('control-room.guards'), icon: <IconMapper name="shield-check" className="h-6 w-6" />, current: false },
    { name: 'Assignments', href: route('control-room.assignments.index'), icon: <IconMapper name="briefcase" className="h-6 w-6" />, current: false },
    { name: 'Clients', href: route('control-room.clients'), icon: <IconMapper name="building-2" className="h-6 w-6" />, current: false },
    { name: 'Reports', href: route('control-room.reports'), icon: <IconMapper name="bar-chart-2" className="h-6 w-6" />, current: false },
    { name: 'Settings', href: route('control-room.settings'), icon: <IconMapper name="settings" className="h-6 w-6" />, current: false },
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
              <span className="ml-2 text-2xl font-bold text-white">ControlRoom</span>
            )}
          </div>
          <nav className="mt-8 flex-1 px-2 space-y-8">
            <div className="space-y-1">
              <h3 className="px-3 text-xs font-semibold text-red-200 dark:text-gray-400 uppercase tracking-wider">Control Room</h3>
              {controlRoomLinks.map((item) => (
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
              <h3 className="px-3 text-xs font-semibold text-red-200 dark:text-gray-400 uppercase tracking-wider">Communication</h3>
              {communicationLinks.map((item) => (
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
              <h3 className="px-3 text-xs font-semibold text-red-200 dark:text-gray-400 uppercase tracking-wider">System</h3>
              {systemLinks.map((item) => (
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
              <div className="text-sm font-medium text-red-200 dark:text-gray-400">Control Room Operator</div>
            </div>
          </div>
        </div>
      </div>

      <div className="md:pl-64">
        <div className="sticky top-0 z-10 pl-1 pt-1 sm:pl-3 sm:pt-3 bg-red-50 dark:bg-gray-900 border-b border-red-100 dark:border-gray-800">
            <button type="button" className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-red-700 hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-500 md:hidden" onClick={() => setSidebarOpen(true)}>
            <span className="sr-only">Open sidebar</span>
            <IconMapper name="menu" className="h-6 w-6" />
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
