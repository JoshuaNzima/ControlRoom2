import React from 'react';
import { Head } from '@inertiajs/react';
import ControlRoomLayout from '@/Layouts/ControlRoomLayout';
import { Card, CardContent, CardHeader } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { User } from '@/types';
import GuardLocationMap from '@/Components/Map/GuardLocationMap';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/dialog';

interface Location {
  lat: number;
  lng: number;
}

interface Event {
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  location?: Location;
  site?: string;
  timestamp: string;
  guard?: {
    id: number;
    name: string;
    status: string;
  };
}

interface Guard {
  id: number;
  name: string;
  status: string;
  location: Location;
  lastCheckIn: string;
  currentSite?: string;
  currentShift?: {
    started_at: string;
    ends_at: string;
  };
  lastActivity: string;
}

interface SiteStatus {
  id: number;
  name: string;
  status: 'active' | 'inactive';
  required?: number;
  onDuty?: number;
  coverageStatus?: 'full' | 'partial' | 'none' | 'unknown';
  lastUpdate: string;
  alerts: number;
  location: Location;
}

interface MonitoringProps {
  auth?: { user?: { name?: string } };
  metrics?: {
    activeSites: number;
    guardsOnDuty: number;
    activeAlerts: number;
    activeFlags: number;
    activeIncidents: number;
    systemStatus: string;
  };
  liveStatus?: SiteStatus[];
  recentActivity?: { id: string | number; type: string; guard: string; site: string; time: string; status: 'success' | 'warning' | 'info' | 'danger' }[];
  guards?: Guard[];
  events?: Event[];
  sla?: {
    averageResponseMinutes: number | null;
    medianResponseMinutes: number | null;
    breachedCount: number;
    totalResolved: number;
    onTimePercent: number | null;
  };
  activeRange?: string;
}

const Monitoring = ({ auth, metrics, liveStatus: initialLiveStatus = [], recentActivity: initialRecent = [], sla: initialSla, activeRange = '1h' }: MonitoringProps) => {
  const [currentMetrics, setCurrentMetrics] = React.useState(metrics || { 
    activeSites: 0, 
    guardsOnDuty: 0, 
    activeAlerts: 0, 
    activeFlags: 0, 
    activeIncidents: 0, 
    systemStatus: 'online' 
  });
  const [liveStatus, setLiveStatus] = React.useState(initialLiveStatus);
  const [recentActivity, setRecentActivity] = React.useState(initialRecent);
  const [guards, setGuards] = React.useState<Guard[]>([]);
  const [events, setEvents] = React.useState<Event[]>([]);
  const [sla, setSla] = React.useState(initialSla || null as MonitoringProps['sla'] | null);
  const [range, setRange] = React.useState<string>(activeRange || '1h');
  const [refreshMs, setRefreshMs] = React.useState<number>(30000);
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null);
  const [siteModalOpen, setSiteModalOpen] = React.useState(false);
  const [siteDetails, setSiteDetails] = React.useState<any | null>(null);
  const [siteLoading, setSiteLoading] = React.useState(false);
  const [showCountsOverlay, setShowCountsOverlay] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const v = localStorage.getItem('monitor.map.showCountsOverlay');
    return v == null ? true : v === 'true';
  });
  const [scaleByRequired, setScaleByRequired] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const v = localStorage.getItem('monitor.map.scaleByRequired');
    return v == null ? true : v === 'true';
  });

  React.useEffect(() => {
    let isMounted = true;

    async function fetchData(withRange: string) {
      try {
        const qs = withRange ? `?range=${encodeURIComponent(withRange)}` : '';
        const [dataRes, guardsRes, eventsRes] = await Promise.all([
          fetch(route('control-room.monitoring.data') + qs, { headers: { 'Accept': 'application/json' } }),
          fetch(route('control-room.monitoring.guards') + qs, { headers: { 'Accept': 'application/json' } }),
          fetch(route('control-room.monitoring.events') + qs, { headers: { 'Accept': 'application/json' } })
        ]);

        if (!dataRes.ok || !guardsRes.ok || !eventsRes.ok) return;
        
        const [data, guardsData, eventsData] = await Promise.all([
          dataRes.json(),
          guardsRes.json(),
          eventsRes.json()
        ]);

        if (!isMounted) return;
        
        setCurrentMetrics(data.metrics || {});
        setLiveStatus(data.liveStatus || []);
        setRecentActivity(data.recentActivity || []);
        setSla(data.sla || null);
        setGuards(guardsData || []);
        setEvents(eventsData || []);
        setLastUpdated(new Date());

      } catch (_) {
        // no-op
      }
    }

    // initial refresh in case page props were stale
    fetchData(range);
    const id = refreshMs > 0 ? setInterval(() => fetchData(range), refreshMs) : null;
    
    return () => {
      isMounted = false;
      if (id) clearInterval(id);
    };
  }, [range, refreshMs]);

  async function handleSiteClick(site: any) {
    try {
      setSiteLoading(true);
      setSiteModalOpen(true);
      setSiteDetails(null);
      const res = await fetch(route('control-room.monitoring.site', site.id), { headers: { 'Accept': 'application/json' } });
      if (res.ok) {
        const data = await res.json();
        setSiteDetails(data);
      }
    } finally {
      setSiteLoading(false);
    }
  }

  return (
    <ControlRoomLayout title="Live Monitoring" user={auth?.user as User | undefined}>
      <Head title="Live Monitoring" />

      <div className="space-y-6">
        {/* Controls: Time range & Refresh */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-1">Time range:</span>
            {[
              { key: '15m', label: 'Last 15m' },
              { key: '1h', label: 'Last 1h' },
              { key: '4h', label: 'Last 4h' },
              { key: '24h', label: 'Last 24h' },
              { key: 'today', label: 'Today' },
            ].map(opt => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setRange(opt.key)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors
                  ${range === opt.key
                    ? 'bg-coin-600 border-coin-600 text-white'
                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>

        {/* Site Drilldown Modal */}
        <Dialog open={siteModalOpen} onOpenChange={setSiteModalOpen}>
          <DialogContent className="w-full max-w-lg dark:bg-gray-800 dark:text-gray-100">
            <DialogHeader>
              <DialogTitle>{siteDetails?.name || 'Site details'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {siteLoading && <div className="text-sm text-gray-500 dark:text-gray-400">Loading...</div>}
              {siteDetails && (
                <>
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    <div>Client: {siteDetails.client || '-'}</div>
                    <div>Address: {siteDetails.address || '-'}</div>
                    <div>Status: {siteDetails.status}</div>
                    <div>Coverage: {siteDetails.coverageStatus} • On duty: {siteDetails.onDuty} / Required: {siteDetails.required}</div>
                    <div>Location: {siteDetails.latitude?.toFixed ? siteDetails.latitude.toFixed(6) : siteDetails.latitude}, {siteDetails.longitude?.toFixed ? siteDetails.longitude.toFixed(6) : siteDetails.longitude}</div>
                  </div>
                  <div className="border-t pt-3">
                    <div className="text-sm font-medium mb-1">Attendance Today</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Present: {siteDetails.attendanceSummary?.present ?? 0} • Late: {siteDetails.attendanceSummary?.late ?? 0} • Absent: {siteDetails.attendanceSummary?.absent ?? 0} • On duty: {siteDetails.attendanceSummary?.on_duty ?? 0}</div>
                  </div>
                  <div className="border-t pt-3">
                    <div className="text-sm font-medium mb-1">Assigned Guards</div>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {(siteDetails.assignedGuards || []).map((g: any) => (
                        <div key={g.id} className="text-sm flex items-center justify-between p-2 rounded-md bg-gray-50 dark:bg-gray-700">
                          <span>{g.name}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{g.status}</span>
                        </div>
                      ))}
                      {(!siteDetails.assignedGuards || siteDetails.assignedGuards.length === 0) && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">No assigned guards</div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

          <div className="flex flex-wrap items-center gap-3 justify-between md:justify-end">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Refresh:</span>
              <select
                value={String(refreshMs)}
                onChange={(e) => setRefreshMs(Number(e.target.value))}
                className="text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 px-2 py-1"
              >
                <option value="0">Manual</option>
                <option value="15000">15s</option>
                <option value="30000">30s</option>
                <option value="60000">60s</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 px-3 dark:border-gray-600 dark:text-gray-200"
                onClick={() => setRange((r) => r)}
              >
                Refresh now
              </Button>
              {lastUpdated && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Updated {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Sites</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{currentMetrics?.activeSites ?? 0}</p>
                </div>
                <div className="h-8 w-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <span className="text-green-600 dark:text-green-400">🏢</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Guards On Duty</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{currentMetrics?.guardsOnDuty ?? 0}</p>
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
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{currentMetrics?.activeAlerts ?? 0}</p>
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
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Flags</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{currentMetrics?.activeFlags ?? 0}</p>
                </div>
                <div className="h-8 w-8 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                  <span className="text-red-600 dark:text-red-400">🚩</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Incidents</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{currentMetrics?.activeIncidents ?? 0}</p>
                </div>
                <div className="h-8 w-8 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 dark:text-orange-400">⚠️</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">System Status</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {currentMetrics?.systemStatus ? currentMetrics.systemStatus.charAt(0).toUpperCase() + currentMetrics.systemStatus.slice(1) : 'Online'}
                  </p>
                </div>
                <div className="h-8 w-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <span className="text-green-600 dark:text-green-400">🟢</span>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* SLA: Average Response */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Response (min)</p>
                  <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    {sla?.averageResponseMinutes != null ? sla.averageResponseMinutes : '--'}
                  </p>
                </div>
                <div className="h-8 w-8 bg-indigo-100 dark:bg-indigo-900/20 rounded-full flex items-center justify-center">
                  <span className="text-indigo-600 dark:text-indigo-400">⏱</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SLA: On-time % */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">On-time Incidents</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {sla?.onTimePercent != null ? `${sla.onTimePercent}%` : '--'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Resolved: {sla?.totalResolved ?? 0}
                  </p>
                </div>
                <div className="h-8 w-8 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center">
                  <span className="text-emerald-600 dark:text-emerald-400">✅</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SLA: Breaches */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">SLA Breaches</p>
                  <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{sla?.breachedCount ?? 0}</p>
                </div>
                <div className="h-8 w-8 bg-rose-100 dark:bg-rose-900/20 rounded-full flex items-center justify-center">
                  <span className="text-rose-600 dark:text-rose-400">⚡</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Map and Events */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="dark:bg-gray-800 dark:border-gray-700 xl:col-span-2">
            <CardHeader>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Live Site Coverage</h3>
              <div className="mt-1 text-xs text-gray-600 dark:text-gray-400 flex flex-wrap gap-3">
                <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-green-500" /> Full</span>
                <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-amber-500" /> Partial</span>
                <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-red-500" /> None</span>
                <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-gray-500" /> Unknown</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[500px] relative">
                <GuardLocationMap
                  guards={guards}
                  sites={liveStatus.map(site => ({
                    ...site,
                    location: site.location || { lat: 0, lng: 0 } // Add proper location from your data
                  }))}
                  onSiteClick={handleSiteClick}
                  showCountsOverlay={showCountsOverlay}
                  scaleByRequired={scaleByRequired}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Live Events</h3>
                <Badge variant="secondary" className="text-xs">
                  Real-time
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[450px] overflow-y-auto">
                {events.map((event, index) => {
                  const severityColor = {
                    critical: 'destructive',
                    high: 'destructive',
                    medium: 'warning',
                    low: 'secondary',
                    info: 'default'
                  }[event.severity] || 'default';

                  return (
                    <div 
                      key={`${event.type}-${index}`} 
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {event.title}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {event.description}
                          {event.site && ` • ${event.site}`}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {new Date(event.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <Badge 
                        variant={severityColor as "success" | "warning" | "default" | "outline" | "destructive" | "secondary"}
                        className="text-xs capitalize"
                      >
                        {event.severity}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Site Status */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Site Status Overview</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveStatus.map((site) => (
                <div key={site.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-gray-100">{site.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      On duty: {site.onDuty ?? 0} / Required: {site.required ?? 0} • Last update: {site.lastUpdate}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {site.alerts > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {site.alerts} Alert{site.alerts > 1 ? 's' : ''}
                      </Badge>
                    )}
                    <Badge
                      variant={site.coverageStatus === 'full' ? 'default' : site.coverageStatus === 'partial' ? 'warning' : site.coverageStatus === 'none' ? 'destructive' : 'secondary'}
                      className={`text-xs capitalize ${
                        site.coverageStatus === 'full'
                          ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                          : site.coverageStatus === 'partial'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-100'
                          : site.coverageStatus === 'none'
                          ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-100'
                      }`}
                    >
                      {site.coverageStatus || 'unknown'}
                    </Badge>
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

        {/* Quick Actions */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Quick Actions</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button onClick={() => (window.location.href = route('control-room.cameras.index'))} variant="outline" className="h-12 flex flex-col items-center justify-center space-y-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                <span className="text-lg">📹</span>
                <span className="text-sm">View Cameras</span>
              </Button>
              <Button onClick={() => (window.location.href = route('control-room.flags.index'))} variant="outline" className="h-12 flex flex-col items-center justify-center space-y-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                <span className="text-lg">🚨</span>
                <span className="text-sm">View Flags</span>
              </Button>
              <Button onClick={() => (window.location.href = route('control-room.tickets.create'))} variant="outline" className="h-12 flex flex-col items-center justify-center space-y-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                <span className="text-lg">📞</span>
                <span className="text-sm">Create Ticket</span>
              </Button>
              <Button onClick={() => (window.location.href = route('control-room.reports'))} variant="outline" className="h-12 flex flex-col items-center justify-center space-y-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                <span className="text-lg">📊</span>
                <span className="text-sm">Generate Report</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ControlRoomLayout>
  );
};

export default Monitoring;
