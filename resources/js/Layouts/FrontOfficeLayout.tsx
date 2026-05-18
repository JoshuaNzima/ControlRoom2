import { useState, useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import {
    LayoutDashboard,
    Calendar,
    Users,
    CheckSquare,
    MessageSquare,
    FileText,
    Menu,
    X,
    Bell,
    Search,
    ChevronRight,
    LogOut,
    User,
    Moon,
    Sun,
    ClipboardList,
    Wallet,
    ShoppingCart,
} from 'lucide-react';
import AIAssistant from '@/Components/AI/AIAssistant';
import { cn } from '@/lib/utils';
import { useRealtimeNotifications } from '@/Hooks/useRealtimeNotifications';
import { Button } from '@/Components/ui/button';
import { Avatar, AvatarFallback } from '@/Components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';

interface FrontOfficeLayoutProps {
    children: React.ReactNode;
    title?: string;
}

interface NavItem {
    label: string;
    href: string;
    icon: React.ElementType;
    requiredPermission?: string;
}

export default function FrontOfficeLayout({ children, title }: FrontOfficeLayoutProps) {
    const { auth, role, can, unreadCount = 0, appName } = usePage().props as any;
    const user = auth?.user;

    // Initialize real-time notifications
    const roles = (user?.roles || []) as string[];
    useRealtimeNotifications({ userId: user?.id, userRoles: roles });

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isDark, setIsDark] = useState(true);
    const pageTitle = title || 'Front Office';

    useEffect(() => {
        const saved = localStorage.getItem('darkMode');
        const isDarkMode = saved !== null ? saved === 'true' : true;
        setIsDark(isDarkMode);
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);

    const toggleDarkMode = () => {
        const newMode = !isDark;
        setIsDark(newMode);
        localStorage.setItem('darkMode', String(newMode));
        if (newMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    const navItems: NavItem[] = [
        { label: 'Dashboard', href: route('front-office.dashboard'), icon: LayoutDashboard },
        ...(role === 'client' ? [] : [{ label: 'Documents', href: route('documents.index'), icon: FileText }]),
        ...(can?.manage_calendar ? [{ label: 'Calendar', href: route('front-office.calendar.index'), icon: Calendar }] : []),
        { label: 'Visitors', href: route('front-office.visitors.index'), icon: Users },
        ...(can?.manage_tasks ? [{ label: 'Tasks', href: route('tasks.dashboard'), icon: CheckSquare }] : []),
        ...(role === 'executive_assistant' || role === 'super_admin' || role === 'admin'
            ? [{ label: 'Requisitions', href: route('front-office.requisitions.index'), icon: ShoppingCart }]
            : []),
        ...(role === 'executive_assistant' || role === 'super_admin'
            ? [{ label: 'Petty Cash', href: route('executive.petty-cash.index'), icon: Wallet }]
            : []),
        { label: 'Messages', href: route('front-office.messages.index'), icon: MessageSquare },
        ...(can?.view_reports ? [{ label: 'Reports', href: route('front-office.reports.index'), icon: FileText }] : []),
    ];

    const isActive = (href: string) => {
        return window.location.pathname === new URL(href, window.location.origin).pathname;
    };

    const getRoleLabel = (r: string) => {
        switch (r) {
            case 'executive_assistant': return 'Executive Assistant';
            case 'receptionist': return 'Receptionist';
            case 'personal_assistant': return 'Personal Assistant';
            case 'admin': return 'Administrator';
            case 'super_admin': return 'Super Admin';
            default: return 'Staff';
        }
    };

    const getRoleColor = (r: string) => {
        switch (r) {
            case 'executive_assistant': return 'bg-red-500/20 text-red-400 border-red-500/30';
            case 'receptionist': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'personal_assistant': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
            case 'admin': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
            case 'super_admin': return 'bg-green-500/20 text-green-400 border-green-500/30';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    return (
        <div className="min-h-screen bg-red-50 dark:bg-gray-900">
            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-red-900 dark:bg-gray-950 z-50 flex items-center justify-between px-4">
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="p-2 rounded-lg bg-red-800 dark:bg-gray-800 hover:bg-red-700 dark:hover:bg-gray-700 transition-colors"
                >
                    {sidebarOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
                </button>
                <div className="flex items-center gap-3">
                    <span className="text-white font-bold text-lg tracking-tight">Front Office</span>
                </div>
                <div className="w-10" />
            </div>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-red-900/50 dark:bg-gray-900/70 z-40"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed top-0 left-0 h-full w-72 bg-red-900 dark:bg-gray-950 text-white z-50 transition-transform duration-300",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full",
                    "lg:translate-x-0"
                )}
            >
                {/* Logo */}
                <div className="h-16 flex items-center px-6 border-b border-red-800 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
                            <ClipboardList className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg tracking-tight text-white">Front Office</h1>
                            <p className="text-xs text-red-200 dark:text-gray-400">{appName}</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-1">
                    {navItems.map((item) => {
                        const active = isActive(item.href);
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                                    active
                                        ? "bg-red-800 dark:bg-gray-800 text-white"
                                        : "text-red-100 dark:text-gray-300 hover:bg-red-800 dark:hover:bg-gray-800 hover:text-white"
                                )}
                            >
                                <Icon className="w-5 h-5" />
                                {item.label}
                                {item.label === 'Messages' && unreadCount > 0 && (
                                    <span className="ml-auto bg-red-500 dark:bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">
                                        {unreadCount}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Section - Bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-red-800 dark:border-gray-800 bg-red-900 dark:bg-gray-950">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <Avatar className="w-10 h-10 border-2 border-red-700 dark:border-gray-700">
                            <AvatarFallback className="bg-red-800 dark:bg-gray-800 text-white text-sm font-semibold">
                                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{user?.name || 'Guest'}</p>
                            <span
                                className={cn(
                                    "inline-flex items-center px-2 py-0.5 rounded text-xs border font-medium",
                                    getRoleColor(role)
                                )}
                            >
                                {getRoleLabel(role)}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <Link
                            href={route('front-office.profile')}
                            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-red-100 dark:text-gray-300 hover:bg-red-800 dark:hover:bg-gray-800 hover:text-white transition-colors"
                        >
                            <User className="w-4 h-4" />
                            My Profile
                        </Link>
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-red-100 dark:text-gray-300 hover:bg-red-700 dark:hover:bg-red-900/50 hover:text-white transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            Logout
                        </Link>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="lg:ml-72 min-h-screen">
                {/* Desktop Header */}
                <header className="hidden lg:flex h-16 items-center justify-between px-8 border-b border-red-100 dark:border-gray-800 bg-white/95 dark:bg-gray-950/95 backdrop-blur sticky top-0 z-30">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="text-red-700 dark:text-red-400">Front Office</span>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-gray-900 dark:text-gray-100">{pageTitle}</span>
                    </div>

                    {/* Right Side */}
                    <div className="flex items-center gap-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:border-red-500/50 w-64"
                            />
                        </div>

                        {/* Theme Toggle */}
                        <button
                            onClick={toggleDarkMode}
                            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                            {isDark ? <Sun className="w-5 h-5 text-gray-400" /> : <Moon className="w-5 h-5 text-gray-500" />}
                        </button>

                        {/* Notifications */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="relative p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                    <Bell className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                                    )}
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-80 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                                <div className="p-3 border-b border-gray-200 dark:border-gray-800">
                                    <p className="font-medium text-gray-900 dark:text-white">Notifications</p>
                                </div>
                                <div className="p-3 text-center text-gray-500 dark:text-gray-400 text-sm">
                                    No new notifications
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Page Content */}
                <div className="p-4 lg:p-8 pt-20 lg:pt-8">
                    {children}
                </div>
            </main>
            <AIAssistant />
        </div>
    );
}
