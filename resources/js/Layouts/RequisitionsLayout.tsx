import React from 'react';
import { usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import AppShellLayout from '@/Layouts/AppShellLayout';
import { getNavConfig, getProfileRoute, getRoleDisplay, getAIContext, LayoutContext } from '@/config/navigation';
import useCounters from '@/Hooks/useCounters';
import type { PageProps } from '@/types';

interface Props {
  title?: string;
  children: React.ReactNode;
}

export default function RequisitionsLayout({ title = 'Requisitions', children }: Props) {
  const page = usePage<PageProps<any>>();
  const { counters } = useCounters();
  const rawRoles = ((page.props as any)?.auth?.user?.roles ?? []) as (string | { id: number; name: string })[];
  const roles = rawRoles.map((r) => (typeof r === 'string' ? r : r.name));

  const isAdmin = roles.includes('admin') || roles.includes('super_admin');
  const isFinance = roles.some((r) => ['finance_officer', 'accountant', 'finance'].includes(r));
  const isAssets = roles.some((r) => ['asset_manager', 'assets_manager'].includes(r));
  const isOperations = roles.some((r) => ['operations_officer', 'operations_manager'].includes(r));

  if (isAdmin) {
    return <AuthenticatedLayout header={title}>{children}</AuthenticatedLayout>;
  }
  if (isFinance) {
    return <AuthenticatedLayout header={title}>{children}</AuthenticatedLayout>;
  }
  if (isAssets) {
    return <AuthenticatedLayout header={title}>{children}</AuthenticatedLayout>;
  }
  if (isOperations) {
    return <AuthenticatedLayout header={title}>{children}</AuthenticatedLayout>;
  }

  // Fallback for general authenticated users
  const ctx: LayoutContext = {
    roles,
    isSuperAdmin: roles.includes('super_admin'),
    isAdminUser: false,
    isClientUser: roles.includes('client'),
    isOpsManager: roles.includes('operations_manager'),
    counters,
  };

  return (
    <AppShellLayout
      title={title}
      sidebarTitle="Requisitions"
      sidebarIcon="ClipboardList"
      navSections={getNavConfig(ctx)}
      profileRoute={getProfileRoute(roles)}
      roleDisplay={getRoleDisplay(roles)}
      aiContext={getAIContext(roles)}
    >
      {children}
    </AppShellLayout>
  );
}
