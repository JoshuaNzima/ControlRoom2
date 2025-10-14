import React from 'react';
import { router } from '@inertiajs/react';
import { Card } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';

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
	const statusColors: Record<string, string> = {
		online: 'bg-green-100 text-green-800',
		offline: 'bg-red-100 text-red-800',
		maintenance: 'bg-yellow-100 text-yellow-800',
		disabled: 'bg-gray-100 text-gray-800',
	};

	const handleClick = () => {
		router.visit(route('control-room.cameras.show', camera.id));
	};

	return (
		<Card
			className="cursor-pointer transition-transform hover:scale-[1.02]"
			onClick={handleClick}
		>
			<div className="relative">
				<div className="aspect-video bg-gray-100 rounded-t-lg overflow-hidden">
					{camera.status === 'online' && camera.stream_url ? (
						// eslint-disable-next-line jsx-a11y/img-redundant-alt
						<img
							src={`${camera.stream_url}/thumbnail`}
							alt={camera.name || 'Camera thumbnail'}
							className="w-full h-full object-cover"
							onError={(e: any) => {
								e.target.onerror = null;
								e.target.src = '/images/camera-offline.jpg';
							}}
						/>
					) : (
						<div className="w-full h-full flex items-center justify-center text-gray-400">
							Camera Offline
						</div>
					)}
				</div>
				<Badge
					className={`absolute top-2 right-2 ${statusColors[camera.status ?? ''] ?? 'bg-gray-100 text-gray-800'}`}
				>
					{camera.status ?? '-'}
				</Badge>
			</div>
			<div className="p-4">
				<h3 className="font-medium">{camera.name}</h3>
				<p className="text-sm text-gray-500">{camera.site?.name ?? '-'}</p>
				<div className="mt-2 flex items-center justify-between text-sm">
					<span className="text-gray-500">{camera.type ?? '-'}</span>
					<span className="text-gray-500">{camera.location ?? '-'}</span>
				</div>
			</div>
		</Card>
	);
};

export default CameraCard;
