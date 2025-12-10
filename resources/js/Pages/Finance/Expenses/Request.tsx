import React from 'react';
import FinanceLayout from '@/Layouts/FinanceLayout';
import ExpenseRequestForm from '@/Components/Finance/ExpenseRequestForm';

interface Props {
  categories: string[];
}

export default function RequestExpense({ categories }: Props) {
  return (
    <FinanceLayout title="Request Requisition">
      <div className="max-w-2xl">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">New Requisition</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
            Submit a one-time requisition (e.g., trips, fuel, supplies). Your request will be sent to the admin for approval.
          </p>
          <ExpenseRequestForm categories={categories} />
        </div>
      </div>
    </FinanceLayout>
  );
}
