import React from 'react';
import SuperAdminLayout from '@/Layouts/SuperAdminLayout';
import { Head, usePage, router } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import IconMapper from '@/Components/IconMapper';
import { useTheme } from '@/Providers/ThemeProvider';
import useToast from '@/Components/ui/use-toast';
import PushNotificationSettings from '@/Components/Common/PushNotificationSettings';

type FinanceDefaults = {
  guard_absence_deduction_per_day: number;
  staff_absence_deduction_per_day: number;
  overtime_multiplier_default: number;
};

type PayProfile = {
  id: number;
  payee_type: 'guard' | 'user';
  payee_id: number;
  monthly_salary: string | number;
  overtime_multiplier?: string | number | null;
  advance_amount?: string | number | null;
  allowances?: any;
  absence_deduction_per_day?: string | number | null;
};

type PageProps = {
  auth: {
    user: {
      id: number;
      name: string;
      email: string;
      roles: string[];
    }
  };
  system: {
    database_status: string;
    database_size: string;
    cache_size: string;
    storage_free: string;
    memory_usage: string;
    uptime: string;
  };
  finance?: {
    payrollDefaults: FinanceDefaults;
    payProfiles: PayProfile[];
    payeeOptions?: {
      guards: { id: number; label: string }[];
      users: { id: number; label: string }[];
    };
  };
  hr?: {
    guardGrades: Array<{
      id: number;
      code: string;
      name: string;
      description?: string | null;
      base_salary?: number | string;
      overtime_multiplier?: number | string | null;
      allowances?: any;
      absence_deduction_per_day?: number | string | null;
    }>;
  };
	attendance?: {
		methods?: {
			auto_absent?: boolean;
			auto_present?: boolean;
		};
	};
};

export default function SuperAdminSettings() {
  const { auth, system, finance, hr, attendance } = usePage<PageProps>().props as any;
  const { theme, toggle } = useTheme();
  const [tab, setTab] = React.useState<'user' | 'finance' | 'hr' | 'system' | 'attendance' | 'notifications'>('finance');

  // Loading states
  const [loading, setLoading] = React.useState<Record<string, boolean>>({});
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const { toast } = useToast();

  const setLoadingState = (key: string, value: boolean) => {
    setLoading(prev => ({ ...prev, [key]: value }));
  };

  const setErrorState = (key: string, value: string) => {
    setErrors(prev => ({ ...prev, [key]: value }));
    if (value) {
      setTimeout(() => setErrors(prev => ({ ...prev, [key]: '' })), 5000);
    }
  };

	const [attendanceMethods, setAttendanceMethods] = React.useState(() => ({
		auto_absent: Boolean(attendance?.methods?.auto_absent ?? true),
		auto_present: Boolean(attendance?.methods?.auto_present ?? false),
	}));

	const submitAttendanceMethods = (e: React.FormEvent) => {
		e.preventDefault();
		setLoadingState('attendanceMethods', true);
		setErrorState('attendanceMethods', '');
		router.post(route('superadmin.attendance.methods.update'), {
			auto_absent: attendanceMethods.auto_absent ? 1 : 0,
			auto_present: attendanceMethods.auto_present ? 1 : 0,
		}, {
			preserveScroll: true,
			onFinish: () => setLoadingState('attendanceMethods', false),
			onSuccess: () => toast({ title: 'Attendance settings saved' }),
			onError: (errs: any) => setErrorState('attendanceMethods', Object.values(errs)[0] as string || 'Failed to save attendance settings'),
		});
	};

  // Payroll Defaults state
  const [defaults, setDefaults] = React.useState<FinanceDefaults>(() => ({
    guard_absence_deduction_per_day: Number(finance?.payrollDefaults?.guard_absence_deduction_per_day ?? 0),
    staff_absence_deduction_per_day: Number(finance?.payrollDefaults?.staff_absence_deduction_per_day ?? 0),
    overtime_multiplier_default: Number(finance?.payrollDefaults?.overtime_multiplier_default ?? 1.5),
  }));

  // Pay Profiles state
  const [profiles, setProfiles] = React.useState<PayProfile[]>(() => (finance?.payProfiles ?? []));
  const [newProfile, setNewProfile] = React.useState<PayProfile>({
    id: 0,
    payee_type: 'guard',
    payee_id: 0,
    monthly_salary: 0,
    overtime_multiplier: 1.5,
    advance_amount: 0,
    allowances: [],
    absence_deduction_per_day: 0,
  });

  const submitDefaults = (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingState('payrollDefaults', true);
    setErrorState('payrollDefaults', '');
    router.post(route('admin.settings.finance.payroll-defaults'), defaults, {
      preserveScroll: true,
      onFinish: () => setLoadingState('payrollDefaults', false),
      onError: (errs: any) => setErrorState('payrollDefaults', Object.values(errs)[0] as string || 'Failed to save payroll defaults'),
    });
  };

  const submitNewProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingState('newProfile', true);
    setErrorState('newProfile', '');
    const payload: any = {
      ...newProfile,
      allowances: typeof newProfile.allowances === 'string' ? newProfile.allowances : JSON.stringify(newProfile.allowances ?? []),
    };
    router.post(route('admin.settings.finance.pay-profiles.store'), payload, {
      preserveScroll: true,
      onSuccess: () => {
        setNewProfile({ id: 0, payee_type: 'guard', payee_id: 0, monthly_salary: 0, overtime_multiplier: 1.5, advance_amount: 0, allowances: [], absence_deduction_per_day: 0 });
      },
      onFinish: () => setLoadingState('newProfile', false),
      onError: (errs: any) => setErrorState('newProfile', Object.values(errs)[0] as string || 'Failed to create pay profile'),
    });
  };

  const updateProfile = (p: PayProfile) => {
    setLoadingState(`profile_${p.id}`, true);
    setErrorState(`profile_${p.id}`, '');
    const payload: any = {
      monthly_salary: p.monthly_salary,
      overtime_multiplier: p.overtime_multiplier,
      advance_amount: p.advance_amount,
      allowances: typeof p.allowances === 'string' ? p.allowances : JSON.stringify(p.allowances ?? []),
      absence_deduction_per_day: p.absence_deduction_per_day,
    };
    router.put(route('admin.settings.finance.pay-profiles.update', p.id), payload, {
      preserveScroll: true,
      onFinish: () => setLoadingState(`profile_${p.id}`, false),
      onError: (errs: any) => setErrorState(`profile_${p.id}`, Object.values(errs)[0] as string || 'Failed to update profile'),
    });
  };

  const deleteProfile = (id: number) => {
    if (!confirm('Remove this pay profile?')) return;
    setLoadingState(`delete_profile_${id}`, true);
    router.delete(route('admin.settings.finance.pay-profiles.destroy', id), {
      preserveScroll: true,
      onFinish: () => setLoadingState(`delete_profile_${id}`, false),
      onError: () => setErrorState(`delete_profile_${id}`, 'Failed to delete profile'),
    });
  };

  // HR: Guard Grades state & handlers
  type GuardGrade = Required<PageProps>['hr']['guardGrades'][number];
  const [grades, setGrades] = React.useState<GuardGrade[]>(() => (hr?.guardGrades ?? []));
  const [showGradeModal, setShowGradeModal] = React.useState(false);
  const [editingGrade, setEditingGrade] = React.useState<GuardGrade | null>(null);
  const [gradeForm, setGradeForm] = React.useState<Partial<GuardGrade>>({
    code: '', name: '', description: '', base_salary: 0, overtime_multiplier: 1.5, allowances: [], absence_deduction_per_day: 0,
  });

  const openNewGrade = () => {
    setEditingGrade(null);
    setGradeForm({ code: '', name: '', description: '', base_salary: 0, overtime_multiplier: 1.5, allowances: [], absence_deduction_per_day: 0 });
    setShowGradeModal(true);
  };
  const openEditGrade = (g: GuardGrade) => {
    setEditingGrade(g);
    setGradeForm({ ...g, allowances: g.allowances ?? [] });
    setShowGradeModal(true);
  };
  const submitGrade = (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingState('grade', true);
    setErrorState('grade', '');
    const payload: any = {
      ...gradeForm,
      allowances: typeof gradeForm.allowances === 'string' ? gradeForm.allowances : JSON.stringify(gradeForm.allowances ?? []),
    };
    const onFinish = () => setLoadingState('grade', false);
    const onError = (errs: any) => setErrorState('grade', Object.values(errs)[0] as string || 'Failed to save grade');
    if (editingGrade) {
      router.put(route('admin.settings.hr.guard-grades.update', editingGrade.id), payload, {
        preserveScroll: true,
        onSuccess: () => setShowGradeModal(false),
        onFinish,
        onError,
      });
    } else {
      router.post(route('admin.settings.hr.guard-grades.store'), payload, {
        preserveScroll: true,
        onSuccess: () => setShowGradeModal(false),
        onFinish,
        onError,
      });
    }
  };
  const deleteGrade = (g: GuardGrade) => {
    if (!confirm(`Delete grade ${g.code}?`)) return;
    setLoadingState(`delete_grade_${g.id}`, true);
    router.delete(route('admin.settings.hr.guard-grades.destroy', g.id), {
      preserveScroll: true,
      onFinish: () => setLoadingState(`delete_grade_${g.id}`, false),
      onError: () => setErrorState(`delete_grade_${g.id}`, 'Failed to delete grade'),
    });
  };

  return (
    <SuperAdminLayout title="System Settings" user={auth?.user as any}>
      <Head title="System Settings" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-700 via-red-600 to-rose-600 text-white shadow-2xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20" />
          <div className="relative p-6 sm:p-8">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                <IconMapper name="Settings" size={32} />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">System Settings</h1>
                <p className="text-red-100 mt-1">Configure core system parameters and defaults</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="w-full overflow-x-auto">
          <div className="inline-flex whitespace-nowrap rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-1 shadow-sm">
            {[
              { id: 'finance', label: 'Finance', icon: 'DollarSign' },
              { id: 'hr', label: 'HR', icon: 'Users2' },
              { id: 'attendance', label: 'Attendance', icon: 'Clock' },
              { id: 'notifications', label: 'Notifications', icon: 'Bell' },
              { id: 'system', label: 'System', icon: 'Server' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  tab === t.id
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <IconMapper name={t.icon as any} size={16} />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Attendance */}
        {tab === 'attendance' && (
          <section className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold mb-2">Attendance Methods</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Enable/disable system-wide attendance automation. Auto-present assumes present at shift start until Control Room marks absent.
              </p>
              <form onSubmit={submitAttendanceMethods} className="space-y-4">
                <div className="space-y-3">
                  <label className="flex items-center justify-between gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Auto-Absent</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Automatically creates absent records for guards with shifts but no attendance.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={attendanceMethods.auto_absent}
                      onChange={(e) => setAttendanceMethods(m => ({ ...m, auto_absent: e.target.checked }))}
                      className="rounded border-gray-300 dark:border-gray-700"
                    />
                  </label>
                  <label className="flex items-center justify-between gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Auto-Present</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Marks guards as present at shift start, then Control Room can mark absent if needed.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={attendanceMethods.auto_present}
                      onChange={(e) => setAttendanceMethods(m => ({ ...m, auto_present: e.target.checked }))}
                      className="rounded border-gray-300 dark:border-gray-700"
                    />
                  </label>
                </div>
                {errors.attendanceMethods && (
                  <div className="text-sm text-red-600 dark:text-red-400">{errors.attendanceMethods}</div>
                )}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading.attendanceMethods}
                    className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loading.attendanceMethods && (
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    )}
                    {loading.attendanceMethods ? 'Saving...' : 'Save Attendance Methods'}
                  </button>
                </div>
              </form>
            </div>
          </section>
        )}

        {/* HR */}
        {tab === 'hr' && (
          <section className="space-y-6">
            {/* Guard Grades */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Guard Grades</h2>
                <button onClick={openNewGrade} className="px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700">Add Grade</button>
              </div>
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600 dark:text-gray-300">
                      <th className="px-2 py-2">Code</th>
                      <th className="px-2 py-2">Name</th>
                      <th className="px-2 py-2">Base Salary</th>
                      <th className="px-2 py-2">OT</th>
                      <th className="px-2 py-2">Absence</th>
                      <th className="px-2 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {(hr?.guardGrades ?? []).map((g: any) => (
                      <tr key={g.id} className="text-gray-900 dark:text-gray-100">
                        <td className="px-2 py-2">{g.code}</td>
                        <td className="px-2 py-2">{g.name}</td>
                        <td className="px-2 py-2">{Number(g.base_salary ?? 0).toFixed(2)}</td>
                        <td className="px-2 py-2">{Number(g.overtime_multiplier ?? 1.5).toFixed(2)}</td>
                        <td className="px-2 py-2">{Number(g.absence_deduction_per_day ?? 0).toFixed(2)}</td>
                        <td className="px-2 py-2 space-x-2">
                          <button onClick={() => openEditGrade(g)} className="px-3 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700">Edit</button>
                          <button
                            onClick={() => deleteGrade(g)}
                            disabled={loading[`delete_grade_${g.id}`]}
                            className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {loading[`delete_grade_${g.id}`] ? '...' : 'Delete'}
                          </button>
                          {errors[`delete_grade_${g.id}`] && (
                            <span className="text-xs text-red-600 dark:text-red-400 ml-1">{errors[`delete_grade_${g.id}`]}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Grade Modal */}
            <Modal show={showGradeModal} onClose={() => setShowGradeModal(false)} maxWidth="lg">
              <form onSubmit={submitGrade} className="p-4 sm:p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{editingGrade ? 'Edit Grade' : 'Add Grade'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Code</label>
                    <input className="mt-1 w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" value={gradeForm.code as any}
                      onChange={(e)=>setGradeForm(f=>({ ...f, code: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                    <input className="mt-1 w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" value={gradeForm.name as any}
                      onChange={(e)=>setGradeForm(f=>({ ...f, name: e.target.value }))} required />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                    <textarea className="mt-1 w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" rows={2} value={(gradeForm.description as any) ?? ''}
                      onChange={(e)=>setGradeForm(f=>({ ...f, description: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Base Salary</label>
                    <input type="number" step="0.01" className="mt-1 w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                      value={Number(gradeForm.base_salary ?? 0)} onChange={(e)=>setGradeForm(f=>({ ...f, base_salary: Number(e.target.value) }))} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">OT Multiplier</label>
                    <input type="number" step="0.01" className="mt-1 w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                      value={Number(gradeForm.overtime_multiplier ?? 1.5)} onChange={(e)=>setGradeForm(f=>({ ...f, overtime_multiplier: Number(e.target.value) }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Absence Deduction/Day</label>
                    <input type="number" step="0.01" className="mt-1 w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                      value={Number(gradeForm.absence_deduction_per_day ?? 0)} onChange={(e)=>setGradeForm(f=>({ ...f, absence_deduction_per_day: Number(e.target.value) }))} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Allowances (JSON)</label>
                    <textarea className="mt-1 w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" rows={2}
                      value={typeof gradeForm.allowances === 'string' ? (gradeForm.allowances as any) : JSON.stringify(gradeForm.allowances ?? [])}
                      onChange={(e)=>setGradeForm(f=>({ ...f, allowances: e.target.value }))} />
                  </div>
                </div>
                {errors.grade && (
                  <div className="text-sm text-red-600 dark:text-red-400">{errors.grade}</div>
                )}
                <div className="mt-4 flex items-center justify-end gap-3">
                  <button type="button" onClick={() => setShowGradeModal(false)} className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200">Cancel</button>
                  <button
                    type="submit"
                    disabled={loading.grade}
                    className="px-4 py-2 rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loading.grade && (
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    )}
                    {loading.grade ? (editingGrade ? 'Saving...' : 'Creating...') : (editingGrade ? 'Save' : 'Create')}
                  </button>
                </div>
              </form>
            </Modal>
          </section>
        )}

        {/* Finance */}
        {tab === 'finance' && (
          <section className="space-y-6">
            {/* Payroll Defaults */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Payroll Defaults</h2>
              <form onSubmit={submitDefaults} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Guard Absence Deduction/Day (MWK)</label>
                  <input type="number" step="0.01" value={defaults.guard_absence_deduction_per_day}
                    onChange={(e)=>setDefaults(d=>({...d, guard_absence_deduction_per_day: Number(e.target.value)}))}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Staff Absence Deduction/Day (MWK)</label>
                  <input type="number" step="0.01" value={defaults.staff_absence_deduction_per_day}
                    onChange={(e)=>setDefaults(d=>({...d, staff_absence_deduction_per_day: Number(e.target.value)}))}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Default OT Multiplier</label>
                  <input type="number" step="0.01" value={defaults.overtime_multiplier_default}
                    onChange={(e)=>setDefaults(d=>({...d, overtime_multiplier_default: Number(e.target.value)}))}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" />
                </div>
                {errors.payrollDefaults && (
                  <div className="md:col-span-3 text-sm text-red-600 dark:text-red-400">{errors.payrollDefaults}</div>
                )}
                <div className="md:col-span-3 pt-2">
                  <button
                    type="submit"
                    disabled={loading.payrollDefaults}
                    className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loading.payrollDefaults && (
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    )}
                    {loading.payrollDefaults ? 'Saving...' : 'Save Defaults'}
                  </button>
                </div>
              </form>
            </div>

            {/* Pay Profiles */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Pay Profiles</h2>
              <form onSubmit={submitNewProfile} className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
                  <select value={newProfile.payee_type} onChange={(e)=>setNewProfile(p=>({...p, payee_type: e.target.value as any}))}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100">
                    <option value="guard">Guard</option>
                    <option value="user">Staff</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Payee</label>
                  <input
                    list={newProfile.payee_type === 'guard' ? 'guards-list' : 'users-list'}
                    placeholder={newProfile.payee_type === 'guard' ? 'Search guard by name or ID' : 'Search staff by name or ID'}
                    onChange={(e)=>setNewProfile(p=>({...p, payee_id: Number(e.target.value || 0)}))}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                  />
                  <datalist id="guards-list">
                    {(finance?.payeeOptions?.guards ?? []).map((g: { id: number; label: string }) => (
                      <option key={g.id} value={g.id} label={g.label} />
                    ))}
                  </datalist>
                  <datalist id="users-list">
                    {(finance?.payeeOptions?.users ?? []).map((u: { id: number; label: string }) => (
                      <option key={u.id} value={u.id} label={u.label} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Monthly Salary</label>
                  <input type="number" step="0.01" value={newProfile.monthly_salary as number}
                    onChange={(e)=>setNewProfile(p=>({...p, monthly_salary: Number(e.target.value)}))}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">OT Multiplier</label>
                  <input type="number" step="0.01" value={Number(newProfile.overtime_multiplier ?? 1.5)}
                    onChange={(e)=>setNewProfile(p=>({...p, overtime_multiplier: Number(e.target.value)}))}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Advance</label>
                  <input type="number" step="0.01" value={Number(newProfile.advance_amount ?? 0)}
                    onChange={(e)=>setNewProfile(p=>({...p, advance_amount: Number(e.target.value)}))}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Absence Deduction/Day</label>
                  <input type="number" step="0.01" value={Number(newProfile.absence_deduction_per_day ?? 0)}
                    onChange={(e)=>setNewProfile(p=>({...p, absence_deduction_per_day: Number(e.target.value)}))}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" />
                </div>
                <div className="md:col-span-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Allowances (JSON)</label>
                  <textarea value={typeof newProfile.allowances === 'string' ? newProfile.allowances : JSON.stringify(newProfile.allowances ?? [])}
                    onChange={(e)=>setNewProfile(p=>({...p, allowances: e.target.value}))}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" rows={2} />
                </div>
                {errors.newProfile && (
                  <div className="md:col-span-6 text-sm text-red-600 dark:text-red-400">{errors.newProfile}</div>
                )}
                <div className="md:col-span-6 pt-2">
                  <button
                    type="submit"
                    disabled={loading.newProfile}
                    className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loading.newProfile && (
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    )}
                    {loading.newProfile ? 'Adding...' : 'Add Profile'}
                  </button>
                </div>
              </form>

              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600 dark:text-gray-300">
                      <th className="px-2 py-2">ID</th>
                      <th className="px-2 py-2">Type</th>
                      <th className="px-2 py-2">Payee</th>
                      <th className="px-2 py-2">Salary</th>
                      <th className="px-2 py-2">OT</th>
                      <th className="px-2 py-2">Advance</th>
                      <th className="px-2 py-2">Absence</th>
                      <th className="px-2 py-2">Allowances (JSON)</th>
                      <th className="px-2 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {profiles.map((p) => (
                      <tr key={p.id} className="text-gray-900 dark:text-gray-100">
                        <td className="px-2 py-2">{p.id}</td>
                        <td className="px-2 py-2 capitalize">{p.payee_type}</td>
                        <td className="px-2 py-2">#{p.payee_id}</td>
                        <td className="px-2 py-2"><input type="number" step="0.01" value={Number(p.monthly_salary)} onChange={(e)=>setProfiles(prev=>prev.map(x=>x.id===p.id?{...x, monthly_salary: Number(e.target.value)}:x))} className="w-32 rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900" /></td>
                        <td className="px-2 py-2"><input type="number" step="0.01" value={Number(p.overtime_multiplier ?? 1.5)} onChange={(e)=>setProfiles(prev=>prev.map(x=>x.id===p.id?{...x, overtime_multiplier: Number(e.target.value)}:x))} className="w-24 rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900" /></td>
                        <td className="px-2 py-2"><input type="number" step="0.01" value={Number(p.advance_amount ?? 0)} onChange={(e)=>setProfiles(prev=>prev.map(x=>x.id===p.id?{...x, advance_amount: Number(e.target.value)}:x))} className="w-28 rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900" /></td>
                        <td className="px-2 py-2"><input type="number" step="0.01" value={Number(p.absence_deduction_per_day ?? 0)} onChange={(e)=>setProfiles(prev=>prev.map(x=>x.id===p.id?{...x, absence_deduction_per_day: Number(e.target.value)}:x))} className="w-28 rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900" /></td>
                        <td className="px-2 py-2"><textarea value={typeof p.allowances === 'string' ? p.allowances : JSON.stringify(p.allowances ?? [])} onChange={(e)=>setProfiles(prev=>prev.map(x=>x.id===p.id?{...x, allowances: e.target.value}:x))} className="w-80 h-16 rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900" /></td>
                        <td className="px-2 py-2 space-x-2">
                          <button
                            onClick={()=>updateProfile(p)}
                            disabled={loading[`profile_${p.id}`]}
                            className="px-3 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1"
                          >
                            {loading[`profile_${p.id}`] && (
                              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                            )}
                            {loading[`profile_${p.id}`] ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={()=>deleteProfile(p.id)}
                            disabled={loading[`delete_profile_${p.id}`]}
                            className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {loading[`delete_profile_${p.id}`] ? '...' : 'Delete'}
                          </button>
                          {errors[`profile_${p.id}`] && (
                            <span className="text-xs text-red-600 dark:text-red-400">{errors[`profile_${p.id}`]}</span>
                          )}
                          {errors[`delete_profile_${p.id}`] && (
                            <span className="text-xs text-red-600 dark:text-red-400">{errors[`delete_profile_${p.id}`]}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* Notifications */}
        {tab === 'notifications' && (
          <section className="space-y-6">
            <PushNotificationSettings />
          </section>
        )}

        {/* System */}
        {tab === 'system' && (
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4">System Status</h2>
            <dl className="space-y-3">
              <div className="flex items-center justify-between">
                <dt className="text-sm text-gray-600 dark:text-gray-300">Database</dt>
                <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{system.database_status}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-sm text-gray-600 dark:text-gray-300">DB Size</dt>
                <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{system.database_size}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-sm text-gray-600 dark:text-gray-300">Cache Size</dt>
                <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{system.cache_size}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-sm text-gray-600 dark:text-gray-300">Storage Free</dt>
                <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{system.storage_free}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-sm text-gray-600 dark:text-gray-300">Memory Usage</dt>
                <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{system.memory_usage}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-sm text-gray-600 dark:text-gray-300">Uptime (1m load)</dt>
                <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{system.uptime}</dd>
              </div>
            </dl>
          </section>
        )}
      </div>
    </SuperAdminLayout>
  );
}
