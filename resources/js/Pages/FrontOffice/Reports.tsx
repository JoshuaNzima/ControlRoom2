import { Head, router } from '@inertiajs/react';
import FrontOfficeLayout from '@/Layouts/FrontOfficeLayout';
import {
    FileText,
    Download,
    Users,
    Calendar,
    TrendingUp,
    ArrowLeft,
    Printer,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { cn } from '@/lib/utils';

interface ReportsProps {
    monthlyStats: Array<{
        month: string;
        count: number;
    }>;
    purposeStats: Array<{
        purpose: string;
        count: number;
    }>;
}

export default function Reports({ monthlyStats, purposeStats }: ReportsProps) {
    const handleExport = (type: string) => {
        window.open(route('front-office.reports.export', { type }), '_blank');
    };

    const totalVisitors = monthlyStats.reduce((sum, m) => sum + m.count, 0);
    const avgMonthly = monthlyStats.length > 0 ? Math.round(totalVisitors / monthlyStats.length) : 0;

    return (
        <FrontOfficeLayout>
            <Head title="Reports & Analytics" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <FileText className="w-6 h-6 text-red-400" />
                        Reports & Analytics
                    </h1>
                    <p className="text-gray-500 mt-1">Front office insights and visitor statistics</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => handleExport('visitors')}
                        className="border-[#222222] text-gray-400"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                    </Button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card className="bg-[#111111] border-[#222222]">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <Users className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total This Year</p>
                                <p className="text-2xl font-bold text-white">{totalVisitors}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-[#111111] border-[#222222]">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-green-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Avg Monthly</p>
                                <p className="text-2xl font-bold text-white">{avgMonthly}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-[#111111] border-[#222222]">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Peak Month</p>
                                <p className="text-2xl font-bold text-white">
                                    {monthlyStats.length > 0
                                        ? monthlyStats.reduce((max, m) => m.count > max.count ? m : max, monthlyStats[0])?.month || '-'
                                        : '-'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-[#111111] border-[#222222]">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-orange-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Top Purpose</p>
                                <p className="text-lg font-bold text-white truncate">
                                    {purposeStats.length > 0
                                        ? purposeStats.reduce((max, p) => p.count > max.count ? p : max, purposeStats[0])?.purpose || '-'
                                        : '-'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Grid */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Monthly Trend */}
                <Card className="bg-[#111111] border-[#222222]">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-red-400" />
                            Monthly Visitor Trend
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {monthlyStats.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                No data available
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {monthlyStats.map((stat) => {
                                    const maxCount = Math.max(...monthlyStats.map(m => m.count));
                                    const percentage = maxCount > 0 ? (stat.count / maxCount) * 100 : 0;

                                    return (
                                        <div key={stat.month} className="flex items-center gap-3">
                                            <span className="text-sm text-gray-500 w-16">{stat.month}</span>
                                            <div className="flex-1 h-8 bg-[#1a1a1a] rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-red-600 to-red-500 rounded-full transition-all duration-500"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                            <span className="text-sm font-medium text-white w-10 text-right">{stat.count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Purpose Breakdown */}
                <Card className="bg-[#111111] border-[#222222]">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                            <Users className="w-5 h-5 text-red-400" />
                            Visit Purpose Breakdown
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {purposeStats.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                No data available
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {purposeStats.map((stat, idx) => {
                                    const maxCount = Math.max(...purposeStats.map(p => p.count));
                                    const percentage = maxCount > 0 ? (stat.count / maxCount) * 100 : 0;
                                    const colors = [
                                        'from-blue-600 to-blue-500',
                                        'from-green-600 to-green-500',
                                        'from-purple-600 to-purple-500',
                                        'from-orange-600 to-orange-500',
                                        'from-pink-600 to-pink-500',
                                    ];
                                    const colorClass = colors[idx % colors.length];

                                    return (
                                        <div key={stat.purpose} className="flex items-center gap-3">
                                            <span className="text-sm text-gray-500 w-24 truncate">{stat.purpose}</span>
                                            <div className="flex-1 h-6 bg-[#1a1a1a] rounded-full overflow-hidden">
                                                <div
                                                    className={cn("h-full bg-gradient-to-r rounded-full transition-all duration-500", colorClass)}
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                            <span className="text-sm font-medium text-white w-8 text-right">{stat.count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <Card className="bg-[#111111] border-[#222222] mt-6">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-white">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-3">
                        <Button
                            variant="outline"
                            onClick={() => router.get(route('front-office.reports.visitors'))}
                            className="border-[#222222] text-gray-400"
                        >
                            <Users className="w-4 h-4 mr-2" />
                            View Visitor Log
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => handleExport('visitors')}
                            className="border-[#222222] text-gray-400"
                        >
                            <Printer className="w-4 h-4 mr-2" />
                            Print Report
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </FrontOfficeLayout>
    );
}
