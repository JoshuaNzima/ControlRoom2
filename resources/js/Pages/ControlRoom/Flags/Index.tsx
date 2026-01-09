import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
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
import CreateFlagForm from './CreateFlagForm';

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
	flags?: { data: Flag[] };
	statuses?: string[];
}

const FlagList: React.FC<Props> = ({ flags = { data: [] }, statuses = [] }) => {
	const [filterStatus, setFilterStatus] = useState<string>('');
	const [filterType, setFilterType] = useState<string>('');
	const [showCreateDialog, setShowCreateDialog] = useState(false);

	const statusColors: Record<string, string> = {
		pending_review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
		under_review: 'bg-coin-100 text-coin-800 dark:bg-coin-900/30 dark:text-coin-200',
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

	const getFlaggableName = (flag: Flag) => {
		if (!flag.flaggable) return 'Unknown';
		return flag.flaggable.name || `Guard #${flag.flaggable.id}`;
	};

	return (
		<ControlRoomLayout title="Review Flags">
			<Head title="Review Flags" />

			<div className="py-6">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
						<h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Review Flags</h2>
						<Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
							<DialogTrigger asChild>
								<Button>Create Flag</Button>
							</DialogTrigger>
							<CreateFlagForm onClose={() => setShowCreateDialog(false)} />
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
							{(flags.data || []).length === 0 ? (
								<div className="p-6 text-center text-gray-500 dark:text-gray-400">
									No flags found.
								</div>
							) : (
								<>
									<div className="lg:hidden divide-y divide-gray-200 dark:divide-gray-800">
										{(flags.data || []).map((flag) => (
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
									<div className="hidden lg:block">
										<div className="overflow-x-auto">
											<Table className="min-w-[900px]">
												<TableHeader>
													<TableRow>
														<TableHead>ID</TableHead>
														<TableHead>Flagged Item</TableHead>
														<TableHead>Type</TableHead>
														<TableHead>Reason</TableHead>
														<TableHead>Status</TableHead>
														<TableHead>Reporter</TableHead>
														<TableHead>Created</TableHead>
														<TableHead>Actions</TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													{(flags.data || []).map((flag) => (
															<TableRow key={flag.id}>
																<TableCell>#{flag.id}</TableCell>
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
																<TableCell>
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

export default FlagList;
