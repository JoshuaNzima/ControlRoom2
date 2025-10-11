import React from 'react';
import { Head } from '@inertiajs/react';
import ControlRoomLayout from '@/Layouts/ControlRoomLayout';
import { Card, CardContent, CardHeader } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';

interface ZonesProps {
  auth?: { user?: { name?: string } };
}

const Zones = ({ auth }: ZonesProps) => {
  // Mock data for zones
  const zones = [
    {
      id: 1,
      name: 'Zone A - Central District',
      coverage: 95.5,
      guards: 8,
      requiredGuards: 8,
      sites: 12,
      status: 'active',
      commander: 'John Smith',
      lastUpdate: '2 min ago',
      alerts: 0,
      incidents: 1
    },
    {
      id: 2,
      name: 'Zone B - Industrial Area',
      coverage: 78.2,
      guards: 5,
      requiredGuards: 7,
      sites: 8,
      status: 'active',
      commander: 'Jane Doe',
      lastUpdate: '5 min ago',
      alerts: 2,
      incidents: 0
    },
    {
      id: 3,
      name: 'Zone C - Residential',
      coverage: 100.0,
      guards: 6,
      requiredGuards: 6,
      sites: 15,
      status: 'active',
      commander: 'Mike Johnson',
      lastUpdate: '1 min ago',
      alerts: 0,
      incidents: 0
    },
    {
      id: 4,
      name: 'Zone D - Commercial',
      coverage: 45.8,
      guards: 2,
      requiredGuards: 5,
      sites: 6,
      status: 'understaffed',
      commander: 'Sarah Wilson',
      lastUpdate: '10 min ago',
      alerts: 3,
      incidents: 2
    }
  ];

  const getCoverageColor = (coverage: number) => {
    if (coverage >= 90) return 'text-green-600 dark:text-green-400';
    if (coverage >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getCoverageBgColor = (coverage: number) => {
    if (coverage >= 90) return 'bg-green-500';
    if (coverage >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
      case 'understaffed': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100';
      case 'inactive': return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-100';
    }
  };

  return (
    <ControlRoomLayout title="Zone Management" user={auth?.user as any}>
      <Head title="Zone Management" />

      <div className="space-y-6">
        {/* Zone Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Zones</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">4</p>
                </div>
                <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400">🗺️</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Zones</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">3</p>
                </div>
                <div className="h-8 w-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <span className="text-green-600 dark:text-green-400">✅</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Guards</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">21</p>
                </div>
                <div className="h-8 w-8 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 dark:text-purple-400">👮</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Sites</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">41</p>
                </div>
                <div className="h-8 w-8 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 dark:text-orange-400">🏢</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Zone List */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Zone Overview</h3>
            <Button className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">
              Add New Zone
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {zones.map((zone) => (
                <div key={zone.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">{zone.name}</h4>
                        <Badge className={`text-xs ${getStatusColor(zone.status)}`}>
                          {zone.status}
                        </Badge>
                        {zone.alerts > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {zone.alerts} Alert{zone.alerts > 1 ? 's' : ''}
                          </Badge>
                        )}
                        {zone.incidents > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {zone.incidents} Incident{zone.incidents > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Commander:</span> {zone.commander} • 
                        <span className="font-medium"> Guards:</span> {zone.guards}/{zone.requiredGuards} • 
                        <span className="font-medium"> Sites:</span> {zone.sites} • 
                        <span className="font-medium"> Last Update:</span> {zone.lastUpdate}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className={`text-2xl font-bold ${getCoverageColor(zone.coverage)}`}>
                        {zone.coverage.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Coverage
                      </div>
                    </div>
                  </div>
                  
                  {/* Coverage Progress Bar */}
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mb-4">
                    <div 
                      className={`h-2 rounded-full ${getCoverageBgColor(zone.coverage)}`}
                      style={{ width: `${Math.min(zone.coverage, 100)}%` }}
                    ></div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600">
                      View Details
                    </Button>
                    <Button size="sm" variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600">
                      Manage Guards
                    </Button>
                    <Button size="sm" variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600">
                      View Sites
                    </Button>
                    <Button size="sm" variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600">
                      Reports
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Zone Management</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button variant="outline" className="h-12 flex flex-col items-center justify-center space-y-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                <span className="text-lg">➕</span>
                <span className="text-sm">Add Zone</span>
              </Button>
              <Button variant="outline" className="h-12 flex flex-col items-center justify-center space-y-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                <span className="text-lg">👮</span>
                <span className="text-sm">Assign Guards</span>
              </Button>
              <Button variant="outline" className="h-12 flex flex-col items-center justify-center space-y-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                <span className="text-lg">📊</span>
                <span className="text-sm">Zone Reports</span>
              </Button>
              <Button variant="outline" className="h-12 flex flex-col items-center justify-center space-y-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                <span className="text-lg">🗺️</span>
                <span className="text-sm">Zone Map</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ControlRoomLayout>
  );
};

export default Zones;
