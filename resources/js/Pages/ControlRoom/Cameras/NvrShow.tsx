import React from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { PageHeader } from '@/Components/ui/page-header';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/Components/ui/table';
import { Wifi, WifiOff, AlertTriangle, HardDrive, ArrowLeft, RefreshCw, Play, Settings } from 'lucide-react';

declare const route: any;

type Camera = {
	id: number | string;
	name: string;
	nvr_channel: number;
	status: string;
	type: string;
	stream_url: string | null;
	location: string | null;
};

type Site = {
	id: number | string;
	name: string;
	client?: { id: number | string; name: string } | null;
};

type NvrDevice = {
	id: number | string;
	name: string;
	device_type: 'nvr' | 'dvr';
	brand: string | null;
	model: string | null;
	public_protocol: string | null;
	public_host: string;
	public_port: number | null;
	public_path: string | null;
	local_ip: string | null;
	local_port: number | null;
	username: string | null;
	status: 'online' | 'offline' | 'error' | 'disabled';
	channel_count: number;
	active_channels: number;
	last_online_at: string | null;
	last_sync_at: string | null;
	notes: string | null;
	site: Site | null;
	cameras: Camera[];
};

interface Props {
	nvr: NvrDevice;
}

const statusColors: Record<string, string> = {
	online: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
	offline: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
	error: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200',
	disabled: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100',
};

const cameraStatusColors: Record<string, string> = {
	online: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
	offline: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
	maintenance: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
	disabled: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100',
};

const statusIcons = {
	online: <Wifi className="w-5 h-5 text-green-600" />,
	offline: <WifiOff className="w-5 h-5 text-red-600" />,
	error: <AlertTriangle className="w-5 h-5 text-orange-600" />,
	disabled: <Settings className="w-5 h-5 text-gray-600" />,
};

const NvrShow: React.FC<Props> = ({ nvr }) => {
	const handleTestConnection = () => {
		router.post(route('control-room.cameras.nvrs.test', nvr.id));
	};

	const handleSync = () => {
		router.post(route('control-room.cameras.nvrs.sync', nvr.id));
	};

	return (
		<AuthenticatedLayout header={`NVR: ${nvr.name}`}>
			<Head title={`NVR: ${nvr.name}`} />

			<div className="py-6">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<PageHeader
						title={nvr.name}
						description={`${nvr.device_type?.toUpperCase()} • ${nvr.brand} ${nvr.model || ''}`}
						actions={(
							<>
								<Button
									variant="outline"
									size="sm"
									onClick={() => router.visit(route('control-room.cameras.nvrs.index'))}
								>
									<ArrowLeft className="w-4 h-4 mr-1" />
									Back
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={handleTestConnection}
								>
									Test Connection
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={handleSync}
								>
									<RefreshCw className="w-4 h-4 mr-1" />
									Sync All Channels
								</Button>
							</>
						)}
						className="mb-6"
					/>

					<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
						{/* Device Info */}
						<div className="lg:col-span-1 space-y-6">
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<HardDrive className="w-5 h-5" />
										Device Status
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="flex items-center gap-3 mb-4">
										{statusIcons[nvr.status]}
										<Badge className={statusColors[nvr.status]}>
											{nvr.status?.toUpperCase()}
										</Badge>
									</div>

									<div className="space-y-3 text-sm">
										<div className="flex justify-between">
											<span className="text-gray-500 dark:text-gray-400">Last Online</span>
											<span className="text-gray-900 dark:text-gray-100">
												{nvr.last_online_at
													? new Date(nvr.last_online_at).toLocaleString()
													: 'Never'}
											</span>
										</div>
										<div className="flex justify-between">
											<span className="text-gray-500 dark:text-gray-400">Last Sync</span>
											<span className="text-gray-900 dark:text-gray-100">
												{nvr.last_sync_at
													? new Date(nvr.last_sync_at).toLocaleString()
													: 'Never'}
											</span>
										</div>
										<div className="flex justify-between">
											<span className="text-gray-500 dark:text-gray-400">Active Cameras</span>
											<span className="text-gray-900 dark:text-gray-100">
												{nvr.active_channels} / {nvr.channel_count}
											</span>
										</div>
									</div>
								</CardContent>
							</Card>

							<Card>
								<CardHeader>
									<CardTitle>Connection Details</CardTitle>
								</CardHeader>
								<CardContent className="space-y-3 text-sm">
									<div>
										<div className="text-gray-500 dark:text-gray-400">Public URL</div>
										<div className="font-mono text-xs mt-1 break-all">
											{nvr.public_protocol || 'http'}://{nvr.public_host}
											{nvr.public_port ? `:${nvr.public_port}` : ''}
											{nvr.public_path || ''}
										</div>
									</div>
									{nvr.local_ip && (
										<div>
											<div className="text-gray-500 dark:text-gray-400">Local Network</div>
											<div className="font-mono text-xs mt-1">
												{nvr.local_ip}{nvr.local_port ? `:${nvr.local_port}` : ''}
											</div>
										</div>
									)}
									{nvr.username && (
										<div>
											<div className="text-gray-500 dark:text-gray-400">Username</div>
											<div className="mt-1">{nvr.username}</div>
										</div>
									)}
								</CardContent>
							</Card>

							{nvr.site && (
								<Card>
									<CardHeader>
										<CardTitle>Site Information</CardTitle>
									</CardHeader>
									<CardContent className="space-y-2 text-sm">
										<div>
											<div className="text-gray-500 dark:text-gray-400">Site Name</div>
											<div className="mt-1">{nvr.site.name}</div>
										</div>
										{nvr.site.client && (
											<div>
												<div className="text-gray-500 dark:text-gray-400">Client</div>
												<div className="mt-1">{nvr.site.client.name}</div>
											</div>
										)}
									</CardContent>
								</Card>
							)}

							{nvr.notes && (
								<Card>
									<CardHeader>
										<CardTitle>Notes</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-sm text-gray-700 dark:text-gray-300">{nvr.notes}</p>
									</CardContent>
								</Card>
							)}
						</div>

						{/* Cameras List */}
						<div className="lg:col-span-2">
							<Card>
								<CardHeader>
									<CardTitle>Cameras ({nvr.cameras?.length || 0})</CardTitle>
								</CardHeader>
								<CardContent>
									{nvr.cameras?.length === 0 ? (
										<div className="text-center py-8 text-gray-500 dark:text-gray-400">
											<p>No cameras imported yet.</p>
											<Button
												className="mt-4"
												onClick={handleSync}
											>
												Import Cameras
											</Button>
										</div>
									) : (
										<div className="overflow-x-auto">
											<Table>
												<TableHeader>
													<TableRow>
														<TableHead>Channel</TableHead>
														<TableHead>Name</TableHead>
														<TableHead>Type</TableHead>
														<TableHead>Status</TableHead>
														<TableHead>Location</TableHead>
														<TableHead>Actions</TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													{nvr.cameras?.map((camera) => (
														<TableRow key={camera.id}>
															<TableCell className="font-mono">{camera.nvr_channel}</TableCell>
															<TableCell className="font-medium">{camera.name}</TableCell>
															<TableCell>{camera.type?.toUpperCase()}</TableCell>
															<TableCell>
																<Badge className={cameraStatusColors[camera.status] || 'bg-gray-100'}>
																	{camera.status}
																</Badge>
															</TableCell>
															<TableCell>{camera.location || '-'}</TableCell>
															<TableCell>
																<Button
																	variant="ghost"
																	size="sm"
																	onClick={() => router.visit(route('control-room.cameras.show', camera.id))}
																>
																	<Play className="w-4 h-4 mr-1" />
																	View
																</Button>
															</TableCell>
														</TableRow>
													))}
												</TableBody>
											</Table>
										</div>
									)}
								</CardContent>
							</Card>
						</div>
					</div>
				</div>
			</div>
		</AuthenticatedLayout>
	);
};

export default NvrShow;
