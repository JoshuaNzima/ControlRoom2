import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import IconMapper from '@/Components/IconMapper';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'

interface Client {
  id: number;
  name: string;
  email: string;
  loyaltyPoints?: {
    total_points: number;
    available_points: number;
    redeemed_points: number;
  };
}

interface Stats {
  total_clients: number;
  total_points_distributed: number;
  total_points_redeemed: number;
  total_point_value: number;
  pending_redemptions: number;
}

interface PaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

interface Props {
  clients: {
    data: Client[];
    links: PaginationLink[];
    meta: {
      last_page?: number;
    };
  };
  stats: Stats;
}

export default function LoyaltyDashboard({ clients, stats }: Props) {
  const [sortField, setSortField] = useState<'name' | 'available_points'>('available_points');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const sortedClients = [...clients.data].sort((a, b) => {
    let aVal, bVal;

    if (sortField === 'name') {
      aVal = a.name;
      bVal = b.name;
    } else {
      aVal = a.loyaltyPoints?.available_points || 0;
      bVal = b.loyaltyPoints?.available_points || 0;
    }

    return sortDir === 'asc' ? (aVal > bVal ? 1 : -1) : aVal < bVal ? 1 : -1;
  });

  return (
    <AuthenticatedLayout header="Loyalty Program">
      <Head title="Loyalty Program Management" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <IconMapper name="Gift" size={32} className="text-amber-500" />
              Loyalty Program
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage and monitor client loyalty points
            </p>
          </div>
          <div className="flex gap-2">
            <Link href={route('finance.loyalty.export')} className="inline-flex">
              <Button variant="outline">
                <IconMapper name="Download" size={16} className="mr-2" />
                Export Report
              </Button>
            </Link>
          </div>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Clients</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                {stats.total_clients}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Points Distributed</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">
                {Math.floor(stats.total_points_distributed).toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Points Redeemed</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                {Math.floor(stats.total_points_redeemed).toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Estimated Value</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">
                MWK {Math.floor(stats.total_point_value).toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending Approvals</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {stats.pending_redemptions}
                </span>
                <Link href={route('finance.loyalty.pending')}>
                  <Button size="sm" variant="outline">View</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Clients Table */}
        <Card>
          <CardHeader>
            <CardTitle>Client Loyalty Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4">
                      <button
                        onClick={() => {
                          setSortField('name');
                          setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
                        }}
                        className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1 hover:text-gray-600"
                      >
                        Client Name
                        {sortField === 'name' && (
                          <IconMapper
                            name={sortDir === 'asc' ? 'ChevronUp' : 'ChevronDown'}
                            size={16}
                          />
                        )}
                      </button>
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">
                      Email
                    </th>
                    <th className="text-right py-3 px-4">
                      <button
                        onClick={() => {
                          setSortField('available_points');
                          setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
                        }}
                        className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1 ml-auto hover:text-gray-600"
                      >
                        Available Points
                        {sortField === 'available_points' && (
                          <IconMapper
                            name={sortDir === 'asc' ? 'ChevronUp' : 'ChevronDown'}
                            size={16}
                          />
                        )}
                      </button>
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">
                      Total Earned
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">
                      Redeemed
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedClients.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-gray-500">
                        No clients found
                      </td>
                    </tr>
                  ) : (
                    sortedClients.map((client) => (
                      <tr
                        key={client.id}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition"
                      >
                        <td className="py-3 px-4">
                          <p className="font-semibold text-gray-900 dark:text-gray-100">{client.name}</p>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                          {client.email}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                            {Math.floor(client.loyaltyPoints?.available_points || 0)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right text-green-600 dark:text-green-400 font-semibold">
                          {Math.floor(client.loyaltyPoints?.total_points || 0)}
                        </td>
                        <td className="py-3 px-4 text-right text-blue-600 dark:text-blue-400 font-semibold">
                          {Math.floor(client.loyaltyPoints?.redeemed_points || 0)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Link href={route('finance.loyalty.client', client.id)}>
                            <Button size="sm" variant="outline">
                              <IconMapper name="Eye" size={16} />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {(clients.meta?.last_page ?? 0) > 1 && (
              <div className="mt-4 flex gap-2 justify-center">
                {clients.links.map((link: PaginationLink, i: number) => (
                  <Link key={i} href={link.url || '#'}>
                    <Button
                      variant={link.active ? 'default' : 'outline'}
                      size="sm"
                      dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
