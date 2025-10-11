import React from 'react';
import { Head } from '@inertiajs/react';
import ControlRoomLayout from '@/Layouts/ControlRoomLayout';
import { Card, CardContent, CardHeader } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';

interface MonitoringProps {
  auth?: { user?: { name?: string } };
}

const Monitoring = ({ auth }: MonitoringProps) => {
  // Mock data for monitoring
  const liveStatus = [
    { id: 1, name: 'Site A - Main Gate', status: 'active', guards: 2, lastUpdate: '2 min ago', alerts: 0 },
    { id: 2, name: 'Site B - Warehouse', status: 'active', guards: 1, lastUpdate: '1 min ago', alerts: 1 },
    { id: 3, name: 'Site C - Office Building', status: 'inactive', guards: 0, lastUpdate: '15 min ago', alerts: 3 },
    { id: 4, name: 'Site D - Parking Lot', status: 'active', guards: 1, lastUpdate: '30 sec ago', alerts: 0 },
  ];

  const recentActivity = [
    { id: 1, type: 'checkin', guard: 'John Doe', site: 'Site A', time: '2 min ago', status: 'success' },
    { id: 2, type: 'alert', guard: 'Jane Smith', site: 'Site B', time: '5 min ago', status: 'warning' },
    { id: 3, type: 'checkout', guard: 'Mike Johnson', site: 'Site C', time: '10 min ago', status: 'info' },
    { id: 4, type: 'incident', guard: 'Sarah Wilson', site: 'Site D', time: '15 min ago', status: 'danger' },
  ];

  return (
    <ControlRoomLayout title="Live Monitoring" user={auth?.user as any}>
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
      </div>
    </ControlRoomLayout>
  );
};

export default Monitoring;
