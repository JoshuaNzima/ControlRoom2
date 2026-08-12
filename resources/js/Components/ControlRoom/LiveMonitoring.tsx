import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { usePage } from '@inertiajs/react';
import toast, { Toaster } from 'react-hot-toast';
import useEcho from '@/Hooks/useEcho';

interface QRScan {
  id: number;
  supervisor_name: string;
  site_name: string;
  checkpoint_name: string;
  client_name: string;
  scanned_at: string;
  location_verified: boolean;
}

interface AttendanceUpdate {
  id: number;
  guard_name: string;
  site_name: string;
  client_name: string;
  action: 'check_in' | 'check_out';
  timestamp: string;
  status: string;
}

interface LiveMonitoringProps {
  className?: string;
}

export default function LiveMonitoring({ className = '' }: LiveMonitoringProps) {
  const [qrScans, setQrScans] = useState<QRScan[]>([]);
  const [attendanceUpdates, setAttendanceUpdates] = useState<AttendanceUpdate[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const { props } = usePage();

  useEffect(() => {
    // Fetch initial data
    fetchRecentData();
    
    // Setup WebSocket connection for real-time updates
    setupWebSocket();
    
    // Refresh data every 30 seconds as fallback
    const interval = setInterval(fetchRecentData, 30000);
    
    return () => {
      clearInterval(interval);
      cleanupWebSocket();
    };
  }, []);

  const fetchRecentData = async () => {
    try {
      const [scansResponse, attendanceResponse] = await Promise.all([
        fetch(route('control-room.live.scans')),
        fetch(route('control-room.live.attendance'))
      ]);

      if (scansResponse.ok) {
        const scansData = await scansResponse.json();
        setQrScans(Array.isArray(scansData) ? scansData.slice(0, 10) : []);
      }

      if (attendanceResponse.ok) {
        const attendanceData = await attendanceResponse.json();
        setAttendanceUpdates(Array.isArray(attendanceData) ? attendanceData.slice(0, 10) : []);
      }
      if (scansResponse.ok || attendanceResponse.ok) {
        setIsConnected(true);
      }
    } catch (error) {
      console.error('Failed to fetch live data:', error);
      setIsConnected(false);
    }
  };

  const setupWebSocket = () => {
    const echo = useEcho();
    
    if (!echo) {
      setIsConnected(true);
      return;
    }

    try {
      // Listen for QR scan events
      echo.private('control-room')
        .listen('QRScanned', (e: any) => {
          const d = e?.data ?? {};
          const scanData: QRScan = {
            id: d.id ?? Date.now(),
            supervisor_name: d.supervisor_name ?? 'Unknown',
            site_name: d.site_name ?? 'Unknown',
            checkpoint_name: d.checkpoint_name ?? '',
            client_name: d.client_name ?? '',
            scanned_at: d.scanned_at ?? new Date().toISOString(),
            location_verified: d.location_verified ?? false,
          };
          
          setQrScans(prev => [scanData, ...prev].slice(0, 10));
          toast.success(`QR Scan: ${scanData.supervisor_name} at ${scanData.site_name}`);
        })
        .listen('AttendanceUpdated', (e: any) => {
          const data = e?.data ?? {};
          const attendanceData: AttendanceUpdate = {
            id: data.id ?? Date.now(),
            guard_name: data.guard_name ?? 'Unknown',
            site_name: data.site_name ?? 'Unknown',
            client_name: data.client_name ?? '',
            action: data.action ?? 'check_in',
            timestamp: data.timestamp ?? data.time ?? new Date().toISOString(),
            status: data.status ?? 'present',
          };
          
          setAttendanceUpdates(prev => [attendanceData, ...prev].slice(0, 10));
          const actionLabel = (data.action || data.status || 'updated').replace('_', ' ');
          toast.success(`Attendance: ${attendanceData.guard_name} ${actionLabel}`);
        });

      setIsConnected(true);
    } catch (error) {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
    }
  };

  const cleanupWebSocket = () => {
    const echo = useEcho();
    if (echo) {
      echo.leave('control-room');
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'check_in':
        return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
      case 'check_out':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
      case 'absent':
        return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
      case 'late':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <div className={`space-y-6 ${className}`}>
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Live Monitoring</h2>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
            <Button variant="outline" size="sm" onClick={fetchRecentData}>
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* QR Scans */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Recent QR Scans</h3>
              <Badge variant="secondary" className="text-xs">
                {qrScans.length} recent
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {qrScans.length > 0 ? (
                  qrScans.map((scan) => (
                    <div key={scan.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {scan.supervisor_name}
                          </span>
                          {scan.location_verified && (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-300">
                              ✓ Location
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {scan.site_name} • <span className="font-medium text-gray-700 dark:text-gray-300">{scan.checkpoint_name}</span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                          {scan.client_name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {formatTime(scan.scanned_at)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Scanned
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <div className="text-4xl mb-2">📱</div>
                    <div>No QR scans yet</div>
                    <div className="text-sm mt-1">QR scans will appear here in real-time</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Attendance Updates */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Attendance Updates</h3>
              <Badge variant="secondary" className="text-xs">
                {attendanceUpdates.length} recent
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {attendanceUpdates.length > 0 ? (
                  attendanceUpdates.map((update) => (
                    <div key={update.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {update.guard_name}
                          </span>
                          <Badge className={`text-xs ${getActionBadgeColor(update.action || '')}`}>
                            {(update.action || 'update').replace('_', ' ')}
                          </Badge>
                          <Badge className={`text-xs ${getStatusBadgeColor(update.status || '')}`}>
                            {(update.status || 'unknown').replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {update.site_name} • {update.client_name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {formatTime(update.timestamp)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Updated
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <div className="text-4xl mb-2">✅</div>
                    <div>No attendance updates yet</div>
                    <div className="text-sm mt-1">Attendance updates will appear here in real-time</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Stats */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Live Summary</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {qrScans.length}
                </div>
                <div className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                  QR Scans (Last Hour)
                </div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {attendanceUpdates.filter(u => u.action === 'check_in').length}
                </div>
                <div className="text-sm text-green-800 dark:text-green-200 font-medium">
                  Check-ins (Last Hour)
                </div>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {attendanceUpdates.filter(u => u.action === 'check_out').length}
                </div>
                <div className="text-sm text-purple-800 dark:text-purple-200 font-medium">
                  Check-outs (Last Hour)
                </div>
              </div>
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {attendanceUpdates.filter(u => u.status === 'late').length}
                </div>
                <div className="text-sm text-orange-800 dark:text-orange-200 font-medium">
                  Late Arrivals (Last Hour)
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
