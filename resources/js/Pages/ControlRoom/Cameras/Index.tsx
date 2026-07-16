import React, { useMemo, useState } from 'react';
import { formatDateMW } from '@/Components/format';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
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
import { HardDrive } from 'lucide-react';
import CameraCard from './CameraCard';
import AddCameraForm from './AddCameraForm';
import AddNvrModal from './AddNvrModal';

declare const route: any;

type Client = { id: number | string; name: string };
type Site = { id: number | string; name: string; client?: Client | null };
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

type GroupedCameras = Array<{
	clientId: string;
	clientName: string;
	sites: Array<{
		siteId: string;
		siteName: string;
		cameras: Camera[];
	}>;
}>;

interface Props {
	cameras?: { data: Camera[] };
	sites?: Site[];
	clients?: Client[];
	filters?: { statuses?: string[] };
	appliedFilters?: {
		client_id?: number | string | null;
		site_id?: number | string | null;
		status?: string | null;
	};
}

const CameraList: React.FC<Props> = ({
	cameras = { data: [] },
	sites = [],
	clients = [],
	filters = { statuses: [] },
	appliedFilters = {},
}) => {
	const initialFilterValue = (value: any) => {
		if (value === undefined || value === null || String(value).trim() === '') return '__all__';
		return String(value);
	};

	const [filterClient, setFilterClient] = useState<string>(() => initialFilterValue(appliedFilters.client_id));
	const [filterSite, setFilterSite] = useState<string>(() => initialFilterValue(appliedFilters.site_id));
	const [filterStatus, setFilterStatus] = useState<string>(() => initialFilterValue(appliedFilters.status));
	const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
	const [groupedView, setGroupedView] = useState<boolean>(true);
	const [showAddDialog, setShowAddDialog] = useState(false);
	const [showAddNvrDialog, setShowAddNvrDialog] = useState(false);

	const statusColors: Record<string, string> = {
		online: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
		offline: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
		maintenance: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
		disabled: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100',
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

		router.get(route('control-room.cameras.index'), params, {
			preserveState: true,
			preserveScroll: true,
		});
	};

	const cameraList = cameras?.data ?? [];

	const getSiteLabel = (site: Site) => {
		const clientName = site?.client?.name?.trim();
		if (clientName) return `${clientName} • ${site.name}`;
		return site.name;
	};

	const grouped = useMemo<GroupedCameras>(() => {
		const groups = new Map<string, { clientId: string; clientName: string; sites: Map<string, { siteId: string; siteName: string; cameras: Camera[] }> }>();

		for (const camera of cameraList) {
			const siteName = camera.site?.name?.trim() || 'Unassigned Site';
			const siteId = camera.site?.id !== undefined && camera.site?.id !== null ? String(camera.site.id) : '__no_site__';
			const clientName = camera.site?.client?.name?.trim() || 'Unassigned Company';
			const clientId = camera.site?.client?.id !== undefined && camera.site?.client?.id !== null ? String(camera.site.client.id) : '__no_client__';

			if (!groups.has(clientId)) {
				groups.set(clientId, { clientId, clientName, sites: new Map() });
			}
			const clientGroup = groups.get(clientId)!;

			if (!clientGroup.sites.has(siteId)) {
				clientGroup.sites.set(siteId, { siteId, siteName, cameras: [] });
			}
			clientGroup.sites.get(siteId)!.cameras.push(camera);
		}

		const out: GroupedCameras = Array.from(groups.values()).map((g) => {
			const sitesArr = Array.from(g.sites.values())
				.map((s) => ({
					...s,
					cameras: [...s.cameras].sort((a, b) => String(a.name).localeCompare(String(b.name))),
				}))
				.sort((a, b) => a.siteName.localeCompare(b.siteName));
			return { clientId: g.clientId, clientName: g.clientName, sites: sitesArr };
		}).sort((a, b) => a.clientName.localeCompare(b.clientName));

		return out;
	}, [cameraList]);

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

		if (groupedView) {
			if (viewMode === 'grid') {
				return (
					<div className="space-y-6">
						{grouped.map((company) => (
							<div key={company.clientId} className="space-y-3">
								<div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
									{company.clientName}
								</div>
								{company.sites.map((site) => (
									<div key={`${company.clientId}-${site.siteId}`} className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/40">
										<div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
											<div className="text-sm font-medium text-gray-800 dark:text-gray-200">
												{site.siteName}
											</div>
											<div className="text-xs text-gray-500 dark:text-gray-400">
												{site.cameras.length} camera{site.cameras.length === 1 ? '' : 's'}
											</div>
										</div>
										<div className="p-4">
											<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
												{site.cameras.map((camera) => (
													<CameraCard key={camera.id} camera={camera} />
												))}
											</div>
										</div>
									</div>
								))}
							</div>
						))}
					</div>
				);
			}

			return (
				<>
					<div className="lg:hidden divide-y divide-gray-200 dark:divide-gray-800">
						{grouped.map((company) => (
							<div key={company.clientId} className="py-2">
								<div className="px-4 pt-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
									{company.clientName}
								</div>
								{company.sites.map((site) => (
									<div key={`${company.clientId}-${site.siteId}`} className="pt-2">
										<div className="px-4 text-xs font-medium text-gray-600 dark:text-gray-300">
											{site.siteName}
										</div>
										{site.cameras.map((camera) => (
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
								))}
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
								{grouped.flatMap((company) => {
									const rows: any[] = [];
									rows.push(
										<TableRow key={`company-${company.clientId}`}>
											<TableCell colSpan={7} className="bg-gray-50 dark:bg-gray-900/40 text-gray-900 dark:text-gray-100 font-semibold">
												{company.clientName}
											</TableCell>
										</TableRow>
									);
									company.sites.forEach((site) => {
										rows.push(
											<TableRow key={`site-${company.clientId}-${site.siteId}`}>
												<TableCell colSpan={7} className="bg-white dark:bg-gray-900/20 text-gray-700 dark:text-gray-200 font-medium">
													{site.siteName}
												</TableCell>
											</TableRow>
										);
										site.cameras.forEach((camera) => {
											rows.push(
												<TableRow key={`camera-${camera.id}`}>
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
											);
										});
									});
									return rows;
								})}
							</TableBody>
						</Table>
					</div>
				</>
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
		<AuthenticatedLayout header="CCTV Management">
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
										variant="outline"
										size="sm"
										onClick={() => router.visit(route('control-room.cameras.nvrs.index'))}
									>
										<HardDrive className="w-4 h-4 mr-1" />
										Manage NVRs
									</Button>
									<Button
										variant={groupedView ? 'default' : 'outline'}
										size="sm"
										onClick={() => setGroupedView((v) => !v)}
									>
										Grouped
									</Button>
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
								<Dialog open={showAddNvrDialog} onOpenChange={setShowAddNvrDialog}>
									<DialogTrigger asChild>
										<Button variant="secondary">Add NVR/DVR</Button>
									</DialogTrigger>
									<AddNvrModal onClose={() => setShowAddNvrDialog(false)} sites={sites} />
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
										{Array.isArray(clients) && clients.map((client) => (
											<SelectItem key={client.id} value={String(client.id)}>
												{client.name}
											</SelectItem>
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
										{Array.isArray(sites) && sites.map((site) => (
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
							{content}
						</CardContent>
					</Card>
				</div>
			</div>
		</AuthenticatedLayout>
	);
};

export default CameraList;
