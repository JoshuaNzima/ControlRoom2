import React from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import ControlRoomLayout from '@/Layouts/ControlRoomLayout';
import { Card, CardContent, CardHeader } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/dialog';

export default function ClientShow() {
  const { client, guards = [], supervisors = [], assignmentsBySite = {} } = usePage().props as any;
  const guardForm = useForm({ guard_id: '' });
  const supervisorForm = useForm({ supervisor_id: '' });
  const [qrOpen, setQrOpen] = React.useState(false);
  const [qrUrl, setQrUrl] = React.useState<string | null>(null);
  const [qrSiteName, setQrSiteName] = React.useState<string>('');

  const openQr = (site: any) => {
    setQrUrl(route('control-room.clients.sites.qr', site.id));
    setQrSiteName(site.name || 'Site');
    setQrOpen(true);
  };

  return (
    <ControlRoomLayout title={`Client • ${client.name}`}>
      <Head title={`Client • ${client.name}`} />
      <div className="space-y-4">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Overview</h3>
              <Link href={route('control-room.clients')} className="text-sm text-indigo-600">Back</Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <div><span className="font-medium">Name:</span> {client.name}</div>
              <div><span className="font-medium">Status:</span> {client.status}</div>
              <div className="sm:col-span-2"><span className="font-medium">Address:</span> {client.address ?? '-'}</div>
              <div className="sm:col-span-2"><span className="font-medium">Contact:</span> {client.contact_person ?? '-'} {client.phone ? `• ${client.phone}` : ''}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Sites</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {client.sites?.map((s: any) => (
                <div key={s.id} className="p-3 rounded border dark:border-gray-600">
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-gray-500">{s.status}</div>
                  <div className="mt-2 text-sm">
                    <div className="font-medium">Assigned Guards:</div>
                    <div className="text-xs text-gray-600 dark:text-gray-300">
                      {(assignmentsBySite[s.id] ?? []).length === 0 && 'None'}
                      {(assignmentsBySite[s.id] ?? []).map((a: any) => (
                        <span key={a.id} className="inline-block mr-2">{a.guard?.name}</span>
                      ))}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Button variant="outline" className="h-8 px-3 text-xs dark:border-gray-600 dark:text-gray-200" onClick={() => openQr(s)}>
                      Generate QR
                    </Button>
                    <a href={route('control-room.clients.sites.qr', s.id)} target="_blank" rel="noreferrer" className="h-8 px-3 text-xs inline-flex items-center rounded-md border dark:border-gray-600 dark:text-gray-200">
                      Open in new tab
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Assign Guard</h3>
            </CardHeader>
            <CardContent>
              <form className="flex gap-2 items-end" onSubmit={(e) => { e.preventDefault(); guardForm.post(route('control-room.clients.assign-guard', client.id)); }}>
                <div className="flex-1">
                  <label className="block text-sm font-medium">Guard</label>
                  <select className="w-full border rounded-md p-2" value={guardForm.data.guard_id} onChange={(e) => guardForm.setData('guard_id', e.target.value)}>
                    <option value="">Select guard</option>
                    {guards.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
                <Button type="submit">Assign</Button>
              </form>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Assign Supervisor</h3>
            </CardHeader>
            <CardContent>
              <form className="flex gap-2 items-end" onSubmit={(e) => { e.preventDefault(); supervisorForm.post(route('control-room.clients.assign-supervisor', client.id)); }}>
                <div className="flex-1">
                  <label className="block text-sm font-medium">Supervisor</label>
                  <select className="w-full border rounded-md p-2" value={supervisorForm.data.supervisor_id} onChange={(e) => supervisorForm.setData('supervisor_id', e.target.value)}>
                    <option value="">Select supervisor</option>
                    {supervisors.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <Button type="submit">Assign</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="w-full max-w-sm dark:bg-gray-800 dark:text-gray-100">
          <DialogHeader>
            <DialogTitle>{qrSiteName} • QR Code</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {qrUrl && (
              <img src={qrUrl} alt={`${qrSiteName} QR`} className="mx-auto max-w-full h-auto" />
            )}
            <div className="flex justify-end gap-2">
              {qrUrl && (
                <a href={qrUrl} download className="px-3 py-2 rounded-md border text-sm dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-700">
                  Download PNG
                </a>
              )}
              <Button variant="outline" className="px-3 py-2 text-sm dark:border-gray-600 dark:text-gray-100" onClick={() => setQrOpen(false)}>Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </ControlRoomLayout>
  );
}
