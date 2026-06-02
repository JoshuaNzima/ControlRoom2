import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import ClientLayout from '@/Layouts/ClientLayout';
import IconMapper from '@/Components/IconMapper';

interface Client {
  id: number;
  name: string;
}

interface Reward {
  name: string;
  requires_approval?: boolean;
}

interface ApprovedBy {
  name: string;
}

interface Redemption {
  id: number;
  status: string;
  points_used: number;
  value_received: number | null;
  created_at: string;
  reward: Reward;
  approvedBy?: ApprovedBy | null;
}

interface PaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

interface Props {
  client: Client;
  loyaltyEnabled?: boolean;
  redemptions: {
    data: Redemption[];
    links?: PaginationLink[];
    meta?: Record<string, unknown>;
  };
}

function statusTone(status: string): string {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300';
    case 'approved':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
    case 'completed':
      return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
    case 'rejected':
      return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
    case 'cancelled':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300';
  }
}

export default function Redemptions({
  client,
  loyaltyEnabled = true,
  redemptions,
}: Props) {
  const [cancelling, setCancelling] = useState<number | null>(null);

  const handleCancel = async (redemptionId: number) => {
    setCancelling(redemptionId);
    try {
      router.post(
        route('client.loyalty.cancel', redemptionId),
        {},
        {
          preserveScroll: true,
          onSuccess: () => window.location.reload(),
        },
      );
    } finally {
      setCancelling(null);
    }
  };

  return (
    <ClientLayout title="Loyalty Redemptions">
      <Head title="Loyalty Redemptions" />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {!loyaltyEnabled ? (
          <Card className="p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-amber-100 dark:bg-amber-900/20 rounded-full">
                <IconMapper
                  name="Gift"
                  size={32}
                  className="text-amber-600 dark:text-amber-400"
                />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Loyalty is currently disabled
                </h2>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Redemption actions have been turned off by the admin.
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <>
            <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
                  <IconMapper name="Gift" size={32} className="text-amber-500" />
                  Redemption History
                </h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Track reward requests and cancel any pending redemption.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline">
                  <Link href={route('client.loyalty.dashboard')}>
                    <IconMapper name="ArrowLeft" size={16} className="mr-2" />
                    Back to Dashboard
                  </Link>
                </Button>
              </div>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Client</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {client.name}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Redemptions</p>
                  <p className="mt-2 text-3xl font-bold text-amber-600 dark:text-amber-400">
                    {redemptions.data.length}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Action</p>
                  <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Pending requests can be cancelled
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>My Redemption Requests</CardTitle>
              </CardHeader>

              <CardContent>
                {redemptions.data.length ? (
                  <div className="space-y-4">
                    {redemptions.data.map((redemption) => {
                      const canCancel = redemption.status === 'pending';

                      return (
                        <div
                          key={redemption.id}
                          className="rounded-lg border border-gray-200 p-4 dark:border-gray-800"
                        >
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-semibold text-gray-900 dark:text-gray-100">
                                  {redemption.reward?.name || 'Unknown reward'}
                                </p>
                                <Badge className={statusTone(redemption.status)}>
                                  {redemption.status}
                                </Badge>
                              </div>

                              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                {redemption.points_used} points{' '}
                                {redemption.value_received !== null
                                  ? `• ${Number(redemption.value_received).toLocaleString()}`
                                  : ''}
                              </p>

                              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Requested on {new Date(redemption.created_at).toLocaleString()}
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {canCancel && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCancel(redemption.id)}
                                  disabled={cancelling === redemption.id}
                                >
                                  {cancelling === redemption.id ? 'Cancelling...' : 'Cancel'}
                                </Button>
                              )}

                              {redemption.approvedBy && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 self-center">
                                  Reviewed by {redemption.approvedBy.name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-gray-300 p-10 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                    You have no redemption requests yet.
                  </div>
                )}

                {redemptions.links && redemptions.links.length > 1 && (
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {redemptions.links.map((link, index) => (
                      <Button
                        key={index}
                        asChild
                        size="sm"
                        variant={link.active ? 'default' : 'outline'}
                        disabled={!link.url}
                      >
                        <Link
                          href={link.url || '#'}
                          dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </ClientLayout>
  );
}
