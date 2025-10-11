import React from 'react';
import { Head } from '@inertiajs/react';
import ControlRoomLayout from '@/Layouts/ControlRoomLayout';
import { Card, CardContent, CardHeader } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';

interface AlertsProps {
  auth?: { user?: { name?: string } };
}

const Alerts = ({ auth }: AlertsProps) => {
  // Mock data for alerts
  const alerts = [
    {
      id: 1,
      title: 'Security Breach Detected',
      type: 'Security',
      priority: 'critical',
      status: 'active',
      source: 'Camera System',
      location: 'Site A - Main Gate',
      timestamp: '2024-01-15 14:30:25',
      description: 'Unauthorized individual detected in restricted area',
      acknowledgedBy: null,
      acknowledgedAt: null
    },
    {
      id: 2,
      title: 'Guard Check-in Overdue',
      type: 'Personnel',
      priority: 'high',
      status: 'active',
      source: 'Attendance System',
      location: 'Site B - Warehouse',
      timestamp: '2024-01-15 14:15:10',
      description: 'Guard John Doe has not checked in for scheduled shift',
      acknowledgedBy: null,
      acknowledgedAt: null
    },
    {
      id: 3,
      title: 'Camera Offline',
      type: 'Technical',
      priority: 'medium',
      status: 'acknowledged',
      source: 'Camera System',
      location: 'Site C - Office Building',
      timestamp: '2024-01-15 13:45:30',
      description: 'Camera #C-03 has been offline for 15 minutes',
      acknowledgedBy: 'Control Room Operator',
      acknowledgedAt: '2024-01-15 13:50:00'
    },
    {
      id: 4,
      title: 'Emergency Button Pressed',
      type: 'Emergency',
      priority: 'critical',
      status: 'resolved',
      source: 'Emergency System',
      location: 'Site D - Parking Lot',
      timestamp: '2024-01-15 12:30:45',
      description: 'Emergency button activated by guard Sarah Wilson',
      acknowledgedBy: 'Control Room Supervisor',
      acknowledgedAt: '2024-01-15 12:31:00'
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
      case 'acknowledged': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100';
      case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-100';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Security': return '🛡️';
      case 'Personnel': return '👮';
      case 'Technical': return '🔧';
      case 'Emergency': return '🚨';
      default: return '⚠️';
    }
  };

  return (
    <ControlRoomLayout title="Emergency Alerts" user={auth?.user as any}>
      <Head title="Emergency Alerts" />

      <div className="space-y-6">
        {/* Alert Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Alerts</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">2</p>
                </div>
                <div className="h-8 w-8 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                  <span className="text-red-600 dark:text-red-400">🚨</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Critical Priority</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">2</p>
                </div>
                <div className="h-8 w-8 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                  <span className="text-red-600 dark:text-red-400">⚠</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Acknowledged</p>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">1</p>
                </div>
                <div className="h-8 w-8 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
                  <span className="text-yellow-600 dark:text-yellow-400">⏳</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Resolved Today</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">1</p>
                </div>
                <div className="h-8 w-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <span className="text-green-600 dark:text-green-400">✅</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alert List */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Active Alerts</h3>
            <div className="flex space-x-2">
              <Button variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600">
                Acknowledge All
              </Button>
              <Button className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">
                Send Emergency Alert
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div key={alert.id} className={`p-4 rounded-lg border ${
                  alert.priority === 'critical' 
                    ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' 
                    : alert.priority === 'high'
                    ? 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800'
                    : 'bg-gray-50 border-gray-200 dark:bg-gray-700 dark:border-gray-600'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-lg">{getTypeIcon(alert.type)}</span>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">{alert.title}</h4>
                        <Badge className={`text-xs ${getPriorityColor(alert.priority)}`}>
                          {alert.priority}
                        </Badge>
                        <Badge className={`text-xs ${getStatusColor(alert.status)}`}>
                          {alert.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{alert.description}</p>
                      <div className="text-xs text-gray-500 dark:text-gray-500">
                        <span className="font-medium">Source:</span> {alert.source} • 
                        <span className="font-medium"> Location:</span> {alert.location} • 
                        <span className="font-medium"> Time:</span> {alert.timestamp}
                        {alert.acknowledgedBy && (
                          <>
                            <br />
                            <span className="font-medium">Acknowledged by:</span> {alert.acknowledgedBy} at {alert.acknowledgedAt}
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      {alert.status === 'active' && (
                        <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700 text-white">
                          Acknowledge
                        </Button>
                      )}
                      <Button size="sm" variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600">
                        View Details
                      </Button>
                      <Button size="sm" variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600">
                        Resolve
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Emergency Actions</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button variant="destructive" className="h-12 flex flex-col items-center justify-center space-y-1">
                <span className="text-lg">🚨</span>
                <span className="text-sm">Emergency Alert</span>
              </Button>
              <Button variant="outline" className="h-12 flex flex-col items-center justify-center space-y-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                <span className="text-lg">📞</span>
                <span className="text-sm">Call Police</span>
              </Button>
              <Button variant="outline" className="h-12 flex flex-col items-center justify-center space-y-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                <span className="text-lg">🏥</span>
                <span className="text-sm">Call Medical</span>
              </Button>
              <Button variant="outline" className="h-12 flex flex-col items-center justify-center space-y-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                <span className="text-lg">📢</span>
                <span className="text-sm">Broadcast</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ControlRoomLayout>
  );
};

export default Alerts;
