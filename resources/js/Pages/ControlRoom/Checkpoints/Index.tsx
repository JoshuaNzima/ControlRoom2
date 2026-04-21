import React, { useState, useMemo } from 'react';
import { Head, Link, useForm, router, usePage } from '@inertiajs/react';
import ControlRoomLayout from '@/Layouts/ControlRoomLayout';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/Components/ui/dialog';
import IconMapper from '@/Components/IconMapper';

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

interface PageProps {
  checkpoints: Checkpoint[];
  sites: Site[];
  filters: { site_id?: string; status?: string };
  [key: string]: unknown;
}

type GroupByMode = 'site' | 'type' | 'none';

export default function CheckpointsIndex() {
  const pageProps = usePage().props as unknown as PageProps;
  const checkpoints = pageProps.checkpoints ?? [];
  const sites = pageProps.sites ?? [];
  const filters = pageProps.filters ?? {};
  
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [selected, setSelected] = useState<Checkpoint | null>(null);
  const [qrCheckpoint, setQrCheckpoint] = useState<Checkpoint | null>(null);
  const [groupBy, setGroupBy] = useState<GroupByMode>('site');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkLayout, setBulkLayout] = useState<'portrait' | 'landscape'>('portrait');
  
  const [filterSite, setFilterSite] = useState(filters.site_id || '');
  const [filterStatus, setFilterStatus] = useState(filters.status || '');
  
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addForm = useForm({
    client_site_id: '',
    name: '',
    type: 'qr' as 'qr' | 'nfc',
    description: '',
    is_active: true,
    requires_photo: false,
    scan_radius_meters: 50,
    latitude: '',
    longitude: '',
  });

  const editForm = useForm({
    client_site_id: '',
    name: '',
    type: 'qr' as 'qr' | 'nfc',
    description: '',
    is_active: true,
    requires_photo: false,
    scan_radius_meters: 50,
    latitude: '',
    longitude: '',
  });

  const handleAdd = () => {
    setLoadingState('add', true);
    setErrorState('add', '');
    addForm.post(route('control-room.checkpoints.store'), {
      preserveScroll: true,
      onFinish: () => {
        setLoadingState('add', false);
        setAddOpen(false);
        addForm.reset();
      },
      onError: (errs) => setErrorState('add', Object.values(errs)[0] || 'Failed to create checkpoint'),
    });
  };

  const handleEdit = () => {
    if (!selected) return;
    setLoadingState('edit', true);
    setErrorState('edit', '');
    editForm.put(route('control-room.checkpoints.update', selected.id), {
      preserveScroll: true,
      onFinish: () => {
        setLoadingState('edit', false);
        setEditOpen(false);
        setSelected(null);
      },
      onError: (errs) => setErrorState('edit', Object.values(errs)[0] || 'Failed to update checkpoint'),
    });
  };

  const handleDelete = () => {
    if (!selected) return;
    setLoadingState('delete', true);
    setErrorState('delete', '');
    router.delete(route('control-room.checkpoints.destroy', selected.id), {
      preserveScroll: true,
      onFinish: () => {
        setLoadingState('delete', false);
        setDeleteOpen(false);
        setSelected(null);
      },
      onError: (errs) => setErrorState('delete', Object.values(errs)[0] || 'Failed to delete checkpoint'),
    });
  };

  const openEdit = (cp: Checkpoint) => {
    setSelected(cp);
    editForm.setData({
      client_site_id: String(cp.site?.id || ''),
      name: cp.name,
      type: cp.type,
      description: cp.description || '',
      is_active: cp.is_active,
      requires_photo: cp.requires_photo,
      scan_radius_meters: cp.scan_radius_meters,
      latitude: cp.latitude ? String(cp.latitude) : '',
      longitude: cp.longitude ? String(cp.longitude) : '',
    });
    setEditOpen(true);
  };

  const openDelete = (cp: Checkpoint) => {
    setSelected(cp);
    setDeleteOpen(true);
  };

  const openQr = (cp: Checkpoint) => {
    setQrCheckpoint(cp);
    setQrOpen(true);
  };

  const printQr = (cp: Checkpoint) => {
    const url = route('control-room.checkpoints.qr-print', cp.id);
    window.open(url, '_blank', 'width=600,height=800');
  };

  const printLandscapeQr = (cp: Checkpoint) => {
    const url = route('control-room.checkpoints.qr-print', cp.id) + '?layout=landscape';
    window.open(url, '_blank', 'width=900,height=700');
  };

  const setLoadingState = (key: string, value: boolean) => {
    setLoading(prev => ({ ...prev, [key]: value }));
  };

  const setErrorState = (key: string, value: string) => {
    setErrors(prev => ({ ...prev, [key]: value }));
    if (value) setTimeout(() => setErrors(prev => ({ ...prev, [key]: '' })), 5000);
  };

  const applyFilters = () => {
    router.get(route('control-room.checkpoints.index'), {
      site_id: filterSite || undefined,
      status: filterStatus || undefined,
    }, { preserveState: true });
  };

  const clearFilters = () => {
    setFilterSite('');
    setFilterStatus('');
    router.get(route('control-room.checkpoints.index'), {}, { preserveState: true });
  };

  // Group checkpoints by site or type
  const groupedCheckpoints = useMemo(() => {
    if (groupBy === 'none') {
      return { 'All Checkpoints': checkpoints };
    }

    const groups: Record<string, Checkpoint[]> = {};

    checkpoints.forEach(cp => {
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
  }, [checkpoints, groupBy]);

  // Bulk print functions
  const toggleSelect = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const qrIds = checkpoints.filter(c => c.type === 'qr').map(c => c.id);
    setSelectedIds(prev => 
      prev.length === qrIds.length ? [] : qrIds
    );
  };

  const bulkPrint = (ids?: number[]) => {
    const idsToPrint = ids || selectedIds;
    if (idsToPrint.length === 0) return;
    window.open(route('control-room.checkpoints.bulk-print', { ids: idsToPrint, layout: bulkLayout }), '_blank');
  };

  const printGroup = (groupName: string) => {
    const cps = groupedCheckpoints[groupName] || [];
    const qrIds = cps.filter(c => c.type === 'qr').map(c => c.id);
    if (qrIds.length > 0) {
      bulkPrint(qrIds);
    }
  };

  return (
    <ControlRoomLayout title="Checkpoints">
      <Head title="Checkpoint Management" />
      
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Checkpoint Management</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">Create and manage checkpoints with QR codes for patrol scanning.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            {selectedIds.length > 0 && (
              <Button onClick={() => bulkPrint()} variant="secondary" className="w-full sm:w-auto gap-2">
                <IconMapper name="Printer" size={16} /> Print Selected ({selectedIds.length})
              </Button>
            )}
            <Button asChild variant="outline" className="w-full sm:w-auto gap-2">
              <a href={route('control-room.checkpoints.download-bulk')}>
                <IconMapper name="Download" size={16} /> Download All QR
              </a>
            </Button>
            <Button onClick={() => setAddOpen(true)} className="w-full sm:w-auto gap-2">
              <IconMapper name="Plus" size={16} /> Add Checkpoint
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <Card className="p-3 sm:p-4">
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Total Checkpoints</div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{checkpoints.length}</div>
          </Card>
          <Card className="p-3 sm:p-4">
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Active</div>
            <div className="text-xl sm:text-2xl font-bold text-green-600">{checkpoints.filter(c => c.is_active).length}</div>
          </Card>
          <Card className="p-3 sm:p-4">
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">QR Type</div>
            <div className="text-xl sm:text-2xl font-bold text-coin-600 dark:text-coin-400">{checkpoints.filter(c => c.type === 'qr').length}</div>
          </Card>
          <Card className="p-3 sm:p-4">
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">NFC Type</div>
            <div className="text-xl sm:text-2xl font-bold text-blue-600">{checkpoints.filter(c => c.type === 'nfc').length}</div>
          </Card>
        </div>

        {/* Filters and Grouping */}
        <Card className="p-3 sm:p-4">
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
        {checkpoints.length === 0 ? (
          <Card className="p-6 sm:p-8 text-center">
            <IconMapper name="MapPin" size={48} className="mx-auto mb-3 opacity-50 text-gray-400" />
            <p className="text-gray-500 dark:text-gray-400">No checkpoints found.</p>
            <p className="text-sm mt-1 text-gray-400 dark:text-gray-500">Create checkpoints to generate QR codes for patrol scanning.</p>
          </Card>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {Object.entries(groupedCheckpoints).map(([groupName, cps]) => (
              <Card key={groupName} className="p-3 sm:p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    {groupBy === 'site' && <IconMapper name="MapPin" size={18} className="text-coin-600 dark:text-coin-400" />}
                    {groupBy === 'type' && <IconMapper name="QrCode" size={18} className="text-coin-600 dark:text-coin-400" />}
                    {groupName}
                    <span className="text-xs sm:text-sm font-normal text-gray-500 dark:text-gray-400">
                      ({cps.length} checkpoint{cps.length !== 1 ? 's' : ''})
                    </span>
                  </h3>
                  {cps.filter(c => c.type === 'qr').length > 0 && (
                    <Button variant="outline" size="sm" onClick={() => printGroup(groupName)} className="gap-1">
                      <IconMapper name="Printer" size={14} /> Print All
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {cps.map((cp) => (
                    <div key={cp.id} className={`p-3 rounded-lg border ${selectedIds.includes(cp.id) ? 'border-coin-500 dark:border-coin-400 bg-coin-50 dark:bg-coin-900/20' : 'border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/60'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1 flex items-start gap-2">
                          {cp.type === 'qr' && (
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(cp.id)}
                              onChange={() => toggleSelect(cp.id)}
                              className="mt-1 h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-coin-600 focus:ring-coin-500"
                            />
                          )}
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
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs ${
                                cp.type === 'qr'
                                  ? 'bg-coin-100 text-coin-800 dark:bg-coin-900/30 dark:text-coin-200'
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
                              }`}>
                                {cp.type.toUpperCase()}
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
                          {cp.type === 'qr' && (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => openQr(cp)} className="h-8 w-8 p-0">
                                <IconMapper name="QrCode" size={14} />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => printQr(cp)} className="h-8 w-8 p-0">
                                <IconMapper name="Printer" size={14} />
                              </Button>
                            </>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => openEdit(cp)} className="h-8 w-8 p-0">
                            <IconMapper name="Pencil" size={14} />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openDelete(cp)} className="h-8 w-8 p-0 text-red-600 hover:text-red-700 dark:text-red-400">
                            <IconMapper name="Trash2" size={14} />
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
      </div>

      {/* Add Checkpoint Modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="w-full max-w-md dark:bg-gray-800 dark:text-gray-100">
          <DialogHeader>
            <DialogTitle>Add Checkpoint</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {errors.add && <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded">{errors.add}</div>}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Site *</label>
              <select
                className="w-full border border-gray-300 dark:border-gray-700 rounded-md p-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                value={addForm.data.client_site_id}
                onChange={(e) => addForm.setData('client_site_id', e.target.value)}
              >
                <option value="">Select a site...</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} {s.client_name ? `(${s.client_name})` : ''}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
              <input
                type="text"
                className="w-full border border-gray-300 dark:border-gray-700 rounded-md p-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                value={addForm.data.name}
                onChange={(e) => addForm.setData('name', e.target.value)}
                placeholder="e.g., Main Entrance, Parking Lot A"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type *</label>
              <select
                className="w-full border border-gray-300 dark:border-gray-700 rounded-md p-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                value={addForm.data.type}
                onChange={(e) => addForm.setData('type', e.target.value as 'qr' | 'nfc')}
              >
                <option value="qr">QR Code</option>
                <option value="nfc">NFC Tag</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea
                className="w-full border border-gray-300 dark:border-gray-700 rounded-md p-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                value={addForm.data.description}
                onChange={(e) => addForm.setData('description', e.target.value)}
                rows={2}
                placeholder="Optional description"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Scan Radius (m)</label>
                <input
                  type="number"
                  className="w-full border border-gray-300 dark:border-gray-700 rounded-md p-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  value={addForm.data.scan_radius_meters}
                  onChange={(e) => addForm.setData('scan_radius_meters', parseInt(e.target.value) || 50)}
                  min={1}
                  max={1000}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Latitude</label>
                <input
                  type="number"
                  step="any"
                  className="w-full border border-gray-300 dark:border-gray-700 rounded-md p-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  value={addForm.data.latitude}
                  onChange={(e) => addForm.setData('latitude', e.target.value)}
                  placeholder="-13.9626"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Longitude</label>
              <input
                type="number"
                step="any"
                className="w-full border border-gray-300 dark:border-gray-700 rounded-md p-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                value={addForm.data.longitude}
                onChange={(e) => addForm.setData('longitude', e.target.value)}
                placeholder="33.7741"
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={addForm.data.is_active}
                  onChange={(e) => addForm.setData('is_active', e.target.checked)}
                  className="rounded border-gray-300 dark:border-gray-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={addForm.data.requires_photo}
                  onChange={(e) => addForm.setData('requires_photo', e.target.checked)}
                  className="rounded border-gray-300 dark:border-gray-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Requires Photo on Scan</span>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={loading.add}>
              {loading.add ? 'Creating...' : 'Create Checkpoint'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Checkpoint Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="w-full max-w-md dark:bg-gray-800 dark:text-gray-100">
          <DialogHeader>
            <DialogTitle>Edit Checkpoint</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {errors.edit && <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded">{errors.edit}</div>}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Site *</label>
              <select
                className="w-full border border-gray-300 dark:border-gray-700 rounded-md p-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                value={editForm.data.client_site_id}
                onChange={(e) => editForm.setData('client_site_id', e.target.value)}
              >
                <option value="">Select a site...</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} {s.client_name ? `(${s.client_name})` : ''}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
              <input
                type="text"
                className="w-full border border-gray-300 dark:border-gray-700 rounded-md p-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                value={editForm.data.name}
                onChange={(e) => editForm.setData('name', e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type *</label>
              <select
                className="w-full border border-gray-300 dark:border-gray-700 rounded-md p-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                value={editForm.data.type}
                onChange={(e) => editForm.setData('type', e.target.value as 'qr' | 'nfc')}
              >
                <option value="qr">QR Code</option>
                <option value="nfc">NFC Tag</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea
                className="w-full border border-gray-300 dark:border-gray-700 rounded-md p-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                value={editForm.data.description}
                onChange={(e) => editForm.setData('description', e.target.value)}
                rows={2}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Scan Radius (m)</label>
                <input
                  type="number"
                  className="w-full border border-gray-300 dark:border-gray-700 rounded-md p-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  value={editForm.data.scan_radius_meters}
                  onChange={(e) => editForm.setData('scan_radius_meters', parseInt(e.target.value) || 50)}
                  min={1}
                  max={1000}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Latitude</label>
                <input
                  type="number"
                  step="any"
                  className="w-full border border-gray-300 dark:border-gray-700 rounded-md p-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  value={editForm.data.latitude}
                  onChange={(e) => editForm.setData('latitude', e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Longitude</label>
              <input
                type="number"
                step="any"
                className="w-full border border-gray-300 dark:border-gray-700 rounded-md p-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                value={editForm.data.longitude}
                onChange={(e) => editForm.setData('longitude', e.target.value)}
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editForm.data.is_active}
                  onChange={(e) => editForm.setData('is_active', e.target.checked)}
                  className="rounded border-gray-300 dark:border-gray-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editForm.data.requires_photo}
                  onChange={(e) => editForm.setData('requires_photo', e.target.checked)}
                  className="rounded border-gray-300 dark:border-gray-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Requires Photo on Scan</span>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={loading.edit}>
              {loading.edit ? 'Updating...' : 'Update Checkpoint'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="w-full max-w-sm dark:bg-gray-800 dark:text-gray-100">
          <DialogHeader>
            <DialogTitle>Delete Checkpoint</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {errors.delete && <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded mb-3">{errors.delete}</div>}
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Are you sure you want to delete <strong>{selected?.name}</strong>? This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading.delete}>
              {loading.delete ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                  src={route('control-room.checkpoints.qr', qrCheckpoint.id)}
                  alt={`${qrCheckpoint.name} QR`}
                  className="mx-auto max-w-full h-auto"
                />
                <div className="mt-3 text-xs font-mono text-coin-600 dark:text-coin-400">{qrCheckpoint.code}</div>
              </>
            )}
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ControlRoomLayout>
  );
}
