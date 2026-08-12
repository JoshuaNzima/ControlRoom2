import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import IconMapper from '@/Components/IconMapper';

interface SiteItem {
  id: number;
  name: string;
  qr_code: string | null;
  status: string;
}

interface ZoneItem {
  id: number;
  name: string;
  code?: string;
  description?: string;
  checkpoints_count?: number;
  sites?: SiteItem[];
}

interface PageProps {
  zones?: ZoneItem[];
}

export default function QRCodes() {
  const { zones = [] } = usePage().props as PageProps;

  // Flatten all sites from all zones
  const allSites = zones.flatMap(z => z.sites || []);
  const sitesWithQr = allSites.filter(s => s.qr_code);
  const sitesWithoutQr = allSites.filter(s => !s.qr_code);

  const printQr = (siteId: number) => {
    const url = route('admin.clients.sites.qr-print', siteId);
    window.open(url, '_blank', 'width=600,height=800');
  };

  const printLandscapeQr = (siteId: number) => {
    const url = route('admin.clients.sites.qr-print', siteId) + '?layout=landscape';
    window.open(url, '_blank', 'width=900,height=700');
  };

  return (
    <AuthenticatedLayout header="QR Codes">
      <Head title="QR Codes" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">QR Code Management</h1>
            <p className="text-gray-600 dark:text-gray-300 text-sm">Generate and download QR codes for sites, zones, and checkpoints.</p>
          </div>
          <Button asChild variant="outline" className="w-full sm:w-auto gap-2">
            <a href={route('admin.qr-codes.download-bulk')}>
              <IconMapper name="Download" size={16} /> Download All QR Codes
            </a>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Sites</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{allSites.length}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">With QR Code</div>
            <div className="text-2xl font-bold text-green-600">{sitesWithQr.length}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Need QR Code</div>
            <div className="text-2xl font-bold text-orange-600">{sitesWithoutQr.length}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Zones</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{zones.length}</div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sites with QR Codes */}
          <Card className="p-4 sm:p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Sites with QR Codes</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Sites that have QR codes generated. You can download individual QR codes or use bulk download.
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
                        href={route('admin.clients.sites.qr', site.id)}
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
                      <button
                        onClick={() => printLandscapeQr(site.id)}
                        title="Print in landscape format with prominent emergency hotline"
                        className="text-sm px-3 py-1.5 rounded-md border dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 whitespace-nowrap"
                      >
                        Print Landscape
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Sites Needing QR Codes */}
          <Card className="p-4 sm:p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Sites Needing QR Codes</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Sites without QR codes. Generate QR codes for these sites individually or use bulk generation.
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
                      href={route('admin.clients.sites.qr', site.id)}
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
                  href={route('admin.qr-codes.download-bulk')}
                  className="inline-flex items-center gap-2 text-sm text-coin-700 hover:text-coin-800 dark:text-coin-300 dark:hover:text-coin-200"
                >
                  <IconMapper name="RefreshCw" size={14} />
                  Bulk generate all missing QR codes
                </a>
              </div>
            )}
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-4 sm:p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Bulk Downloads</h2>
            <div className="space-y-3">
              <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-950/20">
                <div className="font-medium text-gray-900 dark:text-gray-100">Download All QR Codes</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Download ZIP with all site, zone, and checkpoint QR codes</div>
                <a href={route('admin.qr-codes.download-bulk')} className="mt-2 inline-block text-sm text-coin-700 hover:text-coin-800 dark:text-coin-300 dark:hover:text-coin-200">
                  Download ZIP
                </a>
              </div>
              <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-950/20">
                <div className="font-medium text-gray-900 dark:text-gray-100">Download Saved</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Download previously generated QR codes</div>
                <a href={route('admin.qr-codes.download-saved')} className="mt-2 inline-block text-sm text-coin-700 hover:text-coin-800 dark:text-coin-300 dark:hover:text-coin-200">
                  Download Saved
                </a>
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Zones Overview</h2>
            <div className="space-y-3">
              {zones.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">No zones found.</p>}
              {zones.map((z) => (
                <div key={z.id} className="p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-950/20">
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 dark:text-gray-100">{z.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{z.code ?? 'No code'} • {z.sites?.length ?? 0} sites • {z.checkpoints_count ?? 0} checkpoints</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
