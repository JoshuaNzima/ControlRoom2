import React from 'react';
import ZoneCommanderLayout from '@/Layouts/ZoneCommanderLayout';

export default function Attendance() {
	return (
		<ZoneCommanderLayout title="Attendance">
			<p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Fallback attendance management when a supervisor is absent.</p>
		</ZoneCommanderLayout>
	);
}


