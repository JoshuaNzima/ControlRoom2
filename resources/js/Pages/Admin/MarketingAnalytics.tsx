import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import IconMapper from '@/Components/IconMapper';

interface Row { status?: string; count: number; source?: string; ym?: string; total?: number }

interface Props {
  auth?: any;
  campaignsByStatus: Row[];
  leadsBySource: Row[];
  budgetByMonth: Row[];
  conversions: number;
}

export default function MarketingAnalytics({ auth = {}, campaignsByStatus = [], leadsBySource = [], budgetByMonth = [], conversions = 0 }: Props) {
  return (
    <AuthenticatedLayout header="Marketing Analytics" user={auth?.user as any}>
      <Head title="Marketing Analytics" />
      
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-coin-900 via-coin-800 to-coin-900 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                <IconMapper name="BarChart3" size={28} />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">Analytics</h1>
                <p className="text-coin-100 dark:text-gray-400 text-sm mt-1">Performance across campaigns and leads</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={route('admin.marketing')}>
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                  <IconMapper name="Megaphone" size={16} className="mr-1" /> Marketing
                </Button>
              </Link>
              <Link href={route('admin.marketing.leads.index')}>
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                  <IconMapper name="Users" size={16} className="mr-1" /> Leads
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard label="Conversions" value={conversions} />
        </div>

        {/* Analytics Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Campaigns by Status</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-3 py-2 text-left text-gray-600 dark:text-gray-300">Status</th>
                    <th className="px-3 py-2 text-right text-gray-600 dark:text-gray-300">Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {campaignsByStatus.map((r, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{r.status}</td>
                      <td className="px-3 py-2 text-right text-gray-900 dark:text-gray-100">{r.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          
          <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Leads by Source</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-3 py-2 text-left text-gray-600 dark:text-gray-300">Source</th>
                    <th className="px-3 py-2 text-right text-gray-600 dark:text-gray-300">Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {leadsBySource.map((r, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{r.source || 'Unknown'}</td>
                      <td className="px-3 py-2 text-right text-gray-900 dark:text-gray-100">{r.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          
          <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Budget by Month</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-3 py-2 text-left text-gray-600 dark:text-gray-300">Month</th>
                    <th className="px-3 py-2 text-right text-gray-600 dark:text-gray-300">Budget</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {budgetByMonth.map((r, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{r.ym}</td>
                      <td className="px-3 py-2 text-right text-gray-900 dark:text-gray-100">MWK {Number(r.total || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-4 bg-gradient-to-br from-coin-50 to-coin-100 border-coin-200 dark:from-coin-900/20 dark:to-coin-900/10 dark:border-coin-900/30">
      <div className="text-sm font-medium text-coin-900 dark:text-coin-100">{label}</div>
      <div className="text-2xl font-bold text-coin-900 dark:text-coin-100">{value}</div>
    </Card>
  );
}
