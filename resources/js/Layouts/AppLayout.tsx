import React from 'react';
import { Link } from '@inertiajs/react';
import NotificationBell from '@/Components/Common/NotificationBell';
import IconMapper from '@/Components/IconMapper';
import QuickRequisitionButton from '@/Components/Requisitions/QuickRequisitionButton';
import QuickBudgetButton from '@/Components/Budgets/QuickBudgetButton';

type Props = {
  children: React.ReactNode;
  title?: string;
};

export default function AppLayout({ children, title }: Props) {
  const profileHref = (() => {
    try {
      const p = window.location.pathname;
      if (p.startsWith('/superadmin')) return route('superadmin.profile');
      if (p.startsWith('/admin/front-desk')) return route('admin.front-desk.profile');
      if (p.startsWith('/admin/marketing')) return route('admin.marketing.profile');
      if (p.startsWith('/admin/business-dev')) return route('admin.business-dev.profile');
      if (p.startsWith('/admin')) return route('admin.profile');
      if (p.startsWith('/control-room')) return route('control-room.profile');
      if (p.startsWith('/finance')) return route('finance.profile') as unknown as string;
      if (p.startsWith('/hr')) return route('hr.profile');
      if (p.startsWith('/assets')) return route('assets.profile');
      if (p.startsWith('/training')) return route('training.profile');
      if (p.startsWith('/front-office')) return route('front-office.profile');
      if (p.startsWith('/zone')) return route('zone.profile');
      if (p.startsWith('/supervisor')) return route('supervisor.profile');
      return route('profile.dashboard');
    } catch {
      return '/me';
    }
  })();

  return (
    <div className="min-h-screen bg-red-50 dark:bg-gray-950">
      {title && (
        <header className="sticky top-0 z-30 border-b border-red-100 bg-white/95 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/80">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-red-900 dark:text-gray-100">{title}</h1>
              <div className="flex items-center justify-end gap-2 sm:gap-3 shrink-0">
                <NotificationBell />
                <div className="hidden sm:flex items-center gap-3">
                  <QuickBudgetButton />
                  <QuickRequisitionButton />
                  <Link href={profileHref} className="inline-flex items-center rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white shadow-sm shadow-black/10 hover:bg-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800 dark:shadow-black/40">
                    My Profile
                  </Link>
                </div>
                <Link
                  href={profileHref}
                  className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-2 py-2 text-white shadow-sm shadow-black/10 hover:bg-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800 dark:shadow-black/40 sm:hidden"
                >
                  <IconMapper name="user" className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        </header>
      )}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-gray-900 dark:text-gray-100">
        <div className="animate-slideUp transition-all-smooth">
          {children}
        </div>
      </main>
    </div>
  );
}


