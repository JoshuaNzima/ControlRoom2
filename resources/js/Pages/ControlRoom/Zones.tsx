import React from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import ControlRoomLayout from '@/Layouts/ControlRoomLayout';
import { Card, CardContent, CardHeader } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/Components/ui/dialog';
import { User } from '@/types';

interface ZoneItem { id: number; name: string; code: string; description?: string | null; status: 'active' | 'inactive' | 'understaffed'; required_guard_count?: number; target_sites_count?: number; coverage_rate?: number; coverage?: number; active_guard_count?: number; sites_count?: number; }
interface Commander { id: number; name: string }
interface SiteItem { id: number; name: string; zone_id?: number | null }
interface ZonesProps { auth?: { user?: { name?: string } }; zones?: ZoneItem[]; commanders?: Commander[]; sites?: SiteItem[] }

const Zones = ({ auth, zones: zonesProp = [], commanders = [], sites = [] }: ZonesProps) => {
  const { props } = usePage();
  const zones = zonesProp.length ? zonesProp : ((props as any).zones ?? []);
  const [open, setOpen] = React.useState<boolean>(false);
  const [editing, setEditing] = React.useState<ZoneItem | null>(null);

  type ZoneForm = {
    name: string;
    code: string;
    description: string;
    status: 'active' | 'inactive' | 'understaffed';
    required_guard_count: number;
    target_sites_count: number;
    commander_id: number | '';
    site_ids: number[];
  };

  const { data, setData, post, put, processing, reset, errors, delete: destroy } = useForm<ZoneForm>({
    name: '',
    code: '',
    description: '',
    status: 'active',
    required_guard_count: 0,
    target_sites_count: 0,
    commander_id: '' ,
    site_ids: [] as number[],
  });

  const startCreate = () => {
    setEditing(null);
    reset();
    setData('status', 'active');
    setOpen(true);
  };
  const startEdit = (z: ZoneItem) => {
    setEditing(z);
    setData({
      name: z.name,
      code: z.code,
      description: z.description ?? '',
      status: z.status,
      required_guard_count: z.required_guard_count ?? 0,
      target_sites_count: z.target_sites_count ?? 0,
      commander_id: '' ,
      site_ids: [] as number[],
    });
    setOpen(true);
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      put(route('control-room.zones.update', editing.id), { 
        onSuccess: () => {
          setOpen(false);
          reset();
        } 
      });
    } else {
      post(route('control-room.zones.store'), { 
        onSuccess: () => {
          setOpen(false);
          reset();
        }
      });
    }
  };
  const handleDelete = (z: ZoneItem) => {
    if (!confirm(`Delete zone "${z.name}"?`)) return;
    destroy(route('control-room.zones.destroy', z.id));
  };

  const getCoverageColor = (coverage: number) => {
    if (coverage >= 90) return 'text-green-600 dark:text-green-400';
    if (coverage >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getCoverageBgColor = (coverage: number) => {
    if (coverage >= 90) return 'bg-green-500';
    if (coverage >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
      case 'understaffed': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100';
      case 'inactive': return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-100';
    }
  };

  return (
    <ControlRoomLayout title="Zone Management" user={auth?.user as User | undefined}>
      <Head title="Zone Management" />

      <div className="space-y-6">
        {/* Zone Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Zones</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{zones.length}</p>
                </div>
                <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400">🗺️</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Zones</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{zones.filter((z: ZoneItem) => z.status === 'active').length}</p>
                </div>
                <div className="h-8 w-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <span className="text-green-600 dark:text-green-400">✅</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Guards</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{zones.reduce((sum: number, z: ZoneItem) => sum + (z.active_guard_count ?? 0), 0)}</p>
                </div>
                <div className="h-8 w-8 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 dark:text-purple-400">👮</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Sites</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{zones.reduce((sum: number, z: ZoneItem) => sum + (z.sites_count ?? 0), 0)}</p>
                </div>
                <div className="h-8 w-8 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 dark:text-orange-400">🏢</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Zone List */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Zone Overview</h3>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button onClick={startCreate} className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">Add New Zone</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>{editing ? 'Edit Zone' : 'Add Zone'}</DialogTitle>
                </DialogHeader>
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Name</label>
                      <input value={data.name} onChange={(e) => setData('name', e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800" />
                      {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Status</label>
                      <select value={data.status} onChange={(e) => setData('status', e.target.value as any)} className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
                        <option value="active">Active</option>
                        <option value="understaffed">Understaffed</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Required Guards</label>
                      <input type="number" value={data.required_guard_count} onChange={(e) => setData('required_guard_count', Number(e.target.value))} className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Zone Commander</label>
                      <select value={data.commander_id as any} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setData('commander_id', e.target.value ? Number(e.target.value) : '')} className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
                        <option value="">Select commander</option>
                        {commanders.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Target Sites</label>
                      <input type="number" value={data.target_sites_count} onChange={(e) => setData('target_sites_count', Number(e.target.value))} className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800" />
                      {errors.target_sites_count && <p className="text-sm text-red-600 mt-1">{errors.target_sites_count}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Description</label>
                      <textarea value={data.description} onChange={(e) => setData('description', e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800" rows={3} />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Add Sites to Zone</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-auto border rounded p-2">
                        {sites.map((s) => (
                          <label key={s.id} className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={(data.site_ids as number[]).includes(s.id)}
                              onChange={() => {
                                const set = new Set<number>(data.site_ids as number[]);
                                if (set.has(s.id)) set.delete(s.id); else set.add(s.id);
                                setData('site_ids', Array.from(set));
                              }}
                            />
                            <span>{s.name}</span>
                            {s.zone_id && <span className="text-xs text-gray-500">(Already in zone)</span>}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={processing}>{editing ? 'Save Changes' : 'Create Zone'}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {zones.map((zone: ZoneItem) => (
                <div key={zone.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">{zone.name}</h4>
                        <Badge className={`text-xs ${getStatusColor(zone.status)}`}>
                          {zone.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Code:</span> {zone.code} • 
                        <span className="font-medium">Guards:</span> {(zone.active_guard_count ?? 0)}/{zone.required_guard_count ?? 0} • 
                        <span className="font-medium">Sites:</span> {zone.sites_count ?? 0}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className={`text-2xl font-bold ${getCoverageColor((zone.coverage ?? zone.coverage_rate ?? 0) as number)}`}>
                        {(Number(zone.coverage ?? zone.coverage_rate ?? 0)).toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Coverage
                      </div>
                    </div>
                  </div>
                  
                  {/* Coverage Progress Bar */}
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mb-4">
                    <div 
                      className={`h-2 rounded-full ${getCoverageBgColor((zone as any).coverage ?? (zone as any).coverage_rate ?? 0)}`}
                      style={{ width: `${Math.min(((zone as any).coverage ?? (zone as any).coverage_rate ?? 0), 100)}%` }}
                    ></div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600" asChild>
                      <a href={route('control-room.zones.reports', zone.id)}>Zone Reports</a>
                    </Button>
                    <Button size="sm" variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600" onClick={() => startEdit(zone as any)}>Edit</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(zone as any)}>Delete</Button>
                    <Button size="sm" variant="secondary" asChild>
                      <a href={route('control-room.zones.assign', zone.id)}>Assign Guards</a>
                    </Button>
                    <Button size="sm" variant="secondary" asChild>
                      <a href={route('control-room.zones.map', zone.id)}>Zone Map</a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Zone Management</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button variant="outline" className="h-12 flex flex-col items-center justify-center space-y-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                <span className="text-lg">➕</span>
                <span className="text-sm">Add Zone</span>
              </Button>
              <Button variant="outline" className="h-12 flex flex-col items-center justify-center space-y-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                <span className="text-lg">👮</span>
                <span className="text-sm">Assign Guards</span>
              </Button>
              <Button variant="outline" className="h-12 flex flex-col items-center justify-center space-y-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                <span className="text-lg">📊</span>
                <span className="text-sm">Zone Reports</span>
              </Button>
              <Button variant="outline" className="h-12 flex flex-col items-center justify-center space-y-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                <span className="text-lg">🗺️</span>
                <span className="text-sm">Zone Map</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ControlRoomLayout>
  );
};

export default Zones;
