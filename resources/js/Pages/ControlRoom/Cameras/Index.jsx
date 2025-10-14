import React, { useState } from 'react';
import { formatDateMW } from '@/Components/format';
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
import { Grid } from '@/Components/ui/grid';
import CameraCard from './CameraCard';
import AddCameraForm from './AddCameraForm';

const CameraList = ({ cameras = { data: [] }, sites = [], filters = { statuses: [] } }) => {
    const [filterSite, setFilterSite] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [viewMode, setViewMode] = useState('grid');
    const [showAddDialog, setShowAddDialog] = useState(false);

    const statusColors = {
        online: 'bg-green-100 text-green-800',
        offline: 'bg-red-100 text-red-800',
        maintenance: 'bg-yellow-100 text-yellow-800',
        disabled: 'bg-gray-100 text-gray-800',
    };

    const handleFilterChange = (type, value) => {
        router.get(route('control-room.cameras.index'), {
            [type]: value,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const content = (() => {
        const cameraList = (cameras?.data || []);
        if (cameraList.length === 0) {
            return (
                <div className="p-6 text-center text-gray-500">
                    No cameras found. Use the 'Add Camera' button to create a new camera.
                </div>
            );
        }

        if (viewMode === 'grid') {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cameraList.map((camera) => (
                        <CameraCard key={camera.id} camera={camera} />
                    ))}
                </div>
            );
        }

        return (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Site</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Last Online</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {cameraList.map((camera) => (
                        <TableRow key={camera.id}>
                            <TableCell>{camera.name}</TableCell>
                            <TableCell>{camera.site?.name || '-'}</TableCell>
                            <TableCell>{camera.type}</TableCell>
                            <TableCell>
                                <Badge className={statusColors[camera.status] || 'bg-gray-100 text-gray-800'}>
                                    {camera.status || '-'}
                                </Badge>
                            </TableCell>
                            <TableCell>{camera.location}</TableCell>
                            <TableCell>
                                {camera.last_online
                                    ? formatDateMW('en-MW', camera.last_online)
                                    : 'Never'}
                            </TableCell>
                            <TableCell>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => router.visit(route('control-room.cameras.show', camera.id))}
                                >
                                    View
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        );
    })();

    return (
        <ControlRoomLayout>
            <Head title="CCTV Management" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-semibold text-gray-900">CCTV Cameras</h2>
                        <div className="flex items-center space-x-4">
                            <div className="flex space-x-2">
                                <Button
                                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setViewMode('grid')}
                                >
                                    Grid
                                </Button>
                                <Button
                                    variant={viewMode === 'list' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setViewMode('list')}
                                >
                                    List
                                </Button>
                            </div>
                            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                                <DialogTrigger asChild>
                                    <Button>Add Camera</Button>
                                </DialogTrigger>
                                <AddCameraForm onClose={() => setShowAddDialog(false)} sites={sites} />
                            </Dialog>
                        </div>
                    </div>

                    <Card>
                        <CardHeader>
                            <div className="flex gap-4">
                                <Select value={filterSite} onValueChange={(value) => handleFilterChange('site_id', value)}>
                                    <SelectTrigger className="w-[200px]">
                                        <SelectValue placeholder="Filter by site" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All Sites</SelectItem>
                                        {Array.isArray(sites) && sites.map((site) => (
                                            <SelectItem key={site.id} value={site.id}>
                                                {site.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select value={filterStatus} onValueChange={(value) => handleFilterChange('status', value)}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Filter by status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All Statuses</SelectItem>
                                        {(filters?.statuses || []).map((status) => (
                                            <SelectItem key={status} value={status}>
                                                {status.charAt(0).toUpperCase() + status.slice(1)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {((cameras?.data || []).length === 0) ? (
                                <div className="p-6 text-center text-gray-500">
                                    No cameras found. Use the 'Add Camera' button to create a new camera.
                                </div>
                            ) : viewMode === 'grid' ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {(cameras?.data || []).map((camera) => (
                                        <CameraCard key={camera.id} camera={camera} />
                                    ))}
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Site</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Location</TableHead>
                                            <TableHead>Last Online</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {(cameras?.data || []).map((camera) => (
                                            <TableRow key={camera.id}>
                                                <TableCell>{camera.name}</TableCell>
                                                <TableCell>{camera.site?.name || '-'}</TableCell>
                                                <TableCell>{camera.type}</TableCell>
                                                <TableCell>
                                                    <Badge className={statusColors[camera.status] || 'bg-gray-100 text-gray-800'}>
                                                        {camera.status || '-'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{camera.location}</TableCell>
                                                <TableCell>
                                                    {camera.last_online
                                                        ? formatDateMW('en-MW', camera.last_online)
                                                        : 'Never'}
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => router.visit(route('control-room.cameras.show', camera.id))}
                                                    >
                                                        View
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
    </ControlRoomLayout>
    );
};

export default CameraList;