import React from 'react';
import { Head, usePage, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { PageProps } from '@/types';
import { ArrowLeft, DollarSign, Calendar, AlertTriangle, CheckCircle, User, Info } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'

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
  approver: { name: string } | null;
  payer: { name: string } | null;
  down_penalties: Array<{
    id: number;
    down_id: number;
    down: {
      guard: { name: string };
      reason: string;
      created_at: string;
    };
    penalty_amount: number;
    counts_against_incentive: boolean;
    resolution_type: string | null;
    resolved_by: number | null;
    resolved_at: string | null;
  }>;
}

interface ShowPageProps extends PageProps {
  incentive: IncentiveRecord;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function IncentiveShow() {
  const { incentive } = usePage<ShowPageProps>().props;

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

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <AuthenticatedLayout header="Incentive Details">
      <Head title="Incentive Details" />
      
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href={route('supervisor.incentives.index')}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {MONTHS[incentive.month - 1]} {incentive.year} Incentive
          </h1>
        </div>

        {/* Status Card */}
        <Card className="mb-6 dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge className={`${getStatusColor(incentive.status)} text-white text-lg px-4 py-2`}>
                  {incentive.status.toUpperCase()}
                </Badge>
                <div className="ml-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Period</p>
                  <p className="text-lg font-semibold dark:text-gray-200">
                    {MONTHS[incentive.month - 1]} {incentive.year}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400">Final Amount</p>
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(incentive.final_amount)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calculation Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-gray-100 flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Calculation Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Base Amount</span>
                  <span className="font-medium dark:text-gray-200">{formatCurrency(incentive.base_amount)}</span>
                </div>
                <div className="flex justify-between items-center text-red-600">
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Penalties ({incentive.unresolved_down_count} downs)
                  </span>
                  <span className="font-medium">-{formatCurrency(incentive.total_penalties)}</span>
                </div>
                <div className="border-t dark:border-gray-700 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold dark:text-gray-200">Final Amount</span>
                    <span className="font-bold text-green-600">{formatCurrency(incentive.final_amount)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-gray-100 flex items-center gap-2">
                <Info className="h-5 w-5" />
                Processing Info
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Status</span>
                  <Badge className={`${getStatusColor(incentive.status)} text-white`}>
                    {incentive.status}
                  </Badge>
                </div>
                {incentive.approved_at && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Approved On</span>
                    <span className="dark:text-gray-300">{formatDate(incentive.approved_at)}</span>
                  </div>
                )}
                {incentive.approver && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Approved By</span>
                    <span className="dark:text-gray-300">{incentive.approver.name}</span>
                  </div>
                )}
                {incentive.paid_at && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Paid On</span>
                    <span className="dark:text-gray-300">{formatDate(incentive.paid_at)}</span>
                  </div>
                )}
                {incentive.payer && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Paid By</span>
                    <span className="dark:text-gray-300">{incentive.payer.name}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Down Penalties Detail */}
        {incentive.down_penalties && incentive.down_penalties.length > 0 && (
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-gray-100 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Down Penalties Detail
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {incentive.down_penalties.map((penalty) => (
                  <div
                    key={penalty.id}
                    className={`p-4 rounded-lg border ${
                      penalty.counts_against_incentive
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                        : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="font-medium dark:text-gray-200">
                            {penalty.down?.guard?.name || 'Unknown Guard'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">
                          {penalty.down?.reason}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Reported: {formatDate(penalty.down?.created_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge
                          className={
                            penalty.counts_against_incentive
                              ? 'bg-red-500'
                              : 'bg-green-500'
                          }
                        >
                          {penalty.counts_against_incentive ? 'Penalty' : 'Excluded'}
                        </Badge>
                        <p className={`font-medium mt-1 ${
                          penalty.counts_against_incentive ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {penalty.counts_against_incentive
                            ? `-${formatCurrency(penalty.penalty_amount)}`
                            : 'No Penalty'}
                        </p>
                      </div>
                    </div>
                    {penalty.resolution_type && (
                      <div className="mt-3 pt-3 border-t dark:border-gray-700">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Resolution: {penalty.resolution_type.replace('_', ' ')}
                          {penalty.resolved_at && ` on ${formatDate(penalty.resolved_at)}`}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {incentive.down_penalties?.length === 0 && (
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <p className="text-lg font-medium dark:text-gray-200">No Down Penalties</p>
              <p className="text-gray-500 dark:text-gray-400">
                Great job! No downs were counted against your incentive this month.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
