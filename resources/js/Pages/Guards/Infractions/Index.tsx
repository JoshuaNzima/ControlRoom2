import React, { useState, useEffect } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import IconMapper from '@/Components/IconMapper';
import Modal from '@/Components/Modal';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import Select from '@/Components/Select';

interface Infraction {
  id: number;
  type: string;
  description: string;
  severity: 'minor' | 'moderate' | 'major';
  incident_date: string;
  status: 'pending' | 'reviewed' | 'resolved';
  resolution?: string;
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

interface Guard {
  id: number;
  name: string;
  employee_id: string;
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
  guards: Guard[];
  show_add?: number;
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

export default function Index({ infractions, guards, show_add }: PageProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedInfraction, setSelectedInfraction] = useState<Infraction | null>(null);

  const { data, setData, post, processing, errors, reset } = useForm({
    guard_id: '',
    type: '',
    description: '',
    severity: 'minor' as 'minor' | 'moderate' | 'major',
    incident_date: new Date().toISOString().split('T')[0],
  });

  const reviewForm = useForm({
    status: 'reviewed' as 'pending' | 'reviewed' | 'resolved',
    resolution: '',
  });

  // Open add modal if show_add query param is present
  useEffect(() => {
    if (show_add) {
      setShowAddModal(true);
    }
  }, [show_add]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('infractions.store'), {
      onSuccess: () => {
        setShowAddModal(false);
        reset();
      },
    });
  };

  const openReviewModal = (infraction: Infraction) => {
    setSelectedInfraction(infraction);
    reviewForm.setData('status', 'reviewed');
    reviewForm.setData('resolution', '');
    setShowReviewModal(true);
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInfraction) return;
    
    router.put(route('infractions.update-status', selectedInfraction.id), reviewForm.data, {
      onSuccess: () => {
        setShowReviewModal(false);
        setSelectedInfraction(null);
        reviewForm.reset();
      },
    });
  };

  return (
    <AdminLayout title="Infractions">
      <Head title="Infractions" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Infractions</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Review and manage guard infractions
            </p>
          </div>
          <Button onClick={() => setShowAddModal(true)} className="w-full sm:w-auto">
            <IconMapper name="Plus" className="w-4 h-4 mr-2" />
            Record Infraction
          </Button>
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
                      <span>Reported by: {infraction.reporter?.name || '-'}</span>
                      {infraction.reviewer && (
                        <span className="ml-4">Reviewed by: {infraction.reviewer.name}</span>
                      )}
                    </div>
                    <div>
                      {infraction.status === 'pending' ? (
                        <Button variant="outline" size="sm" onClick={() => openReviewModal(infraction)}>
                          <IconMapper name="ClipboardCheck" className="w-4 h-4 mr-2" />
                          Review
                        </Button>
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

      {/* Add Infraction Modal */}
      <Modal show={showAddModal} onClose={() => setShowAddModal(false)} maxWidth="2xl">
        <div className="p-4 sm:p-6 bg-white dark:bg-gray-950">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Record New Infraction</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="guard_id">Select Guard</Label>
              <Select
                value={data.guard_id}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setData('guard_id', e.target.value)}
                className="w-full mt-1"
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
                className="mt-1"
              />
              {errors.type && (
                <p className="mt-1 text-sm text-red-600">{errors.type}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="severity">Severity</Label>
                <Select
                  value={data.severity}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setData('severity', e.target.value as typeof data.severity)}
                  className="w-full mt-1"
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
                  className="mt-1"
                />
                {errors.incident_date && (
                  <p className="mt-1 text-sm text-red-600">{errors.incident_date}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={data.description}
                onChange={e => setData('description', e.target.value)}
                rows={4}
                placeholder="Provide details about the infraction..."
                className="mt-1"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowAddModal(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button type="submit" disabled={processing} className="w-full sm:w-auto bg-red-600 hover:bg-red-700">
                {processing ? 'Recording...' : 'Record Infraction'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Review Infraction Modal */}
      <Modal show={showReviewModal} onClose={() => setShowReviewModal(false)} maxWidth="lg">
        <div className="p-4 sm:p-6 bg-white dark:bg-gray-950">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Review Infraction</h2>
          
          {selectedInfraction && (
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Guard:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{selectedInfraction.guard.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Type:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{selectedInfraction.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Severity:</span>
                <Badge className={getSeverityColor(selectedInfraction.severity)}>
                  {selectedInfraction.severity.toUpperCase()}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Date:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{selectedInfraction.incident_date}</span>
              </div>
              {selectedInfraction.description && (
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400 block mb-1">Description:</span>
                  <p className="text-gray-900 dark:text-gray-100">{selectedInfraction.description}</p>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleReviewSubmit} className="space-y-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={reviewForm.data.status}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => reviewForm.setData('status', e.target.value as typeof reviewForm.data.status)}
                className="w-full mt-1"
              >
                <option value="reviewed">Reviewed</option>
                <option value="resolved">Resolved</option>
              </Select>
            </div>

            <div>
              <Label htmlFor="resolution">Resolution Notes</Label>
              <Textarea
                id="resolution"
                value={reviewForm.data.resolution}
                onChange={e => reviewForm.setData('resolution', e.target.value)}
                rows={3}
                placeholder="Add resolution notes..."
                className="mt-1"
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowReviewModal(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button type="submit" disabled={reviewForm.processing} className="w-full sm:w-auto bg-red-600 hover:bg-red-700">
                {reviewForm.processing ? 'Updating...' : 'Update Status'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </AdminLayout>
  );
}