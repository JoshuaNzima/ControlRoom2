import React, { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/Components/ui/tabs';
import { useForm } from '@inertiajs/react';
import axios from 'axios';
import IconMapper from '@/Components/IconMapper';
import { formatCurrencyMWK } from '@/Components/format';
import EditSiteModal from '@/Components/Clients/EditSiteModal';
import AddSiteModal from '@/Components/Clients/AddSiteModal';

/**
 * Portal-based confirmation dialog to avoid nesting HeadlessUI Dialogs
 */
function ConfirmDialogPortal({ 
  open, 
  onClose, 
  onConfirm, 
  loading, 
  title, 
  message, 
  confirmText = 'Confirm',
  variant = 'destructive'
}: { 
  open: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  loading: boolean;
  title: string;
  message: string;
  confirmText?: string;
  variant?: 'destructive' | 'default';
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); return () => setMounted(false); }, []);

  if (!open || !mounted) return null;

  const content = (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center px-4"
      onClick={() => !loading && onClose()}
    >
      <div className="absolute inset-0 bg-gray-500/75 dark:bg-gray-950/80" />
      <div
        className="relative w-full max-w-sm rounded-xl bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">{message}</p>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={() => !loading && onClose()} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant={variant}
            size="sm"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Processing...' : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(content, document.body);
  }
  return null;
}

interface Site {
  id: number;
  name: string;
  address: string;
  status: string;
  required_guards?: number;
  guard_count?: number;
  zone_id?: number | null;
  site_type?: string | null;
  contact_person?: string;
  phone?: string;
}

interface Service {
  id: number;
  name: string;
  monthly_price: number;
  custom_price?: number | null;
  quantity?: number;
}

interface ClientUser {
  id: number;
  name: string;
  email: string;
  phone?: string;
  status?: string;
  pivot?: {
    role: string;
  };
}

interface Payment {
  id: number;
  year: number;
  month: number;
  paid: boolean;
  amount_due: number;
  amount_paid: number;
  prepaid_amount?: number;
}

interface Contract {
  id: number;
  title: string;
  start_date: string;
  end_date?: string;
  value: number;
  status: string;
  renewal_date?: string;
}

interface AssignedPerson {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  position?: string;
}

interface Client {
  id: number;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  status?: string;
  sites?: Site[];
  services?: Service[];
  services_count?: number;
  total_due?: number;
  total_paid?: number;
  monthly_rate?: number;
  billing_start_date?: string;
  last_payment_date?: string;
  users?: ClientUser[];
  payments?: Payment[];
  contracts?: Contract[];
  supervisor?: AssignedPerson | null;
  sergeant?: AssignedPerson | null;
  payment_summary?: {
    total_due: number;
    total_paid: number;
    outstanding_amount: number;
    outstanding_months: number;
    is_overdue: boolean;
  };
}

interface ClientDetailsModalProps {
  client: Client;
  open: boolean;
  onClose: () => void;
  services?: Service[];
  onClientUpdated?: (client: any) => void;
  zones?: Array<{ id: number; name: string }>;
  supervisors?: Array<{ id: number; name: string; email?: string }>;
  sergeants?: Array<{ id: number; name: string; position?: string }>;
}

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function ClientDetailsModal({ 
  client, 
  open, 
  onClose, 
  services = [], 
  onClientUpdated, 
  zones = [],
  supervisors = [],
  sergeants = []
}: ClientDetailsModalProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [addSiteOpen, setAddSiteOpen] = useState(false);
  const [editSiteOpen, setEditSiteOpen] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState<number | null>(null);
  
  // Confirmation dialogs
  const [confirmDeleteSiteOpen, setConfirmDeleteSiteOpen] = useState(false);
  const [deletingSiteId, setDeletingSiteId] = useState<number | null>(null);
  
  const [confirmUnassignOpen, setConfirmUnassignOpen] = useState(false);
  const [unassignType, setUnassignType] = useState<'supervisor' | 'sergeant' | null>(null);

  // Async state handling - per-action loading and error states
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setLoadingState = (key: string, value: boolean) => {
    setLoading(prev => ({ ...prev, [key]: value }));
  };

  const setErrorState = (key: string, value: string) => {
    setErrors(prev => ({ ...prev, [key]: value }));
    if (value) setTimeout(() => setErrors(prev => ({ ...prev, [key]: '' })), 5000);
  };

  const [serviceSelections, setServiceSelections] = useState<Record<number, { selected: boolean; custom_price: number | null; quantity: number }>>(() => {
    const initial: Record<number, { selected: boolean; custom_price: number | null; quantity: number }> = {};
    services.forEach(svc => {
      const attached = client.services?.find(cs => cs.id === svc.id);
      initial[svc.id] = {
        selected: !!attached,
        custom_price: attached?.custom_price ?? null,
        quantity: attached?.quantity ?? 1,
      };
    });
    return initial;
  });

  const { processing } = useForm();

  const refreshClient = useCallback(async () => {
    try {
      if (onClientUpdated) {
        const showUrl = route('admin.clients.json', { client: client.id });
        const resp = await axios.get(showUrl, { headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' } });
        onClientUpdated(resp.data);
      }
    } catch (_) {}
  }, [client?.id, onClientUpdated]);

  // Site actions
  const confirmDeleteSite = useCallback(async () => {
    if (!deletingSiteId) return;
    const key = `delete_site_${deletingSiteId}`;
    setLoadingState(key, true);
    setErrorState(key, '');
    try {
      const url = route('admin.clients.sites.destroy', { client: client.id, site: deletingSiteId });
      await axios.delete(url, { headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' } });
      await refreshClient();
      setConfirmDeleteSiteOpen(false);
      setDeletingSiteId(null);
    } catch (e: any) {
      setErrorState(key, e?.response?.data?.message || 'Failed to delete site.');
    } finally {
      setLoadingState(key, false);
    }
  }, [client?.id, deletingSiteId, refreshClient]);

  const handleSiteAdded = useCallback(() => {
    setAddSiteOpen(false);
    refreshClient();
  }, [refreshClient]);

  const handleSiteUpdated = useCallback(() => {
    setEditSiteOpen(false);
    setSelectedSiteId(null);
    refreshClient();
  }, [refreshClient]);

  // Service actions
  const handleServiceSelectionChange = (serviceId: number, field: 'selected' | 'custom_price' | 'quantity', value: any) => {
    setServiceSelections(prev => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        [field]: value,
      },
    }));
  };

  const handleSaveServices = async () => {
    const key = 'save_services';
    setLoadingState(key, true);
    setErrorState(key, '');
    try {
      const servicesPayload = Object.entries(serviceSelections)
        .filter(([, data]) => data.selected)
        .map(([id, data]) => ({
          id: Number(id),
          custom_price: data.custom_price,
          quantity: data.quantity,
        }));

      const url = route('admin.clients.services.update', { client: client.id });
      await axios.post(url, { services: servicesPayload }, { headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' } });
      await refreshClient();
    } catch (err) {
      setErrorState(key, 'Failed to update services.');
    } finally {
      setLoadingState(key, false);
    }
  };

  // Supervisor/Sergeant assignment actions
  const handleAssignSupervisor = async (supervisorId: number) => {
    const key = 'assign_supervisor';
    setLoadingState(key, true);
    setErrorState(key, '');
    try {
      await axios.post(
        route('admin.clients.assign-supervisor', { client: client.id }),
        { supervisor_id: supervisorId },
        { headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' } }
      );
      await refreshClient();
    } catch (e: any) {
      setErrorState(key, e?.response?.data?.message || 'Failed to assign supervisor.');
    } finally {
      setLoadingState(key, false);
    }
  };

  const handleUnassignSupervisor = async () => {
    const key = 'unassign_supervisor';
    setLoadingState(key, true);
    setErrorState(key, '');
    try {
      await axios.post(
        route('admin.clients.unassign-supervisor', { client: client.id }),
        {},
        { headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' } }
      );
      await refreshClient();
      setConfirmUnassignOpen(false);
      setUnassignType(null);
    } catch (e: any) {
      setErrorState(key, e?.response?.data?.message || 'Failed to unassign supervisor.');
    } finally {
      setLoadingState(key, false);
    }
  };

  const handleAssignSergeant = async (sergeantId: number) => {
    const key = 'assign_sergeant';
    setLoadingState(key, true);
    setErrorState(key, '');
    try {
      await axios.post(
        route('admin.clients.assign-sergeant', { client: client.id }),
        { sergeant_id: sergeantId },
        { headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' } }
      );
      await refreshClient();
    } catch (e: any) {
      setErrorState(key, e?.response?.data?.message || 'Failed to assign sergeant.');
    } finally {
      setLoadingState(key, false);
    }
  };

  const handleUnassignSergeant = async () => {
    const key = 'unassign_sergeant';
    setLoadingState(key, true);
    setErrorState(key, '');
    try {
      await axios.post(
        route('admin.clients.unassign-sergeant', { client: client.id }),
        {},
        { headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' } }
      );
      await refreshClient();
      setConfirmUnassignOpen(false);
      setUnassignType(null);
    } catch (e: any) {
      setErrorState(key, e?.response?.data?.message || 'Failed to unassign sergeant.');
    } finally {
      setLoadingState(key, false);
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadgeVariant = (status?: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'overdue': return 'destructive';
      case 'inactive': return 'default';
      default: return 'default';
    }
  };

  const getSiteTypeLabel = (type?: string | null) => {
    if (!type) return 'Site';
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const getContractStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300';
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-700/40 dark:text-gray-300';
      case 'expired': return 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700/40 dark:text-gray-300';
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && !processing && onClose()}>
        <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-xl bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 p-0">
          {/* Header */}
          <DialogHeader>
            <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <DialogTitle className="text-lg sm:text-xl">{client.name}</DialogTitle>
                  <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    Client since {formatDate(client.billing_start_date)}
                  </p>
                </div>
                <Badge variant={getStatusBadgeVariant(client.status)} className="shrink-0 text-xs sm:text-sm">
                  {client.status || 'Active'}
                </Badge>
              </div>
            </div>
          </DialogHeader>

          {/* Tabs - Scrollable on mobile */}
          <div className="px-4 sm:px-6 py-2 sm:py-3 border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 min-w-[400px] sm:min-w-0 bg-gray-100 dark:bg-gray-900">
                <TabsTrigger value="overview" className="text-xs sm:text-sm px-2 sm:px-4">
                  <IconMapper name="LayoutDashboard" className="w-4 h-4 mr-1.5 hidden sm:inline" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="sites" className="text-xs sm:text-sm px-2 sm:px-4">
                  <IconMapper name="MapPin" className="w-4 h-4 mr-1.5 hidden sm:inline" />
                  Sites
                </TabsTrigger>
                <TabsTrigger value="services" className="text-xs sm:text-sm px-2 sm:px-4">
                  <IconMapper name="Briefcase" className="w-4 h-4 mr-1.5 hidden sm:inline" />
                  Services
                </TabsTrigger>
                <TabsTrigger value="users" className="text-xs sm:text-sm px-2 sm:px-4">
                  <IconMapper name="Users" className="w-4 h-4 mr-1.5 hidden sm:inline" />
                  Users
                </TabsTrigger>
                <TabsTrigger value="payments" className="text-xs sm:text-sm px-2 sm:px-4">
                  <IconMapper name="Wallet" className="w-4 h-4 mr-1.5 hidden sm:inline" />
                  Payments
                </TabsTrigger>
                <TabsTrigger value="contracts" className="text-xs sm:text-sm px-2 sm:px-4">
                  <IconMapper name="FileText" className="w-4 h-4 mr-1.5 hidden sm:inline" />
                  Contracts
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Content */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 overflow-y-auto max-h-[calc(90vh-180px)]">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-4 sm:space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                  <Card className="bg-gradient-to-br from-coin-50 to-white dark:from-coin-950/20 dark:to-gray-900 border-coin-200 dark:border-coin-800">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="p-1.5 sm:p-2 rounded-lg bg-coin-100 dark:bg-coin-900/30">
                          <IconMapper name="MapPin" className="w-4 h-4 sm:w-5 sm:h-5 text-coin-600 dark:text-coin-400" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Sites</p>
                          <p className="text-base sm:text-xl font-semibold text-gray-900 dark:text-gray-100">{client.sites?.length || 0}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-gray-900 border-emerald-200 dark:border-emerald-800">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="p-1.5 sm:p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                          <IconMapper name="Briefcase" className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Services</p>
                          <p className="text-base sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
                            {client.services_count || client.services?.length || 0}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-gray-900 border-blue-200 dark:border-blue-800">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="p-1.5 sm:p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                          <IconMapper name="Banknote" className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Monthly</p>
                          <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {formatCurrencyMWK(client.monthly_rate || 0)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className={`bg-gradient-to-br ${client.payment_summary?.is_overdue ? 'from-red-50 to-white dark:from-red-950/20 dark:to-gray-900 border-red-200 dark:border-red-800' : 'from-amber-50 to-white dark:from-amber-950/20 dark:to-gray-900 border-amber-200 dark:border-amber-800'}`}>
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className={`p-1.5 sm:p-2 rounded-lg ${client.payment_summary?.is_overdue ? 'bg-red-100 dark:bg-red-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
                          <IconMapper name="Wallet" className={`w-4 h-4 sm:w-5 sm:h-5 ${client.payment_summary?.is_overdue ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Outstanding</p>
                          <p className={`text-xs sm:text-sm font-semibold truncate ${client.payment_summary?.is_overdue ? 'text-red-700 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>
                            {formatCurrencyMWK(client.payment_summary?.outstanding_amount || 0)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Contact Info */}
                <Card className="border-gray-200 dark:border-gray-800">
                  <CardHeader className="pb-2 sm:pb-3">
                    <CardTitle className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <IconMapper name="User" className="w-4 h-4 text-gray-500" />
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Contact Person</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {client.contact_person || <span className="text-gray-400 dark:text-gray-600 italic">Not set</span>}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Phone</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {client.phone || <span className="text-gray-400 dark:text-gray-600 italic">Not set</span>}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Email</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {client.email || <span className="text-gray-400 dark:text-gray-600 italic">Not set</span>}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Last Payment</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {client.last_payment_date ? formatDate(client.last_payment_date) : <span className="text-gray-400 dark:text-gray-600 italic">No payments</span>}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Supervisor & Sergeant Assignment */}
                <Card className="border-gray-200 dark:border-gray-800">
                  <CardHeader className="pb-2 sm:pb-3">
                    <CardTitle className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <IconMapper name="UserCog" className="w-4 h-4 text-gray-500" />
                      Assigned Personnel
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Supervisor */}
                      <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Supervisor</span>
                          {client.supervisor && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs text-red-600 hover:text-red-700"
                              onClick={() => { setUnassignType('supervisor'); setConfirmUnassignOpen(true); }}
                              disabled={loading['unassign_supervisor']}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                        {client.supervisor ? (
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                              <IconMapper name="User" className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{client.supervisor.name}</p>
                              {client.supervisor.email && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{client.supervisor.email}</p>
                              )}
                            </div>
                          </div>
                        ) : supervisors.length > 0 ? (
                          <select
                            className="w-full text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5"
                            onChange={(e) => e.target.value && handleAssignSupervisor(Number(e.target.value))}
                            disabled={loading['assign_supervisor']}
                            value=""
                          >
                            <option value="">Assign supervisor...</option>
                            {supervisors.map(s => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                        ) : (
                          <p className="text-xs text-gray-400 dark:text-gray-600 italic">No supervisors available</p>
                        )}
                        {errors['assign_supervisor'] && (
                          <p className="text-xs text-red-600 mt-1">{errors['assign_supervisor']}</p>
                        )}
                      </div>

                      {/* Sergeant */}
                      <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Sergeant</span>
                          {client.sergeant && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs text-red-600 hover:text-red-700"
                              onClick={() => { setUnassignType('sergeant'); setConfirmUnassignOpen(true); }}
                              disabled={loading['unassign_sergeant']}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                        {client.sergeant ? (
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                              <IconMapper name="Shield" className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{client.sergeant.name}</p>
                              {client.sergeant.position && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">{client.sergeant.position}</p>
                              )}
                            </div>
                          </div>
                        ) : sergeants.length > 0 ? (
                          <select
                            className="w-full text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5"
                            onChange={(e) => e.target.value && handleAssignSergeant(Number(e.target.value))}
                            disabled={loading['assign_sergeant']}
                            value=""
                          >
                            <option value="">Assign sergeant...</option>
                            {sergeants.map(s => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                        ) : (
                          <p className="text-xs text-gray-400 dark:text-gray-600 italic">No sergeants available</p>
                        )}
                        {errors['assign_sergeant'] && (
                          <p className="text-xs text-red-600 mt-1">{errors['assign_sergeant']}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Sites Preview */}
                {client.sites && client.sites.length > 0 && (
                  <Card className="border-gray-200 dark:border-gray-800">
                    <CardHeader className="pb-2 sm:pb-3">
                      <CardTitle className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <IconMapper name="MapPin" className="w-4 h-4 text-gray-500" />
                          Recent Sites
                        </span>
                        <Button variant="ghost" size="sm" onClick={() => setActiveTab('sites')} className="text-coin-600 hover:text-coin-700 text-xs">
                          View all
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {client.sites.slice(0, 3).map(site => (
                          <div key={site.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{site.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{site.address}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge variant={site.status === 'active' ? 'success' : 'default'} className="text-xs">
                                {site.status}
                              </Badge>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {site.guard_count || 0}/{site.required_guards || 0}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Sites Tab */}
            {activeTab === 'sites' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Sites</h3>
                  <Button onClick={() => setAddSiteOpen(true)} size="sm" disabled={loading['add_site']}>
                    {loading['add_site'] ? (
                      <IconMapper name="Loader2" className="w-4 h-4 mr-1.5 animate-spin" />
                    ) : (
                      <IconMapper name="Plus" className="w-4 h-4 mr-1.5" />
                    )}
                    Add Site
                  </Button>
                </div>

                {client.sites && client.sites.length > 0 ? (
                  <div className="space-y-3">
                    {client.sites.map(site => {
                      const siteLoadingKey = `delete_site_${site.id}`;
                      return (
                        <Card key={site.id} className="border-gray-200 dark:border-gray-800 overflow-hidden">
                          <CardContent className="p-0">
                            <div className="p-3 sm:p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm sm:text-base">{site.name}</h4>
                                    <Badge variant={site.status === 'active' ? 'success' : 'default'} className="text-xs">
                                      {site.status}
                                    </Badge>
                                    {site.site_type && (
                                      <Badge variant="secondary" className="text-xs">
                                        {getSiteTypeLabel(site.site_type)}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">{site.address}</p>
                                  {(site.contact_person || site.phone) && (
                                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                                      {site.contact_person && (
                                        <span className="flex items-center gap-1">
                                          <IconMapper name="User" className="w-3 h-3" />
                                          {site.contact_person}
                                        </span>
                                      )}
                                      {site.phone && (
                                        <span className="flex items-center gap-1">
                                          <IconMapper name="Phone" className="w-3 h-3" />
                                          {site.phone}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => { setSelectedSiteId(site.id); setEditSiteOpen(true); }}
                                    className="h-8 w-8 p-0"
                                    disabled={loading[`edit_site_${site.id}`]}
                                  >
                                    <IconMapper name="Pencil" className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => { setDeletingSiteId(site.id); setConfirmDeleteSiteOpen(true); }}
                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                                    disabled={loading[siteLoadingKey]}
                                  >
                                    {loading[siteLoadingKey] ? (
                                      <IconMapper name="Loader2" className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <IconMapper name="Trash2" className="w-4 h-4" />
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </div>
                            <div className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800">
                              <div className="flex items-center justify-between text-xs sm:text-sm">
                                <div className="flex items-center gap-3 sm:gap-4">
                                  <span className="text-gray-500 dark:text-gray-400">
                                    Required: <span className="font-medium text-gray-900 dark:text-gray-100">{site.required_guards || 0}</span>
                                  </span>
                                  <span className="text-gray-500 dark:text-gray-400">
                                    Assigned: <span className="font-medium text-gray-900 dark:text-gray-100">{site.guard_count || 0}</span>
                                  </span>
                                </div>
                                {site.zone_id ? (
                                  <Badge variant="outline" className="text-xs">
                                    {zones.find(z => z.id === site.zone_id)?.name || `Zone ${site.zone_id}`}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs text-gray-400">
                                    Unassigned
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 sm:py-12 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                    <IconMapper name="MapPin" className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">No sites yet</h3>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Add a site to get started</p>
                    <Button onClick={() => setAddSiteOpen(true)} className="mt-4" size="sm">
                      <IconMapper name="Plus" className="w-4 h-4 mr-1.5" />
                      Add Site
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Services Tab */}
            {activeTab === 'services' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Services</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Toggle services and set custom rates
                    </p>
                  </div>
                  <Button 
                    onClick={handleSaveServices} 
                    size="sm" 
                    disabled={loading['save_services']}
                  >
                    {loading['save_services'] ? (
                      <>
                        <IconMapper name="Loader2" className="w-4 h-4 mr-1.5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <IconMapper name="Save" className="w-4 h-4 mr-1.5" />
                        Save
                      </>
                    )}
                  </Button>
                </div>
                {errors['save_services'] && (
                  <p className="text-xs text-red-600 bg-red-50 dark:bg-red-950/20 p-2 rounded">{errors['save_services']}</p>
                )}

                {services.length > 0 ? (
                  <div className="space-y-2 sm:space-y-3">
                    {services.map(svc => {
                      const selection = serviceSelections[svc.id] || { selected: false, custom_price: null, quantity: 1 };
                      return (
                        <Card 
                          key={svc.id} 
                          className={`border-gray-200 dark:border-gray-800 transition-all ${selection.selected ? 'ring-1 ring-coin-500 dark:ring-coin-400' : ''}`}
                        >
                          <CardContent className="p-3 sm:p-4">
                            <div className="flex items-start gap-3 sm:gap-4">
                              <div className="pt-0.5">
                                <input
                                  type="checkbox"
                                  checked={selection.selected}
                                  onChange={(e) => handleServiceSelectionChange(svc.id, 'selected', e.target.checked)}
                                  className="h-4 w-4 rounded border-gray-300 text-coin-600 focus:ring-coin-500 dark:border-gray-600 dark:bg-gray-700"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <h4 className={`text-sm font-medium ${selection.selected ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-500'}`}>
                                    {svc.name}
                                  </h4>
                                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                    {formatCurrencyMWK(svc.monthly_price)}
                                  </p>
                                </div>
                                {selection.selected && (
                                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mt-3">
                                    <div className="w-full sm:flex-1">
                                      <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Custom Price</label>
                                      <input
                                        type="number"
                                        value={selection.custom_price ?? ''}
                                        onChange={(e) => handleServiceSelectionChange(svc.id, 'custom_price', e.target.value ? Number(e.target.value) : null)}
                                        placeholder={svc.monthly_price.toString()}
                                        className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-coin-500"
                                      />
                                    </div>
                                    <div className="w-20 sm:w-24">
                                      <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Qty</label>
                                      <input
                                        type="number"
                                        min={1}
                                        value={selection.quantity}
                                        onChange={(e) => handleServiceSelectionChange(svc.id, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                                        className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-coin-500"
                                      />
                                    </div>
                                    <div className="text-left sm:text-right">
                                      <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Total</label>
                                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                        {formatCurrencyMWK((selection.custom_price ?? svc.monthly_price) * selection.quantity)}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 sm:py-12 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                    <IconMapper name="Briefcase" className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">No services available</h3>
                  </div>
                )}

                {/* Current Services Summary */}
                {client.services && client.services.length > 0 && (
                  <Card className="border-gray-200 dark:border-gray-800 mt-4 sm:mt-6">
                    <CardHeader className="pb-2 sm:pb-3">
                      <CardTitle className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">
                        Current Active Services
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {client.services.map(service => (
                          <div key={service.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                            <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">{service.name}</span>
                            <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                              <span className="text-gray-500 dark:text-gray-400 hidden sm:inline">Qty: {service.quantity || 1}</span>
                              <span className="text-gray-900 dark:text-gray-100 font-medium">
                                {formatCurrencyMWK((service.custom_price ?? service.monthly_price) * (service.quantity || 1))}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">Total Monthly</span>
                        <span className="text-base sm:text-lg font-semibold text-coin-600 dark:text-coin-400">
                          {formatCurrencyMWK(client.monthly_rate || 0)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Client Portal Users</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Users with access to the client portal
                    </p>
                  </div>
                  <Button size="sm" disabled>
                    <IconMapper name="Plus" className="w-4 h-4 mr-1.5" />
                    Add User
                  </Button>
                </div>

                {client.users && client.users.length > 0 ? (
                  <div className="space-y-2 sm:space-y-3">
                    {client.users.map(user => (
                      <Card key={user.id} className="border-gray-200 dark:border-gray-800">
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-coin-600 to-coin-700 flex items-center justify-center text-white font-bold text-sm">
                              {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{user.name}</p>
                                <Badge variant={user.status === 'active' ? 'success' : 'default'} className="text-xs">
                                  {user.status || 'Active'}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <Badge variant="outline" className="text-xs capitalize">
                                {user.pivot?.role || 'viewer'}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 sm:py-12 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                    <IconMapper name="Users" className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">No portal users</h3>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Add a user to give them client portal access</p>
                  </div>
                )}
              </div>
            )}

            {/* Payments Tab */}
            {activeTab === 'payments' && (
              <div className="space-y-4">
                {/* Payment Summary */}
                <Card className="border-gray-200 dark:border-gray-800">
                  <CardHeader className="pb-2 sm:pb-3">
                    <CardTitle className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">
                      {new Date().getFullYear()} Payment Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                      <div className="text-center p-2 sm:p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Total Due</p>
                        <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100">
                          {formatCurrencyMWK(client.payment_summary?.total_due || 0)}
                        </p>
                      </div>
                      <div className="text-center p-2 sm:p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Paid</p>
                        <p className="text-sm sm:text-base font-semibold text-emerald-700 dark:text-emerald-400">
                          {formatCurrencyMWK(client.payment_summary?.total_paid || 0)}
                        </p>
                      </div>
                      <div className={`text-center p-2 sm:p-3 rounded-lg ${client.payment_summary?.is_overdue ? 'bg-red-50 dark:bg-red-950/20' : 'bg-amber-50 dark:bg-amber-950/20'}`}>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Outstanding</p>
                        <p className={`text-sm sm:text-base font-semibold ${client.payment_summary?.is_overdue ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'}`}>
                          {formatCurrencyMWK(client.payment_summary?.outstanding_amount || 0)}
                        </p>
                      </div>
                      <div className="text-center p-2 sm:p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Months Behind</p>
                        <p
                          className={`text-sm sm:text-base font-semibold ${(((client.payment_summary?.outstanding_months ?? 0) ?? 0) >= 3) ? 'text-red-700 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}
                        >
                          {client.payment_summary?.outstanding_months ?? 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Payment History */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Payment History</h3>
                  {client.payments && client.payments.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs sm:text-sm">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="text-left py-2 px-2 sm:px-3 font-medium text-gray-500 dark:text-gray-400">Period</th>
                            <th className="text-right py-2 px-2 sm:px-3 font-medium text-gray-500 dark:text-gray-400">Due</th>
                            <th className="text-right py-2 px-2 sm:px-3 font-medium text-gray-500 dark:text-gray-400">Paid</th>
                            <th className="text-center py-2 px-2 sm:px-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {client.payments.slice(0, 12).map(payment => (
                            <tr key={payment.id} className="border-b border-gray-100 dark:border-gray-800">
                              <td className="py-2 px-2 sm:px-3 text-gray-900 dark:text-gray-100">
                                {monthNames[payment.month - 1]} {payment.year}
                              </td>
                              <td className="py-2 px-2 sm:px-3 text-right text-gray-900 dark:text-gray-100">
                                {formatCurrencyMWK(payment.amount_due)}
                              </td>
                              <td className="py-2 px-2 sm:px-3 text-right text-gray-900 dark:text-gray-100">
                                {formatCurrencyMWK(payment.amount_paid)}
                              </td>
                              <td className="py-2 px-2 sm:px-3 text-center">
                                <Badge variant={payment.paid ? 'success' : 'destructive'} className="text-xs">
                                  {payment.paid ? 'Paid' : 'Unpaid'}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                      <IconMapper name="Wallet" className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">No payment records</h3>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Contracts Tab */}
            {activeTab === 'contracts' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Contracts</h3>
                  <Button size="sm" disabled>
                    <IconMapper name="Plus" className="w-4 h-4 mr-1.5" />
                    Add Contract
                  </Button>
                </div>

                {client.contracts && client.contracts.length > 0 ? (
                  <div className="space-y-2 sm:space-y-3">
                    {client.contracts.map(contract => (
                      <Card key={contract.id} className="border-gray-200 dark:border-gray-800">
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">{contract.title}</h4>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${getContractStatusColor(contract.status)}`}>
                                  {contract.status}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                                <span className="flex items-center gap-1">
                                  <IconMapper name="Calendar" className="w-3 h-3" />
                                  {formatDate(contract.start_date)} - {contract.end_date ? formatDate(contract.end_date) : 'Ongoing'}
                                </span>
                                <span className="flex items-center gap-1">
                                  <IconMapper name="Banknote" className="w-3 h-3" />
                                  {formatCurrencyMWK(contract.value)}
                                </span>
                              </div>
                              {contract.renewal_date && (
                                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                  Renewal: {formatDate(contract.renewal_date)}
                                </p>
                              )}
                            </div>
                            <Button variant="ghost" size="sm" className="shrink-0 h-8 w-8 p-0" disabled>
                              <IconMapper name="MoreVertical" className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 sm:py-12 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                    <IconMapper name="FileText" className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">No contracts</h3>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Add a contract to track agreements</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Site Modal */}
      <AddSiteModal
        open={addSiteOpen}
        onClose={() => setAddSiteOpen(false)}
        clientId={client.id}
        onAdded={handleSiteAdded}
        zones={zones}
      />

      {/* Edit Site Modal */}
      <EditSiteModal
        open={editSiteOpen}
        onClose={() => { setEditSiteOpen(false); setSelectedSiteId(null); }}
        clientId={client.id}
        siteId={selectedSiteId}
        onSaved={handleSiteUpdated}
        zones={zones}
      />

      {/* Delete Site Confirmation */}
      <ConfirmDialogPortal
        open={confirmDeleteSiteOpen}
        onClose={() => { setConfirmDeleteSiteOpen(false); setDeletingSiteId(null); }}
        onConfirm={confirmDeleteSite}
        loading={deletingSiteId ? loading[`delete_site_${deletingSiteId}`] : false}
        title="Delete Site"
        message="This site will be moved to deleted items. You can restore it later."
      />

      {/* Unassign Confirmation */}
      <ConfirmDialogPortal
        open={confirmUnassignOpen}
        onClose={() => { setConfirmUnassignOpen(false); setUnassignType(null); }}
        onConfirm={() => unassignType === 'supervisor' ? handleUnassignSupervisor() : handleUnassignSergeant()}
        loading={unassignType === 'supervisor' ? loading['unassign_supervisor'] : loading['unassign_sergeant']}
        title={`Remove ${unassignType === 'supervisor' ? 'Supervisor' : 'Sergeant'}`}
        message={`Are you sure you want to remove the ${unassignType} from this client?`}
        confirmText="Remove"
        variant="default"
      />
    </>
  );
}
