import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { format } from 'date-fns';
import IconMapper from '@/Components/IconMapper';

interface InfractionCardProps {
  infractions: Array<{
    id: number;
    type: string;
    severity: string;
    status: string;
    incident_date: string;
    description: string;
  }>;
  riskLevel: string;
  infractionCount: number;
}

const getRiskLevelDetails = (level: string) => {
  switch (level) {
    case 'high':
      return {
        icon: 'AlertTriangle',
        color: 'text-red-600',
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'High Risk - Immediate Action Required',
      };
    case 'warning':
      return {
        icon: 'AlertCircle',
        color: 'text-yellow-600',
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        text: 'Warning Level - Close Monitoring Required',
      };
    default:
      return {
        icon: 'Check',
        color: 'text-green-600',
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'Normal Standing',
      };
  }
};

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'minor':
      return 'bg-yellow-100 text-yellow-800';
    case 'moderate':
      return 'bg-orange-100 text-orange-800';
    case 'major':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'reviewed':
      return 'bg-blue-100 text-blue-800';
    case 'resolved':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function InfractionCard({ infractions, riskLevel, infractionCount }: InfractionCardProps) {
  const riskDetails = getRiskLevelDetails(riskLevel);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Infractions & Risk Assessment</span>
          <Badge variant="outline" className={`${riskDetails.bg} ${riskDetails.color}`}>
            {infractionCount} Infractions
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Risk Level Indicator */}
        <div className={`p-4 rounded-lg border ${riskDetails.border} ${riskDetails.bg}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${riskDetails.bg}`}>
              <IconMapper name={riskDetails.icon} className={`w-6 h-6 ${riskDetails.color}`} />
            </div>
            <div>
              <h4 className={`font-semibold ${riskDetails.color}`}>
                {riskLevel.toUpperCase()} RISK LEVEL
              </h4>
              <p className="text-sm text-gray-600">{riskDetails.text}</p>
            </div>
          </div>
        </div>

        {/* Recent Infractions */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-700">Recent Infractions</h4>
          {infractions.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No recent infractions recorded</p>
          ) : (
            infractions.map(infraction => (
              <div
                key={infraction.id}
                className="p-4 rounded-lg border border-gray-200 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-medium">{infraction.type}</h5>
                    <p className="text-sm text-gray-500">
                      {format(new Date(infraction.incident_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getSeverityColor(infraction.severity)}>
                      {infraction.severity}
                    </Badge>
                    <Badge className={getStatusColor(infraction.status)}>
                      {infraction.status}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-gray-600">{infraction.description}</p>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}