import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import ControlRoomLayout from '@/Layouts/ControlRoomLayout';

export default function AssignmentsIndex() {
  const [open, setOpen] = useState(false);

  return (
    <ControlRoomLayout title="Assignments">
      <Head title="Assignments" />

      <div className="max-w-7xl mx-auto mt-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-bold">Guard Assignments</h2>
          <p className="text-sm text-gray-600 mt-2">Assign guards to sites directly from the Control Room for quick edits.</p>
          <div className="mt-4">
            <button onClick={() => setOpen(true)} className="px-4 py-2 bg-coin-600 text-white rounded">Open Quick Assign</button>
          </div>
        </div>

        {open && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-lg w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Quick Assign</h3>
                <button onClick={() => setOpen(false)} className="text-gray-500">Close</button>
              </div>
              <p className="text-sm text-gray-600">This quick assignment UI allows the Control Room to perform basic assign/unassign actions without leaving the Control Room context.</p>
            </div>
          </div>
        )}
      </div>
    </ControlRoomLayout>
  );
}
