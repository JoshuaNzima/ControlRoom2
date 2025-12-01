import React from 'react';
import SuperAdminLayout from '@/Layouts/SuperAdminLayout';
import { Head, usePage, router } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import { useTheme } from '@/Providers/ThemeProvider';

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
  mail?: {
    host?: string;
    port?: number;
    encryption?: 'tls' | 'ssl' | 'none' | null;
    username?: string;
    from_email?: string;
    from_name?: string;
  };
};

export default function SuperAdminSettings() {
  const { auth, system, finance, hr, mail } = usePage<PageProps>().props as any;
  const { theme, toggle } = useTheme();
  const [tab, setTab] = React.useState<'user' | 'finance' | 'hr' | 'system'>('finance');

  // Payroll Defaults state
  const [defaults, setDefaults] = React.useState<FinanceDefaults>(() => ({
    guard_absence_deduction_per_day: Number(finance?.payrollDefaults?.guard_absence_deduction_per_day ?? 0),
    staff_absence_deduction_per_day: Number(finance?.payrollDefaults?.staff_absence_deduction_per_day ?? 0),
    overtime_multiplier_default: Number(finance?.payrollDefaults?.overtime_multiplier_default ?? 1.5),
  }));

  const submitDefaults = (e: React.FormEvent) => {
    e.preventDefault();
    router.post(route('admin.settings.finance.payroll-defaults'), defaults, { preserveScroll: true });
  };

  // SMTP Settings state & handlers (SuperAdmin only UI)
  const [smtp, setSmtp] = React.useState(() => ({
    host: mail?.host ?? '',
    port: Number(mail?.port ?? 587),
    encryption: (mail?.encryption ?? 'tls') as 'tls' | 'ssl' | 'none',
    username: mail?.username ?? '',
    password: '',
    from_email: mail?.from_email ?? '',
    from_name: mail?.from_name ?? '',
  }));
  const [testTo, setTestTo] = React.useState('');

  const submitMail = (e: React.FormEvent) => {
    e.preventDefault();
    router.post(route('superadmin.settings.mail.update'), smtp as any, { preserveScroll: true });
  };
  const sendTestMail = () => {
    if (!testTo) return;
    router.post(route('superadmin.settings.mail.test'), { to: testTo }, { preserveScroll: true });
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
    <SuperAdminLayout title="System Settings" user={auth?.user as any}>
      <Head title="System Settings" />
      <div>
        {/* Tabs */}
        <div className="mb-4 inline-flex rounded-full bg-red-100 p-1 dark:bg-gray-800">
          <button onClick={() => setTab('finance')} className={`px-4 py-1.5 rounded-full text-sm font-medium ${tab==='finance' ? 'bg-red-600 text-white' : 'text-red-700 hover:bg-red-200 dark:text-gray-200 dark:hover:bg-gray-700'}`}>Finance</button>
          <button onClick={() => setTab('hr')} className={`px-4 py-1.5 rounded-full text-sm font-medium ${tab==='hr' ? 'bg-red-600 text-white' : 'text-red-700 hover:bg-red-200 dark:text-gray-200 dark:hover:bg-gray-700'}`}>HR</button>
          <button onClick={() => setTab('system')} className={`px-4 py-1.5 rounded-full text-sm font-medium ${tab==='system' ? 'bg-red-600 text-white' : 'text-red-700 hover:bg-red-200 dark:text-gray-200 dark:hover:bg-gray-700'}`}>System</button>
        </div>

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
                          <button onClick={() => deleteGrade(g)} className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700">Delete</button>
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
                <div className="mt-4 flex items-center justify-end gap-3">
                  <button type="button" onClick={() => setShowGradeModal(false)} className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200">Cancel</button>
                  <button type="submit" className="px-4 py-2 rounded-md text-white bg-red-600 hover:bg-red-700">{editingGrade ? 'Save' : 'Create'}</button>
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
                <div className="md:col-span-3 pt-2">
                  <button type="submit" className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700">Save Defaults</button>
                </div>
              </form>
            </div>
          </section>
        )}

        {/* System */}
        {tab === 'system' && (
          <section className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
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
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold mb-4">SMTP Settings</h2>
              <form onSubmit={submitMail} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Host</label>
                  <input value={smtp.host} onChange={(e)=>setSmtp(s=>({...s, host: e.target.value}))}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" placeholder="smtp.example.com" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Port</label>
                  <input type="number" value={smtp.port} onChange={(e)=>setSmtp(s=>({...s, port: Number(e.target.value)}))}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Encryption</label>
                  <select value={smtp.encryption} onChange={(e)=>setSmtp(s=>({...s, encryption: e.target.value as any}))}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100">
                    <option value="tls">TLS</option>
                    <option value="ssl">SSL</option>
                    <option value="none">None</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
                  <input value={smtp.username} onChange={(e)=>setSmtp(s=>({...s, username: e.target.value}))}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                  <input type="password" value={smtp.password} onChange={(e)=>setSmtp(s=>({...s, password: e.target.value}))}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" placeholder="••••••" />
                </div>
                <div className="md:col-span-1"></div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">From Email</label>
                  <input type="email" value={smtp.from_email} onChange={(e)=>setSmtp(s=>({...s, from_email: e.target.value}))}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">From Name</label>
                  <input value={smtp.from_name} onChange={(e)=>setSmtp(s=>({...s, from_name: e.target.value}))}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" />
                </div>
                <div className="md:col-span-3 pt-2 flex items-center gap-3 flex-wrap">
                  <button type="submit" className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700">Save SMTP</button>
                  <div className="flex items-center gap-2">
                    <input type="email" placeholder="test@example.com" value={testTo} onChange={(e)=>setTestTo(e.target.value)}
                      className="rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 px-3 py-2" />
                    <button type="button" onClick={sendTestMail} className="px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700">Send Test</button>
                  </div>
                </div>
              </form>
            </div>
          </section>
        )}
      </div>
    </SuperAdminLayout>
  );
}
