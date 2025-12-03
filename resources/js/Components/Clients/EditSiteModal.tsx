import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Button } from '@/Components/ui/button';
import LocationPicker from '@/Components/Map/LocationPicker';
import axios from 'axios';

type Zone = { id: number; name: string };

type Props = {
  open: boolean;
  onClose: () => void;
  clientId: number;
  siteId: number | null;
  onSaved?: () => void;
  zones?: Zone[];
};

export default function EditSiteModal({ open, onClose, clientId, siteId, onSaved, zones = [] }: Props) {
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [form, setForm] = React.useState<any>({
    name: '',
    address: '',
    contact_person: '',
    phone: '',
    required_guards: 1,
    status: 'active',
    services_requested: '',
    special_instructions: '',
    latitude: '',
    longitude: '',
    zone_id: '',
  });

  React.useEffect(() => {
    async function load() {
      if (!open || !siteId) return;
      setLoading(true);
      setErrors({});
      try {
        const url = route('admin.clients.sites.show-json', { client: clientId, site: siteId });
        const res = await axios.get(url, { headers: { 'Accept': 'application/json' } });
        const s = res.data || {};
        setForm({
          name: s.name || '',
          address: s.address || '',
          contact_person: s.contact_person || '',
          phone: s.phone || '',
          required_guards: s.required_guards ?? 1,
          status: s.status || 'active',
          services_requested: s.services_requested || '',
          special_instructions: s.special_instructions || '',
          latitude: s.latitude != null ? String(s.latitude) : '',
          longitude: s.longitude != null ? String(s.longitude) : '',
          zone_id: s.zone_id != null ? String(s.zone_id) : '',
        });
      } catch (_) {
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [open, siteId]);

  const handleSave = async () => {
    if (!siteId) return;
    setSaving(true);
    setErrors({});
    try {
      const url = route('admin.clients.sites.update', { client: clientId, site: siteId });
      const payload = {
        ...form,
        required_guards: Number(form.required_guards) || 1,
        latitude: form.latitude === '' ? null : Number(form.latitude),
        longitude: form.longitude === '' ? null : Number(form.longitude),
        zone_id: form.zone_id === '' ? null : Number(form.zone_id),
      };
      await axios.put(url, payload, { headers: { 'Accept': 'application/json' } });
      onSaved?.();
      onClose();
    } catch (e: any) {
      if (e?.response?.data?.errors) {
        const errs: Record<string, string> = {};
        Object.entries(e.response.data.errors).forEach(([k, v]: any) => (errs[k] = Array.isArray(v) ? v[0] : String(v)));
        setErrors(errs);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-2xl dark:bg-gray-800 dark:text-gray-100">
        <DialogHeader>
          <DialogTitle>Edit Site</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {loading ? (
            <div className="text-sm text-gray-500 dark:text-gray-400">Loading...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full border rounded-md px-3 py-2 dark:bg-gray-900 dark:border-gray-700" />
                {errors.name && <div className="text-xs text-red-500 mt-1">{errors.name}</div>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="mt-1 w-full border rounded-md px-3 py-2 dark:bg-gray-900 dark:border-gray-700">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                {errors.status && <div className="text-xs text-red-500 mt-1">{errors.status}</div>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Zone</label>
                <select value={form.zone_id} onChange={(e) => setForm({ ...form, zone_id: e.target.value })} className="mt-1 w-full border rounded-md px-3 py-2 dark:bg-gray-900 dark:border-gray-700">
                  <option value="">Unassigned</option>
                  {zones.map(z => (<option key={z.id} value={z.id}>{z.name}</option>))}
                </select>
                {errors.zone_id && <div className="text-xs text-red-500 mt-1">{errors.zone_id}</div>}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
                <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="mt-1 w-full border rounded-md px-3 py-2 dark:bg-gray-900 dark:border-gray-700" />
                {errors.address && <div className="text-xs text-red-500 mt-1">{errors.address}</div>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contact</label>
                <input value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} className="mt-1 w-full border rounded-md px-3 py-2 dark:bg-gray-900 dark:border-gray-700" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1 w-full border rounded-md px-3 py-2 dark:bg-gray-900 dark:border-gray-700" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Required Guards</label>
                <input type="number" min={1} value={form.required_guards} onChange={(e) => setForm({ ...form, required_guards: e.target.value })} className="mt-1 w-full border rounded-md px-3 py-2 dark:bg-gray-900 dark:border-gray-700" />
                {errors.required_guards && <div className="text-xs text-red-500 mt-1">{errors.required_guards}</div>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Services Requested</label>
                <input value={form.services_requested} onChange={(e) => setForm({ ...form, services_requested: e.target.value })} className="mt-1 w-full border rounded-md px-3 py-2 dark:bg-gray-900 dark:border-gray-700" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Special Instructions</label>
                <textarea value={form.special_instructions} onChange={(e) => setForm({ ...form, special_instructions: e.target.value })} className="mt-1 w-full border rounded-md px-3 py-2 dark:bg-gray-900 dark:border-gray-700" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Location</label>
                <div className="mt-2">
                  <LocationPicker
                    value={form.latitude && form.longitude ? { lat: Number(form.latitude), lng: Number(form.longitude) } : null}
                    onChange={(c) => setForm({ ...form, latitude: c.lat.toFixed(6), longitude: c.lng.toFixed(6) })}
                    heightClassName="h-56"
                  />
                  <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                    Lat range: -90 to 90 • Lng range: -180 to 180
                  </div>
                  {(errors.latitude || errors.longitude) && (
                    <div className="text-xs text-red-500 mt-1">{errors.latitude || errors.longitude}</div>
                  )}
                </div>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 justify-end">
            <Button variant="outline" onClick={onClose} className="dark:border-gray-600 dark:text-gray-200">Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
