import React, { useState, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import HRLayout from '@/Layouts/HRLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/Components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/Components/ui/select';
import { Badge } from '@/Components/ui/badge';
import { useToast } from '@/Components/ui/use-toast';
import { Search, Plus, Calculator, CheckCircle, DollarSign, Trash2, Edit2 } from 'lucide-react';

interface Guard {
  id: number;
  name: string;
  employee_id?: string;
  position: string;
  status: string;
}

interface IncentiveProfile {
  id: number;
  guard_id: number;
  base_amount: number;
  per_guard_amount: number;
  absence_deduction: number;
  uncovered_site_deduction: number;
  calculation_period: 'weekly' | 'bi_weekly' | 'monthly';
  is_active: boolean;
  notes?: string;
  guard?: Guard;
}

interface IncentiveRecord {
  id: number;
  guard_id: number;
  period_start: string;
  period_end: string;
  base_amount: number;
  performance_bonus: number;
  guards_count: number;
  per_guard_total: number;
  absences_count: number;
  absence_deductions: number;
  uncovered_sites_count: number;
  uncovered_site_deductions: number;
  total_deductions: number;
  net_amount: number;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  guard?: Guard;
}

interface PageProps {
  profiles: IncentiveProfile[];
  leaders: Guard[];
}

export default function SupervisorIncentives({ profiles, leaders }: PageProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCalculateModal, setShowCalculateModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<IncentiveProfile | null>(null);
  const [records, setRecords] = useState<IncentiveRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);

  const [profileForm, setProfileForm] = useState({
    guard_id: '',
    base_amount: '',
    per_guard_amount: '',
    absence_deduction: '',
    uncovered_site_deduction: '',
    calculation_period: 'monthly',
    notes: '',
  });

  const [calculateForm, setCalculateForm] = useState({
    period_start: '',
    period_end: '',
    guard_ids: [] as string[],
  });

  const filteredProfiles = useMemo(() => {
    if (!searchQuery) return profiles;
    const q = searchQuery.toLowerCase();
    return profiles.filter(p =>
      p.guard?.name?.toLowerCase().includes(q) ||
      p.guard?.employee_id?.toLowerCase().includes(q)
    );
  }, [profiles, searchQuery]);

  const fetchRecords = async () => {
    setRecordsLoading(true);
    try {
      const response = await fetch(route('hr.supervisor-incentives.records'));
      const data = await response.json();
      setRecords(data.records || []);
    } catch (error) {
      console.error('Failed to fetch records', error);
    } finally {
      setRecordsLoading(false);
    }
  };

  const handleSaveProfile = () => {
    const url = editingProfile
      ? route('hr.supervisor-incentives.profiles.update', { profile: editingProfile.id })
      : route('hr.supervisor-incentives.profiles.store');

    const method = editingProfile ? 'put' : 'post';

    router[method](url, {
      ...profileForm,
      base_amount: Number(profileForm.base_amount) || 0,
      per_guard_amount: Number(profileForm.per_guard_amount) || 0,
      absence_deduction: Number(profileForm.absence_deduction) || 0,
      uncovered_site_deduction: Number(profileForm.uncovered_site_deduction) || 0,
    }, {
      onSuccess: () => {
        toast({ title: editingProfile ? 'Profile updated' : 'Profile created' });
        setShowProfileModal(false);
        setEditingProfile(null);
        setProfileForm({
          guard_id: '',
          base_amount: '',
          per_guard_amount: '',
          absence_deduction: '',
          uncovered_site_deduction: '',
          calculation_period: 'monthly',
          notes: '',
        });
      },
      onError: () => {
        toast({ title: 'Failed to save profile', variant: 'destructive' });
      },
    });
  };

  const handleCalculate = () => {
    router.post(route('hr.supervisor-incentives.calculate'), calculateForm, {
      onSuccess: () => {
        toast({ title: 'Incentives calculated successfully' });
        setShowCalculateModal(false);
        fetchRecords();
      },
      onError: () => {
        toast({ title: 'Failed to calculate incentives', variant: 'destructive' });
      },
    });
  };

  const editProfile = (profile: IncentiveProfile) => {
    setEditingProfile(profile);
    setProfileForm({
      guard_id: String(profile.guard_id),
      base_amount: String(profile.base_amount),
      per_guard_amount: String(profile.per_guard_amount),
      absence_deduction: String(profile.absence_deduction),
      uncovered_site_deduction: String(profile.uncovered_site_deduction),
      calculation_period: profile.calculation_period,
      notes: profile.notes || '',
    });
    setShowProfileModal(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-MW', {
      style: 'currency',
      currency: 'MWK',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      approved: 'default',
      paid: 'default',
      rejected: 'destructive',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const availableLeaders = leaders.filter(l => !profiles.some(p => p.guard_id === l.id));

  return (
    <HRLayout title="Supervisor Incentives">
      <Head title="Supervisor Incentives" />

      <div className="w-full px-4 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Supervisor Incentives</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage incentive profiles and calculate payments for supervisors and sergeants
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setEditingProfile(null);
                setProfileForm({
                  guard_id: '',
                  base_amount: '',
                  per_guard_amount: '',
                  absence_deduction: '',
                  uncovered_site_deduction: '',
                  calculation_period: 'monthly',
                  notes: '',
                });
                setShowProfileModal(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Profile
            </Button>
            <Button variant="outline" onClick={() => setShowCalculateModal(true)}>
              <Calculator className="w-4 h-4 mr-2" />
              Calculate
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Profiles</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{profiles.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">Active Leaders</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {profiles.filter(p => p.is_active).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">Pending Calculations</div>
              <div className="text-2xl font-bold text-yellow-600">
                {records.filter(r => r.status === 'pending').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Pending Amount</div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(records.filter(r => r.status === 'pending').reduce((sum, r) => sum + r.net_amount, 0))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profiles Table */}
        <Card>
          <CardHeader>
            <CardTitle>Incentive Profiles</CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Search className="w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search profiles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Leader</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Position</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Base Amount</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Per Guard</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Absence Deduction</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Uncovered Deduction</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Period</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Status</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProfiles.map((profile) => (
                    <tr key={profile.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900 dark:text-gray-100">{profile.guard?.name}</div>
                        <div className="text-xs text-gray-500">{profile.guard?.employee_id}</div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="capitalize">
                          {profile.guard?.position}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right font-medium">{formatCurrency(profile.base_amount)}</td>
                      <td className="py-3 px-4 text-right">{formatCurrency(profile.per_guard_amount)}</td>
                      <td className="py-3 px-4 text-right text-red-600">-{formatCurrency(profile.absence_deduction)}</td>
                      <td className="py-3 px-4 text-right text-red-600">-{formatCurrency(profile.uncovered_site_deduction)}</td>
                      <td className="py-3 px-4 text-center capitalize">{profile.calculation_period.replace('_', '-')}</td>
                      <td className="py-3 px-4 text-center">
                        {profile.is_active ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button variant="ghost" size="sm" onClick={() => editProfile(profile)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filteredProfiles.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-gray-500 dark:text-gray-400">
                        No incentive profiles found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Recent Records */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Calculations</CardTitle>
            <Button variant="outline" size="sm" onClick={fetchRecords} disabled={recordsLoading}>
              {recordsLoading ? 'Loading...' : 'Refresh'}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Leader</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Period</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Base</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Bonus</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Guards</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Deductions</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Net Amount</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {records.slice(0, 10).map((record) => (
                    <tr key={record.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900 dark:text-gray-100">{record.guard?.name}</div>
                      </td>
                      <td className="py-3 px-4 text-xs">
                        {record.period_start} to {record.period_end}
                      </td>
                      <td className="py-3 px-4 text-right">{formatCurrency(record.base_amount)}</td>
                      <td className="py-3 px-4 text-right text-green-600">+{formatCurrency(record.performance_bonus)}</td>
                      <td className="py-3 px-4 text-center">{record.guards_count}</td>
                      <td className="py-3 px-4 text-right text-red-600">-{formatCurrency(record.total_deductions)}</td>
                      <td className="py-3 px-4 text-right font-bold">{formatCurrency(record.net_amount)}</td>
                      <td className="py-3 px-4 text-center">{getStatusBadge(record.status)}</td>
                    </tr>
                  ))}
                  {records.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-gray-500 dark:text-gray-400">
                        No calculations yet. Click "Calculate" to generate incentive records.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profile Modal */}
      <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingProfile ? 'Edit Incentive Profile' : 'Add Incentive Profile'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!editingProfile && (
              <div>
                <Label>Supervisor/Sergeant</Label>
                <Select
                  value={profileForm.guard_id}
                  onValueChange={(v) => setProfileForm({ ...profileForm, guard_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a leader" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLeaders.map((leader) => (
                      <SelectItem key={leader.id} value={String(leader.id)}>
                        {leader.name} ({leader.position})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Base Amount (MWK)</Label>
                <Input
                  type="number"
                  value={profileForm.base_amount}
                  onChange={(e) => setProfileForm({ ...profileForm, base_amount: e.target.value })}
                  placeholder="50000"
                />
              </div>
              <div>
                <Label>Per Guard Amount (MWK)</Label>
                <Input
                  type="number"
                  value={profileForm.per_guard_amount}
                  onChange={(e) => setProfileForm({ ...profileForm, per_guard_amount: e.target.value })}
                  placeholder="2000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Absence Deduction (MWK)</Label>
                <Input
                  type="number"
                  value={profileForm.absence_deduction}
                  onChange={(e) => setProfileForm({ ...profileForm, absence_deduction: e.target.value })}
                  placeholder="5000"
                />
              </div>
              <div>
                <Label>Uncovered Site Deduction (MWK)</Label>
                <Input
                  type="number"
                  value={profileForm.uncovered_site_deduction}
                  onChange={(e) => setProfileForm({ ...profileForm, uncovered_site_deduction: e.target.value })}
                  placeholder="10000"
                />
              </div>
            </div>

            <div>
              <Label>Calculation Period</Label>
              <Select
                value={profileForm.calculation_period}
                onValueChange={(v) => setProfileForm({ ...profileForm, calculation_period: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="bi_weekly">Bi-Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Notes</Label>
              <Input
                value={profileForm.notes}
                onChange={(e) => setProfileForm({ ...profileForm, notes: e.target.value })}
                placeholder="Any additional notes..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowProfileModal(false)}>Cancel</Button>
            <Button onClick={handleSaveProfile}>Save Profile</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Calculate Modal */}
      <Dialog open={showCalculateModal} onOpenChange={setShowCalculateModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Calculate Incentives</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Period Start</Label>
                <Input
                  type="date"
                  value={calculateForm.period_start}
                  onChange={(e) => setCalculateForm({ ...calculateForm, period_start: e.target.value })}
                />
              </div>
              <div>
                <Label>Period End</Label>
                <Input
                  type="date"
                  value={calculateForm.period_end}
                  onChange={(e) => setCalculateForm({ ...calculateForm, period_end: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Leaders (leave empty for all)</Label>
              <div className="border rounded-md p-2 max-h-32 overflow-auto dark:border-gray-700">
                {profiles.map((p) => (
                  <label key={p.guard_id} className="flex items-center gap-2 py-1">
                    <input
                      type="checkbox"
                      checked={calculateForm.guard_ids.includes(String(p.guard_id))}
                      onChange={(e) => {
                        const id = String(p.guard_id);
                        setCalculateForm({
                          ...calculateForm,
                          guard_ids: e.target.checked
                            ? [...calculateForm.guard_ids, id]
                            : calculateForm.guard_ids.filter((gid) => gid !== id),
                        });
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">{p.guard?.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCalculateModal(false)}>Cancel</Button>
            <Button onClick={handleCalculate}>Calculate</Button>
          </div>
        </DialogContent>
      </Dialog>
    </HRLayout>
  );
}
