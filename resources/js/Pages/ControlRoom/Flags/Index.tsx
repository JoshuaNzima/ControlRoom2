import React, { useState, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/Components/ui/table';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/Components/ui/select';
import { Badge } from '@/Components/ui/badge';
import { Dialog } from '@/Components/ui/dialog';
import CreateFlagForm from './CreateFlagForm';
import IconMapper from '@/Components/IconMapper';
import { StatCard } from '@/Components/StatCard';
import { ActionTile } from '@/Components/ActionTile';

type Flag = {
	id: number | string;
	flaggable?: any;
	flaggable_type?: string;
	reason?: string;
	status?: string;
	reporter?: { name?: string } | null;
	created_at?: string;
};

interface Props {
	auth?: { user?: { name?: string } };
	flags?: { 
		data: Flag[]; 
		links?: Array<{ url: string | null; label: string; active: boolean }>;
		meta?: { current_page: number; last_page: number; total?: number };
	};
	statuses?: string[];
	stats?: { total?: number; pending_review?: number; under_review?: number; resolved?: number };
}

const FlagList: React.FC<Props> = ({ auth, flags = { data: [] }, statuses = [], stats = {} }) => {
	const [filterStatus, setFilterStatus] = useState<string>('');
	const [filterType, setFilterType] = useState<string>('');
	const [search, setSearch] = useState('');
	const [showCreateDialog, setShowCreateDialog] = useState(false);

	const statusColors: Record<string, string> = {
		pending_review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
		under_review: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
		resolved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
		dismissed: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100',
	};

	const handleFilterChange = (type: string, value: string) => {
		router.get(route('control-room.flags.index'), {
			[type]: value,
		}, {
			preserveState: true,
			preserveScroll: true,
		});
	};

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		router.get(route('control-room.flags.index'), {
			search,
		}, {
			preserveState: true,
			preserveScroll: true,
		});
	};

	// StatCards data
	const statCards = useMemo(() => [
		{ icon: <IconMapper name="Flag" size={24} />, title: 'Total Flags', value: stats.total || 0, subtitle: 'All flags', color: 'red' as const },
		{ icon: <IconMapper name="Clock" size={24} />, title: 'Pending Review', value: stats.pending_review || 0, subtitle: 'Awaiting review', color: 'amber' as const },
		{ icon: <IconMapper name="Search" size={24} />, title: 'Under Review', value: stats.under_review || 0, subtitle: 'Being investigated', color: 'cyan' as const },
		{ icon: <IconMapper name="CheckCircle" size={24} />, title: 'Resolved', value: stats.resolved || 0, subtitle: 'This month', color: 'green' as const },
	], [stats]);

	// Quick actions
	const quickActions = [
		{ icon: <IconMapper name="Plus" size={18} />, title: 'New Flag', description: 'Report an issue', color: 'bg-red-600', onClick: () => setShowCreateDialog(true) },
		{ icon: <IconMapper name="Filter" size={18} />, title: 'My Reports', description: 'Flags I created', color: 'bg-blue-600', onClick: () => handleFilterChange('my_flags', '1') },
		{ icon: <IconMapper name="RefreshCw" size={18} />, title: 'Refresh', description: 'Reload data', color: 'bg-emerald-600', onClick: () => router.reload() },
		{ icon: <IconMapper name="Download" size={18} />, title: 'Export', description: 'Download report', color: 'bg-purple-600', onClick: () => {} },
	];

	// Filter flags based on search
	const filteredFlags = useMemo(() => {
		if (!search) return flags.data || [];
		const term = search.toLowerCase();
		return (flags.data || []).filter((flag: Flag) =>
			flag.reason?.toLowerCase().includes(term) ||
			flag.id?.toString().includes(term) ||
			getFlaggableName(flag).toLowerCase().includes(term)
		);
	}, [flags.data, search]);

	const getFlaggableName = (flag: Flag) => {
		if (!flag.flaggable) return 'Unknown';
		return flag.flaggable.name || `Guard #${flag.flaggable.id}`;
	};

	return (
		<AuthenticatedLayout header="Review Flags" user={auth?.user as any}>
			<Head title="Review Flags" />

			<div className="py-6 space-y-6">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					{/* Hero Header */}
					<div className="mb-6">
						<h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Review Flags</h1>
						<p className="mt-1 text-gray-600 dark:text-gray-400">Track and manage flagged items for investigation</p>
					</div>

					{/* StatCards */}
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
						{statCards.map((stat, idx) => (
							<StatCard key={idx} {...stat} />
						))}
					</div>

					{/* Quick Actions */}
					<div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
						{quickActions.map((action, idx) => (
							<ActionTile key={idx} {...action} />
						))}
					</div>

					<Card>
						<CardHeader>
							<div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
								<form onSubmit={handleSearch} className="flex-1">
									<div className="relative">
										<Input
											placeholder="Search flags..."
											value={search}
											onChange={(e) => setSearch(e.target.value)}
											className="pl-10"
										/>
										<span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
											<IconMapper name="Search" size={18} />
										</span>
									</div>
								</form>
								<Select value={filterStatus} onValueChange={(value) => { setFilterStatus(value); handleFilterChange('status', value); }}>
									<SelectTrigger className="w-full sm:w-[180px]">
										<SelectValue placeholder="Filter by status" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="">All Statuses</SelectItem>
										{statuses.map((status) => (
											<SelectItem key={status} value={status}>
												{status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>

								<Select value={filterType} onValueChange={(value) => { setFilterType(value); handleFilterChange('type', value); }}>
									<SelectTrigger className="w-full sm:w-[180px]">
										<SelectValue placeholder="Filter by type" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="">All Types</SelectItem>
										<SelectItem value="guard">Guards</SelectItem>
										<SelectItem value="user">Users</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</CardHeader>
						<CardContent>
							{filteredFlags.length === 0 ? (
								<div className="p-6 text-center text-gray-500 dark:text-gray-400">
									<IconMapper name="Flag" size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
									<p>No flags found.</p>
								</div>
							) : (
								<>
									<div className="lg:hidden divide-y divide-gray-200 dark:divide-gray-800">
										{filteredFlags.map((flag) => (
											<div key={flag.id} className="p-4">
												<div className="flex items-start justify-between gap-3">
													<div className="min-w-0">
														<div className="text-sm font-semibold text-gray-900 dark:text-gray-100">#{flag.id}</div>
														<div className="mt-1 text-sm text-gray-700 dark:text-gray-200 break-words">{getFlaggableName(flag)}</div>
														<div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{String(flag.flaggable_type || '').includes('Guard') ? 'Guard' : 'User'}</div>
													</div>
													<Badge className={statusColors[flag.status || ''] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100'}>
														{(flag.status || '').replace('_', ' ')}
													</Badge>
												</div>

												<div className="mt-3 text-sm">
													<div className="text-xs text-gray-500 dark:text-gray-400">Reason</div>
													<div className="text-gray-700 dark:text-gray-200 break-words">{flag.reason || '-'}</div>
												</div>

												<div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
													<div className="min-w-0">
														<div className="text-xs text-gray-500 dark:text-gray-400">Reporter</div>
														<div className="text-gray-700 dark:text-gray-200 break-words">{flag.reporter?.name || '-'}</div>
													</div>
													<div>
														<div className="text-xs text-gray-500 dark:text-gray-400">Created</div>
														<div className="text-gray-700 dark:text-gray-200">{flag.created_at ? new Date(flag.created_at).toLocaleDateString() : '-'}</div>
													</div>
												</div>

												<Button
													variant="outline"
													className="mt-4 w-full"
													onClick={() => router.visit(route('control-room.flags.show', flag.id))}
												>
													View
												</Button>
											</div>
										))}
									</div>
									<div className="hidden lg:block overflow-x-auto">
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead>ID</TableHead>
													<TableHead>Flagged Item</TableHead>
													<TableHead>Type</TableHead>
													<TableHead>Reason</TableHead>
													<TableHead>Status</TableHead>
													<TableHead>Reporter</TableHead>
													<TableHead>Created</TableHead>
													<TableHead className="text-right">Actions</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{filteredFlags.map((flag) => (
													<TableRow key={flag.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
														<TableCell className="font-medium">#{flag.id}</TableCell>
														<TableCell>{getFlaggableName(flag)}</TableCell>
														<TableCell>
															{String(flag.flaggable_type || '').includes('Guard') ? 'Guard' : 'User'}
														</TableCell>
														<TableCell>{flag.reason}</TableCell>
														<TableCell>
															<Badge className={statusColors[flag.status || ''] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100'}>
																{(flag.status || '').replace('_', ' ')}
															</Badge>
														</TableCell>
														<TableCell>{flag.reporter?.name || '-'}</TableCell>
														<TableCell>{flag.created_at ? new Date(flag.created_at).toLocaleDateString() : '-'}</TableCell>
														<TableCell className="text-right">
															<Button
																variant="ghost"
																size="sm"
																onClick={() => router.visit(route('control-room.flags.show', flag.id))}
															>
																View
															</Button>
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</div>
								</>
							)}
							{/* Pagination */}
							{flags?.links && (flags as any).meta?.last_page > 1 && (
								<div className="p-4 border-t dark:border-gray-700 flex flex-wrap gap-2 items-center justify-between">
									<div className="text-sm text-gray-600 dark:text-gray-400">Page {flags?.meta?.current_page ?? ''} of {flags?.meta?.last_page ?? ''}</div>
									<div className="flex flex-wrap gap-2">
										{flags.links?.filter((l: any) => l.url).map((l: any, idx: number) => (
											<button
												key={idx}
												className={`px-3 py-1 rounded border dark:border-gray-700 ${l.active ? 'bg-red-600 text-white' : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200'}`}
												onClick={() => router.get(l.url, {}, { preserveScroll: true, preserveState: true })}
												dangerouslySetInnerHTML={{ __html: l.label }}
											/>
										))}
									</div>
								</div>
							)}
						</CardContent>
					</Card>
					{/* Create Flag Dialog - controlled by Quick Actions "New Flag" tile */}
					<Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
						<CreateFlagForm onClose={() => setShowCreateDialog(false)} />
					</Dialog>
				</div>
			</div>
		</AuthenticatedLayout>
	);
};

export default FlagList;
