import React from 'react';
import { Link } from '@inertiajs/react';

interface NavItem {
    name: string;
    href: string;
    icon: React.ReactNode;
    badge?: string | number;
}

interface NavSectionProps {
    title: string;
    items: NavItem[];
    isCurrent: (href: string) => boolean;
}

export default function NavSection({ title, items, isCurrent }: NavSectionProps) {
    return (
        <div className="space-y-1">
            <h3 className="px-3 text-xs font-semibold text-red-200 dark:text-gray-400 uppercase tracking-wider">
                {title}
            </h3>
            {items.map((item) => (
                <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        isCurrent(item.href)
                            ? 'bg-red-800 text-white dark:bg-gray-800'
                            : 'text-red-100 hover:bg-red-800 hover:text-white dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'
                    }`}
                >
                    <span className="flex-shrink-0">{item.icon}</span>
                    <span className="ml-3 flex-1 truncate">{item.name}</span>
                    {item.badge ? (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-red-600 text-white">
                            {item.badge}
                        </span>
                    ) : null}
                </Link>
            ))}
        </div>
    );
}
