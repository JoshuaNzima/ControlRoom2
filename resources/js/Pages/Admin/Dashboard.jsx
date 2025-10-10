import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import DashboardQRSection from '@/Components/DashboardQRSection';
import DashboardStats from '@/Components/DashboardStats';

export default function Dashboard({ stats, qrData }) {
    return (
        <AppLayout>
            <Head title="Admin Dashboard" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <h1 className="text-2xl font-semibold text-gray-900 mb-6">
                        Admin Dashboard
                    </h1>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        {/* Main Dashboard Content */}
                        <div className="col-span-full xl:col-span-1">
                            <DashboardStats stats={stats} />
                            {/* Other dashboard components */}
                        </div>

                        {/* QR Code Section */}
                        <DashboardQRSection
                            zones={qrData.zones}
                            checkpoints={qrData.checkpoints}
                            assets={qrData.assets}
                        />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}