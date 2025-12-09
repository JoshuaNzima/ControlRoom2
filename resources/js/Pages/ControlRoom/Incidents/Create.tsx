import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import ControlRoomLayout from '@/Layouts/ControlRoomLayout';
import { Card, CardContent, CardHeader } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';

interface CreateIncidentProps {
  auth?: { user?: { name?: string } };
}

const CreateIncident = ({ auth }: CreateIncidentProps) => {
  const { data, setData, post, processing, errors } = useForm({
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

  const [siteSearch, setSiteSearch] = React.useState('');
  const [siteResults, setSiteResults] = React.useState<Array<{ id: number; name: string; client_name: string }>>([]);
  const [loadingSites, setLoadingSites] = React.useState(false);
  const [selectedSiteName, setSelectedSiteName] = React.useState<string>('');

  const [guardSearch, setGuardSearch] = React.useState('');
  const [guardResults, setGuardResults] = React.useState<Array<{ id: number; name: string; employee_id?: string; status?: string }>>([]);
  const [loadingGuards, setLoadingGuards] = React.useState(false);
  const [selectedGuardName, setSelectedGuardName] = React.useState<string>('');

  const loadSites = React.useCallback(async () => {
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

  const loadGuards = React.useCallback(async () => {
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
    post(route('control-room.incidents.store'));
  };

  return (
    <ControlRoomLayout title="Create Incident" user={auth?.user as any}>
      <Head title="Create Incident" />

      <div className="max-w-2xl mx-auto">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Create New Incident</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="title" className="text-gray-700 dark:text-gray-300">
                  Incident Title
                </Label>
                <Input
                  id="title"
                  type="text"
                  value={data.title}
                  onChange={(e) => setData('title', e.target.value)}
                  className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  placeholder="Enter incident title"
                />
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type" className="text-gray-700 dark:text-gray-300">
                    Incident Type
                  </Label>
                  <Select value={data.type} onValueChange={(value) => setData('type', value)}>
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
                  <Label htmlFor="severity" className="text-gray-700 dark:text-gray-300">
                    Severity Level
                  </Label>
                  <Select value={data.severity} onValueChange={(value) => setData('severity', value)}>
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
                <Label htmlFor="location" className="text-gray-700 dark:text-gray-300">
                  Location
                </Label>
                <Input
                  id="location"
                  type="text"
                  value={data.location}
                  onChange={(e) => setData('location', e.target.value)}
                  className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  placeholder="Enter incident location"
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
                      className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                      placeholder="Search site or client name"
                    />
                  </div>
                  <Button type="button" onClick={loadSites} variant="outline" className="h-9">{loadingSites ? 'Loading…' : 'Search'}</Button>
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
                      className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                      placeholder="Search guard name or employee ID"
                    />
                  </div>
                  <Button type="button" onClick={loadGuards} variant="outline" className="h-9">{loadingGuards ? 'Loading…' : 'Search'}</Button>
                </div>
                {selectedGuardName && (
                  <div className="text-xs text-gray-500">Selected guard: <span className="font-medium text-gray-800 dark:text-gray-200">{selectedGuardName}</span></div>
                )}
                <div className="max-h-40 overflow-y-auto rounded border border-gray-200 dark:border-gray-700">
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
                <Label htmlFor="description" className="text-gray-700 dark:text-gray-300">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={data.description}
                  onChange={(e) => setData('description', e.target.value)}
                  className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  placeholder="Provide detailed description of the incident"
                  rows={4}
                />
                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
              </div>

              <div className="space-y-2">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input type="checkbox" checked={!!data.flag_guard} onChange={(e) => setData('flag_guard', e.target.checked)} />
                  Flag involved guard now
                </label>
                {data.flag_guard && (
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <Label className="text-gray-700 dark:text-gray-300">Flag Reason</Label>
                      <Input
                        value={data.flag_reason as string}
                        onChange={(e) => setData('flag_reason', e.target.value)}
                        className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                        placeholder="Reason for flag"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-700 dark:text-gray-300">Flag Details</Label>
                      <Textarea
                        value={data.flag_details as string}
                        onChange={(e) => setData('flag_details', e.target.value)}
                        className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                        placeholder="Additional details"
                        rows={3}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  onClick={() => window.history.back()}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={processing}
                  className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
                >
                  {processing ? 'Creating...' : 'Create Incident'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </ControlRoomLayout>
  );
};

export default CreateIncident;
