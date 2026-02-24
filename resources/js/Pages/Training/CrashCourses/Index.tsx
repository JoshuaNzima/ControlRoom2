import React, { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import TrainingLayout from '@/Layouts/TrainingLayout';
import IconMapper from '@/Components/IconMapper';

interface CrashCourse {
  id: number;
  title: string;
  description: string | null;
  duration_hours: number;
  status: 'active' | 'inactive';
  trainees_count: number;
  pending_approval_count?: number;
  created_at: string;
}

interface Trainee {
  id: number;
  name: string;
  status: string;
}

interface PageProps {
  [key: string]: any;
  auth: { user: any };
  courses: {
    data: CrashCourse[];
    current_page: number;
    last_page: number;
    total: number;
  };
  trainees: Trainee[];
  filters: { status?: string };
}

const fieldClassName = 'w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-coin-500 focus:border-coin-500';

export default function CrashCoursesIndex() {
  const props = usePage<PageProps>().props;
  const auth = props.auth || { user: {} };
  const courses = props.courses || { data: [], current_page: 1, last_page: 1, total: 0 };
  const trainees = props.trainees || [];
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CrashCourse | null>(null);
  const [selectedTrainees, setSelectedTrainees] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    duration_hours: 8,
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    router.post(route('training.crash-courses.store'), form, {
      onSuccess: () => {
        setShowAddModal(false);
        setForm({ title: '', description: '', duration_hours: 8 });
        setLoading(false);
      },
      onError: () => setLoading(false),
    });
  };

  const handleEnroll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || selectedTrainees.length === 0) return;

    setLoading(true);
    router.post(route('training.crash-courses.enroll', selectedCourse.id), {
      trainee_ids: selectedTrainees,
    }, {
      onSuccess: () => {
        setShowEnrollModal(false);
        setSelectedCourse(null);
        setSelectedTrainees([]);
        setLoading(false);
      },
      onError: () => setLoading(false),
    });
  };

  const toggleTrainee = (id: number) => {
    setSelectedTrainees(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const statusColors: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  };

  return (
    <TrainingLayout title="Crash Courses" user={auth.user}>
      <Head title="Crash Courses" />
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Crash Courses</h2>
            <p className="text-gray-600 dark:text-gray-400">Quick intensive training courses for trainees</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <IconMapper name="Plus" className="h-4 w-4" />
            Add Course
          </button>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.data.map((course) => (
            <div key={course.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{course.title}</h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[course.status]}`}>
                  {course.status}
                </span>
              </div>
              {course.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{course.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                <span className="flex items-center gap-1">
                  <IconMapper name="Clock" className="h-4 w-4" />
                  {course.duration_hours} hours
                </span>
                <span className="flex items-center gap-1">
                  <IconMapper name="Users" className="h-4 w-4" />
                  {course.trainees_count} enrolled
                </span>
                {course.pending_approval_count && course.pending_approval_count > 0 ? (
                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                    <IconMapper name="AlertCircle" className="h-4 w-4" />
                    {course.pending_approval_count} pending approval
                  </span>
                ) : null}
              </div>
              <div className="flex gap-2">
                <a
                  href={route('training.crash-courses.show', course.id)}
                  className="flex-1 text-center px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-sm font-medium"
                >
                  View
                </a>
                <button
                  onClick={() => { setSelectedCourse(course); setShowEnrollModal(true); }}
                  className="flex-1 text-center px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 text-sm font-medium"
                >
                  Enroll
                </button>
              </div>
            </div>
          ))}
        </div>

        {courses.data.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
            <IconMapper name="Zap" className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">No crash courses</h3>
            <p className="text-gray-500 dark:text-gray-400">Create your first crash course to get started</p>
          </div>
        )}

        {/* Pagination */}
        {courses.last_page > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            {Array.from({ length: courses.last_page }, (_, i) => i + 1).map(page => (
              <a
                key={page}
                href={route('training.crash-courses.index', { page })}
                className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  page === courses.current_page
                    ? 'bg-red-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {page}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Add Course Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Add Crash Course</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <IconMapper name="X" className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className={fieldClassName}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className={fieldClassName}
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duration (hours) *</label>
                <input
                  type="number"
                  min={1}
                  max={72}
                  value={form.duration_hours}
                  onChange={(e) => setForm({ ...form, duration_hours: parseInt(e.target.value) || 8 })}
                  className={fieldClassName}
                  required
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enroll Modal */}
      {showEnrollModal && selectedCourse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Enroll in {selectedCourse.title}</h3>
              <button onClick={() => setShowEnrollModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <IconMapper name="X" className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleEnroll} className="p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Select trainees to enroll in this crash course:
              </p>
              <div className="max-h-64 overflow-y-auto space-y-2 mb-4">
                {trainees.filter(t => t.status !== 'hired').map((trainee) => (
                  <label key={trainee.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTrainees.includes(trainee.id)}
                      onChange={() => toggleTrainee(trainee.id)}
                      className="h-4 w-4 rounded border-gray-300 dark:border-gray-700 text-red-600"
                    />
                    <span className="text-sm text-gray-900 dark:text-gray-100">{trainee.name}</span>
                    <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">{trainee.status}</span>
                  </label>
                ))}
              </div>
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
                  disabled={loading || selectedTrainees.length === 0}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? 'Enrolling...' : `Enroll ${selectedTrainees.length}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </TrainingLayout>
  );
}
