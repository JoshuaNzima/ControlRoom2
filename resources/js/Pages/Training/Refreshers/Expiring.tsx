import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import IconMapper from '@/Components/IconMapper';
import { format, parseISO, isPast, addDays } from 'date-fns';

interface Trainee {
  id: number;
  name: string;
  status: string;
  pivot: {
    completed_at: string;
    expires_at: string;
    notes: string | null;
  };
}

interface Refresher {
  id: number;
  title: string;
  description: string | null;
  validity_months: number;
  trainees: Trainee[];
}

interface PageProps {
  [key: string]: any;
  auth: { user: any };
  expiring: Refresher[];
  expired: Refresher[];
}

const statusColors: Record<string, string> = {
  in_training: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  hired: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
};

export default function RefreshersExpiring() {
  const props = usePage<PageProps>().props;
  const auth = props.auth || { user: {} };
  const expiring = props.expiring || [];
  const expired = props.expired || [];

  return (
    <AuthenticatedLayout header="Expiring Refreshers" user={auth.user}>
      <Head title="Expiring Refreshers" />
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Expiring Refreshers</h2>
          <p className="text-gray-600 dark:text-gray-400">Track refresher certifications approaching expiry</p>
        </div>

        {/* Expiring Soon */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <IconMapper name="AlertTriangle" className="h-5 w-5 text-amber-500" />
            Expiring in Next 30 Days
          </h3>
          <div className="space-y-4">
            {expiring.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 text-center text-gray-500 dark:text-gray-400">
                No refreshers expiring in the next 30 days
              </div>
            ) : (
              expiring.map((refresher) => (
                <div key={refresher.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">{refresher.title}</h4>
                  {refresher.description && (
                    <p className="text-gray-600 dark:text-gray-400 mb-4">{refresher.description}</p>
                  )}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Trainee</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Completed</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Expires</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Days Left</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {refresher.trainees.map((trainee) => {
                          const daysLeft = Math.ceil((new Date(trainee.pivot.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                          const isUrgent = daysLeft <= 7;
                          
                          return (
                            <tr key={trainee.id} className={isUrgent ? 'bg-amber-50 dark:bg-amber-900/10' : ''}>
                              <td className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                                {trainee.name}
                              </td>
                              <td className="px-4 py-2">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[trainee.status]}`}>
                                  {trainee.status}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                                {format(parseISO(trainee.pivot.completed_at), 'MMM dd, yyyy')}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                                {format(parseISO(trainee.pivot.expires_at), 'MMM dd, yyyy')}
                              </td>
                              <td className="px-4 py-2">
                                <span className={`text-sm font-medium ${isUrgent ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                  {daysLeft} days
                                </span>
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                                {trainee.pivot.notes || '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Already Expired */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <IconMapper name="XCircle" className="h-5 w-5 text-red-500" />
            Already Expired
          </h3>
          <div className="space-y-4">
            {expired.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 text-center text-gray-500 dark:text-gray-400">
                No expired refreshers found
              </div>
            ) : (
              expired.map((refresher) => (
                <div key={refresher.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border-l-4 border-red-500">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">{refresher.title}</h4>
                  {refresher.description && (
                    <p className="text-gray-600 dark:text-gray-400 mb-4">{refresher.description}</p>
                  )}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Trainee</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Completed</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Expired</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Days Overdue</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {refresher.trainees.map((trainee) => {
                          const daysOverdue = Math.ceil((new Date().getTime() - new Date(trainee.pivot.expires_at).getTime()) / (1000 * 60 * 60 * 24));
                          
                          return (
                            <tr key={trainee.id}>
                              <td className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                                {trainee.name}
                              </td>
                              <td className="px-4 py-2">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[trainee.status]}`}>
                                  {trainee.status}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                                {format(parseISO(trainee.pivot.completed_at), 'MMM dd, yyyy')}
                              </td>
                              <td className="px-4 py-2 text-sm text-red-600 dark:text-red-400 font-medium">
                                {format(parseISO(trainee.pivot.expires_at), 'MMM dd, yyyy')}
                              </td>
                              <td className="px-4 py-2">
                                <span className="text-sm font-medium text-red-600 dark:text-red-400">
                                  {daysOverdue} days
                                </span>
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                                {trainee.pivot.notes || '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
