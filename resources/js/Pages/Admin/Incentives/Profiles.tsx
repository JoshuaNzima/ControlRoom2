import React, { useState } from 'react';
import { Head, usePage, Link, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Checkbox } from '@/Components/ui/checkbox';
import { PageProps } from '@/types';
import { ArrowLeft, DollarSign, Shield, Users, Save } from 'lucide-react';

interface IncentiveProfile {
  id: number;
  role: string;
  base_amount: number;
  penalty_per_unresolved_down: number;
  is_active: boolean;
  description: string | null;
}

interface ProfilesPageProps extends PageProps {
  profiles: IncentiveProfile[];
}

export default function IncentiveProfiles() {
  const { profiles } = usePage<ProfilesPageProps>().props;
  const [editing, setEditing] = useState<Record<number, IncentiveProfile>>({});
  const [saving, setSaving] = useState<Record<number, boolean>>({});

  const handleUpdate = (profile: IncentiveProfile) => {
    setSaving({ ...saving, [profile.id]: true });
    const data = editing[profile.id] || profile;
    router.put(route('admin.incentives.profiles.update', profile.id), {
      base_amount: data.base_amount,
      penalty_per_unresolved_down: data.penalty_per_unresolved_down,
      is_active: data.is_active,
      description: data.description,
    }, {
      onFinish: () => {
        setSaving({ ...saving, [profile.id]: false });
        setEditing({ ...editing, [profile.id]: undefined as any });
      },
    });
  };

  const handleChange = (id: number, field: keyof IncentiveProfile, value: any) => {
    setEditing({
      ...editing,
      [id]: { ...(editing[id] || profiles.find(p => p.id === id)!), [field]: value },
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'supervisor': return <Shield className="h-5 w-5" />;
      case 'sergeant': return <Users className="h-5 w-5" />;
      default: return <DollarSign className="h-5 w-5" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'supervisor': return 'Supervisor';
      case 'sergeant': return 'Sergeant';
      default: return role;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Head title="Incentive Profiles" />
      
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href={route('admin.incentives.index')}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Incentive Profiles</h1>
        </div>

        <div className="space-y-6">
          {profiles.map((profile) => {
            const isEditing = !!editing[profile.id];
            const current = editing[profile.id] || profile;

            return (
              <Card key={profile.id} className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                      {getRoleIcon(profile.role)}
                    </div>
                    <div>
                      <CardTitle className="dark:text-gray-100">{getRoleLabel(profile.role)}</CardTitle>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Configure monthly incentive for {profile.role}s
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`base-${profile.id}`} className="dark:text-gray-300">
                        Base Monthly Amount
                      </Label>
                      <div className="relative mt-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R</span>
                        <Input
                          id={`base-${profile.id}`}
                          type="number"
                          step="0.01"
                          value={current.base_amount}
                          onChange={(e) => handleChange(profile.id, 'base_amount', parseFloat(e.target.value) || 0)}
                          className="pl-7 dark:bg-gray-700 dark:border-gray-600"
                          disabled={!isEditing}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor={`penalty-${profile.id}`} className="dark:text-gray-300">
                        Penalty per Unresolved Down
                      </Label>
                      <div className="relative mt-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R</span>
                        <Input
                          id={`penalty-${profile.id}`}
                          type="number"
                          step="0.01"
                          value={current.penalty_per_unresolved_down}
                          onChange={(e) => handleChange(profile.id, 'penalty_per_unresolved_down', parseFloat(e.target.value) || 0)}
                          className="pl-7 dark:bg-gray-700 dark:border-gray-600"
                          disabled={!isEditing}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Deducted for each unresolved down (excludes zone commander resolutions)
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor={`desc-${profile.id}`} className="dark:text-gray-300">
                      Description
                    </Label>
                    <Input
                      id={`desc-${profile.id}`}
                      value={current.description || ''}
                      onChange={(e) => handleChange(profile.id, 'description', e.target.value)}
                      className="mt-1 dark:bg-gray-700 dark:border-gray-600"
                      placeholder="Optional description"
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`active-${profile.id}`}
                        checked={current.is_active}
                        onCheckedChange={(checked) => handleChange(profile.id, 'is_active', checked === true)}
                        disabled={!isEditing}
                      />
                      <Label htmlFor={`active-${profile.id}`} className="dark:text-gray-300">Active</Label>
                    </div>

                    <div className="flex gap-2">
                      {!isEditing ? (
                        <Button
                          variant="outline"
                          onClick={() => setEditing({ ...editing, [profile.id]: profile })}
                        >
                          Edit
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            onClick={() => setEditing({ ...editing, [profile.id]: undefined as any })}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => handleUpdate(profile)}
                            disabled={saving[profile.id]}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            {saving[profile.id] ? 'Saving...' : 'Save'}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h4 className="text-sm font-medium mb-2 dark:text-gray-200">Calculation Summary</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Base Amount:</span>
                        <span className="dark:text-gray-200">{formatCurrency(current.base_amount)}</span>
                      </div>
                      <div className="flex justify-between text-red-600">
                        <span>Penalty per Down:</span>
                        <span>-{formatCurrency(current.penalty_per_unresolved_down)}</span>
                      </div>
                      <div className="pt-2 border-t dark:border-gray-600 flex justify-between font-medium">
                        <span className="dark:text-gray-200">Example (0 downs):</span>
                        <span className="text-green-600">{formatCurrency(current.base_amount)}</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span className="dark:text-gray-200">Example (3 downs):</span>
                        <span className="text-green-600">
                          {formatCurrency(Math.max(0, current.base_amount - (current.penalty_per_unresolved_down * 3)))}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
