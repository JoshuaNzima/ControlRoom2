import React, { useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import ZoneCommanderLayout from '@/Layouts/ZoneCommanderLayout';
import Modal from '@/Components/Modal';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Input } from '@/Components/ui/input';

type Site = {
  id: number;
  name: string;
  client_name: string;
  full_name: string;
};

type GuardAttendance = {
  id: number;
  client_site_id: number | null;
  status: string;
  check_in_time: string | null;
  check_out_time: string | null;
  check_in_photo_url: string | null;
  check_out_photo_url: string | null;
};

type GuardRow = {
  id: number;
  name: string;
  employee_id: string;
  phone: string;
  default_site_id: number | null;
  attendance: GuardAttendance | null;
};

export default function Attendance({ sites = [], guards = [] }: { sites: Site[]; guards: GuardRow[] }) {
  const [search, setSearch] = useState('');
  const [action, setAction] = useState<'checkin' | 'checkout' | null>(null);
  const [selectedGuard, setSelectedGuard] = useState<GuardRow | null>(null);
  const [selectedSiteId, setSelectedSiteId] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [time, setTime] = useState<string>('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const filteredGuards = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return guards;
    return guards.filter((g) => {
      return (
        String(g.name || '').toLowerCase().includes(term) ||
        String(g.employee_id || '').toLowerCase().includes(term) ||
        String(g.phone || '').toLowerCase().includes(term)
      );
    });
  }, [guards, search]);

  const stats = useMemo(() => {
    const total = guards.length;
    const checkedIn = guards.filter((g) => !!g.attendance?.check_in_time).length;
    const checkedOut = guards.filter((g) => !!g.attendance?.check_out_time).length;
    const pending = Math.max(0, total - checkedIn);
    return { total, checkedIn, checkedOut, pending };
  }, [guards]);

  const openCheckIn = (g: GuardRow) => {
    setSelectedGuard(g);
    setAction('checkin');
    setNotes('');
    setTime(new Date().toTimeString().slice(0, 5));
    setPhotoFile(null);
    setSelectedSiteId(g.default_site_id ?? '');
  };

  const openCheckOut = (g: GuardRow) => {
    setSelectedGuard(g);
    setAction('checkout');
    setNotes('');
    setTime(new Date().toTimeString().slice(0, 5));
    setPhotoFile(null);
    const siteId = g.attendance?.client_site_id ?? g.default_site_id ?? '';
    setSelectedSiteId(siteId || '');
  };

  const closeModal = () => {
    setAction(null);
    setSelectedGuard(null);
    setSelectedSiteId('');
    setNotes('');
    setTime('');
    setPhotoFile(null);
    setSubmitting(false);
  };

  const submit = () => {
    if (!selectedGuard || !action) return;
    if (!selectedSiteId) return;
    if (!photoFile) return;

    const fd = new FormData();
    fd.append('guard_id', String(selectedGuard.id));
    fd.append('client_site_id', String(selectedSiteId));
    if (notes) fd.append('notes', notes);
    if (time) fd.append('time', time);
    fd.append('photo', photoFile);

    setSubmitting(true);
    router.post(
      action === 'checkin' ? route('zone.attendance.check-in') : route('zone.attendance.check-out'),
      fd,
      {
        forceFormData: true,
        preserveScroll: true,
        onFinish: () => setSubmitting(false),
        onSuccess: () => closeModal(),
      }
    );
  };

  const getAttendanceBadge = (g: GuardRow) => {
    if (!g.attendance?.check_in_time) return <Badge variant="outline">Not Checked In</Badge>;
    if (g.attendance?.check_in_time && !g.attendance?.check_out_time) return <Badge variant="success">On Duty</Badge>;
    return <Badge variant="secondary">Completed</Badge>;
  };

  return (
    <ZoneCommanderLayout title="Attendance">
      <Head title="Zone Attendance" />

      <div className="w-full min-h-screen p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
        <div className="rounded-2xl border border-red-200/40 dark:border-gray-800 bg-gradient-to-r from-red-700 via-rose-700 to-pink-700 text-white p-5 sm:p-6 shadow-sm shadow-black/10">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold">Zone Attendance</h2>
            <p className="text-sm text-white/80">Check-in / check-out requires photo evidence.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="text-xs text-gray-600 dark:text-gray-300">Total Guards</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-xs text-gray-600 dark:text-gray-300">Checked In</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.checkedIn}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-xs text-gray-600 dark:text-gray-300">Checked Out</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.checkedOut}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-xs text-gray-600 dark:text-gray-300">Pending</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.pending}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Today</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search guard by name, ID, or phone…"
            />

            <div className="space-y-3">
              {filteredGuards.length === 0 ? (
                <div className="text-sm text-gray-600 dark:text-gray-300">No guards found.</div>
              ) : (
                filteredGuards.map((g) => (
                  <Card key={g.id} className="border-gray-200 dark:border-gray-800">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-rose-700 text-white flex items-center justify-center font-bold">
                              {String(g.name || '?').charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-gray-900 dark:text-gray-100 truncate">{g.name}</div>
                              <div className="text-xs text-gray-600 dark:text-gray-300 truncate">{g.employee_id} • {g.phone}</div>
                            </div>
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            {getAttendanceBadge(g)}
                            {g.attendance?.check_in_time && (
                              <span className="text-xs text-gray-600 dark:text-gray-300">
                                In: <span className="font-medium">{g.attendance.check_in_time}</span>
                              </span>
                            )}
                            {g.attendance?.check_out_time && (
                              <span className="text-xs text-gray-600 dark:text-gray-300">
                                Out: <span className="font-medium">{g.attendance.check_out_time}</span>
                              </span>
                            )}
                          </div>

                          {(g.attendance?.check_in_photo_url || g.attendance?.check_out_photo_url) && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {g.attendance?.check_in_photo_url && (
                                <a
                                  href={g.attendance.check_in_photo_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs text-coin-700 hover:text-coin-800 dark:text-coin-300 dark:hover:text-coin-200"
                                >
                                  View check-in photo
                                </a>
                              )}
                              {g.attendance?.check_out_photo_url && (
                                <a
                                  href={g.attendance.check_out_photo_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs text-coin-700 hover:text-coin-800 dark:text-coin-300 dark:hover:text-coin-200"
                                >
                                  View check-out photo
                                </a>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                          {!g.attendance?.check_in_time ? (
                            <Button onClick={() => openCheckIn(g)} className="w-full sm:w-auto">
                              Check In
                            </Button>
                          ) : !g.attendance?.check_out_time ? (
                            <Button onClick={() => openCheckOut(g)} variant="destructive" className="w-full sm:w-auto">
                              Check Out
                            </Button>
                          ) : (
                            <Button variant="secondary" disabled className="w-full sm:w-auto">
                              Completed
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Modal show={!!action && !!selectedGuard} onClose={closeModal} maxWidth="lg">
        <div className="p-4 sm:p-6 space-y-4 bg-white dark:bg-gray-950">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {action === 'checkin' ? 'Check In' : 'Check Out'}{selectedGuard ? `: ${selectedGuard.name}` : ''}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Photo evidence is required.
              </p>
            </div>
            <button
              type="button"
              onClick={closeModal}
              className="px-3 py-2 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-700 dark:text-gray-200"
            >
              Close
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Site</label>
            <select
              value={selectedSiteId}
              onChange={(e) => setSelectedSiteId(e.target.value ? Number(e.target.value) : '')}
              disabled={action === 'checkout'}
              className="w-full rounded-md border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 px-3 py-2"
            >
              <option value="">Select site…</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name}
                </option>
              ))}
            </select>
            {action === 'checkout' && (
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">Site is locked to the check-in record.</div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Time (optional)</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Notes (optional)</label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Context (optional)"
                className="w-full rounded-md border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Photo evidence *</label>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-gray-700 dark:text-gray-200 file:mr-4 file:py-2 file:px-3 file:rounded-md file:border-0 file:bg-gray-100 file:text-gray-900 dark:file:bg-gray-900 dark:file:text-gray-100"
            />
            {!photoFile && (
              <div className="mt-1 text-xs text-red-600 dark:text-red-300">Photo is required.</div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={closeModal} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={submit}
              disabled={submitting || !selectedGuard || !selectedSiteId || !photoFile}
              variant={action === 'checkout' ? 'destructive' : 'default'}
            >
              {submitting ? (action === 'checkout' ? 'Checking out…' : 'Checking in…') : (action === 'checkout' ? 'Check Out' : 'Check In')}
            </Button>
          </div>
        </div>
      </Modal>
    </ZoneCommanderLayout>
  );
}


