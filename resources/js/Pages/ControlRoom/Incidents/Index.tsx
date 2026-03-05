import React from 'react';
import { Head, Link } from '@inertiajs/react';
import ControlRoomLayout from '@/Layouts/ControlRoomLayout';
import { Card, CardContent, CardHeader } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import IconMapper from '@/Components/IconMapper';

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
      case 'escalated': return 'bg-coin-100 text-coin-900 dark:bg-coin-900/30 dark:text-coin-200';
      case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
      case 'closed': return 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-100';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-100';
    }
  };

  return (
    <ControlRoomLayout title="Incident Management" user={auth?.user as any}>
      <Head title="Incident Management" />

      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Hero Header */}
        <div className="bg-gradient-to-r from-coin-700 via-coin-600 to-coin-500 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
                <IconMapper name="ShieldAlert" size={28} />
                Incident Management
              </h1>
              <p className="mt-1 text-coin-100 text-sm">
                Track, manage, and resolve security incidents
              </p>
            </div>
            <Link href={route('control-room.incidents.create')}>
              <Button className="w-full sm:w-auto bg-white text-coin-700 hover:bg-coin-50">
                <IconMapper name="Plus" size={16} className="mr-2" />
                New Incident
              </Button>
            </Link>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            <div className="bg-white/10 backdrop-blur rounded-xl p-3">
              <div className="flex items-center gap-2">
                <IconMapper name="AlertCircle" size={16} className="text-red-200" />
                <span className="text-xs text-coin-100">Open</span>
              </div>
              <div className="text-2xl font-bold mt-1">
                {incidents.data.filter(i => i.status === 'open').length}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-3">
              <div className="flex items-center gap-2">
                <IconMapper name="Clock" size={16} className="text-yellow-200" />
                <span className="text-xs text-coin-100">In Progress</span>
              </div>
              <div className="text-2xl font-bold mt-1">
                {incidents.data.filter(i => i.status === 'in_progress').length}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-3">
              <div className="flex items-center gap-2">
                <IconMapper name="CheckCircle" size={16} className="text-green-200" />
                <span className="text-xs text-coin-100">Resolved</span>
              </div>
              <div className="text-2xl font-bold mt-1">
                {incidents.data.filter(i => i.status === 'resolved').length}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-3">
              <div className="flex items-center gap-2">
                <IconMapper name="AlertTriangle" size={16} className="text-orange-200" />
                <span className="text-xs text-coin-100">High Priority</span>
              </div>
              <div className="text-2xl font-bold mt-1">
                {incidents.data.filter(i => i.severity === 'high' || i.severity === 'critical').length}
              </div>
            </div>
          </div>
        </div>

        {/* Incidents List */}
        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <IconMapper name="List" size={20} className="text-coin-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">All Incidents</h3>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {incidents.data.map((incident) => (
                <div key={incident.id} className="p-4 bg-gray-50 dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-coin-300 dark:hover:border-coin-700 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Link href={route('control-room.incidents.show', incident.id)}>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 hover:text-coin-700 dark:hover:text-coin-200">
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
                    <div className="flex flex-col sm:flex-row gap-2 sm:ml-4">
                      <Link href={route('control-room.incidents.show', incident.id)}>
                        <Button size="sm" variant="outline" className="w-full sm:w-auto dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
                          <IconMapper name="Eye" size={14} className="mr-1.5" />
                          View
                        </Button>
                      </Link>
                      <Link href={route('control-room.incidents.edit', incident.id)}>
                        <Button size="sm" variant="outline" className="w-full sm:w-auto dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
                          <IconMapper name="Pencil" size={14} className="mr-1.5" />
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
