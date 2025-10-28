import React from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { formatCurrencyMWK } from '@/Components/format';
import { SortIcon } from '@/Components/ui/icons/SortIcon';
import { PaymentLegend } from '@/Components/ui/PaymentLegend';

type Site = {
  id: number;
  name: string;
  address: string;
};

type Client = { 
  id: number; 
  name: string; 
  contract_start_date?: string | null; 
  contract_end_date?: string | null; 
  monthly_rate?: number;
  created_at?: string | null;
  billing_start_date?: string | null;
  sites: Site[];
};

type MonthState = { paid: boolean; amount_due: number; amount_paid: number };
interface Filters {
  search: string;
  site_id: string;
  status: 'all' | 'late' | 'paid';
  sort_field: string;
  sort_direction: 'asc' | 'desc';
  page: number;
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

interface Props {
  year: number;
  clients: {
    data: Client[];
    meta: PaginationMeta;
  };
  payments: Record<string, Record<number, MonthState>>; // client_id -> month -> state
  flags?: Record<string, boolean>;
  summaries?: Record<string, { expected_amount: number; total_paid: number; outstanding_amount: number; outstanding_months: number; billing_start?: string | null }>;
  sites: Site[];
  filters: Filters;
}

const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

interface OverallSummary {
  total_clients: number;
  clients_with_outstanding: number;
  clients_overdue_percentage: number;
  total_outstanding: number;
  max_outstanding_months: number;
  overdue_clients: Array<{
    id: number;
    name: string;
    outstanding_amount: number;
    outstanding_months: number;
  }>;
  total_due: number;
  total_paid: number;
  collection_rate: number;
}

export default function PaymentsIndex({ 
  year, 
  // Align default per_page with server default (20)
  clients = { data: [], meta: { current_page: 1, last_page: 1, per_page: 20, total: 0, from: 0, to: 0 } }, 
  payments, 
  flags = {}, 
  summaries = {}, 
  overallSummary = {
    total_clients: 0,
    clients_with_outstanding: 0,
    clients_overdue_percentage: 0,
    total_outstanding: 0,
    max_outstanding_months: 0,
    overdue_clients: [],
    total_due: 0,
    total_paid: 0,
    collection_rate: 0
  },
  sites = [],
  filters = {
    search: '',
    site_id: '',
    status: 'all',
    sort_field: 'name',
    sort_direction: 'asc',
    page: 1
  }
}: Props & { overallSummary: OverallSummary }) {
  const [selectedYear, setSelectedYear] = React.useState<number>(year);

  const handlePageChange = (page: number) => {
    router.get('/admin/payments', { ...filters, page }, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  const handleFilterChange = (newFilters: Partial<Filters>) => {
    router.get('/admin/payments', { 
      ...filters,
      ...newFilters,
      year: selectedYear.toString(),
    }, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  const handleYearChange = (delta: number) => {
    const newYear = selectedYear + delta;
    setSelectedYear(newYear);
    router.get(route('admin.payments.index'), { year: newYear }, { preserveScroll: true, preserveState: true });
  };

  const toggle = (clientId: number, month: number) => {
    router.post(route('admin.payments.toggle'), { client_id: clientId, year: selectedYear, month }, { preserveScroll: true });
  };

  // Normalize clients payload so UI is resilient whether the server sends a paginator
  // or a plain array. This prevents trying to read `.meta` when it's undefined.
  const defaultMeta: PaginationMeta = { current_page: 1, last_page: 1, per_page: 20, total: 0, from: 0, to: 0 };
  const clientData: Client[] = Array.isArray(clients) ? (clients as unknown as Client[]) : (clients?.data ?? []);
  const meta: PaginationMeta = Array.isArray(clients) ? defaultMeta : (clients?.meta ?? defaultMeta);

  return (
    <AdminLayout title="Payments Checker">
      <Head title="Payments Checker" />

      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="p-4 bg-white">
              <div className="flex flex-col">
                <div className="text-sm text-gray-500">Outstanding Balance</div>
                <div className="text-2xl font-bold text-gray-900">{formatCurrencyMWK(overallSummary.total_outstanding)}</div>
                <div className="mt-1 text-xs text-gray-400">
                  Collection Rate: {overallSummary.collection_rate}%
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-white">
              <div className="flex flex-col">
                <div className="text-sm text-gray-500">Clients with Outstanding</div>
                <div className="text-2xl font-bold text-gray-900">{overallSummary.clients_with_outstanding} / {overallSummary.total_clients}</div>
                <div className="mt-1 text-xs text-gray-400">
                  {overallSummary.clients_overdue_percentage}% of clients have outstanding balance
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-white">
              <div className="flex flex-col">
                <div className="text-sm text-gray-500">Max Outstanding Duration</div>
                <div className="text-2xl font-bold text-gray-900">{overallSummary.max_outstanding_months} months</div>
                <div className="mt-1 text-xs text-gray-400">
                  Longest period without payment
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-white">
              <div className="flex flex-col">
                <div className="text-sm text-gray-500">Total Amount Due</div>
                <div className="text-2xl font-bold text-gray-900">{formatCurrencyMWK(overallSummary.total_due)}</div>
                <div className="mt-1 text-xs text-gray-400">
                  Paid: {formatCurrencyMWK(overallSummary.total_paid)}
                </div>
              </div>
            </Card>
          </div>

          {/* Top Overdue Clients */}
          {overallSummary.overdue_clients.length > 0 && (
            <Card className="p-4 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Overdue Accounts</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {overallSummary.overdue_clients.map(client => (
                  <div key={client.id} className="p-3 rounded-lg border bg-red-50 border-red-100">
                    <div className="font-medium text-gray-900">{client.name}</div>
                    <div className="text-sm text-red-600 font-semibold mt-1">
                      {formatCurrencyMWK(client.outstanding_amount)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Outstanding for {client.outstanding_months} months
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card className="p-4">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold text-gray-900">Client Payments</h1>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => handleYearChange(-1)}>&laquo; {selectedYear - 1}</Button>
                  <div className="text-lg font-bold w-24 text-center">{selectedYear}</div>
                  <Button variant="outline" onClick={() => handleYearChange(1)}>{selectedYear + 1} &raquo;</Button>
                </div>
              </div>
              
              <div className="flex flex-col gap-4 pb-6">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <input
                      type="text"
                      placeholder="Search clients..."
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onChange={(e) => {
                        router.get(
                          route('admin.payments.index'),
                          { ...filters, search: e.target.value },
                          { preserveState: true }
                        );
                      }}
                      value={filters.search ?? ''}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={filters.site_id || ''}
                      onChange={(e) => {
                        router.get(
                          route('admin.payments.index'),
                          { ...filters, site_id: e.target.value },
                          { preserveState: true }
                        );
                      }}
                    >
                      <option value="">All Sites</option>
                      {sites.map(site => (
                        <option key={site.id} value={site.id}>{site.name} - {site.address}</option>
                      ))}
                    </select>
                    <select
                      className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={filters.status}
                      onChange={(e) => {
                        handleFilterChange({ status: e.target.value as 'all' | 'late' | 'paid' });
                      }}
                    >
                      <option value="all">All Clients</option>
                      <option value="late">Late Payments</option>
                      <option value="paid">Fully Paid</option>
                    </select>
                  </div>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                  <div className="flex flex-1 justify-between sm:hidden">
                      <button
                        onClick={() => handlePageChange(meta.current_page - 1)}
                        disabled={meta.current_page === 1}
                        className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => handlePageChange(meta.current_page + 1)}
                        disabled={meta.current_page === meta.last_page}
                        className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Next
                      </button>
                    </div>
                  <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{meta.from}</span> to{' '}
                        <span className="font-medium">{meta.to}</span> of{' '}
                        <span className="font-medium">{meta.total}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                        <button
                          onClick={() => handlePageChange(meta.current_page - 1)}
                          disabled={meta.current_page === 1}
                          className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                        >
                          <span className="sr-only">Previous</span>
                          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                          </svg>
                        </button>
                        {[...Array(meta.last_page)].map((_, index) => {
                          const page = index + 1;
                          const isActive = page === meta.current_page;
                          return (
                            <button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                                isActive
                                  ? 'z-10 bg-indigo-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                                  : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        })}
                        <button
                          onClick={() => handlePageChange(meta.current_page + 1)}
                          disabled={meta.current_page === meta.last_page}
                          className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                        >
                          <span className="sr-only">Next</span>
                          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
                
                {/* Payment Status Legend */}
                <PaymentLegend />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border">
                <thead>
                  <tr className="bg-gray-50">
                    <th 
                      onClick={() => {
                        router.get(
                          route('admin.payments.index'),
                          { 
                            ...filters,
                            sort_field: 'name',
                            sort_direction: filters.sort_field === 'name' && filters.sort_direction === 'asc' ? 'desc' : 'asc'
                          },
                          { preserveState: true }
                        );
                      }}
                      className="px-3 py-2 text-left text-xs font-semibold text-gray-600 border cursor-pointer hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-2">
                        Client
                        <SortIcon direction={filters.sort_field === 'name' ? filters.sort_direction : null} />
                      </div>
                    </th>
                    {months.map((m, idx) => (
                      <th key={m} className="px-2 py-2 text-xs font-semibold text-gray-600 border text-center">{m}</th>
                    ))}
                    <th
                      onClick={() => {
                        router.get(
                          route('admin.payments.index'),
                          {
                            ...filters,
                            sort_field: 'expected_amount',
                            sort_direction: filters.sort_field === 'expected_amount' && filters.sort_direction === 'asc' ? 'desc' : 'asc'
                          },
                          { preserveState: true }
                        );
                      }}
                      className="px-2 py-2 text-xs font-semibold text-gray-600 border text-center cursor-pointer hover:bg-gray-50"
                    >
                      <div className="flex items-center justify-center gap-2">
                        Expected Amount
                        <SortIcon direction={filters.sort_field === 'expected_amount' ? filters.sort_direction : null} />
                      </div>
                    </th>
                    <th className="px-2 py-2 text-xs font-semibold text-gray-600 border text-center">Amount Paid</th>
                    <th
                      onClick={() => {
                        router.get(
                          route('admin.payments.index'),
                          {
                            ...filters,
                            sort_field: 'outstanding_amount',
                            sort_direction: filters.sort_field === 'outstanding_amount' && filters.sort_direction === 'asc' ? 'desc' : 'asc'
                          },
                          { preserveState: true }
                        );
                      }}
                      className="px-2 py-2 text-xs font-semibold text-gray-600 border text-center cursor-pointer hover:bg-gray-50"
                    >
                      <div className="flex items-center justify-center gap-2">
                        Outstanding
                        <SortIcon direction={filters.sort_field === 'outstanding_amount' ? filters.sort_direction : null} />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {clientData.map((c: Client) => {
                    const clientPayments = payments[String(c.id)] || {} as Record<number, MonthState>;
                    const monthlyRate = (c as any).monthly_rate ?? 0;
                    const summary = (summaries || {})[String(c.id)] || null;
                    const startDate = c.contract_start_date ? new Date(c.contract_start_date) : (c.created_at ? new Date(c.created_at) : null);
                    const billingStartMonth = startDate ? startDate.getMonth() : -1;
                    const billingStartYear = startDate ? startDate.getFullYear() : 0;
                    const isOverdue = flags[String(c.id)];
                    const outstandingMonths = summary?.outstanding_months ?? 0;
                    
                    return (
                      <tr key={c.id} className={`${isOverdue ? 'bg-red-50/80 hover:bg-red-100/90' : 'odd:bg-white even:bg-gray-50 hover:bg-gray-100'} transition-colors group`} title={isOverdue ? `${outstandingMonths} months overdue` : ''}>
                        <td className={`px-3 py-2 text-sm border whitespace-nowrap ${isOverdue ? 'text-red-900 font-semibold' : 'text-gray-900'}`}>
                          <div className="flex items-center gap-2">
                            <span className="group-hover:underline">{c.name}</span>
                            {isOverdue && (
                              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title={`${outstandingMonths} months overdue`} />
                            )}
                          </div>
                        </td>
                        {months.map((_, idx) => {
                          const month = idx + 1;
                          const paid = !!clientPayments[month]?.paid;
                          const isBillingStart = selectedYear === billingStartYear && month === billingStartMonth + 1;
                          const isBeforeBillingStart = startDate ? (
                            selectedYear < billingStartYear || 
                            (selectedYear === billingStartYear && month <= billingStartMonth)
                          ) : false;
                          
                          return (
                            <td key={month} className="px-2 py-2 border text-center">
                              <button
                                onClick={() => toggle(c.id, month)}
                                disabled={isBeforeBillingStart}
                                className={`
                                  inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition
                                  ${isBeforeBillingStart ? 'bg-gray-50 text-gray-300 cursor-not-allowed' : 
                                    paid ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
                                  ${isBillingStart ? 'ring-2 ring-blue-500' : ''}
                                `}
                                aria-pressed={paid}
                                aria-label={`Mark ${months[idx]} paid for ${c.name}`}
                                title={isBillingStart ? 'Billing Start' : undefined}
                              >
                                {paid ? '✓' : ''}
                                {isBillingStart && !paid ? '★' : ''}
                              </button>
                            </td>
                          );
                        })}
                        <td className="px-2 py-2 border text-center text-sm">
                          {formatCurrencyMWK(summary?.expected_amount ?? (monthlyRate || 0))}
                        </td>
                        <td className="px-2 py-2 border text-center text-sm font-semibold">
                          {formatCurrencyMWK(summary?.total_paid ?? Object.values(clientPayments).reduce((sum, s) => sum + (s?.amount_paid || 0), 0))}
                        </td>
                        <td className={`px-2 py-2 border text-center text-sm ${isOverdue ? 'font-bold text-red-700' : 'font-semibold text-red-600'} ${isOverdue ? 'group-hover:scale-105' : ''} transition-transform`}>
                          {formatCurrencyMWK(summary?.outstanding_amount ?? 0)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}


