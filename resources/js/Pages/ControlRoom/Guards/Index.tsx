import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import ControlRoomLayout from '@/Layouts/ControlRoomLayout';
import ComingSoon from '@/Components/Shared/ComingSoon';

export default function GuardsIndex() {
  const [openModal, setOpenModal] = useState<null | 'guards' | 'assignments' | 'clients'>(null);

  return (
    <ControlRoomLayout title="Guards">
      <Head title="Guards" />

      <div className="max-w-7xl mx-auto mt-6 px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-bold">Guards</h3>
            <p className="text-sm text-gray-600 mt-2">Control Room scoped guard list and quick actions.</p>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setOpenModal('guards')} className="px-4 py-2 bg-coin-600 text-white rounded">Manage Guards</button>
              <Link href="#" className="px-4 py-2 bg-gray-100 rounded text-gray-700">Export</Link>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-bold">Assignments</h3>
            <p className="text-sm text-gray-600 mt-2">Quick view of guard assignments for the Control Room.</p>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setOpenModal('assignments')} className="px-4 py-2 bg-coin-600 text-white rounded">Manage Assignments</button>
              <Link href="#" className="px-4 py-2 bg-gray-100 rounded text-gray-700">Sync</Link>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-bold">Clients</h3>
            <p className="text-sm text-gray-600 mt-2">Client locations and contacts relevant to this control-room instance.</p>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setOpenModal('clients')} className="px-4 py-2 bg-coin-600 text-white rounded">Manage Clients</button>
              <Link href="#" className="px-4 py-2 bg-gray-100 rounded text-gray-700">Locations</Link>
            </div>
          </div>
        </div>

        <div>
          <ComingSoon
            title="Guards Management"
            description="A tailored Control Room guards management experience is under construction. Use the quick actions above for immediate tasks."
          />
        </div>

        {/* Simple modals for local Control Room actions */}
        {openModal === 'guards' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Control Room — Guards</h3>
                <button onClick={() => setOpenModal(null)} className="text-gray-500">Close</button>
              </div>
              <p className="text-sm text-gray-600">This is a lightweight Control Room guards manager: quick search, filters, and actions will appear here.</p>
            </div>
          </div>
        )}

        {openModal === 'assignments' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Control Room — Assignments</h3>
                <button onClick={() => setOpenModal(null)} className="text-gray-500">Close</button>
              </div>
              <p className="text-sm text-gray-600">Assign guards to sites from the Control Room. This panel is a small quick-action surface.</p>
            </div>
          </div>
        )}

        {openModal === 'clients' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Control Room — Clients</h3>
                <button onClick={() => setOpenModal(null)} className="text-gray-500">Close</button>
              </div>
              <p className="text-sm text-gray-600">View and quickly manage client contacts and locations relevant to the Control Room.</p>
            </div>
          </div>
        )}
      </div>
    </ControlRoomLayout>
  );
}
