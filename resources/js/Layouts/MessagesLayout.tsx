import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import type { User } from '@/types';
import AdminLayout from '@/Layouts/AdminLayout';
import AssetManagementLayout from '@/Layouts/AssetManagementLayout';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import BusinessDevLayout from '@/Layouts/BusinessDevLayout';
import ControlRoomLayout from '@/Layouts/ControlRoomLayout';
import FinanceLayout from '@/Layouts/FinanceLayout';
import FrontDeskLayout from '@/Layouts/FrontDeskLayout';
import FrontOfficeLayout from '@/Layouts/FrontOfficeLayout';
import HRLayout from '@/Layouts/HRLayout';
import MarketingLayout from '@/Layouts/MarketingLayout';
import SuperAdminLayout from '@/Layouts/SuperAdminLayout';
import SupervisorLayout from '@/Layouts/SupervisorLayout';
import ZoneCommanderLayout from '@/Layouts/ZoneCommanderLayout';

type Props = {
  title: string;
  children: React.ReactNode;
};

function normalizeRoles(raw: any): string[] {
  if (Array.isArray(raw)) return raw.map((r) => String(r));
  if (typeof raw === 'string' && raw.length) return [raw];
  return [];
}

export default function MessagesLayout({ title, children }: Props) {
  const page = usePage<any>();
  const user = (page.props as any)?.auth?.user as User | undefined;
  const roles = normalizeRoles((page.props as any)?.auth?.user?.roles);

  const has = (role: string) => roles.includes(role);

  const isSuperAdmin = has('super_admin');
  const isAdmin = has('admin') || isSuperAdmin;

  const isControlRoom = roles.some((r) => ['control_room_operator', 'operations_officer'].includes(r));
  const isFinance = roles.some((r) => ['finance_officer', 'accountant', 'finance', 'accounting'].includes(r));
  const isAssets = roles.some((r) => ['asset_manager', 'assets_manager'].includes(r));
  const isHr = roles.some((r) => ['hr', 'human_resources', 'hr_manager'].includes(r));
  const isMarketing = roles.some((r) => ['marketing', 'marketing_officer', 'marketing_manager'].includes(r));
  const isBusinessDev = roles.some((r) => ['business_dev', 'business_development', 'bdo'].includes(r));
  const isFrontOffice = roles.some((r) => ['front_office', 'receptionist', 'client_service'].includes(r));
  const isFrontDesk = roles.some((r) => ['front_desk', 'frontdesk', 'reception', 'front_desk_officer'].includes(r));
  const isZoneCommander = has('zone_commander');
  const isSupervisor = roles.some((r) => ['supervisor', 'sergeant'].includes(r));

  const content = <>{children}</>;

  if (isSuperAdmin) {
    return (
      <>
        <Head title={title} />
        <SuperAdminLayout title={title} user={user}>{content}</SuperAdminLayout>
      </>
    );
  }

  if (isAdmin) {
    return (
      <>
        <Head title={title} />
        <AdminLayout title={title} user={user}>{content}</AdminLayout>
      </>
    );
  }

  if (isControlRoom) {
    return (
      <>
        <Head title={title} />
        <ControlRoomLayout title={title} user={user}>{content}</ControlRoomLayout>
      </>
    );
  }

  if (isFinance) {
    return (
      <>
        <Head title={title} />
        <FinanceLayout title={title} user={user}>{content}</FinanceLayout>
      </>
    );
  }

  if (isAssets) {
    return (
      <>
        <Head title={title} />
        <AssetManagementLayout title={title} user={user}>{content}</AssetManagementLayout>
      </>
    );
  }

  if (isHr) {
    return (
      <>
        <Head title={title} />
        <HRLayout title={title} user={user}>{content}</HRLayout>
      </>
    );
  }

  if (isMarketing) {
    return (
      <>
        <Head title={title} />
        <MarketingLayout title={title} user={user}>{content}</MarketingLayout>
      </>
    );
  }

  if (isBusinessDev) {
    return (
      <>
        <Head title={title} />
        <BusinessDevLayout title={title} user={user}>{content}</BusinessDevLayout>
      </>
    );
  }

  if (isFrontDesk) {
    return (
      <>
        <Head title={title} />
        <FrontDeskLayout title={title} user={user}>{content}</FrontDeskLayout>
      </>
    );
  }

  if (isFrontOffice) {
    return (
      <>
        <Head title={title} />
        <FrontOfficeLayout title={title}>{content}</FrontOfficeLayout>
      </>
    );
  }

  if (isZoneCommander) {
    return (
      <>
        <Head title={title} />
        <ZoneCommanderLayout title={title}>{content}</ZoneCommanderLayout>
      </>
    );
  }

  if (isSupervisor) {
    return (
      <>
        <Head title={title} />
        <SupervisorLayout title={title}>{content}</SupervisorLayout>
      </>
    );
  }

  return (
    <AuthenticatedLayout
      user={user as any}
      header={<h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">{title}</h2>}
    >
      <Head title={title} />
      {content}
    </AuthenticatedLayout>
  );
}
