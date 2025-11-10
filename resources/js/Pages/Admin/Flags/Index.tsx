import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/Components/ui/button';
import AdminFlagModal from '@/Components/Admin/AdminFlagModal';

export default function Index({ flags, filters }: any) {
  const [showFlagModal, setShowFlagModal] = React.useState(false);
  const [selectedFlagId, setSelectedFlagId] = React.useState<number | null>(null);

  const refresh = () => router.reload();

  return (
    <AdminLayout title="Flags">
      <Head title="Flags" />
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Flags</h1>
        </div>

        <div className="bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Flaggable</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reporter</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {flags.data?.map((f: any) => (
                <tr key={f.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button onClick={() => { setSelectedFlagId(f.id); setShowFlagModal(true); }} className="text-red-700 font-medium text-left">
                      {f.subject}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{f.flaggable?.name || f.flaggable_type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${f.status === 'active' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                      {f.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{f.reporter?.name || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDistanceToNow(new Date(f.created_at), { addSuffix: true })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {flags.links && flags.links.length > 0 && (
          <div className="mt-4 flex justify-center">
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              {flags.links.map((link: any, i: number) => (
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
        {selectedFlagId && (
          <AdminFlagModal
            flagId={selectedFlagId}
            open={showFlagModal}
            onClose={() => setShowFlagModal(false)}
            refreshList={refresh}
          />
        )}
      </div>
    </AdminLayout>
  );
}
