import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Link } from '@inertiajs/react';
import {
  DollarSign,
  Users,
  TrendingUp,
  Award,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

interface KPIDashboardProps {
  commissionSummary?: {
    total_commissions: number;
    total_amount: number;
    pending_amount: number;
    approved_amount: number;
    paid_amount: number;
    this_month_count: number;
    this_month_amount: number;
    by_source: Array<{ source: string; count: number; amount: number }>;
    by_status: Array<{ status: string; count: number; amount: number }>;
  };
  incentiveSummary?: {
    total_supervisors: number;
    total_sergeants: number;
    active_incentive_profiles: number;
    this_month_pending: number;
    this_month_paid: number;
    ytd_total: number;
    by_month: Record<number, number>;
  };
  userRole: string;
}

export default function KPIIncentiveDashboard({
  commissionSummary,
  incentiveSummary,
  userRole,
}: KPIDashboardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
  };

  const isAdmin = ['admin', 'super_admin'].includes(userRole);
  const isControlRoom = userRole === 'control_room';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold dark:text-gray-100 flex items-center gap-2">
          <Award className="h-5 w-5 text-yellow-500" />
          Commissions & Incentives
        </h2>
        <div className="flex gap-2">
          {isAdmin && (
            <>
              <Link href={route('admin.commissions.index')}>
                <Button variant="outline" size="sm">
                  View Commissions
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
              <Link href={route('admin.incentives.index')}>
                <Button variant="outline" size="sm">
                  View Incentives
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </>
          )}
          {(userRole === 'supervisor' || userRole === 'sergeant') && (
            <Link href={route('supervisor.incentives.index')}>
              <Button variant="outline" size="sm">
                My Incentives
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Commission Stats - Admin/Control Room only */}
      {(isAdmin || isControlRoom) && commissionSummary && (
        <>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Client Acquisition Commissions
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Total Commissions</p>
                    <p className="text-lg font-bold dark:text-gray-100">{formatCurrency(commissionSummary.total_amount)}</p>
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
                    <p className="text-xs text-gray-500 dark:text-gray-400">Paid</p>
                    <p className="text-lg font-bold dark:text-gray-100">{formatCurrency(commissionSummary.paid_amount)}</p>
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
                    <p className="text-xs text-gray-500 dark:text-gray-400">Pending</p>
                    <p className="text-lg font-bold dark:text-gray-100">{formatCurrency(commissionSummary.pending_amount)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">This Month</p>
                    <p className="text-lg font-bold dark:text-gray-100">{formatCurrency(commissionSummary.this_month_amount)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* By Source */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm dark:text-gray-100">By Source</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {commissionSummary.by_source.map((item) => (
                  <div key={item.source} className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                      {item.source.replace('_', ' ')}
                    </p>
                    <p className="text-lg font-bold dark:text-gray-100">{formatCurrency(item.amount)}</p>
                    <p className="text-xs text-gray-400">{item.count} commissions</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Incentive Stats */}
      {incentiveSummary && (
        <>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-6">
            Supervisor/Sergeant Monthly Incentives
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                    <Users className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Supervisors</p>
                    <p className="text-lg font-bold dark:text-gray-100">{incentiveSummary.total_supervisors}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                    <Users className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Sergeants</p>
                    <p className="text-lg font-bold dark:text-gray-100">{incentiveSummary.total_sergeants}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">YTD Paid</p>
                    <p className="text-lg font-bold dark:text-gray-100">{formatCurrency(incentiveSummary.ytd_total)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">This Month Pending</p>
                    <p className="text-lg font-bold dark:text-gray-100">{incentiveSummary.this_month_pending}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
