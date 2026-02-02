import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import ControlRoomLayout from '@/Layouts/ControlRoomLayout';

export default function AssistZoneCommander() {
    const page = usePage<any>();
    const user = (page.props as any)?.auth?.user;

	return (
        <ControlRoomLayout title="Assist Zone Commander" user={user}>
            <Head title="Assist Zone Commander" />
			<div className="p-6">
				<h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Control Room · Assist Zone Commander</h1>
				<p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Tools to assist and append to Zone Commander activities.</p>
			</div>
        </ControlRoomLayout>
	);
}


