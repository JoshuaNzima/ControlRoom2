import React from 'react';
import { Link } from '@inertiajs/react';
import IconMapper from '@/Components/IconMapper';

interface UserSectionProps {
    user?: { name?: string; id?: number | string } | null;
    roleDisplay: string;
    profileRoute: string;
    showSuperAdmin?: boolean;
    superAdminRoute?: string;
    getInitials?: (name: string) => string;
}

export default function UserSection({ 
    user, 
    roleDisplay, 
    profileRoute, 
    showSuperAdmin = false,
    superAdminRoute,
    getInitials 
}: UserSectionProps) {
    const defaultGetInitials = (name: string): string => {
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const initialsFn = getInitials || defaultGetInitials;
    const initials = user?.name ? initialsFn(user.name) : (user?.name?.charAt(0) || 'U');

    return (
        <div className="flex-shrink-0 border-t border-red-800 dark:border-gray-800 p-4 bg-red-900 dark:bg-gray-950">
            <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-red-800 dark:bg-gray-800 border-2 border-red-700 dark:border-gray-700 flex items-center justify-center text-white font-semibold text-sm">
                    {initials}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs border font-medium bg-red-500/20 text-red-200 border-red-500/30">
                        {roleDisplay}
                    </span>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Link
                    href={route(profileRoute)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-gray-800 px-3 py-2 text-xs font-medium text-white hover:bg-gray-700 transition-colors"
                >
                    <IconMapper name="User" size={14} />
                    Profile
                </Link>
                {showSuperAdmin && superAdminRoute && (
                    <Link
                        href={route(superAdminRoute)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-amber-600 px-3 py-2 text-xs font-medium text-white hover:bg-amber-500 transition-colors"
                    >
                        <IconMapper name="Shield" size={14} />
                        SA
                    </Link>
                )}
                <Link
                    href={route('logout')}
                    method="post"
                    as="button"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-red-700 px-3 py-2 text-xs font-medium text-white hover:bg-red-600 transition-colors"
                >
                    <IconMapper name="LogOut" size={14} />
                    Logout
                </Link>
            </div>
        </div>
    );
}
