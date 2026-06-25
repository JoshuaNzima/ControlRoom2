import React from 'react';
import IconMapper from '@/Components/IconMapper';
import NotificationBell from '@/Components/Common/NotificationBell';
import QuickStats from '@/Components/Layout/QuickStats';
import { useTheme } from '@/Providers/ThemeProvider';
import { Link } from '@inertiajs/react';

interface ShellHeaderProps {
  title: string;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  /** Rendered after the Tasks button, before theme toggle */
  extraActions?: React.ReactNode;
  /** Show super admin link */
  superAdminLink?: React.ReactNode;
}

export default function ShellHeader({
  title,
  sidebarOpen,
  onToggleSidebar,
  extraActions,
  superAdminLink,
}: ShellHeaderProps) {
  const { theme, toggle } = useTheme();

  return (
    <div className="sticky top-0 z-30 border-b border-red-100 bg-white/95 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/80">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-8 py-2 sm:py-3">
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              className="h-10 w-10 inline-flex items-center justify-center rounded-md text-red-700 hover:bg-red-100 hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-600 md:hidden touch-target-min"
              onClick={onToggleSidebar}
            >
              <span className="sr-only">Open sidebar</span>
              <IconMapper name="Menu" size={24} />
            </button>
            <h1 className="text-lg sm:text-xl font-semibold text-red-900 dark:text-gray-100 truncate">{title}</h1>
          </div>
          <div className="flex items-center justify-end gap-1 sm:gap-3">
            <QuickStats />
            <NotificationBell />
            {extraActions}
            {superAdminLink}
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
  );
}
