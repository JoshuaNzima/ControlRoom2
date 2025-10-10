import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';

type KPIs = {
  total_guards?: number;
  active_guards?: number;
  inactive_guards?: number;
  suspended_guards?: number;
};

type Guard = { id: number; name: string; employee_id: string; status: string };

export default function GuardsDashboard({ kpis = {}, recentGuards = [] as Guard[] }: { kpis?: KPIs; recentGuards?: Guard[] }) {
  return (
    <AdminLayout title="Guards Dashboard">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <Card className="p-6">
            <h1 className="text-xl font-semibold mb-4">Guards Overview</h1>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Stat label="Total Guards" value={kpis.total_guards} />
              <Stat label="Active" value={kpis.active_guards} />
              <Stat label="Inactive" value={kpis.inactive_guards} />
              <Stat label="Suspended" value={kpis.suspended_guards} />
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild>
                <a href={route('admin.guards.index')}>Manage Guards</a>
              </Button>
              <Button asChild variant="outline">
                <a href={route('admin.guards.create')}>Add Guard</a>
              </Button>
              {route().has('admin.guard-assignments.index') && (
                <Button asChild variant="ghost">
                  <a href={route('admin.guard-assignments.index')}>Assignments</a>
                </Button>
              )}
              {route().has('admin.shifts.index') && (
                <Button asChild variant="ghost">
                  <a href={route('admin.shifts.index')}>Shifts</a>
                </Button>
              )}
              {route().has('admin.attendance.index') && (
                <Button asChild variant="ghost">
                  <a href={route('admin.attendance.index')}>Attendance</a>
                </Button>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Recent Guards</h2>
              <a href={route('admin.guards.index')} className="text-sm text-indigo-600">View All</a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentGuards.length === 0 ? (
                <div className="text-sm text-gray-500">No recent guards</div>
              ) : (
                recentGuards.map(g => (
                  <div key={g.id} className="p-3 rounded border bg-white flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{g.name}</div>
                      <div className="text-xs text-gray-500">ID: {g.employee_id}</div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">{g.status}</span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

function Stat({ label, value }: { label: string; value?: number | string }) {
  return (
    <div className="p-4 rounded-lg border bg-white">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-2xl font-bold text-gray-900">{value ?? 0}</div>
    </div>
  );
}


