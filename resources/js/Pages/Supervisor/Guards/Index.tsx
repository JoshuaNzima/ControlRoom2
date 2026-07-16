import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import IconMapper from '@/Components/IconMapper';
import CameraCapture from '@/Components/CameraCapture';
import ScannerModal from '@/Components/Scanner/ScannerModal';
import Modal from '@/Components/Modal';
import GuardFilterBar from '@/Components/Guards/GuardFilterBar';
import GuardListItem from '@/Components/Guards/GuardListItem';
import StatusBadge from '@/Components/Guards/StatusBadge';

interface Guard {
  id: number;
  employee_id: string;
  name: string;
  phone: string;
  status: string;
  guard_type?: 'permanent' | 'reliever' | 'standby';
  is_on_duty: boolean;
  attendance?: {
    id: number;
    check_in_time: string;
    check_out_time?: string | null;
    status: string;
    site?: string | null;
    hours_worked?: number | null;
  } | null;
}

interface Site {
  id: number;
  name: string;
  client_name: string;
  full_name: string;
}

interface Props {
  guards: Guard[];
  sites: Site[];
  activeScan?: {
    scan_id: number;
    site_id: number;
    site_name: string;
    client_name: string;
    scanned_at: string;
    expires_at: string;
  } | null;
  requireSiteScan?: boolean;
}

type SortField = 'name' | 'employee_id' | 'status';
type SortDirection = 'asc' | 'desc';

export default function GuardsIndex({ guards = [], sites = [], activeScan = null, requireSiteScan = false }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterGuardType, setFilterGuardType] = useState('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedGuard, setSelectedGuard] = useState<Guard | null>(null);
  const [selectedSite, setSelectedSite] = useState<number | null>(null);
  const [action, setAction] = useState<'checkin' | 'checkout' | 'bulk-checkin' | 'bulk-checkout' | null>(null);
  const [notes, setNotes] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [checkInTimeInput, setCheckInTimeInput] = useState(new Date().toTimeString().slice(0, 5));
  const [checkOutTimeInput, setCheckOutTimeInput] = useState(new Date().toTimeString().slice(0, 5));
  const [submitting, setSubmitting] = useState(false);
  const [backdate, setBackdate] = useState(false);
  const [backdateReason, setBackdateReason] = useState('');

  // Bulk selection state
  const [selectedGuardIds, setSelectedGuardIds] = useState<Set<number>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);

  const canPresent = requireSiteScan ? !!activeScan : true;

  // Filter and sort guards
  const filteredGuards = (guards || [])
    .filter((guard) => {
      const term = searchTerm.trim().toLowerCase();
      const matchesSearch = !term || guard.name.toLowerCase().includes(term) ||
        (guard.employee_id && guard.employee_id.toLowerCase().includes(term));

      const matchesStatus = filterStatus === 'all' ? true :
        filterStatus === 'on_duty' ? guard.is_on_duty :
        !guard.is_on_duty;

      const matchesGuardType = filterGuardType === 'all' ? true :
        guard.guard_type === filterGuardType;

      return matchesSearch && matchesStatus && matchesGuardType;
    })
    .sort((a, b) => {
      let valueA = a[sortField];
      let valueB = b[sortField];
      if (!valueA) return sortDirection === 'asc' ? -1 : 1;
      if (!valueB) return sortDirection === 'asc' ? 1 : -1;
      valueA = String(valueA).toLowerCase();
      valueB = String(valueB).toLowerCase();
      if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  // Bulk helpers
  const toggleSelectAll = () => {
    if (selectedGuardIds.size === filteredGuards.length) {
      setSelectedGuardIds(new Set());
    } else {
      setSelectedGuardIds(new Set(filteredGuards.map(g => g.id)));
    }
  };

  const toggleSelectGuard = (id: number) => {
    const next = new Set(selectedGuardIds);
    if (next.has(id)) {
      next.delete(id);
      setSelectedGuardIds(next);
    } else {
      next.add(id);
      setSelectedGuardIds(next);
    }
  };

  const bulkCheckIn = () => {
    if (selectedGuardIds.size === 0) return;
    setSelectedSite(activeScan?.site_id ?? null);
    setAction('bulk-checkin');
  };

  const bulkCheckOut = () => {
    if (selectedGuardIds.size === 0) return;
    setAction('bulk-checkout');
  };

  const submitBulkCheckIn = () => {
    const ids = Array.from(selectedGuardIds);
    if (ids.length === 0) return;
    const formData = new FormData();
    formData.append('guard_ids', JSON.stringify(ids));
    if (selectedSite) formData.append('client_site_id', String(selectedSite));
    if (notes) formData.append('notes', notes);
    if (checkInTimeInput) formData.append('time', checkInTimeInput);
    if (backdate) {
      formData.append('backdate', '1');
      if (backdateReason) formData.append('backdate_reason', backdateReason);
    }
    setSubmitting(true);
    router.post(route('supervisor.attendance.bulk-check-in'), formData, {
      forceFormData: true,
      onSuccess: () => {
        setSelectedGuardIds(new Set());
        setSelectedSite(null);
        setNotes('');
        setAction(null);
      },
      onFinish: () => setSubmitting(false),
    });
  };

  const submitBulkCheckOut = () => {
    const ids = Array.from(selectedGuardIds);
    if (ids.length === 0) return;
    const formData = new FormData();
    formData.append('guard_ids', JSON.stringify(ids));
    if (notes) formData.append('notes', notes);
    if (checkOutTimeInput) formData.append('time', checkOutTimeInput);
    setSubmitting(true);
    router.post(route('supervisor.attendance.bulk-check-out'), formData, {
      forceFormData: true,
      onSuccess: () => {
        setSelectedGuardIds(new Set());
        setNotes('');
        setAction(null);
      },
      onFinish: () => setSubmitting(false),
    });
  };

  // Single check-in/out
  const handleCheckIn = (guard: Guard) => {
    setSelectedGuard(guard);
    setAction('checkin');
    setNotes('');
    setSelectedSite(activeScan?.site_id ?? null);
    setCheckInTimeInput(new Date().toTimeString().slice(0, 5));
    setBackdate(false);
    setBackdateReason('');
  };

  const handleCheckOut = (guard: Guard) => {
    setSelectedGuard(guard);
    setAction('checkout');
    setNotes('');
    setCheckOutTimeInput(new Date().toTimeString().slice(0, 5));
  };

  const submitCheckIn = () => {
    if (!selectedGuard || !selectedSite) return;
    const formData = new FormData();
    formData.append('guard_id', String(selectedGuard.id));
    formData.append('client_site_id', String(selectedSite));
    if (notes) formData.append('notes', notes);
    if (photoFile) formData.append('photo', photoFile);
    if (checkInTimeInput) formData.append('time', checkInTimeInput);
    if (backdate) {
      formData.append('backdate', '1');
      if (backdateReason) formData.append('backdate_reason', backdateReason);
    }
    setSubmitting(true);
    router.post(route('supervisor.attendance.check-in'), formData, {
      forceFormData: true,
      onSuccess: () => {
        setSelectedGuard(null);
        setSelectedSite(null);
        setNotes('');
        setPhotoFile(null);
        setAction(null);
      },
      onFinish: () => setSubmitting(false),
    });
  };

  const submitCheckOut = () => {
    if (!selectedGuard?.attendance) return;
    const formData = new FormData();
    formData.append('guard_id', String(selectedGuard.id));
    if (notes) formData.append('notes', notes);
    if (photoFile) formData.append('photo', photoFile);
    if (checkOutTimeInput) formData.append('time', checkOutTimeInput);
    setSubmitting(true);
    router.post(route('supervisor.attendance.check-out'), formData, {
      forceFormData: true,
      onSuccess: () => {
        setSelectedGuard(null);
        setNotes('');
        setPhotoFile(null);
        setAction(null);
      },
      onFinish: () => setSubmitting(false),
    });
  };

  const submitQuickPresent = (guard: Guard) => {
    const siteId = activeScan?.site_id ?? (sites.length > 0 ? sites[0].id : null);
    if (!siteId) {
      handleCheckIn(guard);
      return;
    }
    const formData = new FormData();
    formData.append('guard_id', String(guard.id));
    formData.append('client_site_id', String(siteId));
    formData.append('time', new Date().toTimeString().slice(0, 5));
    setSubmitting(true);
    router.post(route('supervisor.attendance.check-in'), formData, {
      forceFormData: true,
      onSuccess: () => {
        setSelectedGuard(null);
      },
      onFinish: () => setSubmitting(false),
    });
  };

  const submitQuickAbsent = (guard: Guard) => {
    if (!canPresent) return;
    const siteId = activeScan?.site_id ?? (sites.length > 0 ? sites[0].id : null);
    if (!siteId) return;
    router.post(route('supervisor.attendance.manual'), {
      guard_id: guard.id,
      client_site_id: siteId,
      date: new Date().toISOString().slice(0, 10),
      check_in_time: new Date().toTimeString().slice(0, 5),
      status: 'absent',
    }, {
      preserveState: true,
      onFinish: () => setSubmitting(false),
    });
  };

  // Render guard action buttons
  const renderGuardActions = (guard: Guard): React.ReactNode => {
    if (!guard.attendance) {
      return (
        <>
          <button
            onClick={() => submitQuickPresent(guard)}
            disabled={!canPresent || submitting}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-lg font-medium text-sm transition"
            title="Quick Check In"
          >
            Present
          </button>
          <button
            onClick={() => submitQuickAbsent(guard)}
            disabled={!canPresent || submitting}
            className="px-3 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-lg font-medium text-sm transition"
            title="Mark Absent"
          >
            Absent
          </button>
        </>
      );
    }
    if (!guard.attendance.check_out_time) {
      return (
        <button
          onClick={() => handleCheckOut(guard)}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition"
        >
          Check Out
        </button>
      );
    }
    return (
      <span className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-lg font-medium flex items-center gap-2">
        <IconMapper name="CheckCircle" size={16} className="text-green-500" />
        Done
      </span>
    );
  };

  // Shared backdate reason input
  const renderBackdateReason = () => {
    if (!backdate) return null;
    const tooShort = backdateReason.length > 0 && backdateReason.length < 10;
    return (
      <div>
        <input
          value={backdateReason}
          onChange={(e) => setBackdateReason(e.target.value)}
          placeholder="Reason for backdate (minimum 10 characters)..."
          className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-coin-500 ${
            tooShort ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
          }`}
        />
        {tooShort && (
          <p className="text-xs text-red-600 mt-1">Please provide at least 10 characters explaining why backdating is needed.</p>
        )}
      </div>
    );
  };

  return (
    <AuthenticatedLayout header="Guards">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Head title="Guards" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

          {/* Header */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-4 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-coin-100 dark:bg-coin-900/20 rounded-full flex items-center justify-center">
                  <IconMapper name="Users" size={24} className="text-coin-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Guards</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {filteredGuards.length} of {guards.length} guards
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {activeScan ? (
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-lg">
                    <IconMapper name="MapPin" size={16} />
                    <span className="text-sm font-medium">{activeScan.site_name}</span>
                    <button onClick={() => setShowScannerModal(true)} className="text-xs underline ml-2">
                      Change
                    </button>
                  </div>
                ) : !requireSiteScan ? (
                  <span className="text-xs text-gray-500 dark:text-gray-400 italic">
                    Site scan optional — select site in check-in modal
                  </span>
                ) : (
                  <button
                    onClick={() => setShowScannerModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-coin-600 hover:bg-coin-700 text-white rounded-lg font-medium transition"
                  >
                    <IconMapper name="ScanLine" size={18} />
                    Scan Site
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Filter Bar — uses shared GuardFilterBar component */}
          <div className="mb-6">
            <GuardFilterBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              filterStatus={filterStatus}
              onFilterStatusChange={setFilterStatus}
              filterGuardType={filterGuardType}
              onFilterGuardTypeChange={setFilterGuardType}
              sortField={sortField}
              sortDirection={sortDirection}
              onSortChange={(field, direction) => {
                setSortField(field);
                setSortDirection(direction);
              }}
              bulkMode={bulkMode}
              onToggleBulkMode={() => setBulkMode(!bulkMode)}
              totalCount={guards.length}
              filteredCount={filteredGuards.length}
            />
          </div>

          {/* Bulk Action Bar */}
          {bulkMode && selectedGuardIds.size > 0 && (
            <div className="sticky top-0 z-10 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 mb-4">
              <div className="bg-coin-600 rounded-xl shadow-lg p-4 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <IconMapper name="CheckSquare" size={22} />
                  <span className="font-semibold">
                    {selectedGuardIds.size} guard{selectedGuardIds.size !== 1 ? 's' : ''} selected
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={bulkCheckIn}
                    disabled={!canPresent}
                    className="px-4 py-2 bg-white text-green-700 hover:bg-green-50 rounded-lg font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <IconMapper name="LogIn" size={16} className="inline mr-1" />
                    Check In Selected
                  </button>
                  <button
                    onClick={bulkCheckOut}
                    className="px-4 py-2 bg-white text-red-700 hover:bg-red-50 rounded-lg font-semibold text-sm transition"
                  >
                    <IconMapper name="LogOut" size={16} className="inline mr-1" />
                    Check Out Selected
                  </button>
                  <button
                    onClick={() => setSelectedGuardIds(new Set())}
                    className="px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Guards List — uses shared GuardListItem and StatusBadge components */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
            {filteredGuards.length === 0 ? (
              <div className="p-12 text-center">
                <IconMapper name="Users" size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <p className="text-gray-500 dark:text-gray-400">No guards found matching your filters</p>
              </div>
            ) : (
              <>
                {bulkMode && (
                  <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedGuardIds.size === filteredGuards.length && filteredGuards.length > 0}
                      onChange={toggleSelectAll}
                      className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-coin-600 focus:ring-coin-500"
                    />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {selectedGuardIds.size === filteredGuards.length && filteredGuards.length > 0
                        ? 'Deselect All'
                        : `Select All (${filteredGuards.length})`}
                    </span>
                  </div>
                )}
                <div className="divide-y divide-gray-200 dark:divide-gray-800">
                  {filteredGuards.map((guard) => (
                    <GuardListItem
                      key={guard.id}
                      guard={{
                        id: guard.id,
                        employee_id: guard.employee_id,
                        name: guard.name,
                        phone: guard.phone,
                        status: guard.status,
                        guard_type: guard.guard_type,
                        is_on_duty: guard.is_on_duty,
                        attendance: guard.attendance,
                      }}
                      selected={selectedGuardIds.has(guard.id)}
                      bulkMode={bulkMode}
                      onToggleSelect={toggleSelectGuard}
                      detailRoute={route('supervisor.guards.show', guard.id)}
                      actions={renderGuardActions(guard)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Bulk Check In Modal */}
        <Modal show={action === 'bulk-checkin'} onClose={() => setAction(null)} maxWidth="md">
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <IconMapper name="LogIn" size={20} className="text-green-600" />
              Bulk Check In ({selectedGuardIds.size} guards)
            </h3>
            <div className="space-y-4">
              <div className="bg-coin-50 dark:bg-coin-900/20 p-3 rounded-lg">
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  This will check in <strong>{selectedGuardIds.size} guards</strong> at the selected site with the chosen time.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Site *</label>
                <select
                  value={selectedSite ?? ''}
                  onChange={(e) => setSelectedSite(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-coin-500"
                  required
                  disabled={!!activeScan}
                >
                  <option value="">Choose a site...</option>
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>{site.full_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Time *</label>
                <input
                  type="time"
                  value={checkInTimeInput}
                  onChange={(e) => setCheckInTimeInput(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-coin-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                  <input
                    type="checkbox"
                    checked={backdate}
                    onChange={(e) => setBackdate(e.target.checked)}
                    className="rounded border-gray-300 dark:border-gray-700"
                  />
                  <span>Mark for yesterday (backdate)</span>
                </label>
                {renderBackdateReason()}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-coin-500"
                  placeholder="Optional notes for all selected guards..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={submitBulkCheckIn}
                  disabled={!selectedSite || submitting || (backdate && backdateReason.length < 10)}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg font-medium"
                >
                  {submitting ? 'Processing...' : 'Confirm Bulk Check In'}
                </button>
                <button
                  onClick={() => setAction(null)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </Modal>

        {/* Bulk Check Out Modal */}
        <Modal show={action === 'bulk-checkout'} onClose={() => setAction(null)} maxWidth="md">
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <IconMapper name="LogOut" size={20} className="text-red-600" />
              Bulk Check Out ({selectedGuardIds.size} guards)
            </h3>
            <div className="space-y-4">
              <div className="bg-coin-50 dark:bg-coin-900/20 p-3 rounded-lg">
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  This will check out <strong>{selectedGuardIds.size} guards</strong> with the chosen time. Only guards with an active check-in will be affected.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Time *</label>
                <input
                  type="time"
                  value={checkOutTimeInput}
                  onChange={(e) => setCheckOutTimeInput(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-coin-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-coin-500"
                  placeholder="End of shift notes..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={submitBulkCheckOut}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white rounded-lg font-medium"
                >
                  {submitting ? 'Processing...' : 'Confirm Bulk Check Out'}
                </button>
                <button
                  onClick={() => setAction(null)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </Modal>

        {/* Single Check In Modal */}
        <Modal show={action === 'checkin'} onClose={() => setAction(null)} maxWidth="md">
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <IconMapper name="LogIn" size={20} className="text-green-600" />
              Check In: {selectedGuard?.name}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Site *</label>
                <select
                  value={selectedSite ?? ''}
                  onChange={(e) => setSelectedSite(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-coin-500"
                  required
                  disabled={!!activeScan}
                >
                  <option value="">Choose a site...</option>
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>{site.full_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Time *</label>
                <input
                  type="time"
                  value={checkInTimeInput}
                  onChange={(e) => setCheckInTimeInput(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-coin-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                  <input
                    type="checkbox"
                    checked={backdate}
                    onChange={(e) => setBackdate(e.target.checked)}
                    className="rounded border-gray-300 dark:border-gray-700"
                  />
                  <span>Mark for yesterday (backdate)</span>
                </label>
                {renderBackdateReason()}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Photo *</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCameraModal(true)}
                    className="px-4 py-2 bg-coin-600 hover:bg-coin-700 text-white rounded-lg"
                  >
                    <IconMapper name="Camera" size={18} className="inline mr-2" />
                    Camera
                  </button>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                    className="flex-1 text-sm text-gray-600 dark:text-gray-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-coin-500"
                  placeholder="Optional notes..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={submitCheckIn}
                  disabled={!selectedSite || submitting || (backdate && backdateReason.length < 10)}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg font-medium"
                >
                  {submitting ? 'Processing...' : 'Confirm Check In'}
                </button>
                <button
                  onClick={() => setAction(null)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </Modal>

        {/* Single Check Out Modal */}
        <Modal show={action === 'checkout'} onClose={() => setAction(null)} maxWidth="md">
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <IconMapper name="LogOut" size={20} className="text-red-600" />
              Check Out: {selectedGuard?.name}
            </h3>
            <div className="space-y-4">
              <div className="bg-coin-50 dark:bg-coin-900/20 border border-coin-200 dark:border-coin-900/30 p-4 rounded-lg">
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  <span className="font-medium">Checked in:</span> {selectedGuard?.attendance?.check_in_time}
                </p>
                {selectedGuard?.attendance?.site && (
                  <p className="text-sm text-gray-700 dark:text-gray-200 mt-1">
                    <span className="font-medium">Site:</span> {selectedGuard.attendance.site}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Time *</label>
                <input
                  type="time"
                  value={checkOutTimeInput}
                  onChange={(e) => setCheckOutTimeInput(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-coin-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Photo *</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCameraModal(true)}
                    className="px-4 py-2 bg-coin-600 hover:bg-coin-700 text-white rounded-lg"
                  >
                    <IconMapper name="Camera" size={18} className="inline mr-2" />
                    Camera
                  </button>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                    className="flex-1 text-sm text-gray-600 dark:text-gray-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-coin-500"
                  placeholder="End of shift notes..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={submitCheckOut}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white rounded-lg font-medium"
                >
                  {submitting ? 'Processing...' : 'Confirm Check Out'}
                </button>
                <button
                  onClick={() => setAction(null)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </Modal>

        {/* Scanner & Camera */}
        <ScannerModal open={showScannerModal} onClose={() => setShowScannerModal(false)} activeScan={activeScan} />
        {showCameraModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Capture Photo</h3>
                <button onClick={() => setShowCameraModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400">
                  <IconMapper name="X" size={20} />
                </button>
              </div>
              <CameraCapture
                onCapture={(file) => {
                  setPhotoFile(file);
                  setShowCameraModal(false);
                }}
              />
            </div>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
