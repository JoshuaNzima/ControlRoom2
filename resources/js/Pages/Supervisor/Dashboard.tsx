import React, { useState, useEffect,  } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import DatePicker from '@/Components/DatePicker';
import IconMapper from '@/Components/IconMapper';
import DashboardLayout from '@/Layouts/SupervisorLayout';
import CameraCapture from '@/Components/CameraCapture';
import ScannerModal from '@/Components/Scanner/ScannerModal';
import QuickRequisitionModal from '@/Components/Requisitions/QuickRequisitionModal';

interface GuardAttendance {
  id: number;
  check_in_time: string;
  check_out_time?: string | null;
  status: string;
  site?: string | null;
  hours_worked?: number | null;
}

interface Guard {
  id: number;
  employee_id: string;
  name: string;
  phone: string;
  status: string;
  is_on_duty: boolean;
  attendance?: GuardAttendance | null;
}

interface Site {
  id: number;
  name: string;
  client_name: string;
  full_name: string;
}

//

type Props = {
  guards?: Guard[];
  sites?: Site[];
  currentDate?: string;
  currentTime?: string;

  activeScan?: {
    scan_id: number;
    site_id: number;
    site_name: string;
    client_name: string;
    scanned_at: string;
    expires_at: string;
  } | null;
};

export default function Dashboard({
  guards = [],
  sites = [],
  currentDate = new Date().toLocaleDateString(),
  currentTime = new Date().toLocaleTimeString('en-US', { hour12: false }),
}: Props) {
  // typed state
  const [selectedGuard, setSelectedGuard] = useState<Guard | null>(null);
  const [selectedSite, setSelectedSite] = useState<number | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [action, setAction] = useState<'checkin' | 'checkout' | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showQuickAttendance, setShowQuickAttendance] = useState<boolean>(false);
  const [time, setTime] = useState<string>(currentTime);
  const [date, setDate] = useState<Date>(new Date());
  const [showScannerModal, setShowScannerModal] = useState<boolean>(false);
  const [showCameraModal, setShowCameraModal] = useState<boolean>(false);
  const [sortField, setSortField] = useState<'name' | 'employee_id' | 'status'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterStatus, setFilterStatus] = useState<'all' | 'on_duty' | 'off_duty'>('all');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [checkInTimeInput, setCheckInTimeInput] = useState<string>(new Date().toTimeString().slice(0, 5));
  const [checkOutTimeInput, setCheckOutTimeInput] = useState<string>(new Date().toTimeString().slice(0, 5));
  const [backdate, setBackdate] = useState<boolean>(false);
  const [backdateReason, setBackdateReason] = useState<string>('');
  

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(
        new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      );
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Filter and sort guards
  const filteredGuards = (guards || [])
    .filter((guard) => {
      const term = searchTerm.trim().toLowerCase();
      const matchesSearch = !term || guard.name.toLowerCase().includes(term) || 
        (guard.employee_id && guard.employee_id.toLowerCase().includes(term));
      
      const matchesStatus = filterStatus === 'all' ? true :
        filterStatus === 'on_duty' ? guard.is_on_duty :
        !guard.is_on_duty;
      
      return matchesSearch && matchesStatus;
    });
  
  const sortedGuards = sortGuards(filteredGuards, sortField, sortDirection);

  const { activeScan } = usePage().props as {
  activeScan?: {
    scan_id: number;
    site_id: number;
    site_name: string;
    client_name: string;
    scanned_at: string;
    expires_at: string;
  } | null;
};

  const handleDateChange = (d: Date | null) => {
    if (!d) return;
    setDate(d);
    router.get(route('supervisor.dashboard'), { date: d.toISOString().slice(0, 10) }, { preserveScroll: true });
  };

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
      if (backdateReason) {
        formData.append('backdate_reason', backdateReason);
      }
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

  

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Head title="Dashboard" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Header Section with Date & Time */}
          <div className="bg-gradient-to-r from-coin-600 via-coin-500 to-coin-400 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold mb-1">Supervisor Dashboard</h1>
                <p className="text-white/80">{currentDate}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm opacity-90">Current Time</p>
                  <h2 className="text-4xl font-bold font-mono">{time}</h2>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                  <DatePicker
                    selected={date}
                    onChange={handleDateChange}
                    dateFormat="yyyy-MM-dd"
                    className="bg-transparent text-white font-semibold border-none focus:outline-none cursor-pointer"
                    maxDate={new Date()}
                  />
                </div>
              </div>
            </div>
          </div>
{/* Scanner Button */}
  <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm shadow-black/5 dark:shadow-none overflow-hidden">
  {activeScan ? (
    <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6">
      <div className="flex items-center justify-between text-white">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium opacity-90">Site Locked</p>
            <p className="text-xl font-bold">{activeScan.client_name}</p>
            <p className="text-sm opacity-80">{activeScan.site_name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowScannerModal(true)}
            className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-lg font-semibold transition"
          >
            View Details
          </button>
          <button
            onClick={() => router.post(route('supervisor.checkpoint.clear'))}
            className="px-6 py-3 bg-white text-green-600 hover:bg-gray-100 rounded-lg font-semibold transition"
          >
            Clear Lock
          </button>
        </div>
      </div>
    </div>
  ) : (
            <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Site Verification Required</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">Scan checkpoint before taking attendance</p>
        </div>
        <div className="w-16 h-16 bg-coin-100 dark:bg-coin-900/20 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-coin-700 dark:text-coin-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
        </div>
      </div>
      <button
        onClick={() => setShowScannerModal(true)}
        className="block w-full py-4 bg-coin-600 hover:bg-coin-700 text-white text-center rounded-lg font-bold shadow-md transition-all transform hover:scale-[1.02]"
      >
        Scan Site Checkpoint
      </button>
    </div>
  )}
  </div>

          <QuickRequisitionModal />

          {/* Quick Attendance toggle */}
          <div className="flex items-center justify-end mb-4">
            <div className="flex flex-col md:flex-row gap-3">
              <button
                onClick={() => setShowQuickAttendance(!showQuickAttendance)}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-coin-600 hover:bg-coin-700 text-white rounded-lg font-medium shadow-md transition-all w-full md:w-auto"
              >
                {showQuickAttendance ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    Hide Guards
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Quick Attendance
                  </>
                )}
              </button>
              {showQuickAttendance && (
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => {
                      // Add "select all" functionality here
                    }}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100"
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => {
                      // Add "export" functionality here
                    }}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100"
                  >
                    Export
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Attendance Section */}
          {showQuickAttendance && (
            <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm shadow-black/5 dark:shadow-none overflow-hidden animate-slideDown">
              <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 border-b border-gray-200 dark:border-gray-800">
                <div className="flex flex-col space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Quick Attendance ({sortedGuards.length} Guards)</h3>
                  <div className="flex flex-col md:flex-row gap-3">
                    <input
                      type="text"
                      placeholder="Search guards by name or ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-coin-500 focus:border-transparent w-full md:w-80"
                    />
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as 'all' | 'on_duty' | 'off_duty')}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-coin-500"
                    >
                      <option value="all">All Guards</option>
                      <option value="on_duty">On Duty</option>
                      <option value="off_duty">Off Duty</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-sm">
                  <button
                    onClick={() => {
                      setSortField('name');
                      setSortDirection(current => current === 'asc' ? 'desc' : 'asc');
                    }}
                    className={`px-3 py-1.5 rounded ${sortField === 'name' ? 'bg-coin-100 text-coin-700 dark:bg-coin-900/30 dark:text-coin-200' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                  >
                    Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </button>
                  <button
                    onClick={() => {
                      setSortField('employee_id');
                      setSortDirection(current => current === 'asc' ? 'desc' : 'asc');
                    }}
                    className={`px-3 py-1.5 rounded ${sortField === 'employee_id' ? 'bg-coin-100 text-coin-700 dark:bg-coin-900/30 dark:text-coin-200' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                  >
                    ID {sortField === 'employee_id' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </button>
                  <button
                    onClick={() => {
                      setSortField('status');
                      setSortDirection(current => current === 'asc' ? 'desc' : 'asc');
                    }}
                    className={`px-3 py-1.5 rounded ${sortField === 'status' ? 'bg-coin-100 text-coin-700 dark:bg-coin-900/30 dark:text-coin-200' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                  >
                    Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </button>
                </div>
                </div>
              </div>

              <div className="divide-y max-h-[calc(100vh-20rem)] overflow-y-auto">
                {sortedGuards.map((guard) => (
                  <div key={guard.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-col md:flex-row md:items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center text-white font-bold">
                            {guard.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-gray-900 dark:text-gray-100">{guard.name}</h4>
                              {guard.is_on_duty && (
                                <span className="px-3 py-1 text-xs font-bold bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-full shadow-sm">
                                  On Duty
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{guard.employee_id} • {guard.phone}</p>
                          </div>
                        </div>

                        {guard.attendance && (
                          <div className="mt-3 ml-3 space-y-1">
                            <p className="text-sm text-gray-700 dark:text-gray-200">
                              <span className="font-semibold">Check In:</span> {guard.attendance.check_in_time}
                              {guard.attendance.site && (
                                <span className="text-coin-700 dark:text-coin-300 ml-2">@ {guard.attendance.site}</span>
                              )}
                            </p>
                            {guard.attendance.check_out_time && (
                              <p className="text-sm text-gray-700 dark:text-gray-200">
                                <span className="font-semibold">Check Out:</span> {guard.attendance.check_out_time}
                                <span className="text-purple-600 ml-2">({guard.attendance.hours_worked ?? 0}h worked)</span>
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col md:flex-row items-center gap-2">
                        <button onClick={() => setShowScannerModal(true)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold transition w-full md:w-auto text-center dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100">View Details</button>
                        {!guard.attendance ? (
                          <button
                            onClick={() => handleCheckIn(guard)}
                            className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg font-bold shadow-md transition-all transform hover:scale-105"
                          >
                            Check In
                          </button>
                        ) : !guard.attendance.check_out_time ? (
                          <button
                            onClick={() => handleCheckOut(guard)}
                            className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-lg font-bold shadow-md transition-all transform hover:scale-105"
                          >
                            Check Out
                          </button>
                        ) : (
                          <span className="px-6 py-3 bg-gray-100 text-gray-500 rounded-lg font-bold inline-block dark:bg-gray-800 dark:text-gray-200">
                            Completed ✓
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          
        </div>

        {/* Modals */}
        {action === 'checkin' && selectedGuard && (
          <Modal title={`Check In: ${selectedGuard.name}`} onClose={() => setAction(null)}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Site *</label>
                <select
                  value={selectedSite ?? ''}
                  onChange={(e) => setSelectedSite(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-coin-500"
                  required
                  disabled={!!activeScan}
                >
                  <option value="">Choose a site...</option>
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.full_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Time *</label>
                <input
                  type="time"
                  value={checkInTimeInput}
                  onChange={(e) => setCheckInTimeInput(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-coin-500"
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
                  <span>Mark for yesterday (backdate up to 1 day)</span>
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Use this if you reached the site after midnight but are confirming the previous day's shift. Backdating is only allowed for yesterday and within the configured cutoff time.
                </p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Backdate Reason (optional)</label>
                  <input
                    value={backdateReason}
                    onChange={(e) => setBackdateReason(e.target.value)}
                    disabled={!backdate}
                    placeholder="e.g. Arrived after 00:30, network outage, etc."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 disabled:opacity-60 focus:ring-2 focus:ring-coin-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Photo *</label>
                <div className="space-y-2">
                  <div>
                    <button type="button" onClick={() => setShowCameraModal(true)} className="px-4 py-2 bg-coin-600 hover:bg-coin-700 text-white rounded mr-2">Open Camera</button>
                    <span className="text-sm text-gray-500 dark:text-gray-400">or upload a photo</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                    className="w-full"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-coin-500"
                  placeholder="Any special instructions..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={submitCheckIn}
                  disabled={!selectedSite || submitting}
                  className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg font-bold transition"
                >
                  {submitting ? 'Processing…' : 'Confirm Check In'}
                </button>
                <button onClick={() => setAction(null)} className="px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-bold transition dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100">
                  Cancel
                </button>
              </div>
            </div>
          </Modal>
        )}

        {action === 'checkout' && selectedGuard && (
          <Modal title={`Check Out: ${selectedGuard.name}`} onClose={() => setAction(null)}>
            <div className="space-y-4">
              <div className="bg-coin-50 dark:bg-coin-900/20 border border-coin-100 dark:border-coin-900/30 p-4 rounded-lg">
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  <span className="font-semibold">Checked in at:</span> {selectedGuard.attendance?.check_in_time}
                </p>
                {selectedGuard.attendance?.site && (
                  <p className="text-sm text-gray-700 dark:text-gray-200 mt-1">
                    <span className="font-semibold">Site:</span> {selectedGuard.attendance.site}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Time *</label>
                <input
                  type="time"
                  value={checkOutTimeInput}
                  onChange={(e) => setCheckOutTimeInput(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-coin-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Photo *</label>
                <div className="space-y-2">
                  <div>
                    <button type="button" onClick={() => setShowCameraModal(true)} className="px-4 py-2 bg-coin-600 hover:bg-coin-700 text-white rounded mr-2">Open Camera</button>
                    <span className="text-sm text-gray-500 dark:text-gray-400">or upload a photo</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                    className="w-full"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-coin-500"
                  placeholder="End of shift notes..."
                />
              </div>
              <div className="flex gap-3">
                <button onClick={submitCheckOut} disabled={submitting} className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white rounded-lg font-bold transition">
                  {submitting ? 'Processing…' : 'Confirm Check Out'}
                </button>
                <button onClick={() => setAction(null)} className="px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-bold transition dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100">
                  Cancel
                </button>
              </div>
            </div>
          </Modal>
        )}
        {/* Scanner & Camera overlays */}
        <ScannerModal open={showScannerModal} onClose={() => setShowScannerModal(false)} activeScan={activeScan || null} />
        <CameraModal
          open={showCameraModal}
          onClose={() => setShowCameraModal(false)}
          onCaptured={(file) => setPhotoFile(file)}
        />
      </div>
    </DashboardLayout>
  );
}

/* -------------------------
   Reusable subcomponents
   ------------------------- */

interface Stat {
  label: string;
  count: number;
  description: string;
  color: string;
  badge: string;
  icon: React.ReactNode | null;
}

interface QuickNavItem {
  name: string;
  description: string;
  route: string;
  icon: React.ReactNode | null;
  color: string;
}

function StatCard({ label = '', count = 0, description = '', color = 'gray', badge = '', icon = null }: Stat) {
  const colorClasses: Record<string, string> = {
    green: 'border-green-500 bg-gradient-to-br from-green-50 to-green-100 dark:border-green-900/40 dark:from-green-900/20 dark:to-green-900/10',
    blue: 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 dark:border-blue-900/40 dark:from-blue-900/20 dark:to-blue-900/10',
    yellow: 'border-yellow-500 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:border-yellow-900/40 dark:from-yellow-900/20 dark:to-yellow-900/10',
    gray: 'border-gray-500 bg-gradient-to-br from-gray-50 to-gray-100 dark:border-gray-800 dark:from-gray-900 dark:to-gray-800',
    orange: 'border-orange-500 bg-gradient-to-br from-orange-50 to-orange-100 dark:border-orange-900/40 dark:from-orange-900/20 dark:to-orange-900/10',
    red: 'border-red-500 bg-gradient-to-br from-red-50 to-red-100 dark:border-red-900/40 dark:from-red-900/20 dark:to-red-900/10',
  };

  const badgeClasses: Record<string, string> = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-500',
    gray: 'bg-gray-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
  };

  return (
    <div className={`rounded-xl p-4 border-t-4 ${colorClasses[color]} shadow-md hover:shadow-xl transition-all transform hover:-translate-y-1`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-3xl">{icon}</span>
        <span className={`px-2 py-1 text-xs font-bold text-white rounded-full ${badgeClasses[color]}`}>{badge}</span>
      </div>
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">{label}</p>
      <p className="text-3xl font-black text-gray-900 dark:text-gray-100 mb-1">{count}</p>
      <p className="text-xs text-gray-600 dark:text-gray-300">{description}</p>
    </div>
  );
}

// Component helper utilities
function sortGuards(guards: Guard[], field: string, direction: 'asc' | 'desc') {
  return [...guards].sort((a, b) => {
    let valueA = a[field as keyof Guard];
    let valueB = b[field as keyof Guard];
    
    // Handle null or undefined values
    if (!valueA) return direction === 'asc' ? -1 : 1;
    if (!valueB) return direction === 'asc' ? 1 : -1;

    // Convert to string for comparison
    valueA = String(valueA).toLowerCase();
    valueB = String(valueB).toLowerCase();

    if (valueA < valueB) return direction === 'asc' ? -1 : 1;
    if (valueA > valueB) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

function CameraModal({ open, onClose, onCaptured }: { open: boolean; onClose: () => void; onCaptured: (f: File) => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg p-6 max-w-md w-full text-gray-900 dark:text-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Camera</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">Close</button>
        </div>
        <CameraCapture
          onCapture={(file) => {
            onCaptured(file);
            onClose();
          }}
        />
      </div>
    </div>
  );
}

function AttendanceCard({ icon, label, value, color }: { icon?: React.ReactNode; label: string; value: number; color: string }) {
  const bgClasses: Record<string, string> = {
    green: 'bg-gradient-to-br from-green-50 to-green-100 border-green-200 dark:from-green-900/20 dark:to-green-900/10 dark:border-green-900/30',
    blue: 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 dark:from-blue-900/20 dark:to-blue-900/10 dark:border-blue-900/30',
    purple: 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 dark:from-purple-900/20 dark:to-purple-900/10 dark:border-purple-900/30',
    red: 'bg-gradient-to-br from-red-50 to-red-100 border-red-200 dark:from-red-900/20 dark:to-red-900/10 dark:border-red-900/30',
  };

  return (
    <div className={`${bgClasses[color] ?? bgClasses.gray} rounded-xl p-5 border-2 shadow-md hover:shadow-lg transition-all`}>
      <div className="flex items-center gap-3">
        <div className="text-3xl">{icon}</div>
        <div>
          <p className="text-3xl font-black text-gray-900 dark:text-gray-100">{value}</p>
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">{label}</p>
        </div>
      </div>
    </div>
  );
}

function QuickNavCard({ name = '', description = '', route = '#', icon = null, color = '#eee' }: QuickNavItem) {
  return (
    <Link
      href={route}
      className="group bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm shadow-black/5 dark:shadow-none hover:shadow-md transition-all duration-300 transform hover:-translate-y-1"
    >
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto text-3xl shadow-md" style={{ backgroundColor: `${color}20` }}>
        {icon}
      </div>
      <h3 className="text-base font-bold text-coin-700 dark:text-coin-300 group-hover:text-coin-600 text-center mb-2">{name}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-300 text-center">{description}</p>
    </Link>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-slideUp text-gray-900 dark:text-gray-100">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-900 rounded-t-2xl">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200 transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
