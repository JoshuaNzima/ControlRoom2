import React from 'react';
import { Link, Head, usePage } from '@inertiajs/react';
import IconMapper from '@/Components/IconMapper';
import { User } from '@/types';
import NotificationBell from '@/Components/Common/NotificationBell';
import BaseShell from './BaseShell';
import useCounters from '@/Hooks/useCounters';
import { useTheme } from '@/Providers/ThemeProvider';
import useGpsAlerts from '@/Hooks/useGpsAlerts';
import { useRealtimeNotifications } from '@/Hooks/useRealtimeNotifications';
import FloatingNavButton from '@/Components/FloatingNavButton';
import WeeklyTasks from '@/Components/WeeklyTasks';
import TutorialSection from '@/Components/Tutorials/TutorialSection';
import { motion, AnimatePresence } from 'framer-motion';

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

export default function AdminLayout({ title, children }: Props) {
    const [sidebarOpen, setSidebarOpen] = React.useState(false);
    const [tasksOpen, setTasksOpen] = React.useState(false);
    const page = usePage<any>();
    const { theme, toggle } = useTheme();

    // Extract user info
    const user = page?.props?.auth?.user;
    const userId = user?.id;
    const roles = (user?.roles || []) as string[];
    const weeklyTasks = (page?.props?.weeklyTasks || []) as any[];
    const counters = (page?.props?.counters || {}) as any;
    const isExecutiveAssistant = page?.props?.isExecutiveAssistant ?? false;
    const appName = (page?.props as any)?.appName ?? 'CoinSec';

    // Initialize real-time notifications
    useRealtimeNotifications({ userId, userRoles: roles });
    useGpsAlerts();

    const isAdminUser = roles.includes('admin') || roles.includes('super_admin');
    const isAssetManager = roles.includes('asset_manager') || roles.includes('super_admin');

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
        return 'Admin';
    })();

    const isClient = roles.includes('client');

    // Client Portal Navigation
    const clientNav: NavItem[] = isClient ? [
        { 
            name: 'Dashboard', 
            href: route('client.dashboard'), 
            icon: <IconMapper name="LayoutDashboard" size={20} />,
        },
        { 
            name: 'My Sites', 
            href: route('client.sites'), 
            icon: <IconMapper name="Building" size={20} />,
        },
        { 
            name: 'Reports', 
            href: route('client.reports'), 
            icon: <IconMapper name="FileText" size={20} />,
        },
        { 
            name: 'Invoices', 
            href: route('client.invoices'), 
            icon: <IconMapper name="CreditCard" size={20} />,
        },
        {
            name: 'Support',
            href: 'mailto:support@coinsec.com',
            icon: <IconMapper name="Headphones" size={20} />,
        },
    ] : [];

    // Main navigation - organized by category (matching SuperAdmin structure)
    const mainNav: NavItem[] = [
        { 
            name: 'Dashboard', 
            href: route('admin.dashboard'), 
            icon: <IconMapper name="LayoutDashboard" size={20} />,
        },
    ];

    const operationsNav: NavItem[] = [
        { 
            name: 'Guards', 
            href: route('admin.guards.index'), 
            icon: <IconMapper name="ShieldCheck" size={20} />,
        },
        { 
            name: 'Clients', 
            href: route('admin.clients.index'), 
            icon: <IconMapper name="Building2" size={20} />,
        },
        { 
            name: 'Services', 
            href: route('admin.services.index'), 
            icon: <IconMapper name="Package" size={20} />,
        },
        { 
            name: 'Downs', 
            href: route('admin.downs.index'), 
            icon: <IconMapper name="AlertTriangle" size={20} />,
            badge: counters?.control_downs_active,
        },
        { 
            name: 'Approvals', 
            href: route('admin.approvals.index'), 
            icon: <IconMapper name="CheckCircle" size={20} />,
            badge: (() => { 
                const n = (Number(counters?.requisitions_pending_admin||0) + Number(counters?.finance_approvals_pending||0)); 
                return n > 0 ? n : undefined; 
            })(),
        },
        ...(isAssetManager ? ([
            { 
                name: 'Assets', 
                href: route('assets.index'), 
                icon: <IconMapper name="Boxes" size={20} />,
                badge: counters?.assets_handovers_outstanding || undefined,
            },
        ] as NavItem[]) : []),
    ];

    const financeNav: NavItem[] = [
        { 
            name: 'Payments', 
            href: route('admin.payments.index'), 
            icon: <IconMapper name="Wallet" size={20} />,
        },
        ...(!isAdminUser ? ([
            {
                name: 'Requisitions',
                href: route('requisitions.index'),
                icon: <IconMapper name="ClipboardList" size={20} />,
                badge: counters?.requisitions_my_open,
            },
        ] as NavItem[]) : []),
        { 
            name: 'Budgets', 
            href: route('budgets.index'), 
            icon: <IconMapper name="PieChart" size={20} />,
        },
    ];

    const managementNav: NavItem[] = [
        { 
            name: 'Users', 
            href: route('admin.users.index'), 
            icon: <IconMapper name="Users" size={20} />,
        },
        { 
            name: 'Reports', 
            href: route('admin.reports.index'), 
            icon: <IconMapper name="BarChart3" size={20} />,
        },
        { 
            name: 'Settings', 
            href: route('admin.settings.index'), 
            icon: <IconMapper name="Settings" size={20} />,
        },
    ];

    const toolsNav: NavItem[] = [
        { 
            name: 'QR Codes', 
            href: route('admin.qr-codes.index'), 
            icon: <IconMapper name="QrCode" size={20} />,
        },
        { 
            name: 'Messaging', 
            href: route('messages.conversations.index'), 
            icon: <IconMapper name="MessageSquareText" size={20} />,
            badge: counters?.notifications_unread,
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

    const hasSuperAdmin = (() => {
        const roles = (user as any)?.roles ?? [];
        return Array.isArray(roles) ? roles.includes('super_admin') : roles === 'super_admin';
    })();

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
                {/* Logo / App Name */}
                <div className="flex items-center flex-shrink-0 px-4 py-5 border-b border-red-800 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
                            <IconMapper name="layout-dashboard" className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg tracking-tight text-white">Admin</h1>
                            <p className="text-xs text-red-200 dark:text-gray-400">{appName}</p>
                        </div>
                    </div>
                </div>

                {/* Navigation - Client gets simplified navigation */}
                <nav className="flex-1 px-3 py-2 space-y-6 overflow-y-auto">
                    {isClient ? (
                        <NavSection title="Client Portal" items={clientNav} />
                    ) : (
                        <>
                            <NavSection title="Main" items={mainNav} />
                            <NavSection title="Operations" items={operationsNav} />
                            <NavSection title="Finance" items={financeNav} />
                            <NavSection title="Management" items={managementNav} />
                            <NavSection title="Tools" items={toolsNav} />
                        </>
                    )}
                </nav>

                {/* User Menu - Bottom */}
                <div className="flex-shrink-0 border-t border-red-800 dark:border-gray-800 p-4 bg-red-900 dark:bg-gray-950">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-red-800 dark:bg-gray-800 border-2 border-red-700 dark:border-gray-700 flex items-center justify-center text-white font-semibold text-sm">
                            {user?.name?.charAt(0) || 'A'}
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
                            href={route('admin.profile')}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-gray-800 px-3 py-2 text-xs font-medium text-white hover:bg-gray-700 transition-colors"
                        >
                            <IconMapper name="User" size={14} />
                            Profile
                        </Link>
                        {hasSuperAdmin && (
                            <Link
                                href={route('superadmin.dashboard')}
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
            </div>

            {/* Main Content */}
            <div className="md:pl-64">
                {/* Header */}
                <div className="sticky top-0 z-30 border-b border-red-100 bg-white/95 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/80">
                    <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-8 py-2 sm:py-3">
                        <div className="flex items-center justify-between gap-2 sm:gap-3">
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                <button
                                    type="button"
                                    className="h-10 w-10 inline-flex items-center justify-center rounded-md text-red-700 hover:bg-red-100 hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-600 md:hidden"
                                    onClick={() => setSidebarOpen(true)}
                                >
                                    <span className="sr-only">Open sidebar</span>
                                    <IconMapper name="Menu" size={24} />
                                </button>
                                <h1 className="text-lg sm:text-xl font-semibold text-red-900 dark:text-gray-100 truncate">{title}</h1>
                            </div>
                            <div className="flex items-center justify-end gap-1 sm:gap-3">
                                <QuickStats />
                                <NotificationBell />
                                <button
                                    onClick={() => setTasksOpen(!tasksOpen)}
                                    className="inline-flex items-center gap-1.5 rounded-md bg-coin-100 text-coin-700 hover:bg-coin-200 px-2 sm:px-3 py-1.5 text-xs sm:text-sm dark:bg-coin-900/30 dark:text-coin-200 transition-colors touch-target-min"
                                >
                                    <IconMapper name="CheckSquare" size={16} />
                                    <span className="hidden sm:inline">Tasks</span>
                                </button>
                                <button
                                    onClick={toggle}
                                    className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 rounded-md bg-red-100 text-red-800 hover:bg-red-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 transition-colors touch-target-min"
                                >
                                    <span className="hidden sm:inline">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                                    <span className="sm:hidden">{theme === 'dark' ? 'Light' : 'Dark'}</span>
                                </button>
                                <div className="hidden sm:block text-sm text-red-700 dark:text-gray-300 max-w-[10rem] truncate">
                                    {user?.name}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Page Content */}
                <BaseShell noHeader fullScreen={false}>
                    <div className="transition-all ease-out duration-500">
                        <div className={`grid gap-4 ${tasksOpen ? 'grid-cols-1 xl:grid-cols-4' : 'grid-cols-1'}`}>
                            <div className={tasksOpen ? 'xl:col-span-3' : ''}>
                                <TutorialSection dashboard="admin" canManage={true} />
                                {children}
                            </div>
                            <AnimatePresence>
                                {tasksOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, x: 50, scale: 0.95 }}
                                        animate={{ opacity: 1, x: 0, scale: 1 }}
                                        exit={{ opacity: 0, x: 50, scale: 0.95 }}
                                        transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                                        className="xl:col-span-1"
                                    >
                                        <WeeklyTasks
                                            tasks={weeklyTasks || []}
                                            showModule={true}
                                            isExecutiveAssistant={isExecutiveAssistant as any}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </BaseShell>
                <FloatingNavButton />
            </div>
        </div>
    );
}
