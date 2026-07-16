import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import IconMapper from '@/Components/IconMapper';

interface Props {
  loyaltyEnabled: boolean;
}

export default function Settings({ loyaltyEnabled }: Props) {
  const [enabled, setEnabled] = useState<boolean>(loyaltyEnabled);
  const [saving, setSaving] = useState(false);

  const handleToggle = () => {
    setSaving(true);

    router.post(
      route('admin.loyalty.settings.update'),
      {
        loyalty_enabled: !enabled,
      },
      {
        preserveScroll: true,
        onSuccess: () => setEnabled(!enabled),
        onFinish: () => setSaving(false),
      },
    );
  };

  return (
    <AuthenticatedLayout header="Loyalty Settings">
      <Head title="Loyalty Settings" />

      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Loyalty Settings</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Turn the loyalty program on or off for client-facing point actions.
            </p>
          </div>

          <Button asChild variant="outline">
            <Link href={route('admin.loyalty.dashboard')}>
              <IconMapper name="ArrowLeft" size={16} className="mr-2" />
              Back
            </Link>
          </Button>
        </div>

        <Card className="border-2 border-gray-200 dark:border-gray-800">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <CardTitle>Loyalty Program Status</CardTitle>
              <Badge
                className={
                  enabled
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300'
                }
              >
                {enabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700 dark:bg-gray-950 dark:text-gray-300">
              <p className="font-semibold text-gray-900 dark:text-gray-100">When disabled:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Client loyalty dashboards are blocked.</li>
                <li>Redemption requests and cancellations are blocked.</li>
                <li>Admin management pages remain available.</li>
              </ul>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Current state: {enabled ? 'On' : 'Off'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Toggle the entire loyalty program for client-facing use.
                </p>
              </div>

              <Button onClick={handleToggle} disabled={saving}>
                <IconMapper name={enabled ? 'ToggleRight' : 'ToggleLeft'} size={16} className="mr-2" />
                {saving ? 'Saving...' : enabled ? 'Disable loyalty' : 'Enable loyalty'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
