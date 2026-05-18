import React from 'react';
import FrontOfficeLayout from '@/Layouts/FrontOfficeLayout';
import FinanceLayout from '@/Layouts/FinanceLayout';
import HRLayout from '@/Layouts/HRLayout';
import AssetManagementLayout from '@/Layouts/AssetManagementLayout';
import ControlRoomLayout from '@/Layouts/ControlRoomLayout';
import OperationsLayout from '@/Layouts/OperationsLayout';
import AdminLayout from '@/Layouts/AdminLayout';
import SuperAdminLayout from '@/Layouts/SuperAdminLayout';

export type DocumentModuleKey =
    | 'finance'
    | 'hr'
    | 'assets'
    | 'control_room'
    | 'front_office'
    | 'maintenance'
    | string;

export function resolveDocumentLayout(roles: string[], moduleKey?: DocumentModuleKey) {
    if (roles.includes('super_admin')) return SuperAdminLayout;
    if (roles.includes('admin')) return AdminLayout;

    switch (moduleKey) {
        case 'finance':
            return FinanceLayout;
        case 'hr':
            return HRLayout;
        case 'assets':
            return AssetManagementLayout;
        case 'control_room':
            return ControlRoomLayout;
        case 'front_office':
            return FrontOfficeLayout;
        case 'maintenance':
            return OperationsLayout;
        default:
            return OperationsLayout;
    }
}

export type DocumentLayoutComponent = ReturnType<typeof resolveDocumentLayout>;
