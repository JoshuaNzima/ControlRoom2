import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import SuperAdminLayout from '@/Layouts/SuperAdminLayout';
import IconMapper from '@/Components/IconMapper';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/dialog';

export default function FinanceManage() {
  const [plannerOpen, setPlannerOpen] = React.useState(false);
  const [range, setRange] = React.useState({ from: '', to: '' });
  const [status, setStatus] = React.useState('pending');
  return (
    <SuperAdminLayout title="Finance">
      <Head title="Super Admin • Manage Finance" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Manage Finance</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">Approvals, requisitions and settings</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href={route('superadmin.finance.index')}>
                <IconMapper name="ArrowLeft" className="mr-2" />
                Back
              </Link>
            </Button>
            <Button onClick={() => setPlannerOpen(true)} className="flex items-center gap-2">
              <IconMapper name="Calendar" />
              Approvals Planner
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="p-4 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <IconMapper name="CheckCircle2" />
              <div className="font-medium text-gray-900 dark:text-gray-100">Approvals</div>
            </div>
            <div className="mt-3">
              <Button asChild>
                <Link href={route('admin.approvals.index')}>Open</Link>
              </Button>
            </div>
          </Card>
          <Card className="p-4 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <IconMapper name="ClipboardList" />
              <div className="font-medium text-gray-900 dark:text-gray-100">Requisitions</div>
            </div>
            <div className="mt-3">
              <Button asChild>
                <Link href={route('requisitions.index')}>Open</Link>
              </Button>
            </div>
          </Card>
          <Card className="p-4 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <IconMapper name="Settings" />
              <div className="font-medium text-gray-900 dark:text-gray-100">Finance Settings</div>
            </div>
            <div className="mt-3">
              <Button asChild>
                <Link href={route('admin.settings.index')}>Open</Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
      <Dialog open={plannerOpen} onOpenChange={setPlannerOpen}>
        <DialogContent className="w-full max-w-md dark:bg-gray-800 dark:text-gray-100">
          <DialogHeader>
            <DialogTitle>Approvals Planner</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="block text-sm">From</label>
              <input type="date" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} className="mt-1 w-full rounded-md border px-3 py-2 dark:bg-gray-900 dark:border-gray-700" />
            </div>
            <div>
              <label className="block text-sm">To</label>
              <input type="date" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} className="mt-1 w-full rounded-md border px-3 py-2 dark:bg-gray-900 dark:border-gray-700" />
            </div>
            <div>
              <label className="block text-sm">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2 dark:bg-gray-900 dark:border-gray-700">
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setPlannerOpen(false)} className="dark:border-gray-600">Close</Button>
              <Button onClick={() => {
                setPlannerOpen(false);
                router.get(route('admin.approvals.index'), { from: range.from, to: range.to, status }, { preserveState: true });
              }}>Open Filtered</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </SuperAdminLayout>
  );
}
