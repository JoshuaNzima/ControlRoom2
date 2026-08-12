import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'

interface Budget {
  id: number;
  name: string;
  category: string;
  budgeted_amount: number;
  fiscal_year: number;
  fiscal_month: number | null;
  status: 'active' | 'inactive' | 'archived';
  description?: string;
}

interface Props {
  budget: Budget;
  categories: string[];
}

export default function EditBudget({ budget, categories }: Props) {
  const { data, setData, put, processing, errors } = useForm({
    name: budget.name,
    category: budget.category,
    budgeted_amount: budget.budgeted_amount.toString(),
    fiscal_year: budget.fiscal_year.toString(),
    fiscal_month: budget.fiscal_month ? budget.fiscal_month.toString() : '',
    description: budget.description || '',
    status: budget.status,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    put(route('finance.budgets.update', budget.id));
  };

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  const years = Array.from({ length: 10 }, (_, i) => budget.fiscal_year - 3 + i);

  return (
    <AuthenticatedLayout header="Edit Budget">
      <Head title="Edit Budget" />

      <div className="py-6">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Edit Budget</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Budget Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Budget Name *
                </label>
                <input
                  type="text"
                  required
                  value={data.name}
                  onChange={(e) => setData('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-coin-500 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category *
                </label>
                <select
                  value={data.category}
                  onChange={(e) => setData('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-coin-500 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600">{errors.category}</p>
                )}
              </div>

              {/* Budgeted Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Budgeted Amount *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500 dark:text-gray-400">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={data.budgeted_amount}
                    onChange={(e) => setData('budgeted_amount', e.target.value)}
                    className="w-full pl-8 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-coin-500 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
                  />
                </div>
                {errors.budgeted_amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.budgeted_amount}</p>
                )}
              </div>

              {/* Fiscal Year */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fiscal Year *
                </label>
                <select
                  value={data.fiscal_year}
                  onChange={(e) => setData('fiscal_year', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-coin-500 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                {errors.fiscal_year && (
                  <p className="mt-1 text-sm text-red-600">{errors.fiscal_year}</p>
                )}
              </div>

              {/* Fiscal Month */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fiscal Month (Optional)
                </label>
                <select
                  value={data.fiscal_month}
                  onChange={(e) => setData('fiscal_month', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-coin-500 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Annual Budget</option>
                  {months.map((month) => (
                    <option key={month.value} value={month.value.toString()}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status *
                </label>
                <select
                  value={data.status}
                  onChange={(e) => setData('status', e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-coin-500 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="archived">Archived</option>
                </select>
                {errors.status && (
                  <p className="mt-1 text-sm text-red-600">{errors.status}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={data.description}
                  onChange={(e) => setData('description', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-coin-500 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                )}
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200 dark:border-gray-800">
                <button
                  type="submit"
                  disabled={processing}
                  className="w-full sm:flex-1 px-4 py-2 bg-coin-600 text-white rounded-lg hover:bg-coin-700 disabled:bg-gray-400 transition font-medium"
                >
                  {processing ? 'Saving...' : 'Save Changes'}
                </button>
                <a
                  href={route('finance.budgets.show', budget.id)}
                  className="w-full sm:flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium text-center dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
                >
                  Cancel
                </a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
