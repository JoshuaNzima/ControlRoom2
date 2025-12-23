import React from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card } from '@/Components/ui/card';
import IconMapper from '@/Components/IconMapper';
import Modal from '@/Components/Modal';

type Guard = {
  id: number;
  name: string;
  employee_id: string;
  status: string;
  supervisor?: { id: number; name: string } | null;
  today_attendance?: { check_in?: string | null; check_out?: string | null } | null;
  active_assignment?: { site_id?: number | null; site_name?: string | null; client_name?: string | null } | null;
};

type PageProps = {
  guards?: { data: Guard[]; links?: any; meta?: any };
  filters?: Record<string, any>;
  grades?: Array<{ id: number; code: string; name: string }>;
  zones?: Array<{ id: number; name: string }>;
};

export default function GuardsDirectory() {
  const { guards: guardsProp = { data: [], links: [], meta: {} }, filters = {}, grades = [], zones = [] } = usePage<PageProps>().props as any;

  const [search, setSearch] = React.useState(filters.search || '');
  const [status, setStatus] = React.useState<string>(filters.status || '');
  const [zoneId, setZoneId] = React.useState<string>(filters.zone_id || '');
  const [gradeId, setGradeId] = React.useState<string>(filters.grade_id || '');
  const [onDuty, setOnDuty] = React.useState<boolean>(filters.on_duty === '1' || filters.on_duty === 1 || filters.on_duty === true || filters.on_duty === 'true');
  const [sort, setSort] = React.useState<string>(filters.sort || 'name');
  const [dir, setDir] = React.useState<'asc' | 'desc'>(filters.dir === 'desc' ? 'desc' : 'asc');
  const [perPage, setPerPage] = React.useState<string>(String(filters.per_page || '20'));

  const [viewOpen, setViewOpen] = React.useState(false);
  const [viewData, setViewData] = React.useState<any | null>(null);
  const [viewLoading, setViewLoading] = React.useState<number | null>(null);

  const applyFilters = () => {
    const query: Record<string, any> = {
      search: search || undefined,
      status: status || undefined,
      zone_id: zoneId || undefined,
      grade_id: gradeId || undefined,
      on_duty: onDuty ? 1 : undefined,
      sort,
      dir,
      per_page: perPage,
    };
    router.get(route('guards.index'), query, { preserveState: true, preserveScroll: true });
  };

  const resetFilters = () => {
    setSearch(''); setStatus(''); setZoneId(''); setGradeId(''); setOnDuty(false); setSort('name'); setDir('asc'); setPerPage('20');
    router.get(route('guards.index'), {}, { preserveState: true, preserveScroll: true });
  };

  const openView = async (id: number) => {
    setViewLoading(id);
    try {
      const res = await fetch(route('guards.json', { guard: id }), { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error('Failed');
      const json = await res.json();
      setViewData(json);
      setViewOpen(true);
    } catch (e) {
      // no-op
    } finally {
      setViewLoading(null);
    }
  };

  return (
    <AuthenticatedLayout>
      <Head title="Guards" />
      <div className="max-w-7xl mx-auto mt-6 px-4 sm:px-6 lg:px-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Guards Directory</h1>
          <p className="text-gray-600 dark:text-gray-300">Read-only list of guards with basic details available to all users.</p>
        </div>

        <Card className="bg-white dark:bg-gray-800 dark:border-gray-700 rounded-xl shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400"><IconMapper name="Search" size={20} /></span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                  placeholder="Name or Employee ID..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-coin-600"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Zone</label>
              <select value={zoneId} onChange={(e) => setZoneId(e.target.value)} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                <option value="">All</option>
                {zones.map((z: any) => (<option key={z.id} value={z.id}>{z.name}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Grade</label>
              <select value={gradeId} onChange={(e) => setGradeId(e.target.value)} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                <option value="">All</option>
                {grades.map((g: any) => (<option key={g.id} value={g.id}>{g.code ?? g.name}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">On Duty</label>
              <div className="flex items-center h-[42px]">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input type="checkbox" checked={onDuty} onChange={(e) => setOnDuty(e.target.checked)} className="rounded border-gray-300 dark:border-gray-700" />
                  Currently on duty
                </label>
              </div>
            </div>
            <div className="flex items-end gap-2">
              <button onClick={applyFilters} className="px-4 py-2 bg-coin-600 hover:bg-coin-700 text-white rounded w-full">Apply</button>
              <button onClick={resetFilters} className="px-4 py-2 border dark:border-gray-700 rounded w-full bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200">Reset</button>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sort By</label>
              <div className="flex items-center gap-2">
                <select value={sort} onChange={(e) => setSort(e.target.value)} className="flex-1 rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                  <option value="name">Name</option>
                  <option value="employee_id">Employee ID</option>
                  <option value="status">Status</option>
                  <option value="supervisor_id">Supervisor</option>
                </select>
                <button onClick={() => setDir(d => d === 'asc' ? 'desc' : 'asc')} className="px-3 py-2 rounded border dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200">
                  {dir === 'asc' ? 'Asc' : 'Desc'}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Per Page</label>
              <select value={perPage} onChange={(e) => setPerPage(e.target.value)} className="w-32 rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                {['10','20','50','100'].map(n => (<option key={n} value={n}>{n}</option>))}
              </select>
            </div>
          </div>
        </Card>

        <Card className="bg-white dark:bg-gray-800 dark:border-gray-700 rounded-xl shadow">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {guardsProp.data.map((g: Guard) => (
              <div key={g.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 dark:text-gray-100">{g.name}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">ID: {g.employee_id}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    <span className="mr-2">Status:</span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      g.status === 'active' ? 'bg-green-100 text-green-800' :
                      g.status === 'inactive' ? 'bg-gray-100 text-gray-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>{g.status}</span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    <span className="mr-2">Supervisor:</span>{g.supervisor?.name || '-'}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {g.active_assignment ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                        <span className="font-medium">{g.active_assignment.client_name || 'Client'}</span>
                        <span className="text-xs text-indigo-600">• {g.active_assignment.site_name || 'Site'}</span>
                      </span>
                    ) : (
                      <span className="text-gray-400">No active assignment</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    Today: {g.today_attendance ? `${g.today_attendance.check_in || '--:--'} → ${g.today_attendance.check_out || '--:--'}` : 'No entry'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openView(g.id)}
                    className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-800 border dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700"
                    disabled={viewLoading === g.id}
                    aria-label={`View ${g.name}`}
                  >
                    {viewLoading === g.id ? '...' : (
                      <span className="inline-flex items-center gap-2">
                        <IconMapper name="Eye" size={18} /> View
                      </span>
                    )}
                  </button>
                </div>
              </div>
            ))}
            {guardsProp.data.length === 0 && (
              <div className="p-8 text-center text-gray-500">No guards found.</div>
            )}
          </div>
          {/* Pagination */}
          {guardsProp?.links && (
            <div className="p-4 border-t dark:border-gray-700 flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Page {guardsProp?.meta?.current_page ?? ''} of {guardsProp?.meta?.last_page ?? ''}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {guardsProp.links.filter((l: any) => l.url !== null).map((l: any, idx: number) => (
                  <button
                    key={idx}
                    className={`px-3 py-1 rounded border dark:border-gray-700 ${l.active ? 'bg-coin-600 text-white' : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200'}`}
                    onClick={() => router.get(l.url, {}, { preserveScroll: true, preserveState: true })}
                    dangerouslySetInnerHTML={{ __html: l.label }}
                  />
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* View Guard Details Modal */}
        <Modal show={viewOpen} onClose={() => { setViewOpen(false); setViewData(null); }} maxWidth="2xl">
          <div className="p-4 sm:p-6 bg-white dark:bg-gray-800">
            <div className="flex items-start gap-4">
              {viewData?.photo_url ? (
                <img src={viewData.photo_url} alt={viewData?.name || 'Guard'} className="w-24 h-24 rounded object-cover border dark:border-gray-700" />
              ) : (
                <div className="w-24 h-24 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500">No Photo</div>
              )}
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{viewData?.name}</h2>
                <div className="text-sm text-gray-600 dark:text-gray-300">Employee ID: {viewData?.employee_id}</div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">{viewData?.status}</span>
                  {viewData?.guard_type && <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">{viewData.guard_type}</span>}
                  {viewData?.grade?.name && <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">{viewData.grade.name}</span>}
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div><span className="font-medium text-gray-700 dark:text-gray-300">Phone:</span> <span className="text-gray-900 dark:text-gray-100">{viewData?.phone || '-'}</span></div>
              <div><span className="font-medium text-gray-700 dark:text-gray-300">Email:</span> <span className="text-gray-900 dark:text-gray-100">{viewData?.email || '-'}</span></div>
              <div className="md:col-span-2"><span className="font-medium text-gray-700 dark:text-gray-300">Zone:</span> <span className="text-gray-900 dark:text-gray-100">{viewData?.zone?.name || '-'}</span></div>
              <div className="md:col-span-2"><span className="font-medium text-gray-700 dark:text-gray-300">Supervisor:</span> <span className="text-gray-900 dark:text-gray-100">{viewData?.supervisor?.name || '-'}</span></div>
            </div>
            {Array.isArray(viewData?.assignments) && viewData.assignments.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Assignments</h3>
                <div className="mt-2 space-y-2">
                  {viewData.assignments.map((a: any) => (
                    <div key={a.id} className="text-sm text-gray-800 dark:text-gray-200">
                      <span className="font-medium">{a.site?.client?.name || 'Client'} - {a.site?.name || 'Site'}</span>
                      <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">{a.start_date} {a.end_date ? `→ ${a.end_date}` : ''} {a.is_active ? '• Active' : ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-6 flex justify-end">
              <button onClick={() => { setViewOpen(false); setViewData(null); }} className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100">Close</button>
            </div>
          </div>
        </Modal>
      </div>
    </AuthenticatedLayout>
  );
}
