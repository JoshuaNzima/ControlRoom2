import React from 'react';
import { useForm } from '@inertiajs/react';
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

interface AddNvrModalProps {
  onClose: () => void;
  sites: any[];
}

declare const route: any;

export default function AddNvrModal({ onClose, sites }: AddNvrModalProps) {
  const { data, setData, post, processing, errors } = useForm({
    name: '',
    device_type: 'nvr',
    client_site_id: '',
    brand: '',
    model: '',
    public_protocol: 'https',
    public_host: '',
    public_port: '',
    public_path: '',
    local_ip: '',
    local_port: '',
    username: '',
    password: '',
    api_key: '',
    channel_count: '16',
    notes: '',
  } as any);

  const getSiteLabel = (site: any) => {
    const clientName = String(site?.client?.name ?? '').trim();
    const siteName = String(site?.name ?? '').trim();
    if (clientName && siteName) return `${clientName} • ${siteName}`;
    return siteName || clientName || '-';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('control-room.cameras.nvrs.store'), {
      onSuccess: () => {
        onClose();
      }
    });
  };

  return (
    <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Add NVR/DVR Device</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Label htmlFor="name">Device Name *</Label>
            <Input
              id="name"
              value={data.name}
              onChange={(e: any) => (setData as any)('name', e.target.value)}
              placeholder="Main Office NVR"
              required
            />
            {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
          </div>

          <div>
            <Label htmlFor="device_type">Device Type</Label>
            <Select value={String(data.device_type)} onValueChange={(value) => (setData as any)('device_type', value)}>
              <SelectTrigger id="device_type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nvr">NVR (Network Video Recorder)</SelectItem>
                <SelectItem value="dvr">DVR (Digital Video Recorder)</SelectItem>
              </SelectContent>
            </Select>
            {errors.device_type && <p className="text-sm text-red-600">{errors.device_type}</p>}
          </div>

          <div>
            <Label htmlFor="client_site_id">Site</Label>
            <Select value={String(data.client_site_id ?? '')} onValueChange={(value) => (setData as any)('client_site_id', value)}>
              <SelectTrigger id="client_site_id">
                <SelectValue placeholder="Select a site" />
              </SelectTrigger>
              <SelectContent>
                {(sites || []).map((site: any) => (
                  <SelectItem key={site.id} value={String(site.id)}>
                    {getSiteLabel(site)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.client_site_id && <p className="text-sm text-red-600">{errors.client_site_id}</p>}
          </div>

          <div>
            <Label htmlFor="brand">Brand</Label>
            <Select value={String(data.brand ?? '')} onValueChange={(value) => (setData as any)('brand', value)}>
              <SelectTrigger id="brand">
                <SelectValue placeholder="Select brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hikvision">Hikvision</SelectItem>
                <SelectItem value="dahua">Dahua</SelectItem>
                <SelectItem value="cpplus">CP Plus</SelectItem>
                <SelectItem value="uniview">Uniview</SelectItem>
                <SelectItem value="axis">Axis</SelectItem>
                <SelectItem value="bosch">Bosch</SelectItem>
                <SelectItem value="hanwha">Hanwha (Wisenet)</SelectItem>
                <SelectItem value="other">Other/Generic</SelectItem>
              </SelectContent>
            </Select>
            {errors.brand && <p className="text-sm text-red-600">{errors.brand}</p>}
          </div>

          <div>
            <Label htmlFor="model">Model</Label>
            <Input
              id="model"
              value={data.model}
              onChange={(e: any) => (setData as any)('model', e.target.value)}
              placeholder="DS-7608NI-K2"
            />
            {errors.model && <p className="text-sm text-red-600">{errors.model}</p>}
          </div>

          <div>
            <Label htmlFor="channel_count">Channel Count</Label>
            <Input
              id="channel_count"
              type="number"
              min="1"
              max="256"
              value={data.channel_count}
              onChange={(e: any) => (setData as any)('channel_count', e.target.value)}
            />
            {errors.channel_count && <p className="text-sm text-red-600">{errors.channel_count}</p>}
          </div>
        </div>

        <hr className="my-4 border-gray-200 dark:border-gray-800" />

        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3">
          <div className="text-sm font-semibold text-red-900 dark:text-red-200">
            Port-Forwarded Connection (Required)
          </div>
          <p className="text-xs text-red-700 dark:text-red-300 mt-1">
            Enter the public IP/DDNS and port forwarded from the NVR/DVR location.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="public_protocol">Public Protocol *</Label>
            <Select value={String(data.public_protocol)} onValueChange={(value) => (setData as any)('public_protocol', value)}>
              <SelectTrigger id="public_protocol">
                <SelectValue placeholder="Select protocol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="https">HTTPS (Secure)</SelectItem>
                <SelectItem value="http">HTTP</SelectItem>
                <SelectItem value="rtsp">RTSP</SelectItem>
                <SelectItem value="rtsps">RTSP Secure</SelectItem>
              </SelectContent>
            </Select>
            {errors.public_protocol && <p className="text-sm text-red-600">{errors.public_protocol}</p>}
          </div>

          <div>
            <Label htmlFor="public_host">Public Host/DDNS *</Label>
            <Input
              id="public_host"
              value={data.public_host}
              onChange={(e: any) => (setData as any)('public_host', e.target.value)}
              placeholder="nvr.example.com or 203.0.113.1"
              required
            />
            {errors.public_host && <p className="text-sm text-red-600">{errors.public_host}</p>}
          </div>

          <div>
            <Label htmlFor="public_port">Public Port</Label>
            <Input
              id="public_port"
              type="number"
              value={data.public_port}
              onChange={(e: any) => (setData as any)('public_port', e.target.value)}
              placeholder="443, 8080, 554"
            />
            {errors.public_port && <p className="text-sm text-red-600">{errors.public_port}</p>}
          </div>

          <div>
            <Label htmlFor="public_path">API/Stream Path</Label>
            <Input
              id="public_path"
              value={data.public_path}
              onChange={(e: any) => (setData as any)('public_path', e.target.value)}
              placeholder="/api or /ISAPI"
            />
            {errors.public_path && <p className="text-sm text-red-600">{errors.public_path}</p>}
          </div>
        </div>

        <hr className="my-4 border-gray-200 dark:border-gray-800" />

        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Local Network (Optional)</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="local_ip">Local IP Address</Label>
            <Input
              id="local_ip"
              value={data.local_ip}
              onChange={(e: any) => (setData as any)('local_ip', e.target.value)}
              placeholder="192.168.1.100"
            />
            {errors.local_ip && <p className="text-sm text-red-600">{errors.local_ip}</p>}
          </div>

          <div>
            <Label htmlFor="local_port">Local Port</Label>
            <Input
              id="local_port"
              type="number"
              value={data.local_port}
              onChange={(e: any) => (setData as any)('local_port', e.target.value)}
              placeholder="80"
            />
            {errors.local_port && <p className="text-sm text-red-600">{errors.local_port}</p>}
          </div>
        </div>

        <hr className="my-4 border-gray-200 dark:border-gray-800" />

        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Authentication</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={data.username}
              onChange={(e: any) => (setData as any)('username', e.target.value)}
              placeholder="admin"
            />
            {errors.username && <p className="text-sm text-red-600">{errors.username}</p>}
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={data.password}
              onChange={(e: any) => (setData as any)('password', e.target.value)}
              placeholder="NVR password"
            />
            {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="api_key">API Key / Token (if applicable)</Label>
            <Input
              id="api_key"
              value={data.api_key}
              onChange={(e: any) => (setData as any)('api_key', e.target.value)}
              placeholder="Optional API key for advanced integrations"
            />
            {errors.api_key && <p className="text-sm text-red-600">{errors.api_key}</p>}
          </div>
        </div>

        <hr className="my-4 border-gray-200 dark:border-gray-800" />

        <div>
          <Label htmlFor="notes">Notes</Label>
          <textarea
            id="notes"
            value={data.notes}
            onChange={(e: any) => (setData as any)('notes', e.target.value)}
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            rows={3}
            placeholder="Physical location, installation notes, etc."
          />
          {errors.notes && <p className="text-sm text-red-600">{errors.notes}</p>}
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={processing}>
            {processing ? 'Adding...' : 'Add NVR/DVR'}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}
