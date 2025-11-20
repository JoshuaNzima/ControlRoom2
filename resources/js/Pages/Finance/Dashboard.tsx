import React from 'react';
import { Head } from '@inertiajs/react';
import FinanceLayout from '@/Layouts/FinanceLayout';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import FinanceDrilldownPanel from '@/Components/FinanceDrilldownPanel';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

type Props = {
  auth?: any;
  invoicesSummary?: any;
  expensesSummary?: any;
  months?: string[];
  monthlyRevenue?: number[];
  monthlyExpenses?: number[];
  budgets?: any[];
  recent?: any[];
  kpis?: any;
  aging?: any;
  topCategories?: { category: string; total: number }[];
};

export default function FinanceDashboard(props: Props) {
  const {
    auth = {} as any,
    invoicesSummary = {},
    expensesSummary = {},
    months = [],
    monthlyRevenue = [],
    monthlyExpenses = [],
    budgets = [],
    recent = [],
    kpis = {},
    aging = {},
    topCategories = [],
  } = props as any;

  const paidTotal = Number(invoicesSummary.paid || 0);
  const approvedExpensesTotal = Number(expensesSummary.approved || 0);
  const netCashflow = paidTotal - approvedExpensesTotal;
  const overdueCount = Number(invoicesSummary.overdue_count || 0);
  const overdueAmount = Number(invoicesSummary.overdue_amount || 0);

  const budgetStats = React.useMemo(
    () => {
      const list = budgets || [];
      let exceeded = 0;
      let critical = 0;
      list.forEach((b: any) => {
        const pct = Number(b.percentageSpent || 0);
        if (b.isExceeded) {
          exceeded += 1;
        } else if (pct >= 80) {
          critical += 1;
        }
      });
      return { total: list.length, exceeded, critical };
    },
    [budgets]
  );

  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalTitle, setModalTitle] = React.useState('');
  const [modalData, setModalData] = React.useState<any | null>(null);
  const chartRef = React.useRef<any>(null);

  const formatCurrencyMWK = (value: number) => {
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'MWK',
        maximumFractionDigits: 2,
      }).format(value || 0);
    } catch (e) {
      return `MWK ${Number(value || 0).toFixed(2)}`;
    }
  };
  const formatPercent = (value: number) => `${Math.round((value || 0) * 100)}%`;

  const revenueData = {
    labels: months,
    datasets: [
      {
        label: 'Revenue (Paid)',
        data: monthlyRevenue,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16,185,129,0.08)',
        tension: 0.3,
        fill: true,
      },
      {
        label: 'Expenses (Approved)',
        data: monthlyExpenses,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239,68,68,0.06)',
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: false },
      tooltip: {
        callbacks: {
          footer: function () {
            return 'Click to drill down';
          },
        },
      },
    },
    onHover: (evt: any, elements: any) => {
      try {
        const canvas = chartRef.current?.canvas || chartRef.current?.ctx?.canvas;
        if (elements && elements.length > 0) {
          if (canvas) canvas.style.cursor = 'pointer';
        } else {
          if (canvas) canvas.style.cursor = 'default';
        }
      } catch (err) {
        // ignore
      }
    },
  };

  const handleMonthClick = async (index: number) => {
    const label = months[index];
    if (!label) return;
    // label format 'Mon YYYY' (e.g., 'Nov 2025')
    const parts = label.split(' ');
    const monthName = parts[0];
    const year = Number(parts[1]);
    const month = new Date(`${monthName} 1, ${year}`).getMonth() + 1;

    setModalTitle(`Details — ${label}`);
    setModalOpen(true);
    setModalData(null);

    try {
      const res = await fetch(`/finance/drilldown/month/${year}/${month}`, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error('Failed to load');
      const json = await res.json();
      setModalData(json);
    } catch (e) {
      setModalData({ error: 'Could not load details.' });
    }
  };

  const handleBudgetClick = async (budgetId: number, budgetName?: string) => {
    setModalTitle(`Budget — ${budgetName ?? budgetId}`);
    setModalOpen(true);
    setModalData(null);
    try {
      const res = await fetch(`/finance/drilldown/budget/${budgetId}`, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error('Failed to load');
      const json = await res.json();
      setModalData(json);
    } catch (e) {
      setModalData({ error: 'Could not load budget details.' });
    }
  };

  return (
    <FinanceLayout title="Finance" user={auth?.user}>
      <Head title="Finance" />
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-lg border bg-white p-4">
              <div className="text-sm text-gray-500">Total Invoiced</div>
              <div className="text-xl font-semibold">{formatCurrencyMWK(invoicesSummary.total || 0)}</div>
            </div>
            <div className="rounded-lg border bg-white p-4">
              <div className="text-sm text-gray-500">Paid</div>
              <div className="text-xl font-semibold text-green-600">{formatCurrencyMWK(invoicesSummary.paid || 0)}</div>
            </div>
            <div className="rounded-lg border bg-white p-4">
              <div className="text-sm text-gray-500">Unpaid</div>
              <div className="text-xl font-semibold text-yellow-600">{formatCurrencyMWK(invoicesSummary.unpaid || 0)}</div>
            </div>
            <div className="rounded-lg border bg-white p-4">
              <div className="text-sm text-gray-500">Overdue</div>
              <div className="text-xl font-semibold text-red-600">{overdueCount}</div>
              <div className="text-xs text-gray-500 mt-1">
                {formatCurrencyMWK(overdueAmount)} overdue
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border bg-white p-4">
              <div className="text-sm text-gray-500">Approved Expenses</div>
              <div className="text-xl font-semibold text-red-600">
                {formatCurrencyMWK(approvedExpensesTotal)}
              </div>
            </div>
            <div className="rounded-lg border bg-white p-4">
              <div className="text-sm text-gray-500">Net Cashflow (Paid - Approved)</div>
              <div
                className={`text-xl font-semibold ${
                  netCashflow >= 0 ? 'text-emerald-600' : 'text-red-600'
                }`}
              >
                {formatCurrencyMWK(netCashflow)}
              </div>
            </div>
          </div>

          {/* Additional KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="rounded-lg border bg-white p-4">
              <div className="text-sm text-gray-500">Invoices</div>
              <div className="text-xl font-semibold">{Number(kpis.invoices_count || 0)}</div>
            </div>
            <div className="rounded-lg border bg-white p-4">
              <div className="text-sm text-gray-500">Avg Invoice</div>
              <div className="text-xl font-semibold">{formatCurrencyMWK(kpis.avg_invoice || 0)}</div>
            </div>
            <div className="rounded-lg border bg-white p-4">
              <div className="text-sm text-gray-500">Collection Rate</div>
              <div className="text-xl font-semibold text-emerald-600">{formatPercent(kpis.collection_rate || 0)}</div>
            </div>
            <div className="rounded-lg border bg-white p-4">
              <div className="text-sm text-gray-500">Due next 30d</div>
              <div className="text-xl font-semibold text-yellow-700">{formatCurrencyMWK(kpis.upcoming_due_30d || 0)}</div>
            </div>
            <div className="rounded-lg border bg-white p-4">
              <div className="text-sm text-gray-500">Expense Run Rate (daily)</div>
              <div className="text-xl font-semibold text-red-600">{formatCurrencyMWK(kpis.expenses_run_rate_daily || 0)}</div>
            </div>
          </div>

          <div className="rounded-lg border bg-white p-6">
            <h2 className="text-lg font-medium mb-4">Revenue vs Expenses (Last 12 months)</h2>
            <div>
              {/* Use a ref and native event to get elements at click */}
              {/** @ts-ignore */}
              <Line
                ref={(el: any) => (chartRef.current = el)}
                options={chartOptions}
                data={revenueData}
                onClick={(e: any) => {
                  try {
                    const native = e?.nativeEvent || e;
                    const points = chartRef.current?.getElementsAtEventForMode(native, 'nearest', { intersect: true }, true) || [];
                    if (points.length) {
                      const index = points[0].index;
                      handleMonthClick(index);
                    }
                  } catch (err) {
                    // ignore
                  }
                }}
                
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-md font-semibold mb-4">Active Budgets</h3>
              {budgets.length > 0 && (
                <div className="mb-3 text-xs text-gray-600">
                  {budgetStats.exceeded} exceeded / {budgetStats.critical} at risk (&gt;= 80%)
                </div>
              )}
              <div className="space-y-3">
                {budgets.length === 0 && <div className="text-sm text-gray-500">No active budgets</div>}
                {budgets.map((b: any) => {
                  const pct = Number(b.percentageSpent || 0);
                  const isExceeded = !!b.isExceeded;
                  const isCritical = !isExceeded && pct >= 80;
                  const borderClass = isExceeded ? 'border-red-200 bg-red-50' : isCritical ? 'border-yellow-200 bg-yellow-50' : 'border-green-100 bg-white';
                  return (
                    <div key={b.id} className={`rounded p-3 border ${borderClass}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-sm font-medium">{b.name}</div>
                          <div className="text-xs text-gray-500">{b.category}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm">{formatCurrencyMWK(b.budgeted_amount || 0)}</div>
                          <div className="text-xs text-gray-500">Budgeted</div>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="w-2/3">
                          <div className="w-full bg-gray-100 rounded h-2 overflow-hidden">
                            <div
                              style={{ width: `${Math.min(100, pct)}%` }}
                              className={`h-2 ${isExceeded ? 'bg-red-500' : isCritical ? 'bg-yellow-500' : 'bg-green-500'}`}
                            />
                          </div>
                          <div className="text-xs text-gray-500 mt-1">{pct.toFixed(0)}% used</div>
                        </div>
                        <div className="w-1/3 text-right">
                          <div className="text-sm">{formatCurrencyMWK(b.spent || 0)}</div>
                          <div className="text-xs text-gray-500">Spent</div>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <div>
                          {isExceeded && <span className="text-xs text-red-700 font-semibold">Budget exceeded</span>}
                          {!isExceeded && isCritical && <span className="text-xs text-yellow-700 font-semibold">At or above 80% of budget</span>}
                        </div>
                        <div>
                          <button onClick={() => handleBudgetClick(b.id, b.name)} className="text-sm px-2 py-1 rounded bg-red-100 text-red-800">View details</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-lg border bg-white p-6 lg:col-span-2">
              <h3 className="text-md font-semibold mb-4">Recent Activity</h3>
              <div className="divide-y">
                {recent.length === 0 && <div className="text-sm text-gray-500">No recent finance activity</div>}
                {recent.map((r: any, idx: number) => (
                  <div key={`${r.type}-${r.id}-${idx}`} className="py-3 flex justify-between items-center">
                    <div>
                      <div className="text-sm font-medium">{r.type === 'expense' ? 'Expense' : 'Invoice'} #{r.id}</div>
                      <div className="text-xs text-gray-500">{r.user ? `${r.user} — ` : ''}{r.date}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm ${r.type === 'expense' ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrencyMWK(r.amount || 0)}
                      </div>
                      {r.status && <div className="text-xs text-gray-500">{r.status}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Aging and Top Categories */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-md font-semibold mb-3">A/R Aging</h3>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-gray-500">Current</dt>
                  <dd className="font-medium">{formatCurrencyMWK(aging.current || 0)}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">1–30</dt>
                  <dd className="font-medium">{formatCurrencyMWK(aging.one_to_30 || 0)}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">31–60</dt>
                  <dd className="font-medium">{formatCurrencyMWK(aging.thirty_one_to_60 || 0)}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">61–90</dt>
                  <dd className="font-medium">{formatCurrencyMWK(aging.sixty_one_to_90 || 0)}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">90+</dt>
                  <dd className="font-medium">{formatCurrencyMWK(aging.over_90 || 0)}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-lg border bg-white p-6 lg:col-span-2">
              <h3 className="text-md font-semibold mb-3">Top Expense Categories</h3>
              {topCategories.length === 0 ? (
                <div className="text-sm text-gray-500">No data</div>
              ) : (
                <ul className="divide-y">
                  {topCategories.map((c: { category: string; total: number }) => (
                    <li key={c.category} className="py-2 flex justify-between text-sm">
                      <span className="text-gray-700">{String(c.category).replace(/_/g, ' ')}</span>
                      <span className="font-medium">{formatCurrencyMWK(c.total)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <FinanceDrilldownPanel open={modalOpen} title={modalTitle} data={modalData} onClose={() => setModalOpen(false)} />
        </div>
      </div>
    </FinanceLayout>
  );
}


