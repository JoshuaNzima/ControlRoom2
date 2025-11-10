import React from 'react';
import { Head } from '@inertiajs/react';
import ControlRoomLayout from '@/Layouts/Operations/ControlRoomLayout';
import { Card, CardContent, CardHeader } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { User } from '@/types';
import axios from 'axios';
import { findNearestSite, normalizeAgentLocation } from '@/utils/geo';

interface Zone {
  id: number;
  name: string;
  coverage: number;
  guards: number;
  required_guards: number;
  sites: number;
}

interface MonitoringProps {
  auth?: { user?: { id?: number; name?: string } };
}

const Monitoring = ({ auth }: MonitoringProps) => {
  // Stateful data (will fetch from backend /monitoring/data). Falls back to mock data on error.
  const [zones, setZones] = React.useState<Zone[]>([]);
  const [liveStatus, setLiveStatus] = React.useState<Array<any>>([]);
  const [recentActivity, setRecentActivity] = React.useState<Array<any>>([]);
  const [stats, setStats] = React.useState<any>(null);
  const [cameras, setCameras] = React.useState<Array<any>>([]);
  const [sites, setSites] = React.useState<Array<any>>([]);

  React.useEffect(() => {
    let url = '/control-room/monitoring/data';
    try { if (typeof (route) === 'function') url = route('control-room.monitoring.data'); } catch (e) { /* fallback */ }

    const load = async () => {
      try {
        const res = await axios.get(url, { withCredentials: true, headers: { Accept: 'application/json' } });
        const data = res.data || {};
        setZones(Array.isArray(data.zones) ? data.zones : []);
        setLiveStatus(Array.isArray(data.liveStatus) ? data.liveStatus : []);
        setRecentActivity(Array.isArray(data.recentActivity) ? data.recentActivity : []);
        setStats(data.stats || null);
        setCameras(Array.isArray(data.cameras) ? data.cameras : []);
        setSites(Array.isArray(data.sites) ? data.sites : []);
      } catch (err) {
        // keep UI alive with small mock dataset
        console.warn('Failed to load monitoring data, using fallback mock data', err);
        setLiveStatus([
          { id: 1, name: 'Site A - Main Gate', status: 'active', guards: 2, lastUpdate: '2 min ago', alerts: 0 },
          { id: 2, name: 'Site B - Warehouse', status: 'active', guards: 1, lastUpdate: '1 min ago', alerts: 1 },
          { id: 3, name: 'Site C - Office Building', status: 'inactive', guards: 0, lastUpdate: '15 min ago', alerts: 3 },
          { id: 4, name: 'Site D - Parking Lot', status: 'active', guards: 1, lastUpdate: '30 sec ago', alerts: 0 },
        ]);
        setRecentActivity([
          { id: 1, type: 'checkin', guard: 'John Doe', site: 'Site A', time: '2 min ago', status: 'success' },
          { id: 2, type: 'alert', guard: 'Jane Smith', site: 'Site B', time: '5 min ago', status: 'warning' },
          { id: 3, type: 'checkout', guard: 'Mike Johnson', site: 'Site C', time: '10 min ago', status: 'info' },
          { id: 4, type: 'incident', guard: 'Sarah Wilson', site: 'Site D', time: '15 min ago', status: 'danger' },
        ]);
      }
    };

  let echoCleanup: any = null;
  const userId = (auth as any)?.user?.id;

  const setupRealtime = () => {
      try {
        const EchoClient = (window as any).Echo;
        if (!EchoClient) return;

        // Subscribe to the public notifications channel
        const notifications = EchoClient.channel('notifications');
        const handleNotification = (e: any) => {
          try {
            // e.type and e.data are provided by NotificationEvent
            const t = e?.type ?? e?.notification_type ?? null;
            const d = e?.data ?? e?.payload ?? {};

            if (t && t.toString().toLowerCase().includes('down')) {
              const item = {
                id: `down-${Date.now()}`,
                type: 'down_report',
                guard: d?.supervisor_name ?? 'Unknown',
                site: d?.site_name ?? d?.client_site_name ?? 'Unknown',
                time: new Date().toLocaleTimeString(),
                status: 'warning',
              };
              setRecentActivity((cur) => [item, ...cur].slice(0, 20));
              setStats((s: any) => s ? ({ ...s, activeIncidents: (s.activeIncidents || 0) + 1 }) : s);
            } else {
              // generic notification — push to recentActivity minimally
              const item = {
                id: `note-${Date.now()}`,
                type: t ?? 'notification',
                guard: d?.actor_name ?? d?.user_name ?? 'System',
                site: d?.site_name ?? null,
                time: new Date().toLocaleTimeString(),
                status: 'info',
              };
              setRecentActivity((cur) => [item, ...cur].slice(0, 20));
            }
          } catch (err) {
            console.warn('notification handler failed', err);
          }
        };

        try { notifications.listen('.NotificationEvent', handleNotification); } catch (e) { /* ignore */ }
        try { notifications.listen('NotificationEvent', handleNotification); } catch (e) { /* ignore */ }

        // Private control-room channel (ScanTagged events)
        try {
          const controlRoom = EchoClient.private('control-room');
          const handleScanTagged = (e: any) => {
            try {
              const tag = e?.scan_tag ?? e?.scanTag ?? e;
              const item = {
                id: `scan-${tag?.id ?? Date.now()}`,
                type: 'scan',
                guard: tag?.tags?.[0] ?? 'Scan',
                site: null,
                time: new Date().toLocaleTimeString(),
                status: 'info',
              };
              setRecentActivity((cur) => [item, ...cur].slice(0, 20));
            } catch (err) {
              console.warn('scan handler failed', err);
            }
          };

          controlRoom.listen('.ScanTagged', handleScanTagged);
          controlRoom.listen('ScanTagged', handleScanTagged);
        } catch (e) { /* ignore */ }

        // Agent status updates
        try {
          const agentStatuses = EchoClient.private('agent-statuses');
          const handleAgentStatus = (e: any) => {
            try {
              const agent = e?.agent ?? e;
              if (!agent) return;

              // Track previous site ID to decrement old site's count if needed
              const prevSiteId = agent.prev_site_id;
              let newSiteId: number | null = null;

              // Try to map agent's location to nearest site
              const location = normalizeAgentLocation(agent.location);
              if (location) {
                const nearest = findNearestSite(location.lat, location.lng, sites, 1000); // 1km radius
                if (nearest) {
                  newSiteId = nearest.id;
                }
              }

              // Update global active guard count
              setStats((s: any) => {
                if (!s) return s;
                let delta = 0;
                if (agent.status === 'active') delta = 1;
                else if (['offline', 'inactive'].includes(agent.status)) delta = -1;
                const active = Math.max(0, (s.activeGuards || 0) + delta);
                return { ...s, activeGuards: active };
              });

              // Update site-specific counts and zone coverage
              setLiveStatus((current) => {
                const updated = [...current];
                
                // Decrement previous site if there was one
                if (prevSiteId) {
                  const prevIndex = updated.findIndex(s => s.id === prevSiteId);
                  if (prevIndex !== -1) {
                    updated[prevIndex] = {
                      ...updated[prevIndex],
                      guards: Math.max(0, (updated[prevIndex].guards || 1) - 1)
                    };
                  }
                }

                // Increment new site if we found one
                if (newSiteId && agent.status === 'active') {
                  const newIndex = updated.findIndex(s => s.id === newSiteId);
                  if (newIndex !== -1) {
                    updated[newIndex] = {
                      ...updated[newIndex],
                      guards: (updated[newIndex].guards || 0) + 1
                    };
                  }
                }

                // Update zone counts based on site changes
                setZones((currentZones) => {
                  const updatedZones = [...currentZones];
                  const siteZones = new Map(sites.map(site => [site.id, site.zone_id]));

                  // If we have a previous site, decrement its zone's guard count
                  if (prevSiteId) {
                    const zoneId = siteZones.get(prevSiteId);
                    if (zoneId) {
                      const zoneIndex = updatedZones.findIndex(z => z.id === zoneId);
                      if (zoneIndex !== -1) {
                        updatedZones[zoneIndex] = {
                          ...updatedZones[zoneIndex],
                          guards: Math.max(0, (updatedZones[zoneIndex].guards || 1) - 1)
                        };
                        // Recalculate coverage percentage
                        const zone = updatedZones[zoneIndex];
                        zone.coverage = Math.round((zone.guards / (zone.required_guards || 1)) * 100);
                      }
                    }
                  }

                  // If we have a new site and agent is active, increment its zone's guard count
                  if (newSiteId && agent.status === 'active') {
                    const zoneId = siteZones.get(newSiteId);
                    if (zoneId) {
                      const zoneIndex = updatedZones.findIndex(z => z.id === zoneId);
                      if (zoneIndex !== -1) {
                        updatedZones[zoneIndex] = {
                          ...updatedZones[zoneIndex],
                          guards: (updatedZones[zoneIndex].guards || 0) + 1
                        };
                        // Recalculate coverage percentage
                        const zone = updatedZones[zoneIndex];
                        zone.coverage = Math.round((zone.guards / (zone.required_guards || 1)) * 100);
                      }
                    }
                  }

                  return updatedZones;
                });

                return updated;
              });

            } catch (err) {
              console.warn('agent status handler failed', err);
            }
          };

          agentStatuses.listen('.AgentStatusUpdated', handleAgentStatus);
          agentStatuses.listen('AgentStatusUpdated', handleAgentStatus);
        } catch (e) { /* ignore */ }

        // If we have an authenticated user, also listen on supervisor.{id}
        try {
          if (userId) {
            const sup = EchoClient.private(`supervisor.${userId}`);
            const handleQR = (e: any) => {
              try {
                const msg = e?.message ?? e?.data ?? e;
                const item = {
                  id: `qr-${Date.now()}`,
                  type: 'qr',
                  guard: msg?.guard_name ?? 'QR',
                  site: msg?.site_name ?? null,
                  time: new Date().toLocaleTimeString(),
                  status: 'info',
                };
                setRecentActivity((cur) => [item, ...cur].slice(0, 20));
              } catch (err) {
                console.warn('qr handler failed', err);
              }
            };

            sup.listen('.QRScanned', handleQR);
            sup.listen('QRScanned', handleQR);
          }
        } catch (e) { /* ignore */ }

        echoCleanup = () => {
          try { notifications.stopListening('.NotificationEvent'); } catch (e) {}
          try { notifications.stopListening('NotificationEvent'); } catch (e) {}
          try { EchoClient.private('control-room').stopListening('.ScanTagged'); } catch (e) {}
          try { EchoClient.private('control-room').stopListening('ScanTagged'); } catch (e) {}
          try { EchoClient.private('agent-statuses').stopListening('.AgentStatusUpdated'); } catch (e) {}
          try { EchoClient.private('agent-statuses').stopListening('AgentStatusUpdated'); } catch (e) {}
          try { if (userId) EchoClient.private(`supervisor.${userId}`).stopListening('.QRScanned'); } catch (e) {}
          try { if (userId) EchoClient.private(`supervisor.${userId}`).stopListening('QRScanned'); } catch (e) {}
        };
      } catch (e) {
        console.warn('Realtime setup failed', e);
      }
    };

    load().then(() => setupRealtime());
    return () => {
      try { if (echoCleanup) echoCleanup(); } catch (e) {}
    };
  }, []);

  return (
    <ControlRoomLayout title="Live Monitoring" user={auth?.user as User | undefined}>
      <Head title="Live Monitoring" />

      <div className="space-y-6">
        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Sites</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">3</p>
                </div>
                <div className="h-8 w-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <span className="text-green-600 dark:text-green-400">✓</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Guards On Duty</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">4</p>
                </div>
                <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400">👮</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Alerts</p>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">4</p>
                </div>
                <div className="h-8 w-8 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
                  <span className="text-yellow-600 dark:text-yellow-400">⚠</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">System Status</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">Online</p>
                </div>
                <div className="h-8 w-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <span className="text-green-600 dark:text-green-400">🟢</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Site Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Live Site Status</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {liveStatus.map((site) => (
                  <div key={site.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-gray-100">{site.name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {site.guards} Guards • Last update: {site.lastUpdate}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {site.alerts > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {site.alerts} Alert{site.alerts > 1 ? 's' : ''}
                        </Badge>
                      )}
                      <Badge 
                        variant={site.status === 'active' ? 'default' : 'secondary'}
                        className={`text-xs ${
                          site.status === 'active' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' 
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-100'
                        }`}
                      >
                        {site.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Recent Activity</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {activity.guard} - {activity.type}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {activity.site} • {activity.time}
                      </div>
                    </div>
                    <Badge 
                      variant={activity.status === 'success' ? 'default' : activity.status === 'warning' ? 'secondary' : 'destructive'}
                      className={`text-xs ${
                        activity.status === 'success' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                          : activity.status === 'warning'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                          : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                      }`}
                    >
                      {activity.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Quick Actions</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button variant="outline" className="h-12 flex flex-col items-center justify-center space-y-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                <span className="text-lg">📹</span>
                <span className="text-sm">View Cameras</span>
              </Button>
              <Button variant="outline" className="h-12 flex flex-col items-center justify-center space-y-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                <span className="text-lg">🚨</span>
                <span className="text-sm">Send Alert</span>
              </Button>
              <Button variant="outline" className="h-12 flex flex-col items-center justify-center space-y-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                <span className="text-lg">📞</span>
                <span className="text-sm">Emergency Call</span>
              </Button>
              <Button variant="outline" className="h-12 flex flex-col items-center justify-center space-y-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                <span className="text-lg">📊</span>
                <span className="text-sm">Generate Report</span>
              </Button>
            </div>
          </CardContent>
        </Card>
        {/* Cameras (thumbnails) */}
        {cameras && cameras.length > 0 && (
          <div>
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Cameras</h3>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {cameras.map((cam) => (
                    <a key={cam.id} href={`/control-room/cameras/${cam.id}`} className="block bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden">
                      {cam.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={cam.thumbnail} alt={cam.name} className="w-full h-28 object-cover" />
                      ) : (
                        <div className="w-full h-28 flex items-center justify-center bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300">Camera</div>
                      )}
                      <div className="p-2 text-sm font-medium text-gray-900 dark:text-gray-100">{cam.name}{cam.site ? ` • ${cam.site}` : ''}</div>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </ControlRoomLayout>
  );
};

export default Monitoring;
