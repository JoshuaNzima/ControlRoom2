import React, { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import IconMapper from '@/Components/IconMapper';
import { format, parseISO } from 'date-fns';

interface Trainee {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  pivot: {
    enrolled_at: string;
    completed_at: string | null;
    status: 'enrolled' | 'in_progress' | 'completed' | 'dropped';
    approval_status: 'pending' | 'approved' | 'rejected';
    rejection_reason: string | null;
    notes: string | null;
    approved_at: string | null;
    approved_by: number | null;
  };
  approver?: { id: number; name: string } | null;
}

interface CrashCourse {
  id: number;
  title: string;
  description: string | null;
  duration_hours: number;
  status: 'active' | 'inactive';
  created_at: string;
  creator?: { id: number; name: string } | null;
  trainees: Trainee[];
}

interface AvailableTrainee {
  id: number;
  name: string;
}

interface PageProps {
  [key: string]: any;
  auth: { user: any };
  course: CrashCourse;
  availableTrainees: AvailableTrainee[];
}

const statusColors: Record<string, string> = {
  enrolled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  in_progress: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  dropped: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  rejected: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400',
  active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

const fieldClassName = 'w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-coin-500 focus:border-coin-500';

export default function CrashCourseShow() {
  const props = usePage<PageProps>().props;
  const auth = props.auth || { user: {} };
  const course = props.course;
  const availableTrainees = props.availableTrainees || [];

  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedTrainee, setSelectedTrainee] = useState<Trainee | null>(null);
  const [selectedTrainees, setSelectedTrainees] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');

  const toggleTrainee = (id: number) => {
    setSelectedTrainees(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleEnroll = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTrainees.length === 0) return;

    setLoading(true);
    router.post(route('training.crash-courses.enroll', course.id), {
      trainee_ids: selectedTrainees,
    }, {
      onSuccess: () => {
        setShowEnrollModal(false);
        setSelectedTrainees([]);
        setLoading(false);
      },
      onError: () => setLoading(false),
    });
  };

  const handleApprove = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrainee) return;

    setLoading(true);
    router.post(route('training.crash-courses.approve', [course.id, selectedTrainee.id]), {
      notes: approvalNotes,
    }, {
      onSuccess: () => {
        setShowApproveModal(false);
        setSelectedTrainee(null);
        setApprovalNotes('');
        setLoading(false);
      },
      onError: () => setLoading(false),
    });
  };

  const handleReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrainee) return;

    setLoading(true);
    router.post(route('training.crash-courses.reject', [course.id, selectedTrainee.id]), {
      rejection_reason: rejectionReason,
    }, {
      onSuccess: () => {
        setShowRejectModal(false);
        setSelectedTrainee(null);
        setRejectionReason('');
        setLoading(false);
      },
      onError: () => setLoading(false),
    });
  };

  const openApproveModal = (trainee: Trainee) => {
    setSelectedTrainee(trainee);
    setApprovalNotes(trainee.pivot.notes || '');
    setShowApproveModal(true);
  };

  const openRejectModal = (trainee: Trainee) => {
    setSelectedTrainee(trainee);
    setShowRejectModal(true);
  };

  const completedWithPendingApproval = course.trainees.filter(
    t => t.pivot.status === 'completed' && t.pivot.approval_status === 'pending'
  );

  return (
    <AuthenticatedLayout header={`${course.title} - Crash Course`} user={auth.user}>
      <Head title={course.title} />
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <a
              href={route('training.crash-courses.index')}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400"
            >
              ← Back to Crash Courses
            </a>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{course.title}</h2>
              <div className="flex items-center gap-3 mt-1">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[course.status]}`}>
                  {course.status}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {course.duration_hours} hours
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Created by {course.creator?.name || 'Unknown'}
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowEnrollModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <IconMapper name="UserPlus" className="h-4 w-4" />
              Enroll Trainees
            </button>
          </div>
          {course.description && (
            <p className="mt-3 text-gray-600 dark:text-gray-400">{course.description}</p>
          )}
        </div>

        {/* Pending Approval Alert */}
        {completedWithPendingApproval.length > 0 && (
          <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <IconMapper name="AlertTriangle" className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <h3 className="font-medium text-amber-900 dark:text-amber-300">
                  {completedWithPendingApproval.length} trainee(s) awaiting approval
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                  These trainees have completed the crash course and need to be approved or rejected.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Trainees List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Enrolled Trainees ({course.trainees.length})
            </h3>
          </div>

          {course.trainees.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No trainees enrolled yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Trainee</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Course Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Approval Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Enrolled Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {course.trainees.map((trainee) => (
                    <tr key={trainee.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{trainee.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{trainee.email || trainee.phone || 'No contact'}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[trainee.pivot.status]}`}>
                          {trainee.pivot.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[trainee.pivot.approval_status]}`}>
                          {trainee.pivot.approval_status}
                        </span>
                        {trainee.pivot.approval_status !== 'pending' && trainee.approver && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            by {trainee.approver.name} on {trainee.pivot.approved_at ? format(parseISO(trainee.pivot.approved_at), 'MMM d, yyyy') : ''}
                          </div>
                        )}
                        {trainee.pivot.rejection_reason && (
                          <div className="text-xs text-rose-600 mt-1 max-w-xs">
                            Reason: {trainee.pivot.rejection_reason}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {format(parseISO(trainee.pivot.enrolled_at), 'MMM d, yyyy')}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {trainee.pivot.status === 'completed' && trainee.pivot.approval_status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => openApproveModal(trainee)}
                              className="px-3 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-200"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => openRejectModal(trainee)}
                              className="px-3 py-1 bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 rounded-lg text-sm font-medium hover:bg-rose-200"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        {trainee.pivot.approval_status === 'approved' && (
                          <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                            Approved
                          </span>
                        )}
                        {trainee.pivot.approval_status === 'rejected' && (
                          <span className="text-sm text-rose-600 dark:text-rose-400 font-medium">
                            Rejected
                          </span>
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

      {/* Enroll Modal */}
      {showEnrollModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Enroll Trainees</h3>
              <button onClick={() => setShowEnrollModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400">
                <IconMapper name="X" className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleEnroll} className="p-4">
              {availableTrainees.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                  No available trainees to enroll
                </p>
              ) : (
                <>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Select trainees to enroll:
                  </p>
                  <div className="max-h-64 overflow-y-auto space-y-2 mb-4">
                    {availableTrainees.map((trainee) => (
                      <label key={trainee.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedTrainees.includes(trainee.id)}
                          onChange={() => toggleTrainee(trainee.id)}
                          className="h-4 w-4 rounded border-gray-300 dark:border-gray-700 text-red-600"
                        />
                        <span className="text-sm text-gray-900 dark:text-gray-100">{trainee.name}</span>
                      </label>
                    ))}
                  </div>
                </>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowEnrollModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || selectedTrainees.length === 0 || availableTrainees.length === 0}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? 'Enrolling...' : `Enroll ${selectedTrainees.length}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && selectedTrainee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Approve {selectedTrainee.name}
              </h3>
              <button onClick={() => setShowApproveModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400">
                <IconMapper name="X" className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleApprove} className="p-4 space-y-4">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg">
                <p className="text-sm text-emerald-800 dark:text-emerald-300">
                  Approving this trainee will mark them as having successfully completed the crash course.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Approval Notes (Optional)
                </label>
                <textarea
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  className={fieldClassName}
                  rows={3}
                  placeholder="Add any notes about the trainee's performance..."
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowApproveModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                  {loading ? 'Approving...' : 'Approve Trainee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedTrainee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Reject {selectedTrainee.name}
              </h3>
              <button onClick={() => setShowRejectModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400">
                <IconMapper name="X" className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleReject} className="p-4 space-y-4">
              <div className="bg-rose-50 dark:bg-rose-900/20 p-3 rounded-lg">
                <p className="text-sm text-rose-800 dark:text-rose-300">
                  Rejecting this trainee will require them to retake training or take alternative action.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Rejection Reason *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className={fieldClassName}
                  rows={3}
                  required
                  placeholder="Provide a reason for rejection..."
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !rejectionReason.trim()}
                  className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50"
                >
                  {loading ? 'Rejecting...' : 'Reject Trainee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AuthenticatedLayout>
  );
}
