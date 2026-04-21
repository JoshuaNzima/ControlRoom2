import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import OperationsLayout from '@/Layouts/OperationsLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import IconMapper from '@/Components/IconMapper';
import { Badge } from '@/Components/ui/badge';

interface Incident {
  id: number;
  title: string;
  description: string;
  severity: string;
  status: string;
  reporter?: { name: string };
  client?: { name: string };
  client_site?: { name: string };
  created_at: string;
}

interface Down {
  id: number;
  title: string;
  description: string;
  status: string;
  reporter?: { name: string };
  client?: { name: string };
  site?: { name: string };
  created_at: string;
}

interface Props {
  incidents: {
    data: Incident[];
  };
  downs: {
    data: Down[];
  };
  auth?: { user?: any };
}

export default function IncidentsReport({ incidents, downs, auth }: Props) {
  const user = auth?.user;
  const [activeTab, setActiveTab] = useState<'incidents' | 'downs'>('incidents');

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <OperationsLayout title="Incidents & Issues" user={user} showQrScanner={true}>
      <Head title="Incidents & Issues" />

      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-xl sm:text-2xl font-bold text-red-900 dark:text-gray-100">Incidents & Issues</h2>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={() => setActiveTab('incidents')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'incidents'
                ? 'text-red-600 border-b-2 border-red-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Incidents ({incidents.data.length})
          </button>
          <button
            onClick={() => setActiveTab('downs')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'downs'
                ? 'text-red-600 border-b-2 border-red-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Downs ({downs.data.length})
          </button>
        </div>

        {/* Incidents */}
        {activeTab === 'incidents' && (
          <div className="space-y-3">
            {incidents.data.map((incident) => (
              <Card key={incident.id} className="dark:bg-gray-900 dark:border-gray-800">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{incident.title}</h3>
                        <Badge className={getSeverityColor(incident.severity)}>{incident.severity}</Badge>
                        <Badge className={getStatusColor(incident.status)}>{incident.status}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{incident.description}</p>
                      <div className="flex gap-4 mt-2 text-xs text-gray-500">
                        <span>{incident.client?.name}</span>
                        <span>{incident.client_site?.name}</span>
                        <span>Reported by {incident.reporter?.name}</span>
                        <span>{new Date(incident.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {incidents.data.length === 0 && (
              <Card className="dark:bg-gray-900 dark:border-gray-800">
                <CardContent className="p-8 text-center">
                  <IconMapper name="alert-triangle" className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No incidents reported</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Downs */}
        {activeTab === 'downs' && (
          <div className="space-y-3">
            {downs.data.map((down) => (
              <Card key={down.id} className="dark:bg-gray-900 dark:border-gray-800">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{down.title}</h3>
                        <Badge className={getStatusColor(down.status)}>{down.status}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{down.description}</p>
                      <div className="flex gap-4 mt-2 text-xs text-gray-500">
                        <span>{down.client?.name}</span>
                        <span>{down.site?.name}</span>
                        <span>Reported by {down.reporter?.name}</span>
                        <span>{new Date(down.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {downs.data.length === 0 && (
              <Card className="dark:bg-gray-900 dark:border-gray-800">
                <CardContent className="p-8 text-center">
                  <IconMapper name="user-x" className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No downs reported</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </OperationsLayout>
  );
}
