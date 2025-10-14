// Re-export default from the original JS implementation to satisfy resolver
import React from 'react';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { ScrollArea } from '@/Components/ui/scroll-area';
import QRCodeGenerator from '@/Components/QRCodeGenerator';

interface Props {
	zones?: any[];
	checkpoints?: any[];
	assets?: any[];
}

const DashboardQRSection: React.FC<Props> = ({ zones = [], checkpoints = [], assets = [] }) => {
	return (
		<Card className="col-span-full xl:col-span-2">
			<div className="p-6">
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-lg font-semibold">
						QR Code Management
					</h2>
					<Button
						variant="outline"
						onClick={() => window.location.href = route('admin.qr-codes')}
					>
						View All QR Codes
					</Button>
				</div>

				<ScrollArea className="h-[600px] pr-4">
					<div className="space-y-6">
						<QRCodeGenerator />
                        
						{/* Quick Access Section */}
						<div className="mt-6">
							<h3 className="text-sm font-medium mb-3">Quick Access</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{/* Zones */}
								<Card className="p-4">
									<h4 className="text-sm font-medium mb-2">Zones</h4>
									<div className="space-y-2">
										{zones?.slice(0, 3).map((zone) => (
											<div
												key={zone.id}
												className="text-sm p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
												onClick={() => {
													// Pre-fill QR generator with zone data
												}}
											>
												{zone.name}
											</div>
										))}
									</div>
								</Card>

								{/* Checkpoints */}
								<Card className="p-4">
									<h4 className="text-sm font-medium mb-2">Checkpoints</h4>
									<div className="space-y-2">
										{checkpoints?.slice(0, 3).map((checkpoint) => (
											<div
												key={checkpoint.id}
												className="text-sm p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
												onClick={() => {
													// Pre-fill QR generator with checkpoint data
												}}
											>
												{checkpoint.name}
											</div>
										))}
									</div>
								</Card>
							</div>
						</div>

						{/* Best Practices */}
						<Card className="p-4 bg-blue-50 border-blue-100">
							<h3 className="text-sm font-medium text-blue-800 mb-2">
								QR Code Tips
							</h3>
							<ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
								<li>Use weather-resistant materials for outdoor QR codes</li>
								<li>Test scan functionality before deployment</li>
								<li>Keep digital backups of all generated codes</li>
							</ul>
						</Card>
					</div>
				</ScrollArea>
			</div>
		</Card>
	);
};

export default DashboardQRSection;
