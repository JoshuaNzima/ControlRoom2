import React from 'react';
import { Head, Link } from '@inertiajs/react';
import ControlRoomLayout from '@/Layouts/ControlRoomLayout';
import QRCodeGenerator from '@/Components/QRCodeGenerator';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import IconMapper from '@/Components/IconMapper';

export default function SupervisorQRCodes({ zones }: { zones: any }) {
    const handleBulkDownload = () => {
        window.location.href = route('supervisor.qr-codes.download-bulk');
    };

    const handleDownloadSaved = () => {
        window.location.href = route('supervisor.qr-codes.download-saved');
    };

    return (
        <ControlRoomLayout title="QR Code Management">
            <Head title="QR Code Management" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                                QR Code Management
                            </h1>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                                Generate and manage QR codes for zones, checkpoints, and assets.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2">
                            <Button variant="outline" onClick={handleBulkDownload} className="w-full sm:w-auto">
                                <span className="mr-2 h-4 w-4 inline-block"><IconMapper name="Download" size={16} /></span>
                                Generate & Download All
                            </Button>
                            <Button variant="outline" onClick={handleDownloadSaved} className="w-full sm:w-auto">
                                <span className="mr-2 h-4 w-4 inline-block"><IconMapper name="Archive" size={16} /></span>
                                Download Saved
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <QRCodeGenerator />
                        
                        <Card className="p-6 dark:bg-gray-900/60 dark:border-gray-800">
                            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">QR Code Usage Instructions</h2>
                            <div className="space-y-4 text-sm">
                                <div>
                                    <h3 className="font-medium mb-2 text-gray-900 dark:text-gray-100">Zone QR Codes</h3>
                                    <p className="text-gray-600 dark:text-gray-300">
                                        Place these at zone entry points. Guards must scan when entering and leaving a zone.
                                    </p>
                                </div>
                                
                                <div>
                                    <h3 className="font-medium mb-2 text-gray-900 dark:text-gray-100">Checkpoint QR Codes</h3>
                                    <p className="text-gray-600 dark:text-gray-300">
                                        Position at designated patrol checkpoints. Guards scan these during their rounds to confirm coverage.
                                    </p>
                                </div>
                                
                                <div>
                                    <h3 className="font-medium mb-2 text-gray-900 dark:text-gray-100">Asset QR Codes</h3>
                                    <p className="text-gray-600 dark:text-gray-300">
                                        Attach to important assets for tracking and verification during security checks.
                                    </p>
                                </div>
                                
                                <div>
                                    <h3 className="font-medium mb-2 text-gray-900 dark:text-gray-100">Location QR Codes</h3>
                                    <p className="text-gray-600 dark:text-gray-300">
                                        Use for specific locations that require regular monitoring or have special instructions.
                                    </p>
                                </div>

                                <div className="mt-6 p-4 bg-coin-50 dark:bg-coin-900/20 rounded-lg border border-coin-200 dark:border-coin-900/30">
                                    <h3 className="font-medium text-coin-800 dark:text-coin-200 mb-2">Best Practices</h3>
                                    <ul className="list-disc list-inside text-coin-700 dark:text-coin-200 space-y-2">
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
        </ControlRoomLayout>
    );
}
