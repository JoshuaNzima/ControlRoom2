import React from 'react';
import IconMapper from '@/Components/IconMapper';

interface SidebarHeaderProps {
    title: string;
    appName: string;
    iconName?: string;
}

export default function SidebarHeader({ title, appName, iconName = 'layout-dashboard' }: SidebarHeaderProps) {
    return (
        <div className="flex items-center flex-shrink-0 px-4 py-5 border-b border-red-800 dark:border-gray-800">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
                    <IconMapper name={iconName} className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h1 className="font-bold text-lg tracking-tight text-white">{title}</h1>
                    <p className="text-xs text-red-200 dark:text-gray-400">{appName}</p>
                </div>
            </div>
        </div>
    );
}
