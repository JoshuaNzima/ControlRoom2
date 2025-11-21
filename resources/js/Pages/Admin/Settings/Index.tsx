import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, usePage, router } from '@inertiajs/react';
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
};

export default function SettingIndex() {
  const { auth, system, finance } = usePage<PageProps>().props as any;
  const { theme, toggle } = useTheme();
  const [tab, setTab] = React.useState<'user' | 'finance' | 'system'>('finance');

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

  return (
    <AdminLayout title="Settings" user={auth?.user as any}>
      <Head title="Settings" />
      <div>
        {/* Tabs */}
        <div className="mb-4 inline-flex rounded-full bg-red-100 p-1 dark:bg-gray-800">
          <button onClick={() => setTab('user')} className={`px-4 py-1.5 rounded-full text-sm font-medium ${tab==='user' ? 'bg-red-600 text-white' : 'text-red-700 hover:bg-red-200 dark:text-gray-200 dark:hover:bg-gray-700'}`}>User</button>
          <button onClick={() => setTab('finance')} className={`px-4 py-1.5 rounded-full text-sm font-medium ${tab==='finance' ? 'bg-red-600 text-white' : 'text-red-700 hover:bg-red-200 dark:text-gray-200 dark:hover:bg-gray-700'}`}>Finance</button>
          <button onClick={() => setTab('system')} className={`px-4 py-1.5 rounded-full text-sm font-medium ${tab==='system' ? 'bg-red-600 text-white' : 'text-red-700 hover:bg-red-200 dark:text-gray-200 dark:hover:bg-gray-700'}`}>System</button>
        </div>

        {/* Content */}
        {tab === 'user' && (
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4">User Preferences</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                  <input className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" defaultValue={auth.user.name} disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                  <input className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" defaultValue={auth.user.email} disabled />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role(s)</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {auth.user.roles?.map((r: string) => (
                    <span key={r} className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-gray-700 dark:text-gray-100">{r}</span>
                  ))}
                </div>
              </div>
              <div className="pt-4 border-t dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">Preferences</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="inline-flex items-center">
                    <input type="checkbox" className="rounded border-gray-300 text-red-600" defaultChecked />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Enable desktop notifications</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-red-600"
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
                <div className="md:col-span-6 pt-2">
                  <button type="submit" className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700">Add Profile</button>
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
                          <button onClick={()=>updateProfile(p)} className="px-3 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700">Save</button>
                          <button onClick={()=>deleteProfile(p.id)} className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700">Delete</button>
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
    </AdminLayout>
  );
}
