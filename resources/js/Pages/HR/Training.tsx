import React from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import IconMapper from '@/Components/IconMapper';
import Modal from '@/Components/Modal';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';

export default function HRTraining() {
  const { auth, courses, sessions, enrollments, guards = [], filters = {} } = (usePage().props as any);
  const [openCourse, setOpenCourse] = React.useState(false);
  const [editCourse, setEditCourse] = React.useState<any>(null);
  const [openSession, setOpenSession] = React.useState(false);
  const [openEnroll, setOpenEnroll] = React.useState(false);
  const [flt, setFlt] = React.useState<any>({ q: filters.q || '', perPage: filters.perPage || 15, course_id: filters.course_id || 0 });
  React.useEffect(() => { setFlt({ q: filters.q || '', perPage: filters.perPage || 15, course_id: filters.course_id || 0 }); }, [filters]);

  const applyFilters = () => router.get(route('hr.training'), { ...flt }, { preserveState: true, replace: true, preserveScroll: true });
  const resetFilters = () => { const base = { q: '', perPage: 15, course_id: 0 }; setFlt(base); router.get(route('hr.training'), base, { preserveState: true, replace: true, preserveScroll: true }); };

  const destroyCourse = (c: any) => { if (!confirm('Delete this course?')) return; router.delete(route('hr.training.courses.destroy', { course: c.id }), { preserveScroll: true }); };
  const destroySession = (s: any) => { if (!confirm('Delete this session?')) return; router.delete(route('hr.training.sessions.destroy', { session: s.id }), { preserveScroll: true }); };
  const completeEnrollment = (e: any) => { router.post(route('hr.training.enrollments.complete', { enrollment: e.id }), {}, { preserveScroll: true }); };
  const cancelEnrollment = (e: any) => { if (!confirm('Cancel this enrollment?')) return; router.post(route('hr.training.enrollments.cancel', { enrollment: e.id }), {}, { preserveScroll: true }); };

  return (
    <AuthenticatedLayout header="Training" user={auth?.user as any}>
      <Head title="Training" />
      
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-red-900 via-red-800 to-rose-900 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                <IconMapper name="GraduationCap" size={28} />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">Training</h1>
                <p className="text-red-100 dark:text-gray-400 text-sm mt-1">Manage courses, sessions, and enrollments</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => { setEditCourse(null); setOpenCourse(true); }} className="bg-emerald-600 hover:bg-emerald-700">
                <IconMapper name="Plus" size={16} className="mr-1" /> New Course
              </Button>
              <Button onClick={() => setOpenSession(true)} className="bg-indigo-600 hover:bg-indigo-700">
                <IconMapper name="CalendarPlus" size={16} className="mr-1" /> New Session
              </Button>
              <Button onClick={() => setOpenEnroll(true)} className="bg-rose-600 hover:bg-rose-700">
                <IconMapper name="UserPlus" size={16} className="mr-1" /> Enroll
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Filter Card */}
        <Card className="p-4 dark:bg-gray-800 dark:border-gray-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <IconMapper name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input placeholder="Search title/code/category..." value={flt.q} onChange={(e) => setFlt((s: any) => ({ ...s, q: e.target.value }))} onKeyDown={(e) => { if (e.key === 'Enter') applyFilters(); }} className="w-full border rounded-md pl-9 pr-3 py-2 dark:bg-gray-900 dark:border-gray-600 dark:text-gray-100 text-sm" />
            </div>
            <select value={flt.course_id} onChange={(e) => setFlt((s: any) => ({ ...s, course_id: Number(e.target.value) }))} className="w-full border rounded-md px-3 py-2 dark:bg-gray-900 dark:border-gray-600 dark:text-gray-100 text-sm">
              <option value={0}>All Courses</option>
              {(courses?.data || []).map((c: any) => (
                <option key={c.id} value={c.id}>{c.title}{c.code ? ` (${c.code})` : ''}</option>
              ))}
            </select>
            <select value={flt.perPage} onChange={(e) => setFlt((s: any) => ({ ...s, perPage: Number(e.target.value) }))} className="w-full border rounded-md px-3 py-2 dark:bg-gray-900 dark:border-gray-600 dark:text-gray-100 text-sm">
              {[10,15,20,30].map(n => <option key={n} value={n}>{n}/page</option>)}
            </select>
            <div className="flex gap-2">
              <Button onClick={applyFilters} className="flex-1">Apply</Button>
              <Button onClick={resetFilters} variant="ghost">Reset</Button>
            </div>
          </div>
        </Card>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Courses Column */}
          <Card className="p-4 dark:bg-gray-800 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-slate-400 mb-3 flex items-center justify-between">
                <span>Courses</span>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-slate-800">
                {(!courses || (courses.data || []).length === 0) && (
                  <div className="text-sm text-gray-500 dark:text-slate-400 py-6">No courses.</div>
                )}
                {(courses?.data || []).map((c: any) => (
                  <div key={c.id} className="py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{c.title} {c.code ? `(${c.code})` : ''}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">{c.category || '—'} · {c.sessions_count} sessions · {c.enrollments_count} enrollments</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setEditCourse(c); setOpenCourse(true); }} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-xs"><IconMapper name="Edit" className="w-3 h-3" /> Edit</button>
                        <button onClick={() => destroyCourse(c)} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white text-xs"><IconMapper name="Trash2" className="w-3 h-3" /> Remove</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {courses && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-xs text-gray-600 dark:text-gray-400">Page {courses.current_page} of {courses.last_page}</div>
                  <div className="flex items-center gap-2">
                    <button disabled={!courses.prev_page_url} onClick={() => router.visit(courses.prev_page_url, { preserveState: true, replace: true, preserveScroll: true })} className="px-3 py-1.5 text-sm rounded bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">Prev</button>
                    <button disabled={!courses.next_page_url} onClick={() => router.visit(courses.next_page_url, { preserveState: true, replace: true, preserveScroll: true })} className="px-3 py-1.5 text-sm rounded bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">Next</button>
                  </div>
                </div>
              )}
          </Card>

          {/* Sessions Column */}
          <Card className="p-4 dark:bg-gray-800 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-3 flex items-center justify-between">
                <span>Sessions</span>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-slate-800">
                {(!sessions || (sessions.data || []).length === 0) && (
                  <div className="text-sm text-gray-500 dark:text-slate-400 py-6">No sessions.</div>
                )}
                {(sessions?.data || []).map((s: any) => (
                  <div key={s.id} className="py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{s.title || 'Session'} · {s.mode}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">{s.start_at || '-'} {s.end_at ? `– ${s.end_at}` : ''} · {s.location_or_link || '—'} {s.trainer_name ? `· ${s.trainer_name}` : ''}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => destroySession(s)} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white text-xs"><IconMapper name="Trash2" className="w-3 h-3" /> Remove</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {sessions && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-xs text-gray-600 dark:text-gray-400">Page {sessions.current_page} of {sessions.last_page}</div>
                  <div className="flex items-center gap-2">
                    <button disabled={!sessions.prev_page_url} onClick={() => router.visit(sessions.prev_page_url, { preserveState: true, replace: true, preserveScroll: true })} className="px-3 py-1.5 text-sm rounded bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">Prev</button>
                    <button disabled={!sessions.next_page_url} onClick={() => router.visit(sessions.next_page_url, { preserveState: true, replace: true, preserveScroll: true })} className="px-3 py-1.5 text-sm rounded bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">Next</button>
                  </div>
                </div>
              )}
          </Card>

          {/* Enrollments Column */}
          <Card className="p-4 dark:bg-gray-800 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-3 flex items-center justify-between">
                <span>Enrollments</span>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-slate-800">
                {(!enrollments || (enrollments.data || []).length === 0) && (
                  <div className="text-sm text-gray-500 dark:text-slate-400 py-6">No enrollments.</div>
                )}
                {(enrollments?.data || []).map((e: any) => (
                  <div key={e.id} className="py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{e.guard?.name || 'Guard'} {e.guard?.employee_id ? `(${e.guard.employee_id})` : ''}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">{e.course?.title || '—'} {e.session ? `· ${e.session.title} (${e.session.start_at || '-'})` : ''}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${e.status === 'completed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100' : e.status === 'cancelled' ? 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-100' : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100'}`}>{e.status}</span>
                        {e.status === 'enrolled' && (
                          <>
                            <button onClick={() => completeEnrollment(e)} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs"><IconMapper name="Check" className="w-3 h-3" /> Complete</button>
                            <button onClick={() => cancelEnrollment(e)} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-xs"><IconMapper name="X" className="w-3 h-3" /> Cancel</button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {enrollments && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-xs text-gray-600 dark:text-gray-400">Page {enrollments.current_page} of {enrollments.last_page}</div>
                  <div className="flex items-center gap-2">
                    <button disabled={!enrollments.prev_page_url} onClick={() => router.visit(enrollments.prev_page_url, { preserveState: true, replace: true, preserveScroll: true })} className="px-3 py-1.5 text-sm rounded bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">Prev</button>
                    <button disabled={!enrollments.next_page_url} onClick={() => router.visit(enrollments.next_page_url, { preserveState: true, replace: true, preserveScroll: true })} className="px-3 py-1.5 text-sm rounded bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">Next</button>
                  </div>
                </div>
              )}
          </Card>
        </div>

        <CourseModal open={openCourse} onClose={() => setOpenCourse(false)} edit={editCourse} />
        <SessionModal open={openSession} onClose={() => setOpenSession(false)} defaultCourseId={flt.course_id} courses={courses?.data || []} />
        <EnrollModal open={openEnroll} onClose={() => setOpenEnroll(false)} defaultCourseId={flt.course_id} courses={courses?.data || []} guards={guards} sessions={sessions?.data || []} />
      </div>
    </AuthenticatedLayout>
  );
}

function CourseModal({ open, onClose, edit }: { open: boolean; onClose: () => void; edit?: any }) {
  const form: any = useForm<any>({
    title: edit?.title || '',
    code: edit?.code || '',
    category: edit?.category || '',
    active: edit?.active ?? true,
    description: edit?.description || '',
  } as any);
  React.useEffect(() => {
    form.setData({ title: edit?.title || '', code: edit?.code || '', category: edit?.category || '', active: edit?.active ?? true, description: edit?.description || '' });
  }, [edit]);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (edit?.id) form.put(route('hr.training.courses.update', { course: edit.id }), { onSuccess: onClose });
    else form.post(route('hr.training.courses.store'), { onSuccess: onClose });
  };
  return (
    <Modal show={open} onClose={onClose} maxWidth="md">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white dark:bg-gray-900 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{edit?.id ? 'Edit Course' : 'New Course'}</h2>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200">✕</button>
      </div>
      <div className="px-6 py-4 bg-white dark:bg-gray-900">
        <form className="grid grid-cols-1 gap-3" onSubmit={submit}>
          <div>
            <label className="block text-sm font-medium">Title</label>
            <input className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.title} onChange={(e) => form.setData('title', e.target.value)} />
            {form.errors.title && <p className="text-xs text-rose-600 mt-1">{form.errors.title}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium">Code</label>
              <input className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.code} onChange={(e) => form.setData('code', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium">Category</label>
              <input className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.category} onChange={(e) => form.setData('category', e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <label className="block text-sm font-medium">Active</label>
              <input type="checkbox" checked={!!form.data.active} onChange={(e) => form.setData('active', e.target.checked)} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium">Description</label>
            <textarea rows={3} className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.description} onChange={(e) => form.setData('description', e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700" disabled={form.processing}>Cancel</button>
            <button type="submit" disabled={form.processing} className="px-4 py-2 text-sm rounded-md bg-emerald-600 text-white hover:bg-emerald-700">{form.processing ? 'Saving…' : (edit?.id ? 'Save' : 'Create')}</button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function SessionModal({ open, onClose, defaultCourseId, courses }: { open: boolean; onClose: () => void; defaultCourseId?: number; courses: any[] }) {
  const form: any = useForm<any>({ hr_training_course_id: defaultCourseId || '', title: '', mode: 'in_person', location_or_link: '', start_at: '', end_at: '', capacity: '', trainer_name: '' } as any);
  React.useEffect(() => { form.setData('hr_training_course_id', defaultCourseId || ''); }, [defaultCourseId]);
  const submit = (e: React.FormEvent) => { e.preventDefault(); form.post(route('hr.training.sessions.store'), { onSuccess: onClose }); };
  return (
    <Modal show={open} onClose={onClose} maxWidth="md">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white dark:bg-gray-900 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">New Session</h2>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200">✕</button>
      </div>
      <div className="px-6 py-4 bg-white dark:bg-gray-900">
        <form className="grid grid-cols-1 gap-3" onSubmit={submit}>
          <div>
            <label className="block text-sm font-medium">Course</label>
            <select className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.hr_training_course_id as any} onChange={(e) => form.setData('hr_training_course_id', e.target.value)}>
              <option value="">Select course…</option>
              {(courses || []).map((c: any) => (
                <option key={c.id} value={c.id}>{c.title}{c.code ? ` (${c.code})` : ''}</option>
              ))}
            </select>
            {form.errors.hr_training_course_id && <p className="text-xs text-rose-600 mt-1">{form.errors.hr_training_course_id}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Title</label>
            <input className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.title as any} onChange={(e) => form.setData('title', e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium">Mode</label>
              <select className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.mode as any} onChange={(e) => form.setData('mode', e.target.value)}>
                <option value="in_person">In person</option>
                <option value="video">Video</option>
                <option value="phone">Phone</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Location/Link</label>
              <input className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.location_or_link as any} onChange={(e) => form.setData('location_or_link', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium">Start</label>
              <input type="datetime-local" className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.start_at as any} onChange={(e) => form.setData('start_at', e.target.value)} />
              {form.errors.start_at && <p className="text-xs text-rose-600 mt-1">{form.errors.start_at}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium">End</label>
              <input type="datetime-local" className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.end_at as any} onChange={(e) => form.setData('end_at', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium">Capacity</label>
              <input type="number" className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.capacity as any} onChange={(e) => form.setData('capacity', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium">Trainer</label>
              <input className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.trainer_name as any} onChange={(e) => form.setData('trainer_name', e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700" disabled={form.processing}>Cancel</button>
            <button type="submit" disabled={form.processing} className="px-4 py-2 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700">{form.processing ? 'Saving…' : 'Create'}</button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function EnrollModal({ open, onClose, defaultCourseId, courses, sessions, guards }: { open: boolean; onClose: () => void; defaultCourseId?: number; courses: any[]; sessions: any[]; guards: any[] }) {
  const form: any = useForm<any>({ hr_training_course_id: defaultCourseId || '', hr_training_session_id: '', guard_id: '' } as any);
  React.useEffect(() => { form.setData('hr_training_course_id', defaultCourseId || ''); }, [defaultCourseId]);
  const submit = (e: React.FormEvent) => { e.preventDefault(); form.post(route('hr.training.enroll'), { onSuccess: onClose }); };
  const courseId = form.data.hr_training_course_id;
  const filteredSessions = (sessions || []).filter((s: any) => !courseId || s.hr_training_course_id === courseId);
  return (
    <Modal show={open} onClose={onClose} maxWidth="md">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white dark:bg-gray-900 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Enroll Guard</h2>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200">✕</button>
      </div>
      <div className="px-6 py-4 bg-white dark:bg-gray-900">
        <form className="grid grid-cols-1 gap-3" onSubmit={submit}>
          <div>
            <label className="block text-sm font-medium">Course</label>
            <select className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.hr_training_course_id as any} onChange={(e) => form.setData('hr_training_course_id', Number(e.target.value))}>
              <option value="">Select course…</option>
              {(courses || []).map((c: any) => (
                <option key={c.id} value={c.id}>{c.title}{c.code ? ` (${c.code})` : ''}</option>
              ))}
            </select>
            {form.errors.hr_training_course_id && <p className="text-xs text-rose-600 mt-1">{form.errors.hr_training_course_id}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Session (optional)</label>
            <select className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.hr_training_session_id as any} onChange={(e) => form.setData('hr_training_session_id', e.target.value)}>
              <option value="">—</option>
              {(filteredSessions || []).map((s: any) => (
                <option key={s.id} value={s.id}>{s.title || 'Session'} {s.start_at ? `• ${s.start_at}` : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Guard</label>
            <select className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.guard_id as any} onChange={(e) => form.setData('guard_id', e.target.value)}>
              <option value="">Select guard…</option>
              {(guards || []).map((g: any) => (
                <option key={g.id} value={g.id}>{g.name}{g.employee_id ? ` (${g.employee_id})` : ''}</option>
              ))}
            </select>
            {form.errors.guard_id && <p className="text-xs text-rose-600 mt-1">{form.errors.guard_id}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700" disabled={form.processing}>Cancel</button>
            <button type="submit" disabled={form.processing} className="px-4 py-2 text-sm rounded-md bg-rose-600 text-white hover:bg-rose-700">{form.processing ? 'Saving…' : 'Enroll'}</button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
