import React, { useState } from 'react';
import { Head, usePage, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Card, CardContent, CardHeader } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import IconMapper from '@/Components/IconMapper';

interface Client {
  id: number;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  status: 'active' | 'inactive';
  supervisor_id: number | null;
  supervisor?: { id: number; name: string } | null;
  sergeant_id: number | null;
  sergeant?: { id: number; name: string } | null;
  sites_count: number;
  monthly_rate: number;
}

interface PageProps extends Record<string, any> {
  auth: { user: any };
  clients: {
    data: Client[];
    links: any[];
    meta: { current_page: number; last_page: number; total: number };
  };
  filters: { search?: string; per_page?: number };
  supervisors: { id: number; name: string }[];
  sergeants: { id: number; name: string; position: string }[];
}

export default function ClientsPage() {
  const { auth, clients, filters, supervisors = [], sergeants = [] } = usePage<PageProps>().props;
  const [search, setSearch] = useState(filters.search || '');
  void supervisors;
  void sergeants;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.get(route('admin.clients.index'), { search }, { preserveState: true });
  };

  return (
    <AdminLayout title="Clients" user={auth?.user}>
      <Head title="Clients" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Clients</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage clients and assign supervisors/sergeants
            </p>
          </div>
          <Button
            onClick={() => router.get(route('admin.clients.index'), { show_add: 1 })}
            className="gap-2"
          >
            <IconMapper name="Plus" size={16} />
            Add Client
          </Button>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clients..."
              className="flex-1 border border-gray-300 dark:border-gray-700 rounded-md px-4 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            />
            <Button type="submit" variant="outline">
              <IconMapper name="Search" size={16} />
            </Button>
          </div>
        </form>

        {/* Clients List */}
        <div className="space-y-4">
          {(clients?.data || []).map((client) => (
            <Card key={client.id} className="dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Client Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{client.name}</h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          client.status === 'active'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                        }`}
                      >
                        {client.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {client.sites_count} sites • {client.contact_person || 'No contact'} • {client.phone || 'No phone'}
                    </div>
                  </div>

                  {/* Assignments */}
                  <div className="flex flex-wrap items-center gap-4">
                    {/* Supervisor */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Supervisor:</span>
                      {client.supervisor ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{client.supervisor.name}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 dark:text-gray-500">-</span>
                      )}
                    </div>

                    {/* Sergeant */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Sergeant:</span>
                      {client.sergeant ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{client.sergeant.name}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 dark:text-gray-500">-</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.get(route('admin.clients.edit', client.id))}
                      >
                        <IconMapper name="Pencil" size={14} className="mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {(clients?.data || []).length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No clients found.
            </div>
          )}
        </div>

        {/* Pagination */}
        {(clients?.meta?.last_page || 0) > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Page {clients.meta.current_page} of {clients.meta.last_page}
            </div>
            <div className="flex gap-2">
              {(clients?.links || []).filter((l: any) => l.url !== null).map((l: any, idx: number) => (
                <button
                  key={idx}
                  className={`px-3 py-1 rounded border dark:border-gray-700 ${l.active ? 'bg-coin-600 text-white' : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200'}`}
                  onClick={() => router.get(l.url, { search }, { preserveScroll: true, preserveState: true })}
                  dangerouslySetInnerHTML={{ __html: l.label }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

    </AdminLayout>
  );
}


