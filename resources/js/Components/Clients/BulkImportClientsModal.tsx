import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Button } from '@/Components/ui/button';
import IconMapper from '@/Components/IconMapper';
import { Progress as ProgressBar } from '@/Components/ui/progress';
import { useToast } from '@/Components/ui/use-toast';

interface BulkImportClientsModalProps {
  open: boolean;
  onClose: () => void;
}

export default function BulkImportClientsModal({ open, onClose }: BulkImportClientsModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && (selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                        selectedFile.type === 'application/vnd.ms-excel' ||
                        selectedFile.type === 'text/csv')) {
      setFile(selectedFile);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please upload an Excel (.xlsx, .xls) or CSV file",
        variant: "destructive",
      });
    }
  };

  const handleUpload = () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);

    router.post(route('admin.clients.bulk-import'), formData, {
      onProgress: (e: any) => {
        if (e && typeof e.percentage === 'number') {
          setProgress(Math.round(e.percentage));
        }
      },
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Clients imported successfully",
        });
        setFile(null);
        setUploading(false);
        onClose();
      },
      onError: (errors) => {
        toast({
          title: "Error",
          description: Object.values(errors)[0] as string,
          variant: "destructive",
        });
        setUploading(false);
      },
    });
  };

  const downloadTemplate = () => {
    const url = route('admin.clients.bulk-import-template');
    console.log('Downloading template from:', url);
    window.location.href = url;
  };

  return (
    <Dialog open={open} onOpenChange={() => !uploading && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk Import Clients</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Button onClick={downloadTemplate} variant="outline" type="button">
              <IconMapper name="Download" size={18} className="mr-2" />
              Download Template
            </Button>
          </div>

          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <IconMapper name="Upload" size={24} className="mb-3 text-gray-400" />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">Excel or CSV file</p>
              </div>
              <input
                type="file"
                className="hidden"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                disabled={uploading}
              />
            </label>
          </div>

          {file && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <IconMapper name="File" size={18} />
                <span className="text-sm font-medium">{file.name}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFile(null)}
                disabled={uploading}
              >
                <IconMapper name="X" size={16} />
              </Button>
            </div>
          )}

          {uploading && (
            <div className="space-y-2">
              <ProgressBar value={progress} className="w-full" />
              <p className="text-sm text-center text-gray-500">
                Uploading... {progress}%
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={uploading}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="gap-2"
            >
              {uploading ? (
                <>
                  <IconMapper name="Loader2" className="animate-spin" size={18} />
                  Importing...
                </>
              ) : (
                <>
                  <IconMapper name="Upload" size={18} />
                  Import Clients
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}