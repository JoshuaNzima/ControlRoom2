import React, { useMemo, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import IconMapper from '@/Components/IconMapper';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'

interface LoyaltyRule {
  id: number;
  name: string;
  type: string;
  points_per_unit: number;
  unit_description: string;
  description?: string | null;
  is_active: boolean;
  priority?: number | null;
}

interface Props {
  rules: LoyaltyRule[];
}

interface RuleFormState {
  id: string;
  name: string;
  type: string;
  points_per_unit: string;
  unit_description: string;
  description: string;
  is_active: boolean;
  priority: string;
}

const emptyRuleForm = (): RuleFormState => ({
  id: '',
  name: '',
  type: 'payment',
  points_per_unit: '1',
  unit_description: '',
  description: '',
  is_active: true,
  priority: '0',
});

export default function Rules({ rules }: Props) {
  const [form, setForm] = useState<RuleFormState>(emptyRuleForm());
  const [saving, setSaving] = useState(false);

  const sortedRules = useMemo(() => {
    return [...rules].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  }, [rules]);

  const startCreate = () => {
    setForm(emptyRuleForm());
  };

  const startEdit = (rule: LoyaltyRule) => {
    setForm({
      id: String(rule.id),
      name: rule.name,
      type: rule.type,
      points_per_unit: String(rule.points_per_unit),
      unit_description: rule.unit_description,
      description: rule.description || '',
      is_active: rule.is_active,
      priority: String(rule.priority ?? 0),
    });
  };

  const submitRule = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);

    router.post(
      route('admin.loyalty.rules.store'),
      {
        id: form.id ? Number(form.id) : null,
        name: form.name,
        type: form.type,
        points_per_unit: Number(form.points_per_unit),
        unit_description: form.unit_description,
        description: form.description || null,
        is_active: form.is_active,
        priority: Number(form.priority || 0),
      },
      {
        preserveScroll: true,
        onSuccess: () => setForm(emptyRuleForm()),
        onFinish: () => setSaving(false),
      },
    );
  };

  return (
    <AuthenticatedLayout header="Loyalty Rules">
      <Head title="Loyalty Rules" />

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Loyalty Rules</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Configure how clients earn points from payments, referrals, services, and contracts.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href={route('admin.loyalty.settings')}>
                <IconMapper name="Settings2" size={16} className="mr-2" />
                Settings
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={route('admin.loyalty.dashboard')}>
                <IconMapper name="ArrowLeft" size={16} className="mr-2" />
                Back
              </Link>
            </Button>
          </div>
        </div>

        <Card className="border-2 border-gray-200 dark:border-gray-800">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <CardTitle>{form.id ? 'Edit loyalty rule' : 'Create loyalty rule'}</CardTitle>
              <Button type="button" variant="outline" onClick={startCreate}>
                New rule
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <form className="grid grid-cols-1 gap-4 lg:grid-cols-2" onSubmit={submitRule}>
              <label className="space-y-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Name</span>
                <input
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Payment Points"
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Type</span>
                <select
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                  value={form.type}
                  onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
                >
                  <option value="payment">Payment</option>
                  <option value="service">Service</option>
                  <option value="referral">Referral</option>
                  <option value="contract_length">Contract length</option>
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Points per unit</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                  value={form.points_per_unit}
                  onChange={(event) => setForm((current) => ({ ...current, points_per_unit: event.target.value }))}
                  placeholder="10"
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Priority</span>
                <input
                  type="number"
                  step="1"
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                  value={form.priority}
                  onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}
                  placeholder="0"
                />
              </label>

              <label className="space-y-1 lg:col-span-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Unit description</span>
                <input
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                  value={form.unit_description}
                  onChange={(event) => setForm((current) => ({ ...current, unit_description: event.target.value }))}
                  placeholder="1 MWK"
                />
              </label>

              <label className="space-y-1 lg:col-span-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</span>
                <textarea
                  rows={3}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Optional admin note"
                />
              </label>

              <label className="flex items-center gap-3 lg:col-span-2">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</span>
              </label>

              <div className="flex flex-wrap gap-2 lg:col-span-2">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : form.id ? 'Update rule' : 'Create rule'}
                </Button>
                <Button type="button" variant="outline" onClick={startCreate}>
                  Clear form
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {sortedRules.length ? (
            sortedRules.map((rule) => (
              <Card key={rule.id}>
                <CardHeader>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <CardTitle className="text-lg">{rule.name}</CardTitle>
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        className={
                          rule.is_active
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300'
                        }
                      >
                        {rule.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button type="button" size="sm" variant="outline" onClick={() => startEdit(rule)}>
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>
                    <span className="font-semibold">Type:</span> {rule.type}
                  </p>
                  <p>
                    <span className="font-semibold">Points per unit:</span> {Number(rule.points_per_unit).toFixed(0)}
                  </p>
                  <p>
                    <span className="font-semibold">Unit:</span> {rule.unit_description}
                  </p>
                  {rule.priority !== null && rule.priority !== undefined && (
                    <p>
                      <span className="font-semibold">Priority:</span> {rule.priority}
                    </p>
                  )}
                  {rule.description && <p className="text-gray-600 dark:text-gray-400">{rule.description}</p>}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-10 text-center text-gray-500 dark:text-gray-400">
                No loyalty rules configured.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
