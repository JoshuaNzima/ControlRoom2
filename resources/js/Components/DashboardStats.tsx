import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';

interface DashboardStatsProps {
  stats: {
    totalGuards: number;
    activeGuards: number;
    totalClients: number;
    totalSites: number;
    totalRevenue: number;
    monthlyRevenue: number;
  };
}

export default function DashboardStats({ stats }: DashboardStatsProps) {
  const statCards = [
    {
      title: 'Total Guards',
      value: stats.totalGuards,
      description: `${stats.activeGuards} active`,
      color: 'blue',
    },
    {
      title: 'Total Clients',
      value: stats.totalClients,
      description: 'Active clients',
      color: 'green',
    },
    {
      title: 'Total Sites',
      value: stats.totalSites,
      description: 'Monitored sites',
      color: 'purple',
    },
    {
      title: 'Monthly Revenue',
      value: `MWK ${stats.monthlyRevenue?.toLocaleString() || 0}`,
      description: `Total: MWK ${stats.totalRevenue?.toLocaleString() || 0}`,
      color: 'yellow',
    },
  ];

  const colorClasses = {
    blue: 'border-blue-500 bg-blue-50',
    green: 'border-green-500 bg-green-50',
    purple: 'border-purple-500 bg-purple-50',
    yellow: 'border-yellow-500 bg-yellow-50',
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
