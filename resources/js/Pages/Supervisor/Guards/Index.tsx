import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/SupervisorLayout';
import IconMapper from '@/Components/IconMapper';
import CameraCapture from '@/Components/CameraCapture';
import ScannerModal from '@/Components/Scanner/ScannerModal';
import Modal from '@/Components/Modal';

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
}

export default function GuardsIndex({ guards = [], sites = [], activeScan = null }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'on_duty' | 'off_duty'>('all');
  const [filterGuardType, setFilterGuardType] = useState<'all' | 'permanent' | 'reliever' | 'standby'>('all');
  const [sortField, setSortField] = useState<'name' | 'employee_id' | 'status'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedGuard, setSelectedGuard] = useState<Guard | null>(null);
  const [selectedSite, setSelectedSite] = useState<number | null>(null);
  const [action, setAction] = useState<'checkin' | 'checkout' | null>(null);
  const [notes, setNotes] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [checkInTimeInput, setCheckInTimeInput] = useState(new Date().toTimeString().slice(0, 5));
  const [checkOutTimeInput, setCheckOutTimeInput] = useState(new Date().toTimeString().slice(0, 5));
  const [submitting, setSubmitting] = useState(false);
  const [backdate, setBackdate] = useState(false);
  const [backdateReason, setBackdateReason] = useState('');

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

  const getGuardTypeBadge = (type?: string) => {
    if (!type || type === 'permanent') return null;
    const styles = {
      reliever: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
      standby: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
    };
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded ${styles[type as keyof typeof styles]}`}>
        {type === 'reliever' ? 'Reliever' : 'Standby'}
      </span>
    );
  };

  return (
    <DashboardLayout title="Guards">
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
                  <p className="text-sm text-gray-500 dark:text-gray-400">{filteredGuards.length} of {guards.length} guards</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {activeScan ? (
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-lg">
                    <IconMapper name="MapPin" size={16} />
                    <span className="text-sm font-medium">{activeScan.site_name}</span>
                    <button
                      onClick={() => setShowScannerModal(true)}
                      className="text-xs underline ml-2"
                    >
                      Change
                    </button>
                  </div>
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

          {/* Filters */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-4 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <IconMapper name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search guards by name or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-coin-500"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as 'all' | 'on_duty' | 'off_duty')}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-coin-500"
                >
                  <option value="all">All Status</option>
                  <option value="on_duty">On Duty</option>
                  <option value="off_duty">Off Duty</option>
                </select>
                <select
                  value={filterGuardType}
                  onChange={(e) => setFilterGuardType(e.target.value as 'all' | 'permanent' | 'reliever' | 'standby')}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-coin-500"
                >
                  <option value="all">All Types</option>
                  <option value="permanent">Permanent</option>
                  <option value="reliever">Reliever</option>
                  <option value="standby">Standby</option>
                </select>
                <button
                  onClick={() => {
                    setSortField('name');
                    setSortDirection(current => current === 'asc' ? 'desc' : 'asc');
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition ${sortField === 'name' ? 'bg-coin-100 text-coin-700 dark:bg-coin-900/30 dark:text-coin-200' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100'}`}
                >
                  Name {sortField === 'name' && (sortDirection === 'asc' ? <IconMapper name="ArrowUp" size={14} className="inline" /> : <IconMapper name="ArrowDown" size={14} className="inline" />)}
                </button>
                <button
                  onClick={() => {
                    setSortField('employee_id');
                    setSortDirection(current => current === 'asc' ? 'desc' : 'asc');
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition ${sortField === 'employee_id' ? 'bg-coin-100 text-coin-700 dark:bg-coin-900/30 dark:text-coin-200' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100'}`}
                >
                  ID {sortField === 'employee_id' && (sortDirection === 'asc' ? <IconMapper name="ArrowUp" size={14} className="inline" /> : <IconMapper name="ArrowDown" size={14} className="inline" />)}
                </button>
              </div>
            </div>
          </div>

          {/* Guards List */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {filteredGuards.length === 0 ? (
                <div className="p-12 text-center">
                  <IconMapper name="Users" size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                  <p className="text-gray-500 dark:text-gray-400">No guards found matching your filters</p>
                </div>
              ) : (
                filteredGuards.map((guard) => (
                  <div key={guard.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-coin-500 to-coin-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {guard.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-gray-900 dark:text-gray-100">{guard.name}</h4>
                            {getGuardTypeBadge(guard.guard_type)}
                            {guard.is_on_duty && (
                              <span className="px-3 py-1 text-xs font-bold bg-green-500 text-white rounded-full">
                                On Duty
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{guard.employee_id} • {guard.phone}</p>
                        </div>
                      </div>

                      {/* Attendance Info */}
                      <div className="flex-1 min-w-0">
                        {guard.attendance ? (
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-2">
                              <IconMapper name="Clock" size={14} />
                              <span>In: {guard.attendance.check_in_time}</span>
                              {guard.attendance.site && (
                                <span className="text-coin-600 dark:text-coin-400">@ {guard.attendance.site}</span>
                              )}
                            </div>
                            {guard.attendance.check_out_time && (
                              <div className="flex items-center gap-2 mt-1">
                                <IconMapper name="CheckCircle" size={14} />
                                <span>Out: {guard.attendance.check_out_time}</span>
                                <span className="text-purple-600">({guard.attendance.hours_worked ?? 0}h)</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400 dark:text-gray-500">No attendance today</span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Link
                          href={route('supervisor.guards.show', guard.id)}
                          className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                          title="View Details"
                        >
                          <IconMapper name="Eye" size={18} />
                        </Link>
                        {!guard.attendance ? (
                          <button
                            onClick={() => handleCheckIn(guard)}
                            disabled={!activeScan}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-lg font-medium transition"
                          >
                            Check In
                          </button>
                        ) : !guard.attendance.check_out_time ? (
                          <button
                            onClick={() => handleCheckOut(guard)}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition"
                          >
                            Check Out
                          </button>
                        ) : (
                          <span className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-lg font-medium flex items-center gap-2">
                            <IconMapper name="CheckCircle" size={16} className="text-green-500" />
                            Done
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Check In Modal */}
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
                {backdate && (
                  <input
                    value={backdateReason}
                    onChange={(e) => setBackdateReason(e.target.value)}
                    placeholder="Reason for backdate..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                )}
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
                  disabled={!selectedSite || submitting}
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

        {/* Check Out Modal */}
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
    </DashboardLayout>
  );
}
