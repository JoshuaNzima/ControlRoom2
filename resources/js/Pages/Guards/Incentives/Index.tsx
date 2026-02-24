import React from 'react';
import { Head, usePage, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
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
import { ArrowLeft, DollarSign, TrendingUp, TrendingDown, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';
import SupervisorLayout from '@/Layouts/SupervisorLayout';

interface IncentiveRecord {
  id: number;
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
    resolution_type: string | null;
  }>;
}

interface YTDStats {
  total_base: number;
  total_penalties: number;
  total_paid: number;
}

interface MyIncentivesPageProps extends PageProps {
  incentives: {
    data: IncentiveRecord[];
    current_page: number;
    last_page: number;
    total: number;
  };
  ytdStats: YTDStats;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function MyIncentives() {
  const { incentives, ytdStats } = usePage<MyIncentivesPageProps>().props;

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
    <SupervisorLayout title="My Incentives">
      <Head title="My Incentives" />
      
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Incentives</h1>
        </div>

        {/* YTD Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">YTD Base</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(ytdStats.total_base)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                  <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">YTD Penalties</p>
                  <p className="text-xl font-bold text-red-600">-{formatCurrency(ytdStats.total_penalties)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">YTD Paid</p>
                  <p className="text-xl font-bold text-green-600">{formatCurrency(ytdStats.total_paid)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Incentives Table */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-gray-100">Monthly Incentive History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="dark:border-gray-700">
                    <TableHead className="dark:text-gray-400">Period</TableHead>
                    <TableHead className="dark:text-gray-400">Base</TableHead>
                    <TableHead className="dark:text-gray-400">Penalties</TableHead>
                    <TableHead className="dark:text-gray-400">Final</TableHead>
                    <TableHead className="dark:text-gray-400">Status</TableHead>
                    <TableHead className="dark:text-gray-400 text-right">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incentives.data.map((incentive) => (
                    <TableRow key={incentive.id} className="dark:border-gray-700">
                      <TableCell className="dark:text-gray-300">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {MONTHS[incentive.month - 1]} {incentive.year}
                        </div>
                      </TableCell>
                      <TableCell className="dark:text-gray-300">{formatCurrency(incentive.base_amount)}</TableCell>
                      <TableCell>
                        {incentive.unresolved_down_count > 0 ? (
                          <div className="flex items-center gap-1 text-red-600">
                            <AlertTriangle className="h-4 w-4" />
                            <span>-{formatCurrency(incentive.total_penalties)}</span>
                            <span className="text-xs">({incentive.unresolved_down_count} downs)</span>
                          </div>
                        ) : (
                          <span className="text-green-600 flex items-center gap-1">
                            <CheckCircle className="h-4 w-4" />
                            None
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-green-600">
                        {formatCurrency(incentive.final_amount)}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(incentive.status)} text-white`}>
                          {incentive.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={route('supervisor.incentives.show', incentive.id)}>
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {incentives.last_page > 1 && (
              <Pagination
                currentPage={incentives.current_page}
                lastPage={incentives.last_page}
                total={incentives.total}
                perPage={12}
                from={(incentives.current_page - 1) * 12 + 1}
                to={Math.min(incentives.current_page * 12, incentives.total)}
                baseUrl={route('supervisor.incentives.index')}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </SupervisorLayout>
  );
}
