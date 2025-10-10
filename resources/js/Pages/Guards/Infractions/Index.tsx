import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import IconMapper from '@/Components/IconMapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';

interface Infraction {
  id: number;
  type: string;
  description: string;
  severity: 'minor' | 'moderate' | 'major';
  incident_date: string;
  status: 'pending' | 'reviewed' | 'resolved';
  guard: {
    id: number;
    name: string;
    employee_id: string;
    risk_level: string;
  };
  reporter: {
    name: string;
  };
  reviewer?: {
    name: string;
  };
}

interface PageProps {
  infractions: {
    data: Infraction[];
    meta: {
      current_page: number;
      last_page: number;
      total: number;
    };
  };
}

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

export default function Index({ infractions }: PageProps) {
  return (
    <AdminLayout title="Infractions">
      <Head title="Infractions" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Infractions</h1>
            <p className="mt-1 text-sm text-gray-600">
              Review and manage guard infractions
            </p>
          </div>
          <Link href={route('infractions.create')}>
            <Button>
              <IconMapper name="Plus" className="w-4 h-4 mr-2" />
              Record Infraction
            </Button>
          </Link>
        </div>

        <div className="space-y-4">
          {infractions.data.map((infraction) => (
            <Card key={infraction.id}>
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {infraction.guard.name}
                      <Badge variant="secondary" className={getRiskLevelColor(infraction.guard.risk_level)}>
                        {infraction.guard.risk_level.toUpperCase()}
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-gray-500">ID: {infraction.guard.employee_id}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getSeverityColor(infraction.severity)}>
                      {infraction.severity.toUpperCase()}
                    </Badge>
                    <Badge className={getStatusColor(infraction.status)}>
                      {infraction.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Type</h4>
                    <p className="mt-1">{infraction.type}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Description</h4>
                    <p className="mt-1">{infraction.description}</p>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <div>
                      <span>Reported by: {infraction.reporter.name}</span>
                      {infraction.reviewer && (
                        <span className="ml-4">Reviewed by: {infraction.reviewer.name}</span>
                      )}
                    </div>
                    <div>
                      {infraction.status === 'pending' ? (
                        <Link href={route('infractions.review', infraction.id)}>
                          <Button variant="outline" size="sm">
                            <IconMapper name="ClipboardCheck" className="w-4 h-4 mr-2" />
                            Review
                          </Button>
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pagination here if needed */}
      </div>
    </AdminLayout>
  );
}