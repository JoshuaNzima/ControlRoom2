import React, { useState } from 'react';
import { formatDateMW } from '@/Components/format';
import { Head, router } from '@inertiajs/react';
import ControlRoomLayout from '@/Layouts/ControlRoomLayout';
import { Card, CardContent, CardHeader } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import PageHeader from '@/Components/ui/page-header';
import EmptyState from '@/Components/ui/empty-state';
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
import CameraCard from './CameraCard';
import AddCameraForm from './AddCameraForm';

declare const route: any;

type Site = { id: number | string; name: string };
type Camera = {
	id: number | string;
	name: string;
	stream_url?: string;
	status?: string | null;
	site?: Site | null;
	type?: string | null;
	location?: string | null;
	last_online?: string | null;
};

interface Props {
	cameras?: { data: Camera[] };
	sites?: Site[];
	filters?: { statuses?: string[] };
}

const CameraList: React.FC<Props> = ({ cameras = { data: [] }, sites = [], filters = { statuses: [] } }) => {
	const [filterSite, setFilterSite] = useState<string>('');
	const [filterStatus, setFilterStatus] = useState<string>('');
	const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
	const [showAddDialog, setShowAddDialog] = useState(false);

	const statusColors: Record<string, string> = {
		online: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
		offline: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
		maintenance: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
		disabled: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100',
	};

	const handleFilterChange = (type: string, value: string) => {
		const normalized = value === '__all__' ? '' : value;
		router.get(route('control-room.cameras.index'), {
			[type]: normalized,
		}, {
			preserveState: true,
			preserveScroll: true,
		});
	};

	const cameraList = cameras?.data ?? [];

	const content = (() => {
		if (cameraList.length === 0) {
			return (
				<EmptyState
					title="No cameras found"
					description="Use the Add Camera button to create a new camera."
					size="sm"
					action={(
						<Button onClick={() => setShowAddDialog(true)}>
							Add Camera
						</Button>
					)}
				/>
			);
		}

		if (viewMode === 'grid') {
			return (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{cameraList.map((camera) => (
						<CameraCard key={camera.id} camera={camera} />
					))}
				</div>
			);
		}

		return (
			<>
				<div className="lg:hidden divide-y divide-gray-200 dark:divide-gray-800">
					{cameraList.map((camera) => (
						<div key={camera.id} className="p-4">
							<div className="flex items-start justify-between gap-3">
								<div className="min-w-0">
									<div className="text-sm font-semibold text-gray-900 dark:text-gray-100 break-words">{camera.name}</div>
									<div className="mt-1 text-xs text-gray-500 dark:text-gray-400 break-words">{camera.site?.name ?? '-'}</div>
								</div>
								<Badge className={statusColors[camera.status ?? ''] ?? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100'}>
									{camera.status ?? '-'}
								</Badge>
							</div>

							<div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
								<div>
									<div className="text-xs text-gray-500 dark:text-gray-400">Type</div>
									<div className="text-gray-700 dark:text-gray-200">{camera.type ?? '-'}</div>
								</div>
								<div>
									<div className="text-xs text-gray-500 dark:text-gray-400">Location</div>
									<div className="text-gray-700 dark:text-gray-200 break-words">{camera.location ?? '-'}</div>
								</div>
								<div>
									<div className="text-xs text-gray-500 dark:text-gray-400">Last Online</div>
									<div className="text-gray-700 dark:text-gray-200">{camera.last_online ? formatDateMW('en-MW', camera.last_online) : 'Never'}</div>
								</div>
							</div>

							<Button
								variant="outline"
								className="mt-4 w-full"
								onClick={() => router.visit(route('control-room.cameras.show', camera.id))}
							>
								View
							</Button>
						</div>
					))}
				</div>

				<div className="hidden lg:block">
					<Table className="min-w-[900px]">
						<TableHeader>
							<TableRow>
								<TableHead>Name</TableHead>
								<TableHead>Site</TableHead>
								<TableHead>Type</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Location</TableHead>
								<TableHead>Last Online</TableHead>
								<TableHead>Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{cameraList.map((camera) => (
								<TableRow key={camera.id}>
									<TableCell>{camera.name}</TableCell>
									<TableCell>{camera.site?.name ?? '-'}</TableCell>
									<TableCell>{camera.type ?? '-'}</TableCell>
									<TableCell>
										<Badge className={statusColors[camera.status ?? ''] ?? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100'}>
											{camera.status ?? '-'}
										</Badge>
									</TableCell>
									<TableCell>{camera.location ?? '-'}</TableCell>
									<TableCell>
										{camera.last_online ? formatDateMW('en-MW', camera.last_online) : 'Never'}
									</TableCell>
									<TableCell>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => router.visit(route('control-room.cameras.show', camera.id))}
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
		);
	})();

	return (
		<ControlRoomLayout title="CCTV Management">
			<Head title="CCTV Management" />

			<div className="py-6">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<PageHeader
						title="CCTV Cameras"
						description={`${cameraList.length} camera${cameraList.length === 1 ? '' : 's'} • Filter by site and status`}
						actions={(
							<>
								<div className="flex gap-2">
									<Button
										variant={viewMode === 'grid' ? 'default' : 'outline'}
										size="sm"
										onClick={() => setViewMode('grid')}
									>
										Grid
									</Button>
									<Button
										variant={viewMode === 'list' ? 'default' : 'outline'}
										size="sm"
										onClick={() => setViewMode('list')}
									>
										List
									</Button>
								</div>
								<Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
									<DialogTrigger asChild>
										<Button>Add Camera</Button>
									</DialogTrigger>
									<AddCameraForm onClose={() => setShowAddDialog(false)} sites={sites} />
								</Dialog>
							</>
						)}
						className="mb-6"
					/>

					<Card>
						<CardHeader>
							<div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
								<Select value={filterSite} onValueChange={(value) => { setFilterSite(value); handleFilterChange('site_id', value); }}>
									<SelectTrigger className="w-full sm:w-[200px]">
										<SelectValue placeholder="Filter by site" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="__all__">All Sites</SelectItem>
										{Array.isArray(sites) && sites.map((site) => (
											<SelectItem key={site.id} value={String(site.id)}>
												{site.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>

								<Select value={filterStatus} onValueChange={(value) => { setFilterStatus(value); handleFilterChange('status', value); }}>
									<SelectTrigger className="w-full sm:w-[180px]">
										<SelectValue placeholder="Filter by status" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="__all__">All Statuses</SelectItem>
										{(filters?.statuses || []).map((status) => (
											<SelectItem key={status} value={status}>
												{status.charAt(0).toUpperCase() + status.slice(1)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</CardHeader>
						<CardContent>
							{content}
						</CardContent>
					</Card>
				</div>
			</div>
		</ControlRoomLayout>
	);
};

export default CameraList;
