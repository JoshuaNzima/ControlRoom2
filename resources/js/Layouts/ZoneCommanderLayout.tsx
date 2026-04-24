import { useState, useEffect, useRef } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import IconMapper from '@/Components/IconMapper';
import NotificationBell from '@/Components/Common/NotificationBell';
import useCounters from '@/Hooks/useCounters';
import { useRealtimeNotifications } from '@/Hooks/useRealtimeNotifications';
import { motion } from 'framer-motion';
import { useTheme } from '@/Providers/ThemeProvider';
import QuickBudgetButton from '@/Components/Budgets/QuickBudgetButton';
import AIAssistant from '@/Components/AI/AIAssistant';
import { NavSection, SidebarHeader, UserSection, QuickStats } from '@/Components/Layout';

type Props = {
	title: string;
	children: React.ReactNode;
};

interface NavItem {
	name: string;
	href: string;
	icon: React.ReactNode;
	badge?: string | number;
}

interface Notification {
	id: number;
	title: string;
	message: string;
	time: string;
	read: boolean;
	type: 'info' | 'warning' | 'success' | 'error';
}

export default function ZoneCommanderLayout({ title, children }: Props) {
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [isMobile, setIsMobile] = useState(false);
	const [settingsOpen, setSettingsOpen] = useState(false);
	const { url } = usePage();
	const { theme, toggle } = useTheme();
	const { counters } = useCounters();

	const isCurrent = (href: string) => {
		try {
			const hrefPath = new URL(href, window.location.origin).pathname;
			return window.location.pathname === hrefPath || url === href || url.startsWith(href + '/');
		} catch {
			return url === href || url.startsWith(href + '/');
		}
	};

	// Detect super admin role from page props
	const pageAny = usePage<any>();
	const auth = pageAny.props?.auth;
	const appName = pageAny.props?.appName ?? 'CoinSec';
	const rawRoles = (auth?.user?.roles ?? []) as (string | { id: number; name: string })[];
	const roles = rawRoles.map((r) => (typeof r === 'string' ? r : r.name));
	const userId = auth?.user?.id;

	// Initialize real-time notifications
	useRealtimeNotifications({ userId, userRoles: roles });

	const isSuperAdmin = roles.includes('super_admin');
	const roleDisplay = 'Zone Commander';

	// Touch gestures for mobile sidebar
	const touchStartX = useRef<number | null>(null);
	const touchEndX = useRef<number | null>(null);
	const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
	const handleTouchMove = (e: React.TouchEvent) => { touchEndX.current = e.touches[0].clientX; };
	const handleTouchEnd = () => {
		if (touchStartX.current === null || touchEndX.current === null) return;
		const diff = touchEndX.current - touchStartX.current;
		if (diff > 50) setSidebarOpen(true);
		if (diff < -50) setSidebarOpen(false);
		touchStartX.current = null; touchEndX.current = null;
	};

	useEffect(() => {
		const checkMobile = () => setIsMobile(window.innerWidth < 768);
		checkMobile();
		window.addEventListener('resize', checkMobile);
		return () => window.removeEventListener('resize', checkMobile);
	}, []);

	const links: NavItem[] = [
		{ name: 'Dashboard', href: route('zone.dashboard'), icon: <IconMapper name="LayoutDashboard" size={20} /> },
		{ name: 'Clients', href: route('zone.clients.index'), icon: <IconMapper name="Building2" size={20} /> },
		{ name: 'Sites', href: route('zone.sites.index'), icon: <IconMapper name="MapPin" size={20} /> },
		{ name: 'Checkpoints', href: route('zone.checkpoints.index'), icon: <IconMapper name="QrCode" size={20} /> },
		{ name: 'Guards', href: route('zone.guards.index'), icon: <IconMapper name="Shield" size={20} /> },
		{ name: 'Supervisors', href: route('zone.supervisors.index'), icon: <IconMapper name="UserCog" size={20} /> },
		{ name: 'Patrols', href: route('zone.patrols.index'), icon: <IconMapper name="ScanLine" size={20} /> },
		{ name: 'Attendance', href: route('zone.attendance.index'), icon: <IconMapper name="ClipboardList" size={20} /> },
		{ name: 'Downs', href: route('zone.downs.index'), icon: <IconMapper name="AlertTriangle" size={20} /> },
		{ name: 'Reports', href: route('zone.reports.index'), icon: <IconMapper name="BarChart3" size={20} /> },
		{ name: 'Requisitions', href: route('requisitions.index'), icon: <IconMapper name="FileText" size={20} /> },
	];

	return (
		<div
			className="flex flex-col h-screen md:flex-row bg-red-50 dark:bg-gray-900 overflow-x-hidden"
			onTouchStart={handleTouchStart}
			onTouchMove={handleTouchMove}
			onTouchEnd={handleTouchEnd}
		>
			{/* Mobile Header */}
			<header className="md:hidden bg-white dark:bg-gray-900 border-b border-red-100 dark:border-gray-800 px-2 py-2 flex items-center justify-between sticky top-0 z-40 shadow-sm">
				<button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 touch-target-min">
					{sidebarOpen ? <IconMapper name="X" size={22} /> : <IconMapper name="Menu" size={22} />}
				</button>
				<h1 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">{title || "Zone Commander"}</h1>
				<div className="flex items-center justify-end gap-1 shrink-0">
					<NotificationBell />
					<button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 touch-target-min" onClick={() => setSettingsOpen(!settingsOpen)}>
						<IconMapper name="Settings" size={20} />
					</button>
					<button onClick={toggle} className="text-xs px-2 py-1.5 rounded-md bg-red-100 text-red-800 hover:bg-red-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 touch-target-min">
						{theme === 'dark' ? 'Light' : 'Dark'}
					</button>
				</div>
			</header>

			{/* Sidebar */}
			<motion.aside
				initial={{ x: "-100%" }}
				animate={{ x: sidebarOpen || !isMobile ? 0 : "-100%" }}
				transition={{ type: "spring", stiffness: 300, damping: 30 }}
				className={`fixed top-0 left-0 h-full bg-red-900 dark:bg-gray-950 text-white z-50 w-64 md:relative md:translate-x-0 flex flex-col`}
			>
				<SidebarHeader title="Zone Commander" appName={appName} iconName="MapPin" />

				<nav className="flex-1 px-3 py-2 space-y-6 overflow-y-auto">
					<NavSection title="Zone Management" items={links} isCurrent={isCurrent} />
				</nav>

				<UserSection
					user={auth?.user}
					roleDisplay={roleDisplay}
					profileRoute="zone.profile"
					showSuperAdmin={isSuperAdmin}
					superAdminRoute="superadmin.dashboard"
				/>
			</motion.aside>

			{/* Overlay for mobile sidebar */}
			{sidebarOpen && isMobile && (
				<div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
			)}

			{/* Main Content */}
			<div className="flex-1 flex flex-col min-h-0">
				{/* Desktop Header */}
				<header className="hidden md:flex h-16 bg-red-50 dark:bg-gray-900 border-b border-red-100 dark:border-gray-800 px-6 items-center justify-between shadow-sm">
					<h1 className="text-xl font-bold text-red-900 dark:text-gray-100">{title}</h1>
					<div className="flex items-center gap-3">
						<QuickStats />
						<QuickBudgetButton />
						<NotificationBell />
						<button className="p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 touch-target-min" onClick={() => setSettingsOpen(!settingsOpen)}>
							<IconMapper name="Settings" size={22} />
						</button>
						<button
							onClick={toggle}
							className="text-sm px-3 py-1.5 rounded-md bg-red-100 text-red-800 hover:bg-red-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 touch-target-min"
						>
							{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
						</button>
					</div>
				</header>

				{/* Page Content */}
				<div className="flex-1 bg-red-50 dark:bg-gray-900 overflow-y-auto">
					<div className="animate-slideUp transition-all-smooth p-2 sm:p-4 md:p-6">
						{children}
					</div>
				</div>
			</div>

			{/* Settings Panel */}
			{settingsOpen && (
				<>
					<div className="fixed inset-0 z-40" onClick={() => setSettingsOpen(false)} />
					<div className="fixed top-16 right-4 w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-900 rounded-xl shadow-2xl z-50 animate-slideDown">
						<div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-red-50 dark:bg-gray-800 flex items-center justify-between">
							<h3 className="font-bold text-gray-900 dark:text-gray-100">Quick Settings</h3>
							<button onClick={() => setSettingsOpen(false)} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700">
								<IconMapper name="X" size={18} />
							</button>
						</div>
						<div className="p-4 space-y-3">
							<Link href={route('zone.profile')} onClick={() => setSettingsOpen(false)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
								<IconMapper name="User" size={20} className="text-gray-600 dark:text-gray-300" />
								<div>
									<p className="font-medium text-gray-900 dark:text-gray-100 text-sm">Profile</p>
									<p className="text-xs text-gray-500 dark:text-gray-400">Manage your account</p>
								</div>
							</Link>
							<Link href="/settings" onClick={() => setSettingsOpen(false)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
								<IconMapper name="Settings" size={20} className="text-gray-600 dark:text-gray-300" />
								<div>
									<p className="font-medium text-gray-900 dark:text-gray-100 text-sm">Settings</p>
									<p className="text-xs text-gray-500 dark:text-gray-400">App preferences</p>
								</div>
							</Link>
						</div>
					</div>
				</>
			)}

			<AIAssistant context="zone-commander" />
		</div>
	);
}
