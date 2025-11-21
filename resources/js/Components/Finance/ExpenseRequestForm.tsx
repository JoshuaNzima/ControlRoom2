import React from 'react';
import { useForm } from '@inertiajs/react';

interface Props {
  onSubmitted?: () => void;
  categories?: string[];
  className?: string;
  postRouteName?: string; // inertia route name to submit to
}

const defaultCategories = [
  'general',
  'office_supplies',
  'travel',
  'meals',
  'utilities',
  'maintenance',
  'marketing',
  'equipment',
  'other',
];

export default function ExpenseRequestForm({ onSubmitted, categories = defaultCategories, className = '', postRouteName = 'expense.request.store' }: Props) {
  const { data, setData, post, processing, errors, reset } = useForm({
    amount: '',
    category: categories[0] || 'general',
    description: '',
    expense_date: new Date().toISOString().slice(0, 10),
    payment_method: 'cash' as 'cash' | 'card' | 'transfer' | 'check',
    notes: '',
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route(postRouteName as any), {
      onSuccess: () => {
        reset();
        onSubmitted?.();
      },
    });
  };

  return (
    <form onSubmit={submit} className={`space-y-4 ${className}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">MK</span>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={data.amount}
              onChange={(e) => setData('amount', e.target.value)}
              className="w-full pl-8 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="0.00"
            />
          </div>
          {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
          <select
            value={data.category}
            onChange={(e) => setData('category', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
          {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
          <select
            value={data.payment_method}
            onChange={(e) => setData('payment_method', e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="transfer">Bank Transfer</option>
            <option value="check">Check</option>
          </select>
          {errors.payment_method && <p className="mt-1 text-sm text-red-600">{errors.payment_method}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
          <input
            type="date"
            required
            value={data.expense_date}
            onChange={(e) => setData('expense_date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          {errors.expense_date && <p className="mt-1 text-sm text-red-600">{errors.expense_date}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <input
          type="text"
          value={data.description}
          onChange={(e) => setData('description', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          placeholder="Describe the expense (e.g., fuel for site visit)"
        />
        {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          rows={3}
          value={data.notes}
          onChange={(e) => setData('notes', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          placeholder="Additional details..."
        />
        {errors.notes && <p className="mt-1 text-sm text-red-600">{errors.notes}</p>}
      </div>

      <div className="pt-2 flex gap-3">
        <button
          type="submit"
          disabled={processing}
          className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition font-medium"
        >
          {processing ? 'Submitting...' : 'Submit Request'}
        </button>
        <button
          type="button"
          disabled={processing}
          onClick={() => reset()}
          className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
        >
          Reset
        </button>
      </div>
    </form>
  );
}
