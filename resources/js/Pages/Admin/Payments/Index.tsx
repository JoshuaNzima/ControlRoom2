import React from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { formatCurrencyMWK } from '@/Components/format';

type Client = { id: number; name: string; contract_start_date?: string | null; contract_end_date?: string | null; monthly_rate?: number };

type MonthState = { paid: boolean; amount_due: number; amount_paid: number };
interface Props {
  year: number;
  clients: Client[];
  payments: Record<string, Record<number, MonthState>>; // client_id -> month -> state
  flags?: Record<string, boolean>;
}

const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function PaymentsIndex({ year, clients, payments, flags = {} }: Props) {
  const [selectedYear, setSelectedYear] = React.useState<number>(year);

  const handleYearChange = (delta: number) => {
    const newYear = selectedYear + delta;
    setSelectedYear(newYear);
    router.get(route('admin.payments.index'), { year: newYear }, { preserveScroll: true, preserveState: true });
  };

  const toggle = (clientId: number, month: number) => {
    router.post(route('admin.payments.toggle'), { client_id: clientId, year: selectedYear, month }, { preserveScroll: true });
  };

  return (
    <AdminLayout title="Payments Checker">
      <Head title="Payments Checker" />

      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-semibold text-gray-900">Client Payments</h1>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => handleYearChange(-1)}>&laquo; {selectedYear - 1}</Button>
                <div className="text-lg font-bold w-24 text-center">{selectedYear}</div>
                <Button variant="outline" onClick={() => handleYearChange(1)}>{selectedYear + 1} &raquo;</Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 border">Client</th>
                    {months.map((m, idx) => (
                      <th key={m} className="px-2 py-2 text-xs font-semibold text-gray-600 border text-center">{m}</th>
                    ))}
                    <th className="px-2 py-2 text-xs font-semibold text-gray-600 border text-center">Amount Due</th>
                    <th className="px-2 py-2 text-xs font-semibold text-gray-600 border text-center">Amount Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((c) => {
                    const clientPayments = payments[String(c.id)] || {} as Record<number, MonthState>;
                    const monthlyRate = (c as any).monthly_rate ?? 0;
                    return (
                      <tr key={c.id} className="odd:bg-white even:bg-gray-50">
                        <td className="px-3 py-2 text-sm text-gray-900 border whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span>{c.name}</span>
                            {flags[String(c.id)] && (
                              <span title="3+ unpaid months" className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">Overdue</span>
                            )}
                          </div>
                        </td>
                        {months.map((_, idx) => {
                          const month = idx + 1;
                          const paid = !!clientPayments[month]?.paid;
                          return (
                            <td key={month} className="px-2 py-2 border text-center">
                              <button
                                onClick={() => toggle(c.id, month)}
                                className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition ${paid ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                aria-pressed={paid}
                                aria-label={`Mark ${months[idx]} paid for ${c.name}`}
                              >
                                {paid ? '✓' : ''}
                              </button>
                            </td>
                          );
                        })}
                        <td className="px-2 py-2 border text-center text-sm">
                          {formatCurrencyMWK(monthlyRate || 0)}
                        </td>
                        <td className="px-2 py-2 border text-center text-sm font-semibold">
                          {formatCurrencyMWK(Object.values(clientPayments).reduce((sum, s) => sum + (s?.amount_paid || 0), 0))}
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


