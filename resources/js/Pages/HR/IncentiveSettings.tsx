import React, { useState, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import HRLayout from '@/Layouts/HRLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Badge } from '@/Components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
// import { Switch } from '@/Components/ui/switch';
const Switch = ({ checked, onCheckedChange, disabled }: { checked: boolean; onCheckedChange?: (v: boolean) => void; disabled?: boolean }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => onCheckedChange?.(!checked)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-red-600' : 'bg-gray-200 dark:bg-gray-700'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
  </button>
);
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  // DialogDescription,
} from '@/Components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/Components/ui/select';
import { useToast } from '@/Components/ui/use-toast';
import {
  Search,
  Plus,
  Settings,
  Trophy,
  Calculator,
  TrendingUp,
  Users,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Trash2,
  Edit2,
  ChevronRight,
} from 'lucide-react';

interface IncentiveRule {
  id: number;
  name: string;
  description?: string;
  condition_type: string;
  calculation_type: string;
  period_type: string;
  is_active: boolean;
  min_amount?: number;
  max_amount?: number;
}

interface IncentiveType {
  id: number;
  name: string;
  slug: string;
  description?: string;
  category: string;
  applies_to: string;
  is_active: boolean;
  requires_approval: boolean;
  default_config?: Record<string, any>;
  sort_order: number;
  rules: IncentiveRule[];
}

interface IncentiveSetting {
  id: number;
  key: string;
  group: string;
  label: string;
  description?: string;
  type: string;
  value: string;
  options?: string[];
  is_editable: boolean;
}

interface Stats {
  total_types: number;
  active_types: number;
  active_rules: number;
  pending_entries: number;
  total_pending_amount: number;
  monthly_paid: number;
}

interface PageProps {
  types: IncentiveType[];
  settings: Record<string, IncentiveSetting[]>;
  stats: Stats;
}

const categoryColors: Record<string, string> = {
  performance: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  attendance: 'bg-green-500/10 text-green-600 border-green-500/20',
  safety: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  tenure: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  referral: 'bg-pink-500/10 text-pink-600 border-pink-500/20',
  other: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
};

const appliesToLabels: Record<string, string> = {
  all: 'All Staff',
  supervisor: 'Supervisors/Sergeants',
  guard: 'Guards Only',
  driver: 'Drivers Only',
  staff: 'Office Staff',
};

export default function IncentiveSettings({ types, settings, stats }: PageProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('types');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [showCalculateModal, setShowCalculateModal] = useState(false);
  const [editingType, setEditingType] = useState<IncentiveType | null>(null);
  const [selectedTypeForRule, setSelectedTypeForRule] = useState<IncentiveType | null>(null);
  const [editingRule, setEditingRule] = useState<IncentiveRule | null>(null);

  // Forms
  const [typeForm, setTypeForm] = useState({
    name: '',
    slug: '',
    description: '',
    category: 'performance',
    applies_to: 'all',
    requires_approval: true,
    default_config: {},
  });

  const [ruleForm, setRuleForm] = useState({
    name: '',
    description: '',
    condition_type: 'perfect_attendance',
    condition_config: '{}',
    calculation_type: 'fixed',
    calculation_config: '{"amount": 10000}',
    min_amount: '',
    max_amount: '',
    period_type: 'monthly',
  });

  const [calculateForm, setCalculateForm] = useState({
    period_start: '',
    period_end: '',
    incentive_type_id: '',
  });

  const filteredTypes = useMemo(() => {
    if (!searchQuery) return types;
    const q = searchQuery.toLowerCase();
    return types.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
    );
  }, [types, searchQuery]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-MW', {
      style: 'currency',
      currency: 'MWK',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleSaveType = () => {
    const url = editingType
      ? route('hr.incentive-settings.types.update', { type: editingType.id })
      : route('hr.incentive-settings.types.store');
    const method = editingType ? 'put' : 'post';

    router[method](
      url,
      { ...typeForm, requires_approval: typeForm.requires_approval },
      {
        onSuccess: () => {
          toast({ title: editingType ? 'Type updated' : 'Type created' });
          setShowTypeModal(false);
          setEditingType(null);
          setTypeForm({
            name: '',
            slug: '',
            description: '',
            category: 'performance',
            applies_to: 'all',
            requires_approval: true,
            default_config: {},
          });
        },
        onError: () => {
          toast({ title: 'Failed to save', variant: 'destructive' });
        },
      }
    );
  };

  const handleSaveRule = () => {
    if (!selectedTypeForRule) return;

    const url = editingRule
      ? route('hr.incentive-settings.rules.update', { rule: editingRule.id })
      : route('hr.incentive-settings.rules.store');
    const method = editingRule ? 'put' : 'post';

    router[method](
      url,
      {
        ...ruleForm,
        incentive_type_id: selectedTypeForRule.id,
        min_amount: ruleForm.min_amount ? Number(ruleForm.min_amount) : null,
        max_amount: ruleForm.max_amount ? Number(ruleForm.max_amount) : null,
      },
      {
        onSuccess: () => {
          toast({ title: editingRule ? 'Rule updated' : 'Rule created' });
          setShowRuleModal(false);
          setEditingRule(null);
          setRuleForm({
            name: '',
            description: '',
            condition_type: 'perfect_attendance',
            condition_config: '{}',
            calculation_type: 'fixed',
            calculation_config: '{"amount": 10000}',
            min_amount: '',
            max_amount: '',
            period_type: 'monthly',
          });
        },
        onError: () => {
          toast({ title: 'Failed to save', variant: 'destructive' });
        },
      }
    );
  };

  const handleCalculate = () => {
    router.post(route('hr.incentive-settings.calculate'), calculateForm, {
      onSuccess: () => {
        toast({ title: 'Incentives calculated successfully' });
        setShowCalculateModal(false);
      },
      onError: () => {
        toast({ title: 'Calculation failed', variant: 'destructive' });
      },
    });
  };

  const editType = (type: IncentiveType) => {
    setEditingType(type);
    setTypeForm({
      name: type.name,
      slug: type.slug,
      description: type.description || '',
      category: type.category,
      applies_to: type.applies_to,
      requires_approval: type.requires_approval,
      default_config: type.default_config || {},
    });
    setShowTypeModal(true);
  };

  const addRule = (type: IncentiveType) => {
    setSelectedTypeForRule(type);
    setEditingRule(null);
    setRuleForm({
      name: '',
      description: '',
      condition_type: 'perfect_attendance',
      condition_config: '{}',
      calculation_type: 'fixed',
      calculation_config: '{"amount": 10000}',
      min_amount: '',
      max_amount: '',
      period_type: 'monthly',
    });
    setShowRuleModal(true);
  };

  const editRule = (type: IncentiveType, rule: IncentiveRule) => {
    setSelectedTypeForRule(type);
    setEditingRule(rule);
    setRuleForm({
      name: rule.name,
      description: rule.description || '',
      condition_type: rule.condition_type,
      condition_config: '{}',
      calculation_type: rule.calculation_type,
      calculation_config: '{}',
      min_amount: rule.min_amount ? String(rule.min_amount) : '',
      max_amount: rule.max_amount ? String(rule.max_amount) : '',
      period_type: rule.period_type,
    });
    setShowRuleModal(true);
  };

  const deleteType = (type: IncentiveType) => {
    if (!confirm(`Delete "${type.name}"? This cannot be undone.`)) return;
    router.delete(route('hr.incentive-settings.types.destroy', { type: type.id }), {
      onSuccess: () => toast({ title: 'Type deleted' }),
      onError: () => toast({ title: 'Failed to delete', variant: 'destructive' }),
    });
  };

  const deleteRule = (rule: IncentiveRule) => {
    if (!confirm(`Delete rule "${rule.name}"?`)) return;
    router.delete(route('hr.incentive-settings.rules.destroy', { rule: rule.id }), {
      onSuccess: () => toast({ title: 'Rule deleted' }),
      onError: () => toast({ title: 'Failed to delete', variant: 'destructive' }),
    });
  };

  return (
    <HRLayout title="Incentive Settings">
      <Head title="Incentive Settings" />

      <div className="w-full px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Incentive Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Configure incentive types, rules, and calculation settings
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowCalculateModal(true)}>
              <Calculator className="w-4 h-4 mr-2" />
              Calculate
            </Button>
            <Button
              onClick={() => {
                setEditingType(null);
                setTypeForm({
                  name: '',
                  slug: '',
                  description: '',
                  category: 'performance',
                  applies_to: 'all',
                  requires_approval: true,
                  default_config: {},
                });
                setShowTypeModal(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Type
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-red-900/20 to-red-800/10 border-red-900/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-900/30">
                  <Trophy className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <div className="text-sm text-gray-400">Active Types</div>
                  <div className="text-2xl font-bold text-gray-100">{stats.active_types}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 border-blue-900/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-900/30">
                  <Settings className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <div className="text-sm text-gray-400">Active Rules</div>
                  <div className="text-2xl font-bold text-gray-100">{stats.active_rules}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-900/20 to-yellow-800/10 border-yellow-900/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-900/30">
                  <AlertCircle className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <div className="text-sm text-gray-400">Pending</div>
                  <div className="text-2xl font-bold text-gray-100">{stats.pending_entries}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-900/20 to-green-800/10 border-green-900/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-900/30">
                  <DollarSign className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <div className="text-sm text-gray-400">Pending Amount</div>
                  <div className="text-lg font-bold text-gray-100">
                    {formatCurrency(stats.total_pending_amount)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
            <TabsTrigger value="types">
              <Trophy className="w-4 h-4 mr-2" />
              Incentive Types
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="w-4 h-4 mr-2" />
              Global Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="types" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Incentive Types</CardTitle>
                    <CardDescription>Configure incentive categories and their rules</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search types..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-64"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredTypes.map((type) => (
                    <div
                      key={type.id}
                      className="border dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                              {type.name}
                            </h3>
                            <Badge
                              variant="outline"
                              className={categoryColors[type.category] || categoryColors.other}
                            >
                              {type.category}
                            </Badge>
                            {type.is_active ? (
                              <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                            {type.requires_approval && (
                              <Badge variant="outline" className="text-amber-600 border-amber-600/20">
                                Requires Approval
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {type.description || 'No description'}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span>Applies to: {appliesToLabels[type.applies_to]}</span>
                            <span>•</span>
                            <span>{type.rules?.length || 0} rules</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => addRule(type)}>
                            <Plus className="w-4 h-4 mr-1" />
                            Add Rule
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => editType(type)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600"
                            onClick={() => deleteType(type)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Rules List */}
                      {type.rules && type.rules.length > 0 && (
                        <div className="mt-4 pl-4 border-l-2 border-gray-200 dark:border-gray-700 space-y-2">
                          {type.rules.map((rule) => (
                            <div
                              key={rule.id}
                              className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-800/50 rounded"
                            >
                              <div className="flex items-center gap-3">
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                                <div>
                                  <span className="font-medium text-sm">{rule.name}</span>
                                  <span className="text-xs text-gray-500 ml-2">
                                    {rule.condition_type} • {rule.calculation_type} •{' '}
                                    {rule.period_type}
                                  </span>
                                </div>
                                {!rule.is_active && (
                                  <Badge variant="secondary" className="text-xs">
                                    Inactive
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => editRule(type, rule)}
                                >
                                  <Edit2 className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600"
                                  onClick={() => deleteRule(rule)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {filteredTypes.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No incentive types found</p>
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => setShowTypeModal(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create your first type
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Global Settings</CardTitle>
                <CardDescription>
                  Configure system-wide incentive calculation parameters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {Object.entries(settings).map(([group, groupSettings]) => (
                    <div key={group}>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider mb-3">
                        {group.replace('_', ' ')}
                      </h3>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {groupSettings.map((setting) => (
                          <div
                            key={setting.id}
                            className="p-4 border dark:border-gray-700 rounded-lg"
                          >
                            <Label className="font-medium">{setting.label}</Label>
                            <p className="text-xs text-gray-500 mt-1">{setting.description}</p>
                            <div className="mt-3">
                              {setting.type === 'boolean' ? (
                                <Switch
                                  checked={setting.value === '1'}
                                  disabled={!setting.is_editable}
                                  onCheckedChange={(checked: boolean) => {
                                    // TODO: Implement setting update
                                  }}
                                />
                              ) : setting.type === 'select' ? (
                                <Select
                                  value={setting.value}
                                  onValueChange={(v) => {
                                    // TODO: Implement setting update
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {setting.options?.map((opt) => (
                                      <SelectItem key={opt} value={opt}>
                                        {opt}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Input
                                  type={setting.type === 'number' ? 'number' : 'text'}
                                  value={setting.value}
                                  disabled={!setting.is_editable}
                                  onChange={(e) => {
                                    // TODO: Implement setting update
                                  }}
                                />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Type Modal */}
      <Dialog open={showTypeModal} onOpenChange={setShowTypeModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingType ? 'Edit Incentive Type' : 'Create Incentive Type'}</DialogTitle>
            <p className="text-sm text-gray-500">
              Define a new category of incentives with calculation rules
            </p>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Name</Label>
              <Input
                value={typeForm.name}
                onChange={(e) =>
                  setTypeForm({
                    ...typeForm,
                    name: e.target.value,
                    slug: editingType
                      ? typeForm.slug
                      : e.target.value.toLowerCase().replace(/\s+/g, '-'),
                  })
                }
                placeholder="e.g., Performance Bonus"
              />
            </div>
            {!editingType && (
              <div>
                <Label>Slug (unique identifier)</Label>
                <Input
                  value={typeForm.slug}
                  onChange={(e) => setTypeForm({ ...typeForm, slug: e.target.value })}
                  placeholder="performance-bonus"
                />
              </div>
            )}
            <div>
              <Label>Description</Label>
              <Input
                value={typeForm.description}
                onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })}
                placeholder="Brief description of this incentive type"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select
                  value={typeForm.category}
                  onValueChange={(v) => setTypeForm({ ...typeForm, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="attendance">Attendance</SelectItem>
                    <SelectItem value="safety">Safety</SelectItem>
                    <SelectItem value="tenure">Tenure</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Applies To</Label>
                <Select
                  value={typeForm.applies_to}
                  onValueChange={(v) => setTypeForm({ ...typeForm, applies_to: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Staff</SelectItem>
                    <SelectItem value="supervisor">Supervisors</SelectItem>
                    <SelectItem value="guard">Guards Only</SelectItem>
                    <SelectItem value="driver">Drivers</SelectItem>
                    <SelectItem value="staff">Office Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <Label className="cursor-pointer">Requires Approval</Label>
                <p className="text-xs text-gray-500">
                  Incentives must be approved before payment
                </p>
              </div>
              <Switch
                checked={typeForm.requires_approval}
                onCheckedChange={(v: boolean) => setTypeForm({ ...typeForm, requires_approval: v })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowTypeModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveType}>
              {editingType ? 'Update Type' : 'Create Type'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rule Modal */}
      <Dialog open={showRuleModal} onOpenChange={setShowRuleModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingRule ? 'Edit Rule' : 'Add Rule'}</DialogTitle>
            <p className="text-sm text-gray-500">
              {selectedTypeForRule && `For incentive type: ${selectedTypeForRule.name}`}
            </p>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Rule Name</Label>
              <Input
                value={ruleForm.name}
                onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                placeholder="e.g., Monthly Perfect Attendance"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={ruleForm.description}
                onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })}
                placeholder="When and how this incentive applies"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Condition</Label>
                <Select
                  value={ruleForm.condition_type}
                  onValueChange={(v) => setRuleForm({ ...ruleForm, condition_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="perfect_attendance">Perfect Attendance</SelectItem>
                    <SelectItem value="attendance_threshold">Attendance Threshold</SelectItem>
                    <SelectItem value="no_absences">No Absences</SelectItem>
                    <SelectItem value="no_lates">No Lates</SelectItem>
                    <SelectItem value="performance_score">Performance Score</SelectItem>
                    <SelectItem value="safety_incident_free">Safety Incident Free</SelectItem>
                    <SelectItem value="tenure_years">Tenure Years</SelectItem>
                    <SelectItem value="always">Always Apply</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Calculation</Label>
                <Select
                  value={ruleForm.calculation_type}
                  onValueChange={(v) => setRuleForm({ ...ruleForm, calculation_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                    <SelectItem value="percentage_of_base">% of Base</SelectItem>
                    <SelectItem value="per_unit">Per Unit</SelectItem>
                    <SelectItem value="tiered">Tiered</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Min Amount (optional)</Label>
                <Input
                  type="number"
                  value={ruleForm.min_amount}
                  onChange={(e) => setRuleForm({ ...ruleForm, min_amount: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Max Amount (optional)</Label>
                <Input
                  type="number"
                  value={ruleForm.max_amount}
                  onChange={(e) => setRuleForm({ ...ruleForm, max_amount: e.target.value })}
                  placeholder="∞"
                />
              </div>
            </div>
            <div>
              <Label>Period Type</Label>
              <Select
                value={ruleForm.period_type}
                onValueChange={(v) => setRuleForm({ ...ruleForm, period_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                  <SelectItem value="one_time">One Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowRuleModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRule}>
              {editingRule ? 'Update Rule' : 'Create Rule'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Calculate Modal */}
      <Dialog open={showCalculateModal} onOpenChange={setShowCalculateModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Calculate Incentives</DialogTitle>
            <p className="text-sm text-gray-500">Run incentive calculations for a specific period</p>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Period Start</Label>
                <Input
                  type="date"
                  value={calculateForm.period_start}
                  onChange={(e) =>
                    setCalculateForm({ ...calculateForm, period_start: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Period End</Label>
                <Input
                  type="date"
                  value={calculateForm.period_end}
                  onChange={(e) =>
                    setCalculateForm({ ...calculateForm, period_end: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <Label>Incentive Type (optional)</Label>
              <Select
                value={calculateForm.incentive_type_id}
                onValueChange={(v) =>
                  setCalculateForm({ ...calculateForm, incentive_type_id: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  {types.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCalculateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCalculate}>
              <Calculator className="w-4 h-4 mr-2" />
              Calculate
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </HRLayout>
  );
}
