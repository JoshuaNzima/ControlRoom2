import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/Components/ui/select';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/Components/ui/dialog';
import { Badge } from '@/Components/ui/badge';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface ImportCamerasModalProps {
  onClose: () => void;
  nvr: any;
}

declare const route: any;

export default function ImportCamerasModal({ onClose, nvr }: ImportCamerasModalProps) {
  const [channelCount, setChannelCount] = useState(nvr?.channel_count || 16);
  const [cameraType, setCameraType] = useState('fixed');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ imported: number; total: number; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Selected channels mode
  const [importMode, setImportMode] = useState<'all' | 'selected'>('all');
  const [selectedChannels, setSelectedChannels] = useState<number[]>([]);

  const handleQuickImport = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(route('control-room.cameras.nvrs.quick-import', nvr.id), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
        },
        body: JSON.stringify({
          channel_count: channelCount,
          camera_type: cameraType,
        }),
      });

      if (!response.ok) {
        throw new Error('Import failed');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError('Failed to import cameras. Please check NVR connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportSelected = async () => {
    if (selectedChannels.length === 0) {
      setError('Please select at least one channel');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    router.post(route('control-room.cameras.nvrs.import', nvr.id), {
      channels: selectedChannels,
      camera_type: cameraType,
      default_location: nvr?.site?.name || 'Unknown',
    }, {
      onSuccess: (page: any) => {
        setIsLoading(false);
        const flash = page?.props?.flash;
        if (flash?.success) {
          setResult({
            imported: selectedChannels.length,
            total: selectedChannels.length,
            message: flash.success,
          });
        }
      },
      onError: () => {
        setIsLoading(false);
        setError('Import failed. Please try again.');
      },
    });
  };

  const toggleChannel = (channel: number) => {
    setSelectedChannels(prev =>
      prev.includes(channel)
        ? prev.filter(c => c !== channel)
        : [...prev, channel]
    );
  };

  const selectAll = () => {
    setSelectedChannels(Array.from({ length: channelCount }, (_, i) => i + 1));
  };

  const selectNone = () => {
    setSelectedChannels([]);
  };

  const statusColors: Record<string, string> = {
    online: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
    offline: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
    error: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200',
    disabled: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100',
  };

  return (
    <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Import Cameras from {nvr?.name}</DialogTitle>
      </DialogHeader>

      <div className="space-y-4 p-4">
        {/* NVR Info */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40 p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{nvr?.name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {nvr?.brand} {nvr?.model} • {nvr?.device_type?.toUpperCase()}
              </div>
            </div>
            <Badge className={statusColors[nvr?.status || 'offline']}>
              {nvr?.status}
            </Badge>
          </div>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {nvr?.public_host}:{nvr?.public_port || 80}
          </div>
        </div>

        {result ? (
          <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-green-900 dark:text-green-200">
                  Import Successful
                </div>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  {result.message}
                </p>
                <div className="mt-3 flex gap-2">
                  <Button onClick={() => router.visit(route('control-room.cameras.index'))}>
                    View Cameras
                  </Button>
                  <Button variant="outline" onClick={onClose}>
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Import Mode */}
            <div>
              <Label>Import Mode</Label>
              <div className="mt-2 flex gap-2">
                <Button
                  type="button"
                  variant={importMode === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setImportMode('all')}
                >
                  All Channels
                </Button>
                <Button
                  type="button"
                  variant={importMode === 'selected' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setImportMode('selected')}
                >
                  Select Channels
                </Button>
              </div>
            </div>

            {importMode === 'all' ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="channel_count">Number of Channels</Label>
                  <Input
                    id="channel_count"
                    type="number"
                    min="1"
                    max="256"
                    value={channelCount}
                    onChange={(e) => setChannelCount(parseInt(e.target.value) || 1)}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Max channels on this NVR
                  </p>
                </div>

                <div>
                  <Label htmlFor="camera_type">Default Camera Type</Label>
                  <Select value={cameraType} onValueChange={setCameraType}>
                    <SelectTrigger id="camera_type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed</SelectItem>
                      <SelectItem value="dome">Dome</SelectItem>
                      <SelectItem value="ptz">PTZ</SelectItem>
                      <SelectItem value="thermal">Thermal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Select Channels</Label>
                  <div className="flex gap-1">
                    <Button type="button" variant="ghost" size="sm" onClick={selectAll}>
                      All
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={selectNone}>
                      None
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-8 gap-2 max-h-[200px] overflow-y-auto p-2 border rounded-lg">
                  {Array.from({ length: channelCount }, (_, i) => i + 1).map((channel) => (
                    <button
                      key={channel}
                      type="button"
                      onClick={() => toggleChannel(channel)}
                      className={`
                        p-2 text-xs font-medium rounded transition-colors
                        ${selectedChannels.includes(channel)
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }
                      `}
                    >
                      {channel}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {selectedChannels.length} channels selected
                </p>
              </div>
            )}

            {importMode === 'selected' && (
              <div>
                <Label htmlFor="camera_type_selected">Camera Type</Label>
                <Select value={cameraType} onValueChange={setCameraType}>
                  <SelectTrigger id="camera_type_selected">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed</SelectItem>
                    <SelectItem value="dome">Dome</SelectItem>
                    <SelectItem value="ptz">PTZ</SelectItem>
                    <SelectItem value="thermal">Thermal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                onClick={importMode === 'all' ? handleQuickImport : handleImportSelected}
                disabled={isLoading || (importMode === 'selected' && selectedChannels.length === 0)}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  `Import ${importMode === 'selected' ? selectedChannels.length : channelCount} Cameras`
                )}
              </Button>
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              Camera names will be generated as &quot;NVR Name - Camera 1&quot;, etc. You can edit them later.
              Existing cameras on the same channels will be skipped.
            </p>
          </>
        )}
      </div>
    </DialogContent>
  );
}
