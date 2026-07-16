import React from 'react';
import { Head, router } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';

type FlagStatus = 'pending_review' | 'under_review' | 'resolved' | 'dismissed';

type FlagShowFlag = {
	id: number;
	status: FlagStatus;

	title?: string;
	flaggable?: { id?: number; name?: string } | null;
	flaggable_type?: string;
	reason?: string;
	details?: string;
	created_at: string;

	reporter?: { name?: string } | null;

	// only present when reviewed
	reviewer?: { name: string } | null;
	review_date?: string | null;
	resolution_notes?: string | null;
};
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
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

type FormData = {
	status: FlagStatus;
	review_notes: string;
};

const FlagShow: React.FC<{ flag: FlagShowFlag; canReview?: boolean }> = ({ flag, canReview = false }) => {
const { data, setData, patch, processing } = useForm<FormData>({
	status: flag.status,
	review_notes: flag.resolution_notes ?? '',
});

	const acknowledgeFlag = () => router.post(route('control-room.flags.acknowledge', flag.id));
	const resolveFlag = () => router.post(route('control-room.flags.resolve', flag.id));
	const escalateFlag = () => router.post(route('control-room.flags.escalate', flag.id));

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		patch(route('control-room.flags.update', flag.id));
	};

	const statusColors: Record<string, string> = {
		pending_review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200',
		under_review: 'bg-coin-100 text-coin-800 dark:bg-coin-900/20 dark:text-coin-200',
		resolved: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200',
		dismissed: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
	};

	return (
		<AuthenticatedLayout header={`Flag #${flag.id}`}>
			<Head title={`Flag #${flag.id}`} />

			<div className="py-6">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="mb-6">
						<h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Flag #{flag.id}</h2>
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
						<div className="lg:col-span-2">
							<Card>
								<CardHeader>
									<CardTitle>Flag Details</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									<div>
										<Label>Status</Label>
										<div className="mt-1">
											<Badge className={statusColors[flag.status]}>{flag.status.replace('_', ' ')}</Badge>
										</div>
									</div>

									<div>
										<Label>Flagged Item</Label>
										<div className="mt-1 text-gray-900 dark:text-gray-100">
											{flag.flaggable?.name || `Guard #${flag.flaggable?.id}`}
										</div>
									</div>

									<div>
										<Label>Type</Label>
										<div className="mt-1 text-gray-900 dark:text-gray-100">
											{(flag.flaggable_type ?? '').includes('Guard') ? 'Guard' : 'User'}
										</div>
									</div>

									<div>
										<Label>Reason</Label>
										<div className="mt-1 text-gray-900 dark:text-gray-100">{flag.reason}</div>
									</div>

									<div>
										<Label>Details</Label>
										<div className="mt-1 text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{flag.details}</div>
									</div>

									<div>
										<Label>Reported By</Label>
										<div className="mt-1 text-gray-900 dark:text-gray-100">
											{flag.reporter?.name || '-'} on {new Date(flag.created_at).toLocaleDateString()}
										</div>
									</div>

									{flag.reviewer && (
										<div>
											<Label>Reviewed By</Label>
											<div className="mt-1 text-gray-900 dark:text-gray-100">
												{flag.reviewer.name} on {new Date(flag.review_date ?? '').toLocaleDateString()}
											</div>
										</div>
									)}
								</CardContent>
							</Card>
						</div>

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
													onValueChange={(value) => setData('status', value as FlagStatus)}
												>
													<SelectTrigger>
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="under_review">Under Review</SelectItem>
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
													onChange={(e) => setData('review_notes', e.target.value)}
													rows={4}
													placeholder="Add your review notes..."
												/>
											</div>

											<Button type="submit" className="w-full" disabled={processing}>
												Update Flag
											</Button>

											<div className="mt-4 grid grid-cols-3 gap-2">
												<Button type="button" variant="outline" onClick={acknowledgeFlag}>
													Acknowledge
												</Button>
												<Button type="button" variant="outline" onClick={escalateFlag}>
													Escalate
												</Button>
												<Button type="button" onClick={resolveFlag}>
													Resolve
												</Button>
											</div>
										</form>
									</CardContent>
								</Card>
							</div>
						)}
					</div>
				</div>
			</div>
		</AuthenticatedLayout>
	);
};

export default FlagShow;
