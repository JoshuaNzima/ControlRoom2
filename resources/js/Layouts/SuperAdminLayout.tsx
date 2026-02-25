import React from 'react';
import { Link, Head } from '@inertiajs/react';
import IconMapper from '@/Components/IconMapper';
import { User } from '@/types';
import NotificationBell from '@/Components/Common/NotificationBell';
import BaseShell from './BaseShell';
import useCounters from '@/Hooks/useCounters';
import { useTheme } from '@/Providers/ThemeProvider';
import useGpsAlerts from '@/Hooks/useGpsAlerts';

interface Props {
    title: string;
    children: React.ReactNode;
    user?: User;
}

interface NavItem {
    name: string;
    href: string;
    icon: React.ReactNode;
    badge?: string | number;
}

// Quick Stats Component for Header
const QuickStats: React.FC = () => {
    const { counters } = useCounters();
    const stats = [
        { label: 'Approvals', value: (Number(counters?.requisitions_pending_admin || 0) + Number(counters?.finance_approvals_pending || 0)), color: 'bg-amber-500' },
        { label: 'Open Downs', value: counters?.control_downs_active || 0, color: 'bg-red-500' },
        { label: 'Messages', value: counters?.notifications_unread || 0, color: 'bg-blue-500' },
    ].filter(s => s.value > 0);

    if (stats.length === 0) return null;

    return (
        <div className="hidden lg:flex items-center gap-2 mr-4">
            {stats.map((stat) => (
                <div key={stat.label} className={`${stat.color} text-white px-3 py-1 rounded-full text-xs font-medium`}>
                    {stat.value} {stat.label}
                </div>
            ))}
        </div>
    );
};

export default function SuperAdminLayout({ title, children, user }: Props) {
    const [sidebarOpen, setSidebarOpen] = React.useState(false);
    const [logoOk, setLogoOk] = React.useState<boolean>(true);
    const { counters } = useCounters();
    const { theme, toggle } = useTheme();
    useGpsAlerts();

    const isCurrent = (href: string) => {
        try {
            const hrefPath = new URL(href, window.location.origin).pathname;
            return window.location.pathname === hrefPath;
        } catch {
            return window.location.pathname === href;
        }
    };

    const roleDisplay = (() => {
        const r: any = (user as any)?.roles;
        if (Array.isArray(r) && r.length) return String(r[0]).replaceAll('_', ' ');
        if (typeof r === 'string') return String(r).replaceAll('_', ' ');
        return 'Super Admin';
    })();

    // Main navigation - organized by category
    const mainNav: NavItem[] = [
        { 
            name: 'Dashboard', 
            href: route('superadmin.dashboard'), 
            icon: <IconMapper name="LayoutDashboard" size={20} />,
        },
    ];

    const moduleNav: NavItem[] = [
        { 
            name: 'HR', 
            href: route('superadmin.hr.index'), 
            icon: <IconMapper name="Users2" size={20} />,
        },
        { 
            name: 'Finance', 
            href: route('superadmin.finance.index'), 
            icon: <IconMapper name="Wallet" size={20} />,
        },
        { 
            name: 'Clients', 
            href: route('superadmin.clients.index'), 
            icon: <IconMapper name="Building2" size={20} />,
        },
        { 
            name: 'Control Room', 
            href: route('superadmin.control-room.index'), 
            icon: <IconMapper name="Monitor" size={20} />,
            badge: counters?.control_downs_active,
        },
        { 
            name: 'Assets', 
            href: route('superadmin.assets.index'), 
            icon: <IconMapper name="Boxes" size={20} />,
        },
        { 
            name: 'Reports', 
            href: route('superadmin.reports.index'), 
            icon: <IconMapper name="BarChart3" size={20} />,
        },
        { 
            name: 'Modules', 
            href: route('superadmin.modules'), 
            icon: <IconMapper name="Puzzle" size={20} />,
        },
    ];

    const managementNav: NavItem[] = [
        { 
            name: 'Users', 
            href: route('superadmin.users'), 
            icon: <IconMapper name="Users" size={20} />,
        },
        { 
            name: 'Security', 
            href: route('superadmin.security'), 
            icon: <IconMapper name="Shield" size={20} />,
        },
        { 
            name: 'Settings', 
            href: route('superadmin.settings'), 
            icon: <IconMapper name="Settings" size={20} />,
        },
        { 
            name: 'Backup', 
            href: route('superadmin.backup'), 
            icon: <IconMapper name="HardDrive" size={20} />,
        },
    ];

    const toolsNav: NavItem[] = [
        { 
            name: 'System Health', 
            href: route('superadmin.maintenance'), 
            icon: <IconMapper name="Server" size={20} />,
        },
        { 
            name: 'Logs', 
            href: route('superadmin.logs'), 
            icon: <IconMapper name="FileText" size={20} />,
        },
        { 
            name: 'Audit Trail', 
            href: route('superadmin.audit'), 
            icon: <IconMapper name="Search" size={20} />,
        },
        { 
            name: 'Cache', 
            href: route('superadmin.cache'), 
            icon: <IconMapper name="Trash2" size={20} />,
        },
    ];

    const NavSection: React.FC<{ title: string; items: NavItem[] }> = ({ title, items }) => (
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

    return (
        <div className="min-h-screen bg-red-50 dark:bg-gray-900 overflow-x-hidden">
            <Head title={title} />

            {/* Mobile overlay */}
            <div 
                className={`fixed inset-0 bg-red-900/50 dark:bg-gray-900/70 z-40 md:hidden ${sidebarOpen ? 'block' : 'hidden'}`}
                onClick={() => setSidebarOpen(false)}
            />

            {/* Sidebar */}
            <div 
                className={`fixed top-0 left-0 bottom-0 flex flex-col w-64 bg-red-900 dark:bg-gray-950 text-white transform ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                } md:translate-x-0 transition-transform duration-300 ease-in-out z-50`}
            >
                {/* Logo */}
                <div className="flex items-center flex-shrink-0 px-4 py-5">
                    <img
                        src="/images/Coin-logo.png"
                        alt="Coin Security"
                        className="h-8 w-auto"
                        style={{ display: logoOk ? 'block' : 'none' }}
                        onLoad={() => setLogoOk(true)}
                        onError={() => setLogoOk(false)}
                    />
                    {!logoOk && (
                        <span className="ml-2 text-xl font-bold text-white">CoinSec</span>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-2 space-y-6 overflow-y-auto">
                    <NavSection title="Main" items={mainNav} />
                    <NavSection title="Modules" items={moduleNav} />
                    <NavSection title="Management" items={managementNav} />
                    <NavSection title="Tools" items={toolsNav} />
                </nav>

                {/* User Menu */}
                <div className="flex-shrink-0 border-t border-red-800 dark:border-gray-800 p-4">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-full bg-red-800 dark:bg-gray-800 flex items-center justify-center text-white font-semibold text-sm">
                            {user?.name?.charAt(0) || 'S'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                            <p className="text-xs text-red-200 dark:text-gray-400 truncate">{roleDisplay}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            href={route('profile.dashboard')}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-gray-800 px-3 py-2 text-xs font-medium text-white hover:bg-gray-700 transition-colors"
                        >
                            <IconMapper name="User" size={14} />
                            Profile
                        </Link>
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
            </div>

            {/* Main Content */}
            <div className="md:pl-64">
                {/* Header */}
                <div className="sticky top-0 z-30 border-b border-red-100 bg-white/95 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/80">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-3">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <button
                                    type="button"
                                    className="h-10 w-10 inline-flex items-center justify-center rounded-md text-red-700 hover:bg-red-100 hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-600 md:hidden"
                                    onClick={() => setSidebarOpen(true)}
                                >
                                    <span className="sr-only">Open sidebar</span>
                                    <IconMapper name="Menu" size={24} />
                                </button>
                                <h1 className="text-xl font-semibold text-red-900 dark:text-gray-100 truncate">{title}</h1>
                            </div>
                            <div className="flex items-center justify-end gap-2 sm:gap-3">
                                <QuickStats />
                                <NotificationBell />
                                <button 
                                    onClick={toggle} 
                                    className="text-sm px-3 py-1.5 rounded-md bg-red-100 text-red-800 hover:bg-red-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <span className="hidden sm:inline">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                                    <span className="sm:hidden">{theme === 'dark' ? 'Light' : 'Dark'}</span>
                                </button>
                                <div className="hidden sm:block text-sm text-red-700 dark:text-gray-300 max-w-[10rem] truncate">
                                    {user?.name}
                                </div>
                                <Link
                                    href={route('logout')}
                                    method="post"
                                    as="button"
                                    className="inline-flex items-center justify-center rounded-md bg-white text-red-700 hover:bg-red-50 border border-red-200 px-2 py-2 sm:px-3 sm:py-1.5 text-sm dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <IconMapper name="LogOut" size={18} className="sm:hidden" />
                                    <span className="hidden sm:inline">Logout</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Page Content */}
                <BaseShell noHeader fullScreen={false}>
                    <div className="animate-slideUp transition-all-smooth">
                        {children}
                    </div>
                </BaseShell>
            </div>
        </div>
    );
}