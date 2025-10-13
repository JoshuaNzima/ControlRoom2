import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import ControlRoomLayout from '@/Layouts/ControlRoomLayout';
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
import CreateTicketForm from './CreateTicketForm';

const TicketList = ({ tickets, filters }) => {
    const [filterStatus, setFilterStatus] = useState('');
    const [filterPriority, setFilterPriority] = useState('');
    const [showCreateDialog, setShowCreateDialog] = useState(false);

    const statusColors = {
        open: 'bg-blue-100 text-blue-800',
        in_progress: 'bg-yellow-100 text-yellow-800',
        pending: 'bg-orange-100 text-orange-800',
        resolved: 'bg-green-100 text-green-800',
        closed: 'bg-gray-100 text-gray-800',
        escalated: 'bg-red-100 text-red-800',
    };

    const priorityColors = {
        low: 'bg-gray-100 text-gray-800',
        medium: 'bg-yellow-100 text-yellow-800',
        high: 'bg-orange-100 text-orange-800',
        critical: 'bg-red-100 text-red-800',
    };

    const handleFilterChange = (type, value) => {
        router.get(route('control-room.tickets.index'), {
            [type]: value,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
    <ControlRoomLayout>
            <Head title="Tickets" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-semibold text-gray-900">Tickets</h2>
                        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                            <DialogTrigger asChild>
                                <Button>Create Ticket</Button>
                            </DialogTrigger>
                            <CreateTicketForm onClose={() => setShowCreateDialog(false)} />
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
                                        {filters.statuses.map((status) => (
                                            <SelectItem key={status} value={status}>
                                                {status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select value={filterPriority} onValueChange={(value) => handleFilterChange('priority', value)}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Filter by priority" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All Priorities</SelectItem>
                                        {filters.priorities.map((priority) => (
                                            <SelectItem key={priority} value={priority}>
                                                {priority.charAt(0).toUpperCase() + priority.slice(1)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Priority</TableHead>
                                        <TableHead>Reporter</TableHead>
                                        <TableHead>Assigned To</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tickets.data.map((ticket) => (
                                        <TableRow key={ticket.id}>
                                            <TableCell>#{ticket.id}</TableCell>
                                            <TableCell>{ticket.title}</TableCell>
                                            <TableCell>
                                                <Badge className={statusColors[ticket.status]}>
                                                    {ticket.status.replace('_', ' ')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={priorityColors[ticket.priority]}>
                                                    {ticket.priority}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{ticket.reporter?.name || '-'}</TableCell>
                                            <TableCell>{ticket.assignee?.name || '-'}</TableCell>
                                            <TableCell>{new Date(ticket.created_at).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => router.visit(route('control-room.tickets.show', ticket.id))}
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
    </ControlRoomLayout>
    );
};

export default TicketList;