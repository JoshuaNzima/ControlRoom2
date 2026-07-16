import React, { useState, useEffect } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import IconMapper from '@/Components/IconMapper';
import { format, parseISO } from 'date-fns';

interface Guard {
  id: number;
  name: string;
  employee_id: string;
  phone: string | null;
  email: string | null;
  status: string;
  grade: { code: string; name: string } | null;
  supervisor: { name: string } | null;
  sites: { site_name: string; client: { name: string } }[];
}

interface RefresherRecord {
  id: number;
  refresher_id: number;
  status: 'in_progress' | 'completed' | 'passed' | 'failed' | 'dismissed' | 'promoted';
  training_date: string;
  completed_date: string | null;
  evaluated_at: string | null;
  trainer_notes: string | null;
  dismissal_reason: string | null;
  refresher: {
    title: string;
    duration_hours: number;
    validity_months: number;
  };
  trainer: { id: number; name: string } | null;
  evaluator: { id: number; name: string } | null;
}

interface PageProps {
  [key: string]: any;
  auth: { user: any };
  guard: Guard;
  refresherHistory: RefresherRecord[];
}

const statusColors: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  suspended: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  terminated: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400',
  in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  completed: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  passed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  failed: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400',
  dismissed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  promoted: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
};

export default function TrainerGuardShow() {
  const props = usePage<PageProps>().props;
  const auth = props.auth || { user: {} };
  const guard = props.guard;
  const refresherHistory = props.refresherHistory || [];

  const [showEvaluateModal, setShowEvaluateModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<RefresherRecord | null>(null);
  const [loading, setLoading] = useState(false);

  const activeRecords = refresherHistory.filter(r => ['in_progress', 'completed'].includes(r.status));
  const completedRecords = refresherHistory.filter(r => ['passed', 'failed', 'dismissed', 'promoted'].includes(r.status));

  const openEvaluateModal = (record: RefresherRecord) => {
    setSelectedRecord(record);
    setShowEvaluateModal(true);
  };

  const handleEvaluate = (status: 'passed' | 'failed' | 'promoted' | 'dismissed', notes: string, dismissalReason?: string) => {
    if (!selectedRecord) return;

    setLoading(true);
    router.post(route('training.trainer-guards.evaluate', selectedRecord.id), {
      status,
      trainer_notes: notes,
      dismissal_reason: dismissalReason,
    }, {
      onSuccess: () => {
        setShowEvaluateModal(false);
        setSelectedRecord(null);
        setLoading(false);
      },
      onError: () => setLoading(false),
    });
  };

  const handleCompleteTraining = (record: RefresherRecord) => {
    setLoading(true);
    router.post(route('training.trainer-guards.complete', record.id), {}, {
      onSuccess: () => setLoading(false),
      onError: () => setLoading(false),
    });
  };

  return (
    <AuthenticatedLayout header={`${guard.name} - Guard Details`} user={auth.user}>
      <Head title={`${guard.name} - Guard Details`} />
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <a
              href={route('training.trainer-guards.index')}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400"
            >
              ← Back to Refresher Guards
            </a>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <span className="text-2xl font-bold text-red-700 dark:text-red-400">
                  {guard.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{guard.name}</h2>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{guard.employee_id}</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[guard.status] || statusColors.inactive}`}>
                    {guard.status}
                  </span>
                  {guard.grade && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                      {guard.grade.code}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact & Assignment Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase mb-3">Contact Information</h3>
            <div className="space-y-2">
              {guard.phone && (
                <div className="flex items-center gap-2">
                  <IconMapper name="Phone" className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-900 dark:text-gray-100">{guard.phone}</span>
                </div>
              )}
              {guard.email && (
                <div className="flex items-center gap-2">
                  <IconMapper name="Mail" className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-900 dark:text-gray-100">{guard.email}</span>
                </div>
              )}
              {guard.supervisor && (
                <div className="flex items-center gap-2">
                  <IconMapper name="User" className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-900 dark:text-gray-100">Supervisor: {guard.supervisor.name}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase mb-3">Site Assignments</h3>
            {guard.sites && guard.sites.length > 0 ? (
              <div className="space-y-2">
                {guard.sites.map((site, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <IconMapper name="MapPin" className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-900 dark:text-gray-100">{site.site_name}</span>
                    <span className="text-xs text-gray-500">({site.client.name})</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">No site assignments</p>
            )}
          </div>
        </div>

        {/* Active Refresher Training */}
        {activeRecords.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-6">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Active Refresher Training
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Refresher</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Training Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {activeRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{record.refresher.title}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{record.refresher.duration_hours} hours</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[record.status]}`}>
                          {record.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {format(parseISO(record.training_date), 'MMM d, yyyy')}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {record.status === 'in_progress' && (
                          <button
                            onClick={() => handleCompleteTraining(record)}
                            disabled={loading}
                            className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-200 disabled:opacity-50"
                          >
                            Mark Complete
                          </button>
                        )}
                        {record.status === 'completed' && (
                          <button
                            onClick={() => openEvaluateModal(record)}
                            className="px-3 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-200"
                          >
                            Evaluate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Refresher History */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Refresher Training History
            </h3>
          </div>
          {refresherHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No refresher training history
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Refresher</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Training Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Completed</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Trainer / Evaluator</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Notes</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {refresherHistory.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{record.refresher.title}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{record.refresher.duration_hours} hours</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[record.status]}`}>
                          {record.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {format(parseISO(record.training_date), 'MMM d, yyyy')}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {record.completed_date ? format(parseISO(record.completed_date), 'MMM d, yyyy') : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {record.trainer?.name || 'Unknown'}
                        </div>
                        {record.evaluator && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Evaluated by {record.evaluator.name}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900 dark:text-gray-100 max-w-xs truncate">
                          {record.trainer_notes || '-'}
                        </div>
                        {record.dismissal_reason && (
                          <div className="text-xs text-rose-600 mt-1">
                            Reason: {record.dismissal_reason}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Evaluate Modal */}
      {showEvaluateModal && selectedRecord && (
        <EvaluateModal
          record={selectedRecord}
          onClose={() => {
            setShowEvaluateModal(false);
            setSelectedRecord(null);
          }}
          onSubmit={handleEvaluate}
          loading={loading}
        />
      )}
    </AuthenticatedLayout>
  );
}

// Evaluate Modal Component
interface EvaluateModalProps {
  record: RefresherRecord;
  onClose: () => void;
  onSubmit: (status: 'passed' | 'failed' | 'promoted' | 'dismissed', notes: string, dismissalReason?: string) => void;
  loading: boolean;
}

function EvaluateModal({ record, onClose, onSubmit, loading }: EvaluateModalProps) {
  const [status, setStatus] = useState<'passed' | 'failed' | 'promoted' | 'dismissed'>('passed');
  const [notes, setNotes] = useState(record.trainer_notes || '');
  const [dismissalReason, setDismissalReason] = useState('');
  const fieldClassName = 'w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-coin-500 focus:border-coin-500';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(status, notes, (status === 'failed' || status === 'dismissed') ? dismissalReason : undefined);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Evaluate Training
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400">
            <IconMapper name="X" className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Refresher
            </label>
            <div className="text-sm text-gray-900 dark:text-gray-100 font-medium">
              {record.refresher.title}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Evaluation Result *
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className={fieldClassName}
              required
            >
              <option value="passed">Passed - Ready for duty</option>
              <option value="failed">Failed - Needs retraining</option>
              <option value="promoted">Promoted - Exceeded expectations</option>
              <option value="dismissed">Dismissed - Terminate employment</option>
            </select>
          </div>
          {(status === 'failed' || status === 'dismissed') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {status === 'dismissed' ? 'Dismissal Reason *' : 'Failure Reason *'}
              </label>
              <textarea
                value={dismissalReason}
                onChange={(e) => setDismissalReason(e.target.value)}
                className={fieldClassName}
                rows={3}
                required
                placeholder={status === 'dismissed' ? 'Reason for dismissal...' : 'Reason for failure...'}
              />
              {status === 'dismissed' && (
                <p className="text-xs text-rose-600 mt-1">
                  Warning: This will terminate the guard&apos;s employment.
                </p>
              )}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Evaluation Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={fieldClassName}
              rows={3}
              placeholder="Performance notes, observations, recommendations..."
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || ((status === 'failed' || status === 'dismissed') && !dismissalReason.trim())}
              className={`flex-1 px-4 py-2 text-white rounded-lg disabled:opacity-50 ${
                status === 'dismissed' || status === 'failed'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {loading ? 'Saving...' : 'Submit Evaluation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
