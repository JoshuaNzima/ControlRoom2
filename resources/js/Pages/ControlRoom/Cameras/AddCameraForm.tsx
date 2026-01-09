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

interface AddCameraFormProps {
  onClose: () => void;
  sites: any[];
}

declare const route: any;

const buildStreamUrl = (protocol: string, host: string, port?: string, path?: string) => {
  const p = (protocol || 'http').trim();
  const h = (host || '').trim();
  if (!h) return '';
  const portPart = port && String(port).trim() !== '' ? `:${String(port).trim()}` : '';
  const rawPath = (path || '').trim();
  const pathPart = rawPath ? (rawPath.startsWith('/') ? rawPath : `/${rawPath}`) : '';
  return `${p}://${h}${portPart}${pathPart}`;
};

export default function AddCameraForm({ onClose, sites }: AddCameraFormProps) {
  const { data, setData, post, processing, errors } = useForm({
    name: '',
    location: '',
    client_site_id: '',
    type: 'fixed',
    status: 'offline',
    stream_url: '',
    ip_address: '',
    port: '',
    public_protocol: 'https',
    public_host: '',
    public_port: '',
    public_path: '',
    username: '',
    password: '',
  } as any);

  const generatedStreamUrl = buildStreamUrl(
    String((data as any).public_protocol ?? ''),
    String((data as any).public_host ?? ''),
    String((data as any).public_port ?? ''),
    String((data as any).public_path ?? '')
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('control-room.cameras.store'), {
      onSuccess: () => {
        onClose();
      }
    });
  };

  return (
    <DialogContent className="sm:max-w-[525px]">
      <DialogHeader>
        <DialogTitle>Add New Camera</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4 p-4">
        <div>
          <Label htmlFor="name">Camera Name</Label>
          <Input
            id="name"
            value={data.name}
            onChange={(e: any) => (setData as any)('name', e.target.value)}
            required
          />
          {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
        </div>

        <div>
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={data.location}
            onChange={(e: any) => (setData as any)('location', e.target.value)}
            required
          />
          {errors.location && <p className="text-sm text-red-600">{errors.location}</p>}
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
                  {site.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.client_site_id && <p className="text-sm text-red-600">{errors.client_site_id}</p>}
        </div>

        <div>
          <Label htmlFor="type">Camera Type</Label>
          <Select value={String(data.type ?? '')} onValueChange={(value) => (setData as any)('type', value)}>
            <SelectTrigger id="type">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fixed">Fixed</SelectItem>
              <SelectItem value="dome">Dome</SelectItem>
              <SelectItem value="ptz">PTZ</SelectItem>
              <SelectItem value="thermal">Thermal</SelectItem>
            </SelectContent>
          </Select>
          {errors.type && <p className="text-sm text-red-600">{errors.type}</p>}
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={String(data.status ?? '')} onValueChange={(value) => (setData as any)('status', value)}>
            <SelectTrigger id="status">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="disabled">Disabled</SelectItem>
            </SelectContent>
          </Select>
          {errors.status && <p className="text-sm text-red-600">{errors.status}</p>}
        </div>

        <div>
          <Label htmlFor="stream_url">Stream URL</Label>
          <Input
            id="stream_url"
            value={data.stream_url}
            onChange={(e: any) => (setData as any)('stream_url', e.target.value)}
            placeholder="https://..."
          />
          {errors.stream_url && <p className="text-sm text-red-600">{errors.stream_url}</p>}
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3">
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">DDNS / Port Forward (optional)</div>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="public_protocol">Protocol</Label>
              <Select value={String((data as any).public_protocol ?? '')} onValueChange={(value) => (setData as any)('public_protocol', value)}>
                <SelectTrigger id="public_protocol">
                  <SelectValue placeholder="Select protocol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="https">https</SelectItem>
                  <SelectItem value="http">http</SelectItem>
                  <SelectItem value="rtsp">rtsp</SelectItem>
                  <SelectItem value="rtsps">rtsps</SelectItem>
                </SelectContent>
              </Select>
              {errors.public_protocol && <p className="text-sm text-red-600">{errors.public_protocol}</p>}
            </div>

            <div>
              <Label htmlFor="public_host">Public Host (DDNS)</Label>
              <Input
                id="public_host"
                value={(data as any).public_host}
                onChange={(e: any) => (setData as any)('public_host', e.target.value)}
                placeholder="camera.exampleddns.net"
              />
              {errors.public_host && <p className="text-sm text-red-600">{errors.public_host}</p>}
            </div>

            <div>
              <Label htmlFor="public_port">Public Port</Label>
              <Input
                id="public_port"
                value={(data as any).public_port}
                onChange={(e: any) => (setData as any)('public_port', e.target.value)}
                placeholder="443"
              />
              {errors.public_port && <p className="text-sm text-red-600">{errors.public_port}</p>}
            </div>

            <div>
              <Label htmlFor="public_path">Stream Path</Label>
              <Input
                id="public_path"
                value={(data as any).public_path}
                onChange={(e: any) => (setData as any)('public_path', e.target.value)}
                placeholder="/live/stream.m3u8"
              />
              {errors.public_path && <p className="text-sm text-red-600">{errors.public_path}</p>}
            </div>
          </div>

          <div className="mt-3">
            <div className="text-xs text-gray-500 dark:text-gray-400">Generated URL</div>
            <div className="mt-1 text-xs font-mono text-gray-700 dark:text-gray-200 break-all">
              {generatedStreamUrl || '-'}
            </div>
            <div className="mt-2">
              <Button
                type="button"
                variant="outline"
                disabled={!generatedStreamUrl}
                onClick={() => (setData as any)('stream_url', generatedStreamUrl)}
              >
                Use Generated URL
              </Button>
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="ip_address">IP Address</Label>
          <Input
            id="ip_address"
            value={data.ip_address}
            onChange={(e: any) => (setData as any)('ip_address', e.target.value)}
          />
          {errors.ip_address && <p className="text-sm text-red-600">{errors.ip_address}</p>}
        </div>

        <div>
          <Label htmlFor="port">Port</Label>
          <Input
            id="port"
            value={data.port}
            onChange={(e: any) => (setData as any)('port', e.target.value)}
          />
          {errors.port && <p className="text-sm text-red-600">{errors.port}</p>}
        </div>

        <div>
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={data.username}
            onChange={(e: any) => (setData as any)('username', e.target.value)}
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
          />
          {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={processing}>
            {processing ? 'Adding...' : 'Add Camera'}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}
