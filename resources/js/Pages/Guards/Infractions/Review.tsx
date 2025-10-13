import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Label } from '@/Components/ui/label';
import Select from '@/Components/Select';
import { Textarea } from '@/Components/ui/textarea';
import { Badge } from '@/Components/ui/badge';

interface Guard {
  id: number;
  name: string;
  employee_id: string;
  risk_level: string;
}

interface Reporter {
  name: string;
}

interface Infraction {
  id: number;
  type: string;
  description: string;
  severity: 'minor' | 'moderate' | 'major';
  incident_date: string;
  status: 'pending' | 'reviewed' | 'resolved';
  guard: Guard;
  reporter: Reporter;
}

interface ReviewProps {
  infraction: Infraction;
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

export default function Review({ infraction }: ReviewProps) {
  const { data, setData, put, processing, errors } = useForm({
    status: infraction.status,
    resolution: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    put(route('infractions.update-status', infraction.id));
  };

  return (
    <AdminLayout title="Review Infraction">
      <Head title="Review Infraction" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <Card>
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
              <Badge className={getSeverityColor(infraction.severity)}>
                {infraction.severity.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Type</h4>
              <p className="mt-1">{infraction.type}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Description</h4>
              <p className="mt-1">{infraction.description}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Reported By</h4>
              <p className="mt-1">{infraction.reporter?.name || '-'}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 pt-6 border-t">
              <div>
                <Label htmlFor="status">Update Status</Label>
                  <Select 
                    value={data.status}
                    onChange={(e: any) => setData('status', e.target.value)}
                  >
                  <option value="pending">Pending</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="resolved">Resolved</option>
                </Select>
                {errors.status && (
                  <p className="mt-1 text-sm text-red-600">{errors.status}</p>
                )}
              </div>

              <div>
                <Label htmlFor="resolution">Resolution Notes</Label>
                <Textarea
                  id="resolution"
                  value={data.resolution}
                  onChange={e => setData('resolution', e.target.value)}
                  rows={4}
                  placeholder="Add notes about how this infraction was handled..."
                />
                {errors.resolution && (
                  <p className="mt-1 text-sm text-red-600">{errors.resolution}</p>
                )}
              </div>

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.history.back()}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={processing}>
                  Update Status
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}