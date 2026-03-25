import React, { useState, useEffect } from 'react';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { formatCurrencyMWK } from '@/Components/format';
import { useForm } from '@inertiajs/react';
import { TrendingUp, Users, DollarSign, Calendar, Calculator, ChevronDown, ChevronUp } from 'lucide-react';

interface IncentiveStats {
  total_supervisors: number;
  total_sergeants: number;
  active_profiles: number;
  pending_count: number;
  approved_count: number;
  paid_count: number;
  total_paid_amount: number;
  pending_amount: number;
  by_role: {
    supervisor: number;
    sergeant: number;
  };
}

interface IncentiveSummaryProps {
  stats: IncentiveStats | null;
  period: { year: number; month: number };
  canCalculate?: boolean;
}

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function IncentiveSummary({ stats, period, canCalculate = false }: IncentiveSummaryProps) {
  const [expanded, setExpanded] = useState(false);
  const { post, processing } = useForm({
    year: period.year,
    month: period.month,
  });

  const handleCalculate = () => {
    post(route('incentives.calculate'), {
      preserveScroll: true,
      onSuccess: () => window.location.reload(),
    });
  };

  if (!stats) return null;

  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Performance Incentives</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {monthNames[period.month - 1]} {period.year}
          </span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="p-4 grid grid-cols-2 gap-4">
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Paid</p>
          <p className="text-lg font-bold text-purple-700 dark:text-purple-300">
            {formatCurrencyMWK(stats.total_paid_amount)}
          </p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">Pending</p>
          <p className="text-lg font-bold text-amber-700 dark:text-amber-300">
            {formatCurrencyMWK(stats.pending_amount)}
          </p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">Supervisors</p>
          <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{stats.total_supervisors}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">Sergeants</p>
          <p className="text-lg font-bold text-green-700 dark:text-green-300">{stats.total_sergeants}</p>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
              <span className="text-sm text-gray-600 dark:text-gray-400">Supervisor Incentives</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {formatCurrencyMWK(stats.by_role.supervisor)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
              <span className="text-sm text-gray-600 dark:text-gray-400">Sergeant Incentives</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {formatCurrencyMWK(stats.by_role.sergeant)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
              <span className="text-sm text-gray-600 dark:text-gray-400">Pending Approvals</span>
              <span className="font-medium text-amber-600 dark:text-amber-400">{stats.pending_count}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Active Profiles</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{stats.active_profiles}</span>
            </div>
          </div>

          {canCalculate && (
            <Button
              onClick={handleCalculate}
              disabled={processing}
              className="w-full mt-4 bg-purple-600 hover:bg-purple-700"
            >
              <Calculator className="w-4 h-4 mr-2" />
              {processing ? 'Calculating...' : 'Calculate Current Period'}
            </Button>
          )}

          <a
            href={route('admin.incentives.index')}
            className="block w-full mt-2 text-center text-sm text-purple-600 dark:text-purple-400 hover:underline"
          >
            View Full Incentive Report →
          </a>
        </div>
      )}
    </Card>
  );
}
