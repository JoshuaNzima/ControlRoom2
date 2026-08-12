import React from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import IconMapper from '@/Components/IconMapper';
import EmptyState from '@/Components/ui/empty-state';
import Modal from '@/Components/Modal';

type RegimenGoal = {
  id: number;
  title: string;
  description?: string | null;
  max_score: number;
  weight: number;
  sort_order: number;
};

type Regimen = {
  id: number;
  title: string;
  track: 'standard' | 'rapid_response';
  default_days: number;
  description?: string | null;
  goals_count: number;
  goals: RegimenGoal[];
};

type PageProps = {
  auth: { user: any };
  regimens: Regimen[];
  filters: { q?: string; track?: string };
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

export default function RegimensIndex() {
  const { auth, regimens, filters, minTrainingDays } = usePage<PageProps>().props;

  const [q, setQ] = React.useState(filters?.q || '');
  const [track, setTrack] = React.useState(filters?.track || '');

  const [showCreate, setShowCreate] = React.useState(false);
  const [managing, setManaging] = React.useState<Regimen | null>(null);

  const applyFilters = () => {
    router.get(route('training.regimens.index'), { q, track }, { preserveState: true, preserveScroll: true, replace: true });
  };

  const resetFilters = () => {
    setQ('');
    setTrack('');
    router.get(route('training.regimens.index'), { q: '', track: '' }, { preserveState: true, preserveScroll: true, replace: true });
  };

  const destroyRegimen = (r: Regimen) => {
    if (!confirm('Remove this regimen?')) return;
    router.delete(route('training.regimens.destroy', { regimen: r.id }), {
      preserveScroll: true,
      onSuccess: () => {
        setManaging(null);
        router.reload({ only: ['regimens'] });
      },
    });
  };

  return (
    <AuthenticatedLayout header="Regimens" user={auth?.user as any}>
      <Head title="Regimens" />

      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Training Regimens</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Build regimens and goals for standard and rapid response tracks.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => setShowCreate(true)}>
              <IconMapper name="Plus" size={18} className="mr-2" />
              Add Regimen
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                placeholder="Search title…"
                className={fieldClassName}
              />
              <select value={track} onChange={(e) => setTrack(e.target.value)} className={fieldClassName}>
                <option value="">All tracks</option>
                <option value="standard">Standard</option>
                <option value="rapid_response">Rapid Response</option>
              </select>
              <div className="sm:col-span-2 flex items-center gap-2">
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

        {(regimens || []).length === 0 ? (
          <EmptyState
            title="No regimens"
            description="Create a regimen and add goals to start training."
            variant="card"
            action={
              <Button onClick={() => setShowCreate(true)}>
                <IconMapper name="Plus" size={18} className="mr-2" />
                Add Regimen
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(regimens || []).map((r) => (
              <Card key={r.id} className="hover:shadow-sm transition-shadow">
                <CardHeader className="flex flex-row items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="truncate">{r.title}</CardTitle>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${badgeForTrack(r.track)}`}>{r.track === 'rapid_response' ? 'rapid response' : 'standard'}</span>
                      <span className="text-xs text-gray-600 dark:text-gray-300">{r.default_days} days</span>
                      <span className="text-xs text-gray-600 dark:text-gray-300">• {r.goals_count} goals</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button size="icon" variant="outline" onClick={() => setManaging(r)}>
                      <IconMapper name="Settings" size={18} />
                    </Button>
                    <Button size="icon" variant="destructive" onClick={() => destroyRegimen(r)}>
                      <IconMapper name="Trash2" size={18} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-700 dark:text-gray-200 line-clamp-3">{r.description || '—'}</div>
                  <div className="mt-4">
                    <Button variant="outline" className="w-full" onClick={() => setManaging(r)}>
                      <IconMapper name="ClipboardList" size={18} className="mr-2" />
                      Manage goals
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <RegimenModal
          open={showCreate}
          onClose={() => setShowCreate(false)}
          mode="create"
          regimen={null}
          minTrainingDays={minTrainingDays}
        />

        <RegimenModal
          open={!!managing}
          onClose={() => setManaging(null)}
          mode="edit"
          regimen={managing}
          minTrainingDays={minTrainingDays}
        />
      </div>
    </AuthenticatedLayout>
  );
}

function RegimenModal({
  open,
  onClose,
  mode,
  regimen,
  minTrainingDays,
}: {
  open: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  regimen: Regimen | null;
  minTrainingDays: number;
}) {
  const isEdit = mode === 'edit';

  const form: any = useForm<any>({
    title: regimen?.title || '',
    track: (regimen?.track || 'standard') as any,
    default_days: regimen?.default_days ?? (minTrainingDays || 10),
    description: regimen?.description || '',
  } as any);

  const [showEditGoal, setShowEditGoal] = React.useState<RegimenGoal | null>(null);

  const goalForm: any = useForm<any>({
    title: '',
    description: '',
    max_score: 10,
    weight: 1,
  } as any);

  React.useEffect(() => {
    if (!open) return;

    form.setData({
      title: regimen?.title || '',
      track: (regimen?.track || 'standard') as any,
      default_days: regimen?.default_days ?? (minTrainingDays || 10),
      description: regimen?.description || '',
    } as any);
    form.clearErrors();

    goalForm.setData({ title: '', description: '', max_score: 10, weight: 1 } as any);
    goalForm.clearErrors();

    setShowEditGoal(null);
  }, [open, regimen?.id]);

  const submitRegimen = (e: React.FormEvent) => {
    e.preventDefault();

    if (isEdit && regimen) {
      form.put(route('training.regimens.update', { regimen: regimen.id }), {
        preserveScroll: true,
        onSuccess: () => {
          router.reload({ only: ['regimens'] });
        },
      });
      return;
    }

    form.post(route('training.regimens.store'), {
      preserveScroll: true,
      onSuccess: () => {
        onClose();
        router.reload({ only: ['regimens'] });
      },
    });
  };

  const submitGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regimen) return;

    goalForm.post(route('training.regimens.goals.store', { regimen: regimen.id }), {
      preserveScroll: true,
      onSuccess: () => {
        goalForm.setData({ title: '', description: '', max_score: 10, weight: 1 } as any);
        router.reload({ only: ['regimens'] });
      },
    });
  };

  const destroyGoal = (goal: RegimenGoal) => {
    if (!confirm('Remove this goal?')) return;
    router.delete(route('training.regimens.goals.destroy', { goal: goal.id }), {
      preserveScroll: true,
      onSuccess: () => router.reload({ only: ['regimens'] }),
    });
  };

  return (
    <Modal show={open} onClose={() => !form.processing && !goalForm.processing && onClose()} maxWidth="2xl">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white dark:bg-gray-900 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{isEdit ? 'Manage Regimen' : 'Add Regimen'}</h2>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200">✕</button>
      </div>

      <div className="px-6 py-4 bg-white dark:bg-gray-900 space-y-6">
        <form onSubmit={submitRegimen} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Title *</label>
            <input value={form.data.title} onChange={(e) => form.setData('title', e.target.value)} className={fieldClassName} required />
            {form.errors.title && <p className="text-xs text-rose-600 mt-1">{form.errors.title as any}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Track *</label>
              <select value={form.data.track as any} onChange={(e) => form.setData('track', e.target.value)} className={fieldClassName}>
                <option value="standard">Standard</option>
                <option value="rapid_response">Rapid Response</option>
              </select>
              {form.errors.track && <p className="text-xs text-rose-600 mt-1">{form.errors.track as any}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Default Days</label>
              <input
                type="number"
                min={minTrainingDays || 10}
                value={form.data.default_days as any}
                onChange={(e) => form.setData('default_days', Number(e.target.value))}
                className={fieldClassName}
              />
              {form.errors.default_days && <p className="text-xs text-rose-600 mt-1">{form.errors.default_days as any}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Description</label>
            <textarea rows={3} value={form.data.description as any} onChange={(e) => form.setData('description', e.target.value)} className={fieldClassName} />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={form.processing || goalForm.processing}>
              Close
            </Button>
            <Button type="submit" disabled={form.processing || goalForm.processing}>
              {form.processing ? 'Saving…' : isEdit ? 'Save changes' : 'Create regimen'}
            </Button>
          </div>
        </form>

        {isEdit ? (
          <div className="rounded-xl border border-gray-200 dark:border-gray-800">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Goals</div>
              <div className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${badgeForTrack(regimen?.track || 'standard')}`}>{regimen?.track === 'rapid_response' ? 'rapid response' : 'standard'}</div>
            </div>
            <div className="p-4 space-y-4">
              <form onSubmit={submitGoal} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">New goal title *</label>
                  <input value={goalForm.data.title} onChange={(e) => goalForm.setData('title', e.target.value)} className={fieldClassName} required />
                  {goalForm.errors.title && <p className="text-xs text-rose-600 mt-1">{goalForm.errors.title as any}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Description</label>
                  <textarea rows={2} value={goalForm.data.description as any} onChange={(e) => goalForm.setData('description', e.target.value)} className={fieldClassName} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Max score</label>
                  <input type="number" min={1} max={100} value={goalForm.data.max_score as any} onChange={(e) => goalForm.setData('max_score', Number(e.target.value))} className={fieldClassName} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Weight</label>
                  <input type="number" min={1} max={100} value={goalForm.data.weight as any} onChange={(e) => goalForm.setData('weight', Number(e.target.value))} className={fieldClassName} />
                </div>
                <div className="sm:col-span-2 flex justify-end">
                  <Button type="submit" disabled={goalForm.processing || form.processing}>
                    <IconMapper name="Plus" size={18} className="mr-2" />
                    {goalForm.processing ? 'Adding…' : 'Add goal'}
                  </Button>
                </div>
              </form>

              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {(regimen?.goals || []).length === 0 ? (
                  <div className="py-6">
                    <EmptyState title="No goals" description="Add at least one goal to evaluate trainees." size="sm" />
                  </div>
                ) : (
                  (regimen?.goals || [])
                    .slice()
                    .sort((a, b) => Number(a.sort_order) - Number(b.sort_order))
                    .map((g) => (
                      <div key={g.id} className="py-3 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{g.sort_order}. {g.title}</div>
                          <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">Max: {g.max_score} • Weight: {g.weight}</div>
                          {g.description ? <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">{g.description}</div> : null}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button size="sm" variant="outline" onClick={() => setShowEditGoal(g)}>
                            <IconMapper name="Edit" size={16} className="mr-2" />
                            Edit
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => destroyGoal(g)}>
                            <IconMapper name="Trash2" size={16} className="mr-2" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        ) : null}

        <GoalEditModal
          open={!!showEditGoal}
          onClose={() => setShowEditGoal(null)}
          goal={showEditGoal}
          disabled={form.processing || goalForm.processing}
        />
      </div>
    </Modal>
  );
}

function GoalEditModal({ open, onClose, goal, disabled }: { open: boolean; onClose: () => void; goal: RegimenGoal | null; disabled: boolean }) {
  const form: any = useForm<any>({
    title: goal?.title || '',
    description: goal?.description || '',
    max_score: goal?.max_score ?? 10,
    weight: goal?.weight ?? 1,
    sort_order: goal?.sort_order ?? 1,
  } as any);

  React.useEffect(() => {
    if (!open) return;
    form.setData({
      title: goal?.title || '',
      description: goal?.description || '',
      max_score: goal?.max_score ?? 10,
      weight: goal?.weight ?? 1,
      sort_order: goal?.sort_order ?? 1,
    } as any);
    form.clearErrors();
  }, [open, goal?.id]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal) return;

    form.put(route('training.regimens.goals.update', { goal: goal.id }), {
      preserveScroll: true,
      onSuccess: () => {
        onClose();
        router.reload({ only: ['regimens'] });
      },
    });
  };

  return (
    <Modal show={open} onClose={() => !form.processing && onClose()} maxWidth="lg">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white dark:bg-gray-900 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit Goal</h2>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200">✕</button>
      </div>
      <div className="px-6 py-4 bg-white dark:bg-gray-900">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Title *</label>
            <input value={form.data.title} onChange={(e) => form.setData('title', e.target.value)} className={fieldClassName} required />
            {form.errors.title && <p className="text-xs text-rose-600 mt-1">{form.errors.title as any}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Description</label>
            <textarea rows={3} value={form.data.description as any} onChange={(e) => form.setData('description', e.target.value)} className={fieldClassName} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Max score</label>
              <input type="number" min={1} max={100} value={form.data.max_score as any} onChange={(e) => form.setData('max_score', Number(e.target.value))} className={fieldClassName} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Weight</label>
              <input type="number" min={1} max={100} value={form.data.weight as any} onChange={(e) => form.setData('weight', Number(e.target.value))} className={fieldClassName} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Sort order</label>
              <input type="number" min={1} max={999} value={form.data.sort_order as any} onChange={(e) => form.setData('sort_order', Number(e.target.value))} className={fieldClassName} />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={disabled || form.processing}>
              Cancel
            </Button>
            <Button type="submit" disabled={disabled || form.processing}>
              {form.processing ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
