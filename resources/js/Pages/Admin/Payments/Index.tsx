import React, { useState, useEffect, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import Modal from '@/Components/Modal';
import { formatCurrencyMWK } from '@/Components/format';
import { SortIcon } from '@/Components/ui/icons/SortIcon';
import { PaymentLegend } from '@/Components/ui/PaymentLegend';
import { Pagination } from '@/Components/ui/Pagination';
import { StatCard } from '@/Components/StatCard';
import { ActionTile } from '@/Components/ActionTile';
import IconMapper from '@/Components/IconMapper';

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

  // Normalize clients payload for resilience (supports Laravel paginator top-level keys or meta object)
  const defaultMeta: PaginationMeta = { current_page: 1, last_page: 1, per_page: 20, total: 0, from: 0, to: 0 };
  const rawClients: any = clients as any;
  const clientData: Client[] = Array.isArray(rawClients) ? (rawClients as unknown as Client[]) : (rawClients?.data ?? []);
  const metaFromTop: PaginationMeta | null = rawClients && typeof rawClients === 'object' && !Array.isArray(rawClients) && (rawClients.current_page || rawClients.last_page || rawClients.total)
    ? {
        current_page: Number(rawClients.current_page ?? 1),
        last_page: Number(rawClients.last_page ?? 1),
        per_page: Number(rawClients.per_page ?? filters.per_page ?? 20),
        total: Number(rawClients.total ?? clientData.length ?? 0),
        from: Number(rawClients.from ?? ((clientData.length > 0 && rawClients.current_page && rawClients.per_page) ? ((Number(rawClients.current_page) - 1) * Number(rawClients.per_page) + 1) : 0)),
        to: Number(rawClients.to ?? ((rawClients.from && clientData.length) ? (Number(rawClients.from) + clientData.length - 1) : (clientData.length || 0))),
      }
    : null;
  const meta: PaginationMeta = Array.isArray(rawClients) ? defaultMeta : (rawClients?.meta ?? metaFromTop ?? defaultMeta);

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
    <AuthenticatedLayout header="Payments Checker">
      <Head title="Payments Checker" />

      <Modal show={prepayModalOpen} onClose={() => setPrepayModalOpen(false)} maxWidth="sm">
        <div className="p-4 text-gray-900 dark:text-gray-100">
          <h3 className="text-lg font-semibold mb-2">Prepay Month</h3>
          <div className="mb-2 text-sm text-gray-600 dark:text-gray-300">Enter an amount to prepay for the selected future month. Leave blank to prepay the full month rate.</div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">MWK</span>
            <input
              type="text"
              className="w-full pl-12 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded mb-3 text-right bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-coin-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950"
              value={prepayAmountInput}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9.]/g, '');
                if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
                  setPrepayAmountInput(value);
                }
              }}
              placeholder="0.00"
            />
          </div>
          {prepayAmountInput && (
            <div className="mb-3 text-sm text-gray-600 dark:text-gray-300 text-right">
              {formatCurrencyMWK(parseFloat(prepayAmountInput) || 0)}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setPrepayModalOpen(false)}>Cancel</Button>
            <Button onClick={submitPrepay}>Prepay</Button>
          </div>
        </div>
      </Modal>

      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Hero Header */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-700 via-red-600 to-rose-600 text-white shadow-2xl">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20" />
            <div className="relative p-6 sm:p-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                    <IconMapper name="DollarSign" size={32} />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold">Payments Checker</h1>
                    <p className="text-red-100 mt-1">Track client payments and outstanding balances</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="px-4 py-2 bg-white/10 rounded-lg backdrop-blur-sm">
                    <p className="text-xs text-red-200">Current Year</p>
                    <p className="text-lg font-semibold">{selectedYear}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* StatCards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={<IconMapper name="AlertTriangle" size={24} />}
              title="Outstanding"
              value={overallSummary.total_outstanding || 0}
              subtitle={`${overallSummary.clients_with_outstanding || 0} clients`}
              color="red"
              isCurrency
            />
            <StatCard
              icon={<IconMapper name="Users" size={24} />}
              title="Total Clients"
              value={overallSummary.total_clients || 0}
              subtitle={`${overallSummary.clients_with_outstanding || 0} with outstanding`}
              color="blue"
            />
            <StatCard
              icon={<IconMapper name="TrendingUp" size={24} />}
              title="Collection Rate"
              value={`${overallSummary.collection_rate || 0}%`}
              subtitle="Payment efficiency"
              color="green"
            />
            <StatCard
              icon={<IconMapper name="Clock" size={24} />}
              title="Max Overdue"
              value={`${overallSummary.max_outstanding_months || 0} months`}
              subtitle="Longest duration"
              color="amber"
            />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <ActionTile
              icon={<IconMapper name="Download" size={18} />}
              title="Export Report"
              description="Download payment data"
              color="bg-purple-600"
              onClick={() => {}}
            />
            <ActionTile
              icon={<IconMapper name="RefreshCw" size={18} />}
              title="Refresh Data"
              description="Reload current view"
              color="bg-emerald-600"
              onClick={() => router.reload()}
            />
            <ActionTile
              icon={<IconMapper name="Filter" size={18} />}
              title="Late Payments"
              description="View overdue clients"
              href={route('admin.payments.index', { status: 'late', year: selectedYear })}
              color="bg-red-600"
            />
            <ActionTile
              icon={<IconMapper name="CheckCircle" size={18} />}
              title="Paid Clients"
              description="Fully paid clients"
              href={route('admin.payments.index', { status: 'paid', year: selectedYear })}
              color="bg-blue-600"
            />
          </div>

          {/* Top Overdue Clients */}
          {overallSummary.overdue_clients.length > 0 && (
            <Card className="p-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Top Overdue Accounts</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {overallSummary.overdue_clients.map(client => (
                  <div key={client.id} className="p-3 rounded-lg border bg-red-50 border-red-100 dark:bg-red-900/20 dark:border-red-900/30">
                    <div className="font-medium text-gray-900 dark:text-gray-100">{client.name}</div>
                    <div className="text-sm text-red-600 dark:text-red-300 font-semibold mt-1">
                      {formatCurrencyMWK(client.outstanding_amount)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
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
            <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Client Payments</h1>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => handleYearChange(-1)}>&laquo; {selectedYear - 1}</Button>
                    <div className="text-lg font-bold w-24 text-center text-gray-900 dark:text-gray-100">{selectedYear}</div>
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
                        className="w-full pr-10 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-coin-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                      />
                      {searchText && (
                        <button
                          onClick={() => clearFilter('search')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-coin-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950 rounded"
                          aria-label="Clear search"
                        >
                          ×
                        </button>
                      )}
                    </div>

                    {/* Filter controls */}
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600 dark:text-gray-300">Zone</label>
                        <select
                          className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-coin-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
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
                        <label className="text-sm text-gray-600 dark:text-gray-300">Per page</label>
                        <select
                          className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-coin-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
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
                        <label className="text-sm text-gray-600 dark:text-gray-300">Status</label>
                        <select
                          className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-coin-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
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
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-coin-50 dark:bg-coin-900/30 text-sm text-coin-800 dark:text-coin-200 hover:bg-coin-100 dark:hover:bg-coin-900/50 focus:outline-none focus:ring-2 focus:ring-coin-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950"
                      >
                        Zone: {zones.find(z => String(z.id) === String(filters.zone_id))?.name ?? filters.zone_id}
                        <span className="ml-1">×</span>
                      </button>
                    )}
                    {filters.status !== 'all' && (
                      <button
                        onClick={() => clearFilter('status')}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-coin-50 dark:bg-coin-900/30 text-sm text-coin-800 dark:text-coin-200 hover:bg-coin-100 dark:hover:bg-coin-900/50 focus:outline-none focus:ring-2 focus:ring-coin-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950"
                      >
                        Status: {filters.status}
                        <span className="ml-1">×</span>
                      </button>
                    )}
                    {String(filters.per_page) !== '20' && (
                      <button
                        onClick={() => clearFilter('per_page')}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-coin-50 dark:bg-coin-900/30 text-sm text-coin-800 dark:text-coin-200 hover:bg-coin-100 dark:hover:bg-coin-900/50 focus:outline-none focus:ring-2 focus:ring-coin-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950"
                      >
                        {filters.per_page} per page
                        <span className="ml-1">×</span>
                      </button>
                    )}
                    {filters.search && (
                      <button
                        onClick={() => clearFilter('search')}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-coin-50 dark:bg-coin-900/30 text-sm text-coin-800 dark:text-coin-200 hover:bg-coin-100 dark:hover:bg-coin-900/50 focus:outline-none focus:ring-2 focus:ring-coin-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950"
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
              <div className="md:hidden space-y-3">
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
                    <div
                      key={c.id}
                      className={`rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 p-4 ${isOverdue ? 'ring-1 ring-red-500/30' : ''}`}
                      title={isOverdue ? `${outstandingMonths} months overdue` : ''}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className={`text-sm font-semibold break-words ${isOverdue ? 'text-red-900 dark:text-red-300' : 'text-gray-900 dark:text-gray-100'}`}>{c.name}</div>
                          {isOverdue && (
                            <div className="mt-1 text-xs text-red-700 dark:text-red-300">
                              {outstandingMonths} months overdue
                            </div>
                          )}
                        </div>
                        {isOverdue && (
                          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        )}
                      </div>

                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Expected</div>
                          <div className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrencyMWK(summary?.expected_amount ?? (monthlyRate || 0))}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Paid</div>
                          <div className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrencyMWK(summary?.total_paid ?? Object.values(clientPayments).reduce((sum, s) => sum + (s?.amount_paid || 0), 0))}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Outstanding</div>
                          <div className={`font-semibold ${isOverdue ? 'text-red-700 dark:text-red-400' : 'text-red-600 dark:text-red-400'}`}>{formatCurrencyMWK(summary?.outstanding_amount ?? 0)}</div>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        {months.map((m, idx) => {
                          const month = idx + 1;
                          const paid = !!clientPayments[month]?.paid;
                          const prepaid = !!(clientPayments[month]?.prepaid_amount && clientPayments[month]?.prepaid_amount > 0);
                          const isBillingStart = selectedYear === billingStartYear && month === billingStartMonth + 1;
                          const isBeforeBillingStart = startDate ? (
                            selectedYear < billingStartYear ||
                            (selectedYear === billingStartYear && month <= billingStartMonth)
                          ) : false;

                          return (
                            <div
                              key={month}
                              className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 ${isBeforeBillingStart ? 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40' : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950/40'} ${isBillingStart ? 'ring-1 ring-coin-500/40' : ''}`}
                            >
                              <div className="text-xs font-medium text-gray-600 dark:text-gray-300">{m}</div>
                              <button
                                onClick={() => toggle(c.id, month)}
                                disabled={isBeforeBillingStart}
                                className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-coin-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950 ${isBeforeBillingStart ? 'bg-gray-50 dark:bg-gray-700 text-gray-300 dark:text-gray-500 cursor-not-allowed' : paid ? 'bg-green-500 text-white' : (prepaid ? 'bg-coin-600 text-white hover:bg-coin-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600')} ${isBillingStart ? 'ring-2 ring-coin-500' : ''}`}
                                aria-pressed={paid}
                                title={prepaid ? `Prepaid: ${formatCurrencyMWK(clientPayments[month]?.prepaid_amount || 0)}` : (isBillingStart ? 'Billing Start' : undefined)}
                              >
                                {paid ? '✓' : (prepaid ? 'P' : '')}
                                {isBillingStart && !paid ? '★' : ''}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full border border-gray-200 dark:border-gray-800">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800">
                      <th 
                        onClick={() => handleFilterChange({ 
                          sort_field: 'name',
                          sort_direction: filters.sort_field === 'name' && filters.sort_direction === 'asc' ? 'desc' : 'asc'
                        })}
                        className="sticky left-0 z-20 px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-900"
                      >
                        <div className="flex items-center gap-2">
                          Client
                          <SortIcon direction={filters.sort_field === 'name' ? filters.sort_direction : null} />
                        </div>
                      </th>
                      {months.map((m, idx) => (
                        <th key={m} className="px-2 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-800 text-center min-w-[56px] w-[56px]">{m}</th>
                      ))}
                      <th
                        onClick={() => handleFilterChange({
                          sort_field: 'expected_amount',
                          sort_direction: filters.sort_field === 'expected_amount' && filters.sort_direction === 'asc' ? 'desc' : 'asc'
                        })}
                        className="hidden sm:table-cell px-2 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-800 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <div className="flex items-center justify-center gap-2">
                          Expected Amount
                          <SortIcon direction={filters.sort_field === 'expected_amount' ? filters.sort_direction : null} />
                        </div>
                      </th>
                      <th className="hidden sm:table-cell px-2 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-800 text-center">Amount Paid</th>
                      <th
                        onClick={() => handleFilterChange({
                          sort_field: 'outstanding_amount',
                          sort_direction: filters.sort_field === 'outstanding_amount' && filters.sort_direction === 'asc' ? 'desc' : 'asc'
                        })}
                        className="hidden sm:table-cell px-2 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-800 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
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
                        <tr key={c.id} className={`${isOverdue ? 'bg-red-50/80 hover:bg-red-100/90 dark:bg-red-900/30 dark:hover:bg-red-900/40' : 'odd:bg-white even:bg-gray-50 hover:bg-gray-100 odd:dark:bg-gray-900 even:dark:bg-gray-800 hover:dark:bg-gray-700'} transition-colors group`} title={isOverdue ? `${outstandingMonths} months overdue` : ''}>
                          <td className={`sticky left-0 z-10 px-3 py-2 text-sm border border-gray-200 dark:border-gray-800 whitespace-nowrap bg-white dark:bg-gray-900 ${isOverdue ? 'text-red-900 dark:text-red-300 font-semibold' : 'text-gray-900 dark:text-gray-100'} group-hover:bg-gray-100 dark:group-hover:bg-gray-800`}>
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
                              <td key={month} className="px-2 py-2 border border-gray-200 dark:border-gray-800 text-center min-w-[56px] w-[56px]">
                                <button
                                  onClick={() => toggle(c.id, month)}
                                  disabled={isBeforeBillingStart}
                                  className={`
                                    inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition
                                    ${isBeforeBillingStart ? 'bg-gray-50 dark:bg-gray-700 text-gray-300 dark:text-gray-500 cursor-not-allowed' : 
                                      paid ? 'bg-green-500 text-white' : (prepaid ? 'bg-coin-600 text-white hover:bg-coin-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600')}
                                    ${isBillingStart ? 'ring-2 ring-coin-500' : ''}
                                    focus:outline-none focus:ring-2 focus:ring-coin-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950
                                  `}
                                  aria-pressed={paid}
                                  aria-label={`Mark ${months[idx]} paid for ${c.name}`}
                                  title={prepaid ? `Prepaid: ${formatCurrencyMWK(clientPayments[month]?.prepaid_amount || 0)}` : (isBillingStart ? 'Billing Start' : undefined)}
                                >
                                  {paid ? '✓' : (prepaid ? (
                                    <span className="flex items-center justify-center">
                                      P
                                      <span className="sr-only">Prepaid</span>
                                    </span>
                                  ) : '')}
                                  {isBillingStart && !paid ? '★' : ''}
                                </button>
                              </td>
                            );
                          })}
                          <td className="hidden sm:table-cell px-2 py-2 border border-gray-200 dark:border-gray-800 text-center text-sm text-gray-900 dark:text-gray-100">
                            {formatCurrencyMWK(summary?.expected_amount ?? (monthlyRate || 0))}
                          </td>
                          <td className="hidden sm:table-cell px-2 py-2 border border-gray-200 dark:border-gray-800 text-center text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {formatCurrencyMWK(summary?.total_paid ?? Object.values(clientPayments).reduce((sum, s) => sum + (s?.amount_paid || 0), 0))}
                          </td>
                          <td className={`hidden sm:table-cell px-2 py-2 border border-gray-200 dark:border-gray-800 text-center text-sm ${isOverdue ? 'font-bold text-red-700 dark:text-red-300' : 'font-semibold text-red-600 dark:text-red-400'} ${isOverdue ? 'group-hover:scale-105' : ''} transition-transform`}>
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
    </AuthenticatedLayout>
  );
}


