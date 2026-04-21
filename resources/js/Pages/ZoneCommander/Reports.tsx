import React from 'react';
import { Head } from '@inertiajs/react';
import ZoneCommanderLayout from '@/Layouts/ZoneCommanderLayout';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import IconMapper from '@/Components/IconMapper';

export default function Reports() {
	return (
		<ZoneCommanderLayout title="Reports">
			<Head title="Zone Reports" />

			<div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
				{/* Header */}
				<div>
					<h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Reports</h1>
					<p className="text-sm text-gray-600 dark:text-gray-300">Compile zone-level reports and exports.</p>
				</div>

				{/* Report Types */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					<Card className="p-4 sm:p-6 bg-white/60 dark:bg-gray-900/40 hover:shadow-lg transition-shadow">
						<div className="flex items-start gap-4">
							<div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center shrink-0">
								<IconMapper name="ClipboardList" className="w-6 h-6 text-blue-600 dark:text-blue-200" />
							</div>
							<div className="min-w-0 flex-1">
								<h3 className="font-semibold text-gray-900 dark:text-gray-100">Attendance Report</h3>
								<p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Daily and weekly attendance summaries for your zone.</p>
								<Button variant="outline" size="sm" className="mt-3 w-full sm:w-auto">Generate</Button>
							</div>
						</div>
					</Card>

					<Card className="p-4 sm:p-6 bg-white/60 dark:bg-gray-900/40 hover:shadow-lg transition-shadow">
						<div className="flex items-start gap-4">
							<div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center shrink-0">
								<IconMapper name="ScanLine" className="w-6 h-6 text-green-600 dark:text-green-200" />
							</div>
							<div className="min-w-0 flex-1">
								<h3 className="font-semibold text-gray-900 dark:text-gray-100">Patrol Report</h3>
								<p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Checkpoint scan logs and patrol completion rates.</p>
								<Button variant="outline" size="sm" className="mt-3 w-full sm:w-auto">Generate</Button>
							</div>
						</div>
					</Card>

					<Card className="p-4 sm:p-6 bg-white/60 dark:bg-gray-900/40 hover:shadow-lg transition-shadow">
						<div className="flex items-start gap-4">
							<div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center shrink-0">
								<IconMapper name="AlertTriangle" className="w-6 h-6 text-yellow-600 dark:text-yellow-200" />
							</div>
							<div className="min-w-0 flex-1">
								<h3 className="font-semibold text-gray-900 dark:text-gray-100">Downs Report</h3>
								<p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Incident reports and resolution tracking.</p>
								<Button variant="outline" size="sm" className="mt-3 w-full sm:w-auto">Generate</Button>
							</div>
						</div>
					</Card>

					<Card className="p-4 sm:p-6 bg-white/60 dark:bg-gray-900/40 hover:shadow-lg transition-shadow">
						<div className="flex items-start gap-4">
							<div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center shrink-0">
								<IconMapper name="Shield" className="w-6 h-6 text-purple-600 dark:text-purple-200" />
							</div>
							<div className="min-w-0 flex-1">
								<h3 className="font-semibold text-gray-900 dark:text-gray-100">Guard Performance</h3>
								<p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Individual guard metrics and performance scores.</p>
								<Button variant="outline" size="sm" className="mt-3 w-full sm:w-auto">Generate</Button>
							</div>
						</div>
					</Card>

					<Card className="p-4 sm:p-6 bg-white/60 dark:bg-gray-900/40 hover:shadow-lg transition-shadow">
						<div className="flex items-start gap-4">
							<div className="w-12 h-12 bg-coin-100 dark:bg-coin-900/30 rounded-lg flex items-center justify-center shrink-0">
								<IconMapper name="MapPin" className="w-6 h-6 text-coin-600 dark:text-coin-200" />
							</div>
							<div className="min-w-0 flex-1">
								<h3 className="font-semibold text-gray-900 dark:text-gray-100">Site Status</h3>
								<p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Site coverage and security level summaries.</p>
								<Button variant="outline" size="sm" className="mt-3 w-full sm:w-auto">Generate</Button>
							</div>
						</div>
					</Card>

					<Card className="p-4 sm:p-6 bg-white/60 dark:bg-gray-900/40 hover:shadow-lg transition-shadow">
						<div className="flex items-start gap-4">
							<div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center shrink-0">
								<IconMapper name="QrCode" className="w-6 h-6 text-red-600 dark:text-red-200" />
							</div>
							<div className="min-w-0 flex-1">
								<h3 className="font-semibold text-gray-900 dark:text-gray-100">Checkpoint QR</h3>
								<p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Download QR codes for all checkpoints in your zone.</p>
								<Button asChild variant="outline" size="sm" className="mt-3 w-full sm:w-auto">
									<a href={route('zone.checkpoints.download-bulk')}>Download All</a>
								</Button>
							</div>
						</div>
					</Card>
				</div>
			</div>
		</ZoneCommanderLayout>
	);
}


