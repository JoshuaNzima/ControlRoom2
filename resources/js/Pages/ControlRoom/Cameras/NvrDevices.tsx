import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import ControlRoomLayout from '@/Layouts/ControlRoomLayout';
import { Card, CardContent, CardHeader } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { PageHeader } from '@/Components/ui/page-header';
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
import { HardDrive, Wifi, WifiOff, AlertTriangle, Settings, Plus, Download, Trash2, RefreshCw } from 'lucide-react';
import AddNvrModal from './AddNvrModal';
import ImportCamerasModal from './ImportCamerasModal';

declare const route: any;

type Site = { id: number | string; name: string; client?: { id: number | string; name: string } | null };

type NvrDevice = {
	id: number | string;
	name: string;
	device_type: 'nvr' | 'dvr';
	brand: string | null;
	model: string | null;
	public_host: string;
	public_port: number | null;
	status: 'online' | 'offline' | 'error' | 'disabled';
	channel_count: number;
	active_channels: number;
	last_online_at: string | null;
	site?: Site | null;
	cameras?: { id: number | string; status: string }[];
};

interface Props {
	nvrs?: { data: NvrDevice[] };
	sites?: Site[];
	filters?: { device_types?: string[]; statuses?: string[] };
	appliedFilters?: {
		client_id?: number | string | null;
		site_id?: number | string | null;
		status?: string | null;
	};
}

const NvrDevicesPage: React.FC<Props> = ({
	nvrs = { data: [] },
	sites = [],
	filters = { device_types: [], statuses: [] },
	appliedFilters = {},
}) => {
	const initialFilterValue = (value: any) => {
		if (value === undefined || value === null || String(value).trim() === '') return '__all__';
		return String(value);
	};

	const [filterClient, setFilterClient] = useState<string>(() => initialFilterValue(appliedFilters.client_id));
	const [filterSite, setFilterSite] = useState<string>(() => initialFilterValue(appliedFilters.site_id));
	const [filterStatus, setFilterStatus] = useState<string>(() => initialFilterValue(appliedFilters.status));
	const [showAddDialog, setShowAddDialog] = useState(false);
	const [importNvr, setImportNvr] = useState<NvrDevice | null>(null);

	const statusColors: Record<string, string> = {
		online: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
		offline: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
		error: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200',
		disabled: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100',
	};

	const statusIcons = {
		online: <Wifi className="w-4 h-4 text-green-600" />,
		offline: <WifiOff className="w-4 h-4 text-red-600" />,
		error: <AlertTriangle className="w-4 h-4 text-orange-600" />,
		disabled: <Settings className="w-4 h-4 text-gray-600" />,
	};

	const normalizeFilter = (value: string) => (value === '__all__' ? '' : value);

	const applyFilters = (next?: Partial<{ client_id: string; site_id: string; status: string }>) => {
		const client_id = normalizeFilter(next?.client_id ?? filterClient);
		const site_id = normalizeFilter(next?.site_id ?? filterSite);
		const status = normalizeFilter(next?.status ?? filterStatus);

		const params: Record<string, string> = {};
		if (client_id) params.client_id = client_id;
		if (site_id) params.site_id = site_id;
		if (status) params.status = status;

		router.get(route('control-room.cameras.nvrs.index'), params, {
			preserveState: true,
			preserveScroll: true,
		});
	};

	const handleTestConnection = (nvrId: string | number) => {
		router.post(route('control-room.cameras.nvrs.test', nvrId));
	};

	const handleSync = (nvrId: string | number) => {
		router.post(route('control-room.cameras.nvrs.sync', nvrId));
	};

	const handleDelete = (nvrId: string | number) => {
		if (confirm('Are you sure you want to delete this NVR/DVR? You cannot delete if cameras are attached.')) {
			router.delete(route('control-room.cameras.nvrs.destroy', nvrId));
		}
	};

	const getSiteLabel = (site: Site) => {
		const clientName = site?.client?.name?.trim();
		if (clientName) return `${clientName} • ${site.name}`;
		return site.name;
	};

	const nvrList = nvrs?.data ?? [];

	return (
		<ControlRoomLayout title="NVR/DVR Devices">
			<Head title="NVR/DVR Devices" />

			<div className="py-6">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<PageHeader
						title="NVR/DVR Devices"
						description={`${nvrList.length} device${nvrList.length === 1 ? '' : 's'} • Import cameras from existing CCTV setups`}
						actions={(
							<>
								<Button
									variant="outline"
									size="sm"
									onClick={() => router.visit(route('control-room.cameras.index'))}
								>
									View Cameras
								</Button>
								<Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
									<DialogTrigger asChild>
										<Button><Plus className="w-4 h-4 mr-1" /> Add NVR/DVR</Button>
									</DialogTrigger>
									<AddNvrModal onClose={() => setShowAddDialog(false)} sites={sites} />
								</Dialog>
							</>
						)}
						className="mb-6"
					/>

					<Card>
						<CardHeader>
							<div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
								<Select
									value={filterClient}
									onValueChange={(value) => {
										setFilterClient(value);
										setFilterSite('__all__');
										applyFilters({ client_id: value, site_id: '__all__' });
									}}
								>
									<SelectTrigger className="w-full sm:w-[220px]">
										<SelectValue placeholder="Filter by company" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="__all__">All Companies</SelectItem>
										{sites.filter((s, i, a) => a.findIndex(t => t.client?.id === s.client?.id) === i).map((site) => (
											site.client && (
												<SelectItem key={site.client.id} value={String(site.client.id)}>
													{site.client.name}
												</SelectItem>
											)
										))}
									</SelectContent>
								</Select>

								<Select
									value={filterSite}
									onValueChange={(value) => {
										setFilterSite(value);
										applyFilters({ site_id: value });
									}}
								>
									<SelectTrigger className="w-full sm:w-[200px]">
										<SelectValue placeholder="Filter by site" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="__all__">All Sites</SelectItem>
										{sites.map((site) => (
											<SelectItem key={site.id} value={String(site.id)}>
												{getSiteLabel(site)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>

								<Select
									value={filterStatus}
									onValueChange={(value) => {
										setFilterStatus(value);
										applyFilters({ status: value });
									}}
								>
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
							{nvrList.length === 0 ? (
								<EmptyState
									title="No NVR/DVR devices found"
									description="Add your first NVR/DVR device to import cameras from existing CCTV setups."
									size="sm"
									action={(
										<Button onClick={() => setShowAddDialog(true)}>
											<Plus className="w-4 h-4 mr-1" /> Add NVR/DVR
										</Button>
									)}
								/>
							) : (
								<div className="space-y-4">
									{/* Mobile View */}
									<div className="lg:hidden divide-y divide-gray-200 dark:divide-gray-800">
										{nvrList.map((nvr) => (
											<div key={nvr.id} className="p-4">
												<div className="flex items-start justify-between gap-3">
													<div className="min-w-0 flex items-center gap-2">
														<HardDrive className="w-5 h-5 text-gray-500" />
														<div>
															<div className="text-sm font-semibold text-gray-900 dark:text-gray-100 break-words">{nvr.name}</div>
															<div className="text-xs text-gray-500 dark:text-gray-400">{nvr.brand} {nvr.model}</div>
														</div>
													</div>
													<Badge className={statusColors[nvr.status]}>
														{statusIcons[nvr.status]}
														<span className="ml-1">{nvr.status}</span>
													</Badge>
												</div>

												<div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
													{nvr.public_host}:{nvr.public_port || 80}
												</div>

												<div className="mt-3 grid grid-cols-2 gap-2 text-sm">
													<div>
															<div className="text-xs text-gray-500 dark:text-gray-400">Type</div>
															<div className="text-gray-700 dark:text-gray-200">{nvr.device_type?.toUpperCase()}</div>
														</div>
													<div>
															<div className="text-xs text-gray-500 dark:text-gray-400">Cameras</div>
															<div className="text-gray-700 dark:text-gray-200">{nvr.active_channels} / {nvr.channel_count}</div>
														</div>
													<div>
															<div className="text-xs text-gray-500 dark:text-gray-400">Site</div>
															<div className="text-gray-700 dark:text-gray-200">{nvr.site?.name ?? '-'}</div>
														</div>
													<div>
															<div className="text-xs text-gray-500 dark:text-gray-400">Last Online</div>
															<div className="text-gray-700 dark:text-gray-200">
																{nvr.last_online_at ? new Date(nvr.last_online_at).toLocaleDateString() : 'Never'}
															</div>
														</div>
												</div>

												<div className="mt-4 flex flex-wrap gap-2">
													<Button
														variant="outline"
														size="sm"
														onClick={() => router.visit(route('control-room.cameras.nvrs.show', nvr.id))}
													>
														View
													</Button>
													<Button
														variant="outline"
														size="sm"
														onClick={() => handleTestConnection(nvr.id)}
													>
														Test
													</Button>
													<Button
														variant="outline"
														size="sm"
														onClick={() => setImportNvr(nvr)}
													>
														<Download className="w-3 h-3 mr-1" />
														Import
													</Button>
													<Button
														variant="outline"
														size="sm"
														onClick={() => handleSync(nvr.id)}
													>
														<RefreshCw className="w-3 h-3 mr-1" />
														Sync
													</Button>
													<Button
														variant="outline"
														size="sm"
														className="text-red-600 border-red-200 hover:bg-red-50"
														onClick={() => handleDelete(nvr.id)}
														disabled={nvr.active_channels > 0}
													>
														<Trash2 className="w-3 h-3 mr-1" />
														Delete
													</Button>
												</div>
											</div>
										))}
									</div>

									{/* Desktop Table View */}
									<div className="hidden lg:block overflow-x-auto">
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead>Device</TableHead>
													<TableHead>Site</TableHead>
													<TableHead>Type</TableHead>
													<TableHead>Connection</TableHead>
													<TableHead>Status</TableHead>
													<TableHead>Cameras</TableHead>
													<TableHead>Actions</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{nvrList.map((nvr) => (
													<TableRow key={nvr.id}>
														<TableCell>
															<div className="flex items-center gap-2">
																<HardDrive className="w-5 h-5 text-gray-500" />
																<div>
																	<div className="font-medium text-gray-900 dark:text-gray-100">{nvr.name}</div>
																	<div className="text-xs text-gray-500 dark:text-gray-400">{nvr.brand} {nvr.model}</div>
																</div>
															</div>
														</TableCell>
														<TableCell>
															{nvr.site?.name ?? '-'}
															{nvr.site?.client?.name && (
																<div className="text-xs text-gray-500 dark:text-gray-400">{nvr.site.client.name}</div>
															)}
														</TableCell>
														<TableCell>{nvr.device_type?.toUpperCase()}</TableCell>
														<TableCell>
															<div className="text-xs font-mono text-gray-600 dark:text-gray-400">
																{nvr.public_host}:{nvr.public_port || 80}
															</div>
														</TableCell>
														<TableCell>
															<Badge className={statusColors[nvr.status]}>
																{statusIcons[nvr.status]}
																<span className="ml-1">{nvr.status}</span>
															</Badge>
														</TableCell>
														<TableCell>
															{nvr.active_channels} / {nvr.channel_count}
														</TableCell>
														<TableCell>
															<div className="flex gap-1">
																<Button
																	variant="ghost"
																	size="sm"
																	onClick={() => router.visit(route('control-room.cameras.nvrs.show', nvr.id))}
																>
																	View
																</Button>
																<Button
																	variant="ghost"
																	size="sm"
																	onClick={() => handleTestConnection(nvr.id)}
																>
																	Test
																</Button>
																<Button
																	variant="ghost"
																	size="sm"
																	onClick={() => setImportNvr(nvr)}
																>
																	<Download className="w-3 h-3 mr-1" />
																	Import
																</Button>
																<Button
																	variant="ghost"
																	size="sm"
																	onClick={() => handleSync(nvr.id)}
																>
																	<RefreshCw className="w-3 h-3 mr-1" />
																	Sync
																</Button>
																<Button
																	variant="ghost"
																	size="sm"
																	className="text-red-600"
																	onClick={() => handleDelete(nvr.id)}
																	disabled={nvr.active_channels > 0}
																>
																	<Trash2 className="w-3 h-3 mr-1" />
																	Delete
																</Button>
															</div>
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</div>
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			</div>

			<Dialog open={!!importNvr} onOpenChange={() => setImportNvr(null)}>
				{importNvr && (
					<ImportCamerasModal nvr={importNvr} onClose={() => setImportNvr(null)} />
				)}
			</Dialog>
		</ControlRoomLayout>
	);
};

export default NvrDevicesPage;
