import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import {
    FileText,
    Download,
    Users,
    Calendar,
    TrendingUp,
    Clock,
    CheckCircle,
    AlertCircle,
    BarChart3,
    PieChart,
    Target,
    ArrowUpRight,
    ArrowDownRight,
    Filter,
    FileSpreadsheet,
    FileDown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
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
    taskStats: {
        total: number;
        completed: number;
        pending: number;
        in_progress: number;
        overdue: number;
        cancelled: number;
    };
    priorityStats: Record<string, number>;
    categoryStats: Record<string, number>;
    monthlyTaskStats: Array<{
        month: string;
        count: number;
    }>;
    topPerformers: Array<{
        name: string;
        count: number;
    }>;
    avgCompletionTime: number;
    filters: {
        start_date: string;
        end_date: string;
    };
}

export default function Reports({
    monthlyStats,
    purposeStats,
    taskStats,
    priorityStats,
    categoryStats,
    monthlyTaskStats,
    topPerformers,
    avgCompletionTime,
    filters,
}: ReportsProps) {
    const [dateRange, setDateRange] = useState({
        start_date: filters.start_date,
        end_date: filters.end_date,
    });
    const [activeTab, setActiveTab] = useState('overview');

    const handleDateFilter = () => {
        router.get(route('front-office.reports.index'), dateRange);
    };

    const handleExport = (type: string) => {
        window.open(route('front-office.reports.export', { type }), '_blank');
    };

    const completionRate = taskStats.total > 0
        ? Math.round((taskStats.completed / taskStats.total) * 100)
        : 0;

    const totalVisitors = monthlyStats.reduce((sum, m) => sum + m.count, 0);
    const avgMonthlyVisitors = monthlyStats.length > 0
        ? Math.round(totalVisitors / monthlyStats.length)
        : 0;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-500';
            case 'pending': return 'bg-yellow-500';
            case 'in_progress': return 'bg-purple-500';
            case 'overdue': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'from-red-600 to-red-500';
            case 'high': return 'from-orange-600 to-orange-500';
            case 'medium': return 'from-yellow-600 to-yellow-500';
            default: return 'from-blue-600 to-blue-500';
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Reports & Analytics" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <BarChart3 className="w-6 h-6 text-coin-500" />
                        Reports & Analytics
                    </h1>
                    <p className="text-muted-foreground mt-1">Comprehensive insights on tasks and visitors</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <Button
                        variant="outline"
                        onClick={() => handleExport('visitors')}
                        className="border-border"
                    >
                        <FileDown className="w-4 h-4 mr-2" />
                        PDF
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => window.open(route('front-office.tasks.export', { format: 'excel', ...filters }), '_blank')}
                        className="border-border"
                    >
                        <FileSpreadsheet className="w-4 h-4 mr-2" />
                        Excel
                    </Button>
                </div>
            </div>

            {/* Date Range Filter */}
            <Card className="bg-card border-border mb-6">
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-end">
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-muted-foreground">Start Date</Label>
                                <Input
                                    type="date"
                                    value={dateRange.start_date}
                                    onChange={e => setDateRange({ ...dateRange, start_date: e.target.value })}
                                    className="bg-muted border-border text-foreground"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-muted-foreground">End Date</Label>
                                <Input
                                    type="date"
                                    value={dateRange.end_date}
                                    onChange={e => setDateRange({ ...dateRange, end_date: e.target.value })}
                                    className="bg-muted border-border text-foreground"
                                />
                            </div>
                        </div>
                        <Button onClick={handleDateFilter} className="bg-coin-600 hover:bg-coin-700">
                            <Filter className="w-4 h-4 mr-2" />
                            Apply Filter
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="bg-muted border-border">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-background">Overview</TabsTrigger>
                    <TabsTrigger value="tasks" className="data-[state=active]:bg-background">Task Reports</TabsTrigger>
                    <TabsTrigger value="visitors" className="data-[state=active]:bg-background">Visitor Reports</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                    {/* Summary Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="bg-card border-border">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                        <Target className="w-5 h-5 text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Tasks</p>
                                        <p className="text-2xl font-bold text-foreground">{taskStats.total}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-card border-border">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Completed</p>
                                        <p className="text-2xl font-bold text-foreground">{taskStats.completed}</p>
                                        <p className="text-xs text-green-500">{completionRate}% rate</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-card border-border">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                                        <AlertCircle className="w-5 h-5 text-red-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Overdue</p>
                                        <p className="text-2xl font-bold text-foreground">{taskStats.overdue}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-card border-border">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                        <Clock className="w-5 h-5 text-purple-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Avg Completion</p>
                                        <p className="text-2xl font-bold text-foreground">{avgCompletionTime}h</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Task Status Breakdown */}
                    <Card className="bg-card border-border">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                                <PieChart className="w-5 h-5 text-coin-500" />
                                Task Status Distribution
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                                {[
                                    { label: 'Completed', value: taskStats.completed, color: 'bg-green-500' },
                                    { label: 'Pending', value: taskStats.pending, color: 'bg-yellow-500' },
                                    { label: 'In Progress', value: taskStats.in_progress, color: 'bg-purple-500' },
                                    { label: 'Overdue', value: taskStats.overdue, color: 'bg-red-500' },
                                    { label: 'Cancelled', value: taskStats.cancelled, color: 'bg-gray-500' },
                                ].map((item) => (
                                    <div key={item.label} className="text-center p-4 bg-muted rounded-lg border border-border">
                                        <div className={`w-3 h-3 rounded-full ${item.color} mx-auto mb-2`} />
                                        <p className="text-2xl font-bold text-foreground">{item.value}</p>
                                        <p className="text-xs text-muted-foreground">{item.label}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tasks Tab */}
                <TabsContent value="tasks" className="space-y-6">
                    {/* Priority & Category Stats */}
                    <div className="grid lg:grid-cols-2 gap-6">
                        <Card className="bg-card border-border">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5 text-coin-500" />
                                    Tasks by Priority
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {Object.keys(priorityStats).length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No data available
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {Object.entries(priorityStats).map(([priority, count]) => {
                                            const maxCount = Math.max(...Object.values(priorityStats));
                                            const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;

                                            return (
                                                <div key={priority} className="flex items-center gap-3">
                                                    <span className="text-sm text-muted-foreground w-20 capitalize">{priority}</span>
                                                    <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className={cn("h-full bg-gradient-to-r rounded-full", getPriorityColor(priority))}
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-sm font-medium text-foreground w-8 text-right">{count}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="bg-card border-border">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-coin-500" />
                                    Tasks by Category
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {Object.keys(categoryStats).length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No data available
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {Object.entries(categoryStats).map(([category, count], idx) => {
                                            const maxCount = Math.max(...Object.values(categoryStats));
                                            const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                                            const colors = [
                                                'from-blue-600 to-blue-500',
                                                'from-green-600 to-green-500',
                                                'from-purple-600 to-purple-500',
                                                'from-orange-600 to-orange-500',
                                            ];
                                            const colorClass = colors[idx % colors.length];

                                            return (
                                                <div key={category} className="flex items-center gap-3">
                                                    <span className="text-sm text-muted-foreground w-24 truncate capitalize">
                                                        {category.replace('_', ' ')}
                                                    </span>
                                                    <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className={cn("h-full bg-gradient-to-r rounded-full", colorClass)}
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-sm font-medium text-foreground w-8 text-right">{count}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Monthly Task Trend & Top Performers */}
                    <div className="grid lg:grid-cols-2 gap-6">
                        <Card className="bg-card border-border">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-coin-500" />
                                    Monthly Task Trend
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {monthlyTaskStats.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No data available
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {monthlyTaskStats.map((stat) => {
                                            const maxCount = Math.max(...monthlyTaskStats.map(m => m.count));
                                            const percentage = maxCount > 0 ? (stat.count / maxCount) * 100 : 0;

                                            return (
                                                <div key={stat.month} className="flex items-center gap-3">
                                                    <span className="text-sm text-muted-foreground w-16">{stat.month}</span>
                                                    <div className="flex-1 h-8 bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-coin-600 to-coin-500 rounded-full"
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-sm font-medium text-foreground w-10 text-right">{stat.count}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="bg-card border-border">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                                    <Users className="w-5 h-5 text-coin-500" />
                                    Top Performers
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {topPerformers.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No completed tasks yet
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {topPerformers.map((performer, idx) => (
                                            <div key={performer.name} className="flex items-center gap-3 p-3 bg-muted rounded-lg border border-border">
                                                <div className="w-8 h-8 rounded-full bg-coin-600 text-white flex items-center justify-center text-sm font-bold">
                                                    {idx + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium text-foreground">{performer.name}</p>
                                                </div>
                                                <Badge variant="outline" className="border-coin-500/30 text-coin-500">
                                                    {performer.count} tasks
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Visitors Tab */}
                <TabsContent value="visitors" className="space-y-6">
                    {/* Visitor Stats */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="bg-card border-border">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                        <Users className="w-5 h-5 text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total This Year</p>
                                        <p className="text-2xl font-bold text-foreground">{totalVisitors}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-card border-border">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                                        <TrendingUp className="w-5 h-5 text-green-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Avg Monthly</p>
                                        <p className="text-2xl font-bold text-foreground">{avgMonthlyVisitors}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-card border-border">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                        <Calendar className="w-5 h-5 text-purple-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Peak Month</p>
                                        <p className="text-lg font-bold text-foreground">
                                            {monthlyStats.length > 0
                                                ? monthlyStats.reduce((max, m) => m.count > max.count ? m : max, monthlyStats[0])?.month || '-'
                                                : '-'}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-card border-border">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                                        <FileText className="w-5 h-5 text-orange-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Top Purpose</p>
                                        <p className="text-lg font-bold text-foreground truncate">
                                            {purposeStats.length > 0
                                                ? purposeStats.reduce((max, p) => p.count > max.count ? p : max, purposeStats[0])?.purpose || '-'
                                                : '-'}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Visitor Charts */}
                    <div className="grid lg:grid-cols-2 gap-6">
                        {/* Monthly Trend */}
                        <Card className="bg-card border-border">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-coin-500" />
                                    Monthly Visitor Trend
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {monthlyStats.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No data available
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {monthlyStats.map((stat) => {
                                            const maxCount = Math.max(...monthlyStats.map(m => m.count));
                                            const percentage = maxCount > 0 ? (stat.count / maxCount) * 100 : 0;

                                            return (
                                                <div key={stat.month} className="flex items-center gap-3">
                                                    <span className="text-sm text-muted-foreground w-16">{stat.month}</span>
                                                    <div className="flex-1 h-8 bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-coin-600 to-coin-500 rounded-full"
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-sm font-medium text-foreground w-10 text-right">{stat.count}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Purpose Breakdown */}
                        <Card className="bg-card border-border">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                                    <Users className="w-5 h-5 text-coin-500" />
                                    Visit Purpose Breakdown
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {purposeStats.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
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
                                                    <span className="text-sm text-muted-foreground w-24 truncate">{stat.purpose}</span>
                                                    <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className={cn("h-full bg-gradient-to-r rounded-full", colorClass)}
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-sm font-medium text-foreground w-8 text-right">{stat.count}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </AuthenticatedLayout>
    );
}
