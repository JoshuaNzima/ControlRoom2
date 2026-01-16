import React from 'react';
import { Link } from '@inertiajs/react';
import IconMapper from '@/Components/IconMapper';
import { User } from '@/types';
import NotificationBell from '@/Components/Common/NotificationBell';
import BaseShell from './BaseShell';
import QuickRequisitionButton from '@/Components/Requisitions/QuickRequisitionButton';
import QuickBudgetButton from '@/Components/Budgets/QuickBudgetButton';
import useCounters from '@/Hooks/useCounters';
import { useTheme } from '@/Providers/ThemeProvider';

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
    const { counters } = useCounters();
    const { theme, toggle } = useTheme();
    const pathOf = (name: string) => {
        try {
            return new URL((window as any).route(name), window.location.origin).pathname;
        } catch {
            try { return new URL((route as any)(name), window.location.origin).pathname; } catch { return ''; }
        }
    };
    const roleDisplay = (() => {
        const r: any = (user as any)?.roles;
        if (Array.isArray(r) && r.length) return String(r[0]).replaceAll('_', ' ');
        if (typeof r === 'string') return String(r).replaceAll('_', ' ');
        return 'Super Admin';
    })();

    const modules: ModuleNavItem[] = [
        { name: 'Dashboard', href: route('superadmin.dashboard'), icon: <IconMapper name="Home" size={24} />, current: window.location.pathname === pathOf('superadmin.dashboard') },
        { name: 'HR', href: route('superadmin.hr.index'), icon: <IconMapper name="Users2" size={24} />, current: window.location.pathname === pathOf('superadmin.hr.index') },
        { name: 'Finance', href: route('superadmin.finance.index'), icon: <IconMapper name="DollarSign" size={24} />, current: window.location.pathname === pathOf('superadmin.finance.index') },
        { name: 'Clients', href: route('superadmin.clients.index'), icon: <IconMapper name="Building2" size={24} />, current: window.location.pathname === pathOf('superadmin.clients.index') },
        { name: 'Control Room', href: route('superadmin.control-room.index'), icon: <IconMapper name="Monitor" size={24} />, current: window.location.pathname === pathOf('superadmin.control-room.index') },
        { name: 'Assets', href: route('superadmin.assets.index'), icon: <IconMapper name="Package" size={24} />, current: window.location.pathname === pathOf('superadmin.assets.index') },
        { name: 'Reports', href: route('superadmin.reports.index'), icon: <IconMapper name="BarChart2" size={24} />, current: window.location.pathname === pathOf('superadmin.reports.index') },
        { name: 'Modules', href: route('superadmin.modules'), icon: <IconMapper name="Puzzle" size={24} />, current: window.location.pathname === pathOf('superadmin.modules') },
    ];

    const systemNav: ModuleNavItem[] = [
        { 
            name: 'System Health', 
            href: route('superadmin.maintenance'), 
            icon: <IconMapper name="Server" size={24} />, 
            current: window.location.pathname === pathOf('superadmin.maintenance') 
        },
        { 
            name: 'Security', 
            href: route('superadmin.security'), 
            icon: <IconMapper name="Shield" size={24} />, 
            current: window.location.pathname === pathOf('superadmin.security') 
        },
        {
            name: 'My Requisitions',
            href: route('requisitions.index'),
            icon: <IconMapper name="ClipboardList" size={24} />,
            current: window.location.pathname === pathOf('requisitions.index'),
            badge: (() => { const n = Number(counters?.requisitions_my_open || 0); return n > 0 ? String(n) : undefined; })()
        },
        {
            name: 'Budgets',
            href: route('budgets.index'),
            icon: <IconMapper name="PieChart" size={24} />,
            current: window.location.pathname === pathOf('budgets.index')
        },
        {
            name: 'Roles & Permissions',
            href: route('superadmin.roles.index'),
            icon: <IconMapper name="Users2" size={24} />,
            current: window.location.pathname === pathOf('superadmin.roles.index')
        },
        {
            name: 'Users',
            href: route('superadmin.users'),
            icon: <IconMapper name="Users2" size={24} />,
            current: window.location.pathname === pathOf('superadmin.users')
        },
        {
            name: 'Guards',
            href: route('superadmin.guards'),
            icon: <IconMapper name="ShieldCheck" size={24} />,
            current: window.location.pathname === pathOf('superadmin.guards')
        },
        {
            name: 'Drivers',
            href: route('superadmin.drivers'),
            icon: <IconMapper name="Truck" size={24} />,
            current: window.location.pathname === pathOf('superadmin.drivers')
        },
        { 
            name: 'Settings', 
            href: route('superadmin.settings'), 
            icon: <IconMapper name="Settings" size={24} />, 
            current: window.location.pathname === pathOf('superadmin.settings') 
        },
        {
            name: 'Logs',
            href: route('superadmin.logs'),
            icon: <IconMapper name="ClipboardList" size={24} />,
            current: window.location.pathname === pathOf('superadmin.logs')
        },
        {
            name: 'Audit Trail',
            href: route('superadmin.audit'),
            icon: <IconMapper name="Search" size={24} />,
            current: window.location.pathname === pathOf('superadmin.audit')
        },
        {
            name: 'Cache',
            href: route('superadmin.cache'),
            icon: <IconMapper name="Trash2" size={24} />,
            current: window.location.pathname === pathOf('superadmin.cache')
        },
        {
            name: 'Backup',
            href: route('superadmin.backup'),
            icon: <IconMapper name="HardDrive" size={24} />,
            current: window.location.pathname === pathOf('superadmin.backup')
        },
    ];

    return (
        <div className="min-h-screen overflow-x-hidden bg-red-50 dark:bg-gray-900">

            {/* Mobile sidebar */}
            <div
                className={`fixed inset-0 bg-red-800 bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-70 z-40 md:hidden ${
                    sidebarOpen ? 'block' : 'hidden'
                }`}
                onClick={() => setSidebarOpen(false)}
            />

            {/* Sidebar */}
            <div
                className={`fixed top-0 left-0 bottom-0 flex flex-col w-72 bg-red-900 dark:bg-gray-950 text-white transform ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                } md:translate-x-0 transition-transform duration-300 ease-in-out z-50`}
            >
                <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
                    <div className="flex items-center flex-shrink-0 px-4">
                        <img
                    src="/images/Coin-logo.png"
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
                                    className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-md ${
                                        item.current
                                            ? 'bg-red-800 text-white dark:bg-gray-800'
                                            : 'text-red-100 hover:bg-red-800 hover:text-white dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'
                                    }`}
                                >
                                    {item.icon}
                                    <span className="ml-3">{item.name}</span>
                                    {item.badge && (
                                        <span className="ml-auto inline-block py-0.5 px-2 text-xs font-medium rounded-full bg-white/10 text-white">
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
                                    className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-md ${
                                        item.current
                                            ? 'bg-red-800 text-white dark:bg-gray-800'
                                            : 'text-red-100 hover:bg-red-800 hover:text-white dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'
                                    }`}
                                >
                                    {item.icon}
                                    <span className="ml-3">{item.name}</span>
                                    {item.badge && (
                                        <span className="ml-auto inline-block py-0.5 px-2 text-xs font-medium rounded-full bg-white/10 text-white">
                                            {item.badge}
                                        </span>
                                    )}
                                </Link>
                            ))}
                        </div>
                    </nav>
                </div>

                {/* User Menu */}
                <div className="flex-shrink-0 flex items-center justify-between border-t border-red-800 dark:border-gray-800 p-4">
                    <div>
                        <div className="text-base font-medium text-white">{user?.name}</div>
                        <div className="text-sm font-medium text-gray-400">{roleDisplay}</div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            href={route('profile.dashboard')}
                            className="inline-flex items-center gap-2 rounded-md bg-gray-800 px-3 py-2 text-sm font-medium text-white hover:bg-gray-700"
                        >
                            <IconMapper name="User" size={16} />
                            My Profile
                        </Link>
                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="inline-flex items-center gap-2 rounded-md bg-red-700 px-3 py-2 text-sm font-medium text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                        <IconMapper name="LogOut" size={16} />
                        Logout
                    </Link>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="md:pl-72">
                <div className="sticky top-0 z-30 border-b border-red-100 bg-white/95 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/80">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-3">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                                <button
                                    type="button"
                                    className="h-10 w-10 inline-flex items-center justify-center rounded-md text-red-700 hover:bg-red-100 hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-coin-600 md:hidden"
                                    onClick={() => setSidebarOpen(true)}
                                >
                                    <span className="sr-only">Open sidebar</span>
                                    <IconMapper name="Menu" size={24} />
                                </button>
                                <h1 className="text-xl font-semibold text-red-900 dark:text-gray-100 truncate">{title}</h1>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                                <NotificationBell />
                                <div className="hidden sm:flex items-center gap-4">
                                    <QuickBudgetButton label="Budget" />
                                    <QuickRequisitionButton label="Requisition" />
                                </div>
                                <button onClick={toggle} className="text-sm px-3 py-1 rounded-md bg-red-100 text-red-800 hover:bg-red-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">
                                    <span className="hidden sm:inline">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                                    <span className="sm:hidden">{theme === 'dark' ? 'Light' : 'Dark'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <BaseShell noHeader fullScreen={false} containerClassName="space-y-6">
                    <div className="animate-slideUp transition-all-smooth">
                        {children}
                    </div>
                </BaseShell>
            </div>
        </div>
    );
}