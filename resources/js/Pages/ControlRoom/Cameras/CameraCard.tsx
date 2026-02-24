import React from 'react';
import { router } from '@inertiajs/react';
import { Card } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { ExternalLink } from 'lucide-react';
import { useDetachedCamera } from '@/Hooks/useDetachedCamera';

declare const route: any;

type Site = { id: number | string; name?: string };

type Camera = {
	id: number | string;
	name?: string;
	stream_url?: string;
	status?: string | null;
	site?: Site | null;
	type?: string | null;
	location?: string | null;
};

interface Props {
	camera: Camera;
}

const CameraCard: React.FC<Props> = ({ camera }) => {
	const { detachCamera, isDetached } = useDetachedCamera();
	const isPoppedOut = isDetached(camera.id);

	const statusColors: Record<string, string> = {
		online: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
		offline: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
		maintenance: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
		disabled: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100',
	};

	const handleClick = () => {
		router.visit(route('control-room.cameras.show', camera.id));
	};

	const handleDetach = (e: React.MouseEvent) => {
		e.stopPropagation();
		detachCamera({
			id: camera.id,
			name: camera.name,
			stream_url: camera.stream_url,
			status: camera.status ?? undefined,
		});
	};

	return (
		<Card
			className="cursor-pointer transition-transform hover:scale-[1.02] group"
			onClick={handleClick}
		>
			<div className="relative">
				<div className="aspect-video bg-gray-100 dark:bg-gray-900/40 rounded-t-lg overflow-hidden">
					{camera.status === 'online' && camera.stream_url ? (
						<img
							src={`${camera.stream_url}/thumbnail`}
							alt={camera.name ? `Preview for ${camera.name}` : 'Camera preview'}
							className="w-full h-full object-cover"
							onError={(e: any) => {
								e.target.onerror = null;
								e.target.src = '/images/camera-offline.jpg';
							}}
						/>
					) : (
						<div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
							Camera Offline
						</div>
					)}
				</div>
				<Badge
					className={`absolute top-2 right-2 ${statusColors[camera.status ?? ''] ?? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100'}`}
				>
					{camera.status ?? '-'}
				</Badge>
				{camera.status === 'online' && (
					<Button
						variant="secondary"
						size="sm"
						className={`absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity ${isPoppedOut ? 'bg-green-600 text-white' : ''}`}
						onClick={handleDetach}
						title={isPoppedOut ? 'Already in pop-out window' : 'Pop out to new window'}
					>
						<ExternalLink className="w-3 h-3 mr-1" />
						{isPoppedOut ? 'Popped Out' : 'Pop Out'}
					</Button>
				)}
			</div>
			<div className="p-4">
				<h3 className="font-medium text-gray-900 dark:text-gray-100">{camera.name}</h3>
				<p className="text-sm text-gray-500 dark:text-gray-400">{camera.site?.name ?? '-'}</p>
				<div className="mt-2 flex items-center justify-between text-sm">
					<span className="text-gray-500 dark:text-gray-400">{camera.type ?? '-'}</span>
					<span className="text-gray-500 dark:text-gray-400">{camera.location ?? '-'}</span>
				</div>
			</div>
		</Card>
	);
};

export default CameraCard;
