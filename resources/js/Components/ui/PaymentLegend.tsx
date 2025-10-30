import React from 'react';

export function PaymentLegend() {
  return (
    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-green-500 text-white flex items-center justify-center">✓</div>
        <span>Paid</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-gray-100 ring-2 ring-blue-500 flex items-center justify-center">★</div>
        <span>Billing Start</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-gray-50 text-gray-300 flex items-center justify-center">-</div>
        <span>Before Billing Start</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-gray-200 transition"></div>
        <span>Unpaid</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center">P</div>
        <span>Prepaid (future month)</span>
      </div>
      <div className="w-full text-xs text-gray-500 mt-2">
        <strong>Revenue rule:</strong> Prepayments are recorded as "Prepaid" and do not count toward current month revenue until the month is due (they are recognized when the month arrives).
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <div className="px-3 py-1 bg-red-50/80 text-red-900 font-semibold rounded border border-red-200">
            <span>Example Client</span>
            <div className="inline-block w-2 h-2 rounded-full bg-red-500 ml-2 animate-pulse" />
          </div>
        </div>
        <span>Overdue</span>
      </div>
    </div>
  );
}