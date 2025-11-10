import React from 'react';
import { useNotificationCounts } from '@/Hooks/useNotificationCounts';

export function NotificationCounter() {
    const { counts, loading } = useNotificationCounts();
    
    if (loading) return null;

    const totalCount = counts.incidents + counts.flags + counts.downs;
    
    if (totalCount === 0) return null;

    return (
        <div className="relative inline-flex">
            <div className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                {totalCount}
            </div>
        </div>
    );
}