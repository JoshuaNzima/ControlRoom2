import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';

interface SystemStatsProps {
  stats: {
    totalUsers: number;
    activeUsers: number;
    totalGuards: number;
    activeGuards: number;
    totalClients: number;
    totalSites: number;
    systemUptime: string;
    lastBackup: string;
  };
}

export default function SystemStats({ stats }: SystemStatsProps) {
  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      description: `${stats.activeUsers} active`,
      color: 'blue',
    },
    {
      title: 'Total Guards',
      value: stats.totalGuards,
      description: `${stats.activeGuards} active`,
      color: 'green',
    },
    {
      title: 'Total Clients',
      value: stats.totalClients,
      description: 'Active clients',
      color: 'purple',
    },
    {
      title: 'Total Sites',
      value: stats.totalSites,
      description: 'Monitored sites',
      color: 'orange',
    },
    {
      title: 'System Uptime',
      value: stats.systemUptime,
      description: 'Current uptime',
      color: 'gray',
    },
    {
      title: 'Last Backup',
      value: stats.lastBackup,
      description: 'Database backup',
      color: 'yellow',
    },
  ];

  const colorClasses = {
    blue: 'border-blue-500 bg-blue-50',
    green: 'border-green-500 bg-green-50',
    purple: 'border-purple-500 bg-purple-50',
    orange: 'border-orange-500 bg-orange-50',
    gray: 'border-gray-500 bg-gray-50',
    yellow: 'border-yellow-500 bg-yellow-50',
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {statCards.map((stat, index) => (
        <Card key={index} className={`${colorClasses[stat.color as keyof typeof colorClasses]} border-t-4`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {stat.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stat.value}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
