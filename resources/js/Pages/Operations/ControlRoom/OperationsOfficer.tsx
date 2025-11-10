import React from 'react';
import { Head } from '@inertiajs/react';
import ControlRoomLayout from '@/Layouts/Operations/ControlRoomLayout';
import { Card, CardContent, CardHeader } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { CoverageMeter } from '@/Components/coverage-meter';
import { ZoneDetailsModal } from '@/Components/ZoneDetailsModal';
import { findNearestSite, normalizeAgentLocation } from '@/utils/geo';
import { Input } from '@/Components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
import axios from 'axios';

const OperationsOfficer = ({ auth }: any) => {
  const [zones, setZones] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedZone, setSelectedZone] = React.useState<any>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [coverageFilter, setCoverageFilter] = React.useState<string>('all');
  const [isDetailsModalOpen, setIsDetailsModalOpen] = React.useState(false);
  const [stats, setStats] = React.useState<any>(null);
  const [liveStatus, setLiveStatus] = React.useState<any[]>([]);
  const [recentActivity, setRecentActivity] = React.useState<any[]>([]);
  const [cameras, setCameras] = React.useState<any[]>([]);

  React.useEffect(() => {
    let url = '/control-room/monitoring/data';
    try { if (typeof (route) === 'function') url = route('control-room.monitoring.data'); } catch (e) { /* fallback */ }

    const load = async () => {
      setLoading(true);
      try {
        const res = await axios.get(url, { withCredentials: true, headers: { Accept: 'application/json' } });
        const data = res.data || {};
        setZones(Array.isArray(data.zones) ? data.zones : []);
        setStats(data.stats || null);
        setLiveStatus(Array.isArray(data.liveStatus) ? data.liveStatus : []);
        setRecentActivity(Array.isArray(data.recentActivity) ? data.recentActivity : []);
        setCameras(Array.isArray(data.cameras) ? data.cameras : []);
      } catch (e) {
        console.warn('Failed to load operations data', e);
        setZones([]);
        setStats(null);
        setLiveStatus([]);
        setRecentActivity([]);
        setCameras([]);
      } finally {
        setLoading(false);
      }
    };

    let echoCleanup: any = null;
    const userId = (auth as any)?.user?.id;

    const setupRealtime = () => {
      try {
        const EchoClient = (window as any).Echo;
        if (!EchoClient) return;

        const notifications = EchoClient.channel('notifications');
        const handleNotification = (e: any) => {
          try {
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

        try { notifications.listen('.NotificationEvent', handleNotification); } catch (e) { }
        try { notifications.listen('NotificationEvent', handleNotification); } catch (e) { }

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
        } catch (e) { }

        try {
          const agentStatuses = EchoClient.private('agent-statuses');
          const handleAgentStatus = (e: any) => {
            try {
              const agent = e?.agent ?? e;
              if (!agent) return;
              setStats((s: any) => {
                if (!s) return s;
                let delta = 0;
                if (agent.status === 'active') delta = 1;
                else if (['offline', 'inactive'].includes(agent.status)) delta = -1;
                const active = Math.max(0, (s.activeGuards || 0) + delta);
                return { ...s, activeGuards: active };
              });
            } catch (err) {
              console.warn('agent status handler failed', err);
            }
          };

          agentStatuses.listen('.AgentStatusUpdated', handleAgentStatus);
          agentStatuses.listen('AgentStatusUpdated', handleAgentStatus);
        } catch (e) { }

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
        } catch (e) { }

        echoCleanup = () => {
          try { notifications.stopListening('.NotificationEvent'); } catch (e) {}
          try { notifications.stopListening('NotificationEvent'); } catch (e) {}
          try { (window as any).Echo.private('control-room').stopListening('.ScanTagged'); } catch (e) {}
          try { (window as any).Echo.private('control-room').stopListening('ScanTagged'); } catch (e) {}
          try { (window as any).Echo.private('agent-statuses').stopListening('.AgentStatusUpdated'); } catch (e) {}
          try { (window as any).Echo.private('agent-statuses').stopListening('AgentStatusUpdated'); } catch (e) {}
          try { if (userId) (window as any).Echo.private(`supervisor.${userId}`).stopListening('.QRScanned'); } catch (e) {}
          try { if (userId) (window as any).Echo.private(`supervisor.${userId}`).stopListening('QRScanned'); } catch (e) {}
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

  const activeSites = stats?.activeSites ?? liveStatus.length;
  const guardsOnDuty = stats?.activeGuards ?? 0;
  const activeAlerts = stats?.activeIncidents ?? 0;

  return (
    <ControlRoomLayout title="Operations Officer">
      <Head title="Operations Officer" />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium">Operations Officer Dashboard</h3>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">This view is scoped for operations officers. It shows zone-level coverage and guard counts, with quick access to live monitoring and camera previews.</p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Sites</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{activeSites}</p>
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
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{guardsOnDuty}</p>
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
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{activeAlerts}</p>
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

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Zones Overview</h3>
              <div className="flex items-center space-x-2">
                <Input
                  type="search"
                  placeholder="Search zones..."
                  className="w-48"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Select value={coverageFilter} onValueChange={setCoverageFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Filter by coverage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Zones</SelectItem>
                    <SelectItem value="high">High Coverage (≥90%)</SelectItem>
                    <SelectItem value="medium">Medium Coverage (50-89%)</SelectItem>
                    <SelectItem value="low">Low Coverage (&lt;50%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div>Loading…</div>
            ) : zones.length > 0 ? (
              <div className="space-y-3">
                {zones
                  .filter(z => {
                    // Apply search filter
                    if (searchQuery && !z.name.toLowerCase().includes(searchQuery.toLowerCase())) {
                      return false;
                    }
                    
                    // Apply coverage filter
                    if (coverageFilter === 'high' && z.coverage < 90) return false;
                    if (coverageFilter === 'medium' && (z.coverage < 50 || z.coverage >= 90)) return false;
                    if (coverageFilter === 'low' && z.coverage >= 50) return false;
                    
                    return true;
                  })
                  .map(z => (
                    <div 
                      key={z.id} 
                      className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                      onClick={() => {
                        setSelectedZone(z);
                        setIsDetailsModalOpen(true);
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-medium">{z.name}</div>
                          <div className="text-sm text-gray-500">
                            {z.sites} sites • {z.guards} active guards
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold">{z.coverage}%</div>
                          <div className="text-xs text-gray-500">Coverage</div>
                        </div>
                      </div>
                      <CoverageMeter
                        value={z.coverage}
                        current={z.guards}
                        required={z.required_guards}
                        label="Guard Coverage"
                        size="md"
                      />
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-gray-500">No zones data available</div>
            )}

            <ZoneDetailsModal
              zone={selectedZone}
              isOpen={isDetailsModalOpen}
              onClose={() => {
                setIsDetailsModalOpen(false);
                setSelectedZone(null);
              }}
            />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium">Live Site Status</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {liveStatus.map((site) => (
                  <div key={site.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-gray-100">{site.name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{site.guards} Guards • Last update: {site.lastUpdate}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {site.alerts > 0 && (
                        <Badge variant="destructive" className="text-xs">{site.alerts} Alert{site.alerts > 1 ? 's' : ''}</Badge>
                      )}
                      <Badge variant={site.status === 'active' ? 'default' : 'secondary'} className={`text-xs ${site.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-100'}`}>{site.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium">Recent Activity</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-gray-100">{activity.guard} - {activity.type}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{activity.site} • {activity.time}</div>
                    </div>
                    <Badge variant={activity.status === 'success' ? 'default' : activity.status === 'warning' ? 'secondary' : 'destructive'} className={`text-xs ${activity.status === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : activity.status === 'warning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100' : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'}`}>{activity.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium">Quick Actions</h3>
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

        {/* Cameras thumbnails */}
        {cameras && cameras.length > 0 && (
          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium">Cameras</h3>
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
        )}
      </div>
    </ControlRoomLayout>
  )
}

export default OperationsOfficer;
