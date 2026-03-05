import React from 'react';
import { Head } from '@inertiajs/react';
import ControlRoomLayout from '@/Layouts/ControlRoomLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { formatCurrencyMWK } from '@/Components/format';
import { Wallet, TrendingDown, TrendingUp, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface BalanceSummary {
  guard_id: number;
  year: number;
  month: number;
  base_amount: number;
  current_balance: number;
  total_deductions: number;
  deduction_count: number;
  status: string;
  disbursed_amount?: number;
}

interface Deduction {
  id: number;
  deduction_amount: number;
  reason: string;
  resolution_type: string;
  deducted_at: string;
}

interface PendingDown {
  id: number;
  title: string;
  type: string;
  guard?: { name: string };
  site?: { name: string };
  created_at: string;
  potential_deduction: number;
}

interface Props {
  balance: BalanceSummary;
  recentDeductions: Deduction[];
  pendingDowns: {
    count: number;
    potential_deduction: number;
    downs: PendingDown[];
  };
  viewOnly?: boolean;
  periodLabel?: string;
}

export default function SupervisorBalance({ balance, recentDeductions, pendingDowns, periodLabel }: Props) {
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

  const getResolutionIcon = (type: string) => {
    switch (type) {
      case 'self_resolved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'control_room_resolved':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'escalated':
      case 'unresolved':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <ControlRoomLayout title="My Incentive Balance">
      <Head title="My Incentive Balance" />

      <div className="space-y-6 p-4">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">My Incentive Balance</h1>
            <p className="text-slate-400 mt-1">
              {periodLabel || `${monthNames[balance.month - 1]} ${balance.year}`}
            </p>
          </div>
          {getStatusBadge(balance.status)}
        </div>

        {/* Balance Overview Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardDescription className="text-slate-400">Base Amount</CardDescription>
              <CardTitle className="text-2xl font-bold text-green-400 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {formatCurrencyMWK(balance.base_amount)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500">Monthly starting balance</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardDescription className="text-slate-400">Total Deductions</CardDescription>
              <CardTitle className="text-2xl font-bold text-red-400 flex items-center gap-2">
                <TrendingDown className="h-5 w-5" />
                {formatCurrencyMWK(balance.total_deductions)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500">{balance.deduction_count} issue(s) deducted</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardDescription className="text-slate-400">Current Balance</CardDescription>
              <CardTitle className="text-2xl font-bold text-brand flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                {formatCurrencyMWK(balance.current_balance)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500">Available for disbursement</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardDescription className="text-slate-400">Pending Risk</CardDescription>
              <CardTitle className="text-2xl font-bold text-yellow-400 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                {formatCurrencyMWK(pendingDowns.potential_deduction)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500">{pendingDowns.count} unresolved issue(s)</p>
            </CardContent>
          </Card>
        </div>

        {/* How It Works */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg text-white">How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-400">
            <p>• You receive a <strong className="text-green-400">monthly base amount</strong> at the start of each month</p>
            <p>• When issues occur with your charges, resolve them before end of day to <strong className="text-brand">avoid deductions</strong></p>
            <p>• If issues are resolved by Control Room or remain unresolved, an amount will be <strong className="text-red-400">deducted</strong></p>
            <p>• Your <strong className="text-brand">remaining balance</strong> is disbursed at month end</p>
          </CardContent>
        </Card>

        {/* Pending Issues */}
        {pendingDowns.count > 0 && (
          <Card className="bg-slate-900 border-slate-800 border-l-4 border-l-yellow-500">
            <CardHeader>
              <CardTitle className="text-lg text-yellow-400 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Pending Issues ({pendingDowns.count})
              </CardTitle>
              <CardDescription className="text-slate-400">
                Resolve these before end of day to avoid deductions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {pendingDowns.downs.map((down) => (
                  <div
                    key={down.id}
                    className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                  >
                    <div>
                      <p className="text-white font-medium">{down.title}</p>
                      <p className="text-xs text-slate-500">
                        {down.guard?.name} • {down.site?.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-red-400 font-medium">
                        -{formatCurrencyMWK(down.potential_deduction)}
                      </p>
                      <p className="text-xs text-slate-500">if unresolved</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Deductions */}
        {recentDeductions.length > 0 && (
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg text-white">Recent Deductions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentDeductions.map((deduction) => (
                  <div
                    key={deduction.id}
                    className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg"
                  >
                    {getResolutionIcon(deduction.resolution_type)}
                    <div className="flex-1">
                      <p className="text-white text-sm">{deduction.reason}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(deduction.deducted_at).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-red-400 font-medium text-sm">
                      -{formatCurrencyMWK(deduction.deduction_amount)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Disbursed Info */}
        {balance.disbursed_amount !== undefined && balance.disbursed_amount > 0 && (
          <Card className="bg-slate-900 border-slate-800 border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="text-lg text-blue-400">Disbursement Complete</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white text-lg">
                Amount disbursed: <strong>{formatCurrencyMWK(balance.disbursed_amount)}</strong>
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </ControlRoomLayout>
  );
}
