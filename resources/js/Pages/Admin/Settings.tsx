import React from 'react';
import { Head, useForm, usePage, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Card, CardContent, CardHeader } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';

type System = {
  database_status?: string;
  database_size?: string | number;
  cache_size?: string | number;
  storage_free?: string | number;
  memory_usage?: string | number;
  uptime?: string | number;
};

export default function SettingsPage({ auth = {} as any, system = {} as System, finance = {} as any, hr = {} as any }) {
  const { flash }: any = usePage().props;
  const payroll = finance?.payrollDefaults || { guard_absence_deduction_per_day: 0, staff_absence_deduction_per_day: 0, overtime_multiplier_default: 1.5 };
  const { data, setData, post, processing, errors } = useForm({
    guard_absence_deduction_per_day: Number(payroll.guard_absence_deduction_per_day ?? 0),
    staff_absence_deduction_per_day: Number(payroll.staff_absence_deduction_per_day ?? 0),
    overtime_multiplier_default: Number(payroll.overtime_multiplier_default ?? 1.5),
  });

  const submitPayroll = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('admin.settings.finance.payroll-defaults'));
  };

  return (
    <AdminLayout title="Settings" user={auth?.user}>
      <Head title="Settings" />
      {flash?.success && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 text-green-800 px-4 py-3 dark:border-green-900 dark:bg-green-900/30 dark:text-green-300">{flash.success}</div>
      )}

      <div className="space-y-6">
        {/* System Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">System Health</h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 text-sm text-gray-700 dark:text-gray-300">
                <div>DB: <Badge variant="secondary" className="ml-1 text-xs">{system?.database_status ?? 'OK'}</Badge></div>
                <div>DB Size: <span className="ml-1">{String(system?.database_size ?? '--')}</span></div>
                <div>Cache: <span className="ml-1">{String(system?.cache_size ?? '--')}</span></div>
                <div>Storage Free: <span className="ml-1">{String(system?.storage_free ?? '--')}</span></div>
                <div>Memory: <span className="ml-1">{String(system?.memory_usage ?? '--')}</span></div>
                <div>Uptime: <span className="ml-1">{String(system?.uptime ?? '--')}</span></div>
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Marketing & Assets</h3>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href={route('admin.marketing.settings')} className="px-3 py-2 rounded-md border text-sm dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-700">Marketing Settings</Link>
                <Link href={route('admin.assets.settings')} className="px-3 py-2 rounded-md border text-sm dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-700">Asset Settings</Link>
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">HR: Guard Grades</h3>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-700 dark:text-gray-300">
                <div className="mb-2">Total Grades: <Badge variant="secondary" className="ml-1 text-xs">{Array.isArray(hr?.guardGrades) ? hr.guardGrades.length : 0}</Badge></div>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {(hr?.guardGrades || []).map((g: any) => (
                    <div key={g.id} className="px-2 py-1 rounded bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-between">
                      <span>{g.name}</span>
                      <span className="text-xs text-gray-500">{g.description || ''}</span>
                    </div>
                  ))}
                  {(Array.isArray(hr?.guardGrades) && hr.guardGrades.length === 0) && (
                    <div className="text-xs text-gray-500">No grades configured.</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Finance: Payroll Defaults */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Finance: Payroll Defaults</h3>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitPayroll} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Guard absence deduction/day</label>
                <input type="number" min={0} step="0.01" value={data.guard_absence_deduction_per_day}
                  onChange={(e) => setData('guard_absence_deduction_per_day', Number(e.target.value))}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2" />
                {errors.guard_absence_deduction_per_day && <div className="text-xs text-red-600 mt-1">{errors.guard_absence_deduction_per_day}</div>}
              </div>
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Staff absence deduction/day</label>
                <input type="number" min={0} step="0.01" value={data.staff_absence_deduction_per_day}
                  onChange={(e) => setData('staff_absence_deduction_per_day', Number(e.target.value))}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2" />
                {errors.staff_absence_deduction_per_day && <div className="text-xs text-red-600 mt-1">{errors.staff_absence_deduction_per_day}</div>}
              </div>
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Overtime multiplier (default)</label>
                <input type="number" min={1} step="0.1" value={data.overtime_multiplier_default}
                  onChange={(e) => setData('overtime_multiplier_default', Number(e.target.value))}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2" />
                {errors.overtime_multiplier_default && <div className="text-xs text-red-600 mt-1">{errors.overtime_multiplier_default}</div>}
              </div>
              <div className="md:col-span-3 flex justify-end">
                <Button type="submit" disabled={processing} className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">Save</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
