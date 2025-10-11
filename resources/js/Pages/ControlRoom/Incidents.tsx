import React from 'react';
import { Head, Link } from '@inertiajs/react';
import ControlRoomLayout from '@/Layouts/ControlRoomLayout';
import { Card, CardContent, CardHeader } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';

interface Incident {
  id: number;
  title: string;
  type: string;
  severity: string;
  status: string;
  escalation_level: number;
  reporter?: { name: string };
  assigned_to?: { name: string };
  client?: { name: string };
  client_site?: { name: string };
  created_at: string;
}

interface IncidentsProps {
  auth?: { user?: { name?: string } };
  incidents?: { data: Incident[] };
}

const Incidents = ({ auth, incidents: incidentsData }: IncidentsProps) => {
  // Use real data if available, otherwise fall back to mock data
  const incidents = incidentsData?.data || [
    {
      id: 1,
      title: 'Unauthorized Access Attempt',
      type: 'Security Breach',
      severity: 'high',
      status: 'open',
      guard: 'John Doe',
      site: 'Site A - Main Gate',
      client: 'ABC Corporation',
      reportedAt: '2024-01-15 14:30',
      description: 'Individual attempted to enter restricted area without proper authorization.',
      escalationLevel: 2
    },
    {
      id: 2,
      title: 'Equipment Malfunction',
      type: 'Technical Issue',
      severity: 'medium',
      status: 'in_progress',
      guard: 'Jane Smith',
      site: 'Site B - Warehouse',
      client: 'XYZ Ltd',
      reportedAt: '2024-01-15 13:45',
      description: 'Security camera system experiencing intermittent failures.',
      escalationLevel: 1
    },
    {
      id: 3,
      title: 'Guard Absent',
      type: 'Personnel Issue',
      severity: 'low',
      status: 'resolved',
      guard: 'Mike Johnson',
      site: 'Site C - Office Building',
      client: 'DEF Inc',
      reportedAt: '2024-01-15 12:00',
      description: 'Guard failed to report for scheduled shift.',
      escalationLevel: 0
    },
    {
      id: 4,
      title: 'Suspicious Activity',
      type: 'Security Alert',
      severity: 'high',
      status: 'open',
      guard: 'Sarah Wilson',
      site: 'Site D - Parking Lot',
      client: 'GHI Corp',
      reportedAt: '2024-01-15 11:15',
      description: 'Multiple individuals loitering near employee vehicles.',
      escalationLevel: 3
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100';
      case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-100';
    }
  };

  return (
    <ControlRoomLayout title="Incident Management" user={auth?.user as any}>
      <Head title="Incident Management" />

      <div className="space-y-6">
        {/* Incident Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Open Incidents</p>
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
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">In Progress</p>
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

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">High Priority</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">2</p>
                </div>
                <div className="h-8 w-8 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                  <span className="text-red-600 dark:text-red-400">⚠</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Incident List */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Recent Incidents</h3>
            <Link href={route('control-room.incidents.create')}>
              <Button className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">
                Create New Incident
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {incidents.map((incident) => (
                <div key={incident.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">{incident.title}</h4>
                        <Badge className={`text-xs ${getSeverityColor(incident.severity)}`}>
                          {incident.severity}
                        </Badge>
                        <Badge className={`text-xs ${getStatusColor(incident.status)}`}>
                          {incident.status.replace('_', ' ')}
                        </Badge>
                        {incident.escalationLevel > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            Escalation Level {incident.escalationLevel}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{incident.description}</p>
                      <div className="text-xs text-gray-500 dark:text-gray-500">
                        <span className="font-medium">Type:</span> {incident.type} • 
                        <span className="font-medium"> Guard:</span> {incident.guard} • 
                        <span className="font-medium"> Site:</span> {incident.site} • 
                        <span className="font-medium"> Client:</span> {incident.client} • 
                        <span className="font-medium"> Reported:</span> {incident.reportedAt}
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <Link href={route('control-room.incidents.show', incident.id)}>
                        <Button size="sm" variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600">
                          View
                        </Button>
                      </Link>
                      <Link href={route('control-room.incidents.edit', incident.id)}>
                        <Button size="sm" variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600">
                          Update
                        </Button>
                      </Link>
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
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Quick Actions</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button variant="outline" className="h-12 flex flex-col items-center justify-center space-y-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                <span className="text-lg">📝</span>
                <span className="text-sm">New Incident</span>
              </Button>
              <Button variant="outline" className="h-12 flex flex-col items-center justify-center space-y-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                <span className="text-lg">📊</span>
                <span className="text-sm">Incident Report</span>
              </Button>
              <Button variant="outline" className="h-12 flex flex-col items-center justify-center space-y-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                <span className="text-lg">🚨</span>
                <span className="text-sm">Emergency Alert</span>
              </Button>
              <Button variant="outline" className="h-12 flex flex-col items-center justify-center space-y-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                <span className="text-lg">📞</span>
                <span className="text-sm">Contact Support</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ControlRoomLayout>
  );
};

export default Incidents;
