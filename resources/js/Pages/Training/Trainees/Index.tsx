import React from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import axios from 'axios';
import TrainingLayout from '@/Layouts/TrainingLayout';
import { Card, CardContent } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import IconMapper from '@/Components/IconMapper';
import EmptyState from '@/Components/ui/empty-state';
import Modal from '@/Components/Modal';
import { Pagination } from '@/Components/ui/Pagination';

type TraineeListItem = {
  id: number;
  name: string;
  phone?: string | null;
  status: string;
  training_track: 'standard' | 'rapid_response';
  training_days: number;
  training_start_date?: string | null;
  training_end_date?: string | null;
  regimen?: { id: number; title: string; track: string } | null;
  primary_trainer?: { id: number; name: string } | null;
  converted_guard_id?: number | null;
};

type Trainer = { id: number; name: string };

type Regimen = { id: number; title: string; track: 'standard' | 'rapid_response'; default_days: number };

type Zone = { id: number; name: string };

type Client = { id: number; name: string };

type PageProps = {
  auth: { user: any };
  trainees: any;
  filters: { q?: string; status?: string; track?: string; per_page?: number | string };
  trainers: Trainer[];
  regimens: Regimen[];
  zones: Zone[];
  clients: Client[];
  minTrainingDays: number;
};

const fieldClassName =
  'w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-coin-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950';

function badgeForTrack(track: string) {
  if (track === 'rapid_response') {
    return 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200';
  }
  return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
}

function badgeForStatus(status: string) {
  switch (status) {
    case 'approved':
      return 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200';
    case 'rejected':
      return 'bg-rose-100 text-rose-900 dark:bg-rose-900/30 dark:text-rose-200';
    case 'pending_review':
      return 'bg-indigo-100 text-indigo-900 dark:bg-indigo-900/30 dark:text-indigo-200';
    case 'in_training':
      return 'bg-sky-100 text-sky-900 dark:bg-sky-900/30 dark:text-sky-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  }
}

function canDecide(t: TraineeListItem, user: any) {
  if (!t) return false;
  if (t.status === 'approved' || t.status === 'rejected') return false;
  if (Array.isArray(user?.roles) && user.roles.includes('super_admin')) return true;

  const primaryId = Number(t?.primary_trainer?.id || 0);
  const userId = Number(user?.id || 0);
  return primaryId > 0 && userId > 0 && primaryId === userId;
}

function trainingComplete(t: TraineeListItem, user: any) {
  if (Array.isArray(user?.roles) && user.roles.includes('super_admin')) return true;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (t?.training_end_date) {
    const end = new Date(t.training_end_date);
    end.setHours(0, 0, 0, 0);
    return end.getTime() <= today.getTime();
  }

  if (!t?.training_start_date) return false;
  const start = new Date(t.training_start_date);
  start.setHours(0, 0, 0, 0);

  const days = Math.max(10, Number(t.training_days || 10));
  const computedEnd = new Date(start.getTime());
  computedEnd.setDate(computedEnd.getDate() + days);
  computedEnd.setHours(0, 0, 0, 0);

  return computedEnd.getTime() <= today.getTime();
}

function normalizeMeta(paginated: any, perPageFallback: number) {
  const defaultMeta: any = {
    current_page: 1,
    last_page: 1,
    per_page: perPageFallback || 20,
    total: paginated?.data?.length || 0,
    from: 0,
    to: 0,
  };

  const raw: any = paginated as any;
  const arr: any[] = Array.isArray(raw) ? raw : (raw?.data ?? []);
  const metaFromTop: any = raw && typeof raw === 'object' && !Array.isArray(raw) && (raw.current_page || raw.last_page || raw.total)
    ? {
        current_page: Number(raw.current_page ?? 1),
        last_page: Number(raw.last_page ?? 1),
        per_page: Number(raw.per_page ?? perPageFallback ?? 20),
        total: Number(raw.total ?? arr.length ?? 0),
        from: Number(raw.from ?? 0),
        to: Number(raw.to ?? 0),
      }
    : null;

  return Array.isArray(raw) ? defaultMeta : (raw?.meta ?? metaFromTop ?? defaultMeta);
}

export default function TraineesIndex() {
  const { auth, trainees, filters, trainers, regimens, zones, clients, minTrainingDays } = usePage<PageProps>().props;

  const [q, setQ] = React.useState(filters?.q || '');
  const [status, setStatus] = React.useState(filters?.status || '');
  const [track, setTrack] = React.useState(filters?.track || '');
  const initialPerPage = Number(filters?.per_page ?? trainees?.meta?.per_page ?? 20);
  const [perPage, setPerPage] = React.useState<number>(initialPerPage);

  const [showCreate, setShowCreate] = React.useState(false);
  const [viewing, setViewing] = React.useState<any | null>(null);
  const [editingTrainers, setEditingTrainers] = React.useState<any | null>(null);
  const [starting, setStarting] = React.useState<TraineeListItem | null>(null);
  const [approving, setApproving] = React.useState<TraineeListItem | null>(null);
  const [rejecting, setRejecting] = React.useState<TraineeListItem | null>(null);
  const [loadingId, setLoadingId] = React.useState<number | null>(null);

  const applyFilters = () => {
    router.get(
      route('training.trainees.index'),
      { q, status, track, per_page: perPage },
      { preserveState: true, preserveScroll: true, replace: true },
    );
  };

  const resetFilters = () => {
    setQ('');
    setStatus('');
    setTrack('');
    setPerPage(20);
    router.get(route('training.trainees.index'), { q: '', status: '', track: '', per_page: 20 }, { preserveState: true, preserveScroll: true, replace: true });
  };

  const fetchTrainee = async (id: number) => {
    setLoadingId(id);
    try {
      const url = route('training.trainees.json', { trainee: id });
      const res = await axios.get(url, { headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' }, timeout: 10000 });
      return res.data;
    } finally {
      setLoadingId(null);
    }
  };

  const openView = async (t: TraineeListItem) => {
    try {
      const full = await fetchTrainee(t.id);
      setViewing(full);
    } catch {
      setViewing({ id: t.id, name: t.name });
    }
  };

  const openTrainers = async (t: TraineeListItem) => {
    try {
      const full = await fetchTrainee(t.id);
      setEditingTrainers(full);
    } catch {
      setEditingTrainers({ id: t.id, name: t.name, trainers: [], primary_trainer: null });
    }
  };

  const list: TraineeListItem[] = Array.isArray(trainees) ? (trainees as any) : (trainees?.data ?? []);
  const meta = normalizeMeta(trainees, perPage);

  return (
    <TrainingLayout title="Trainees" user={auth?.user as any}>
      <Head title="Trainees" />

      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Trainees</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Manage trainee pipeline, trainers, and approvals.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => setShowCreate(true)}>
              <IconMapper name="Plus" size={18} className="mr-2" />
              Add Trainee
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                placeholder="Search name / phone / ID…"
                className={fieldClassName}
              />
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={fieldClassName}>
                <option value="">All statuses</option>
                <option value="pending_assignment">Pending Assignment</option>
                <option value="in_training">In Training</option>
                <option value="pending_review">Pending Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <select value={track} onChange={(e) => setTrack(e.target.value)} className={fieldClassName}>
                <option value="">All tracks</option>
                <option value="standard">Standard</option>
                <option value="rapid_response">Rapid Response</option>
              </select>
              <select value={perPage} onChange={(e) => setPerPage(Number(e.target.value))} className={fieldClassName}>
                {[10, 20, 30, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}/page
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-2">
                <Button type="button" onClick={applyFilters} className="w-full">
                  Apply
                </Button>
                <Button type="button" variant="outline" onClick={resetFilters} className="w-full">
                  Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {list.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  title="No trainees found"
                  description="Try adjusting your filters or add a new trainee."
                  variant="inline"
                  action={
                    <Button onClick={() => setShowCreate(true)}>
                      <IconMapper name="Plus" size={18} className="mr-2" />
                      Add Trainee
                    </Button>
                  }
                />
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {list.map((t) => {
                  const canAct = canDecide(t, auth?.user);
                  const periodComplete = trainingComplete(t, auth?.user);
                  const canApprove = canAct && periodComplete;
                  const canReject = canAct && periodComplete;
                  return (
                    <div key={t.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{t.name}</div>
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${badgeForStatus(t.status)}`}>{String(t.status).replaceAll('_', ' ')}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${badgeForTrack(t.training_track)}`}>{t.training_track === 'rapid_response' ? 'rapid response' : 'standard'}</span>
                        </div>
                        <div className="mt-1 text-xs text-gray-600 dark:text-gray-300 flex flex-wrap items-center gap-2">
                          <span>{t.phone || '—'}</span>
                          <span className="text-gray-400 dark:text-gray-500">•</span>
                          <span>Days: {t.training_days ?? '—'}</span>
                          {t.regimen?.title ? (
                            <>
                              <span className="text-gray-400 dark:text-gray-500">•</span>
                              <span>Regimen: {t.regimen.title}</span>
                            </>
                          ) : null}
                          {t.primary_trainer?.name ? (
                            <>
                              <span className="text-gray-400 dark:text-gray-500">•</span>
                              <span>Primary: {t.primary_trainer.name}</span>
                            </>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 justify-start sm:justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openView(t)}
                          disabled={loadingId === t.id}
                        >
                          <IconMapper name="Eye" size={16} className="mr-2" />
                          View
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openTrainers(t)}
                          disabled={loadingId === t.id}
                        >
                          <IconMapper name="Users" size={16} className="mr-2" />
                          Trainers
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setStarting(t)}
                          disabled={t.status === 'approved' || t.status === 'rejected'}
                        >
                          <IconMapper name="Play" size={16} className="mr-2" />
                          Start
                        </Button>

                        <TooltipButton
                          type="button"
                          size="sm"
                          onClick={() => setApproving(t)}
                          disabled={!canApprove}
                          disabledReason={!periodComplete ? 'Training period not complete' : !canAct ? 'Only the primary trainer can approve' : undefined}
                        >
                          <IconMapper name="Check" size={16} className="mr-2" />
                          Approve
                        </TooltipButton>

                        <TooltipButton
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => setRejecting(t)}
                          disabled={!canReject}
                          disabledReason={!periodComplete ? 'Training period not complete' : !canAct ? 'Only the primary trainer can reject' : undefined}
                        >
                          <IconMapper name="X" size={16} className="mr-2" />
                          Reject
                        </TooltipButton>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <Pagination
              currentPage={Number(meta.current_page ?? 1)}
              lastPage={Number(meta.last_page ?? 1)}
              total={Number(meta.total ?? list.length ?? 0)}
              perPage={Number(meta.per_page ?? perPage ?? 20)}
              from={Number(meta.from ?? 0)}
              to={Number(meta.to ?? list.length ?? 0)}
              baseUrl={route('training.trainees.index')}
              filters={{ q, status, track, per_page: perPage }}
            />
          </CardContent>
        </Card>

        <CreateTraineeModal
          open={showCreate}
          onClose={() => setShowCreate(false)}
          trainers={trainers}
          regimens={regimens}
          minTrainingDays={minTrainingDays}
        />

        <TraineeDetailsModal open={!!viewing} onClose={() => setViewing(null)} trainee={viewing} canViewGuards={!!auth?.user?.can?.['guards.view']} />

        <TrainersModal
          open={!!editingTrainers}
          onClose={() => setEditingTrainers(null)}
          trainee={editingTrainers}
          trainers={trainers}
        />

        <StartTrainingModal
          open={!!starting}
          onClose={() => setStarting(null)}
          trainee={starting}
          minTrainingDays={minTrainingDays}
        />

        <ApproveModal
          open={!!approving}
          onClose={() => setApproving(null)}
          trainee={approving}
          zones={zones}
          clients={clients}
        />

        <RejectModal open={!!rejecting} onClose={() => setRejecting(null)} trainee={rejecting} />
      </div>
    </TrainingLayout>
  );
}

function TooltipButton({
  children,
  disabled,
  disabledReason,
  ...props
}: React.ComponentProps<typeof Button> & { disabledReason?: string }) {
  return (
    <span title={disabled && disabledReason ? disabledReason : undefined}>
      <Button disabled={disabled} {...props}>
        {children}
      </Button>
    </span>
  );
}

function CreateTraineeModal({
  open,
  onClose,
  trainers,
  regimens,
  minTrainingDays,
}: {
  open: boolean;
  onClose: () => void;
  trainers: Trainer[];
  regimens: Regimen[];
  minTrainingDays: number;
}) {
  const form = useForm({
    name: '',
    phone: '',
    email: '',
    address: '',
    id_number: '',
    date_of_birth: '',
    gender: '',
    notes: '',
    training_track: 'standard',
    training_days: minTrainingDays || 10,
    regimen_id: '',
    primary_trainer_id: '',
    trainer_ids: [] as number[],
    // Guard-matching fields for data migration
    residence_address: '',
    residence_district: '',
    marital_status: '',
    spouse_name: '',
    spouse_phone: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    next_of_kin_name: '',
    next_of_kin_relationship: '',
    next_of_kin_phone: '',
    home_village: '',
    home_ta: '',
    home_district: '',
    education_level: '',
    qualifications: '',
    languages: '',
    dependents_count: '',
    children_names: '',
  });

  React.useEffect(() => {
    if (!open) return;
    form.clearErrors();
  }, [open]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    form.post(route('training.trainees.store'), {
      preserveScroll: true,
      onSuccess: () => {
        form.reset();
        onClose();
        router.reload({ only: ['trainees'] });
      },
    });
  };

  const selectedTrainerIds = Array.isArray(form.data.trainer_ids) ? form.data.trainer_ids : [];

  // Cast errors to avoid deep type instantiation issues
  const errors = (form as any).errors as Record<string, string>;

  return (
    <Modal show={open} onClose={() => !form.processing && onClose()} maxWidth="2xl">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white dark:bg-gray-900 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Add Trainee</h2>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200">✕</button>
      </div>
      <div className="px-6 py-4 bg-white dark:bg-gray-900">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Name *</label>
            <input value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} className={fieldClassName} required />
            {(form.errors as Record<string, string>).name && <p className="text-xs text-rose-600 mt-1">{(form.errors as Record<string, string>).name}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Phone</label>
              <input value={form.data.phone} onChange={(e) => form.setData('phone', e.target.value)} className={fieldClassName} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Email</label>
              <input type="email" value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} className={fieldClassName} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Address</label>
            <input value={form.data.address} onChange={(e) => form.setData('address', e.target.value)} className={fieldClassName} />
          </div>

          {/* Guard-matching fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Residence Address</label>
              <input value={form.data.residence_address} onChange={(e) => form.setData('residence_address', e.target.value)} className={fieldClassName} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Residence District</label>
              <select value={form.data.residence_district} onChange={(e) => form.setData('residence_district', e.target.value)} className={fieldClassName}>
                <option value="">—</option>
                {['Balaka','Blantyre','Chikwawa','Chiradzulu','Chitipa','Dedza','Dowa','Karonga','Kasungu','Likoma','Lilongwe','Machinga','Mangochi','Mchinji','Mulanje','Mwanza','Mzimba','Neno','Nkhata Bay','Nkhotakota','Nsanje','Ntcheu','Ntchisi','Phalombe','Rumphi','Salima','Thyolo','Zomba'].map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Marital Status</label>
              <select value={form.data.marital_status} onChange={(e) => form.setData('marital_status', e.target.value)} className={fieldClassName}>
                <option value="">—</option>
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="divorced">Divorced</option>
                <option value="widowed">Widowed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Spouse Name</label>
              <input value={form.data.spouse_name} onChange={(e) => form.setData('spouse_name', e.target.value)} className={fieldClassName} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Spouse Phone</label>
              <input value={form.data.spouse_phone} onChange={(e) => form.setData('spouse_phone', e.target.value)} className={fieldClassName} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Emergency Contact Name</label>
              <input value={form.data.emergency_contact_name} onChange={(e) => form.setData('emergency_contact_name', e.target.value)} className={fieldClassName} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Emergency Contact Phone</label>
              <input value={form.data.emergency_contact_phone} onChange={(e) => form.setData('emergency_contact_phone', e.target.value)} className={fieldClassName} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Next of Kin Name</label>
              <input value={form.data.next_of_kin_name} onChange={(e) => form.setData('next_of_kin_name', e.target.value)} className={fieldClassName} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Next of Kin Relationship</label>
              <input value={form.data.next_of_kin_relationship} onChange={(e) => form.setData('next_of_kin_relationship', e.target.value)} className={fieldClassName} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Next of Kin Phone</label>
              <input value={form.data.next_of_kin_phone} onChange={(e) => form.setData('next_of_kin_phone', e.target.value)} className={fieldClassName} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Home Village</label>
              <input value={form.data.home_village} onChange={(e) => form.setData('home_village', e.target.value)} className={fieldClassName} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Home T/A</label>
              <input value={form.data.home_ta} onChange={(e) => form.setData('home_ta', e.target.value)} className={fieldClassName} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Home District</label>
              <select value={form.data.home_district} onChange={(e) => form.setData('home_district', e.target.value)} className={fieldClassName}>
                <option value="">—</option>
                {['Balaka','Blantyre','Chikwawa','Chiradzulu','Chitipa','Dedza','Dowa','Karonga','Kasungu','Likoma','Lilongwe','Machinga','Mangochi','Mchinji','Mulanje','Mwanza','Mzimba','Neno','Nkhata Bay','Nkhotakota','Nsanje','Ntcheu','Ntchisi','Phalombe','Rumphi','Salima','Thyolo','Zomba'].map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Education Level</label>
              <input value={form.data.education_level} onChange={(e) => form.setData('education_level', e.target.value)} className={fieldClassName} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Dependents Count</label>
              <input type="number" value={form.data.dependents_count} onChange={(e) => form.setData('dependents_count', e.target.value)} className={fieldClassName} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Children Names</label>
              <input value={form.data.children_names} onChange={(e) => form.setData('children_names', e.target.value)} className={fieldClassName} placeholder="Comma separated" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Qualifications</label>
              <textarea rows={2} value={form.data.qualifications} onChange={(e) => form.setData('qualifications', e.target.value)} className={fieldClassName} placeholder="Comma separated or JSON" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Languages</label>
              <textarea rows={2} value={form.data.languages} onChange={(e) => form.setData('languages', e.target.value)} className={fieldClassName} placeholder="Comma separated or JSON" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">ID Number</label>
              <input value={form.data.id_number} onChange={(e) => form.setData('id_number', e.target.value)} className={fieldClassName} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Date of Birth</label>
              <input type="date" value={form.data.date_of_birth} onChange={(e) => form.setData('date_of_birth', e.target.value)} className={fieldClassName} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Gender</label>
              <select value={form.data.gender} onChange={(e) => form.setData('gender', e.target.value)} className={fieldClassName}>
                <option value="">—</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Track</label>
              <select value={form.data.training_track} onChange={(e) => form.setData('training_track', e.target.value)} className={fieldClassName}>
                <option value="standard">Standard</option>
                <option value="rapid_response">Rapid Response</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Training Days</label>
              <input
                type="number"
                min={minTrainingDays || 10}
                value={form.data.training_days as any}
                onChange={(e) => form.setData('training_days', Number(e.target.value))}
                className={fieldClassName}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Regimen</label>
              <select value={form.data.regimen_id as any} onChange={(e) => form.setData('regimen_id', e.target.value)} className={fieldClassName}>
                <option value="">—</option>
                {(regimens || []).map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title} ({r.track === 'rapid_response' ? 'rapid' : 'standard'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Primary Trainer *</label>
              <select
                value={form.data.primary_trainer_id as any}
                onChange={(e) => {
                  const id = Number(e.target.value || 0);
                  form.setData('primary_trainer_id', e.target.value);
                  if (id > 0 && !selectedTrainerIds.includes(id)) {
                    form.setData('trainer_ids', [...selectedTrainerIds, id]);
                  }
                }}
                className={fieldClassName}
                required
              >
                <option value="">Select trainer…</option>
                {(trainers || []).map((tr) => (
                  <option key={tr.id} value={tr.id}>
                    {tr.name}
                  </option>
                ))}
              </select>
              {(form.errors as Record<string, string>).primary_trainer_id && <p className="text-xs text-rose-600 mt-1">{(form.errors as Record<string, string>).primary_trainer_id}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Trainers</label>
              <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-3 max-h-40 overflow-y-auto space-y-2">
                {(trainers || []).map((tr) => {
                  const checked = selectedTrainerIds.includes(tr.id);
                  return (
                    <label key={tr.id} className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-100">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            form.setData('trainer_ids', Array.from(new Set([...selectedTrainerIds, tr.id])));
                          } else {
                            form.setData('trainer_ids', selectedTrainerIds.filter((x) => x !== tr.id));
                          }
                        }}
                        className="h-4 w-4 rounded border-gray-300 dark:border-gray-700"
                      />
                      <span className="truncate">{tr.name}</span>
                    </label>
                  );
                })}
              </div>
              {errors.trainer_ids && <p className="text-xs text-rose-600 mt-1">{errors.trainer_ids}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Notes</label>
            <textarea rows={3} value={form.data.notes} onChange={(e) => form.setData('notes', e.target.value)} className={fieldClassName} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={form.processing}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.processing}>
              {form.processing ? 'Saving…' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function TraineeDetailsModal({ open, onClose, trainee, canViewGuards }: { open: boolean; onClose: () => void; trainee: any; canViewGuards: boolean }) {
  return (
    <Modal show={open} onClose={onClose} maxWidth="lg">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white dark:bg-gray-900 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Trainee Details</h2>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200">✕</button>
      </div>
      <div className="px-6 py-4 bg-white dark:bg-gray-900 space-y-3">
        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{trainee?.name || '—'}</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3">
            <div className="text-xs text-gray-500 dark:text-gray-400">Phone</div>
            <div className="text-gray-900 dark:text-gray-100">{trainee?.phone || '—'}</div>
          </div>
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3">
            <div className="text-xs text-gray-500 dark:text-gray-400">Email</div>
            <div className="text-gray-900 dark:text-gray-100">{trainee?.email || '—'}</div>
          </div>
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3">
            <div className="text-xs text-gray-500 dark:text-gray-400">Track</div>
            <div className="text-gray-900 dark:text-gray-100">{trainee?.training_track || '—'}</div>
          </div>
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3">
            <div className="text-xs text-gray-500 dark:text-gray-400">Status</div>
            <div className="text-gray-900 dark:text-gray-100">{trainee?.status || '—'}</div>
          </div>
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3">
            <div className="text-xs text-gray-500 dark:text-gray-400">Primary Trainer</div>
            <div className="text-gray-900 dark:text-gray-100">{trainee?.primary_trainer?.name || '—'}</div>
          </div>
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3">
            <div className="text-xs text-gray-500 dark:text-gray-400">Regimen</div>
            <div className="text-gray-900 dark:text-gray-100">{trainee?.regimen?.title || '—'}</div>
          </div>
        </div>

        {trainee?.converted_guard_id ? (
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-3 text-sm">
            <div className="text-xs text-gray-500 dark:text-gray-400">Converted Guard</div>
            <div className="flex items-center justify-between gap-2">
              <div className="text-gray-900 dark:text-gray-100">#{trainee.converted_guard_id}</div>
              {canViewGuards ? (
                <a
                  href={route('supervisor.guards.show', { guard: trainee.converted_guard_id })}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-800 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100 dark:hover:bg-gray-900"
                >
                  <IconMapper name="ArrowRight" size={16} />
                  Open
                </a>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="flex justify-end pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function TrainersModal({ open, onClose, trainee, trainers }: { open: boolean; onClose: () => void; trainee: any; trainers: Trainer[] }) {
  const form = useForm({
    primary_trainer_id: trainee?.primary_trainer?.id || '',
    trainer_ids: (trainee?.trainers || []).map((t: any) => Number(t.id)),
  });

  React.useEffect(() => {
    if (!open) return;
    form.setData({
      primary_trainer_id: trainee?.primary_trainer?.id || '',
      trainer_ids: (trainee?.trainers || []).map((t: any) => Number(t.id)),
    });
    // Type assertion to avoid excessively deep type instantiation
    (form.clearErrors as () => void)();
  }, [open, trainee?.id]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    form.post(route('training.trainees.trainers.update', { trainee: trainee?.id }), {
      preserveScroll: true,
      onSuccess: () => {
        onClose();
        router.reload({ only: ['trainees'] });
      },
    });
  };

  // Cast errors to avoid deep type instantiation issues
  const errors = (form as any).errors as Record<string, string>;

  const selectedTrainerIds = Array.isArray(form.data.trainer_ids) ? (form.data.trainer_ids as any as number[]) : [];

  return (
    <Modal show={open} onClose={() => !form.processing && onClose()} maxWidth="lg">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white dark:bg-gray-900 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Trainers</h2>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200">✕</button>
      </div>
      <div className="px-6 py-4 bg-white dark:bg-gray-900">
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">{trainee?.name}</div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Primary Trainer *</label>
            <select
              value={form.data.primary_trainer_id as any}
              onChange={(e) => {
                const id = Number(e.target.value || 0);
                (form.setData as any)('primary_trainer_id', e.target.value);
                if (id > 0 && !selectedTrainerIds.includes(id)) {
                  (form.setData as any)('trainer_ids', [...selectedTrainerIds, id]);
                }
              }}
              className={fieldClassName}
              required
            >
              <option value="">Select trainer…</option>
              {(trainers || []).map((tr) => (
                <option key={tr.id} value={tr.id}>
                  {tr.name}
                </option>
              ))}
            </select>
            {errors.primary_trainer_id && <p className="text-xs text-rose-600 mt-1">{errors.primary_trainer_id}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Trainers *</label>
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-3 max-h-56 overflow-y-auto space-y-2">
              {(trainers || []).map((tr) => {
                const checked = selectedTrainerIds.includes(tr.id);
                return (
                  <label key={tr.id} className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-100">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          (form.setData as any)('trainer_ids', Array.from(new Set([...selectedTrainerIds, tr.id])));
                        } else {
                          (form.setData as any)('trainer_ids', selectedTrainerIds.filter((x) => x !== tr.id));
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300 dark:border-gray-700"
                    />
                    <span className="truncate">{tr.name}</span>
                  </label>
                );
              })}
            </div>
            {errors.trainer_ids && <p className="text-xs text-rose-600 mt-1">{errors.trainer_ids}</p>}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={form.processing}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.processing}>
              {form.processing ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function StartTrainingModal({ open, onClose, trainee, minTrainingDays }: { open: boolean; onClose: () => void; trainee: TraineeListItem | null; minTrainingDays: number }) {
  const form = useForm({
    training_start_date: '',
    training_days: trainee?.training_days ?? minTrainingDays ?? 10,
  });

  React.useEffect(() => {
    if (!open) return;
    form.setData({
      training_start_date: '',
      training_days: trainee?.training_days ?? minTrainingDays ?? 10,
    });
    form.clearErrors();
  }, [open, trainee?.id]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trainee) return;
    form.post(route('training.trainees.start', { trainee: trainee.id }), {
      preserveScroll: true,
      onSuccess: () => {
        onClose();
        router.reload({ only: ['trainees'] });
      },
    });
  };

  return (
    <Modal show={open} onClose={() => !form.processing && onClose()} maxWidth="md">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white dark:bg-gray-900 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Start Training</h2>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200">✕</button>
      </div>
      <div className="px-6 py-4 bg-white dark:bg-gray-900">
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">{trainee?.name}</div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Start Date</label>
            <input type="date" value={form.data.training_start_date} onChange={(e) => form.setData('training_start_date', e.target.value)} className={fieldClassName} />
            {form.errors.training_start_date && <p className="text-xs text-rose-600 mt-1">{form.errors.training_start_date as any}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Training Days</label>
            <input
              type="number"
              min={minTrainingDays || 10}
              value={form.data.training_days as any}
              onChange={(e) => form.setData('training_days', Number(e.target.value))}
              className={fieldClassName}
            />
            {form.errors.training_days && <p className="text-xs text-rose-600 mt-1">{form.errors.training_days as any}</p>}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={form.processing}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.processing}>
              {form.processing ? 'Starting…' : 'Start'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function ApproveModal({ open, onClose, trainee, zones, clients }: { open: boolean; onClose: () => void; trainee: TraineeListItem | null; zones: Zone[]; clients: Client[] }) {
  const form = useForm({
    decision_notes: '',
    guard_status: 'inactive',
    zone_id: '',
    client_id: '',
  });

  React.useEffect(() => {
    if (!open) return;
    form.setData({ decision_notes: '', guard_status: 'inactive', zone_id: '', client_id: '' });
    form.clearErrors();
  }, [open, trainee?.id]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trainee) return;
    form.post(route('training.trainees.approve', { trainee: trainee.id }), {
      preserveScroll: true,
      onSuccess: () => {
        onClose();
        router.reload({ only: ['trainees'] });
      },
    });
  };

  return (
    <Modal show={open} onClose={() => !form.processing && onClose()} maxWidth="lg">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white dark:bg-gray-900 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Approve Trainee</h2>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200">✕</button>
      </div>
      <div className="px-6 py-4 bg-white dark:bg-gray-900">
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">{trainee?.name}</div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Guard Status</label>
            <select value={form.data.guard_status} onChange={(e) => form.setData('guard_status', e.target.value)} className={fieldClassName}>
              <option value="inactive">Inactive</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
            {form.errors.guard_status && <p className="text-xs text-rose-600 mt-1">{form.errors.guard_status as any}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Zone (optional)</label>
              <select value={form.data.zone_id as any} onChange={(e) => form.setData('zone_id', e.target.value)} className={fieldClassName}>
                <option value="">—</option>
                {(zones || []).map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name}
                  </option>
                ))}
              </select>
              {form.errors.zone_id && <p className="text-xs text-rose-600 mt-1">{form.errors.zone_id as any}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Client (optional)</label>
              <select value={form.data.client_id as any} onChange={(e) => form.setData('client_id', e.target.value)} className={fieldClassName}>
                <option value="">—</option>
                {(clients || []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {form.errors.client_id && <p className="text-xs text-rose-600 mt-1">{form.errors.client_id as any}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Decision Notes</label>
            <textarea rows={3} value={form.data.decision_notes} onChange={(e) => form.setData('decision_notes', e.target.value)} className={fieldClassName} />
            {form.errors.decision_notes && <p className="text-xs text-rose-600 mt-1">{form.errors.decision_notes as any}</p>}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={form.processing}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.processing}>
              {form.processing ? 'Approving…' : 'Approve'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function RejectModal({ open, onClose, trainee }: { open: boolean; onClose: () => void; trainee: TraineeListItem | null }) {
  const form = useForm({ decision_notes: '' });

  React.useEffect(() => {
    if (!open) return;
    form.setData({ decision_notes: '' });
    form.clearErrors();
  }, [open, trainee?.id]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trainee) return;
    form.post(route('training.trainees.reject', { trainee: trainee.id }), {
      preserveScroll: true,
      onSuccess: () => {
        onClose();
        router.reload({ only: ['trainees'] });
      },
    });
  };

  return (
    <Modal show={open} onClose={() => !form.processing && onClose()} maxWidth="md">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white dark:bg-gray-900 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Reject Trainee</h2>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200">✕</button>
      </div>
      <div className="px-6 py-4 bg-white dark:bg-gray-900">
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">{trainee?.name}</div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Decision Notes</label>
            <textarea rows={3} value={form.data.decision_notes} onChange={(e) => form.setData('decision_notes', e.target.value)} className={fieldClassName} />
            {form.errors.decision_notes && <p className="text-xs text-rose-600 mt-1">{form.errors.decision_notes as any}</p>}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={form.processing}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={form.processing}>
              {form.processing ? 'Rejecting…' : 'Reject'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
