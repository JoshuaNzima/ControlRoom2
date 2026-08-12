import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import {
    Wallet,
    Plus,
    Search,
    CheckCircle,
    XCircle,
    Trash2,
    TrendingDown,
    TrendingUp,
    Calendar,
    Receipt,
    Store,
    RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Badge } from '@/Components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/Components/ui/dialog';
import { Label } from '@/Components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { cn } from '@/lib/utils';

interface PettyCashProps {
    entries: {
        data: Array<{
            id: number;
            date: string;
            description: string;
            category: string;
            category_label: string;
            amount: number;
            receipt_number: string | null;
            vendor: string | null;
            type: 'expense' | 'replenishment';
            status: 'pending' | 'approved' | 'rejected';
            user: { name: string };
            approver?: { name: string } | null;
            approved_at?: string | null;
            notes?: string | null;
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
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isSyncOpen, setIsSyncOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        description: '',
        category: 'office_supplies',
        amount: '',
        receipt_number: '',
        vendor: '',
        type: 'expense' as 'expense' | 'replenishment',
        notes: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.post(route('executive.petty-cash.store'), formData, {
            onSuccess: () => {
                setIsAddOpen(false);
                setFormData({
                    date: new Date().toISOString().split('T')[0],
                    description: '',
                    category: 'office_supplies',
                    amount: '',
                    receipt_number: '',
                    vendor: '',
                    type: 'expense',
                    notes: '',
                });
            },
        });
    };

    const handleApprove = (id: number) => {
        if (confirm('Approve this entry?')) {
            router.post(route('executive.petty-cash.approve', id));
        }
    };

    const handleReject = (id: number) => {
        if (confirm('Reject this entry?')) {
            router.post(route('executive.petty-cash.reject', id));
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('Delete this entry?')) {
            router.delete(route('executive.petty-cash.destroy', id));
        }
    };

    const handleSyncToFinance = () => {
        if (confirm(`Sync ${stats.pending_sync_amount.toLocaleString()} to Finance?`)) {
            router.post(route('executive.petty-cash.sync-to-finance'), { sync_all: true });
        }
    };

    const filteredEntries = entries.data.filter(e =>
        e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.vendor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.receipt_number?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-MW', { style: 'currency', currency: 'MWK' }).format(amount);
    };

    const getStatusBadge = (status: string, synced: boolean = false) => {
        if (status === 'approved' && !synced) {
            return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
        }
        switch (status) {
            case 'approved':
                return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'rejected':
                return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            default:
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
        }
    };

    return (
        <AuthenticatedLayout header="Petty Cash Management">
            <Head title="Petty Cash" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <Wallet className="w-6 h-6 text-red-500" />
                        Petty Cash Management
                    </h1>
                    <p className="text-muted-foreground mt-1">Track office expenses and petty cash replenishments</p>
                </div>
                <div className="flex gap-2">
                    {stats.pending_sync_amount > 0 && (
                        <Button
                            variant="outline"
                            onClick={handleSyncToFinance}
                            className="border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Sync to Finance ({formatCurrency(stats.pending_sync_amount)})
                        </Button>
                    )}
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-red-600 hover:bg-red-700 text-white">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Entry
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-background border-border text-foreground max-w-md">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <Wallet className="w-5 h-5 text-red-500" />
                                    Add Petty Cash Entry
                                </DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="type">Type</Label>
                                        <Select
                                            value={formData.type}
                                            onValueChange={(v) => setFormData({ ...formData, type: v as 'expense' | 'replenishment' })}
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
                                        <Label htmlFor="date">Date</Label>
                                        <Input
                                            id="date"
                                            type="date"
                                            value={formData.date}
                                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                                            className="bg-muted border-border text-foreground"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description *</Label>
                                    <Input
                                        id="description"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="bg-muted border-border text-foreground"
                                        required
                                    />
                                </div>
                                {formData.type === 'expense' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="category">Category</Label>
                                        <Select
                                            value={formData.category}
                                            onValueChange={(v) => setFormData({ ...formData, category: v })}
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
                                )}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="amount">Amount (MWK) *</Label>
                                        <Input
                                            id="amount"
                                            type="number"
                                            step="0.01"
                                            min="0.01"
                                            value={formData.amount}
                                            onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                            className="bg-muted border-border text-foreground"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="receipt_number">Receipt #</Label>
                                        <Input
                                            id="receipt_number"
                                            value={formData.receipt_number}
                                            onChange={e => setFormData({ ...formData, receipt_number: e.target.value })}
                                            className="bg-muted border-border text-foreground"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="vendor">Vendor/Supplier</Label>
                                    <Input
                                        id="vendor"
                                        value={formData.vendor}
                                        onChange={e => setFormData({ ...formData, vendor: e.target.value })}
                                        className="bg-muted border-border text-foreground"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="notes">Notes</Label>
                                    <Input
                                        id="notes"
                                        value={formData.notes}
                                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                        className="bg-muted border-border text-foreground"
                                    />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} className="flex-1">
                                        Cancel
                                    </Button>
                                    <Button type="submit" className="flex-1 bg-red-600 hover:bg-red-700">
                                        Save Entry
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Balance Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <Card className="bg-card border-border">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Current Balance</p>
                                <p className={cn(
                                    "text-2xl font-bold",
                                    stats.current_balance >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                                )}>
                                    {formatCurrency(stats.current_balance)}
                                </p>
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                                <Wallet className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card border-border">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Monthly Spent</p>
                                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(stats.monthly_expenses)}</p>
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                                <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card border-border">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Monthly Replenished</p>
                                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(stats.monthly_replenishments)}</p>
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card border-border">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Pending Approval</p>
                                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{formatCurrency(stats.pending_amount)}</p>
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card border-border">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Pending Sync</p>
                                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(stats.pending_sync_amount)}</p>
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <RefreshCw className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search entries..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-10 bg-card border-border text-foreground"
                    />
                </div>
            </div>

            {/* Entries List */}
            <Card className="bg-card border-border">
                <CardContent className="p-0">
                    {/* Mobile View */}
                    <div className="lg:hidden divide-y divide-border">
                        {filteredEntries.length === 0 ? (
                            <div className="p-6 text-center text-muted-foreground">
                                No entries found
                            </div>
                        ) : (
                            filteredEntries.map((entry) => (
                                <div key={entry.id} className="p-4 space-y-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-10 h-10 rounded-lg flex items-center justify-center",
                                                entry.type === 'expense' ? "bg-red-500/10" : "bg-green-500/10"
                                            )}>
                                                {entry.type === 'expense' ? (
                                                    <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                                                ) : (
                                                    <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium text-foreground">{entry.description}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {new Date(entry.date).toLocaleDateString()} • {entry.category_label}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge className={getStatusBadge(entry.status, entry.synced_to_finance)}>
                                            {entry.status === 'approved' && !entry.synced_to_finance ? 'Approved (Unsynced)' : entry.status}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <p className={cn(
                                            "text-lg font-bold",
                                            entry.type === 'expense' ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
                                        )}>
                                            {entry.type === 'expense' ? '-' : '+'}{formatCurrency(entry.amount)}
                                        </p>
                                        <div className="flex gap-2">
                                            {entry.status === 'pending' && (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleApprove(entry.id)}
                                                        className="border-green-500/30 text-green-600 dark:text-green-400 hover:bg-green-500/10"
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleReject(entry.id)}
                                                        className="border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                    </Button>
                                                </>
                                            )}
                                            {entry.status === 'pending' && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleDelete(entry.id)}
                                                    className="border-border text-muted-foreground hover:bg-muted"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                    {entry.vendor && (
                                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                                            <Store className="w-3 h-3" />
                                            {entry.vendor}
                                        </p>
                                    )}
                                    {entry.receipt_number && (
                                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                                            <Receipt className="w-3 h-3" />
                                            Receipt: {entry.receipt_number}
                                        </p>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {/* Desktop View */}
                    <div className="hidden lg:block">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Date</th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Description</th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Category</th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Amount</th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredEntries.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-6 text-center text-muted-foreground">
                                            No entries found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredEntries.map((entry) => (
                                        <tr key={entry.id} className="hover:bg-muted/50">
                                            <td className="p-4 text-sm text-muted-foreground">
                                                {new Date(entry.date).toLocaleDateString()}
                                            </td>
                                            <td className="p-4">
                                                <div>
                                                    <p className="font-medium text-foreground">{entry.description}</p>
                                                    {entry.vendor && (
                                                        <p className="text-sm text-muted-foreground">{entry.vendor}</p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm text-muted-foreground">
                                                {entry.category_label}
                                            </td>
                                            <td className="p-4">
                                                <span className={cn(
                                                    "font-bold",
                                                    entry.type === 'expense' ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
                                                )}>
                                                    {entry.type === 'expense' ? '-' : '+'}{formatCurrency(entry.amount)}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <Badge className={getStatusBadge(entry.status, entry.synced_to_finance)}>
                                                    {entry.status === 'approved' && !entry.synced_to_finance ? 'Approved (Unsynced)' : entry.status}
                                                </Badge>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {entry.status === 'pending' && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleApprove(entry.id)}
                                                                className="border-green-500/30 text-green-600 dark:text-green-400 hover:bg-green-500/10"
                                                            >
                                                                <CheckCircle className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleReject(entry.id)}
                                                                className="border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10"
                                                            >
                                                                <XCircle className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleDelete(entry.id)}
                                                                className="border-border text-muted-foreground hover:bg-muted"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </AuthenticatedLayout>
    );
}
