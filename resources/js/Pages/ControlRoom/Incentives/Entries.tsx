import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Input } from '@/Components/ui/input';
import { formatCurrencyMWK } from '@/Components/format';
import { Pagination } from '@/Components/ui/Pagination';
import { ArrowLeft, Eye, Filter, Download } from 'lucide-react';

interface IncentiveEntry {
  id: number;
  guard_relation?: { name: string; employee_id?: string };
  incentive_type?: { name: string; category: string };
  incentive_rule?: { name: string };
  period_start: string;
  period_end: string;
  base_amount: number;
  calculated_amount: number;
  final_amount: number;
  status: string;
  calculated_at: string;
  approved_at?: string;
  paid_at?: string;
}

interface IncentiveType {
  id: number;
  name: string;
  category: string;
}

interface Props {
  entries: {
    data: IncentiveEntry[];
    current_page: number;
    last_page: number;
    total: number;
  };
  types: IncentiveType[];
  statuses: string[];
  filters: {
    status: string;
    type_id: number | null;
    period_start: string | null;
    period_end: string | null;
  };
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

export default function ControlRoomIncentivesEntries({ entries, types, statuses, filters }: Props) {
  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(window.location.search);
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    window.location.href = `${route('control-room.incentives.entries')}?${params.toString()}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <Head title="Incentive Entries - Control Room" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link href={route('control-room.incentives.index')}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Incentive Entries</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              View-only access to all incentive entries
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.open(route('control-room.incentives.entries', { ...filters, export: 'csv' }), '_blank')}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6 dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium dark:text-gray-300">Status</label>
              <Select
                value={filters.status}
                onValueChange={(v) => handleFilterChange('status', v)}
              >
                <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 mt-1">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium dark:text-gray-300">Incentive Type</label>
              <Select
                value={filters.type_id?.toString() || 'all'}
                onValueChange={(v) => handleFilterChange('type_id', v === 'all' ? '' : v)}
              >
                <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 mt-1">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {types.map((type) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium dark:text-gray-300">Period Start</label>
              <Input
                type="date"
                value={filters.period_start || ''}
                onChange={(e) => handleFilterChange('period_start', e.target.value)}
                className="dark:bg-gray-700 dark:border-gray-600 mt-1"
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium dark:text-gray-300">Period End</label>
              <Input
                type="date"
                value={filters.period_end || ''}
                onChange={(e) => handleFilterChange('period_end', e.target.value)}
                className="dark:bg-gray-700 dark:border-gray-600 mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Entries Table */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">
            Entries ({entries.total} total)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  <th className="text-left py-3 px-3 dark:text-gray-400">Guard</th>
                  <th className="text-left py-3 px-3 dark:text-gray-400">Incentive Type</th>
                  <th className="text-left py-3 px-3 dark:text-gray-400">Rule</th>
                  <th className="text-left py-3 px-3 dark:text-gray-400">Period</th>
                  <th className="text-right py-3 px-3 dark:text-gray-400">Base</th>
                  <th className="text-right py-3 px-3 dark:text-gray-400">Calculated</th>
                  <th className="text-right py-3 px-3 dark:text-gray-400">Final</th>
                  <th className="text-left py-3 px-3 dark:text-gray-400">Status</th>
                  <th className="text-left py-3 px-3 dark:text-gray-400">Dates</th>
                </tr>
              </thead>
              <tbody>
                {entries.data.map((entry) => (
                  <tr key={entry.id} className="border-b dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-3 px-3 dark:text-gray-300">
                      <div>
                        <div className="font-medium">{entry.guard_relation?.name || 'N/A'}</div>
                        <div className="text-xs text-gray-500">{entry.guard_relation?.employee_id}</div>
                      </div>
                    </td>
                    <td className="py-3 px-3 dark:text-gray-300">
                      {entry.incentive_type?.name || 'N/A'}
                      <div className="text-xs text-gray-500">{entry.incentive_type?.category}</div>
                    </td>
                    <td className="py-3 px-3 dark:text-gray-300">{entry.incentive_rule?.name || '-'}</td>
                    <td className="py-3 px-3 dark:text-gray-300">
                      <div className="text-xs">
                        {new Date(entry.period_start).toLocaleDateString()} -
                        <br />
                        {new Date(entry.period_end).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right dark:text-gray-300">
                      {formatCurrencyMWK(entry.base_amount)}
                    </td>
                    <td className="py-3 px-3 text-right dark:text-gray-300">
                      {formatCurrencyMWK(entry.calculated_amount)}
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-emerald-600">
                      {formatCurrencyMWK(entry.final_amount)}
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant="outline" className={getStatusColor(entry.status)}>
                        {entry.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-xs text-gray-500 dark:text-gray-400">
                      <div>Calc: {new Date(entry.calculated_at).toLocaleDateString()}</div>
                      {entry.approved_at && <div>Appr: {new Date(entry.approved_at).toLocaleDateString()}</div>}
                      {entry.paid_at && <div>Paid: {new Date(entry.paid_at).toLocaleDateString()}</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {entries.last_page > 1 && (
            <div className="mt-4">
              <Pagination
                currentPage={entries.current_page}
                lastPage={entries.last_page}
                total={entries.total}
                perPage={20}
                from={(entries.current_page - 1) * 20 + 1}
                to={Math.min(entries.current_page * 20, entries.total)}
                baseUrl={route('control-room.incentives.entries')}
                filters={filters}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
