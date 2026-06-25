import React from 'react';
import IconMapper from '@/Components/IconMapper';
import { Card } from '@/Components/ui/card';
import EmptyState from '@/Components/ui/empty-state';

interface Zone {
  id: number;
  name: string;
  coverage: number;
  guards: number;
  required_guards: number;
  sites: number;
}

interface ZonesTabProps {
  zones: Zone[];
}

export default function ZonesTab({ zones }: ZonesTabProps) {
  const safeZones: Zone[] = zones || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Zone Coverage Status</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Guard deployment across all zones</p>
          </div>
        </div>

        <div className="space-y-4">
          {safeZones.length > 0 ? (
            safeZones.map((zone) => (
              <div
                key={zone.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-gray-100">{zone.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {zone.guards}/{zone.required_guards} Guards • {zone.sites} Sites
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-2">
                    <div
                      className={`h-2 rounded-full ${
                        zone.coverage >= 90 ? 'bg-green-500' : zone.coverage >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(zone.coverage, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className={`text-2xl font-bold ${
                    zone.coverage >= 90 ? 'text-green-600 dark:text-green-400' :
                    zone.coverage >= 70 ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-red-600 dark:text-red-400'
                  }`}>
                    {zone.coverage.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {zone.coverage >= 90 ? 'Excellent' : zone.coverage >= 70 ? 'Good' : zone.coverage >= 50 ? 'Fair' : 'Poor'}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              title="No zones configured"
              description="Zone coverage will appear here once zones are configured."
              size="sm"
            />
          )}
        </div>
      </Card>
    </div>
  );
}
