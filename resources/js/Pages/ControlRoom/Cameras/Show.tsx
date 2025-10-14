import React, { useState, useRef, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/Components/ui/alert';

type Camera = any;

const CameraShow: React.FC<{ camera: Camera; recentRecordings?: any[]; activeAlerts?: any[] }> = ({ camera, recentRecordings = [], activeAlerts = [] }) => {
	const [isRecording, setIsRecording] = useState(false);
	const videoRef = useRef<HTMLVideoElement | null>(null);

	const statusColors: Record<string, string> = {
		online: 'bg-green-100 text-green-800',
		offline: 'bg-red-100 text-red-800',
		maintenance: 'bg-yellow-100 text-yellow-800',
		disabled: 'bg-gray-100 text-gray-800',
	};

	useEffect(() => {
		if (camera?.status === 'online' && videoRef.current) {
			const video = videoRef.current as HTMLVideoElement;
			// Hls may be undefined in SSR environment; guard
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const Hls: any = (window as any).Hls;
			if (Hls && Hls.isSupported()) {
				const hls = new Hls();
				hls.loadSource(camera.stream_url);
				hls.attachMedia(video);
			} else if (video.canPlayType && video.canPlayType('application/vnd.apple.mpegurl')) {
				video.src = camera.stream_url;
			}
		}
	}, [camera?.status, camera?.stream_url]);

	const handleRecordingToggle = () => {
		// pass empty data object then options to satisfy Inertia router typings
		router.post(route('control-room.cameras.recordings.toggle', camera.id), {}, {
			onSuccess: () => {
				setIsRecording(!isRecording);
			},
		});
	};

	const handleDownloadRecording = (recordingId: any) => {
		window.location.href = route('control-room.cameras.recordings.download', recordingId);
	};

	const handleAcknowledgeAlert = (alertId: any) => {
		router.post(route('control-room.cameras.alerts.acknowledge', alertId));
	};

	return (
		<AppLayout>
			<Head title={`Camera: ${camera?.name || ''}`} />

			<div className="py-6">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center mb-6">
						<div>
							<h2 className="text-2xl font-semibold text-gray-900">{camera?.name}</h2>
							<p className="text-gray-500">{camera?.site?.name}</p>
						</div>
						<Badge className={statusColors[camera?.status || '']}>{camera?.status}</Badge>
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
						<div className="lg:col-span-2">
							<Card>
								<CardContent className="p-0">
									<div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
										{camera?.status === 'online' ? (
											<video ref={videoRef} className="w-full h-full" controls playsInline />
										) : (
											<div className="w-full h-full flex items-center justify-center text-gray-400">Camera Offline</div>
										)}
									</div>
									{camera?.status === 'online' && (
										<div className="p-4 flex justify-between items-center">
											<div className="space-x-2">
												<Button onClick={handleRecordingToggle} variant={isRecording ? 'destructive' : 'default'}>
													{isRecording ? 'Stop Recording' : 'Start Recording'}
												</Button>
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
		</AppLayout>
	);
};

export default CameraShow;
