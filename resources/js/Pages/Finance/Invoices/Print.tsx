import React, { useEffect, useMemo } from 'react';
import { Head } from '@inertiajs/react';
import { formatCurrency, formatDate } from '@/utils/formatters';

interface InvoiceLineItem {
  id: number;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

interface Invoice {
  id: number;
  invoice_number: string;
  client_name: string;
  client_email?: string;
  billing_year?: number;
  billing_month?: number;
  subtotal: number;
  tax_amount: number;
  tax_percentage: number;
  discount_amount: number;
  total_amount: number;
  invoice_date: string;
  due_date: string;
  description?: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  notes?: string;
  lineItems: InvoiceLineItem[];
  created_at: string;
  updated_at: string;
}

export default function PrintInvoice({ invoice }: { invoice: Invoice }) {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 400);
    return () => clearTimeout(t);
  }, []);

  const period = useMemo(() => {
    if (!invoice.billing_month || !invoice.billing_year) return null;
    return `${String(invoice.billing_month).padStart(2, '0')}/${invoice.billing_year}`;
  }, [invoice.billing_month, invoice.billing_year]);

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <Head title={`Print Invoice ${invoice.invoice_number}`} />

      <div className="print:hidden sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="font-semibold">Invoice {invoice.invoice_number}</div>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="px-3 py-1.5 rounded-md bg-red-600 text-white hover:bg-red-700">Print</button>
            <button onClick={() => history.back()} className="px-3 py-1.5 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700">Back</button>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto p-4 md:p-8">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 mb-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <img src="/images/Coin-logo.png" alt="Logo" className="h-10 w-auto" onError={(e) => ((e.currentTarget.style.display='none'))} />
            <div>
              <div className="text-xl font-bold text-emerald-700 dark:text-emerald-400">Coin Security</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Secure. Reliable. Professional.</div>
            </div>
          </div>
          <div className="text-right text-sm">
            <div className="font-semibold">Invoice</div>
            <div className="text-gray-600 dark:text-gray-300">#{invoice.invoice_number}</div>
            <div className="text-gray-600 dark:text-gray-300">Issued: {formatDate(invoice.invoice_date)}</div>
            <div className="text-gray-600 dark:text-gray-300">Due: {formatDate(invoice.due_date)}</div>
            {period && (<div className="text-gray-600 dark:text-gray-300">Period: {period}</div>)}
          </div>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4">
            <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Billed To</div>
            <div className="font-semibold">{invoice.client_name}</div>
            {invoice.client_email && <div className="text-sm text-gray-600 dark:text-gray-300">{invoice.client_email}</div>}
          </div>
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 sm:text-right">
            <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Status</div>
            <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold border border-gray-300 dark:border-gray-700">
              {invoice.status.toUpperCase()}
            </div>
          </div>
        </section>

        <section className="mb-6">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800">
                <th className="text-left px-3 py-2 border-b border-gray-200 dark:border-gray-700">Description</th>
                <th className="text-right px-3 py-2 border-b border-gray-200 dark:border-gray-700 w-20">Qty</th>
                <th className="text-right px-3 py-2 border-b border-gray-200 dark:border-gray-700 w-32">Unit Price</th>
                <th className="text-right px-3 py-2 border-b border-gray-200 dark:border-gray-700 w-32">Line Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems.map((item) => (
                <tr key={item.id} className="odd:bg-white even:bg-gray-50 dark:odd:bg-gray-900 dark:even:bg-gray-950">
                  <td className="px-3 py-2 border-b border-gray-100 dark:border-gray-800">{item.description}</td>
                  <td className="px-3 py-2 text-right border-b border-gray-100 dark:border-gray-800">{item.quantity}</td>
                  <td className="px-3 py-2 text-right border-b border-gray-100 dark:border-gray-800">{formatCurrency(item.unit_price)}</td>
                  <td className="px-3 py-2 text-right font-semibold border-b border-gray-100 dark:border-gray-800">{formatCurrency(item.line_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="flex justify-end">
          <div className="w-full sm:w-96 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600 dark:text-gray-300">Subtotal</span>
              <span className="font-semibold">{formatCurrency(invoice.subtotal)}</span>
            </div>
            {invoice.tax_percentage > 0 && (
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-300">Tax ({invoice.tax_percentage}%)</span>
                <span className="font-semibold">{formatCurrency(invoice.tax_amount)}</span>
              </div>
            )}
            {invoice.discount_amount > 0 && (
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-300">Discount</span>
                <span className="font-semibold text-green-600 dark:text-green-400">- {formatCurrency(invoice.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold border-t mt-2 pt-2 border-gray-200 dark:border-gray-700">
              <span>Total</span>
              <span className="text-indigo-600 dark:text-indigo-400">{formatCurrency(invoice.total_amount)}</span>
            </div>
          </div>
        </section>

        {invoice.notes && (
          <section className="mt-6">
            <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Notes</div>
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 whitespace-pre-wrap">
              {invoice.notes}
            </div>
          </section>
        )}

        <footer className="mt-10 text-center text-xs text-gray-500 dark:text-gray-400">
          Thank you for your business.
        </footer>
      </main>
    </div>
  );
}
