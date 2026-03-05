import React, { useState, useCallback } from 'react';
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
}

interface ClientDetailsModalProps {
  client: Client;
  open: boolean;
  onClose: () => void;
  services?: Service[];
  onClientUpdated?: (client: any) => void;
  zones?: Array<{ id: number; name: string }>;
}

export default function ClientDetailsModal({ client, open, onClose, services = [], onClientUpdated, zones = [] }: ClientDetailsModalProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [addSiteOpen, setAddSiteOpen] = useState(false);
  const [editSiteOpen, setEditSiteOpen] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState<number | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deletingSiteId, setDeletingSiteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
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
  const [savingServices, setSavingServices] = useState(false);

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

  const confirmDelete = useCallback(async () => {
    if (!deletingSiteId) return;
    setDeleting(true);
    try {
      const url = route('admin.clients.sites.destroy', { client: client.id, site: deletingSiteId });
      await axios.delete(url, { headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' } });
      await refreshClient();
      setConfirmDeleteOpen(false);
      setDeletingSiteId(null);
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to delete site.');
    } finally {
      setDeleting(false);
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
    setSavingServices(true);
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
      console.error('Failed to update services', err);
      alert('Failed to update services.');
    } finally {
      setSavingServices(false);
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

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && !processing && onClose()}>
        <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-xl bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 p-0">
          {/* Header */}
          <DialogHeader>
            <div className="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <DialogTitle>{client.name}</DialogTitle>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Client since {formatDate(client.billing_start_date)}
                  </p>
                </div>
                <Badge variant={getStatusBadgeVariant(client.status)} className="shrink-0">
                  {client.status || 'Active'}
                </Badge>
              </div>
            </div>
          </DialogHeader>

          {/* Tabs */}
          <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-800">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:inline-flex bg-gray-100 dark:bg-gray-900">
                <TabsTrigger value="overview" className="text-xs sm:text-sm">
                  <IconMapper name="LayoutDashboard" className="w-4 h-4 mr-1.5 hidden sm:inline" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="sites" className="text-xs sm:text-sm">
                  <IconMapper name="MapPin" className="w-4 h-4 mr-1.5 hidden sm:inline" />
                  Sites ({client.sites?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="services" className="text-xs sm:text-sm">
                  <IconMapper name="Briefcase" className="w-4 h-4 mr-1.5 hidden sm:inline" />
                  Services
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Content */}
          <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card className="bg-gradient-to-br from-coin-50 to-white dark:from-coin-950/20 dark:to-gray-900 border-coin-200 dark:border-coin-800">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-coin-100 dark:bg-coin-900/30">
                          <IconMapper name="MapPin" className="w-5 h-5 text-coin-600 dark:text-coin-400" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Sites</p>
                          <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">{client.sites?.length || 0}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-gray-900 border-emerald-200 dark:border-emerald-800">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                          <IconMapper name="Briefcase" className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Active Services</p>
                          <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                            {client.services_count || client.services?.length || 0}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-gray-900 border-blue-200 dark:border-blue-800">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                          <IconMapper name="Banknote" className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Monthly Value</p>
                          <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                            {formatCurrencyMWK(client.monthly_rate || 0)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Contact Info */}
                <Card className="border-gray-200 dark:border-gray-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <IconMapper name="User" className="w-4 h-4 text-gray-500" />
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                {/* Quick Sites Preview */}
                {client.sites && client.sites.length > 0 && (
                  <Card className="border-gray-200 dark:border-gray-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <IconMapper name="MapPin" className="w-4 h-4 text-gray-500" />
                          Recent Sites
                        </span>
                        <Button variant="ghost" size="sm" onClick={() => setActiveTab('sites')} className="text-coin-600 hover:text-coin-700">
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
                                {site.guard_count || 0}/{site.required_guards || 0} guards
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
                  <Button onClick={() => setAddSiteOpen(true)} size="sm">
                    <IconMapper name="Plus" className="w-4 h-4 mr-1.5" />
                    Add Site
                  </Button>
                </div>

                {client.sites && client.sites.length > 0 ? (
                  <div className="space-y-3">
                    {client.sites.map(site => (
                      <Card key={site.id} className="border-gray-200 dark:border-gray-800 overflow-hidden">
                        <CardContent className="p-0">
                          <div className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-medium text-gray-900 dark:text-gray-100">{site.name}</h4>
                                  <Badge variant={site.status === 'active' ? 'success' : 'default'} className="text-xs">
                                    {site.status}
                                  </Badge>
                                  {site.site_type && (
                                    <Badge variant="secondary" className="text-xs">
                                      {getSiteTypeLabel(site.site_type)}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{site.address}</p>
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
                                >
                                  <IconMapper name="Pencil" className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => { setDeletingSiteId(site.id); setConfirmDeleteOpen(true); }}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                                >
                                  <IconMapper name="Trash2" className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-4">
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
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                    <IconMapper name="MapPin" className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">No sites yet</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Add a site to get started</p>
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
                    disabled={savingServices}
                  >
                    {savingServices ? (
                      <>
                        <IconMapper name="Loader2" className="w-4 h-4 mr-1.5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <IconMapper name="Save" className="w-4 h-4 mr-1.5" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>

                {services.length > 0 ? (
                  <div className="space-y-3">
                    {services.map(svc => {
                      const selection = serviceSelections[svc.id] || { selected: false, custom_price: null, quantity: 1 };
                      return (
                        <Card 
                          key={svc.id} 
                          className={`border-gray-200 dark:border-gray-800 transition-all ${selection.selected ? 'ring-1 ring-coin-500 dark:ring-coin-400' : ''}`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-4">
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
                                  <h4 className={`font-medium ${selection.selected ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-500'}`}>
                                    {svc.name}
                                  </h4>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Base: {formatCurrencyMWK(svc.monthly_price)}
                                  </p>
                                </div>
                                {selection.selected && (
                                  <div className="flex items-center gap-3 mt-3">
                                    <div className="flex-1">
                                      <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Custom Price (optional)</label>
                                      <input
                                        type="number"
                                        value={selection.custom_price ?? ''}
                                        onChange={(e) => handleServiceSelectionChange(svc.id, 'custom_price', e.target.value ? Number(e.target.value) : null)}
                                        placeholder={svc.monthly_price.toString()}
                                        className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-coin-500"
                                      />
                                    </div>
                                    <div className="w-24">
                                      <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Qty</label>
                                      <input
                                        type="number"
                                        min={1}
                                        value={selection.quantity}
                                        onChange={(e) => handleServiceSelectionChange(svc.id, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                                        className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-coin-500"
                                      />
                                    </div>
                                    <div className="text-right">
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
                  <div className="text-center py-12 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                    <IconMapper name="Briefcase" className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">No services available</h3>
                  </div>
                )}

                {/* Current Services Summary */}
                {client.services && client.services.length > 0 && (
                  <Card className="border-gray-200 dark:border-gray-800 mt-6">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Current Active Services
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {client.services.map(service => (
                          <div key={service.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{service.name}</span>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-gray-500 dark:text-gray-400">Qty: {service.quantity || 1}</span>
                              <span className="text-gray-900 dark:text-gray-100 font-medium">
                                {formatCurrencyMWK((service.custom_price ?? service.monthly_price) * (service.quantity || 1))}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Total Monthly Value</span>
                        <span className="text-lg font-semibold text-coin-600 dark:text-coin-400">
                          {formatCurrencyMWK(client.monthly_rate || 0)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
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

      {/* Delete Confirmation */}
      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent className="w-full max-w-sm rounded-xl bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle>Delete Site</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            This site will be moved to deleted items. You can restore it later.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => !deleting && setConfirmDeleteOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={confirmDelete} 
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}