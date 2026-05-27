import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import IconMapper from '@/Components/IconMapper';
import AdminLayout from '@/Layouts/AdminLayout';

interface LoyaltyRule {
  id: number;
  name: string;
  type: string;
  points_per_unit: number;
  unit_description: string;
  description?: string | null;
  is_active: boolean;
  priority?: number | null;
}

interface Props {
  rules: LoyaltyRule[];
}

export default function Rules({ rules }: Props) {
  return (
    <AdminLayout title="Loyalty Rules">
      <Head title="Loyalty Rules" />

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Loyalty Rules</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Configure how clients earn points from payments, referrals, services, and contracts.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={route('admin.loyalty.dashboard')}>
              <IconMapper name="ArrowLeft" size={16} className="mr-2" />
              Back
            </Link>
          </Button>
        </div>

        <div className="grid gap-4">
          {rules.length ? (
            rules.map((rule) => (
              <Card key={rule.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-lg">{rule.name}</CardTitle>
                    <Badge className={rule.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300'}>
                      {rule.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p><span className="font-semibold">Type:</span> {rule.type}</p>
                  <p><span className="font-semibold">Points per unit:</span> {Number(rule.points_per_unit).toFixed(0)}</p>
                  <p><span className="font-semibold">Unit:</span> {rule.unit_description}</p>
                  {rule.description && <p className="text-gray-600 dark:text-gray-400">{rule.description}</p>}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-10 text-center text-gray-500 dark:text-gray-400">
                No loyalty rules configured.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
