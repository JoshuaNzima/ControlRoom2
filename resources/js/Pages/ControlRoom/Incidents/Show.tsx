import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
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
  description: string;
  location: string;
  escalation_level: number;
  reporter?: { name: string };
  assigned_to?: { name: string };
  client?: { name: string };
  client_site?: { name: string };
  created_at: string;
  resolved_at?: string;
  resolved_by?: { name: string };
}

interface ShowIncidentProps {
  auth?: { user?: { name?: string } };
  incident: Incident;
}

const ShowIncident = ({ auth, incident }: ShowIncidentProps) => {
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

  const handleEscalate = () => {
    router.post(route('control-room.incidents.escalate', incident.id));
  };

  const handleResolve = () => {
    router.post(route('control-room.incidents.resolve', incident.id));
  };

  return (
    <ControlRoomLayout title={`Incident: ${incident.title}`} user={auth?.user as any}>
      <Head title={`Incident: ${incident.title}`} />

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Incident Header */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{incident.title}</h1>
              <div className="flex items-center space-x-2 mt-2">
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
            </div>
            <div className="flex space-x-2">
              <Link href={route('control-room.incidents.edit', incident.id)}>
                <Button variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600">
                  Edit
                </Button>
              </Link>
              {incident.status !== 'resolved' && incident.status !== 'closed' && (
                <>
                  <Button
                    onClick={handleEscalate}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                  >
                    Escalate
                  </Button>
                  <Button
                    onClick={handleResolve}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Resolve
                  </Button>
                </>
              )}
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Incident Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Incident Details</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Description</h4>
                  <p className="text-gray-600 dark:text-gray-400">{incident.description}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Location</h4>
                  <p className="text-gray-600 dark:text-gray-400">{incident.location}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Type</h4>
                  <p className="text-gray-600 dark:text-gray-400">{incident.type.replace('_', ' ')}</p>
                </div>
              </CardContent>
            </Card>

            {/* Comments Section */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Comments</h3>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No comments yet. Be the first to add a comment.
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Incident Information Sidebar */}
          <div className="space-y-6">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Incident Information</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Reporter</h4>
                  <p className="text-gray-600 dark:text-gray-400">{incident.reporter?.name || 'Unknown'}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Assigned To</h4>
                  <p className="text-gray-600 dark:text-gray-400">{incident.assigned_to?.name || 'Unassigned'}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Client</h4>
                  <p className="text-gray-600 dark:text-gray-400">{incident.client?.name || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Site</h4>
                  <p className="text-gray-600 dark:text-gray-400">{incident.client_site?.name || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Created</h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    {new Date(incident.created_at).toLocaleString()}
                  </p>
                </div>
                {incident.resolved_at && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">Resolved</h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      {new Date(incident.resolved_at).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      by {incident.resolved_by?.name || 'Unknown'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Quick Actions</h3>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  Assign to User
                </Button>
                <Button
                  variant="outline"
                  className="w-full dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  Add Comment
                </Button>
                <Button
                  variant="outline"
                  className="w-full dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  Create Related Ticket
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ControlRoomLayout>
  );
};

export default ShowIncident;
