import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import IconMapper from '@/Components/IconMapper';

type Props = {
	title: string;
	children: React.ReactNode;
};

export default function ZoneCommanderLayout({ title, children }: Props) {
	const { url } = usePage();
	const isCurrent = (href: string) => url === href || (typeof href === 'string' && url.startsWith(href + '/'));

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
	];

	return (
		<div className="min-h-screen bg-red-50 dark:bg-gray-900">
			<Head title={title} />
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
							</Link>
						))}
					</nav>
				</aside>
				<div className="flex-1">
					<header className="bg-red-50 dark:bg-gray-900 border-b border-red-100 dark:border-gray-800 px-6 py-4 sticky top-0 z-10">
						<h1 className="text-xl font-semibold text-red-900 dark:text-gray-100">{title}</h1>
					</header>
					<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-gray-900 dark:text-gray-100">{children}</main>
				</div>
			</div>
		</div>
	);
}


