import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import IconMapper from '@/Components/IconMapper';
import NotificationBell from '@/Components/Common/NotificationBell';
import BaseShell from './BaseShell';
import useCounters from '@/Hooks/useCounters';

type Props = {
	title: string;
	children: React.ReactNode;
};

export default function ZoneCommanderLayout({ title, children }: Props) {
	const { url } = usePage();
	const isCurrent = (href: string) => url === href || (typeof href === 'string' && url.startsWith(href + '/'));
	const { counters } = useCounters();

	// Detect super admin role from page props
	const pageAny = usePage<any>();
	const roles = ((pageAny.props as any)?.auth?.user?.roles ?? []) as any;
	const isSuperAdmin = Array.isArray(roles) ? roles.includes('super_admin') : roles === 'super_admin';

	const links = [
		{ name: 'Dashboard', href: route('zone.dashboard'), icon: <IconMapper name="grid" className="h-5 w-5" /> },
		{ name: 'Clients', href: route('zone.clients.index'), icon: <IconMapper name="building-2" className="h-5 w-5" /> },
		{ name: 'Sites', href: route('zone.sites.index'), icon: <IconMapper name="map-pin" className="h-5 w-5" /> },
		{ name: 'Guards', href: route('zone.guards.index'), icon: <IconMapper name="shield" className="h-5 w-5" /> },
		{ name: 'Supervisors', href: route('zone.supervisors.index'), icon: <IconMapper name="user-cog" className="h-5 w-5" /> },
		{ name: 'Patrols', href: route('zone.patrols.index'), icon: <IconMapper name="scan-line" className="h-5 w-5" /> },
		{ name: 'Attendance', href: route('zone.attendance.index'), icon: <IconMapper name="clipboard" className="h-5 w-5" /> },
		{ name: 'Downs', href: route('zone.downs.index'), icon: <IconMapper name="alert-triangle" className="h-5 w-5" /> },
		{ name: 'Reports', href: route('zone.reports.index'), icon: <IconMapper name="bar-chart-2" className="h-5 w-5" /> },
		// { name: 'My Requisitions', href: route('requisitions.index'), icon: <IconMapper name="clipboard-list" className="h-5 w-5" />, badge: (()=>{ const n = Number(counters?.requisitions_my_open||0); return n>0? String(n): undefined; })() },
	];

	return (
		<div className="min-h-screen bg-red-50 dark:bg-gray-900">
			<div className="flex">
				<aside className="hidden md:flex md:w-64 bg-red-900 dark:bg-gray-950 text-white min-h-screen flex-col">
					<div className="px-6 py-4 border-b border-red-800 dark:border-gray-800">
						<h2 className="font-bold text-lg">Zone Commander</h2>
					</div>
					<nav className="flex-1 p-3 space-y-1">
						{links.map((item) => (
							<Link key={item.name} href={item.href} className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm ${isCurrent(item.href) ? 'bg-red-800 text-white dark:bg-gray-800' : 'text-red-100 hover:bg-red-800 hover:text-white dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'}`}>
								{item.icon}
								<span>{item.name}</span>
							{(item as any).badge && (
								<span className="ml-auto inline-block py-0.5 px-2 text-xs font-medium rounded-full bg-white/10 text-white">{(item as any).badge}</span>
							)}
							</Link>
						))}
					</nav>
				</aside>
				<div className="flex-1">
					<BaseShell
						title={title}
						fullScreen={false}
						header={
							<div className="flex items-center justify-between">
								<h1 className="text-xl font-bold text-red-900 dark:text-gray-100">{title}</h1>
								<div className="flex items-center gap-3">
									<NotificationBell />
									<Link
										href={route('profile.dashboard')}
										className="inline-flex items-center px-3 py-1.5 rounded-md bg-gray-800 text-white hover:bg-gray-700 text-sm"
									>
										My Profile
									</Link>
									{isSuperAdmin && (
										<Link
											href={route('superadmin.dashboard')}
											className="inline-flex items-center px-3 py-1.5 rounded-md bg-red-700 text-white hover:bg-red-600 text-sm"
										>
											<IconMapper name="shield" className="h-4 w-4" />
											Super Admin
										</Link>
									)}
									<Link
										href={route('expense.request.create')}
										className="inline-flex items-center px-3 py-1.5 rounded-md bg-red-600 text-white hover:bg-red-700 text-sm"
									>
										Request Requisition
									</Link>
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
		</div>
	);
}
