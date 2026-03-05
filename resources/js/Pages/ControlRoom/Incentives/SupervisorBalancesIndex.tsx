import React from 'react';
import { Head, Link } from '@inertiajs/react';
import ControlRoomLayout from '@/Layouts/ControlRoomLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/Components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/Components/ui/table';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Pagination } from '@/Components/ui/Pagination';
import { formatCurrencyMWK } from '@/Components/format';
import { Wallet, TrendingDown, Users, Download } from 'lucide-react';

interface Balance {
  id: number;
  guard_id: number;
  guard: {
    name: string;
    employee_role?: string;
  };
  base_amount: number;
  current_balance: number;
  total_deductions: number;
  status: string;
  final_disbursed_amount?: number;
}

interface Props {
  balances: {
    data: Balance[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  summary: {
    total_base: number;
    total_deductions: number;
    total_pending_disbursement: number;
    supervisor_count: number;
  };
  filters: {
    year: number;
    month: number;
  };
  periodLabel?: string;
}

export default function SupervisorBalancesIndex({ balances, summary, filters, periodLabel }: Props) {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-600">Active</Badge>;
      case 'disbursed':
        return <Badge className="bg-blue-600">Disbursed</Badge>;
      case 'processing':
        return <Badge className="bg-yellow-600">Processing</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <ControlRoomLayout title="Supervisor Incentive Balances">
      <Head title="Supervisor Incentive Balances" />

      <div className="space-y-6 p-4">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Supervisor Incentive Balances</h1>
            <p className="text-slate-400 mt-1">
              {periodLabel || `${monthNames[filters.month - 1]} ${filters.year}`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="border-slate-700 text-slate-300">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardDescription className="text-slate-400">Total Supervisors</CardDescription>
              <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
                <Users className="h-5 w-5" />
                {summary.supervisor_count}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardDescription className="text-slate-400">Total Base Amount</CardDescription>
              <CardTitle className="text-2xl font-bold text-green-400">
                {formatCurrencyMWK(summary.total_base)}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardDescription className="text-slate-400">Total Deductions</CardDescription>
              <CardTitle className="text-2xl font-bold text-red-400 flex items-center gap-2">
                <TrendingDown className="h-5 w-5" />
                {formatCurrencyMWK(summary.total_deductions)}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardDescription className="text-slate-400">Pending Disbursement</CardDescription>
              <CardTitle className="text-2xl font-bold text-brand flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                {formatCurrencyMWK(summary.total_pending_disbursement)}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Balances Table */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg text-white">Individual Balances</CardTitle>
            <CardDescription className="text-slate-400">
              Detailed view of each supervisor/sergeant incentive balance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800">
                    <TableHead className="text-slate-400">Name</TableHead>
                    <TableHead className="text-slate-400">Role</TableHead>
                    <TableHead className="text-slate-400 text-right">Base Amount</TableHead>
                    <TableHead className="text-slate-400 text-right">Deductions</TableHead>
                    <TableHead className="text-slate-400 text-right">Current Balance</TableHead>
                    <TableHead className="text-slate-400">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {balances.data.map((balance) => (
                    <TableRow key={balance.id} className="border-slate-800">
                      <TableCell className="font-medium text-white">
                        {balance.guard.name}
                      </TableCell>
                      <TableCell className="text-slate-400 capitalize">
                        {balance.guard.employee_role?.replace('_', ' ') ?? 'N/A'}
                      </TableCell>
                      <TableCell className="text-right text-green-400">
                        {formatCurrencyMWK(balance.base_amount)}
                      </TableCell>
                      <TableCell className="text-right text-red-400">
                        {balance.total_deductions > 0
                          ? `-${formatCurrencyMWK(balance.total_deductions)}`
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right font-medium text-white">
                        {formatCurrencyMWK(balance.current_balance)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(balance.status)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {balances.last_page > 1 && (
              <div className="mt-4">
                <Pagination
                  currentPage={balances.current_page}
                  lastPage={balances.last_page}
                  perPage={balances.per_page}
                  total={balances.total}
                  from={(balances.current_page - 1) * balances.per_page + 1}
                  to={Math.min(balances.current_page * balances.per_page, balances.total)}
                  baseUrl={route('control-room.incentives.supervisor-balances.index')}
                  filters={filters}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg text-white">How the System Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-400">
            <p>• Each supervisor/sergeant receives a <strong className="text-green-400">monthly base amount</strong> at the start of the month</p>
            <p>• When they fail to resolve issues with their charges by end of day, <strong className="text-red-400">deductions</strong> are applied</p>
            <p>• Control Room marks issues as resolved, specifying who resolved them</p>
            <p>• If the supervisor didn't resolve it themselves, a <strong className="text-red-400">deduction</strong> is made from their balance</p>
            <p>• Remaining balance is <strong className="text-brand">disbursed</strong> at month end</p>
          </CardContent>
        </Card>
      </div>
    </ControlRoomLayout>
  );
}
