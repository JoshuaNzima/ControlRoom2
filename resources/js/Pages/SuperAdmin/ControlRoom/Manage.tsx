import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import IconMapper from '@/Components/IconMapper';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/dialog';

export default function ControlRoomManage() {
  const [zonesOpen, setZonesOpen] = React.useState(false);
  const [zoneId, setZoneId] = React.useState('');
  return (
    <AuthenticatedLayout header="Control Room">
      <Head title="Super Admin • Manage Control Room" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Manage Control Room</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">Monitoring, incidents, alerts and zones</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href={route('superadmin.control-room.index')}>
                <IconMapper name="ArrowLeft" className="mr-2" />
                Back
              </Link>
            </Button>
            <Button onClick={() => setZonesOpen(true)} className="flex items-center gap-2">
              <IconMapper name="Settings" />
              Zone Quick Controls
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="p-4 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center gap-3"><IconMapper name="Monitor" /><div className="font-medium text-gray-900 dark:text-gray-100">Monitoring</div></div>
            <div className="mt-3"><Button asChild><Link href={route('control-room.monitoring')}>Open</Link></Button></div>
          </Card>
          <Card className="p-4 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center gap-3"><IconMapper name="AlertTriangle" /><div className="font-medium text-gray-900 dark:text-gray-100">Incidents</div></div>
            <div className="mt-3"><Button asChild><Link href={route('control-room.incidents.index')}>Open</Link></Button></div>
          </Card>
          <Card className="p-4 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center gap-3"><IconMapper name="MapPin" /><div className="font-medium text-gray-900 dark:text-gray-100">Zones</div></div>
            <div className="mt-3"><Button asChild><Link href={route('control-room.zones.index')}>Open</Link></Button></div>
          </Card>
        </div>
      </div>
      <Dialog open={zonesOpen} onOpenChange={setZonesOpen}>
        <DialogContent className="w-full max-w-sm dark:bg-gray-800 dark:text-gray-100">
          <DialogHeader>
            <DialogTitle>Zone Quick Controls</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="block text-sm">Zone ID</label>
              <input value={zoneId} onChange={(e) => setZoneId(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2 dark:bg-gray-900 dark:border-gray-700" placeholder="e.g. 5" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button asChild disabled={!zoneId} className="w-full"><Link href={route('control-room.zones.assign', { zone: zoneId || 0 })}>Assign</Link></Button>
              <Button asChild variant="outline" disabled={!zoneId} className="w-full"><Link href={route('control-room.zones.reports', { zone: zoneId || 0 })}>Reports</Link></Button>
              <Button asChild variant="outline" disabled={!zoneId} className="w-full"><Link href={route('control-room.zones.map', { zone: zoneId || 0 })}>Map</Link></Button>
              <Button asChild variant="outline" disabled={!zoneId} className="w-full"><Link href={route('control-room.zones.index')}>All Zones</Link></Button>
            </div>
            <div className="flex items-center justify-end">
              <Button variant="outline" onClick={() => setZonesOpen(false)} className="dark:border-gray-600">Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AuthenticatedLayout>
  );
}
