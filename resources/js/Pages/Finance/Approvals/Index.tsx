import React from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import FinanceLayout from '@/Layouts/FinanceLayout';
import AdminLayout from '@/Layouts/AdminLayout';
import { formatCurrency, formatDate } from '@/utils/formatters';

interface Props {
  approvals: any[];
  budgets?: { data: any[]; links?: any[]; meta?: any };
  selectedTab?: 'requisitions' | 'budgets';
}

export default function ApprovalsIndex({ approvals, budgets = { data: [], links: [], meta: {} }, selectedTab = 'requisitions' }: Props) {
  const { url } = usePage();
  const isAdminRoute = typeof url === 'string' && url.startsWith('/admin/');
  const prefix = isAdminRoute ? 'admin' : 'finance';
  const Layout = isAdminRoute ? AdminLayout : FinanceLayout;
  const expenseShowRoute = isAdminRoute ? 'admin.requisitions.show' : 'finance.expenses.show';
  const requisitionsIndexRoute = isAdminRoute ? 'admin.requisitions.index' : 'finance.expenses.index';

  const handleApprove = (id: number) => {
    router.post(route(`${prefix}.approvals.approve`, { approval: id }), {});
  };

  const handleReject = (id: number) => {
    router.post(route(`${prefix}.approvals.reject`, { approval: id }), {});
  };

  const pendingCount = approvals.length;

  const gotoTab = (tab: 'requisitions' | 'budgets') => {
    const name = isAdminRoute ? 'admin.approvals.index' : 'finance.approvals.index';
    router.get(route(name), { tab }, { preserveScroll: true, preserveState: true });
  };

  return (
    <Layout title="Approvals">
      <Head title="Approvals" />
      <div className="py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Approvals</h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                {pendingCount === 0
                  ? 'No pending approvals assigned to you.'
                  : `You have ${pendingCount} pending requisition approval${pendingCount === 1 ? '' : 's'}.`}
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            {/* Tabs */}
            <div className="px-4 pt-4 border-b dark:border-gray-700">
              <div className="flex gap-4">
                <button
                  className={`px-3 py-2 text-sm font-medium border-b-2 ${selectedTab === 'requisitions' ? 'border-coin-600 text-coin-700 dark:text-coin-400' : 'border-transparent text-gray-600 dark:text-gray-300'}`}
                  onClick={() => gotoTab('requisitions')}
                >
                  Requisitions
                </button>
                <button
                  className={`px-3 py-2 text-sm font-medium border-b-2 ${selectedTab === 'budgets' ? 'border-coin-600 text-coin-700 dark:text-coin-400' : 'border-transparent text-gray-600 dark:text-gray-300'}`}
                  onClick={() => gotoTab('budgets')}
                >
                  Budgets
                </button>
              </div>
            </div>

            {selectedTab === 'requisitions' && (approvals.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400 mb-3">
                  There are currently no requisitions waiting for your approval.
                </p>
                <Link
                  href={route(requisitionsIndexRoute)}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  View all requisitions
                </Link>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wide">
                      Requisition
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wide">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wide">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wide">
                      Stage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wide">
                      Approver
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wide">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {approvals.map((a: any) => (
                    <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                      <td className="px-6 py-4 text-sm">
                        <Link
                          href={route(expenseShowRoute, a.expense.id)}
                          className="font-medium text-red-600 hover:text-red-800"
                        >
                          {a.expense.description || `Requisition #${a.expense.id}`}
                        </Link>
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {a.expense.category && (
                            <span className="inline-block mr-2">
                              {String(a.expense.category).replace(/_/g, ' ')}
                            </span>
                          )}
                          {a.expense.expense_date && (
                            <span>{formatDate(a.expense.expense_date)}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {formatCurrency(a.expense.amount)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {a.expense.expense_date ? formatDate(a.expense.expense_date) : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {a.stage ?? '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {a.approver?.name || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-right space-x-2">
                        <Link
                          href={route(`${prefix}.approvals.show`, a.id)}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
                        >
                          Details
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleApprove(a.id)}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(a.id)}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ))}

            {selectedTab === 'budgets' && (
              <div className="p-4">
                {budgets.data.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">No budgets found.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wide">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wide">Category</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wide">Year</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wide">Month</th>
                          <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wide">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {budgets.data.map((b: any) => (
                          <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-6 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">{b.name}</td>
                            <td className="px-6 py-3 text-sm text-gray-700 dark:text-gray-300">{b.category}</td>
                            <td className="px-6 py-3 text-sm text-gray-700 dark:text-gray-300">{b.fiscal_year}</td>
                            <td className="px-6 py-3 text-sm text-gray-700 dark:text-gray-300">{b.fiscal_month ?? '-'}</td>
                            <td className="px-6 py-3 text-sm text-right text-gray-900 dark:text-gray-100">{formatCurrency(b.budgeted_amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {budgets?.links && (
                  <div className="mt-4 flex flex-wrap gap-2 items-center justify-between">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Page {budgets?.meta?.current_page ?? ''} of {budgets?.meta?.last_page ?? ''}</div>
                    <div className="flex flex-wrap gap-2">
                      {budgets.links.filter((l: any) => l.url).map((l: any, idx: number) => (
                        <button
                          key={idx}
                          className={`px-3 py-1 rounded border dark:border-gray-700 ${l.active ? 'bg-coin-600 text-white' : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200'}`}
                          onClick={() => router.get(l.url, { tab: 'budgets' }, { preserveScroll: true, preserveState: true })}
                          dangerouslySetInnerHTML={{ __html: l.label }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
