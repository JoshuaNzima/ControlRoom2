import React from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import PageHeader from '@/Components/ui/page-header';
import EmptyState from '@/Components/ui/empty-state';

interface AlertModel {
  id: number;
  title: string;
  message: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'acknowledged' | 'resolved';
  source_type?: string | null;
  source?: any;
  acknowledged_by?: number | null;
  acknowledged_at?: string | null;
  acknowledgedBy?: { id: number; name: string } | null;
  resolved_by?: number | null;
  resolved_at?: string | null;
}

interface PageProps {
  alerts?: {
    data: AlertModel[];
    links?: any[];
    meta?: { current_page?: number; last_page?: number };
  };
  auth?: { user?: { name?: string } };
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
    case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100';
    case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100';
    case 'low': return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-100';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
    case 'acknowledged': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100';
    case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-100';
  }
};

export default function AlertsIndex() {
  const { alerts = { data: [], links: [], meta: {} }, auth } = usePage().props as any;
  const [showSend, setShowSend] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [form, setForm] = React.useState({ message: '', priority: 'critical', target_groups: ['all_guards'] as string[] });

  const acknowledge = (alertId: number) => {
    router.post(route('control-room.alerts.acknowledge', { alert: alertId }), {}, { preserveScroll: true });
  };

  const resolve = (alertId: number) => {
    router.post(route('control-room.alerts.resolve', { alert: alertId }), {}, { preserveScroll: true });
  };

  const sendEmergency = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    router.post(route('control-room.alerts.send-emergency'), form, {
      preserveScroll: true,
      onFinish: () => setSending(false),
      onSuccess: () => { setShowSend(false); setForm({ message: '', priority: 'critical', target_groups: ['all_guards'] }); },
    });
  };

  return (
    <AuthenticatedLayout header="Emergency Alerts" user={auth?.user as any}>
      <Head title="Emergency Alerts" />

      <div className="space-y-6">
        <PageHeader
          title="Emergency Alerts"
          description="Monitor, acknowledge and resolve alerts."
          actions={(
            <Button variant="destructive" className="h-10" onClick={() => setShowSend(true)}>
              Send Emergency Alert
            </Button>
          )}
        />

        {/* Alerts List */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Recent Alerts</h3>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Page {alerts?.meta?.current_page ?? ''} / {alerts?.meta?.last_page ?? ''}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alerts.data.map((alert: AlertModel) => (
                <div key={alert.id} className={`p-4 rounded-lg border ${
                  alert.priority === 'critical'
                    ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                    : alert.priority === 'high'
                    ? 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800'
                    : 'bg-gray-50 border-gray-200 dark:bg-gray-700 dark:border-gray-600'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">{alert.title}</h4>
                        <Badge className={`text-xs ${getPriorityColor(alert.priority)}`}>{alert.priority}</Badge>
                        <Badge className={`text-xs ${getStatusColor(alert.status)}`}>{alert.status}</Badge>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{alert.message}</p>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {alert.acknowledgedBy && (
                          <span>Ack by {alert.acknowledgedBy.name} {alert.acknowledged_at ? `• ${new Date(alert.acknowledged_at).toLocaleString()}` : ''}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {alert.status === 'active' && (
                        <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700 text-white" onClick={() => acknowledge(alert.id)}>
                          Acknowledge
                        </Button>
                      )}
                      <Button size="sm" variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600" onClick={() => resolve(alert.id)}>
                        Resolve
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {alerts.data.length === 0 && (
                <EmptyState
                  title="No alerts found"
                  description="When alerts are triggered, they will appear here."
                  size="sm"
                  contentClassName="py-6"
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        {alerts.links && (
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">Page {alerts?.meta?.current_page ?? ''} of {alerts?.meta?.last_page ?? ''}</div>
            <div className="flex flex-wrap gap-2">
              {alerts.links.filter((l: any) => l.url).map((l: any, idx: number) => (
                <button
                  key={idx}
                  className={`px-3 py-1 rounded border dark:border-gray-700 ${l.active ? 'bg-coin-600 text-white' : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200'}`}
                  onClick={() => router.get(l.url, {}, { preserveScroll: true, preserveState: true })}
                  dangerouslySetInnerHTML={{ __html: l.label }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Send Emergency Modal */}
      {showSend && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
            <div className="px-4 py-3 border-b dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Send Emergency Alert</h3>
              <button onClick={() => setShowSend(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100">✕</button>
            </div>
            <form onSubmit={sendEmergency} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2"
                  rows={4}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value as any })}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target groups</label>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {['all_guards','supervisors','management','clients'].map(g => (
                    <label key={g} className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 dark:border-gray-600"
                        checked={form.target_groups.includes(g)}
                        onChange={(e) => {
                          const next = new Set(form.target_groups);
                          if (e.target.checked) next.add(g); else next.delete(g);
                          setForm({ ...form, target_groups: Array.from(next) });
                        }}
                      />
                      <span className="text-gray-700 dark:text-gray-300">{g.replace('_',' ')}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-end gap-2">
                <button type="button" onClick={() => setShowSend(false)} className="px-4 py-2 rounded-md border dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200">Cancel</button>
                <button type="submit" disabled={sending} className="px-4 py-2 rounded-md bg-coin-700 hover:bg-coin-800 text-white">{sending ? 'Sending…' : 'Send'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AuthenticatedLayout>
  );
}
