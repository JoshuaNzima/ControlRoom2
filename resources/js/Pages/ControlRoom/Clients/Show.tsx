import React from 'react';
import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import ControlRoomLayout from '@/Layouts/ControlRoomLayout';
import { Card, CardContent, CardHeader } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import IconMapper from '@/Components/IconMapper';

export default function ClientShow() {
  const { client, guards = [], supervisors = [], sergeants = [], assignmentsBySite = {} } = usePage().props as any;
  
  // Site-specific assignment form
  const siteGuardForm = useForm({ site_id: '', guard_id: '' });
  const supervisorForm = useForm({ supervisor_id: '' });
  const sergeantForm = useForm({ sergeant_id: '' });
  
  const [qrOpen, setQrOpen] = React.useState(false);
  const [qrUrl, setQrUrl] = React.useState<string | null>(null);
  const [qrSiteName, setQrSiteName] = React.useState<string>('');
  const [activeTab, setActiveTab] = React.useState<'sites' | 'assignments'>('sites');

  const openQr = (site: any) => {
    setQrUrl(route('control-room.clients.sites.qr', site.id));
    setQrSiteName(site.name || 'Site');
    setQrOpen(true);
  };

  const downloadQr = (site: any) => {
    const url = route('control-room.clients.sites.qr', site.id);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${site.name || 'site'}-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printQr = (site: any) => {
    const url = route('control-room.clients.sites.qr-print', site.id);
    window.open(url, '_blank', 'width=600,height=800');
  };

  return (
    <ControlRoomLayout title={`Client • ${client.name}`}>
      <Head title={`Client • ${client.name}`} />
      
      <div className="space-y-4 max-w-7xl mx-auto">
        {/* Header Card */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{client.name}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Client Management</p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={route('control-room.clients')}
                  className="text-sm px-3 py-2 rounded-md border dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Back to Clients
                </Link>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <div className="text-gray-500 dark:text-gray-400">Status</div>
                <div className="font-medium">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                    client.status === 'active' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                  }`}>
                    {client.status}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-gray-500 dark:text-gray-400">Sites</div>
                <div className="font-medium">{client.sites?.length || 0} locations</div>
              </div>
              {client.address && (
                <div className="sm:col-span-2 space-y-1">
                  <div className="text-gray-500 dark:text-gray-400">Address</div>
                  <div className="font-medium">{client.address}</div>
                </div>
              )}
              {client.contact_person && (
                <div className="space-y-1">
                  <div className="text-gray-500 dark:text-gray-400">Contact</div>
                  <div className="font-medium">{client.contact_person}</div>
                </div>
              )}
              {client.phone && (
                <div className="space-y-1">
                  <div className="text-gray-500 dark:text-gray-400">Phone</div>
                  <div className="font-medium">{client.phone}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b dark:border-gray-700">
          <button
            onClick={() => setActiveTab('sites')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
              activeTab === 'sites'
                ? 'border-coin-600 text-coin-700 dark:text-coin-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            Sites & QR Codes
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
              activeTab === 'assignments'
                ? 'border-coin-600 text-coin-700 dark:text-coin-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            Assignments
          </button>
        </div>

        {/* Sites & QR Codes Tab */}
        {activeTab === 'sites' && (
          <div className="space-y-4">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Site QR Codes</h3>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {client.sites?.map((site: any) => (
                    <div key={site.id} className="p-4 rounded-lg border dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-gray-100">{site.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{site.status}</div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${
                          site.status === 'active'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                        }`}>
                          {site.status}
                        </span>
                      </div>
                      
                      {site.qr_code && (
                        <div className="mt-3 p-2 bg-white dark:bg-gray-800 rounded border dark:border-gray-700">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">QR Code ID</div>
                          <div className="text-sm font-mono text-coin-600 dark:text-coin-400">{site.qr_code}</div>
                        </div>
                      )}

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openQr(site)}
                          className="gap-1"
                        >
                          <IconMapper name="QrCode" size={14} />
                          View QR
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => downloadQr(site)}
                          className="gap-1"
                        >
                          <IconMapper name="Download" size={14} />
                          Download
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => printQr(site)}
                          className="gap-1"
                        >
                          <IconMapper name="Printer" size={14} />
                          Print
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {client.sites?.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No sites found for this client.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Assignments Tab */}
        {activeTab === 'assignments' && (
          <div className="space-y-4">
            {/* Site-Specific Guard Assignment */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Assign Guard to Site</h3>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (!siteGuardForm.data.site_id || !siteGuardForm.data.guard_id) return;
                  siteGuardForm.post(route('control-room.clients.assign-guard-site', { 
                    client: client.id,
                    site: siteGuardForm.data.site_id 
                  }));
                }} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Site</label>
                      <select
                        className="w-full border border-gray-300 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                        value={siteGuardForm.data.site_id}
                        onChange={(e) => siteGuardForm.setData('site_id', e.target.value)}
                        required
                      >
                        <option value="">Choose a site...</option>
                        {client.sites?.map((site: any) => (
                          <option key={site.id} value={site.id}>{site.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Guard</label>
                      <select
                        className="w-full border border-gray-300 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                        value={siteGuardForm.data.guard_id}
                        onChange={(e) => siteGuardForm.setData('guard_id', e.target.value)}
                        required
                      >
                        <option value="">Choose a guard...</option>
                        {(guards || []).filter((g: any) => g.status === 'active').map((guard: any) => (
                          <option key={guard.id} value={guard.id}>{guard.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button type="submit" disabled={siteGuardForm.processing}>
                      {siteGuardForm.processing ? 'Assigning...' : 'Assign Guard'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Current Assignments by Site */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Current Assignments</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {client.sites?.map((site: any) => {
                    const assignments = assignmentsBySite[site.id] || [];
                    return (
                      <div key={site.id} className="p-4 rounded-lg border dark:border-gray-700">
                        <div className="font-medium text-gray-900 dark:text-gray-100 mb-2">{site.name}</div>
                        {assignments.length > 0 ? (
                          <div className="space-y-2">
                            {assignments.map((assignment: any) => (
                              <div key={assignment.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded">
                                <div className="flex items-center gap-2">
                                  <IconMapper name="User" size={16} className="text-gray-500" />
                                  <span className="text-sm text-gray-900 dark:text-gray-100">{assignment.guard?.name || 'Unknown'}</span>
                                </div>
                                <button
                                  onClick={() => {
                                    if (confirm('Remove this guard from the site?')) {
                                      router.delete(route('control-room.clients.unassign-guard', { 
                                        client: client.id,
                                        site: site.id,
                                        assignment: assignment.id 
                                      }));
                                    }
                                  }}
                                  className="text-xs px-2 py-1 rounded text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500 dark:text-gray-400 py-2">No guards assigned</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Supervisor Assignment */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Assign Supervisor</h3>
              </CardHeader>
              <CardContent>
                <form 
                  className="flex flex-col sm:flex-row gap-4 sm:items-end" 
                  onSubmit={(e) => { 
                    e.preventDefault(); 
                    supervisorForm.post(route('control-room.clients.assign-supervisor', client.id)); 
                  }}
                >
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Supervisor</label>
                    <select
                      className="w-full border border-gray-300 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                      value={supervisorForm.data.supervisor_id}
                      onChange={(e) => supervisorForm.setData('supervisor_id', e.target.value)}
                      required
                    >
                      <option value="">Choose a supervisor...</option>
                      {(supervisors || []).map((s: any) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <Button type="submit" disabled={supervisorForm.processing}>
                    {supervisorForm.processing ? 'Assigning...' : 'Assign Supervisor'}
                  </Button>
                </form>
                
                {client.supervisor_id && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-between">
                    <div className="text-sm text-blue-800 dark:text-blue-200">
                      Current Supervisor: <span className="font-medium">{client.supervisor?.name || 'Assigned'}</span>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm('Remove supervisor from this client?')) {
                          router.post(route('control-room.clients.assign-supervisor', client.id), { supervisor_id: '' });
                        }
                      }}
                      className="text-xs px-2 py-1 rounded text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sergeant Assignment */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Assign Sergeant</h3>
              </CardHeader>
              <CardContent>
                <form 
                  className="flex flex-col sm:flex-row gap-4 sm:items-end" 
                  onSubmit={(e) => { 
                    e.preventDefault(); 
                    sergeantForm.post(route('control-room.clients.assign-sergeant', client.id)); 
                  }}
                >
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Sergeant</label>
                    <select
                      className="w-full border border-gray-300 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                      value={sergeantForm.data.sergeant_id}
                      onChange={(e) => sergeantForm.setData('sergeant_id', e.target.value)}
                      required
                    >
                      <option value="">Choose a sergeant...</option>
                      {(sergeants || []).filter((g: any) => g.position === 'sergeant').map((s: any) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <Button type="submit" disabled={sergeantForm.processing}>
                    {sergeantForm.processing ? 'Assigning...' : 'Assign Sergeant'}
                  </Button>
                </form>
                
                {client.sergeant_id && (
                  <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-between">
                    <div className="text-sm text-green-800 dark:text-green-200">
                      Current Sergeant: <span className="font-medium">{client.sergeant?.name || 'Assigned'}</span>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm('Remove sergeant from this client?')) {
                          router.post(route('control-room.clients.unassign-sergeant', client.id));
                        }
                      }}
                      className="text-xs px-2 py-1 rounded text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* QR Code Modal */}
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
                <a 
                  href={qrUrl} 
                  download 
                  className="px-3 py-2 rounded-md border text-sm dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-700"
                >
                  Download PNG
                </a>
              )}
              <Button variant="outline" className="px-3 py-2 text-sm" onClick={() => setQrOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </ControlRoomLayout>
  );
}
