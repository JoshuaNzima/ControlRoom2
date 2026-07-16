import React, { useState, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/Components/ui/select';
import { Badge } from '@/Components/ui/badge';
import { Dialog } from '@/Components/ui/dialog';
import CreateTicketForm from './CreateTicketForm';
import IconMapper from '@/Components/IconMapper';
import EmptyState from '@/Components/ui/empty-state';
import { formatDistanceToNow } from '@/Components/format';

interface Ticket {
	id: number;
	ticket_number: string;
	title: string;
	status: 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed' | 'escalated';
	priority: 'low' | 'medium' | 'high' | 'critical';
	category: string;
	reporter?: { id: number; name: string };
	assigned_to?: { id: number; name: string };
	client?: { id: number; name: string };
	client_site?: { id: number; name: string };
	created_at: string;
	updated_at: string;
}

interface PageProps {
	auth: { user?: { name?: string } };
	tickets: {
		data: Ticket[];
		links?: Array<{ url: string | null; label: string; active: boolean }>;
		meta?: { current_page: number; last_page: number; total?: number };
	};
	filters: {
		statuses: string[];
		priorities: string[];
	};
	stats?: {
		total?: number;
		open?: number;
		in_progress?: number;
		resolved?: number;
	};
}

const statusConfig: Record<string, { color: string; icon: string; label: string }> = {
	open: { color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/40', icon: 'Circle', label: 'Open' },
	in_progress: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-300 dark:border-yellow-500/40', icon: 'Clock', label: 'In Progress' },
	pending: { color: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-500/40', icon: 'PauseCircle', label: 'Pending' },
	resolved: { color: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40', icon: 'CheckCircle', label: 'Resolved' },
	closed: { color: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700/40 dark:text-gray-300 dark:border-gray-600', icon: 'XCircle', label: 'Closed' },
	escalated: { color: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40', icon: 'AlertTriangle', label: 'Escalated' },
};

const priorityConfig: Record<string, { color: string; label: string }> = {
	low: { color: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700/40 dark:text-gray-300 dark:border-gray-600', label: 'Low' },
	medium: { color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/40', label: 'Medium' },
	high: { color: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-500/40', label: 'High' },
	critical: { color: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40', label: 'Critical' },
};

export default function TicketsIndex({ tickets, filters, stats, auth }: PageProps) {
	const [filterStatus, setFilterStatus] = useState('');
	const [filterPriority, setFilterPriority] = useState('');
	const [search, setSearch] = useState('');
	const [showCreateDialog, setShowCreateDialog] = useState(false);

	const handleFilterChange = (type: string, value: string) => {
		router.get(route('control-room.tickets.index'), {
			[type]: value,
		}, {
			preserveState: true,
			preserveScroll: true,
		});
	};

	// Stat cards data
	const statCards = useMemo(() => [
		{ icon: 'Ticket', title: 'Total', value: stats?.total || tickets?.data?.length || 0, color: 'bg-blue-500' },
		{ icon: 'AlertCircle', title: 'Open', value: stats?.open || tickets?.data?.filter((t: Ticket) => t.status === 'open').length || 0, color: 'bg-amber-500' },
		{ icon: 'Clock', title: 'In Progress', value: stats?.in_progress || tickets?.data?.filter((t: Ticket) => t.status === 'in_progress').length || 0, color: 'bg-cyan-500' },
		{ icon: 'CheckCircle', title: 'Resolved', value: stats?.resolved || tickets?.data?.filter((t: Ticket) => t.status === 'resolved').length || 0, color: 'bg-emerald-500' },
	], [stats, tickets]);

	// Filtered tickets
	const filteredTickets = useMemo(() => {
		if (!search) return tickets?.data || [];
		const term = search.toLowerCase();
		return (tickets?.data || []).filter((ticket: Ticket) =>
			ticket.title?.toLowerCase().includes(term) ||
			ticket.ticket_number?.toLowerCase().includes(term) ||
			ticket.reporter?.name?.toLowerCase().includes(term) ||
			ticket.assigned_to?.name?.toLowerCase().includes(term)
		);
	}, [tickets?.data, search]);

	return (
		<AuthenticatedLayout header="Tickets" user={auth?.user as any}>
			<Head title="Tickets" />

			<div className="space-y-6">
				{/* Hero Header */}
				<div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-700 via-red-600 to-rose-600 text-white shadow-2xl">
					<div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20" />
					<div className="relative p-6 sm:p-8">
						<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
							<div className="flex items-center gap-4">
								<div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm">
									<IconMapper name="Ticket" size={32} />
								</div>
								<div>
									<h1 className="text-2xl sm:text-3xl font-bold">Tickets</h1>
									<p className="text-red-100 mt-1">Manage support tickets and track issue resolution</p>
								</div>
							</div>
							<Button
								onClick={() => setShowCreateDialog(true)}
								className="bg-white text-red-600 hover:bg-red-50 font-semibold"
							>
								<IconMapper name="Plus" size={18} className="mr-2" />
								New Ticket
							</Button>
						</div>
					</div>
				</div>

				{/* Stats */}
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					{statCards.map((stat, idx) => (
						<div
							key={idx}
							className="relative overflow-hidden rounded-xl bg-gray-900 dark:bg-gray-800 p-4"
						>
							<div className={`absolute top-0 left-0 w-1 h-full ${stat.color}`} />
							<div className="flex items-start justify-between">
								<div>
									<p className="text-sm text-gray-400">{stat.title}</p>
									<p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
								</div>
								<div className={`p-2 rounded-lg ${stat.color} bg-opacity-20`}>
									<IconMapper name={stat.icon} size={20} className="text-white" />
								</div>
							</div>
						</div>
					))}
				</div>

				{/* Filters */}
				<Card>
					<CardHeader className="pb-4">
						<div className="flex flex-col sm:flex-row gap-3">
							<div className="relative flex-1">
								<Input
									placeholder="Search tickets..."
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									className="pl-10"
								/>
								<span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
									<IconMapper name="Search" size={18} />
								</span>
							</div>
							<Select value={filterStatus} onValueChange={(value) => { setFilterStatus(value); handleFilterChange('status', value); }}>
								<SelectTrigger className="w-full sm:w-[180px]">
									<SelectValue placeholder="Filter by status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="">All Statuses</SelectItem>
									{(filters?.statuses || []).map((status: string) => (
										<SelectItem key={status} value={status}>
											{status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<Select value={filterPriority} onValueChange={(value) => { setFilterPriority(value); handleFilterChange('priority', value); }}>
								<SelectTrigger className="w-full sm:w-[180px]">
									<SelectValue placeholder="Filter by priority" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="">All Priorities</SelectItem>
									{(filters?.priorities || []).map((priority: string) => (
										<SelectItem key={priority} value={priority}>
											{priority.charAt(0).toUpperCase() + priority.slice(1)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</CardHeader>
				</Card>

				{/* Tickets List */}
				{filteredTickets.length === 0 ? (
					<EmptyState
						title="No tickets found"
						description={search ? "Try adjusting your search or filters." : "Create your first ticket to get started."}
						icon="Ticket"
					/>
				) : (
					<div className="space-y-3">
						{filteredTickets.map((ticket: Ticket) => {
							const status = statusConfig[ticket.status] || statusConfig.open;
							const priority = priorityConfig[ticket.priority] || priorityConfig.low;

							return (
								<Card
									key={ticket.id}
									className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
									onClick={() => router.visit(route('control-room.tickets.show', ticket.id))}
								>
									<div className="flex flex-col sm:flex-row">
										{/* Left accent bar based on priority */}
										<div className={`w-full sm:w-1.5 ${
											ticket.priority === 'critical' ? 'bg-rose-500' :
											ticket.priority === 'high' ? 'bg-orange-500' :
											ticket.priority === 'medium' ? 'bg-blue-500' : 'bg-gray-500'
										}`} />

										<div className="flex-1 p-4 sm:p-5">
											<div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
												<div className="flex-1 min-w-0">
													<div className="flex items-center gap-2 flex-wrap">
														<span className="text-sm text-gray-500 dark:text-gray-400">#{ticket.ticket_number || ticket.id}</span>
														<Badge className={`${status.color} text-xs`}>
															<IconMapper name={status.icon} size={12} className="mr-1 inline" />
															{status.label}
														</Badge>
														<Badge className={`${priority.color} text-xs`}>
															{priority.label}
														</Badge>
													</div>
													<h3 className="mt-2 text-lg font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">
														{ticket.title}
													</h3>
													<div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
														<span className="flex items-center gap-1">
															<IconMapper name="User" size={14} />
															{ticket.reporter?.name || 'Unassigned'}
														</span>
														{ticket.assigned_to && (
															<span className="flex items-center gap-1">
																<IconMapper name="UserCheck" size={14} />
																{ticket.assigned_to.name}
															</span>
														)}
														{ticket.client && (
															<span className="flex items-center gap-1">
																<IconMapper name="Building" size={14} />
																{ticket.client.name}
															</span>
														)}
														<span className="flex items-center gap-1">
															<IconMapper name="Clock" size={14} />
															{formatDistanceToNow(ticket.created_at)}
														</span>
													</div>
												</div>

												<div className="flex items-center gap-2">
													<Button
														variant="ghost"
														size="sm"
														onClick={(e) => {
															e.stopPropagation();
															router.visit(route('control-room.tickets.show', ticket.id));
														}}
													>
														View
													</Button>
												</div>
											</div>
										</div>
									</div>
								</Card>
							);
						})}
					</div>
				)}

				{/* Pagination */}
				{tickets?.links && tickets.meta && tickets.meta.last_page > 1 && (
					<div className="flex flex-wrap gap-2 items-center justify-between pt-4">
						<div className="text-sm text-gray-600 dark:text-gray-400">
							Page {tickets.meta.current_page} of {tickets.meta.last_page}
						</div>
						<div className="flex flex-wrap gap-2">
							{tickets.links?.filter((l: any) => l.url).map((l: any, idx: number) => (
								<button
									key={idx}
									className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
										l.active
											? 'bg-red-600 text-white'
											: 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
									}`}
									onClick={() => router.get(l.url || '', {}, { preserveScroll: true, preserveState: true })}
									dangerouslySetInnerHTML={{ __html: l.label }}
								/>
							))}
						</div>
					</div>
				)}
			</div>

			<Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
				<CreateTicketForm onClose={() => setShowCreateDialog(false)} />
			</Dialog>
		</AuthenticatedLayout>
	);
}
