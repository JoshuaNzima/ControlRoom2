import React from 'react';
import { Head } from '@inertiajs/react';
import ZoneCommanderLayout from '@/Layouts/ZoneCommanderLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import IconMapper from '@/Components/IconMapper';
import { format } from 'date-fns';

interface Site {
  id: number;
  name: string;
  client_name: string;
  guard_count: number;
  attendance_today: number;
}

interface Guard {
  id: number;
  name: string;
  risk_level: string;
  infraction_count: number;
  current_site?: {
    name: string;
    client_name: string;
  };
}

interface Alert {
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  created_at: string;
}

interface ZoneDashboardProps {
  zone: {
    id: number;
    name: string;
    code: string;
    total_sites: number;
    total_guards: number;
    attendance_rate: number;
  };
  sites: Site[];
  at_risk_guards: Guard[];
  recent_alerts: Alert[];
}

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'high':
      return 'bg-red-100 text-red-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'low':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getRiskLevelColor = (level: string) => {
  switch (level) {
    case 'normal':
      return 'bg-green-100 text-green-800';
    case 'warning':
      return 'bg-yellow-100 text-yellow-800';
    case 'high':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function ZoneDashboard({ zone, sites, at_risk_guards, recent_alerts }: ZoneDashboardProps) {
  return (
    <ZoneCommanderLayout title="Zone Dashboard">
      <Head title={`${zone.name} Zone Dashboard`} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Zone Overview */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 rounded-2xl shadow-xl p-8 text-white">
          <h1 className="text-3xl font-bold mb-2">{zone.name} Zone Dashboard</h1>
          <p className="text-indigo-100">Zone Code: {zone.code}</p>
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-sm opacity-90">Total Sites</p>
              <p className="text-2xl font-bold">{zone.total_sites}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-sm opacity-90">Total Guards</p>
              <p className="text-2xl font-bold">{zone.total_guards}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-sm opacity-90">Attendance Rate</p>
              <p className="text-2xl font-bold">{zone.attendance_rate}%</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Site Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Sites Overview</span>
                <Button variant="outline" size="sm">View All Sites</Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sites.map(site => (
                  <div key={site.id} className="p-4 rounded-lg border">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{site.name}</h4>
                        <p className="text-sm text-gray-500">{site.client_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{site.guard_count} Guards</p>
                        <p className="text-sm text-gray-500">{site.attendance_today} Present Today</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* At-Risk Guards */}
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>At-Risk Guards</span>
                <Button variant="outline" size="sm">View All Guards</Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {at_risk_guards.map(guard => (
                  <div key={guard.id} className="p-4 rounded-lg border">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{guard.name}</h4>
                        <p className="text-sm text-gray-500">
                          {guard.current_site 
                            ? `${guard.current_site.client_name} - ${guard.current_site.name}`
                            : 'Unassigned'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(guard.risk_level)}`}>
                          {guard.risk_level.toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-500">
                          {guard.infraction_count} infractions
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recent_alerts.map((alert, index) => (
                <div key={index} className="flex items-start gap-4 p-4 rounded-lg border">
                  <div className={`p-2 rounded-full ${getSeverityColor(alert.severity)}`}>
                    <IconMapper name="AlertTriangle" className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h4 className="font-medium">{alert.type}</h4>
                      <span className="text-sm text-gray-500">
                        {format(new Date(alert.created_at), 'MMM d, HH:mm')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </ZoneCommanderLayout>
  );
}