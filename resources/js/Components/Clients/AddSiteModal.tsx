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
  onAdded?: () => void;
  zones?: Zone[];
};

export default function AddSiteModal({ open, onClose, clientId, onAdded, zones = [] }: Props) {
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
  const [showMap, setShowMap] = React.useState(true);

  React.useEffect(() => {
    if (!open) {
      setForm({ name: '', address: '', contact_person: '', phone: '', required_guards: 1, status: 'active', services_requested: '', special_instructions: '', latitude: '', longitude: '', zone_id: '' });
      setErrors({});
    }
  }, [open]);

  const handleAdd = async () => {
    setSaving(true);
    setErrors({});
    try {
      const url = route('admin.clients.sites.store', { client: clientId });
      const payload = {
        ...form,
        required_guards: Number(form.required_guards) || 1,
        latitude: form.latitude === '' ? null : Number(form.latitude),
        longitude: form.longitude === '' ? null : Number(form.longitude),
        zone_id: form.zone_id === '' ? null : Number(form.zone_id),
      };
      await axios.post(url, payload, { headers: { 'Accept': 'application/json' } });
      onAdded?.();
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
          <DialogTitle>Add Site</DialogTitle>
        </DialogHeader>
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
            <div className="mt-2 space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>Use the map or enter coordinates manually.</span>
                <button
                  type="button"
                  onClick={() => setShowMap((v: boolean) => !v)}
                  className="px-2 py-1 border rounded-md dark:border-gray-600 dark:text-gray-200"
                >
                  {showMap ? 'Hide map' : 'Show map'}
                </button>
              </div>
              {showMap && (
              <LocationPicker
                value={form.latitude && form.longitude ? { lat: Number(form.latitude), lng: Number(form.longitude) } : null}
                onChange={(c) => setForm({ ...form, latitude: c.lat.toFixed(6), longitude: c.lng.toFixed(6) })}
                heightClassName="h-56"
              />
              )}
              <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                Lat range: -90 to 90 • Lng range: -180 to 180
              </div>
              {(errors.latitude || errors.longitude) && (
                <div className="text-xs text-red-500 mt-1">{errors.latitude || errors.longitude}</div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Latitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    min={-90}
                    max={90}
                    value={form.latitude}
                    onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                    onPaste={(e) => {
                      const text = e.clipboardData.getData('text') || '';
                      const matches = text.match(/-?\d+(?:\.\d+)?/g) || [];
                      if (matches.length >= 2) {
                        const lat = Number(matches[0]);
                        const lng = Number(matches[1]);
                        if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
                          e.preventDefault();
                          const clampedLat = Math.max(-90, Math.min(90, lat));
                          const clampedLng = Math.max(-180, Math.min(180, lng));
                          setForm({
                            ...form,
                            latitude: clampedLat.toFixed(6),
                            longitude: clampedLng.toFixed(6),
                          });
                        }
                      }
                    }}
                    onBlur={(e) => {
                      const v = e.target.value;
                      if (v === '') return;
                      let n = Number(v);
                      if (isNaN(n)) return;
                      n = Math.max(-90, Math.min(90, n));
                      setForm({ ...form, latitude: n.toFixed(6) });
                    }}
                    className="mt-1 w-full border rounded-md px-3 py-2 dark:bg-gray-900 dark:border-gray-700"
                    placeholder="e.g. -13.962600"
                  />
                  {errors.latitude && <div className="text-xs text-red-500 mt-1">{errors.latitude}</div>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Longitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    min={-180}
                    max={180}
                    value={form.longitude}
                    onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                    onPaste={(e) => {
                      const text = e.clipboardData.getData('text') || '';
                      const matches = text.match(/-?\d+(?:\.\d+)?/g) || [];
                      if (matches.length >= 2) {
                        const lat = Number(matches[0]);
                        const lng = Number(matches[1]);
                        if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
                          e.preventDefault();
                          const clampedLat = Math.max(-90, Math.min(90, lat));
                          const clampedLng = Math.max(-180, Math.min(180, lng));
                          setForm({
                            ...form,
                            latitude: clampedLat.toFixed(6),
                            longitude: clampedLng.toFixed(6),
                          });
                        }
                      }
                    }}
                    onBlur={(e) => {
                      const v = e.target.value;
                      if (v === '') return;
                      let n = Number(v);
                      if (isNaN(n)) return;
                      n = Math.max(-180, Math.min(180, n));
                      setForm({ ...form, longitude: n.toFixed(6) });
                    }}
                    className="mt-1 w-full border rounded-md px-3 py-2 dark:bg-gray-900 dark:border-gray-700"
                    placeholder="e.g. 33.774100"
                  />
                  {errors.longitude && <div className="text-xs text-red-500 mt-1">{errors.longitude}</div>}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 justify-end mt-4">
          <Button variant="outline" onClick={onClose} className="dark:border-gray-600 dark:text-gray-200">Cancel</Button>
          <Button onClick={handleAdd} disabled={saving}>{saving ? 'Adding...' : 'Add Site'}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
