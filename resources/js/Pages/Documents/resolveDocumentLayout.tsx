import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'

export type DocumentModuleKey =
    | 'finance'
    | 'hr'
    | 'assets'
    | 'control_room'
    | 'front_office'
    | 'maintenance'
    | string;

/**
 * All role-specific layouts were migrated into the single AppShellLayout.
 * AuthenticatedLayout resolves the correct config per role automatically.
 */
export function resolveDocumentLayout(_roles: string[], _moduleKey?: DocumentModuleKey): React.ComponentType<any> {
    return AuthenticatedLayout;
}

export type DocumentLayoutComponent = React.ComponentType<any>;
