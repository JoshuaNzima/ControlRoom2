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

interface IncidentsIndexProps {
  auth?: { user?: { name?: string } };
  incidents: { data: Incident[] };
}

const IncidentsIndex = ({ auth, incidents }: IncidentsIndexProps) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100';
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
      case 'closed': return 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-100';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-100';
    }
  };

  return (
    <ControlRoomLayout title="Incident Management" user={auth?.user as any}>
      <Head title="Incident Management" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Incident Management</h1>
          <Link href={route('control-room.incidents.create')}>
            <Button className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">
              Create New Incident
            </Button>
          </Link>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Open Incidents</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {incidents.data.filter(i => i.status === 'open').length}
                  </p>
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
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {incidents.data.filter(i => i.status === 'in_progress').length}
                  </p>
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
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {incidents.data.filter(i => i.status === 'resolved').length}
                  </p>
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
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {incidents.data.filter(i => i.severity === 'high' || i.severity === 'critical').length}
                  </p>
                </div>
                <div className="h-8 w-8 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                  <span className="text-red-600 dark:text-red-400">⚠</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Incidents List */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">All Incidents</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {incidents.data.map((incident) => (
                <div key={incident.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Link href={route('control-room.incidents.show', incident.id)}>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400">
                            {incident.title}
                          </h4>
                        </Link>
                        <Badge className={`text-xs ${getSeverityColor(incident.severity)}`}>
                          {incident.severity}
                        </Badge>
                        <Badge className={`text-xs ${getStatusColor(incident.status)}`}>
                          {incident.status.replace('_', ' ')}
                        </Badge>
                        {incident.escalation_level > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            Escalation Level {incident.escalation_level}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Type:</span> {incident.type.replace('_', ' ')} • 
                        <span className="font-medium"> Reporter:</span> {incident.reporter?.name || 'Unknown'} • 
                        <span className="font-medium"> Assigned:</span> {incident.assigned_to?.name || 'Unassigned'} • 
                        <span className="font-medium"> Created:</span> {new Date(incident.created_at).toLocaleDateString()}
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
                          Edit
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </ControlRoomLayout>
  );
};

export default IncidentsIndex;
