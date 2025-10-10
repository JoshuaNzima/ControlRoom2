import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent, CardHeader } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import CoverageTrendChart from '@/Components/ControlRoom/CoverageTrendChart';
import AttendanceChart from '@/Components/ControlRoom/AttendanceChart';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const Dashboard = ({ stats }) => {
    const metricsData = [
        {
            title: 'Overall Coverage',
            value: `${stats.overallCoverage.toFixed(1)}%`,
            status: stats.overallCoverage >= 90 ? 'success' : stats.overallCoverage >= 70 ? 'warning' : 'danger'
        },
        {
            title: 'Active Incidents',
            value: stats.activeIncidents,
            status: stats.activeIncidents === 0 ? 'success' : stats.activeIncidents > 5 ? 'danger' : 'warning'
        },
        {
            title: 'Flagged Guards',
            value: stats.flaggedGuards,
            status: stats.flaggedGuards === 0 ? 'success' : stats.flaggedGuards > 3 ? 'danger' : 'warning'
        }
    ];

    return (
        <AppLayout>
            <Head title="Control Room Dashboard" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-6">Control Room Dashboard</h2>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        {metricsData.map((metric, index) => (
                            <Card key={index} className={`border-l-4 border-${metric.status}`}>
                                <CardContent className="py-4">
                                    <div className="text-sm font-medium text-gray-500">{metric.title}</div>
                                    <div className="mt-1 text-3xl font-semibold">{metric.value}</div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Zone Coverage Overview */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        <Card>
                            <CardHeader>
                                <h3 className="text-lg font-medium">Zone Coverage Status</h3>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {stats.zones.map((zone) => (
                                        <div key={zone.id} className="flex items-center justify-between">
                                            <div>
                                                <div className="font-medium">{zone.name}</div>
                                                <div className="text-sm text-gray-500">
                                                    {zone.activeGuards}/{zone.requiredGuards} Guards • {zone.sites} Sites
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className={`font-bold ${
                                                    zone.coverage >= 90 ? 'text-green-600' :
                                                    zone.coverage >= 70 ? 'text-yellow-600' :
                                                    'text-red-600'
                                                }`}>
                                                    {zone.coverage}%
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <h3 className="text-lg font-medium">Quick Actions</h3>
                                <div className="space-x-2">
                                    <Button variant="outline" size="sm">
                                        Create Ticket
                                    </Button>
                                    <Button variant="outline" size="sm">
                                        Report Issue
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {/* Add quick action buttons or links here */}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Weekly Trends */}
                    <div className="grid grid-cols-1 gap-6">
                        <Card>
                            <CardHeader>
                                <h3 className="text-lg font-medium">Weekly Coverage Trends</h3>
                            </CardHeader>
                            <CardContent>
                                <CoverageTrendChart zones={stats.zones} />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <h3 className="text-lg font-medium">Guard Attendance Overview</h3>
                            </CardHeader>
                            <CardContent>
                                <AttendanceChart zones={stats.zones} />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};

export default Dashboard;