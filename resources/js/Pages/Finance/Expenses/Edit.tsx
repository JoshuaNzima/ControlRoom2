import React, { useState } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import FinanceLayout from '@/Layouts/FinanceLayout';
import AdminLayout from '@/Layouts/AdminLayout';

interface Expense {
  id: number;
  amount: number;
  category: string;
  description: string | null;
  expense_date: string;
  account_id?: number;
  payment_method: string;
  notes: string | null;
}

interface Props {
  expense: Expense;
  categories: string[];
  paymentMethods: string[];
}

export default function EditExpense({ expense, categories, paymentMethods }: Props) {
  const { url } = usePage();
  const isAdminRoute = typeof url === 'string' && url.startsWith('/admin/');
  const Layout = isAdminRoute ? AdminLayout : FinanceLayout;
  const updateRouteName = isAdminRoute ? 'admin.requisitions.update' : 'finance.expenses.update';
  const showRouteName = isAdminRoute ? 'admin.requisitions.show' : 'finance.expenses.show';
  const { data, setData, put, processing, errors } = useForm({
    amount: expense.amount.toString(),
    category: expense.category,
    description: expense.description || '',
    expense_date: expense.expense_date.split('T')[0],
    account_id: expense.account_id?.toString() || '',
    payment_method: expense.payment_method,
    notes: expense.notes || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    put(route(updateRouteName, expense.id));
  };

  return (
    <Layout title="Edit Requisition">
      <Head title="Edit Requisition" />
      
      <div className="py-6">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Requisition #{expense.id}</h1>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">MWK</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={data.amount}
                    onChange={(e) => setData('amount', e.target.value)}
                    className="w-full pl-12 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={data.category}
                  onChange={(e) => setData('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={data.description}
                  onChange={(e) => setData('description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  maxLength={255}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                )}
              </div>

              {/* Expense Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expense Date *
                </label>
                <input
                  type="date"
                  required
                  value={data.expense_date}
                  onChange={(e) => setData('expense_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {errors.expense_date && (
                  <p className="mt-1 text-sm text-red-600">{errors.expense_date}</p>
                )}
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method *
                </label>
                <select
                  value={data.payment_method}
                  onChange={(e) => setData('payment_method', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {paymentMethods.map((method) => (
                    <option key={method} value={method}>
                      {method.charAt(0).toUpperCase() + method.slice(1)}
                    </option>
                  ))}
                </select>
                {errors.payment_method && (
                  <p className="mt-1 text-sm text-red-600">{errors.payment_method}</p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={data.notes}
                  onChange={(e) => setData('notes', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {errors.notes && (
                  <p className="mt-1 text-sm text-red-600">{errors.notes}</p>
                )}
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  💡 Changes to this requisition may require re-approval depending on your workflow.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-6 border-t">
                <button
                  type="submit"
                  disabled={processing}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition font-medium"
                >
                  {processing ? 'Saving...' : 'Save Changes'}
                </button>
                <a
                  href={route(showRouteName, expense.id)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium text-center"
                >
                  Cancel
                </a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
