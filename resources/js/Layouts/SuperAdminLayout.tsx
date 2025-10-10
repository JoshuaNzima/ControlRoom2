import React from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    Home,
    Users2,
    DollarSign,
    Briefcase,
    Settings,
    BarChart2,
    Megaphone,
    Shield,
    Server,
    Menu,
} from 'lucide-react';
import { User } from '@/types';

interface Props {
    title: string;
    children: React.ReactNode;
    user?: User;
}

interface ModuleNavItem {
    name: string;
    href: string;
    icon: React.ReactNode;
    current: boolean;
    badge?: string;
}

export default function SuperAdminLayout({ title, children, user }: Props) {
    const [sidebarOpen, setSidebarOpen] = React.useState(false);
    const [logoOk, setLogoOk] = React.useState<boolean>(true);

    const modules: ModuleNavItem[] = [
        { name: 'Dashboard', href: route('superadmin.dashboard'), icon: <Home className="h-6 w-6" />, current: window.location.pathname === route('superadmin.dashboard') },
        { 
            name: 'HR Management', 
            href: route('superadmin.modules.category', { category: 'hr' }), 
            icon: <Users2 className="h-6 w-6" />, 
            current: false,
            badge: 'New'
        },
        { 
            name: 'Finance', 
            href: route('superadmin.modules.category', { category: 'finance' }), 
            icon: <DollarSign className="h-6 w-6" />, 
            current: false 
        },
        { 
            name: 'Administration', 
            href: route('superadmin.modules.category', { category: 'admin' }), 
            icon: <Briefcase className="h-6 w-6" />, 
            current: false 
        },
        { 
            name: 'Marketing', 
            href: route('superadmin.modules.category', { category: 'marketing' }), 
            icon: <Megaphone className="h-6 w-6" />, 
            current: false 
        },
        { 
            name: 'Analytics', 
            href: route('superadmin.modules.category', { category: 'analytics' }), 
            icon: <BarChart2 className="h-6 w-6" />, 
            current: false,
            badge: 'Beta'
        },
    ];

    const systemNav: ModuleNavItem[] = [
        { 
            name: 'System Health', 
            href: route('superadmin.maintenance'), 
            icon: <Server className="h-6 w-6" />, 
            current: window.location.pathname === route('superadmin.maintenance') 
        },
        { 
            name: 'Security', 
            href: route('superadmin.security'), 
            icon: <Shield className="h-6 w-6" />, 
            current: window.location.pathname === route('superadmin.security') 
        },
        { 
            name: 'Settings', 
            href: route('superadmin.settings'), 
            icon: <Settings className="h-6 w-6" />, 
            current: window.location.pathname === route('superadmin.settings') 
        },
    ];

    return (
        <div className="min-h-screen bg-red-50">
            <Head title={title} />

            {/* Mobile sidebar */}
            <div
                className={`fixed inset-0 bg-red-800 bg-opacity-50 z-40 md:hidden ${
                    sidebarOpen ? 'block' : 'hidden'
                }`}
                onClick={() => setSidebarOpen(false)}
            />

            {/* Sidebar */}
            <div
                className={`fixed top-0 left-0 bottom-0 flex flex-col w-64 bg-red-900 text-white transform ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                } md:translate-x-0 transition-transform duration-300 ease-in-out z-50`}
            >
                <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
                    <div className="flex items-center flex-shrink-0 px-4">
                        <img
                            src="/images/coin-logo.png"
                            alt="Coin Security"
                            className="h-10 w-auto"
                            style={{ display: logoOk ? 'block' : 'none' }}
                            onLoad={() => setLogoOk(true)}
                            onError={() => setLogoOk(false)}
                        />
                        {!logoOk && (
                            <span className="ml-2 text-2xl font-bold text-white">ControlRoom</span>
                        )}
                    </div>
                    <nav className="mt-8 flex-1 px-2 space-y-8">
                        {/* Modules Navigation */}
                        <div className="space-y-1">
                            <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                Modules
                            </h3>
                            {modules.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                                        item.current
                                            ? 'bg-red-800 text-white'
                                            : 'text-red-100 hover:bg-red-800 hover:text-white'
                                    }`}
                                >
                                    {item.icon}
                                    <span className="ml-3">{item.name}</span>
                                    {item.badge && (
                                        <span className="ml-auto inline-block py-0.5 px-2 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                                            {item.badge}
                                        </span>
                                    )}
                                </Link>
                            ))}
                        </div>

                        {/* System Navigation */}
                        <div className="space-y-1">
                            <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                System
                            </h3>
                            {systemNav.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                                        item.current
                                            ? 'bg-gray-800 text-white'
                                            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                    }`}
                                >
                                    {item.icon}
                                    <span className="ml-3">{item.name}</span>
                                </Link>
                            ))}
                        </div>
                    </nav>
                </div>

                {/* User Menu */}
                <div className="flex-shrink-0 flex border-t border-red-800 p-4">
                    <div className="flex items-center">
                        <div>
                            <div className="text-base font-medium text-white">{user?.name}</div>
                            <div className="text-sm font-medium text-gray-400">Super Admin</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="md:pl-64">
                <div className="sticky top-0 z-10 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-red-50">
                    <button
                        type="button"
                        className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-red-700 hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-500"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <span className="sr-only">Open sidebar</span>
                        <Menu className="h-6 w-6" />
                    </button>
                </div>
                <main className="flex-1">
                    <div className="py-6">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                            {children}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}