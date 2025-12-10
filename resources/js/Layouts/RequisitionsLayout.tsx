import React from 'react';
import { usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import FinanceLayout from '@/Layouts/FinanceLayout';
import AssetManagementLayout from '@/Layouts/AssetManagementLayout';
import AppLayout from '@/Layouts/AppLayout';
import type { PageProps } from '@/types';

interface Props {
  title?: string;
  children: React.ReactNode;
}

export default function RequisitionsLayout({ title = 'Requisitions', children }: Props) {
  const page = usePage<PageProps<any>>();
  const roles: string[] = Array.isArray((page.props as any)?.auth?.user?.roles)
    ? ((page.props as any).auth.user.roles as string[])
    : [];

  const isAdmin = roles.includes('admin') || roles.includes('super_admin');
  const isFinance = roles.some((r) => ['finance_officer', 'accountant', 'finance'].includes(r));
  const isAssets = roles.some((r) => ['asset_manager', 'assets_manager'].includes(r));

  if (isAdmin) {
    return <AdminLayout title={title}>{children}</AdminLayout>;
  }
  if (isFinance) {
    return <FinanceLayout title={title}>{children}</FinanceLayout>;
  }
  if (isAssets) {
    return <AssetManagementLayout title={title}>{children}</AssetManagementLayout>;
  }

  // Fallback for general authenticated users
  return (
    <AppLayout title={title}>
      {children}
    </AppLayout>
  );
}
