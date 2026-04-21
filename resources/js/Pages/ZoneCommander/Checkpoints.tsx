import React, { useState, useMemo } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import ZoneCommanderLayout from '@/Layouts/ZoneCommanderLayout';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import IconMapper from '@/Components/IconMapper';
import Pagination from '@/Components/Pagination';

interface Site {
  id: number;
  name: string;
  client_name?: string;
}

interface CheckpointSite {
  id: number;
  name: string;
  qr_code?: string;
  status: string;
  client?: { id: number; name: string } | null;
}

interface Checkpoint {
  id: number;
  name: string;
  code: string;
  type: 'qr' | 'nfc';
  description?: string;
  is_active: boolean;
  requires_photo: boolean;
  scan_radius_meters: number;
  latitude?: number;
  longitude?: number;
  site: CheckpointSite | null;
}

interface PaginatedCheckpoints {
  data: Checkpoint[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
  links: { url: string | null; label: string; active: boolean }[];
  next_page_url: string | null;
  prev_page_url: string | null;
}

interface PageProps {
  checkpoints: PaginatedCheckpoints;
  sites: Site[];
  filters: { site_id?: string; status?: string };
}

type GroupByMode = 'site' | 'type' | 'none';

export default function ZoneCommanderCheckpoints() {
  const pageProps = usePage().props as unknown as PageProps;
  const checkpointsData = pageProps.checkpoints;
  const checkpoints = checkpointsData?.data ?? [];
  const sites = pageProps.sites ?? [];
  const filters = pageProps.filters ?? {};

  const [qrOpen, setQrOpen] = useState(false);
  const [qrCheckpoint, setQrCheckpoint] = useState<Checkpoint | null>(null);
  const [groupBy, setGroupBy] = useState<GroupByMode>('site');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkLayout, setBulkLayout] = useState<'portrait' | 'landscape'>('portrait');

  const [filterSite, setFilterSite] = useState(filters.site_id || '');
  const [filterStatus, setFilterStatus] = useState(filters.status || '');

  const printQr = (cp: Checkpoint) => {
    const url = route('zone.checkpoints.qr-print', cp.id);
    window.open(url, '_blank', 'width=600,height=800');
  };

  const printLandscapeQr = (cp: Checkpoint) => {
    const url = route('zone.checkpoints.qr-print', cp.id) + '?layout=landscape';
    window.open(url, '_blank', 'width=900,height=700');
  };

  const openQr = (cp: Checkpoint) => {
    setQrCheckpoint(cp);
    setQrOpen(true);
  };

  const applyFilters = () => {
    router.get(route('zone.checkpoints.index'), {
      site_id: filterSite || undefined,
      status: filterStatus || undefined,
    }, { preserveState: true });
  };

  const clearFilters = () => {
    setFilterSite('');
    setFilterStatus('');
    router.get(route('zone.checkpoints.index'), {}, { preserveState: true });
  };

  // QR type checkpoints only
  const qrCheckpoints = checkpoints.filter(c => c.type === 'qr');
  const activeCheckpoints = checkpoints.filter(c => c.is_active);

  // Group checkpoints by site or type
  const groupedCheckpoints = useMemo(() => {
    if (groupBy === 'none') {
      return { 'All Checkpoints': qrCheckpoints };
    }

    const groups: Record<string, Checkpoint[]> = {};

    qrCheckpoints.forEach(cp => {
      let key: string;
      if (groupBy === 'site') {
        key = cp.site?.name || 'Unassigned';
      } else {
        key = cp.type.toUpperCase();
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(cp);
    });

    // Sort groups alphabetically
    return Object.fromEntries(
      Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
    );
  }, [qrCheckpoints, groupBy]);

  // Bulk print functions
  const toggleSelect = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const bulkPrint = (ids?: number[]) => {
    const idsToPrint = ids || selectedIds;
    if (idsToPrint.length === 0) return;
    window.open(route('zone.checkpoints.bulk-print', { ids: idsToPrint, layout: bulkLayout }), '_blank');
  };

  const printGroup = (groupName: string) => {
    const cps = groupedCheckpoints[groupName] || [];
    if (cps.length > 0) {
      bulkPrint(cps.map(c => c.id));
    }
  };

  return (
    <ZoneCommanderLayout title="Checkpoints">
      <Head title="Zone Checkpoints" />

      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Checkpoints</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">View and print checkpoint QR codes for patrol scanning in your zone.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            {selectedIds.length > 0 && (
              <Button onClick={() => bulkPrint()} variant="secondary" className="w-full sm:w-auto gap-2">
                <IconMapper name="Printer" size={16} /> Print Selected ({selectedIds.length})
              </Button>
            )}
            <Button asChild variant="outline" className="w-full sm:w-auto gap-2">
              <a href={route('zone.checkpoints.download-bulk')}>
                <IconMapper name="Download" size={16} /> Download All QR
              </a>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <Card className="p-3 sm:p-4 bg-white/60 dark:bg-gray-900/40">
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Total Checkpoints</div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{checkpointsData?.total ?? checkpoints.length}</div>
          </Card>
          <Card className="p-3 sm:p-4 bg-white/60 dark:bg-gray-900/40">
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Active</div>
            <div className="text-xl sm:text-2xl font-bold text-green-600">{activeCheckpoints.length}</div>
          </Card>
          <Card className="p-3 sm:p-4 bg-white/60 dark:bg-gray-900/40">
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">QR Type</div>
            <div className="text-xl sm:text-2xl font-bold text-coin-600 dark:text-coin-400">{qrCheckpoints.length}</div>
          </Card>
          <Card className="p-3 sm:p-4 bg-white/60 dark:bg-gray-900/40">
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Sites</div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{sites.length}</div>
          </Card>
        </div>

        {/* Filters and Grouping */}
        <Card className="p-3 sm:p-4 bg-white/60 dark:bg-gray-900/40">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Filter by Site</label>
              <select
                className="w-full border border-gray-300 dark:border-gray-700 rounded-md p-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                value={filterSite}
                onChange={(e) => setFilterSite(e.target.value)}
              >
                <option value="">All Sites</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} {s.client_name ? `(${s.client_name})` : ''}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select
                className="w-full border border-gray-300 dark:border-gray-700 rounded-md p-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Group By</label>
              <select
                className="w-full border border-gray-300 dark:border-gray-700 rounded-md p-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as GroupByMode)}
              >
                <option value="site">Site</option>
                <option value="type">Type</option>
                <option value="none">None</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Print Layout</label>
              <select
                className="w-full border border-gray-300 dark:border-gray-700 rounded-md p-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                value={bulkLayout}
                onChange={(e) => setBulkLayout(e.target.value as 'portrait' | 'landscape')}
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={applyFilters} variant="outline" size="sm">Apply</Button>
              <Button onClick={clearFilters} variant="ghost" size="sm">Clear</Button>
            </div>
          </div>
        </Card>

        {/* Checkpoints List - Grouped */}
        {qrCheckpoints.length === 0 ? (
          <Card className="p-6 sm:p-8 bg-white/60 dark:bg-gray-900/40 text-center">
            <IconMapper name="MapPin" size={48} className="mx-auto mb-3 opacity-50 text-gray-400" />
            <p className="text-gray-500 dark:text-gray-400">No checkpoints found in your zone.</p>
            <p className="text-sm mt-1 text-gray-400 dark:text-gray-500">Checkpoints are managed by Control Room operators.</p>
          </Card>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {Object.entries(groupedCheckpoints).map(([groupName, cps]) => (
              <Card key={groupName} className="p-3 sm:p-4 bg-white/60 dark:bg-gray-900/40">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    {groupBy === 'site' && <IconMapper name="MapPin" size={18} className="text-coin-600 dark:text-coin-400" />}
                    {groupBy === 'type' && <IconMapper name="QrCode" size={18} className="text-coin-600 dark:text-coin-400" />}
                    {groupName}
                    <span className="text-xs sm:text-sm font-normal text-gray-500 dark:text-gray-400">
                      ({cps.length} checkpoint{cps.length !== 1 ? 's' : ''})
                    </span>
                  </h3>
                  <Button variant="outline" size="sm" onClick={() => printGroup(groupName)} className="gap-1">
                    <IconMapper name="Printer" size={14} /> Print All
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {cps.map((cp) => (
                    <div key={cp.id} className={`p-3 rounded-lg border ${selectedIds.includes(cp.id) ? 'border-coin-500 dark:border-coin-400 bg-coin-50 dark:bg-coin-900/20' : 'border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/60'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1 flex items-start gap-2">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(cp.id)}
                            onChange={() => toggleSelect(cp.id)}
                            className="mt-1 h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-coin-600 focus:ring-coin-500"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">{cp.name}</span>
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs ${
                                cp.is_active
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                              }`}>
                                {cp.is_active ? 'active' : 'inactive'}
                              </span>
                            </div>
                            <div className="text-xs font-mono text-coin-600 dark:text-coin-400 mt-1">{cp.code}</div>
                            {groupBy !== 'site' && cp.site && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                                {cp.site.name}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-1 flex-shrink-0">
                          <Button variant="ghost" size="sm" onClick={() => openQr(cp)} className="h-8 w-8 p-0">
                            <IconMapper name="QrCode" size={14} />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => printQr(cp)} className="h-8 w-8 p-0">
                            <IconMapper name="Printer" size={14} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {checkpointsData && checkpointsData.last_page > 1 && (
          <Pagination
            currentPage={checkpointsData.current_page}
            totalPages={checkpointsData.last_page}
            onPageChange={(page) => {
              router.get(route('zone.checkpoints.index'), {
                ...filters,
                page,
              }, { preserveState: true });
            }}
          />
        )}
      </div>

      {/* QR Code View Modal */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="w-full max-w-sm dark:bg-gray-800 dark:text-gray-100">
          <DialogHeader>
            <DialogTitle>{qrCheckpoint?.name} - QR Code</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center">
            {qrCheckpoint && (
              <>
                <img
                  src={route('zone.checkpoints.qr', qrCheckpoint.id)}
                  alt={`${qrCheckpoint.name} QR`}
                  className="mx-auto max-w-full h-auto"
                />
                <div className="mt-3 text-xs font-mono text-coin-600 dark:text-coin-400">{qrCheckpoint.code}</div>
              </>
            )}
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2">
            {qrCheckpoint && (
              <>
                <Button variant="outline" onClick={() => printQr(qrCheckpoint)} className="w-full sm:w-auto gap-1">
                  <IconMapper name="Printer" size={14} /> Print Portrait
                </Button>
                <Button variant="outline" onClick={() => printLandscapeQr(qrCheckpoint)} className="w-full sm:w-auto gap-1">
                  <IconMapper name="Printer" size={14} /> Print Landscape
                </Button>
              </>
            )}
            <Button variant="outline" onClick={() => setQrOpen(false)} className="w-full sm:w-auto">Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </ZoneCommanderLayout>
  );
}
