import React, { useRef, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import ControlRoomLayout from '@/Layouts/ControlRoomLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/Components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/Components/ui/alert';

declare const route: any;

type Camera = any;

const CameraShow: React.FC<{ camera: Camera; recentRecordings?: any[]; activeAlerts?: any[] }> = ({ camera, recentRecordings = [], activeAlerts = [] }) => {
	const videoRef = useRef<HTMLVideoElement | null>(null);

	const statusColors: Record<string, string> = {
		online: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
		offline: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
		maintenance: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
		disabled: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100',
	};

	useEffect(() => {
		if (camera?.status === 'online' && videoRef.current) {
			const video = videoRef.current as HTMLVideoElement;
			// Hls may be undefined in SSR environment; guard
			const Hls = (window as any).Hls as any;
			if (Hls && Hls.isSupported()) {
				const hls = new Hls();
				hls.loadSource(camera.stream_url);
				hls.attachMedia(video);
			} else if (video.canPlayType && video.canPlayType('application/vnd.apple.mpegurl')) {
				video.src = camera.stream_url;
			}
		}
	}, [camera?.status, camera?.stream_url]);

	const handleDownloadRecording = (recordingId: any) => {
		window.location.href = route('control-room.cameras.recordings.download', recordingId);
	};

	const handleAcknowledgeAlert = (alertId: any) => {
		router.post(route('control-room.cameras.alerts.acknowledge', { camera: camera.id, alert: alertId }));
	};

	return (
		<ControlRoomLayout title={`Camera: ${camera?.name || ''}`}>
			<Head title={`Camera: ${camera?.name || ''}`} />

			<div className="py-6">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center mb-6">
						<div>
							<h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{camera?.name}</h2>
							<p className="text-gray-500 dark:text-gray-400">{camera?.site?.name}</p>
						</div>
						<Badge className={statusColors[camera?.status || '']}>{camera?.status}</Badge>
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
						<div className="lg:col-span-2">
							<Card>
								<CardContent className="p-0">
									<div className="aspect-video bg-gray-100 dark:bg-gray-900/40 rounded-lg overflow-hidden">
										{camera?.status === 'online' ? (
											<video ref={videoRef} className="w-full h-full" controls playsInline />
										) : (
											<div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">Camera Offline</div>
										)}
									</div>
									{camera?.status === 'online' && (
										<div className="p-4 flex justify-between items-center">
											<div className="space-x-2">
												<Button variant="outline">Snapshot</Button>
											</div>
											<div className="flex items-center space-x-2">
												<Badge variant="outline">{camera?.type?.toUpperCase()}</Badge>
												{camera?.recording_enabled && (
													<Badge variant="outline">{camera?.retention_days} Days Retention</Badge>
												)}
											</div>
										</div>
									)}
								</CardContent>
							</Card>
						</div>

						<div className="lg:col-span-1 space-y-6">
							{Array.isArray(activeAlerts) && activeAlerts.length > 0 && (
								<Card>
									<CardHeader>
										<CardTitle>Active Alerts</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="space-y-2">
											{activeAlerts.map((alert: any) => (
												<Alert key={alert.id}>
													<AlertTitle>{alert.type}</AlertTitle>
													<AlertDescription>
														{alert.description}
														<Button variant="outline" size="sm" className="mt-2" onClick={() => handleAcknowledgeAlert(alert.id)}>
															Acknowledge
														</Button>
													</AlertDescription>
												</Alert>
											))}
										</div>
									</CardContent>
								</Card>
							)}

							<Card>
								<CardHeader>
									<CardTitle>Recent Recordings</CardTitle>
								</CardHeader>
								<CardContent>
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Date</TableHead>
												<TableHead>Type</TableHead>
												<TableHead>Duration</TableHead>
												<TableHead>{''}</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{recentRecordings.map((recording: any) => (
												<TableRow key={recording.id}>
													<TableCell>{new Date(recording.start_time).toLocaleDateString()}</TableCell>
													<TableCell>{recording.type}</TableCell>
													<TableCell>{Math.round(recording.duration / 60)} min</TableCell>
													<TableCell>
														<Button variant="ghost" size="sm" onClick={() => handleDownloadRecording(recording.id)}>Download</Button>
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</CardContent>
							</Card>
						</div>
					</div>
				</div>
			</div>
		</ControlRoomLayout>
	);
};

export default CameraShow;

