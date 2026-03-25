import { useState, useEffect, useRef } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import IconMapper from '@/Components/IconMapper';
import NotificationBell from '@/Components/Common/NotificationBell';
import BaseShell from './BaseShell';
import useCounters from '@/Hooks/useCounters';
import { motion } from 'framer-motion';
import { useTheme } from '@/Providers/ThemeProvider';
import QuickBudgetButton from '@/Components/Budgets/QuickBudgetButton';
import FloatingNavButton from '@/Components/FloatingNavButton';

type Props = {
	title: string;
	children: React.ReactNode;
};

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
	const [notificationsOpen, setNotificationsOpen] = useState(false);
	const [settingsOpen, setSettingsOpen] = useState(false);
	const { url } = usePage();
	const { theme, toggle } = useTheme();
	const { counters } = useCounters();

	const isCurrent = (href: string) => url === href || (typeof href === 'string' && url.startsWith(href + '/'));

	// Detect super admin role from page props
	const pageAny = usePage<any>();
	const auth = pageAny.props?.auth;
	const roles = (auth?.user?.roles ?? []) as any;
	const isSuperAdmin = Array.isArray(roles) ? roles.includes('super_admin') : roles === 'super_admin';

	// Sample notifications
	const [notifications, setNotifications] = useState<Notification[]>([
		{ id: 1, title: "Zone Alert", message: "Incident reported in Zone A", time: "5 min ago", read: false, type: "warning" },
		{ id: 2, title: "Patrol Complete", message: "Night patrol completed successfully", time: "1 hour ago", read: true, type: "success" },
	]);
	const unreadCount = notifications.filter(n => !n.read).length;

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

	const handleLogout = () => { router.post("/logout"); };
	const markAsRead = (id: number) => setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
	const markAllAsRead = () => setNotifications(notifications.map(n => ({ ...n, read: true })));

	const getNotificationIcon = (type: string) => {
		switch (type) {
			case 'warning': return <IconMapper name="AlertTriangle" size={20} className="text-yellow-500" />;
			case 'success': return <IconMapper name="CheckCircle" size={20} className="text-green-500" />;
			case 'error': return <IconMapper name="XCircle" size={20} className="text-red-500" />;
			default: return <IconMapper name="Bell" size={20} className="text-blue-500" />;
		}
	};

	const links = [
		{ name: 'Dashboard', href: route('zone.dashboard'), icon: <IconMapper name="LayoutDashboard" className="h-5 w-5" /> },
		{ name: 'Clients', href: route('zone.clients.index'), icon: <IconMapper name="Building2" className="h-5 w-5" /> },
		{ name: 'Sites', href: route('zone.sites.index'), icon: <IconMapper name="MapPin" className="h-5 w-5" /> },
		{ name: 'Guards', href: route('zone.guards.index'), icon: <IconMapper name="Shield" className="h-5 w-5" /> },
		{ name: 'Supervisors', href: route('zone.supervisors.index'), icon: <IconMapper name="UserCog" className="h-5 w-5" /> },
		{ name: 'Patrols', href: route('zone.patrols.index'), icon: <IconMapper name="ScanLine" className="h-5 w-5" /> },
		{ name: 'Attendance', href: route('zone.attendance.index'), icon: <IconMapper name="ClipboardList" className="h-5 w-5" /> },
		{ name: 'Downs', href: route('zone.downs.index'), icon: <IconMapper name="AlertTriangle" className="h-5 w-5" /> },
		{ name: 'Reports', href: route('zone.reports.index'), icon: <IconMapper name="BarChart3" className="h-5 w-5" /> },
	];

	return (
		<div
			className="flex flex-col h-screen md:flex-row bg-red-50 dark:bg-gray-900"
			onTouchStart={handleTouchStart}
			onTouchMove={handleTouchMove}
			onTouchEnd={handleTouchEnd}
		>
			{/* Mobile Header */}
			<header className="md:hidden bg-white dark:bg-gray-900 border-b border-red-100 dark:border-gray-800 px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm">
				<button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
					{sidebarOpen ? <IconMapper name="X" size={24} /> : <IconMapper name="Menu" size={24} />}
				</button>
				<h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">{title || "Zone Commander"}</h1>
				<div className="flex items-center justify-end gap-2 shrink-0">
					<NotificationBell />
					<button className="p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => setSettingsOpen(!settingsOpen)}>
						<IconMapper name="Settings" size={22} />
					</button>
					<button onClick={toggle} className="text-xs px-2 py-1 rounded-md bg-red-100 text-red-800 hover:bg-red-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">
						{theme === 'dark' ? 'Light' : 'Dark'}
					</button>
				</div>
			</header>

			{/* Sidebar */}
			<motion.aside
				initial={{ x: "-100%" }}
				animate={{ x: sidebarOpen || !isMobile ? 0 : "-100%" }}
				transition={{ type: "spring", stiffness: 300, damping: 30 }}
				className={`fixed top-0 left-0 h-full bg-red-900 dark:bg-gray-950 text-white z-50 w-64 md:relative md:translate-x-0`}
			>
				{/* Header */}
				<div className="flex items-center justify-center md:justify-start px-6 py-4 border-b border-red-800 dark:border-gray-800 bg-red-900 dark:bg-gray-950">
					<img src="/images/Coin-logo.png" alt="CoinSec" className="h-8 w-auto" />
					<span className="font-bold text-xl text-white ml-2">Zone</span>
				</div>

				{/* User */}
				{auth?.user && (
					<div className="px-4 py-3 bg-red-800 dark:bg-gray-900 border-b border-red-700 dark:border-gray-800">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white font-bold">
								{auth.user.name?.charAt(0) || 'Z'}
							</div>
							<div className="flex-1 min-w-0">
								<p className="text-sm font-semibold text-white truncate">{auth.user.name}</p>
								<p className="text-xs text-red-200 dark:text-gray-400 truncate">{auth.user.email}</p>
							</div>
						</div>
					</div>
				)}

				{/* Navigation */}
				<nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
					{links.map((item) => (
						<Link
							key={item.name}
							href={item.href}
							onClick={() => isMobile && setSidebarOpen(false)}
							className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${
								isCurrent(item.href)
									? 'bg-red-800 text-white font-semibold shadow-sm dark:bg-gray-800'
									: 'text-red-100 hover:bg-red-800 hover:text-white dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'
							}`}
						>
							{item.icon}
							<span>{item.name}</span>
							{(item as any).badge && (
								<span className="ml-auto inline-block py-0.5 px-2 text-xs font-medium rounded-full bg-white/10 text-white">
									{(item as any).badge}
								</span>
							)}
						</Link>
					))}
				</nav>

				{/* Logout */}
				<div className="p-4 border-t border-red-800 dark:border-gray-800 space-y-2">
					<Link
						href={route('zone.profile')}
						className="w-full flex items-center justify-center gap-2 bg-gray-800 text-white hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 py-2 px-4 rounded-lg transition-all text-sm font-medium"
					>
						<IconMapper name="User" size={16} /> Profile
					</Link>
					<button
						onClick={handleLogout}
						className="w-full flex items-center justify-center gap-2 bg-white text-red-900 hover:bg-red-50 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 py-2 px-4 rounded-lg shadow-md transition-all font-semibold text-sm"
					>
						<IconMapper name="LogOut" size={16} /> Logout
					</button>
				</div>
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
						<QuickBudgetButton />
						<NotificationBell />
						{isSuperAdmin && (
							<Link
								href={route('superadmin.dashboard')}
								className="inline-flex items-center gap-2 rounded-md bg-red-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-600"
							>
								<IconMapper name="Shield" size={16} />
								Super Admin
							</Link>
						)}
						<button className="p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => setSettingsOpen(!settingsOpen)}>
							<IconMapper name="Settings" size={22} />
						</button>
						<button
							onClick={toggle}
							className="text-sm px-3 py-1 rounded-md bg-red-100 text-red-800 hover:bg-red-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
						>
							{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
						</button>
					</div>
				</header>

				{/* Page Content */}
				<div className="flex-1 bg-red-50 dark:bg-gray-900 overflow-y-auto">
					<BaseShell
						title={title}
						fullScreen={false}
						header={
							<div className="flex items-center justify-between gap-3">
								<div className="flex items-center gap-3 min-w-0">
									<button
										type="button"
										className="h-10 w-10 inline-flex items-center justify-center rounded-md text-red-700 hover:bg-red-100 hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-coin-600 md:hidden"
										onClick={() => setSidebarOpen(true)}
									>
										<span className="sr-only">Open menu</span>
										<IconMapper name="Menu" className="h-6 w-6" />
									</button>
									<h1 className="text-xl font-bold text-red-900 dark:text-gray-100 truncate">{title}</h1>
								</div>
							</div>
						}
					>
						<div className="animate-slideUp transition-all-smooth">
							{children}
						</div>
					</BaseShell>
				</div>
			</div>

			{/* Notifications Panel */}
			{notificationsOpen && (
				<>
					<div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
					<div className="fixed top-16 right-4 w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 rounded-xl shadow-2xl z-50 max-h-[80vh] flex flex-col animate-slideDown">
						<div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-red-50 dark:bg-gray-900">
							<h3 className="font-bold text-gray-900 dark:text-gray-100">Notifications</h3>
							<div className="flex items-center gap-2">
								{unreadCount > 0 && (
									<button onClick={markAllAsRead} className="text-xs text-red-600 hover:text-red-800 font-medium">
										Mark all read
									</button>
								)}
								<button onClick={() => setNotificationsOpen(false)} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700">
									<IconMapper name="X" size={18} />
								</button>
							</div>
						</div>
						<div className="flex-1 overflow-y-auto touch-auto">
							{notifications.length === 0 ? (
								<div className="p-8 text-center text-gray-500">
									<IconMapper name="Bell" size={48} className="mx-auto mb-2 opacity-50" />
									<p>No notifications</p>
								</div>
							) : (
								<div className="divide-y dark:divide-gray-700">
									{notifications.map(notification => (
										<div
											key={notification.id}
											className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer ${!notification.read ? 'bg-red-50/50 dark:bg-red-900/20' : ''}`}
											onClick={() => markAsRead(notification.id)}
										>
											<div className="flex items-start gap-3">
												<span className="text-2xl flex-shrink-0">{getNotificationIcon(notification.type)}</span>
												<div className="flex-1 min-w-0">
													<div className="flex items-center gap-2 mb-1">
														<p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{notification.title}</p>
														{!notification.read && <span className="w-2 h-2 bg-red-600 rounded-full flex-shrink-0" />}
													</div>
													<p className="text-sm text-gray-600 dark:text-gray-300 mb-1">{notification.message}</p>
													<p className="text-xs text-gray-400">{notification.time}</p>
												</div>
											</div>
										</div>
									))}
									</div>
								)}
							</div>
						</div>
					</>
				)}

			{/* Settings Panel */}
			{settingsOpen && (
				<>
					<div className="fixed inset-0 z-40" onClick={() => setSettingsOpen(false)} />
					<div className="fixed top-16 right-4 w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 rounded-xl shadow-2xl z-50 animate-slideDown">
						<div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-red-50 dark:bg-gray-900 flex items-center justify-between">
							<h3 className="font-bold text-gray-900 dark:text-gray-100">Quick Settings</h3>
							<button onClick={() => setSettingsOpen(false)} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700">
								<IconMapper name="X" size={18} />
							</button>
						</div>
						<div className="p-4 space-y-3">
							<Link href={route('zone.profile')} onClick={() => setSettingsOpen(false)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
								<IconMapper name="User" size={20} className="text-gray-600 dark:text-gray-400" />
								<div>
									<p className="font-medium text-gray-900 dark:text-gray-100 text-sm">Profile</p>
									<p className="text-xs text-gray-500">Manage your account</p>
								</div>
							</Link>
							<Link href="/settings" onClick={() => setSettingsOpen(false)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
								<IconMapper name="Settings" size={20} className="text-gray-600 dark:text-gray-400" />
								<div>
									<p className="font-medium text-gray-900 dark:text-gray-100 text-sm">Settings</p>
									<p className="text-xs text-gray-500">App preferences</p>
								</div>
							</Link>
						</div>
					</div>
				</>
			)}

			<FloatingNavButton />
		</div>
	);
}
