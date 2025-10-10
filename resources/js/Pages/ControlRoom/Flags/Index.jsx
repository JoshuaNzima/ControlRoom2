import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent, CardHeader } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import { Badge } from '@/Components/ui/badge';
import { Dialog, DialogTrigger } from '@/Components/ui/dialog';
import CreateFlagForm from './CreateFlagForm';

const FlagList = ({ flags, statuses }) => {
    const [filterStatus, setFilterStatus] = useState('');
    const [filterType, setFilterType] = useState('');
    const [showCreateDialog, setShowCreateDialog] = useState(false);

    const statusColors = {
        pending_review: 'bg-yellow-100 text-yellow-800',
        under_review: 'bg-blue-100 text-blue-800',
        resolved: 'bg-green-100 text-green-800',
        dismissed: 'bg-gray-100 text-gray-800',
    };

    const handleFilterChange = (type, value) => {
        router.get(route('control-room.flags.index'), {
            [type]: value,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const getFlaggableName = (flag) => {
        if (!flag.flaggable) return 'Unknown';
        return flag.flaggable.name || `Guard #${flag.flaggable.id}`;
    };

    return (
        <AppLayout>
            <Head title="Review Flags" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-semibold text-gray-900">Review Flags</h2>
                        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                            <DialogTrigger asChild>
                                <Button>Create Flag</Button>
                            </DialogTrigger>
                            <CreateFlagForm onClose={() => setShowCreateDialog(false)} />
                        </Dialog>
                    </div>

                    <Card>
                        <CardHeader>
                            <div className="flex gap-4">
                                <Select value={filterStatus} onValueChange={(value) => handleFilterChange('status', value)}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Filter by status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All Statuses</SelectItem>
                                        {statuses.map((status) => (
                                            <SelectItem key={status} value={status}>
                                                {status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select value={filterType} onValueChange={(value) => handleFilterChange('type', value)}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Filter by type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All Types</SelectItem>
                                        <SelectItem value="guard">Guards</SelectItem>
                                        <SelectItem value="user">Users</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Flagged Item</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Reason</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Reporter</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {flags.data.map((flag) => (
                                        <TableRow key={flag.id}>
                                            <TableCell>#{flag.id}</TableCell>
                                            <TableCell>{getFlaggableName(flag)}</TableCell>
                                            <TableCell>
                                                {flag.flaggable_type.includes('Guard') ? 'Guard' : 'User'}
                                            </TableCell>
                                            <TableCell>{flag.reason}</TableCell>
                                            <TableCell>
                                                <Badge className={statusColors[flag.status]}>
                                                    {flag.status.replace('_', ' ')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{flag.reporter.name}</TableCell>
                                            <TableCell>{new Date(flag.created_at).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => router.visit(route('control-room.flags.show', flag.id))}
                                                >
                                                    View
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
};

export default FlagList;