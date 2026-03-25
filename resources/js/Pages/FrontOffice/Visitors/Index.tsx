import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import FrontOfficeLayout from '@/Layouts/FrontOfficeLayout';
import {
    Users,
    Plus,
    Search,
    Filter,
    Printer,
    BadgeCheck,
    Calendar,
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
import { cn } from '@/lib/utils';

interface VisitorsProps {
    visitors: {
        data: Array<{
            id: number;
            name: string;
            company: string | null;
            phone: string | null;
            email: string | null;
            purpose: string;
            host?: { name: string } | null;
            host_name: string | null;
            badge_number: string | null;
            notes: string | null;
            created_at: string;
            users: Array<{
                id: number;
                name: string;
            }>;
        }>;
        meta: { total: number };
    };
    stats: {
        today: number;
        checked_in: number;
        checked_out: number;
    };
    filters: {
        date?: string;
        status?: string;
    };
}

export default function VisitorsIndex({ visitors, stats, filters }: VisitorsProps) {
    const [isRegisterOpen, setIsRegisterOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        company: '',
        phone: '',
        email: '',
        purpose: '',
        host_name: '',
        notes: '',
    });

    const handleRegister = (e: React.FormEvent) => {
        e.preventDefault();
        router.post(route('front-office.visitors.store'), formData, {
            onSuccess: () => {
                setIsRegisterOpen(false);
                setFormData({ name: '', company: '', phone: '', email: '', purpose: '', host_name: '', notes: '' });
            },
        });
    };

    const handleBadge = (id: number) => {
        router.put(route('front-office.visitors.badge', id));
    };

    const filteredVisitors = visitors.data.filter(v =>
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.purpose.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <FrontOfficeLayout>
            <Head title="Visitor Management" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Users className="w-6 h-6 text-red-400" />
                        Visitor Management
                    </h1>
                    <p className="text-gray-500 mt-1">Register and manage visitors</p>
                </div>
                <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-red-600 hover:bg-red-700 text-white">
                            <Plus className="w-4 h-4 mr-2" />
                            Register Visitor
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#111111] border-[#222222] text-white max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-red-400" />
                                Register New Visitor
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleRegister} className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="bg-[#1a1a1a] border-[#333333] text-white"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="company">Company</Label>
                                <Input
                                    id="company"
                                    value={formData.company}
                                    onChange={e => setFormData({ ...formData, company: e.target.value })}
                                    className="bg-[#1a1a1a] border-[#333333] text-white"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input
                                        id="phone"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className="bg-[#1a1a1a] border-[#333333] text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="bg-[#1a1a1a] border-[#333333] text-white"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="purpose">Purpose of Visit *</Label>
                                <Input
                                    id="purpose"
                                    value={formData.purpose}
                                    onChange={e => setFormData({ ...formData, purpose: e.target.value })}
                                    className="bg-[#1a1a1a] border-[#333333] text-white"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="host_name">Host Name</Label>
                                <Input
                                    id="host_name"
                                    value={formData.host_name}
                                    onChange={e => setFormData({ ...formData, host_name: e.target.value })}
                                    className="bg-[#1a1a1a] border-[#333333] text-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes</Label>
                                <Input
                                    id="notes"
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    className="bg-[#1a1a1a] border-[#333333] text-white"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <Button type="button" variant="outline" onClick={() => setIsRegisterOpen(false)} className="flex-1">
                                    Cancel
                                </Button>
                                <Button type="submit" className="flex-1 bg-red-600 hover:bg-red-700">
                                    Register
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <Card className="bg-[#111111] border-[#222222]">
                    <CardContent className="p-4">
                        <p className="text-sm text-gray-500">Total Today</p>
                        <p className="text-2xl font-bold text-white">{stats.today}</p>
                    </CardContent>
                </Card>
                <Card className="bg-[#111111] border-[#222222]">
                    <CardContent className="p-4">
                        <p className="text-sm text-gray-500">Visitors</p>
                        <p className="text-2xl font-bold text-green-400">{stats.checked_in}</p>
                    </CardContent>
                </Card>
                <Card className="bg-[#111111] border-[#222222]">
                    <CardContent className="p-4">
                        <p className="text-sm text-gray-500">Total Records</p>
                        <p className="text-2xl font-bold text-gray-400">{(visitors as any)?.meta?.total ?? 0}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <Input
                        placeholder="Search visitors..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-10 bg-[#111111] border-[#222222] text-white"
                    />
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="border-[#222222] text-gray-400">
                        <Filter className="w-4 h-4 mr-2" />
                        Filter
                    </Button>
                    <Button variant="outline" size="sm" className="border-[#222222] text-gray-400">
                        <Calendar className="w-4 h-4 mr-2" />
                        {filters.date || 'Today'}
                    </Button>
                </div>
            </div>

            {/* Visitors List */}
            <Card className="bg-[#111111] border-[#222222]">
                <CardContent className="p-0">
                    {/* Mobile View */}
                    <div className="lg:hidden divide-y divide-[#222222]">
                        {filteredVisitors.length === 0 ? (
                            <div className="p-6 text-center text-gray-500">
                                No visitors found
                            </div>
                        ) : (
                            filteredVisitors.map((visitor) => (
                                <div key={visitor.id} className="p-4 space-y-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500/20 to-red-600/10 flex items-center justify-center">
                                                <span className="text-red-400 font-medium">
                                                    {visitor.name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-medium text-white">{visitor.name}</p>
                                                <p className="text-sm text-gray-500">{visitor.company || 'No company'}</p>
                                            </div>
                                        </div>
                                        {visitor.badge_number && (
                                            <Badge variant="outline" className="border-[#333333] text-gray-400">
                                                {visitor.badge_number}
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <Calendar className="w-4 h-4" />
                                        {new Date(visitor.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <p className="text-sm text-gray-400">{visitor.purpose}</p>
                                    {visitor.host_name && (
                                        <p className="text-sm text-gray-500">Host: {visitor.host_name}</p>
                                    )}
                                    <div className="flex gap-3 pt-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleBadge(visitor.id)}
                                            className="border-[#333333] text-gray-400"
                                        >
                                            <BadgeCheck className="w-4 h-4 mr-1" />
                                            New Badge
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Desktop View */}
                    <div className="hidden lg:block">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[#222222]">
                                    <th className="text-left p-4 text-sm font-medium text-gray-400">Visitor</th>
                                    <th className="text-left p-4 text-sm font-medium text-gray-400">Purpose</th>
                                    <th className="text-left p-4 text-sm font-medium text-gray-400">Host</th>
                                    <th className="text-left p-4 text-sm font-medium text-gray-400">Registered</th>
                                    <th className="text-left p-4 text-sm font-medium text-gray-400">Badge</th>
                                    <th className="text-right p-4 text-sm font-medium text-gray-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#222222]">
                                {filteredVisitors.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-6 text-center text-gray-500">
                                            No visitors found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredVisitors.map((visitor) => (
                                        <tr key={visitor.id} className="hover:bg-[#1a1a1a]/50">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500/20 to-red-600/10 flex items-center justify-center">
                                                        <span className="text-red-400 font-medium">
                                                            {visitor.name.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-white">{visitor.name}</p>
                                                        <p className="text-sm text-gray-500">{visitor.company || '-'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm text-gray-300">{visitor.purpose}</td>
                                            <td className="p-4 text-sm text-gray-300">
                                                {visitor.host?.name || visitor.host_name || '-'}
                                            </td>
                                            <td className="p-4 text-sm text-gray-400">
                                                {new Date(visitor.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="p-4">
                                                {visitor.badge_number && (
                                                    <Badge variant="outline" className="border-[#333333] text-gray-400">
                                                        {visitor.badge_number}
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleBadge(visitor.id)}
                                                        className="border-[#333333] text-gray-400"
                                                    >
                                                        <BadgeCheck className="w-4 h-4" />
                                                    </Button>
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
        </FrontOfficeLayout>
    );
}
