import React, { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import TrainingLayout from '@/Layouts/TrainingLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import IconMapper from '@/Components/IconMapper';
import EmptyState from '@/Components/ui/empty-state';
import ScannerModal from '@/Components/Scanner/ScannerModal';

type Stats = {
  total: number;
  in_training: number;
  pending_review: number;
  approved: number;
  rejected: number;
  rapid_response: number;
};

type MyPrimaryTrainee = {
  id: number;
  name: string;
  status: string;
  training_track: 'standard' | 'rapid_response';
  training_days: number;
  training_start_date?: string | null;
  training_end_date?: string | null;
};

type PageProps = {
  auth: { user: any };
  stats: Stats;
  myPrimaryTrainees: MyPrimaryTrainee[];
};

function badgeForTrack(track: string) {
  if (track === 'rapid_response') {
    return 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200';
  }
  return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
}

function badgeForStatus(status: string) {
  switch (status) {
    case 'approved':
      return 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200';
    case 'rejected':
      return 'bg-rose-100 text-rose-900 dark:bg-rose-900/30 dark:text-rose-200';
    case 'pending_review':
      return 'bg-indigo-100 text-indigo-900 dark:bg-indigo-900/30 dark:text-indigo-200';
    case 'in_training':
      return 'bg-sky-100 text-sky-900 dark:bg-sky-900/30 dark:text-sky-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  }
}

export default function TrainingDashboard() {
  const { auth, stats, myPrimaryTrainees } = usePage<PageProps>().props;
  const [scannerOpen, setScannerOpen] = useState(false);

  const statCards = [
    { label: 'Total', value: stats?.total ?? 0, icon: 'Users' },
    { label: 'In Training', value: stats?.in_training ?? 0, icon: 'Activity' },
    { label: 'Pending Review', value: stats?.pending_review ?? 0, icon: 'ClipboardCheck' },
    { label: 'Approved', value: stats?.approved ?? 0, icon: 'CheckCircle' },
    { label: 'Rejected', value: stats?.rejected ?? 0, icon: 'XCircle' },
    { label: 'Rapid Response', value: stats?.rapid_response ?? 0, icon: 'Zap' },
  ];

  return (
    <TrainingLayout title="Training Dashboard" user={auth?.user as any}>
      <Head title="Training Dashboard" />

      <ScannerModal open={scannerOpen} onClose={() => setScannerOpen(false)} />

      <div className="space-y-6">
        {/* Header with Scan Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Training Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage trainees and track progress</p>
          </div>
          <Button
            variant="outline"
            onClick={() => setScannerOpen(true)}
            className="gap-2 w-full sm:w-auto"
          >
            <IconMapper name="ScanLine" size={18} />
            Scan QR
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {statCards.map((c) => (
            <Card key={c.label} className="p-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs text-gray-600 dark:text-gray-300 truncate">{c.label}</div>
                    <div className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">{c.value}</div>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-coin-50 text-coin-700 dark:bg-gray-800 dark:text-coin-200 flex items-center justify-center shrink-0">
                    <IconMapper name={c.icon} size={20} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>My Primary Trainees</CardTitle>
            </CardHeader>
            <CardContent>
              {(myPrimaryTrainees || []).length === 0 ? (
                <EmptyState
                  title="No trainees assigned"
                  description="Trainees where you are the primary trainer will appear here."
                  size="sm"
                  variant="inline"
                  action={
                    <Link
                      href={route('training.trainees.index')}
                      className="inline-flex items-center gap-2 rounded-lg bg-coin-700 px-4 py-2 text-sm font-medium text-white hover:bg-coin-600"
                    >
                      <IconMapper name="Users" size={18} />
                      View Trainees
                    </Link>
                  }
                />
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {(myPrimaryTrainees || []).map((t) => (
                    <div key={t.id} className="py-3 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{t.name}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${badgeForStatus(t.status)}`}>{String(t.status).replaceAll('_', ' ')}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${badgeForTrack(t.training_track)}`}>{t.training_track === 'rapid_response' ? 'rapid response' : 'standard'}</span>
                          <span className="text-xs text-gray-600 dark:text-gray-300">{t.training_days} days</span>
                        </div>
                      </div>
                      <Link
                        href={route('training.trainees.index', { q: t.name } as any)}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-800 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100 dark:hover:bg-gray-900"
                      >
                        <IconMapper name="ArrowRight" size={16} />
                        Open
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link
                href={route('training.trainees.index')}
                className="w-full inline-flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100 dark:hover:bg-gray-900"
              >
                <span className="inline-flex items-center gap-2">
                  <IconMapper name="GraduationCap" size={18} />
                  Manage Trainees
                </span>
                <IconMapper name="ChevronRight" size={18} />
              </Link>

              <Link
                href={route('training.regimens.index')}
                className="w-full inline-flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100 dark:hover:bg-gray-900"
              >
                <span className="inline-flex items-center gap-2">
                  <IconMapper name="ClipboardList" size={18} />
                  Manage Regimens
                </span>
                <IconMapper name="ChevronRight" size={18} />
              </Link>

              <div className="rounded-xl border border-dashed border-gray-200 bg-white/50 px-4 py-3 text-sm text-gray-700 dark:border-gray-800 dark:bg-gray-950/50 dark:text-gray-200">
                Rapid Response is available as a training track.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </TrainingLayout>
  );
}
