import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import IconMapper from '@/Components/IconMapper';

interface InvoicePayment {
  id: number;
  amount: number;
  payment_date: string;
  payment_method: string | null;
  reference: string | null;
  notes: string | null;
  recorded_by: { id: number; name: string } | null;
}

interface Invoice {
  id: number;
  invoice_number: string;
  total_amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  due_date: string | null;
  billing_month: number | null;
  billing_year: number | null;
  billing_period: string | null;
  paid_date?: string | null;
  created_at: string;
  payments?: InvoicePayment[];
}

interface ClientInvoicesProps {
  auth: {
    user: {
      id: number;
      name: string;
      email: string;
    };
  };
  client: {
    id: number;
    name: string;
    monthly_rate: number;
  } | null;
  invoices: Invoice[];
  paymentSummary: {
    expected_amount: number;
    total_due: number;
    total_paid: number;
    outstanding_amount: number;
    outstanding_months: number;
    is_overdue: boolean;
  } | null;
}

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const colors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    overdue: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status] || colors.draft}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-MW', {
    style: 'currency',
    currency: 'MWK',
    minimumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export default function ClientInvoices({ auth, client, invoices, paymentSummary }: ClientInvoicesProps) {
  const [filter, setFilter] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsDetailModalOpen(true);
  };

  const filteredInvoices = filter === 'all'
    ? invoices
    : invoices.filter(i => i.status === filter);

  const stats = {
    total: invoices.length,
    paid: invoices.filter(i => i.status === 'paid').length,
    outstanding: invoices.filter(i => i.status !== 'paid').length,
    overdue: invoices.filter(i => i.status === 'overdue').length,
  };

  if (!client) {
    return (
      <AuthenticatedLayout header="Invoices" user={auth?.user}>
        <Head title="Invoices" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Card className="p-8 text-center dark:bg-gray-800 dark:border-gray-700">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-amber-100 dark:bg-amber-900/20 rounded-full">
                <IconMapper name="AlertCircle" size={32} className="text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">No Client Assigned</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  Your account is not linked to any client. Please contact support for assistance.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout header="Invoices" user={auth?.user}>
      <Head title="Invoices" />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-red-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/10 rounded-lg backdrop-blur-sm">
                  <IconMapper name="FileText" size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">Invoices & Billing</h1>
                  <p className="text-red-100 text-sm mt-0.5">View your billing history and payment status</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Payment Summary */}
          {paymentSummary && (
            <Card className="p-4 sm:p-6 dark:bg-gray-800 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <IconMapper name="Wallet" size={20} />
                  Payment Summary ({new Date().getFullYear()})
                </h3>
                <StatusBadge status={paymentSummary.is_overdue ? 'overdue' : 'paid'} />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Total Due</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(paymentSummary.total_due)}</p>
                </div>
                <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Total Paid</p>
                  <p className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(paymentSummary.total_paid)}</p>
                </div>
                <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Outstanding</p>
                  <p className={`text-lg sm:text-xl font-bold ${paymentSummary.outstanding_amount > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>
                    {formatCurrency(paymentSummary.outstanding_amount)}
                  </p>
                </div>
                <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Monthly Rate</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(client.monthly_rate)}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <Card className="p-3 sm:p-4 dark:bg-gray-800 dark:border-gray-700">
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Total Invoices</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
            </Card>
            <Card className="p-3 sm:p-4 dark:bg-gray-800 dark:border-gray-700">
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Paid</p>
              <p className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.paid}</p>
            </Card>
            <Card className="p-3 sm:p-4 dark:bg-gray-800 dark:border-gray-700">
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Outstanding</p>
              <p className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.outstanding}</p>
            </Card>
            <Card className="p-3 sm:p-4 dark:bg-gray-800 dark:border-gray-700">
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Overdue</p>
              <p className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">{stats.overdue}</p>
            </Card>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
              className={filter === 'all' ? 'bg-red-600' : 'dark:border-gray-600 dark:text-gray-300'}
            >
              All Invoices
            </Button>
            <Button
              variant={filter === 'paid' ? 'default' : 'outline'}
              onClick={() => setFilter('paid')}
              className={filter === 'paid' ? 'bg-emerald-600' : 'dark:border-gray-600 dark:text-gray-300'}
            >
              Paid
            </Button>
            <Button
              variant={filter === 'sent' ? 'default' : 'outline'}
              onClick={() => setFilter('sent')}
              className={filter === 'sent' ? 'bg-red-600' : 'dark:border-gray-600 dark:text-gray-300'}
            >
              Sent
            </Button>
            <Button
              variant={filter === 'overdue' ? 'default' : 'outline'}
              onClick={() => setFilter('overdue')}
              className={filter === 'overdue' ? 'bg-red-600' : 'dark:border-gray-600 dark:text-gray-300'}
            >
              Overdue
            </Button>
          </div>

          {/* Invoices Table - Desktop */}
          <Card className="hidden sm:block dark:bg-gray-800 dark:border-gray-700">
            {filteredInvoices.length === 0 ? (
              <div className="p-8 text-center">
                <IconMapper name="FileText" size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No invoices found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Invoice #</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Period</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Amount</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Due Date</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Paid Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {filteredInvoices.map((invoice) => (
                      <tr 
                        key={invoice.id} 
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                        onClick={() => handleViewInvoice(invoice)}
                      >
                        <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                          {invoice.invoice_number}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                          {invoice.billing_period || (invoice.billing_month && invoice.billing_year
                            ? `${new Date(0, invoice.billing_month - 1).toLocaleString('default', { month: 'short' })} ${invoice.billing_year}`
                            : 'N/A')}
                        </td>
                        <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                          {formatCurrency(invoice.total_amount)}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(invoice.due_date)}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={invoice.status} />
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                          {invoice.paid_date ? formatDate(invoice.paid_date) : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Invoices List - Mobile */}
          <div className="sm:hidden space-y-3">
            {filteredInvoices.length === 0 ? (
              <Card className="p-6 text-center dark:bg-gray-800 dark:border-gray-700">
                <IconMapper name="FileText" size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No invoices found</p>
              </Card>
            ) : (
              filteredInvoices.map((invoice) => (
                <Card 
                  key={invoice.id}
                  className="p-4 dark:bg-gray-800 dark:border-gray-700 cursor-pointer"
                  onClick={() => handleViewInvoice(invoice)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{invoice.invoice_number}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {invoice.billing_period || 'N/A'}
                      </p>
                    </div>
                    <StatusBadge status={invoice.status} />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {formatCurrency(invoice.total_amount)}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Due: {formatDate(invoice.due_date)}
                    </span>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Invoice Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-lg dark:bg-gray-800 dark:border-gray-700">
          {selectedInvoice && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  <IconMapper name="FileText" size={20} className="text-red-600 dark:text-red-400" />
                  Invoice Details
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                {/* Invoice Number & Status */}
                <div className="flex items-center justify-between">
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{selectedInvoice.invoice_number}</p>
                  <StatusBadge status={selectedInvoice.status} />
                </div>

                {/* Amount */}
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Amount</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(selectedInvoice.total_amount)}</p>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Billing Period</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {selectedInvoice.billing_period || (selectedInvoice.billing_month && selectedInvoice.billing_year
                        ? `${new Date(0, selectedInvoice.billing_month - 1).toLocaleString('default', { month: 'long' })} ${selectedInvoice.billing_year}`
                        : 'N/A')}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Due Date</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatDate(selectedInvoice.due_date)}</p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Created</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatDate(selectedInvoice.created_at)}</p>
                  </div>
                  {selectedInvoice.paid_date && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Paid Date</p>
                      <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{formatDate(selectedInvoice.paid_date)}</p>
                    </div>
                  )}
                </div>

                {/* Payments (display only) */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Payments</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {(selectedInvoice.payments?.length ?? 0) > 0
                        ? `${selectedInvoice.payments?.length} record${(selectedInvoice.payments?.length ?? 0) === 1 ? '' : 's'}`
                        : 'No payments recorded'}
                    </p>
                  </div>

                  {(selectedInvoice.payments?.length ?? 0) > 0 ? (
                    <div className="max-h-44 overflow-y-auto pr-1">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left">
                            <th className="py-2 pr-2 text-xs font-medium text-gray-500 dark:text-gray-400">Date</th>
                            <th className="py-2 pr-2 text-xs font-medium text-gray-500 dark:text-gray-400">Method</th>
                            <th className="py-2 pr-2 text-xs font-medium text-gray-500 dark:text-gray-400">Reference</th>
                            <th className="py-2 pr-2 text-xs font-medium text-gray-500 dark:text-gray-400">Recorded By</th>
                            <th className="py-2 text-right pr-0 text-xs font-medium text-gray-500 dark:text-gray-400">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                          {selectedInvoice.payments!.map((p) => (
                            <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                              <td className="py-2 pr-2 text-gray-700 dark:text-gray-300">
                                {formatDate(p.payment_date)}
                              </td>
                              <td className="py-2 pr-2 text-gray-700 dark:text-gray-300">
                                {p.payment_method ? p.payment_method.replace('_', ' ') : 'Other'}
                              </td>
                              <td className="py-2 pr-2 text-gray-700 dark:text-gray-300">
                                {p.reference || '-'}
                              </td>
                              <td className="py-2 pr-2 text-gray-700 dark:text-gray-300">
                                {p.recorded_by?.name || '-'}
                              </td>
                              <td className="py-2 text-right text-gray-900 dark:text-gray-100 font-semibold">
                                {formatCurrency(p.amount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg text-sm text-gray-600 dark:text-gray-300">
                      No payment details available for this invoice.
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsDetailModalOpen(false)}
                    className="flex-1 dark:border-gray-600 dark:text-gray-300"
                  >
                    Close
                  </Button>

                  {selectedInvoice.status !== 'paid' && selectedInvoice.status !== 'cancelled' && (
                    <Button
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                      onClick={() => setIsDetailModalOpen(false)}
                    >
                      <IconMapper name="CreditCard" size={16} className="mr-2" />
                      Pay Now
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AuthenticatedLayout>
  );
}
