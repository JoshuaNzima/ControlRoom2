import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Button } from '@/Components/ui/button';
import { Label } from '@/Components/ui/label';
import Select from '@/Components/Select';
import { Textarea } from '@/Components/ui/textarea';

interface Guard {
  id: number;
  name: string;
  employee_id: string;
}

interface CreateProps {
  guards: Guard[];
}

export default function Create({ guards }: CreateProps) {
  const { data, setData, post, processing, errors } = useForm({
    guard_id: '',
    type: '',
    description: '',
    severity: 'minor',
    incident_date: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('infractions.store'));
  };

  return (
    <AdminLayout title="Record Infraction">
      <Head title="Record Infraction" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card>
          <CardHeader>
            <CardTitle>Record New Infraction</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="guard_id">Select Guard</Label>
                <Select 
                  value={data.guard_id}
                  onChange={(e: any) => setData('guard_id', e.target.value)}
                >
                  <option value="">Select a guard...</option>
                  {guards.map(guard => (
                    <option key={guard.id} value={guard.id}>
                      {guard.name} ({guard.employee_id})
                    </option>
                  ))}
                </Select>
                {errors.guard_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.guard_id}</p>
                )}
              </div>

              <div>
                <Label htmlFor="type">Type of Infraction</Label>
                <Input
                  id="type"
                  type="text"
                  value={data.type}
                  onChange={e => setData('type', e.target.value)}
                  placeholder="e.g., Late Arrival, Misconduct, etc."
                />
                {errors.type && (
                  <p className="mt-1 text-sm text-red-600">{errors.type}</p>
                )}
              </div>

              <div>
                <Label htmlFor="severity">Severity</Label>
                <Select 
                  value={data.severity}
                  onChange={(e: any) => setData('severity', e.target.value)}
                >
                  <option value="minor">Minor</option>
                  <option value="moderate">Moderate</option>
                  <option value="major">Major</option>
                </Select>
                {errors.severity && (
                  <p className="mt-1 text-sm text-red-600">{errors.severity}</p>
                )}
              </div>

              <div>
                <Label htmlFor="incident_date">Incident Date</Label>
                <Input
                  id="incident_date"
                  type="date"
                  value={data.incident_date}
                  onChange={e => setData('incident_date', e.target.value)}
                />
                {errors.incident_date && (
                  <p className="mt-1 text-sm text-red-600">{errors.incident_date}</p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={data.description}
                  onChange={e => setData('description', e.target.value)}
                  rows={4}
                  placeholder="Provide details about the infraction..."
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description}</p>
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
                  Record Infraction
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}