import React from 'react';
import { Head } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Textarea } from '@/Components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import { Label } from '@/Components/ui/label';
import { Badge } from '@/Components/ui/badge';

const FlagShow = ({ flag, canReview }) => {
    const { data, setData, patch, processing } = useForm({
        status: flag.status,
        review_notes: flag.review_notes || '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        patch(route('control-room.flags.update', flag.id));
    };

    const statusColors = {
        pending_review: 'bg-yellow-100 text-yellow-800',
        under_review: 'bg-blue-100 text-blue-800',
        resolved: 'bg-green-100 text-green-800',
        dismissed: 'bg-gray-100 text-gray-800',
    };

    return (
        <AppLayout>
            <Head title={`Flag #${flag.id}`} />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <h2 className="text-2xl font-semibold text-gray-900">
                            Flag #{flag.id}
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Flag Details */}
                        <div className="lg:col-span-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Flag Details</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label>Status</Label>
                                        <div className="mt-1">
                                            <Badge className={statusColors[flag.status]}>
                                                {flag.status.replace('_', ' ')}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div>
                                        <Label>Flagged Item</Label>
                                        <div className="mt-1 text-gray-900">
                                            {flag.flaggable?.name || `Guard #${flag.flaggable?.id}`}
                                        </div>
                                    </div>

                                    <div>
                                        <Label>Type</Label>
                                        <div className="mt-1 text-gray-900">
                                            {flag.flaggable_type.includes('Guard') ? 'Guard' : 'User'}
                                        </div>
                                    </div>

                                    <div>
                                        <Label>Reason</Label>
                                        <div className="mt-1 text-gray-900">{flag.reason}</div>
                                    </div>

                                    <div>
                                        <Label>Details</Label>
                                        <div className="mt-1 text-gray-900 whitespace-pre-wrap">
                                            {flag.details}
                                        </div>
                                    </div>

                                    <div>
                                        <Label>Reported By</Label>
                                        <div className="mt-1 text-gray-900">
                                            {flag.reporter?.name || '-'} on{' '}
                                            {new Date(flag.created_at).toLocaleDateString()}
                                        </div>
                                    </div>

                                    {flag.reviewer && (
                                        <div>
                                            <Label>Reviewed By</Label>
                                            <div className="mt-1 text-gray-900">
                                                {flag.reviewer.name} on{' '}
                                                {new Date(flag.review_date).toLocaleDateString()}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Review Form */}
                        {canReview && (
                            <div className="lg:col-span-1">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Review Flag</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <form onSubmit={handleSubmit} className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="status">Update Status</Label>
                                                <Select
                                                    value={data.status}
                                                    onValueChange={value => setData('status', value)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="under_review">
                                                            Under Review
                                                        </SelectItem>
                                                        <SelectItem value="resolved">Resolved</SelectItem>
                                                        <SelectItem value="dismissed">Dismissed</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="review_notes">Review Notes</Label>
                                                <Textarea
                                                    id="review_notes"
                                                    value={data.review_notes}
                                                    onChange={e =>
                                                        setData('review_notes', e.target.value)
                                                    }
                                                    rows={4}
                                                    placeholder="Add your review notes..."
                                                />
                                            </div>

                                            <Button
                                                type="submit"
                                                className="w-full"
                                                disabled={processing}
                                            >
                                                Update Flag
                                            </Button>
                                        </form>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};

export default FlagShow;