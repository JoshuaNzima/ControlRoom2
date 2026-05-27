import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import IconMapper from '@/Components/IconMapper';
import AdminLayout from '@/Layouts/AdminLayout';

interface LoyaltyTier {
  id: number;
  name: string;
  level: number;
  min_points: number;
  max_points?: number | null;
  multiplier: number;
  benefits?: string[] | null;
  color?: string | null;
  icon?: string | null;
  is_active: boolean;
}

interface Props {
  tiers: LoyaltyTier[];
}

export default function Tiers({ tiers }: Props) {
  return (
    <AdminLayout title="Loyalty Tiers">
      <Head title="Loyalty Tiers" />

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Loyalty Tiers</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Define progression levels and rewards multipliers for clients.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={route('admin.loyalty.dashboard')}>
              <IconMapper name="ArrowLeft" size={16} className="mr-2" />
              Back
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {tiers.length ? (
            tiers.map((tier) => (
              <Card key={tier.id} className="border-2 border-gray-200 dark:border-gray-800">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-lg">{tier.name}</CardTitle>
                    <Badge className={tier.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300'}>
                      Level {tier.level}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-900">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Point Range</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {Number(tier.min_points).toFixed(0)} - {tier.max_points ? Number(tier.max_points).toFixed(0) : '∞'}
                    </p>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-900">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Multiplier</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{Number(tier.multiplier).toFixed(2)}x</p>
                  </div>

                  {tier.color && (
                    <p className="text-gray-600 dark:text-gray-400">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">Color:</span> {tier.color}
                    </p>
                  )}

                  {tier.icon && (
                    <p className="text-gray-600 dark:text-gray-400">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">Icon:</span> {tier.icon}
                    </p>
                  )}

                  {Array.isArray(tier.benefits) && tier.benefits.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Benefits</p>
                      <ul className="space-y-1">
                        {tier.benefits.map((benefit) => (
                          <li key={benefit} className="text-sm text-gray-600 dark:text-gray-400">
                            • {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="md:col-span-2 xl:col-span-4">
              <CardContent className="py-10 text-center text-gray-500 dark:text-gray-400">
                No loyalty tiers configured.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
