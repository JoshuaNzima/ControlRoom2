import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Card } from '@/Components/ui/card';
import IconMapper from '@/Components/IconMapper';
import { formatCurrencyMWK } from '@/Components/format';

type Summary = {
  total?: number;
  paid?: number;
  unpaid?: number;
  overdue_count?: number;
  overdue_amount?: number;
};

type ExpenseSummary = {
  total?: number;
  approved?: number;
  pending?: number;
};

type BudgetsSummary = {
  active_count?: number;
  total_budgeted?: number;
  exceeded_count?: number;
  critical_count?: number;
};

type PaymentsSummary = {
  total_clients?: number;
  clients_with_outstanding?: number;
  outstanding_value?: number;
};

type ApprovalsSummary = {
  pending?: number;
  approved_today?: number;
};

interface Props {
  auth?: any;
  invoicesSummary?: Summary;
  expensesSummary?: ExpenseSummary;
  netCashflow?: number;
  budgetsSummary?: BudgetsSummary;
  paymentsSummary?: PaymentsSummary;
  approvalsSummary?: ApprovalsSummary;
  months?: string[];
  revenueSeries?: number[];
  expenseSeries?: number[];
}

export default function FinancePage({
  auth = {} as any,
  invoicesSummary = {},
  expensesSummary = {},
  netCashflow = 0,
  budgetsSummary = {},
  paymentsSummary = {},
  approvalsSummary = {},
  months = [],
  revenueSeries = [],
  expenseSeries = [],
}: Props) {
  const netPositive = (netCashflow || 0) >= 0;

  const chartData = months.map((label, index) => ({
    label,
    revenue: revenueSeries[index] ?? 0,
    expenses: expenseSeries[index] ?? 0,
  }));

  return (
    <AdminLayout title="Finance" user={auth?.user as any}>
      <Head title="Finance" />

      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-red-900">Finance Overview</h1>
              <p className="text-sm text-red-800/80 mt-1">
                High-level view of revenue, expenses, budgets and client payments across the platform.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={route('finance.dashboard')}
                className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700"
              >
                <IconMapper name="wallet" className="w-4 h-4 mr-2" />
                Open Finance Module
              </Link>
              <Link
                href={route('admin.payments.index')}
                className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-white text-red-800 border border-red-200 hover:bg-red-50"
              >
                <IconMapper name="dollar-sign" className="w-4 h-4 mr-2" />
                Payments Checker
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-emerald-900">Total Invoiced</h3>
                <IconMapper name="file-text" className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold text-emerald-900">
                {formatCurrencyMWK(invoicesSummary.total || 0)}
              </p>
              <p className="text-xs text-emerald-800 mt-1">
                Paid {formatCurrencyMWK(invoicesSummary.paid || 0)}
              </p>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-red-900">Outstanding Invoices</h3>
                <IconMapper name="alert-circle" className="w-5 h-5 text-red-500" />
              </div>
              <p className="text-2xl font-bold text-red-900">
                {invoicesSummary.overdue_count || 0}
              </p>
              <p className="text-xs text-red-800 mt-1">
                Overdue value {formatCurrencyMWK(invoicesSummary.overdue_amount || 0)}
              </p>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-blue-900">Approved Expenses (YTD)</h3>
                <IconMapper name="trending-down" className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-blue-900">
                {formatCurrencyMWK(expensesSummary.approved || 0)}
              </p>
              <p className="text-xs text-blue-800 mt-1">
                Pending {formatCurrencyMWK(expensesSummary.pending || 0)}
              </p>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-900">Net Cashflow</h3>
                <IconMapper
                  name={netPositive ? 'arrow-up-right' : 'arrow-down-right'}
                  className={netPositive ? 'w-5 h-5 text-emerald-500' : 'w-5 h-5 text-red-500'}
                />
              </div>
              <p
                className={
                  'text-2xl font-bold ' + (netPositive ? 'text-emerald-700' : 'text-red-700')
                }
              >
                {formatCurrencyMWK(netCashflow || 0)}
              </p>
              <p className="text-xs text-gray-600 mt-1">Paid invoices minus approved expenses</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-6 col-span-1 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Revenue vs Expenses</h2>
                  <p className="text-xs text-gray-500 mt-1">Last 6 months</p>
                </div>
              </div>
              {chartData.length === 0 ? (
                <p className="text-sm text-gray-500">No finance activity available yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Month</th>
                        <th className="px-3 py-2 text-right font-semibold text-gray-600">Revenue</th>
                        <th className="px-3 py-2 text-right font-semibold text-gray-600">Expenses</th>
                        <th className="px-3 py-2 text-right font-semibold text-gray-600">Net</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {chartData.map((row) => {
                        const net = (row.revenue || 0) - (row.expenses || 0);
                        const positive = net >= 0;
                        return (
                          <tr key={row.label}>
                            <td className="px-3 py-2 text-gray-800">{row.label}</td>
                            <td className="px-3 py-2 text-right text-emerald-700">
                              {formatCurrencyMWK(row.revenue || 0)}
                            </td>
                            <td className="px-3 py-2 text-right text-red-700">
                              {formatCurrencyMWK(row.expenses || 0)}
                            </td>
                            <td
                              className={
                                'px-3 py-2 text-right font-semibold ' +
                                (positive ? 'text-emerald-700' : 'text-red-700')
                              }
                            >
                              {formatCurrencyMWK(net)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            <div className="space-y-4">
              <Card className="p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Budgets</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Active budgets</span>
                    <span className="font-semibold text-gray-900">
                      {budgetsSummary.active_count ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total budgeted</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrencyMWK(budgetsSummary.total_budgeted || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-2">
                    <span className="text-red-700">Exceeded</span>
                    <span className="font-semibold text-red-700">
                      {budgetsSummary.exceeded_count ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-yellow-700">At risk (80%+)</span>
                    <span className="font-semibold text-yellow-700">
                      {budgetsSummary.critical_count ?? 0}
                    </span>
                  </div>
                </div>
                <div className="mt-3">
                  <Link
                    href={route('finance.budgets.index')}
                    className="inline-flex items-center text-xs text-red-700 hover:text-red-900"
                  >
                    View budgets
                  </Link>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Client Payments</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total clients</span>
                    <span className="font-semibold text-gray-900">
                      {paymentsSummary.total_clients ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Clients with outstanding</span>
                    <span className="font-semibold text-red-700">
                      {paymentsSummary.clients_with_outstanding ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Outstanding value</span>
                    <span className="font-semibold text-red-700">
                      {formatCurrencyMWK(paymentsSummary.outstanding_value || 0)}
                    </span>
                  </div>
                </div>
                <div className="mt-3">
                  <Link
                    href={route('admin.payments.index')}
                    className="inline-flex items-center text-xs text-red-700 hover:text-red-900"
                  >
                    Open payments checker
                  </Link>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Approvals</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Pending approvals</span>
                    <span className="font-semibold text-gray-900">
                      {approvalsSummary.pending ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Approved today</span>
                    <span className="font-semibold text-emerald-700">
                      {approvalsSummary.approved_today ?? 0}
                    </span>
                  </div>
                </div>
                <div className="mt-3">
                  <Link
                    href={route('finance.approvals.index')}
                    className="inline-flex items-center text-xs text-red-700 hover:text-red-900"
                  >
                    View approvals
                  </Link>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
