import React from 'react';
import { Inertia } from '@inertiajs/inertia';
import { InertiaLink, usePage } from '@inertiajs/inertia-react';

interface Props {
  approvals: any[];
}

export default function Index({ approvals }: Props) {
  const handleApprove = (id: number) => {
    Inertia.post(route('finance.approvals.approve', { approval: id }), {});
  };

  const handleReject = (id: number) => {
    Inertia.post(route('finance.approvals.reject', { approval: id }), {});
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold">Approvals</h1>
      {approvals.length === 0 ? (
        <p className="mt-4">No pending approvals.</p>
      ) : (
        <table className="w-full mt-4 table-auto">
          <thead>
            <tr>
              <th className="text-left">Expense</th>
              <th className="text-left">Amount</th>
              <th className="text-left">Stage</th>
              <th className="text-left">Requested By</th>
              <th className="text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {approvals.map((a: any) => (
              <tr key={a.id} className="border-t">
                <td>
                  <InertiaLink href={route('finance.expenses.show', a.expense.id)}>
                    {a.expense.description || `#${a.expense.id}`}
                  </InertiaLink>
                </td>
                <td>{a.expense.amount}</td>
                <td>{a.stage}</td>
                <td>{a.approver?.name || '—'}</td>
                <td>
                  <button onClick={() => handleApprove(a.id)} className="btn btn-sm btn-green mr-2">Approve</button>
                  <button onClick={() => handleReject(a.id)} className="btn btn-sm btn-red">Reject</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
