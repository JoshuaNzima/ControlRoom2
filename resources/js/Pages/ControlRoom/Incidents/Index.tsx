import React, { useState, useEffect, useCallback } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
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
  escalation_level: number;
  reporter?: { name: string };
  assigned_to?: { name: string };
  client?: { name: string };
  client_site?: { name: string };
  created_at: string;
}

interface IncidentsIndexProps {
  auth?: { user?: { name?: string } };
  incidents: { data: Incident[] };
  show_add?: number;
}

const IncidentsIndex = ({ auth, incidents, show_add }: IncidentsIndexProps) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [siteSearch, setSiteSearch] = useState('');
  const [siteResults, setSiteResults] = useState<Array<{ id: number; name: string; client_name: string }>>([]);
  const [loadingSites, setLoadingSites] = useState(false);
  const [selectedSiteName, setSelectedSiteName] = useState<string>('');

  const [guardSearch, setGuardSearch] = useState('');
  const [guardResults, setGuardResults] = useState<Array<{ id: number; name: string; employee_id?: string }>>([]);
  const [loadingGuards, setLoadingGuards] = useState(false);
  const [selectedGuardName, setSelectedGuardName] = useState<string>('');

  const { data, setData, post, processing, errors, reset } = useForm({
    title: '',
    type: '',
    severity: '',
    description: '',
    location: '',
    client_id: '',
    client_site_id: '',
    guard_id: '',
    flag_guard: false as boolean,
    flag_reason: '',
    flag_details: '',
  });

  // Open add modal if show_add query param is present
  useEffect(() => {
    if (show_add) {
      setShowAddModal(true);
    }
  }, [show_add]);

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

  const loadGuards = useCallback(async () => {
    try {
      setLoadingGuards(true);
      const params = new URLSearchParams();
      if (guardSearch) params.set('q', guardSearch);
      const url = `${route('control-room.guards.search')}?${params.toString()}`;
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      const list = await res.json();
      setGuardResults(Array.isArray(list) ? list : []);
    } catch {
      setGuardResults([]);
    } finally {
      setLoadingGuards(false);
    }
  }, [guardSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('control-room.incidents.store'), {
      onSuccess: () => {
        setShowAddModal(false);
        reset();
        setSelectedSiteName('');
        setSelectedGuardName('');
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

  return (
    <ControlRoomLayout title="Incident Management" user={auth?.user as any}>
      <Head title="Incident Management" />

      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Hero Header */}
        <div className="bg-gradient-to-r from-coin-700 via-coin-600 to-coin-500 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
                <IconMapper name="ShieldAlert" size={28} />
                Incident Management
              </h1>
              <p className="mt-1 text-coin-100 text-sm">
                Track, manage, and resolve security incidents
              </p>
            </div>
            <Button onClick={() => setShowAddModal(true)} className="w-full sm:w-auto bg-white text-coin-700 hover:bg-coin-50">
                <IconMapper name="Plus" size={16} className="mr-2" />
                New Incident
              </Button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            <div className="bg-white/10 backdrop-blur rounded-xl p-3">
              <div className="flex items-center gap-2">
                <IconMapper name="AlertCircle" size={16} className="text-red-200" />
                <span className="text-xs text-coin-100">Open</span>
              </div>
              <div className="text-2xl font-bold mt-1">
                {incidents.data.filter(i => i.status === 'open').length}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-3">
              <div className="flex items-center gap-2">
                <IconMapper name="Clock" size={16} className="text-yellow-200" />
                <span className="text-xs text-coin-100">In Progress</span>
              </div>
              <div className="text-2xl font-bold mt-1">
                {incidents.data.filter(i => i.status === 'in_progress').length}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-3">
              <div className="flex items-center gap-2">
                <IconMapper name="CheckCircle" size={16} className="text-green-200" />
                <span className="text-xs text-coin-100">Resolved</span>
              </div>
              <div className="text-2xl font-bold mt-1">
                {incidents.data.filter(i => i.status === 'resolved').length}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-3">
              <div className="flex items-center gap-2">
                <IconMapper name="AlertTriangle" size={16} className="text-orange-200" />
                <span className="text-xs text-coin-100">High Priority</span>
              </div>
              <div className="text-2xl font-bold mt-1">
                {incidents.data.filter(i => i.severity === 'high' || i.severity === 'critical').length}
              </div>
            </div>
          </div>
        </div>

        {/* Incidents List */}
        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <IconMapper name="List" size={20} className="text-coin-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">All Incidents</h3>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {incidents.data.map((incident) => (
                <div key={incident.id} className="p-4 bg-gray-50 dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-coin-300 dark:hover:border-coin-700 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Link href={route('control-room.incidents.show', incident.id)}>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 hover:text-coin-700 dark:hover:text-coin-200">
                            {incident.title}
                          </h4>
                        </Link>
                        <Badge className={`text-xs ${getSeverityColor(incident.severity)}`}>
                          {incident.severity}
                        </Badge>
                        <Badge className={`text-xs ${getStatusColor(incident.status)}`}>
                          {incident.status.replace('_', ' ')}
                        </Badge>
                        {incident.escalation_level > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            Escalation Level {incident.escalation_level}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Type:</span> {incident.type.replace('_', ' ')} • 
                        <span className="font-medium"> Reporter:</span> {incident.reporter?.name || 'Unknown'} • 
                        <span className="font-medium"> Assigned:</span> {incident.assigned_to?.name || 'Unassigned'} • 
                        <span className="font-medium"> Created:</span> {new Date(incident.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 sm:ml-4">
                      <Link href={route('control-room.incidents.show', incident.id)}>
                        <Button size="sm" variant="outline" className="w-full sm:w-auto dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
                          <IconMapper name="Eye" size={14} className="mr-1.5" />
                          View
                        </Button>
                      </Link>
                      <Link href={route('control-room.incidents.edit', incident.id)}>
                        <Button size="sm" variant="outline" className="w-full sm:w-auto dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
                          <IconMapper name="Pencil" size={14} className="mr-1.5" />
                          Edit
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Incident Modal */}
      <Modal show={showAddModal} onClose={() => setShowAddModal(false)} maxWidth="2xl">
        <div className="p-4 sm:p-6 bg-white dark:bg-gray-900">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Create New Incident</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-gray-700 dark:text-gray-300">Incident Title *</Label>
              <Input
                value={data.title}
                onChange={(e) => setData('title', e.target.value)}
                placeholder="Enter incident title"
                className="mt-1 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-700 dark:text-gray-300">Incident Type *</Label>
                <select
                  value={data.type}
                  onChange={(e) => setData('type', e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-coin-500"
                >
                  <option value="">Select type</option>
                  <option value="security_breach">Security Breach</option>
                  <option value="equipment_failure">Equipment Failure</option>
                  <option value="personnel_issue">Personnel Issue</option>
                  <option value="other">Other</option>
                </select>
                {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type}</p>}
              </div>

              <div>
                <Label className="text-gray-700 dark:text-gray-300">Severity Level *</Label>
                <select
                  value={data.severity}
                  onChange={(e) => setData('severity', e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-coin-500"
                >
                  <option value="">Select severity</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
                {errors.severity && <p className="text-red-500 text-sm mt-1">{errors.severity}</p>}
              </div>
            </div>

            <div>
              <Label className="text-gray-700 dark:text-gray-300">Location *</Label>
              <Input
                value={data.location}
                onChange={(e) => setData('location', e.target.value)}
                placeholder="Enter incident location"
                className="mt-1 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
              />
              {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Label className="text-gray-700 dark:text-gray-300">Link Site</Label>
                  <Input
                    value={siteSearch}
                    onChange={(e) => setSiteSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), loadSites())}
                    placeholder="Search site or client name"
                    className="mt-1 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <Button type="button" onClick={loadSites} variant="outline" className="h-9 dark:border-gray-700 dark:text-gray-300">{loadingSites ? 'Loading…' : 'Search'}</Button>
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
                          onClick={() => { setData('client_site_id', String(s.id)); setSelectedSiteName(`${s.client_name} • ${s.name}`); }}
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

            <div className="space-y-2">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Label className="text-gray-700 dark:text-gray-300">Link Guard</Label>
                  <Input
                    value={guardSearch}
                    onChange={(e) => setGuardSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), loadGuards())}
                    placeholder="Search guard name or employee ID"
                    className="mt-1 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <Button type="button" onClick={loadGuards} variant="outline" className="h-9 dark:border-gray-700 dark:text-gray-300">{loadingGuards ? 'Loading…' : 'Search'}</Button>
              </div>
              {selectedGuardName && (
                <div className="text-xs text-gray-500">Selected guard: <span className="font-medium text-gray-800 dark:text-gray-200">{selectedGuardName}</span></div>
              )}
              <div className="max-h-32 overflow-y-auto rounded border border-gray-200 dark:border-gray-700">
                {guardResults.length === 0 ? (
                  <div className="p-2 text-sm text-gray-500">{loadingGuards ? 'Loading…' : 'No guards found'}</div>
                ) : (
                  <ul>
                    {guardResults.map((g) => (
                      <li key={g.id}>
                        <button
                          type="button"
                          onClick={() => { setData('guard_id', String(g.id)); setSelectedGuardName(`${g.name}${g.employee_id ? ' • ' + g.employee_id : ''}`); }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        >
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{g.name}</div>
                          {g.employee_id && (<div className="text-xs text-gray-500">{g.employee_id}</div>)}
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
                placeholder="Provide detailed description of the incident"
                rows={4}
                className="w-full mt-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-coin-500"
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
            </div>

            <div className="space-y-2">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input type="checkbox" checked={data.flag_guard} onChange={(e) => setData('flag_guard', e.target.checked)} className="rounded border-gray-300" />
                Flag involved guard now
              </label>
              {data.flag_guard && (
                <div className="grid grid-cols-1 gap-3 pl-6">
                  <div>
                    <Label className="text-gray-700 dark:text-gray-300">Flag Reason</Label>
                    <Input
                      value={data.flag_reason}
                      onChange={(e) => setData('flag_reason', e.target.value)}
                      placeholder="Reason for flag"
                      className="mt-1 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-700 dark:text-gray-300">Flag Details</Label>
                    <textarea
                      value={data.flag_details}
                      onChange={(e) => setData('flag_details', e.target.value)}
                      placeholder="Additional details"
                      rows={2}
                      className="w-full mt-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-coin-500"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowAddModal(false)} className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 w-full sm:w-auto">
                Cancel
              </Button>
              <Button type="submit" disabled={processing} className="bg-coin-600 hover:bg-coin-700 text-white w-full sm:w-auto">
                {processing ? 'Creating...' : 'Create Incident'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </ControlRoomLayout>
  );
};

export default IncidentsIndex;
