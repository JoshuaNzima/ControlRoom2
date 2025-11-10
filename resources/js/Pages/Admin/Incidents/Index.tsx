import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/Components/ui/button';
import AdminIncidentModal from '@/Components/Admin/AdminIncidentModal';

export default function Index({ incidents, filters }: any) {
  const [showIncidentModal, setShowIncidentModal] = React.useState(false);
  const [selectedIncidentId, setSelectedIncidentId] = React.useState<number | null>(null);

  const refresh = () => router.reload();

  return (
    <AdminLayout title="Incidents">
      <Head title="Incidents" />
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Incidents</h1>
        </div>

        <div className="bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client / Site</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reporter</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {incidents.data?.map((inc: any) => (
                <tr key={inc.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button onClick={() => { setSelectedIncidentId(inc.id); setShowIncidentModal(true); }} className="text-red-700 font-medium text-left">
                      {inc.title}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{inc.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{inc.severity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{inc.client?.name || '—'} / {inc.client_site?.name || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${inc.status === 'open' ? 'bg-red-100 text-red-800' : inc.status === 'escalated' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                      {inc.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{inc.reporter?.name || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDistanceToNow(new Date(inc.created_at), { addSuffix: true })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {incidents.links && incidents.links.length > 0 && (
          <div className="mt-4 flex justify-center">
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              {incidents.links.map((link: any, i: number) => (
                <Button
                  key={i}
                  variant={link.active ? "default" : "outline"}
                  disabled={!link.url}
                  onClick={() => link.url && router.get(link.url)}
                  className="relative inline-flex items-center px-4 py-2 text-sm font-medium"
                >
                  <span dangerouslySetInnerHTML={{ __html: link.label }}></span>
                </Button>
              ))}
            </nav>
          </div>
        )}
        {selectedIncidentId && (
          <AdminIncidentModal
            incidentId={selectedIncidentId}
            open={showIncidentModal}
            onClose={() => setShowIncidentModal(false)}
            refreshList={refresh}
          />
        )}
      </div>
    </AdminLayout>
  );
}
