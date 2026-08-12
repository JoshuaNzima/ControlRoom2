import React, { useState } from 'react';
import { Head, usePage, Link, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/Components/ui/table';
import { Pagination } from '@/Components/ui/Pagination';
import { PageProps } from '@/types';
import { ArrowLeft, Calculator, Settings, DollarSign, AlertTriangle, CheckCircle, Clock, User } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/Components/ui/dialog';

interface IncentiveRecord {
  id: number;
  user_id: number;
  user: { name: string; email: string };
  year: number;
  month: number;
  base_amount: number;
  unresolved_down_count: number;
  total_penalties: number;
  final_amount: number;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  approved_at: string | null;
  paid_at: string | null;
  down_penalties: Array<{
    id: number;
    down_id: number;
    down: { guard: { name: string } };
    penalty_amount: number;
    counts_against_incentive: boolean;
  }>;
}

interface Stats {
  total_base: number;
  total_penalties: number;
  total_final: number;
  pending_count: number;
  paid_count: number;
}

interface IncentivesPageProps extends PageProps {
  records: {
    data: IncentiveRecord[];
    current_page: number;
    last_page: number;
    total: number;
  };
  stats: Stats;
  filters: { year: number; month: number; status: string };
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function IncentivesIndex() {
  const { records, stats, filters } = usePage<IncentivesPageProps>().props;
  const [year, setYear] = useState(filters.year.toString());
  const [month, setMonth] = useState(filters.month.toString());
  const [statusFilter, setStatusFilter] = useState(filters.status);
  const [calculating, setCalculating] = useState(false);

  const handleFilter = () => {
    router.get(route('admin.incentives.index'), {
      year,
      month,
      status: statusFilter,
    }, { preserveState: true });
  };

  const handleCalculate = () => {
    setCalculating(true);
    router.post(route('admin.incentives.calculate'), {
      year: parseInt(year),
      month: parseInt(month),
    }, {
      onFinish: () => setCalculating(false),
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'approved': return 'bg-blue-500';
      case 'paid': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Head title="Incentives" />
      
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Link href={route('admin.dashboard')}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Monthly Incentives</h1>
          </div>
          <div className="flex gap-2">
            <Link href={route('admin.incentives.profiles')}>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Profiles
              </Button>
            </Link>
            <Button
              onClick={handleCalculate}
              disabled={calculating}
              className="bg-red-600 hover:bg-red-700"
            >
              <Calculator className="h-4 w-4 mr-2" />
              {calculating ? 'Calculating...' : 'Calculate'}
            </Button>
          </div>
        </div>

        {/* Period Selector */}
        <Card className="mb-6 dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
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
                <Select value={statusFilter} onValueChange={setStatusFilter}>
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
                <Button onClick={handleFilter}>Apply</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Base</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatCurrency(stats.total_base)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Penalties</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatCurrency(stats.total_penalties)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Final Total</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatCurrency(stats.total_final)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                  <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats.pending_count}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Paid</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats.paid_count}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Records Table */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-gray-100">
              {MONTHS[parseInt(month) - 1]} {year} Incentive Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="dark:border-gray-700">
                    <TableHead className="dark:text-gray-400">User</TableHead>
                    <TableHead className="dark:text-gray-400">Base Amount</TableHead>
                    <TableHead className="dark:text-gray-400">Unresolved Downs</TableHead>
                    <TableHead className="dark:text-gray-400">Penalties</TableHead>
                    <TableHead className="dark:text-gray-400">Final Amount</TableHead>
                    <TableHead className="dark:text-gray-400">Status</TableHead>
                    <TableHead className="dark:text-gray-400 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.data.map((record) => (
                    <TableRow key={record.id} className="dark:border-gray-700">
                      <TableCell className="dark:text-gray-300">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          {record.user?.name}
                        </div>
                      </TableCell>
                      <TableCell className="dark:text-gray-300">{formatCurrency(record.base_amount)}</TableCell>
                      <TableCell className="dark:text-gray-300">
                        {record.unresolved_down_count > 0 ? (
                          <DownPenaltiesButton record={record} formatCurrency={formatCurrency} />
                        ) : (
                          <span className="text-green-600">None</span>
                        )}
                      </TableCell>
                      <TableCell className="text-red-600">-{formatCurrency(record.total_penalties)}</TableCell>
                      <TableCell className="font-medium text-green-600">
                        {formatCurrency(record.final_amount)}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(record.status)} text-white`}>
                          {record.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {record.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => router.post(route('admin.incentives.approve', record.id))}
                            >
                              Approve
                            </Button>
                          )}
                          {record.status === 'approved' && (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => router.post(route('admin.incentives.pay', record.id))}
                            >
                              Mark Paid
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {records.last_page > 1 && (
              <Pagination
                currentPage={records.current_page}
                lastPage={records.last_page}
                total={records.total}
                perPage={20}
                from={(records.current_page - 1) * 20 + 1}
                to={Math.min(records.current_page * 20, records.total)}
                baseUrl={route('admin.incentives.index')}
                filters={{ year: parseInt(year), month: parseInt(month), status: statusFilter }}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper component for down penalties dialog
function DownPenaltiesButton({ record, formatCurrency }: { record: IncentiveRecord; formatCurrency: (amount: number) => string }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="link" className="text-red-500 p-0 h-auto">
          {record.unresolved_down_count} downs
        </Button>
      </DialogTrigger>
      <DialogContent className="dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle>Down Penalties</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 mt-4">
          {record.down_penalties?.map((penalty) => (
            <div
              key={penalty.id}
              className={`p-3 rounded-lg ${
                penalty.counts_against_incentive
                  ? 'bg-red-50 dark:bg-red-900/20'
                  : 'bg-green-50 dark:bg-green-900/20'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-sm dark:text-gray-300">
                  {penalty.down?.guard?.name}
                </span>
                <Badge className={penalty.counts_against_incentive ? 'bg-red-500' : 'bg-green-500'}>
                  {penalty.counts_against_incentive ? 'Penalty' : 'Excluded'}
                </Badge>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Amount: {formatCurrency(penalty.penalty_amount)}
              </p>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
