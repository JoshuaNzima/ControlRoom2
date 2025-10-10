import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import QRCodeGenerator from '@/Components/QRCodeGenerator';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Download } from 'lucide-react';

export default function SupervisorQRCodes({ zones }) {
    const handleBulkDownload = () => {
        // TODO: Implement bulk download of QR codes for all zones
        // This would generate a zip file with QR codes for each zone
    };

    return (
        <AppLayout>
            <Head title="QR Code Management" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="mb-6 flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900">
                                QR Code Management
                            </h1>
                            <p className="mt-1 text-sm text-gray-600">
                                Generate and manage QR codes for zones, checkpoints, and assets.
                            </p>
                        </div>

                        <Button variant="outline" onClick={handleBulkDownload}>
                            <Download className="mr-2 h-4 w-4" />
                            Download All QR Codes
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <QRCodeGenerator />
                        
                        <Card className="p-6">
                            <h2 className="text-lg font-semibold mb-4">QR Code Usage Instructions</h2>
                            <div className="space-y-4 text-sm">
                                <div>
                                    <h3 className="font-medium mb-2">Zone QR Codes</h3>
                                    <p className="text-gray-600">
                                        Place these at zone entry points. Guards must scan when entering and leaving a zone.
                                    </p>
                                </div>
                                
                                <div>
                                    <h3 className="font-medium mb-2">Checkpoint QR Codes</h3>
                                    <p className="text-gray-600">
                                        Position at designated patrol checkpoints. Guards scan these during their rounds to confirm coverage.
                                    </p>
                                </div>
                                
                                <div>
                                    <h3 className="font-medium mb-2">Asset QR Codes</h3>
                                    <p className="text-gray-600">
                                        Attach to important assets for tracking and verification during security checks.
                                    </p>
                                </div>
                                
                                <div>
                                    <h3 className="font-medium mb-2">Location QR Codes</h3>
                                    <p className="text-gray-600">
                                        Use for specific locations that require regular monitoring or have special instructions.
                                    </p>
                                </div>

                                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                                    <h3 className="font-medium text-blue-800 mb-2">Best Practices</h3>
                                    <ul className="list-disc list-inside text-blue-700 space-y-2">
                                        <li>Print QR codes on weather-resistant material</li>
                                        <li>Place codes at easily accessible but secure locations</li>
                                        <li>Keep a backup of all generated QR codes</li>
                                        <li>Test codes with the mobile app before deployment</li>
                                        <li>Consider lighting conditions when placing codes</li>
                                    </ul>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}