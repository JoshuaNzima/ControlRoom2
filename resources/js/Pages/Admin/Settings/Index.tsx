import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, usePage, router } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import { useTheme } from '@/Providers/ThemeProvider';

const settingsCardClassName =
  'bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm shadow-black/5 dark:shadow-none p-4 sm:p-6';

const settingsFieldClassName =
  'mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-coin-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950';

const settingsInlineFieldClassName =
  'rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-coin-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950';

const settingsPrimaryButtonClassName =
  'px-4 py-2 rounded-lg bg-coin-700 text-white hover:bg-coin-600 focus:outline-none focus:ring-2 focus:ring-coin-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950 disabled:opacity-60 disabled:pointer-events-none';

const settingsSecondaryButtonClassName =
  'px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-coin-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950 disabled:opacity-60 disabled:pointer-events-none';

const settingsDangerButtonClassName =
  'px-3 py-2 rounded-lg bg-red-700 text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950 disabled:opacity-60 disabled:pointer-events-none';

const settingsSuccessButtonClassName =
  'px-3 py-2 rounded-lg bg-emerald-700 text-white hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950 disabled:opacity-60 disabled:pointer-events-none';

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
};

export default function SettingIndex() {
  const { auth, system, finance, hr } = usePage<PageProps>().props as any;
  const { theme, toggle } = useTheme();
  const [tab, setTab] = React.useState<'user' | 'finance' | 'hr' | 'system'>('finance');

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
    router.post(route('admin.settings.finance.payroll-defaults'), defaults, { preserveScroll: true });
  };

  const submitNewProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      ...newProfile,
      allowances: typeof newProfile.allowances === 'string' ? newProfile.allowances : JSON.stringify(newProfile.allowances ?? []),
    };
    router.post(route('admin.settings.finance.pay-profiles.store'), payload, {
      preserveScroll: true,
      onSuccess: () => {
        setNewProfile({ id: 0, payee_type: 'guard', payee_id: 0, monthly_salary: 0, overtime_multiplier: 1.5, advance_amount: 0, allowances: [], absence_deduction_per_day: 0 });
      },
    });
  };

  const updateProfile = (p: PayProfile) => {
    const payload: any = {
      monthly_salary: p.monthly_salary,
      overtime_multiplier: p.overtime_multiplier,
      advance_amount: p.advance_amount,
      allowances: typeof p.allowances === 'string' ? p.allowances : JSON.stringify(p.allowances ?? []),
      absence_deduction_per_day: p.absence_deduction_per_day,
    };
    router.put(route('admin.settings.finance.pay-profiles.update', p.id), payload, { preserveScroll: true });
  };

  const deleteProfile = (id: number) => {
    if (!confirm('Remove this pay profile?')) return;
    router.delete(route('admin.settings.finance.pay-profiles.destroy', id), { preserveScroll: true });
  };

  // HR: Guard Grades state & handlers
  type GuardGrade = Required<PageProps>['hr']['guardGrades'][number];
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
    const payload: any = {
      ...gradeForm,
      allowances: typeof gradeForm.allowances === 'string' ? gradeForm.allowances : JSON.stringify(gradeForm.allowances ?? []),
    };
    if (editingGrade) {
      router.put(route('admin.settings.hr.guard-grades.update', editingGrade.id), payload, {
        preserveScroll: true,
        onSuccess: () => setShowGradeModal(false),
      });
    } else {
      router.post(route('admin.settings.hr.guard-grades.store'), payload, {
        preserveScroll: true,
        onSuccess: () => setShowGradeModal(false),
      });
    }
  };
  const deleteGrade = (g: GuardGrade) => {
    if (!confirm(`Delete grade ${g.code}?`)) return;
    router.delete(route('admin.settings.hr.guard-grades.destroy', g.id), { preserveScroll: true });
  };

  return (
    <AdminLayout title="Settings" user={auth?.user as any}>
      <Head title="Settings" />
      <div className="space-y-4">
        {/* Tabs */}
        <div className="mb-4 rounded-xl bg-coin-100/80 p-1 dark:bg-gray-800">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
            <button
              type="button"
              onClick={() => setTab('user')}
              className={`px-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-coin-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950 ${tab==='user' ? 'bg-coin-700 text-white' : 'text-coin-800 hover:bg-coin-200 dark:text-gray-200 dark:hover:bg-gray-700'}`}
            >
              User
            </button>
            <button
              type="button"
              onClick={() => setTab('finance')}
              className={`px-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-coin-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950 ${tab==='finance' ? 'bg-coin-700 text-white' : 'text-coin-800 hover:bg-coin-200 dark:text-gray-200 dark:hover:bg-gray-700'}`}
            >
              Finance
            </button>
            <button
              type="button"
              onClick={() => setTab('hr')}
              className={`px-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-coin-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950 ${tab==='hr' ? 'bg-coin-700 text-white' : 'text-coin-800 hover:bg-coin-200 dark:text-gray-200 dark:hover:bg-gray-700'}`}
            >
              HR
            </button>
            <button
              type="button"
              onClick={() => setTab('system')}
              className={`px-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-coin-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950 ${tab==='system' ? 'bg-coin-700 text-white' : 'text-coin-800 hover:bg-coin-200 dark:text-gray-200 dark:hover:bg-gray-700'}`}
            >
              System
            </button>
          </div>
        </div>

        {/* Content */}
        {tab === 'user' && (
          <section className={settingsCardClassName}>
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">User Preferences</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                  <input className={`${settingsFieldClassName} opacity-80 cursor-not-allowed`} defaultValue={auth.user.name} disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                  <input className={`${settingsFieldClassName} opacity-80 cursor-not-allowed`} defaultValue={auth.user.email} disabled />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role(s)</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {auth.user.roles?.map((r: string) => (
                    <span key={r} className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-coin-100 text-coin-800 dark:bg-gray-800 dark:text-coin-200 border border-coin-200 dark:border-gray-700">{r}</span>
                  ))}
                </div>
              </div>
              <div className="pt-4 border-t dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">Preferences</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="inline-flex items-center">
                    <input type="checkbox" className="rounded border-gray-300 dark:border-gray-700 text-coin-600 focus:ring-coin-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950" defaultChecked />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Enable desktop notifications</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 dark:border-gray-700 text-coin-600 focus:ring-coin-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950"
                      checked={theme === 'dark'}
                      onChange={() => toggle()}
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Dark mode</span>
                  </label>
                </div>
              </div>
            </div>
          </section>
        )}

        {tab === 'hr' && (
          <section className="space-y-6">
            {/* Guard Grades */}
            <div className={settingsCardClassName}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Guard Grades</h2>
                <button type="button" onClick={openNewGrade} className={`w-full sm:w-auto ${settingsPrimaryButtonClassName}`}>Add Grade</button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-[720px] w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-950/40">
                    <tr className="text-left text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-800">
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
                        <td className="px-2 py-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <button type="button" onClick={() => openEditGrade(g)} className={settingsSuccessButtonClassName}>Edit</button>
                            <button type="button" onClick={() => deleteGrade(g)} className={settingsDangerButtonClassName}>Delete</button>
                          </div>
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
                    <input className={settingsFieldClassName} value={gradeForm.code as any}
                      onChange={(e)=>setGradeForm(f=>({ ...f, code: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                    <input className={settingsFieldClassName} value={gradeForm.name as any}
                      onChange={(e)=>setGradeForm(f=>({ ...f, name: e.target.value }))} required />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                    <textarea className={settingsFieldClassName} rows={2} value={(gradeForm.description as any) ?? ''}
                      onChange={(e)=>setGradeForm(f=>({ ...f, description: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Base Salary</label>
                    <input type="number" step="0.01" className={settingsFieldClassName}
                      value={Number(gradeForm.base_salary ?? 0)} onChange={(e)=>setGradeForm(f=>({ ...f, base_salary: Number(e.target.value) }))} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">OT Multiplier</label>
                    <input type="number" step="0.01" className={settingsFieldClassName}
                      value={Number(gradeForm.overtime_multiplier ?? 1.5)} onChange={(e)=>setGradeForm(f=>({ ...f, overtime_multiplier: Number(e.target.value) }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Absence Deduction/Day</label>
                    <input type="number" step="0.01" className={settingsFieldClassName}
                      value={Number(gradeForm.absence_deduction_per_day ?? 0)} onChange={(e)=>setGradeForm(f=>({ ...f, absence_deduction_per_day: Number(e.target.value) }))} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Allowances (JSON)</label>
                    <textarea className={settingsFieldClassName} rows={2}
                      value={typeof gradeForm.allowances === 'string' ? (gradeForm.allowances as any) : JSON.stringify(gradeForm.allowances ?? [])}
                      onChange={(e)=>setGradeForm(f=>({ ...f, allowances: e.target.value }))} />
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-end gap-3">
                  <button type="button" onClick={() => setShowGradeModal(false)} className={settingsSecondaryButtonClassName}>Cancel</button>
                  <button type="submit" className={settingsPrimaryButtonClassName}>{editingGrade ? 'Save' : 'Create'}</button>
                </div>
              </form>
            </Modal>
          </section>
        )}

        {tab === 'finance' && (
          <section className="space-y-6">
            {/* Payroll Defaults */}
            <div className={settingsCardClassName}>
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Payroll Defaults</h2>
              <form onSubmit={submitDefaults} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Guard Absence Deduction/Day (MWK)</label>
                  <input type="number" step="0.01" value={defaults.guard_absence_deduction_per_day}
                    onChange={(e)=>setDefaults(d=>({...d, guard_absence_deduction_per_day: Number(e.target.value)}))}
                    className={settingsFieldClassName} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Staff Absence Deduction/Day (MWK)</label>
                  <input type="number" step="0.01" value={defaults.staff_absence_deduction_per_day}
                    onChange={(e)=>setDefaults(d=>({...d, staff_absence_deduction_per_day: Number(e.target.value)}))}
                    className={settingsFieldClassName} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Default OT Multiplier</label>
                  <input type="number" step="0.01" value={defaults.overtime_multiplier_default}
                    onChange={(e)=>setDefaults(d=>({...d, overtime_multiplier_default: Number(e.target.value)}))}
                    className={settingsFieldClassName} />
                </div>
                <div className="sm:col-span-2 lg:col-span-3 pt-2">
                  <button type="submit" className={`w-full sm:w-auto ${settingsPrimaryButtonClassName}`}>Save Defaults</button>
                </div>
              </form>
            </div>

            {/* Pay Profiles */}
            <div className={settingsCardClassName}>
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Pay Profiles</h2>
              <form onSubmit={submitNewProfile} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 mb-4">
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
                  <select value={newProfile.payee_type} onChange={(e)=>setNewProfile(p=>({...p, payee_type: e.target.value as any}))}
                    className={settingsFieldClassName}>
                    <option value="guard">Guard</option>
                    <option value="user">Staff</option>
                  </select>
                </div>
                <div className="sm:col-span-2 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Payee</label>
                  <input
                    list={newProfile.payee_type === 'guard' ? 'guards-list' : 'users-list'}
                    placeholder={newProfile.payee_type === 'guard' ? 'Search guard by name or ID' : 'Search staff by name or ID'}
                    onChange={(e)=>setNewProfile(p=>({...p, payee_id: Number(e.target.value || 0)}))}
                    className={settingsFieldClassName}
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
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Monthly Salary</label>
                  <input type="number" step="0.01" value={newProfile.monthly_salary as number}
                    onChange={(e)=>setNewProfile(p=>({...p, monthly_salary: Number(e.target.value)}))}
                    className={settingsFieldClassName} />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">OT Multiplier</label>
                  <input type="number" step="0.01" value={Number(newProfile.overtime_multiplier ?? 1.5)}
                    onChange={(e)=>setNewProfile(p=>({...p, overtime_multiplier: Number(e.target.value)}))}
                    className={settingsFieldClassName} />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Advance</label>
                  <input type="number" step="0.01" value={Number(newProfile.advance_amount ?? 0)}
                    onChange={(e)=>setNewProfile(p=>({...p, advance_amount: Number(e.target.value)}))}
                    className={settingsFieldClassName} />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Absence Deduction/Day</label>
                  <input type="number" step="0.01" value={Number(newProfile.absence_deduction_per_day ?? 0)}
                    onChange={(e)=>setNewProfile(p=>({...p, absence_deduction_per_day: Number(e.target.value)}))}
                    className={settingsFieldClassName} />
                </div>
                <div className="sm:col-span-2 md:col-span-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Allowances (JSON)</label>
                  <textarea value={typeof newProfile.allowances === 'string' ? newProfile.allowances : JSON.stringify(newProfile.allowances ?? [])}
                    onChange={(e)=>setNewProfile(p=>({...p, allowances: e.target.value}))}
                    className={settingsFieldClassName} rows={2} />
                </div>
                <div className="sm:col-span-2 md:col-span-6 pt-2">
                  <button type="submit" className={`w-full sm:w-auto ${settingsPrimaryButtonClassName}`}>Add Profile</button>
                </div>
              </form>

              <div className="overflow-x-auto">
                <table className="min-w-[980px] w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-950/40">
                    <tr className="text-left text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-800">
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
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            step="0.01"
                            value={Number(p.monthly_salary)}
                            onChange={(e)=>setProfiles(prev=>prev.map(x=>x.id===p.id?{...x, monthly_salary: Number(e.target.value)}:x))}
                            className={`w-32 ${settingsInlineFieldClassName}`}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            step="0.01"
                            value={Number(p.overtime_multiplier ?? 1.5)}
                            onChange={(e)=>setProfiles(prev=>prev.map(x=>x.id===p.id?{...x, overtime_multiplier: Number(e.target.value)}:x))}
                            className={`w-24 ${settingsInlineFieldClassName}`}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            step="0.01"
                            value={Number(p.advance_amount ?? 0)}
                            onChange={(e)=>setProfiles(prev=>prev.map(x=>x.id===p.id?{...x, advance_amount: Number(e.target.value)}:x))}
                            className={`w-28 ${settingsInlineFieldClassName}`}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            step="0.01"
                            value={Number(p.absence_deduction_per_day ?? 0)}
                            onChange={(e)=>setProfiles(prev=>prev.map(x=>x.id===p.id?{...x, absence_deduction_per_day: Number(e.target.value)}:x))}
                            className={`w-28 ${settingsInlineFieldClassName}`}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <textarea
                            value={typeof p.allowances === 'string' ? p.allowances : JSON.stringify(p.allowances ?? [])}
                            onChange={(e)=>setProfiles(prev=>prev.map(x=>x.id===p.id?{...x, allowances: e.target.value}:x))}
                            className={`w-80 h-16 ${settingsInlineFieldClassName}`}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <button type="button" onClick={()=>updateProfile(p)} className={settingsSuccessButtonClassName}>Save</button>
                            <button type="button" onClick={()=>deleteProfile(p.id)} className={settingsDangerButtonClassName}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {tab === 'system' && (
          <section className={settingsCardClassName}>
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">System Status</h2>
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
    </AdminLayout>
  );
}
