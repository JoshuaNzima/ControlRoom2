import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { Dialog } from '@/Components/ui/dialog';
import { Button } from '@/Components/ui/button';
import { useNotification } from '@/Providers/NotificationProvider';

export default function BulkImportClients() {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const { push } = useNotification();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      push('Please select a file', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    router.post(route('admin.clients.bulk-import'), formData, {
      onSuccess: () => {
        setIsOpen(false);
        setFile(null);
      }
    });
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className="ml-3">
        Bulk Import
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <div className="p-6">
          <h2 className="text-lg font-medium mb-4">Import Clients</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Excel File
              </label>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={e => setFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
              <p className="mt-1 text-sm text-gray-500">
                Upload Excel file with client data. Download the{' '}
                <a href="/templates/client-import-template.xlsx" className="text-indigo-600 hover:text-indigo-500">
                  template file
                </a>{' '}
                for correct format.
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button onClick={() => setIsOpen(false)} variant="outline" type="button">
                Cancel
              </Button>
              <Button type="submit">
                Import Clients
              </Button>
            </div>
          </form>
        </div>
      </Dialog>
    </>
  );
}