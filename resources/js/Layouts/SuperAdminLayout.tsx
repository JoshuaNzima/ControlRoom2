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

export default function SuperAdminLayout({ title, children, user }: Props) {
    const [sidebarOpen, setSidebarOpen] = React.useState(false);
    const [tasksOpen, setTasksOpen] = React.useState(false);
    const [logoOk, setLogoOk] = React.useState<boolean>(true);
    const { counters } = useCounters();
    const { theme, toggle } = useTheme();
    const page = usePage<any>();
    const { weeklyTasks, isExecutiveAssistant, appName } = page.props;

    // Initialize real-time notifications
    const userId = page.props.auth?.user?.id;
    const roles = page.props.auth?.user?.roles || [];
    useRealtimeNotifications({ userId, userRoles: roles });

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
        if (Array.isArray(r) && r.length) {
            const first = r[0];
            const name = typeof first === 'string' ? first : first?.name;
            return String(name).replaceAll('_', ' ');
        }
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
                {/* Logo / App Name */}
                <div className="flex items-center flex-shrink-0 px-4 py-5 border-b border-red-800 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
                            <IconMapper name="shield" className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg tracking-tight text-white">Super Admin</h1>
                            <p className="text-xs text-red-200 dark:text-gray-400">{appName}</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-2 space-y-6 overflow-y-auto">
                    <NavSection title="Main" items={mainNav} />
                    <NavSection title="Modules" items={moduleNav} />
                    <NavSection title="Management" items={managementNav} />
                    <NavSection title="Tools" items={toolsNav} />
                </nav>

                {/* User Menu - Bottom */}
                <div className="flex-shrink-0 border-t border-red-800 dark:border-gray-800 p-4 bg-red-900 dark:bg-gray-950">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-red-800 dark:bg-gray-800 border-2 border-red-700 dark:border-gray-700 flex items-center justify-center text-white font-semibold text-sm">
                            {user?.name?.charAt(0) || 'S'}
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
                            href={route('superadmin.profile')}
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
                    <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-8 py-2 sm:py-3">
                        <div className="flex items-center justify-between gap-2 sm:gap-3">
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                <button
                                    type="button"
                                    className="h-10 w-10 inline-flex items-center justify-center rounded-md text-red-700 hover:bg-red-100 hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-600 md:hidden touch-target-min"
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
                                    title="Toggle Tasks Panel"
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
                            </div>
                        </div>
                    </div>
                </div>

                {/* Page Content */}
                <BaseShell noHeader fullScreen={false}>
                    <div className="transition-all ease-out duration-500">
                        <div className={`grid gap-4 ${tasksOpen ? 'grid-cols-1 xl:grid-cols-4' : 'grid-cols-1'}`}>
                            <div className={tasksOpen ? 'xl:col-span-3' : ''}>
                                <TutorialSection dashboard="superadmin" canManage={true} />
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
                                            isExecutiveAssistant={isExecutiveAssistant}
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