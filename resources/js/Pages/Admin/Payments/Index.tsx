import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import Modal from '@/Components/Modal';
import { formatCurrencyMWK } from '@/Components/format';
import { SortIcon } from '@/Components/ui/icons/SortIcon';
import { PaymentLegend } from '@/Components/ui/PaymentLegend';
import { Pagination } from '@/Components/ui/Pagination';

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

type MonthState = { paid: boolean; amount_due: number; amount_paid: number; prepaid_amount?: number };
interface Filters {
  search: string;
  site_id: string;
  zone_id?: string;
  status: 'all' | 'late' | 'paid';
  sort_field: string;
  sort_direction: 'asc' | 'desc';
  page: number;
  per_page: number | string;
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
  payments: Record<string, Record<number, MonthState>>;
  flags?: Record<string, boolean>;
  summaries?: Record<string, { expected_amount: number; total_paid: number; outstanding_amount: number; outstanding_months: number; billing_start?: string | null }>;
  sites: Site[];
  zones?: Array<{ id: number; name: string }>;
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
  zones = [],
  filters = {
    search: '',
    site_id: '',
    status: 'all',
    sort_field: 'name',
    sort_direction: 'asc',
    page: 1,
    per_page: 20,
  }
}: Props & { overallSummary: OverallSummary }) {
  const [selectedYear, setSelectedYear] = useState<number>(year);
  const [searchText, setSearchText] = useState<string>(filters.search ?? '');

  const handleFilterChange = (newFilters: Partial<Filters>) => {
    router.get(route('admin.payments.index'), { 
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

  const [prepayModalOpen, setPrepayModalOpen] = useState(false);
  const [prepayClientId, setPrepayClientId] = useState<number | null>(null);
  const [prepayMonth, setPrepayMonth] = useState<number | null>(null);
  const [prepayAmountInput, setPrepayAmountInput] = useState<string>('');

  const openPrepayModal = (clientId: number, month: number) => {
    setPrepayClientId(clientId);
    setPrepayMonth(month);
    setPrepayAmountInput('');
    setPrepayModalOpen(true);
  };

  const submitPrepay = () => {
    if (!prepayClientId || !prepayMonth) return;
    const amount = prepayAmountInput !== '' ? parseFloat(prepayAmountInput) : undefined;
    router.post(route('admin.payments.toggle'), { client_id: prepayClientId, year: selectedYear, month: prepayMonth, amount }, { preserveScroll: true });
    setPrepayModalOpen(false);
  };

  const toggle = (clientId: number, month: number) => {
    const now = new Date();
    const isFuture = (selectedYear > now.getFullYear()) || (selectedYear === now.getFullYear() && month > (now.getMonth() + 1));
    if (isFuture) {
      openPrepayModal(clientId, month);
      return;
    }
    router.post(route('admin.payments.toggle'), { client_id: clientId, year: selectedYear, month }, { preserveScroll: true });
  };

  // Normalize clients payload for resilience
  const defaultMeta: PaginationMeta = { current_page: 1, last_page: 1, per_page: 20, total: 0, from: 0, to: 0 };
  const clientData: Client[] = Array.isArray(clients) ? (clients as unknown as Client[]) : (clients?.data ?? []);
  const meta: PaginationMeta = Array.isArray(clients) ? defaultMeta : (clients?.meta ?? defaultMeta);

  // Debounce search input
  useEffect(() => {
    const id = setTimeout(() => {
      if (searchText !== (filters.search ?? '')) {
        router.get(
          route('admin.payments.index'),
          { ...filters, search: searchText, page: 1, year: selectedYear },
          { preserveState: true, preserveScroll: true }
        );
      }
    }, 350);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText, selectedYear]);

  const clearFilter = (key: keyof Filters) => {
    if (key === 'search') {
      setSearchText('');
      handleFilterChange({ search: '', page: 1 });
      return;
    }
    if (key === 'per_page') {
      handleFilterChange({ per_page: 20 as any, page: 1 });
      return;
    }
    const payload: any = { page: 1 };
    payload[key] = '';
    handleFilterChange(payload);
  };

  return (
    <AdminLayout title="Payments Checker">
      <Head title="Payments Checker" />

      <Modal show={prepayModalOpen} onClose={() => setPrepayModalOpen(false)} maxWidth="sm">
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-2">Prepay Month</h3>
          <div className="mb-2 text-sm text-gray-600">Enter an amount to prepay for the selected future month. Leave blank to prepay the full month rate.</div>
          <input
            type="number"
            step="0.01"
            className="w-full px-3 py-2 border rounded mb-3"
            value={prepayAmountInput}
            onChange={(e) => setPrepayAmountInput(e.target.value)}
            placeholder="Amount (e.g. 1000.00)"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setPrepayModalOpen(false)}>Cancel</Button>
            <Button onClick={submitPrepay}>Prepay</Button>
          </div>
        </div>
      </Modal>

      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <Card className="p-4">
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

          {/* Main Payments Table Card */}
          <Card className="relative">
            {/* Sticky toolbar */}
            <div className="sticky top-0 z-10 bg-white border-b">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-xl font-semibold text-gray-900">Client Payments</h1>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => handleYearChange(-1)}>&laquo; {selectedYear - 1}</Button>
                    <div className="text-lg font-bold w-24 text-center">{selectedYear}</div>
                    <Button variant="outline" onClick={() => handleYearChange(1)}>{selectedYear + 1} &raquo;</Button>
                  </div>
                </div>
              
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-center gap-4">
                    {/* Search with clear button */}
                    <div className="flex-1 min-w-[200px] relative">
                      <input
                        type="text"
                        placeholder="Search clients..."
                        className="w-full pr-10 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                      />
                      {searchText && (
                        <button
                          onClick={() => clearFilter('search')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          aria-label="Clear search"
                        >
                          ×
                        </button>
                      )}
                    </div>

                    {/* Filter controls */}
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">Zone</label>
                        <select
                          className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={String(filters.zone_id ?? '')}
                          onChange={(e) => handleFilterChange({ zone_id: e.target.value, page: 1 })}
                        >
                          <option value="">All Zones</option>
                          {zones.map(z => (
                            <option key={z.id} value={z.id}>{z.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">Per page</label>
                        <select
                          className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={String(filters.per_page ?? 20)}
                          onChange={(e) => handleFilterChange({ per_page: e.target.value, page: 1 })}
                        >
                          <option value="10">10</option>
                          <option value="20">20</option>
                          <option value="50">50</option>
                          <option value="100">100</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">Status</label>
                        <select
                          className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={filters.status}
                          onChange={(e) => handleFilterChange({ status: e.target.value as 'all' | 'late' | 'paid', page: 1 })}
                        >
                          <option value="all">All Clients</option>
                          <option value="late">Late Payments</option>
                          <option value="paid">Fully Paid</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Active filter chips */}
                  <div className="flex flex-wrap items-center gap-2">
                    {filters.zone_id && (
                      <button
                        onClick={() => clearFilter('zone_id')}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-sm text-blue-700 hover:bg-blue-100"
                      >
                        Zone: {zones.find(z => String(z.id) === String(filters.zone_id))?.name ?? filters.zone_id}
                        <span className="ml-1">×</span>
                      </button>
                    )}
                    {filters.status !== 'all' && (
                      <button
                        onClick={() => clearFilter('status')}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-sm text-blue-700 hover:bg-blue-100"
                      >
                        Status: {filters.status}
                        <span className="ml-1">×</span>
                      </button>
                    )}
                    {String(filters.per_page) !== '20' && (
                      <button
                        onClick={() => clearFilter('per_page')}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-sm text-blue-700 hover:bg-blue-100"
                      >
                        {filters.per_page} per page
                        <span className="ml-1">×</span>
                      </button>
                    )}
                    {filters.search && (
                      <button
                        onClick={() => clearFilter('search')}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-sm text-blue-700 hover:bg-blue-100"
                      >
                        "{filters.search}"
                        <span className="ml-1">×</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4">
              <div className="overflow-x-auto">
                <table className="min-w-full border">
                  <thead>
                    <tr className="bg-gray-50">
                      <th 
                        onClick={() => handleFilterChange({ 
                          sort_field: 'name',
                          sort_direction: filters.sort_field === 'name' && filters.sort_direction === 'asc' ? 'desc' : 'asc'
                        })}
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
                        onClick={() => handleFilterChange({
                          sort_field: 'expected_amount',
                          sort_direction: filters.sort_field === 'expected_amount' && filters.sort_direction === 'asc' ? 'desc' : 'asc'
                        })}
                        className="px-2 py-2 text-xs font-semibold text-gray-600 border text-center cursor-pointer hover:bg-gray-50"
                      >
                        <div className="flex items-center justify-center gap-2">
                          Expected Amount
                          <SortIcon direction={filters.sort_field === 'expected_amount' ? filters.sort_direction : null} />
                        </div>
                      </th>
                      <th className="px-2 py-2 text-xs font-semibold text-gray-600 border text-center">Amount Paid</th>
                      <th
                        onClick={() => handleFilterChange({
                          sort_field: 'outstanding_amount',
                          sort_direction: filters.sort_field === 'outstanding_amount' && filters.sort_direction === 'asc' ? 'desc' : 'asc'
                        })}
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
                            const prepaid = !!(clientPayments[month]?.prepaid_amount && clientPayments[month]?.prepaid_amount > 0);
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
                                      paid ? 'bg-green-500 text-white' : (prepaid ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}
                                    ${isBillingStart ? 'ring-2 ring-blue-500' : ''}
                                  `}
                                  aria-pressed={paid}
                                  aria-label={`Mark ${months[idx]} paid for ${c.name}`}
                                  title={
                                    prepaid ? `Prepaid: ${formatCurrencyMWK(clientPayments[month]?.prepaid_amount || 0)}` : (isBillingStart ? 'Billing Start' : undefined)
                                  }
                                >
                                  {paid ? '✓' : (prepaid ? 'P' : '')}
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

              {/* Payment Status Legend */}
              <div className="mt-4">
                <PaymentLegend />
              </div>

              {/* Use shared pagination component */}
              <div className="mt-4">
                <Pagination
                  currentPage={meta.current_page}
                  lastPage={meta.last_page}
                  total={meta.total}
                  perPage={meta.per_page}
                  from={meta.from}
                  to={meta.to}
                  baseUrl={route('admin.payments.index')}
                  filters={{ ...filters, year: selectedYear }}
                />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}


