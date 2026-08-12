import React from 'react';
import IconMapper from '@/Components/IconMapper';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import EmptyState from '@/Components/ui/empty-state';

interface RecentIncident {
  id: number;
  title: string;
  type: string;
  status: string;
  severity: string;
  guard_name: string;
  site_name: string;
  client_name: string;
  created_at: string;
  escalation_level: number;
}

interface ActiveAlerts {
  high_priority: number;
  medium_priority: number;
  low_priority: number;
  attendance_alerts: number;
  camera_alerts: number;
}

interface IncidentsTabProps {
  recentIncidents: RecentIncident[];
  activeAlerts: ActiveAlerts;
  safeRoute: (name: string, params?: any) => string;
}

export default function IncidentsTab({ recentIncidents, activeAlerts, safeRoute }: IncidentsTabProps) {
  const safeRecentIncidents = recentIncidents || [];
  const safeActiveAlerts = activeAlerts || {
    high_priority: 0, medium_priority: 0, low_priority: 0,
    attendance_alerts: 0, camera_alerts: 0,
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
      case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Active Alerts Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-600 rounded-lg">
              <IconMapper name="AlertOctagon" size={20} className="text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{safeActiveAlerts.high_priority}</p>
              <p className="text-xs text-red-700 dark:text-red-300">High Priority</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-600 rounded-lg">
              <IconMapper name="AlertTriangle" size={20} className="text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{safeActiveAlerts.medium_priority}</p>
              <p className="text-xs text-amber-700 dark:text-amber-300">Medium Priority</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <IconMapper name="Users" size={20} className="text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{safeActiveAlerts.attendance_alerts}</p>
              <p className="text-xs text-blue-700 dark:text-blue-300">Attendance Alerts</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-600 rounded-lg">
              <IconMapper name="Video" size={20} className="text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{safeActiveAlerts.camera_alerts}</p>
              <p className="text-xs text-purple-700 dark:text-purple-300">Camera Alerts</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Incidents */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Recent Incidents</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Latest incidents and their status</p>
          </div>
          <Button variant="outline" onClick={() => window.location.href = safeRoute('control-room.tickets.index')}>
            View All
          </Button>
        </div>

        <div className="space-y-3">
          {safeRecentIncidents.length > 0 ? (
            safeRecentIncidents.map((incident) => (
              <div
                key={incident.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-gray-100">{incident.title}</span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${getSeverityColor(incident.severity)}`}>
                      {incident.severity}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {incident.guard_name} • {incident.site_name} • {incident.client_name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">{incident.created_at}</div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(incident.status)}`}>
                    {incident.status}
                  </span>
                  {incident.escalation_level > 0 && (
                    <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                      Escalation Level {incident.escalation_level}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              title="No recent incidents"
              description="You're all clear right now. New incidents will show up here."
              size="sm"
            />
          )}
        </div>
      </Card>
    </div>
  );
}
