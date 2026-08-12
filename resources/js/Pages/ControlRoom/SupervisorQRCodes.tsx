import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import IconMapper from '@/Components/IconMapper';

interface SiteItem {
  id: number;
  name: string;
  qr_code: string | null;
  status: string;
  checkpoints?: { id: number; name: string; code: string; type: string; is_active: boolean }[];
}

interface ZoneItem {
  id: number;
  name: string;
  code?: string;
  description?: string;
  checkpoints_count?: number;
  sites?: SiteItem[];
}

interface CheckpointItem {
  id: number;
  name: string;
  code: string;
  type: string;
  is_active: boolean;
  site?: {
    id: number;
    name: string;
    qr_code?: string;
    status: string;
    client?: { id: number; name: string } | null;
  } | null;
}

interface PageProps {
  zones: ZoneItem[];
  checkpoints: CheckpointItem[];
}

export default function SupervisorQRCodes({ zones, checkpoints }: PageProps) {
  const [activeTab, setActiveTab] = useState<'sites' | 'checkpoints'>('sites');
  const [qrOpen, setQrOpen] = useState(false);
  const [qrCheckpoint, setQrCheckpoint] = useState<CheckpointItem | null>(null);

  const handleBulkDownload = () => {
    window.location.href = route('control-room.qr-codes.download-bulk');
  };

  const handleDownloadSaved = () => {
    window.location.href = route('control-room.qr-codes.download-saved');
  };

  const handleCheckpointBulkDownload = () => {
    window.location.href = route('control-room.checkpoints.download-bulk');
  };

  const printQr = (siteId: number) => {
    const url = route('control-room.clients.sites.qr-print', siteId);
    window.open(url, '_blank', 'width=600,height=800');
  };

  const printLandscapeQr = (siteId: number) => {
    const url = route('control-room.clients.sites.qr-print', siteId) + '?layout=landscape';
    window.open(url, '_blank', 'width=900,height=700');
  };

  const printCheckpointQr = (cp: CheckpointItem) => {
    const url = route('control-room.checkpoints.qr-print', cp.id);
    window.open(url, '_blank', 'width=600,height=800');
  };

  const printCheckpointLandscapeQr = (cp: CheckpointItem) => {
    const url = route('control-room.checkpoints.qr-print', cp.id) + '?layout=landscape';
    window.open(url, '_blank', 'width=900,height=700');
  };

  const openCheckpointQr = (cp: CheckpointItem) => {
    setQrCheckpoint(cp);
    setQrOpen(true);
  };

  // Flatten all sites from all zones
  const allSites = zones?.flatMap(z => z.sites || []) || [];
  const sitesWithQr = allSites.filter(s => s.qr_code);
  const sitesWithoutQr = allSites.filter(s => !s.qr_code);

  // Checkpoints with QR type
  const qrCheckpoints = checkpoints?.filter(c => c.type === 'qr') || [];
  const activeQrCheckpoints = qrCheckpoints.filter(c => c.is_active);

  return (
    <AuthenticatedLayout header="QR Code Management">
      <Head title="QR Code Management" />

      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                QR Code Management
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                Generate and download QR codes for sites, zones, and checkpoints.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2">
              <Button variant="outline" onClick={handleBulkDownload} className="w-full sm:w-auto">
                <span className="mr-2 h-4 w-4 inline-block"><IconMapper name="Download" size={16} /></span>
                Download All QR Codes
              </Button>
              <Button variant="outline" onClick={handleDownloadSaved} className="w-full sm:w-auto">
                <span className="mr-2 h-4 w-4 inline-block"><IconMapper name="Archive" size={16} /></span>
                Download Saved
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Sites</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{allSites.length}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">Sites with QR</div>
              <div className="text-2xl font-bold text-green-600">{sitesWithQr.length}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">Checkpoints</div>
              <div className="text-2xl font-bold text-coin-600 dark:text-coin-400">{qrCheckpoints.length}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">Zones</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{zones?.length || 0}</div>
            </Card>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 border-b dark:border-gray-700 mb-6">
            <button
              onClick={() => setActiveTab('sites')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                activeTab === 'sites'
                  ? 'border-coin-600 text-coin-700 dark:text-coin-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              Site QR Codes
            </button>
            <button
              onClick={() => setActiveTab('checkpoints')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                activeTab === 'checkpoints'
                  ? 'border-coin-600 text-coin-700 dark:text-coin-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              Checkpoint QR Codes
            </button>
          </div>

          {/* Sites Tab */}
          {activeTab === 'sites' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sites with QR Codes */}
              <Card className="p-6 dark:bg-gray-900/60 dark:border-gray-800">
                <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Sites with QR Codes</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Sites that have QR codes generated. Click to view or download.
                </p>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {sitesWithQr.length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No sites with QR codes found.</p>
                  )}
                  {sitesWithQr.map((site) => (
                    <div key={site.id} className="p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-950/20">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 dark:text-gray-100 truncate">{site.name}</div>
                          <div className="text-xs font-mono text-coin-600 dark:text-coin-400">{site.qr_code}</div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                            site.status === 'active'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                          }`}>
                            {site.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={route('control-room.clients.sites.qr', site.id)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm px-3 py-1.5 rounded-md border dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 whitespace-nowrap"
                          >
                            View QR
                          </a>
                          <button
                            onClick={() => printQr(site.id)}
                            className="text-sm px-3 py-1.5 rounded-md border dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 whitespace-nowrap"
                          >
                            Print
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Sites Needing QR Codes */}
              <Card className="p-6 dark:bg-gray-900/60 dark:border-gray-800">
                <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Sites Needing QR Codes</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Sites without QR codes. Click to generate a QR code.
                </p>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {sitesWithoutQr.length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">All sites have QR codes generated.</p>
                  )}
                  {sitesWithoutQr.map((site) => (
                    <div key={site.id} className="p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-950/20">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 dark:text-gray-100 truncate">{site.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">No QR code generated</div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                            site.status === 'active'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                          }`}>
                            {site.status}
                          </span>
                        </div>
                        <Link
                          href={route('control-room.clients.sites.qr', site.id)}
                          className="text-sm px-3 py-1.5 rounded-md bg-coin-600 text-white hover:bg-coin-700 whitespace-nowrap"
                        >
                          Generate
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
                {sitesWithoutQr.length > 0 && (
                  <div className="mt-4 pt-4 border-t dark:border-gray-700">
                    <a
                      href={route('control-room.qr-codes.download-bulk')}
                      className="inline-flex items-center gap-2 text-sm text-coin-700 hover:text-coin-800 dark:text-coin-300 dark:hover:text-coin-200"
                    >
                      <IconMapper name="RefreshCw" size={14} />
                      Bulk generate all missing QR codes
                    </a>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* Checkpoints Tab */}
          {activeTab === 'checkpoints' && (
            <div className="space-y-6">
              <div className="flex justify-end">
                <Button variant="outline" onClick={handleCheckpointBulkDownload} className="gap-2">
                  <IconMapper name="Download" size={16} /> Download All Checkpoint QR Codes
                </Button>
              </div>

              <Card className="p-6 dark:bg-gray-900/60 dark:border-gray-800">
                <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Checkpoint QR Codes</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Checkpoints with QR codes for patrol scanning. Each checkpoint has a unique code embedded in its QR.
                </p>
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {qrCheckpoints.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <IconMapper name="MapPin" size={48} className="mx-auto mb-3 opacity-50" />
                      <p>No checkpoints found.</p>
                      <Link
                        href={route('control-room.checkpoints.index')}
                        className="inline-flex items-center gap-2 text-sm text-coin-600 hover:text-coin-700 dark:text-coin-400 mt-2"
                      >
                        <IconMapper name="Plus" size={14} /> Add Checkpoints
                      </Link>
                    </div>
                  )}
                  {qrCheckpoints.map((cp) => (
                    <div key={cp.id} className="p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-950/20">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 dark:text-gray-100 truncate">{cp.name}</span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                              cp.is_active
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                            }`}>
                              {cp.is_active ? 'active' : 'inactive'}
                            </span>
                          </div>
                          <div className="text-xs font-mono text-coin-600 dark:text-coin-400 mt-1">{cp.code}</div>
                          {cp.site && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Site: {cp.site.name} {cp.site.client ? `(${cp.site.client.name})` : ''}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openCheckpointQr(cp)}
                            className="text-sm px-3 py-1.5 rounded-md border dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 whitespace-nowrap"
                          >
                            View QR
                          </button>
                          <button
                            onClick={() => printCheckpointQr(cp)}
                            className="text-sm px-3 py-1.5 rounded-md border dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 whitespace-nowrap"
                          >
                            Print
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* Zones Overview */}
          <Card className="mt-6 p-6 dark:bg-gray-900/60 dark:border-gray-800">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Zones Overview</h2>
            <div className="space-y-3">
              {zones?.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">No zones found.</p>}
              {zones?.map((z) => (
                <div key={z.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-950/20">
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 dark:text-gray-100 truncate">{z.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{z.code ?? 'No code'} - {z.sites?.length ?? 0} sites - {z.checkpoints_count ?? 0} checkpoints</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Checkpoint QR Modal */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="w-full max-w-sm dark:bg-gray-800 dark:text-gray-100">
          <DialogHeader>
            <DialogTitle>{qrCheckpoint?.name} - QR Code</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center">
            {qrCheckpoint && (
              <>
                <img
                  src={route('control-room.checkpoints.qr', qrCheckpoint.id)}
                  alt={`${qrCheckpoint.name} QR`}
                  className="mx-auto max-w-full h-auto"
                />
                <div className="mt-3 text-xs font-mono text-coin-600 dark:text-coin-400">{qrCheckpoint.code}</div>
              </>
            )}
          </div>
          <div className="flex justify-end gap-2">
            {qrCheckpoint && (
              <>
                <button
                  onClick={() => printCheckpointQr(qrCheckpoint)}
                  className="px-3 py-2 rounded-md border text-sm dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-700"
                >
                  Print Portrait
                </button>
                <button
                  onClick={() => printCheckpointLandscapeQr(qrCheckpoint)}
                  className="px-3 py-2 rounded-md border text-sm dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-700"
                >
                  Print Landscape
                </button>
              </>
            )}
            <Button variant="outline" onClick={() => setQrOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AuthenticatedLayout>
  );
}
