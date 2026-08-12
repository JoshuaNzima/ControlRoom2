import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import QuickRequisitionButton from '@/Components/Requisitions/FrontOfficeRequisitionButton';
import {
    ShoppingCart,
    Search,
    CheckCircle,
    Clock,
    FileText,
    DollarSign,
    User,
    Calendar,
    ChevronRight,
} from 'lucide-react';
import { Card, CardContent } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Badge } from '@/Components/ui/badge';
import { cn } from '@/lib/utils';

interface RequisitionsProps {
    requisitions: {
        data: Array<{
            id: number;
            requisition_number: string;
            title: string;
            description: string | null;
            status: 'draft' | 'pending' | 'approved' | 'rejected' | 'disbursed';
            priority: 'low' | 'medium' | 'high' | 'urgent';
            total_amount: number;
            currency: string;
            requested_by: { name: string };
            approved_by?: { name: string } | null;
            created_at: string;
            items_count: number;
        }>;
        meta: { total: number };
    };
    stats: {
        total: number;
        pending: number;
        approved: number;
        disbursed: number;
        total_amount: number;
    };
    filters: {
        status?: string;
        priority?: string;
        search?: string;
    };
    can: {
        create: boolean;
        approve: boolean;
        manage_all: boolean;
    };
}

export default function RequisitionsIndex({ requisitions, stats, filters, can }: RequisitionsProps) {
    const [searchQuery, setSearchQuery] = useState(filters.search || '');

    const filteredRequisitions = requisitions.data.filter(r =>
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.requisition_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.requested_by.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatCurrency = (amount: number, currency: string) => {
        // Use simple formatting since MWK/ZAR may not be supported by all browsers
        const formatted = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
        return `${currency} ${formatted}`;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'disbursed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'approved': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'bg-red-500/10 text-red-400 border-red-500/20';
            case 'high': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
            case 'medium': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
            default: return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
        }
    };

    return (
        <AuthenticatedLayout header="Requisitions">
            <Head title="Requisitions" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <ShoppingCart className="w-6 h-6 text-coin-500" />
                        Requisitions
                    </h1>
                    <p className="text-muted-foreground mt-1">Request office supplies, equipment, and services</p>
                </div>
                {can.create && (
                    <QuickRequisitionButton className="bg-coin-600 hover:bg-coin-700 shadow-lg shadow-coin-600/20" />
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <Card className="bg-card border-border">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total</p>
                                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-blue-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card border-border">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Pending</p>
                                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</p>
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                                <Clock className="w-5 h-5 text-yellow-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card border-border">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Approved</p>
                                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.approved}</p>
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <CheckCircle className="w-5 h-5 text-blue-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card border-border">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Disbursed</p>
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.disbursed}</p>
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                                <DollarSign className="w-5 h-5 text-green-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card border-border col-span-2 lg:col-span-1">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Value</p>
                                <p className="text-lg font-bold text-foreground">{formatCurrency(stats.total_amount, 'MWK')}</p>
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                <DollarSign className="w-5 h-5 text-purple-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search requisitions..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-10 bg-card border-border text-foreground"
                    />
                </div>
            </div>

            {/* Requisitions List */}
            <Card className="bg-card border-border">
                <CardContent className="p-0">
                    <div className="divide-y divide-border">
                        {filteredRequisitions.length === 0 ? (
                            <div className="p-6 text-center text-muted-foreground">
                                No requisitions found
                            </div>
                        ) : (
                            filteredRequisitions.map((req) => (
                                <div
                                    key={req.id}
                                    className="p-4 lg:p-6 hover:bg-muted/50 transition-colors cursor-pointer"
                                    onClick={() => router.get(route('front-office.requisitions.show', req.id))}
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                <span className="text-sm text-muted-foreground font-mono">#{req.requisition_number}</span>
                                                <Badge className={cn("border", getPriorityColor(req.priority))}>
                                                    {req.priority}
                                                </Badge>
                                                <Badge className={getStatusColor(req.status)}>
                                                    {req.status}
                                                </Badge>
                                            </div>
                                            <h3 className="font-medium text-foreground text-lg">{req.title}</h3>
                                            {req.description && (
                                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{req.description}</p>
                                            )}
                                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-3">
                                                <span className="flex items-center gap-1">
                                                    <User className="w-4 h-4" />
                                                    {req.requested_by.name}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    {new Date(req.created_at).toLocaleDateString()}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <ShoppingCart className="w-4 h-4" />
                                                    {req.items_count} items
                                                </span>
                                                <span className="font-medium text-foreground">
                                                    {formatCurrency(req.total_amount, req.currency)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </AuthenticatedLayout>
    );
}
