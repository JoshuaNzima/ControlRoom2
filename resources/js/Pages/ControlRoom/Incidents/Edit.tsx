import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import ControlRoomLayout from '@/Layouts/ControlRoomLayout';
import { Card, CardContent, CardHeader } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';

interface Incident {
  id: number;
  title: string;
  type: string;
  severity: string;
  description: string;
  location: string;
  status: string;
  client_id?: number | null;
  client_site_id?: number | null;
  client?: { name?: string };
  client_site?: { name?: string };
}

interface EditIncidentProps {
  auth?: { user?: { name?: string } };
  incident: Incident;
}

export default function EditIncident({ auth, incident }: EditIncidentProps) {
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

  const [siteSearch, setSiteSearch] = React.useState('');
  const [siteResults, setSiteResults] = React.useState<Array<{ id: number; name: string; client_name: string }>>([]);
  const [loadingSites, setLoadingSites] = React.useState(false);
  const [selectedSiteName, setSelectedSiteName] = React.useState<string>(
    incident.client?.name && incident.client_site?.name ? `${incident.client?.name} • ${incident.client_site?.name}` : ''
  );

  const loadSites = React.useCallback(async () => {
    try {
      setLoadingSites(true);
      const params = new URLSearchParams();
      if (siteSearch) params.set('search', siteSearch);
      const url = `${route('control-room.clients.sites.json')}?${params.toString()}`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      const list = await res.json();
      setSiteResults(Array.isArray(list) ? list : []);
    } catch {
      setSiteResults([]);
    } finally {
      setLoadingSites(false);
    }
  }, [siteSearch]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    put(route('control-room.incidents.update', incident.id));
  };

  return (
    <ControlRoomLayout title={`Edit Incident #${incident.id}`} user={auth?.user as any}>
      <Head title={`Edit Incident #${incident.id}`} />

      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Edit Incident</h1>
          <Link
            href={route('control-room.incidents.show', incident.id)}
            className="text-sm text-coin-700 hover:text-coin-800 dark:text-coin-200 dark:hover:text-coin-100"
          >
            ← Back
          </Link>
        </div>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Incident Details</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-6">
              <div>
                <Label htmlFor="title" className="text-gray-700 dark:text-gray-300">Title</Label>
                <Input
                  id="title"
                  value={data.title}
                  onChange={(e) => setData('title', e.target.value)}
                  className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                />
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-700 dark:text-gray-300">Type</Label>
                  <Select value={data.type} onValueChange={(v) => setData('type', v)}>
                    <SelectTrigger className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="security_breach">Security Breach</SelectItem>
                      <SelectItem value="equipment_failure">Equipment Failure</SelectItem>
                      <SelectItem value="personnel_issue">Personnel Issue</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type}</p>}
                </div>

                <div>
                  <Label className="text-gray-700 dark:text-gray-300">Severity</Label>
                  <Select value={data.severity} onValueChange={(v) => setData('severity', v)}>
                    <SelectTrigger className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.severity && <p className="text-red-500 text-sm mt-1">{errors.severity}</p>}
                </div>
              </div>

              <div>
                <Label className="text-gray-700 dark:text-gray-300">Status</Label>
                <Select value={data.status} onValueChange={(v) => setData('status', v)}>
                  <SelectTrigger className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="escalated">Escalated</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && <p className="text-red-500 text-sm mt-1">{errors.status}</p>}
              </div>

              <div>
                <Label htmlFor="location" className="text-gray-700 dark:text-gray-300">Location</Label>
                <Input
                  id="location"
                  value={data.location}
                  onChange={(e) => setData('location', e.target.value)}
                  className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                />
                {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
              </div>

              <div>
                <Label htmlFor="description" className="text-gray-700 dark:text-gray-300">Description</Label>
                <Textarea
                  id="description"
                  value={data.description}
                  onChange={(e) => setData('description', e.target.value)}
                  className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  rows={5}
                />
                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
              </div>

              <div className="space-y-2">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label className="text-gray-700 dark:text-gray-300">Link Site (optional)</Label>
                    <Input
                      value={siteSearch}
                      onChange={(e) => setSiteSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), loadSites())}
                      className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                      placeholder="Search site or client name"
                    />
                  </div>
                  <Button type="button" onClick={loadSites} variant="outline" className="h-9">
                    {loadingSites ? 'Loading…' : 'Search'}
                  </Button>
                </div>

                {selectedSiteName && (
                  <div className="text-xs text-gray-500">Selected site: <span className="font-medium text-gray-800 dark:text-gray-200">{selectedSiteName}</span></div>
                )}

                <div className="max-h-40 overflow-y-auto rounded border border-gray-200 dark:border-gray-700">
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

                {errors.client_site_id && <p className="text-red-500 text-sm mt-1">{errors.client_site_id}</p>}
                {errors.client_id && <p className="text-red-500 text-sm mt-1">{errors.client_id}</p>}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
                <Link href={route('control-room.incidents.show', incident.id)} className="w-full sm:w-auto">
                  <Button type="button" variant="outline" className="w-full dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={processing} className="w-full sm:w-auto bg-coin-700 hover:bg-coin-600 text-white">
                  {processing ? 'Saving…' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </ControlRoomLayout>
  );
}
