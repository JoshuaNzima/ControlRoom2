import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import Select from '@/Components/Select';

interface AddCameraFormProps {
  onClose: () => void;
  sites: any[];
}

export default function AddCameraForm({ onClose, sites }: AddCameraFormProps) {
  const { data, setData, post, processing, errors } = useForm({
    name: '',
    location: '',
    site_id: '',
    ip_address: '',
    port: '',
    username: '',
    password: '',
    status: 'active',
  } as any);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('cameras.store'), {
      onSuccess: () => {
        onClose();
      }
    });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Add New Camera</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
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
          <Label htmlFor="site_id">Site</Label>
          <Select
            value={data.site_id}
            onChange={(e: any) => (setData as any)('site_id', e.target.value)}
            required
          >
            <option value="">Select a site</option>
            {sites.map((site: any) => (
              <option key={site.id} value={site.id}>
                {site.name}
              </option>
            ))}
          </Select>
          {errors.site_id && <p className="text-sm text-red-600">{errors.site_id}</p>}
        </div>

        <div>
          <Label htmlFor="ip_address">IP Address</Label>
          <Input
            id="ip_address"
            value={data.ip_address}
            onChange={(e: any) => (setData as any)('ip_address', e.target.value)}
            required
          />
          {errors.ip_address && <p className="text-sm text-red-600">{errors.ip_address}</p>}
        </div>

        <div>
          <Label htmlFor="port">Port</Label>
          <Input
            id="port"
            value={data.port}
            onChange={(e: any) => (setData as any)('port', e.target.value)}
            required
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
    </div>
  );
}
