import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { formatCurrencyMWK } from '@/Components/format';
import { Award, DollarSign, Users, Settings, Calculator, Eye, ArrowRight } from 'lucide-react';

interface Stats {
  incentive_system: {
    total_types: number;
    total_rules: number;
    pending_entries: number;
    approved_entries: number;
    paid_entries: number;
    pending_amount: number;
    paid_amount_mtd: number;
  };
  supervisor_incentives: {
    total_profiles: number;
    pending_calculations: number;
    approved_pending_payment: number;
    pending_amount_total: number;
  };
}

interface IncentiveEntry {
  id: number;
  guard_relation?: { name: string };
  incentive_type?: { name: string; category: string };
  final_amount: number;
  status: string;
  calculated_at: string;
}

interface Props {
  stats: Stats;
  recentEntries: IncentiveEntry[];
  viewOnly: boolean;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
    case 'approved': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    case 'paid': return 'bg-green-500/10 text-green-600 border-green-500/20';
    case 'rejected': return 'bg-red-500/10 text-red-600 border-red-500/20';
    default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
  }
};

export default function ControlRoomIncentivesIndex({ stats, recentEntries }: Props) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <Head title="Incentives - Control Room" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Award className="w-7 h-7 text-red-500" />
            Incentives Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View-only access to incentive system data
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={route('control-room.incentives.entries')}>
            <Button variant="outline">
              <Eye className="w-4 h-4 mr-2" />
              View Entries
            </Button>
          </Link>
          <Link href={route('control-room.incentives.supervisor')}>
            <Button variant="outline">
              <Users className="w-4 h-4 mr-2" />
              Supervisor Incentives
            </Button>
          </Link>
        </div>
      </div>

      {/* New Incentive System Stats */}
      <Card className="mb-6 dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 dark:text-gray-100">
            <Settings className="w-5 h-5 text-blue-500" />
            Incentive System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <div className="text-xs text-gray-500 dark:text-gray-400">Active Types</div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.incentive_system.total_types}
              </div>
            </div>
            <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
              <div className="text-xs text-gray-500 dark:text-gray-400">Active Rules</div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {stats.incentive_system.total_rules}
              </div>
            </div>
            <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
              <div className="text-xs text-gray-500 dark:text-gray-400">Pending Entries</div>
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {stats.incentive_system.pending_entries}
              </div>
            </div>
            <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
              <div className="text-xs text-gray-500 dark:text-gray-400">Pending Amount</div>
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrencyMWK(stats.incentive_system.pending_amount)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Entry Status</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Pending:</span>
                  <span className="font-medium text-yellow-600">{stats.incentive_system.pending_entries}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Approved:</span>
                  <span className="font-medium text-blue-600">{stats.incentive_system.approved_entries}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Paid:</span>
                  <span className="font-medium text-green-600">{stats.incentive_system.paid_entries}</span>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount Summary</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Pending/Approved:</span>
                  <span className="font-medium text-yellow-600">{formatCurrencyMWK(stats.incentive_system.pending_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Paid (MTD):</span>
                  <span className="font-medium text-green-600">{formatCurrencyMWK(stats.incentive_system.paid_amount_mtd)}</span>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex items-center justify-center">
              <Link href={route('control-room.incentives.entries')}>
                <Button variant="outline" className="w-full">
                  <ArrowRight className="w-4 h-4 mr-2" />
                  View All Entries
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Supervisor Incentives Stats */}
      <Card className="mb-6 dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 dark:text-gray-100">
            <Users className="w-5 h-5 text-purple-500" />
            Supervisor Incentives (Legacy)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <div className="text-xs text-gray-500 dark:text-gray-400">Active Profiles</div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.supervisor_incentives.total_profiles}
              </div>
            </div>
            <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
              <div className="text-xs text-gray-500 dark:text-gray-400">Pending</div>
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {stats.supervisor_incentives.pending_calculations}
              </div>
            </div>
            <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
              <div className="text-xs text-gray-500 dark:text-gray-400">Ready for Payment</div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {stats.supervisor_incentives.approved_pending_payment}
              </div>
            </div>
            <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
              <div className="text-xs text-gray-500 dark:text-gray-400">Pending Amount</div>
              <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                {formatCurrencyMWK(stats.supervisor_incentives.pending_amount_total)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Entries */}
      {recentEntries.length > 0 && (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg dark:text-gray-100">Recent Pending/Approved Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="text-left py-2 px-3 dark:text-gray-400">Guard</th>
                    <th className="text-left py-2 px-3 dark:text-gray-400">Type</th>
                    <th className="text-left py-2 px-3 dark:text-gray-400">Amount</th>
                    <th className="text-left py-2 px-3 dark:text-gray-400">Status</th>
                    <th className="text-left py-2 px-3 dark:text-gray-400">Calculated</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEntries.map((entry) => (
                    <tr key={entry.id} className="border-b dark:border-gray-700 last:border-0">
                      <td className="py-2 px-3 dark:text-gray-300">{entry.guard_relation?.name || 'N/A'}</td>
                      <td className="py-2 px-3 dark:text-gray-300">{entry.incentive_type?.name || 'N/A'}</td>
                      <td className="py-2 px-3 font-medium text-emerald-600">
                        {formatCurrencyMWK(entry.final_amount)}
                      </td>
                      <td className="py-2 px-3">
                        <Badge variant="outline" className={getStatusColor(entry.status)}>
                          {entry.status}
                        </Badge>
                      </td>
                      <td className="py-2 px-3 text-gray-500 dark:text-gray-400">
                        {new Date(entry.calculated_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
