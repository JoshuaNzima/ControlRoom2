import React, { useState, useCallback } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import ControlRoomLayout from '@/Layouts/ControlRoomLayout';
import Modal from '@/Components/Modal';
import { Card, CardContent, CardHeader } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import IconMapper from '@/Components/IconMapper';

interface Incident {
  id: number;
  title: string;
  type: string;
  severity: string;
  status: string;
  description: string;
  location: string;
  escalation_level: number;
  client_id?: number | null;
  client_site_id?: number | null;
  reporter?: { name: string };
  assigned_to?: { name: string };
  client?: { name: string };
  client_site?: { name: string };
  created_at: string;
  resolved_at?: string;
  resolved_by?: { name: string };
}

interface ShowIncidentProps {
  auth?: { user?: { name?: string } };
  incident: Incident;
}

const ShowIncident = ({ auth, incident }: ShowIncidentProps) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [siteSearch, setSiteSearch] = useState('');
  const [siteResults, setSiteResults] = useState<Array<{ id: number; name: string; client_name: string }>>([]);
  const [loadingSites, setLoadingSites] = useState(false);
  const [selectedSiteName, setSelectedSiteName] = useState<string>(
    incident.client?.name && incident.client_site?.name ? `${incident.client?.name} • ${incident.client_site?.name}` : ''
  );

  const { data, setData, put, processing, errors } = useForm({
    title: incident.title || '',
    type: incident.type || '',
    severity: incident.severity || '',
    description: incident.description || '',
    location: incident.location || '',
    status: incident.status || 'open',
    client_id: incident.client_id ? String(incident.client_id) : '',
    client_site_id: incident.client_site_id ? String(incident.client_site_id) : '',
  });

  const loadSites = useCallback(async () => {
    try {
      setLoadingSites(true);
      const params = new URLSearchParams();
      if (siteSearch) params.set('search', siteSearch);
      const url = `${route('control-room.clients.sites.json')}?${params.toString()}`;
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      const list = await res.json();
      setSiteResults(Array.isArray(list) ? list : []);
    } catch {
      setSiteResults([]);
    } finally {
      setLoadingSites(false);
    }
  }, [siteSearch]);

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    put(route('control-room.incidents.update', incident.id), {
      onSuccess: () => {
        setShowEditModal(false);
      },
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100';
      case 'escalated': return 'bg-coin-100 text-coin-900 dark:bg-coin-900/30 dark:text-coin-200';
      case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
      case 'closed': return 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-100';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-100';
    }
  };

  const handleEscalate = () => {
    router.post(route('control-room.incidents.escalate', incident.id));
  };

  const handleResolve = () => {
    router.post(route('control-room.incidents.resolve', incident.id));
  };

  return (
    <ControlRoomLayout title={`Incident: ${incident.title}`} user={auth?.user as any}>
      <Head title={`Incident: ${incident.title}`} />

      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Hero Header */}
        <div className="bg-gradient-to-r from-coin-700 via-coin-600 to-coin-500 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <IconMapper name="ShieldAlert" size={24} />
                <h1 className="text-xl sm:text-2xl font-bold">{incident.title}</h1>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={`text-xs ${getSeverityColor(incident.severity)}`}>
                  {incident.severity}
                </Badge>
                <Badge className={`text-xs ${getStatusColor(incident.status)}`}>
                  {incident.status.replace('_', ' ')}
                </Badge>
                {incident.escalation_level > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    <IconMapper name="TrendingUp" size={12} className="mr-1" />
                    Level {incident.escalation_level}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Link
                href={route('control-room.incidents.print', incident.id)}
                target="_blank"
                rel="noopener"
              >
                <Button className="w-full sm:w-auto bg-white text-coin-700 hover:bg-coin-50">
                  <IconMapper name="Printer" size={16} className="mr-2" />
                  Print
                </Button>
              </Link>
              <Link
                href={route('control-room.incidents.pdf', incident.id)}
                target="_blank"
                rel="noopener"
              >
                <Button variant="outline" className="w-full sm:w-auto dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                  Download PDF
                </Button>
              </Link>
              <Button onClick={() => setShowEditModal(true)} variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600">
                  Edit
                </Button>
              {incident.status !== 'resolved' && incident.status !== 'closed' && (
                <>
                  <Button
                    onClick={handleEscalate}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                  >
                    Escalate
                  </Button>
                  <Button
                    onClick={handleResolve}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Resolve
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Incident Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Incident Details</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Description</h4>
                  <p className="text-gray-600 dark:text-gray-400">{incident.description}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Location</h4>
                  <p className="text-gray-600 dark:text-gray-400">{incident.location}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Type</h4>
                  <p className="text-gray-600 dark:text-gray-400">{incident.type.replace('_', ' ')}</p>
                </div>
              </CardContent>
            </Card>

            {/* Comments Section */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Comments</h3>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No comments yet. Be the first to add a comment.
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Incident Information Sidebar */}
          <div className="space-y-6">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Incident Information</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Reporter</h4>
                  <p className="text-gray-600 dark:text-gray-400">{incident.reporter?.name || 'Unknown'}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Assigned To</h4>
                  <p className="text-gray-600 dark:text-gray-400">{incident.assigned_to?.name || 'Unassigned'}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Client</h4>
                  <p className="text-gray-600 dark:text-gray-400">{incident.client?.name || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Site</h4>
                  <p className="text-gray-600 dark:text-gray-400">{incident.client_site?.name || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Created</h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    {new Date(incident.created_at).toLocaleString()}
                  </p>
                </div>
                {incident.resolved_at && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">Resolved</h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      {new Date(incident.resolved_at).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      by {incident.resolved_by?.name || 'Unknown'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Quick Actions</h3>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  Assign to User
                </Button>
                <Button
                  variant="outline"
                  className="w-full dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  Add Comment
                </Button>
                <Button
                  variant="outline"
                  className="w-full dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  Create Related Ticket
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Edit Incident Modal */}
      <Modal show={showEditModal} onClose={() => setShowEditModal(false)} maxWidth="2xl">
        <div className="p-4 sm:p-6 bg-white dark:bg-gray-900">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Edit Incident</h2>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <Label className="text-gray-700 dark:text-gray-300">Title *</Label>
              <Input
                value={data.title}
                onChange={(e) => setData('title', e.target.value)}
                className="mt-1 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-700 dark:text-gray-300">Type *</Label>
                <select
                  value={data.type}
                  onChange={(e) => setData('type', e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-coin-500"
                >
                  <option value="security_breach">Security Breach</option>
                  <option value="equipment_failure">Equipment Failure</option>
                  <option value="personnel_issue">Personnel Issue</option>
                  <option value="other">Other</option>
                </select>
                {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type}</p>}
              </div>

              <div>
                <Label className="text-gray-700 dark:text-gray-300">Severity *</Label>
                <select
                  value={data.severity}
                  onChange={(e) => setData('severity', e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-coin-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
                {errors.severity && <p className="text-red-500 text-sm mt-1">{errors.severity}</p>}
              </div>
            </div>

            <div>
              <Label className="text-gray-700 dark:text-gray-300">Status *</Label>
              <select
                value={data.status}
                onChange={(e) => setData('status', e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-coin-500"
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="escalated">Escalated</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              {errors.status && <p className="text-red-500 text-sm mt-1">{errors.status}</p>}
            </div>

            <div>
              <Label className="text-gray-700 dark:text-gray-300">Location *</Label>
              <Input
                value={data.location}
                onChange={(e) => setData('location', e.target.value)}
                className="mt-1 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
              />
              {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Label className="text-gray-700 dark:text-gray-300">Link Site (optional)</Label>
                  <Input
                    value={siteSearch}
                    onChange={(e) => setSiteSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), loadSites())}
                    placeholder="Search site or client name"
                    className="mt-1 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <Button type="button" onClick={loadSites} variant="outline" className="h-9 dark:border-gray-700 dark:text-gray-300">
                  {loadingSites ? 'Loading…' : 'Search'}
                </Button>
              </div>
              {selectedSiteName && (
                <div className="text-xs text-gray-500">Selected site: <span className="font-medium text-gray-800 dark:text-gray-200">{selectedSiteName}</span></div>
              )}
              <div className="max-h-32 overflow-y-auto rounded border border-gray-200 dark:border-gray-700">
                {siteResults.length === 0 ? (
                  <div className="p-2 text-sm text-gray-500">{loadingSites ? 'Loading…' : 'No sites found'}</div>
                ) : (
                  <ul>
                    {siteResults.map((s) => (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setData('client_site_id', String(s.id));
                            setSelectedSiteName(`${s.client_name} • ${s.name}`);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        >
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{s.client_name}</div>
                          <div className="text-xs text-gray-500">{s.name}</div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div>
              <Label className="text-gray-700 dark:text-gray-300">Description *</Label>
              <textarea
                value={data.description}
                onChange={(e) => setData('description', e.target.value)}
                rows={5}
                className="w-full mt-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-coin-500"
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowEditModal(false)} className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 w-full sm:w-auto">
                Cancel
              </Button>
              <Button type="submit" disabled={processing} className="bg-coin-600 hover:bg-coin-700 text-white w-full sm:w-auto">
                {processing ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </ControlRoomLayout>
  );
};

export default ShowIncident;
