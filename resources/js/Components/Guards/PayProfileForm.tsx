import React, { useState, useEffect } from 'react';
import { formatCurrencyMWK } from '@/Components/format';

interface PayProfileFormProps {
  guard: any;
  initialData: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export default function PayProfileForm({ guard, initialData, onSubmit, onCancel }: PayProfileFormProps) {
  const [formData, setFormData] = useState({
    monthly_salary: 0,
    overtime_multiplier: 1.5,
    advance_amount: 0,
    absence_deduction_per_day: 0,
    allowances: '[]',
    ...initialData,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        monthly_salary: initialData.monthly_salary || 0,
        overtime_multiplier: initialData.overtime_multiplier || 1.5,
        advance_amount: initialData.advance_amount || 0,
        absence_deduction_per_day: initialData.absence_deduction_per_day || 0,
        allowances: typeof initialData.allowances === 'string' 
          ? initialData.allowances 
          : JSON.stringify(initialData.allowances || []),
      });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const inputClassName = 
    'mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Monthly Salary (MWK)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-gray-500 text-sm">MWK</span>
            <input
              type="number"
              step="0.01"
              value={formData.monthly_salary}
              onChange={(e) => setFormData({ ...formData, monthly_salary: Number(e.target.value) })}
              className={`${inputClassName} pl-14`}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            OT Multiplier
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.overtime_multiplier}
            onChange={(e) => setFormData({ ...formData, overtime_multiplier: Number(e.target.value) })}
            className={inputClassName}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Advance Amount (MWK)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-gray-500 text-sm">MWK</span>
            <input
              type="number"
              step="0.01"
              value={formData.advance_amount}
              onChange={(e) => setFormData({ ...formData, advance_amount: Number(e.target.value) })}
              className={`${inputClassName} pl-14`}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Absence Deduction/Day (MWK)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-gray-500 text-sm">MWK</span>
            <input
              type="number"
              step="0.01"
              value={formData.absence_deduction_per_day}
              onChange={(e) => setFormData({ ...formData, absence_deduction_per_day: Number(e.target.value) })}
              className={`${inputClassName} pl-14`}
            />
          </div>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Allowances (JSON)
        </label>
        <textarea
          value={formData.allowances}
          onChange={(e) => setFormData({ ...formData, allowances: e.target.value })}
          className={inputClassName}
          rows={3}
          placeholder='[{"name": "Transport", "amount": 5000}]'
        />
      </div>
      
      {/* Summary */}
      <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Summary</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="text-gray-600 dark:text-gray-400">Base Salary:</div>
          <div className="text-gray-900 dark:text-gray-100">{formatCurrencyMWK(formData.monthly_salary)}</div>
          <div className="text-gray-600 dark:text-gray-400">OT Rate:</div>
          <div className="text-gray-900 dark:text-gray-100">{formData.overtime_multiplier}x</div>
          <div className="text-gray-600 dark:text-gray-400">Advance:</div>
          <div className="text-gray-900 dark:text-gray-100">{formatCurrencyMWK(formData.advance_amount)}</div>
          <div className="text-gray-600 dark:text-gray-400">Absence/Day:</div>
          <div className="text-gray-900 dark:text-gray-100">{formatCurrencyMWK(formData.absence_deduction_per_day)}</div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
        >
          Save Pay Profile
        </button>
      </div>
    </form>
  );
}
