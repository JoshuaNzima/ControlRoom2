import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { formatCurrencyMWK } from '@/Components/format';
import { Pagination } from '@/Components/ui/Pagination';
import { ArrowLeft, Users, DollarSign, Calculator } from 'lucide-react';

interface SupervisorRecord {
  id: number;
  guard?: { name: string; employee_id?: string; position?: string };
  year: number;
  month: number;
  base_amount: number;
  performance_bonus: number;
  deductions: number;
  net_amount: number;
  status: string;
  calculated_at?: string;
  approved_at?: string;
  paid_at?: string;
  notes?: string;
}

interface SupervisorProfile {
  id: number;
  guard?: { name: string };
  base_amount: number;
  is_active: boolean;
}

interface Stats {
  total_pending: number;
  total_approved: number;
  total_paid: number;
  pending_amount: number;
}

interface Props {
  records: {
    data: SupervisorRecord[];
    current_page: number;
    last_page: number;
    total: number;
  };
  stats: Stats;
  profiles: SupervisorProfile[];
  filters: {
    year: number;
    month: number;
    status: string;
  };
  viewOnly: boolean;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
    case 'approved': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    case 'paid': return 'bg-green-500/10 text-green-600 border-green-500/20';
    case 'rejected': return 'bg-red-500/10 text-red-600 border-red-500/20';
    default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
  }
};

export default function ControlRoomSupervisorIncentives({ records, stats, profiles, filters }: Props) {
  const [year, setYear] = useState(filters.year.toString());
  const [month, setMonth] = useState(filters.month.toString());
  const [status, setStatus] = useState(filters.status);

  const handleFilter = () => {
    const params = new URLSearchParams();
    params.set('year', year);
    params.set('month', month);
    if (status !== 'all') params.set('status', status);
    window.location.href = `${route('control-room.incentives.supervisor')}?${params.toString()}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <Head title="Supervisor Incentives - Control Room" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link href={route('control-room.incentives.index')}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Users className="w-7 h-7 text-purple-500" />
              Supervisor Incentives
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              View-only access to supervisor incentive records
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="text-xs text-gray-500 dark:text-gray-400">Pending</div>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.total_pending}</div>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="text-xs text-gray-500 dark:text-gray-400">Approved</div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.total_approved}</div>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="text-xs text-gray-500 dark:text-gray-400">Paid</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.total_paid}</div>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="text-xs text-gray-500 dark:text-gray-400">Pending Amount</div>
            <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
              {formatCurrencyMWK(stats.pending_amount)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6 dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium dark:text-gray-300">Year</label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026].map((y) => (
                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium dark:text-gray-300">Month</label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium dark:text-gray-300">Status</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="pt-6">
              <Button onClick={handleFilter}>Apply Filters</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Profiles */}
      <Card className="mb-6 dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg dark:text-gray-100">Active Supervisor Profiles ({profiles.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {profiles.map((profile) => (
              <Badge
                key={profile.id}
                variant="outline"
                className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300"
              >
                {profile.guard?.name || 'Unknown'}
                <span className="ml-1 text-xs text-gray-500">
                  ({formatCurrencyMWK(profile.base_amount)}/mo)
                </span>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Records Table */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">
            {MONTHS[parseInt(month) - 1]} {year} Records ({records.total} total)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  <th className="text-left py-3 px-3 dark:text-gray-400">Supervisor</th>
                  <th className="text-right py-3 px-3 dark:text-gray-400">Base</th>
                  <th className="text-right py-3 px-3 dark:text-gray-400">Bonus</th>
                  <th className="text-right py-3 px-3 dark:text-gray-400">Deductions</th>
                  <th className="text-right py-3 px-3 dark:text-gray-400">Net</th>
                  <th className="text-left py-3 px-3 dark:text-gray-400">Status</th>
                  <th className="text-left py-3 px-3 dark:text-gray-400">Dates</th>
                </tr>
              </thead>
              <tbody>
                {records.data.map((record) => (
                  <tr key={record.id} className="border-b dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-3 px-3 dark:text-gray-300">
                      <div>
                        <div className="font-medium">{record.guard?.name || 'N/A'}</div>
                        <div className="text-xs text-gray-500">{record.guard?.employee_id} • {record.guard?.position}</div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right dark:text-gray-300">
                      {formatCurrencyMWK(record.base_amount)}
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-600">
                      +{formatCurrencyMWK(record.performance_bonus)}
                    </td>
                    <td className="py-3 px-3 text-right text-red-600">
                      -{formatCurrencyMWK(record.deductions)}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-600">
                      {formatCurrencyMWK(record.net_amount)}
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant="outline" className={getStatusColor(record.status)}>
                        {record.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-xs text-gray-500 dark:text-gray-400">
                      {record.calculated_at && <div>Calc: {new Date(record.calculated_at).toLocaleDateString()}</div>}
                      {record.approved_at && <div>Appr: {new Date(record.approved_at).toLocaleDateString()}</div>}
                      {record.paid_at && <div>Paid: {new Date(record.paid_at).toLocaleDateString()}</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {records.last_page > 1 && (
            <div className="mt-4">
              <Pagination
                currentPage={records.current_page}
                lastPage={records.last_page}
                total={records.total}
                perPage={20}
                from={(records.current_page - 1) * 20 + 1}
                to={Math.min(records.current_page * 20, records.total)}
                baseUrl={route('control-room.incentives.supervisor')}
                filters={filters}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
