import React, { PropsWithChildren, ReactNode } from 'react';
import { usePage } from '@inertiajs/react';
import AppShellLayout from '@/Layouts/AppShellLayout';
import { getNavConfig, getProfileRoute, getRoleDisplay, getLayoutConfig, LayoutContext } from '@/config/navigation';
import useCounters from '@/Hooks/useCounters';
import { User } from '@/types';

interface AuthenticatedProps {
  user?: User;
  header?: ReactNode;
  children: ReactNode;
  showQrScanner?: boolean;
}

export default function AuthenticatedLayout({ user, header, children, showQrScanner }: AuthenticatedProps) {
  const page = usePage<any>();
  const { counters } = useCounters();
  const resolvedUser = user || page?.props?.auth?.user;

  const rawRoles: any[] = (resolvedUser as any)?.roles ?? page?.props?.auth?.user?.roles ?? [];
  const roles: string[] = rawRoles.map((r: any) => (typeof r === 'string' ? r : r.name));

  const ctx: LayoutContext = {
    roles,
    isSuperAdmin: roles.includes('super_admin'),
    isAdminUser: roles.includes('admin') || roles.includes('super_admin'),
    isClientUser: roles.includes('client'),
    isOpsManager: roles.includes('operations_manager'),
    counters,
  };

  const title = typeof header === 'string' ? header : (header as any)?.props?.children ?? 'Dashboard';
  const config = getLayoutConfig(roles);

  // Attendance summary for supervisor/sergeant roles
  const attendanceSummary =
    roles.includes('supervisor') || roles.includes('sergeant')
      ? [
          { label: 'Checked In', value: counters?.attendance_checked_in_today ?? 0, icon: 'LogIn', color: 'text-emerald-400' },
          { label: 'Absent', value: counters?.attendance_absent_today ?? 0, icon: 'XCircle', color: 'text-red-400' },
          { label: 'Covered', value: counters?.attendance_covered_today ?? 0, icon: 'UserCheck', color: 'text-blue-400' },
        ]
      : undefined;

  return (
    <AppShellLayout
      title={String(title)}
      user={resolvedUser}
      sidebarTitle={config.sidebarTitle}
      sidebarIcon={config.sidebarIcon}
      navSections={getNavConfig(ctx)}
      profileRoute={getProfileRoute(roles)}
      roleDisplay={getRoleDisplay(roles)}
      aiContext={config.aiContext}
      isSuperAdmin={config.isSuperAdmin}
      showScanner={showQrScanner ?? config.showScanner}
      showBudget={config.showBudget}
      showRequisition={config.showRequisition}
      showTasks={config.showTasks}
      attendanceSummary={attendanceSummary}
    >
      {children}
    </AppShellLayout>
  );
}
