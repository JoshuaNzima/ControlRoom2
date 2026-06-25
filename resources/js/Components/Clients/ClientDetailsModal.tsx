import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Badge } from '@/Components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/Components/ui/tabs';
import IconMapper from '@/Components/IconMapper';

interface ClientDetailsModalProps {
  client: any;
  open: boolean;
  onClose: () => void;
  services?: Array<{
    id: number;
    name: string;
    monthly_price: number;
    required_guards?: number;
    [key: string]: unknown;
  }>;
  zones?: Array<{ id: number; name: string }>;
  supervisors?: Array<{ id: number; name: string; email?: string }>;
  sergeants?: Array<{ id: number; name: string; position?: string }>;
  onClientUpdated?: (client: unknown) => void;
}

function statusBadge(status?: string) {
  const statusMap: Record<string, { bg: string; text: string }> = {
    active: { bg: 'bg-green-100 dark:bg-green-900/40', text: 'text-green-800 dark:text-green-300' },
    inactive: { bg: 'bg-gray-100 dark:bg-gray-900/40', text: 'text-gray-800 dark:text-gray-300' },
    suspended: { bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-800 dark:text-red-300' },
    pending: { bg: 'bg-yellow-100 dark:bg-yellow-900/40', text: 'text-yellow-800 dark:text-yellow-300' },
  };

  const config = statusMap[status || 'active'] || statusMap.active;
  return <Badge className={`${config.bg} ${config.text}`}>{status || 'Active'}</Badge>;
}

export default function ClientDetailsModal({
  client,
  open,
  onClose,
  services = [],
}: ClientDetailsModalProps) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!open || !client) return null;

  const paymentSummary = client.payment_summary ?? {};
  const isOverdue = paymentSummary.is_overdue ?? false;
  const outstandingMonths = (paymentSummary as any)?.outstanding_months ?? 0;
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconMapper name="Building2" size={24} />
            Client Details
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Client Name</p>
                  <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-gray-100">{client.name}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</p>
                  <div className="mt-2">{statusBadge(client.status)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Contact Person</p>
                  <p className="mt-2 text-base text-gray-900 dark:text-gray-100">{client.contact_person || '—'}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Monthly Rate</p>
                  <p className="mt-2 text-lg font-semibold text-blue-600 dark:text-blue-400">
                    {client.monthly_rate ? `$${(client.monthly_rate as number).toLocaleString()}` : '—'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {client.address && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Address</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{client.address}</p>
                </CardContent>
              </Card>
            )}

            {client.services && Array.isArray(client.services) && client.services.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Services ({client.services.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {client.services.map((service: any) => (
                      <div key={service.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700 dark:text-gray-300">{service.name}</span>
                        {service.pivot?.quantity && (
                          <span className="text-gray-500 dark:text-gray-400">× {service.pivot.quantity}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {client.sites && Array.isArray(client.sites) && client.sites.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Sites ({client.sites.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {client.sites.map((site: any) => (
                      <div key={site.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700 dark:text-gray-300">{site.name}</span>
                        {site.guards_count !== undefined && (
                          <span className="text-gray-500 dark:text-gray-400">{site.guards_count} guard{site.guards_count !== 1 ? 's' : ''}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total Due</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
                    ${(paymentSummary.total_due ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total Paid</p>
                  <p className="mt-2 text-2xl font-bold text-green-600 dark:text-green-400">
                    ${(paymentSummary.total_paid ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Outstanding</p>
                  <p className={`mt-2 text-2xl font-bold ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    ${(paymentSummary.outstanding_amount ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Outstanding Months</p>
                  <div className="mt-2 flex items-center gap-2">
                    <p className={`text-2xl font-bold ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                      {outstandingMonths}
                    </p>
                    {isOverdue && (
                      <Badge className="bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300">
                        Overdue
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {paymentSummary.billing_start && (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Billing Start Date</p>
                  <p className="mt-1 text-base text-gray-900 dark:text-gray-100">
                    {new Date(paymentSummary.billing_start).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Contacts Tab */}
          <TabsContent value="contacts" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {client.email && (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Email</p>
                    <p className="mt-2 text-sm text-blue-600 dark:text-blue-400 break-all">{client.email}</p>
                  </CardContent>
                </Card>
              )}

              {client.phone && (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Phone</p>
                    <p className="mt-2 text-sm text-gray-900 dark:text-gray-100">{client.phone}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {client.users && Array.isArray(client.users) && client.users.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Client Users ({client.users.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {client.users.map((user: any) => (
                      <div key={user.id} className="border-b border-gray-200 dark:border-gray-800 pb-3 last:border-b-0">
                        <p className="font-medium text-gray-900 dark:text-gray-100">{user.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                        {user.phone && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">{user.phone}</p>
                        )}
                        {user.pivot?.role && (
                          <Badge className="mt-2 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300">
                            {user.pivot.role}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
