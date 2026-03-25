import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import FrontOfficeLayout from '@/Layouts/FrontOfficeLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Badge } from '@/Components/ui/badge';
import {
    Wallet,
    Plus,
    Search,
    ArrowUpCircle,
    ArrowDownCircle,
    CheckCircle,
    Clock,
    AlertCircle,
    FileText,
    TrendingUp,
    TrendingDown,
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/Components/ui/dialog';
import { Label } from '@/Components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import { cn } from '@/lib/utils';

interface PettyCashProps {
    entries: {
        data: Array<{
            id: number;
            date: string;
            description: string;
            category: string;
            amount: number;
            type: 'expense' | 'replenishment';
            status: 'pending' | 'approved' | 'rejected';
            receipt_number: string | null;
            vendor: string | null;
            notes: string | null;
            user: { name: string };
            approver?: { name: string } | null;
            synced_to_finance: boolean;
        }>;
        meta: { total: number };
    };
    stats: {
        current_balance: number;
        pending_amount: number;
        monthly_expenses: number;
        monthly_replenishments: number;
        pending_sync_amount: number;
    };
    filters: {
        category?: string;
        type?: string;
        status?: string;
        date_from?: string;
        date_to?: string;
        search?: string;
    };
    categories: Record<string, string>;
}

export default function PettyCashIndex({ entries, stats, filters, categories }: PettyCashProps) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        description: '',
        category: 'office_supplies',
        amount: '',
        type: 'expense',
        receipt_number: '',
        vendor: '',
        notes: '',
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        router.post(route('executive.petty-cash.store'), formData, {
            onSuccess: () => {
                setIsCreateOpen(false);
                setFormData({
                    date: new Date().toISOString().split('T')[0],
                    description: '',
                    category: 'office_supplies',
                    amount: '',
                    type: 'expense',
                    receipt_number: '',
                    vendor: '',
                    notes: '',
                });
            },
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-MW', { style: 'currency', currency: 'MWK' }).format(amount);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
        }
    };

    const getTypeIcon = (type: string) => {
        return type === 'expense' ? 
            <TrendingDown className="w-4 h-4 text-red-500" /> : 
            <TrendingUp className="w-4 h-4 text-green-500" />;
    };

    return (
        <FrontOfficeLayout title="Petty Cash">
            <Head title="Petty Cash" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <Wallet className="w-6 h-6 text-red-500" />
                        Petty Cash
                    </h1>
                    <p className="text-muted-foreground mt-1">Manage petty cash expenses and replenishments</p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-red-600 hover:bg-red-700 text-white">
                            <Plus className="w-4 h-4 mr-2" />
                            New Entry
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-background border-border text-foreground max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Wallet className="w-5 h-5 text-red-500" />
                                Add Petty Cash Entry
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreate} className="space-y-4 mt-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label>Type</Label>
                                    <Select
                                        value={formData.type}
                                        onValueChange={v => setFormData({ ...formData, type: v })}
                                    >
                                        <SelectTrigger className="bg-muted border-border text-foreground">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="expense">Expense</SelectItem>
                                            <SelectItem value="replenishment">Replenishment</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Date</Label>
                                    <Input
                                        type="date"
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                        className="bg-muted border-border text-foreground"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Description *</Label>
                                <Input
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="bg-muted border-border text-foreground"
                                    placeholder="e.g., Office stationery purchase"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Category</Label>
                                <Select
                                    value={formData.category}
                                    onValueChange={v => setFormData({ ...formData, category: v })}
                                >
                                    <SelectTrigger className="bg-muted border-border text-foreground">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(categories).map(([key, label]) => (
                                            <SelectItem key={key} value={key}>{label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Amount (MWK) *</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.amount}
                                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                    className="bg-muted border-border text-foreground"
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Vendor/Supplier</Label>
                                <Input
                                    value={formData.vendor}
                                    onChange={e => setFormData({ ...formData, vendor: e.target.value })}
                                    className="bg-muted border-border text-foreground"
                                    placeholder="Vendor name (optional)"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Receipt Number</Label>
                                <Input
                                    value={formData.receipt_number}
                                    onChange={e => setFormData({ ...formData, receipt_number: e.target.value })}
                                    className="bg-muted border-border text-foreground"
                                    placeholder="Receipt # (optional)"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Notes</Label>
                                <Input
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    className="bg-muted border-border text-foreground"
                                    placeholder="Additional notes..."
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="flex-1">
                                    Cancel
                                </Button>
                                <Button type="submit" className="flex-1 bg-red-600 hover:bg-red-700">
                                    Add Entry
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <Card className="bg-card border-border">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Current Balance</p>
                                <p className={cn("text-2xl font-bold", stats.current_balance >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                                    {formatCurrency(stats.current_balance)}
                                </p>
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                                <Wallet className="w-5 h-5 text-green-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card border-border">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Pending</p>
                                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{formatCurrency(stats.pending_amount)}</p>
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
                                <p className="text-sm text-muted-foreground">Monthly Expenses</p>
                                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(stats.monthly_expenses)}</p>
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                                <ArrowDownCircle className="w-5 h-5 text-red-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card border-border">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Replenishments</p>
                                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(stats.monthly_replenishments)}</p>
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <ArrowUpCircle className="w-5 h-5 text-blue-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card border-border col-span-2 lg:col-span-1">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Pending Sync</p>
                                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{formatCurrency(stats.pending_sync_amount)}</p>
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                <AlertCircle className="w-5 h-5 text-purple-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Entries List */}
            <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <CardTitle className="text-lg">Transactions</CardTitle>
                        <div className="relative w-full sm:w-64">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search entries..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="pl-10 bg-muted border-border text-foreground"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-border">
                        {entries.data.length === 0 ? (
                            <div className="p-6 text-center text-muted-foreground">
                                No transactions found
                            </div>
                        ) : (
                            entries.data.map((entry) => (
                                <div key={entry.id} className="p-4 hover:bg-muted/50 transition-colors">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                {getTypeIcon(entry.type)}
                                                <span className="font-medium text-foreground">{entry.description}</span>
                                                <Badge className={cn("border", getStatusColor(entry.status))}>
                                                    {entry.status}
                                                </Badge>
                                                {entry.synced_to_finance && (
                                                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                                        Synced
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                                <span>{new Date(entry.date).toLocaleDateString()}</span>
                                                <span className="text-foreground font-medium">
                                                    {formatCurrency(entry.amount)}
                                                </span>
                                                <span>• {categories[entry.category] || entry.category}</span>
                                                <span>• {entry.user.name}</span>
                                                {entry.vendor && <span>• {entry.vendor}</span>}
                                                {entry.receipt_number && <span>• Receipt: {entry.receipt_number}</span>}
                                            </div>
                                            {entry.notes && (
                                                <p className="text-sm text-muted-foreground mt-1">{entry.notes}</p>
                                            )}
                                        </div>
                                        {entry.status === 'pending' && (
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-green-600 border-green-600 hover:bg-green-50"
                                                    onClick={() => router.post(route('executive.petty-cash.approve', entry.id))}
                                                >
                                                    <CheckCircle className="w-4 h-4 mr-1" />
                                                    Approve
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-red-600 border-red-600 hover:bg-red-50"
                                                    onClick={() => router.post(route('executive.petty-cash.reject', entry.id))}
                                                >
                                                    Reject
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </FrontOfficeLayout>
    );
}
