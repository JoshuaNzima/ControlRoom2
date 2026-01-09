import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import ControlRoomLayout from '@/Layouts/ControlRoomLayout';
import { Card, CardContent, CardHeader } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
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
import { Dialog, DialogTrigger } from '@/Components/ui/dialog';
import CreateTicketForm from './CreateTicketForm';

const TicketList = ({ tickets = { data: [] }, filters = { statuses: [], priorities: [] } }: any) => {
	const [filterStatus, setFilterStatus] = useState('');
	const [filterPriority, setFilterPriority] = useState('');
	const [showCreateDialog, setShowCreateDialog] = useState(false);

	const statusColors: Record<string, string> = {
		open: 'bg-coin-100 text-coin-800 dark:bg-coin-900/30 dark:text-coin-200',
		in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
		pending: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200',
		resolved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
		closed: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100',
		escalated: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
	};

	const priorityColors: Record<string, string> = {
		low: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100',
		medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
		high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200',
		critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
	};

	const handleFilterChange = (type: string, value: string) => {
		router.get(route('control-room.tickets.index'), {
			[type]: value,
		}, {
			preserveState: true,
			preserveScroll: true,
		});
	};

	return (
	<ControlRoomLayout title="Tickets">
			<Head title="Tickets" />

			<div className="py-6">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
						<h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Tickets</h2>
						<Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
							<DialogTrigger asChild>
								<Button>Create Ticket</Button>
							</DialogTrigger>
							<CreateTicketForm onClose={() => setShowCreateDialog(false)} />
						</Dialog>
					</div>

					<Card>
						<CardHeader>
							<div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
								<Select value={filterStatus} onValueChange={(value) => { setFilterStatus(value); handleFilterChange('status', value); }}>
									<SelectTrigger className="w-full sm:w-[180px]">
										<SelectValue placeholder="Filter by status" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="">All Statuses</SelectItem>
										{(filters.statuses || []).map((status: string) => (
											<SelectItem key={status} value={status}>
												{status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1)}
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
										{(filters.priorities || []).map((priority: string) => (
											<SelectItem key={priority} value={priority}>
												{priority.charAt(0).toUpperCase() + priority.slice(1)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</CardHeader>
						<CardContent>
							{(tickets.data || []).length === 0 ? (
								<div className="p-6 text-center text-gray-500 dark:text-gray-400">
									No tickets found.
								</div>
							) : (
								<>
									<div className="lg:hidden divide-y divide-gray-200 dark:divide-gray-800">
										{(tickets.data || []).map((ticket: any) => (
											<div key={ticket.id} className="py-4">
												<div className="flex items-start justify-between gap-3">
													<div className="min-w-0">
														<div className="text-sm font-semibold text-gray-900 dark:text-gray-100 break-words">
															#{ticket.id} — {ticket.title}
														</div>
														<div className="mt-2 flex flex-wrap items-center gap-2">
															<Badge className={statusColors[ticket.status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100'}>
																{ticket.status ? ticket.status.replace('_', ' ') : '-'}
															</Badge>
															<Badge className={priorityColors[ticket.priority] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100'}>
																{ticket.priority || '-'}
															</Badge>
														</div>
													</div>
												</div>

												<div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
													<div className="min-w-0">
														<div className="text-xs text-gray-500 dark:text-gray-400">Reporter</div>
														<div className="text-gray-700 dark:text-gray-200 break-words">{ticket.reporter?.name || '-'}</div>
													</div>
													<div className="min-w-0">
														<div className="text-xs text-gray-500 dark:text-gray-400">Assigned</div>
														<div className="text-gray-700 dark:text-gray-200 break-words">{ticket.assignee?.name || '-'}</div>
													</div>
													<div>
														<div className="text-xs text-gray-500 dark:text-gray-400">Created</div>
														<div className="text-gray-700 dark:text-gray-200">{ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : '-'}</div>
													</div>
												</div>

												<Button
													variant="outline"
													className="mt-4 w-full"
													onClick={() => router.visit(route('control-room.tickets.show', ticket.id))}
												>
													View
												</Button>
											</div>
										))}
									</div>

									<div className="hidden lg:block">
										<div className="overflow-x-auto">
											<Table className="min-w-[900px]">
												<TableHeader>
													<TableRow>
														<TableHead>ID</TableHead>
														<TableHead>Title</TableHead>
														<TableHead>Status</TableHead>
														<TableHead>Priority</TableHead>
														<TableHead>Reporter</TableHead>
														<TableHead>Assigned To</TableHead>
														<TableHead>Created</TableHead>
														<TableHead>Actions</TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													{(tickets.data || []).map((ticket: any) => (
														<TableRow key={ticket.id}>
															<TableCell>#{ticket.id}</TableCell>
															<TableCell>{ticket.title}</TableCell>
															<TableCell>
																<Badge className={statusColors[ticket.status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100'}>
																	{ticket.status ? ticket.status.replace('_', ' ') : '-'}
																</Badge>
															</TableCell>
															<TableCell>
																<Badge className={priorityColors[ticket.priority] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100'}>
																	{ticket.priority || '-'}
																</Badge>
															</TableCell>
															<TableCell>{ticket.reporter?.name || '-'}</TableCell>
															<TableCell>{ticket.assignee?.name || '-'}</TableCell>
															<TableCell>{ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : '-'}</TableCell>
															<TableCell>
																<Button
																variant="ghost"
																size="sm"
																onClick={() => router.visit(route('control-room.tickets.show', ticket.id))}
															>
																View
															</Button>
															</TableCell>
														</TableRow>
													))}
												</TableBody>
											</Table>
										</div>
									</div>
								</>
							)}
						</CardContent>
					</Card>
				</div>
			</div>
	</ControlRoomLayout>
	);
};

export default TicketList;
