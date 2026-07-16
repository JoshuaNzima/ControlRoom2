import React from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import Modal from '@/Components/Modal';
import { useTheme } from '@/Providers/ThemeProvider';
import IconMapper from '@/Components/IconMapper';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { formatCurrencyMWK } from '@/Components/format';

// Settings card style
const SectionCard: React.FC<{ title: string; children: React.ReactNode; action?: React.ReactNode }> = ({ title, children, action }) => (
  <Card className="p-6">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
      {action}
    </div>
    {children}
  </Card>
);

// Form field styles
const inputClassName =
  'mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950';

type GuardGrade = {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  base_salary?: number | string;
  overtime_multiplier?: number | string | null;
  allowances?: any;
  absence_deduction_per_day?: number | string | null;
};

type PayrollDefaults = {
  guard_absence_deduction_per_day: number;
  staff_absence_deduction_per_day: number;
  overtime_multiplier_default: number;
};

type PageProps = {
  auth: {
    user: {
      id: number;
      name: string;
      email: string;
      roles: (string | { id: number; name: string })[];
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
  payrollDefaults: PayrollDefaults;
  guardGrades: GuardGrade[];
};

export default function SettingsIndex() {
  const { auth, system, payrollDefaults, guardGrades } = usePage<any>().props;
  const { theme, toggle } = useTheme();
  const [activeTab, setActiveTab] = React.useState<'general' | 'hr' | 'payroll'>('general');

  // Payroll Defaults state
  const [defaults, setDefaults] = React.useState<PayrollDefaults>(() => ({
    guard_absence_deduction_per_day: Number(payrollDefaults?.guard_absence_deduction_per_day ?? 0),
    staff_absence_deduction_per_day: Number(payrollDefaults?.staff_absence_deduction_per_day ?? 0),
    overtime_multiplier_default: Number(payrollDefaults?.overtime_multiplier_default ?? 1.5),
  }));

  // Guard Grades state
  const [showGradeModal, setShowGradeModal] = React.useState(false);
  const [editingGrade, setEditingGrade] = React.useState<GuardGrade | null>(null);
  const [gradeForm, setGradeForm] = React.useState<Partial<GuardGrade>>({
    code: '', name: '', description: '', base_salary: 0, overtime_multiplier: 1.5, allowances: [], absence_deduction_per_day: 0,
  });

  const submitDefaults = (e: React.FormEvent) => {
    e.preventDefault();
    router.post(route('admin.settings.finance.payroll-defaults'), defaults, { preserveScroll: true });
  };

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

  const tabs = [
    { id: 'general', label: 'General', icon: 'Settings' },
    { id: 'hr', label: 'HR & Grades', icon: 'Users' },
    { id: 'payroll', label: 'Payroll Defaults', icon: 'Wallet' },
  ];

  return (
    <AuthenticatedLayout header="Settings" user={auth?.user as any}>
      <Head title="Settings" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">System Settings</h1>
            <p className="text-gray-600 dark:text-gray-400">Configure system preferences and defaults</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-gray-700 text-red-600 dark:text-red-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <IconMapper name={tab.icon as any} size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* General Tab */}
        {activeTab === 'general' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-300">
            {/* User Profile */}
            <SectionCard title="User Profile">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                    <input className={`${inputClassName} opacity-80 cursor-not-allowed`} defaultValue={auth.user.name} disabled />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                    <input className={`${inputClassName} opacity-80 cursor-not-allowed`} defaultValue={auth.user.email} disabled />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role(s)</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {auth.user.roles?.map((r: string) => (
                      <span key={r} className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-gray-800 dark:text-red-200 border border-red-200 dark:border-gray-700">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Appearance */}
            <SectionCard title="Appearance">
              <div className="space-y-4">
                <label className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <IconMapper name={theme === 'dark' ? 'Moon' : 'Sun'} size={20} className="text-gray-600 dark:text-gray-400" />
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Dark Mode</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Toggle between light and dark themes</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 dark:border-gray-700 text-red-600 focus:ring-red-500"
                    checked={theme === 'dark'}
                    onChange={() => toggle()}
                  />
                </label>
                
                <label className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <IconMapper name="Bell" size={20} className="text-gray-600 dark:text-gray-400" />
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Desktop Notifications</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Receive notifications on your desktop</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 dark:border-gray-700 text-red-600 focus:ring-red-500"
                    defaultChecked
                  />
                </label>
              </div>
            </SectionCard>

            {/* System Status */}
            <SectionCard title="System Status" action={<span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>Operational</span>}>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Database</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{system.database_status}</div>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                  <div className="text-xs text-gray-500 dark:text-gray-400">DB Size</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{system.database_size}</div>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Cache</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{system.cache_size}</div>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Storage Free</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{system.storage_free}</div>
                </div>
              </div>
            </SectionCard>
          </div>
        )}

        {/* HR & Grades Tab */}
        {activeTab === 'hr' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <SectionCard 
              title="Guard Grades" 
              action={<Button onClick={openNewGrade}><IconMapper name="Plus" size={16} className="mr-2" />Add Grade</Button>}
            >
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-950/40">
                    <tr className="text-left text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-800">
                      <th className="px-4 py-3 font-medium">Code</th>
                      <th className="px-4 py-3 font-medium">Name</th>
                      <th className="px-4 py-3 font-medium">Base Salary</th>
                      <th className="px-4 py-3 font-medium">OT Multiplier</th>
                      <th className="px-4 py-3 font-medium">Absence/Day</th>
                      <th className="px-4 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {(guardGrades ?? []).length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                          No guard grades defined yet
                        </td>
                      </tr>
                    )}
                    {(guardGrades ?? []).map((g: any) => (
                      <tr key={g.id} className="text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-3 font-medium">{g.code}</td>
                        <td className="px-4 py-3">{g.name}</td>
                        <td className="px-4 py-3">{formatCurrencyMWK(Number(g.base_salary ?? 0))}</td>
                        <td className="px-4 py-3">{Number(g.overtime_multiplier ?? 1.5).toFixed(2)}x</td>
                        <td className="px-4 py-3">{formatCurrencyMWK(Number(g.absence_deduction_per_day ?? 0))}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button onClick={() => openEditGrade(g)} className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition">
                              <IconMapper name="Pencil" size={16} />
                            </button>
                            <button onClick={() => deleteGrade(g)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition">
                              <IconMapper name="Trash2" size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>

            {/* Grade Modal */}
            <Modal show={showGradeModal} onClose={() => setShowGradeModal(false)} maxWidth="lg">
              <form onSubmit={submitGrade} className="p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{editingGrade ? 'Edit Grade' : 'Add Grade'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Code</label>
                    <input className={inputClassName} value={gradeForm.code as any} onChange={(e) => setGradeForm(f => ({ ...f, code: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                    <input className={inputClassName} value={gradeForm.name as any} onChange={(e) => setGradeForm(f => ({ ...f, name: e.target.value }))} required />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                    <textarea className={inputClassName} rows={2} value={(gradeForm.description as any) ?? ''} onChange={(e) => setGradeForm(f => ({ ...f, description: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Base Salary (MWK)</label>
                    <input type="number" step="0.01" className={inputClassName} value={Number(gradeForm.base_salary ?? 0)} onChange={(e) => setGradeForm(f => ({ ...f, base_salary: Number(e.target.value) }))} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">OT Multiplier</label>
                    <input type="number" step="0.01" className={inputClassName} value={Number(gradeForm.overtime_multiplier ?? 1.5)} onChange={(e) => setGradeForm(f => ({ ...f, overtime_multiplier: Number(e.target.value) }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Absence Deduction/Day (MWK)</label>
                    <input type="number" step="0.01" className={inputClassName} value={Number(gradeForm.absence_deduction_per_day ?? 0)} onChange={(e) => setGradeForm(f => ({ ...f, absence_deduction_per_day: Number(e.target.value) }))} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Allowances (JSON)</label>
                    <textarea className={inputClassName} rows={2} value={typeof gradeForm.allowances === 'string' ? (gradeForm.allowances as any) : JSON.stringify(gradeForm.allowances ?? [])} onChange={(e) => setGradeForm(f => ({ ...f, allowances: e.target.value }))} />
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setShowGradeModal(false)}>Cancel</Button>
                  <Button type="submit">{editingGrade ? 'Save Changes' : 'Create Grade'}</Button>
                </div>
              </form>
            </Modal>
          </div>
        )}

        {/* Payroll Defaults Tab */}
        {activeTab === 'payroll' && (
          <div className="animate-in fade-in duration-300">
            <SectionCard 
              title="Payroll Defaults" 
              action={<Button onClick={submitDefaults}><IconMapper name="Save" size={16} className="mr-2" />Save Defaults</Button>}
            >
              <form onSubmit={submitDefaults} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Guard Absence Deduction/Day</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-500 text-sm">MWK</span>
                    <input 
                      type="number" 
                      step="0.01" 
                      value={defaults.guard_absence_deduction_per_day}
                      onChange={(e) => setDefaults(d => ({ ...d, guard_absence_deduction_per_day: Number(e.target.value) }))}
                      className={`${inputClassName} pl-14`} 
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Amount deducted per day of absence for guards</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Staff Absence Deduction/Day</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-500 text-sm">MWK</span>
                    <input 
                      type="number" 
                      step="0.01" 
                      value={defaults.staff_absence_deduction_per_day}
                      onChange={(e) => setDefaults(d => ({ ...d, staff_absence_deduction_per_day: Number(e.target.value) }))}
                      className={`${inputClassName} pl-14`} 
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Amount deducted per day of absence for staff</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Default OT Multiplier</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={defaults.overtime_multiplier_default}
                    onChange={(e) => setDefaults(d => ({ ...d, overtime_multiplier_default: Number(e.target.value) }))}
                    className={inputClassName} 
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Default multiplier for overtime calculations (e.g., 1.5x)</p>
                </div>
              </form>
            </SectionCard>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
