import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import ZoneCommanderLayout from '@/Layouts/ZoneCommanderLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import IconMapper from '@/Components/IconMapper';
import ScannerModal from '@/Components/Scanner/ScannerModal';
import { format } from 'date-fns';

interface Patrol {
  id: number;
  guard_name: string;
  site_name: string;
  checkpoint_name: string;
  status: 'completed' | 'in_progress' | 'missed';
  scan_time: string;
  location: string;
  notes: string;
  photos: string[];
}

interface PatrolsProps {
  patrols: Patrol[];
}

export default function Patrols({ patrols = [] }: PatrolsProps) {
  const [scannerOpen, setScannerOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200';
      case 'missed': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const completedPatrols = patrols.filter(p => p.status === 'completed').length;
  const inProgressPatrols = patrols.filter(p => p.status === 'in_progress').length;
  const missedPatrols = patrols.filter(p => p.status === 'missed').length;

  return (
    <ZoneCommanderLayout title="Patrols">
      <Head title="Patrol Management" />

      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Patrol Management</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">Track checkpoint scans and patrol activities in your zone.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={() => setScannerOpen(true)} className="w-full sm:w-auto gap-2">
              <IconMapper name="QrCode" size={16} /> Scan Checkpoint
            </Button>
            <Button asChild variant="outline" className="w-full sm:w-auto gap-2">
              <Link href={route('zone.checkpoints.index')}>
                <IconMapper name="MapPin" size={16} /> View Checkpoints
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <Card className="p-3 sm:p-4 bg-white/60 dark:bg-gray-900/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center shrink-0">
                <IconMapper name="ScanLine" className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-200" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Total Scans</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{patrols.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-3 sm:p-4 bg-white/60 dark:bg-gray-900/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center shrink-0">
                <IconMapper name="CheckCircle" className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-200" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Completed</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{completedPatrols}</p>
              </div>
            </div>
          </Card>

          <Card className="p-3 sm:p-4 bg-white/60 dark:bg-gray-900/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center shrink-0">
                <IconMapper name="Clock" className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 dark:text-yellow-200" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">In Progress</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{inProgressPatrols}</p>
              </div>
            </div>
          </Card>

          <Card className="p-3 sm:p-4 bg-white/60 dark:bg-gray-900/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center shrink-0">
                <IconMapper name="XCircle" className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-200" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Missed</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{missedPatrols}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Patrols */}
        <Card className="p-3 sm:p-4 bg-white/60 dark:bg-gray-900/40">
          <h2 className="text-base sm:text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <IconMapper name="History" size={20} /> Recent Checkpoint Scans
          </h2>

          {patrols.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <IconMapper name="ScanLine" size={48} className="mx-auto mb-3 opacity-50" />
              <p>No patrol scans recorded yet.</p>
              <p className="text-sm mt-1">Scan checkpoint QR codes to record patrols.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {patrols.map((patrol) => (
                <div key={patrol.id} className="p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-900/40">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">{patrol.checkpoint_name}</h3>
                        <Badge className={getStatusColor(patrol.status)}>
                          {patrol.status.toUpperCase()}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-2">
                        <div className="flex items-center gap-2">
                          <IconMapper name="User" className="w-4 h-4 shrink-0" />
                          <span className="truncate">{patrol.guard_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <IconMapper name="MapPin" className="w-4 h-4 shrink-0" />
                          <span className="truncate">{patrol.site_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <IconMapper name="Clock" className="w-4 h-4 shrink-0" />
                          <span>{patrol.scan_time ? format(new Date(patrol.scan_time), 'MMM d, HH:mm') : '-'}</span>
                        </div>
                      </div>

                      {patrol.notes && (
                        <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-900/50 rounded text-xs sm:text-sm text-gray-700 dark:text-gray-200">
                          {patrol.notes}
                        </div>
                      )}

                      {patrol.location && (
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <IconMapper name="Navigation" size={12} />
                          {patrol.location}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Scanner Modal */}
      <ScannerModal
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
      />
    </ZoneCommanderLayout>
  );
}


