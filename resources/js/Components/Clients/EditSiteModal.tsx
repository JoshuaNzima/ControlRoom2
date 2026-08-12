import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/Components/ui/button';
import LocationPicker from '@/Components/Map/LocationPicker';
import axios from 'axios';
import IconMapper from '@/Components/IconMapper';

type Zone = { id: number; name: string };

type Props = {
  open: boolean;
  onClose: () => void;
  clientId: number;
  siteId: number | null;
  onSaved?: () => void;
  zones?: Zone[];
};

const emptyForm = {
  name: '',
  address: '',
  contact_person: '',
  phone: '',
  required_guards: 1,
  status: 'active',
  site_type: 'residential',
  services_requested: '',
  special_instructions: '',
  latitude: '',
  longitude: '',
  zone_id: '',
};

export default function EditSiteModal({ open, onClose, clientId, siteId, onSaved, zones = [] }: Props) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(true);
  const [form, setForm] = useState<any>({ ...emptyForm });
  const [mounted, setMounted] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Auto-dismiss notifications
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    async function load() {
      if (!open || !siteId) return;
      setLoading(true);
      setErrors({});
      setLoadError(null);
      try {
        const url = route('admin.clients.sites.show-json', { client: clientId, site: siteId });
        const res = await axios.get(url, { headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' } });
        const s = res.data || {};
        setForm({
          name: s.name || '',
          address: s.address || '',
          contact_person: s.contact_person || '',
          phone: s.phone || '',
          required_guards: s.required_guards ?? 1,
          status: s.status || 'active',
          site_type: s.site_type || 'residential',
          services_requested: s.services_requested || '',
          special_instructions: s.special_instructions || '',
          latitude: s.latitude != null ? String(s.latitude) : '',
          longitude: s.longitude != null ? String(s.longitude) : '',
          zone_id: s.zone_id != null ? String(s.zone_id) : '',
        });
      } catch (e: any) {
        const msg = e?.response?.data?.message || 'Failed to load site.';
        setLoadError(msg);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [open, siteId]);

  const handleClose = () => {
    if (!saving) onClose();
  };

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
      await axios.put(url, payload, { headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' } });
      onSaved?.();
      setNotification({ message: 'Site updated successfully.', type: 'success' });
      onClose();
    } catch (e: any) {
      if (e?.response?.data?.errors) {
        const errs: Record<string, string> = {};
        Object.entries(e.response.data.errors).forEach(([k, v]: any) => (errs[k] = Array.isArray(v) ? v[0] : String(v)));
        setErrors(errs);
      } else {
        const msg = e?.response?.data?.message || 'Failed to update site.';
        setNotification({ message: msg, type: 'error' });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!siteId) return;
    if (!confirm('Are you sure you want to delete this site? This action cannot be undone.')) return;
    setSaving(true);
    try {
      const url = route('admin.clients.sites.destroy', { client: clientId, site: siteId });
      await axios.delete(url, { headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' } });
      onSaved?.();
      setNotification({ message: 'Site deleted successfully.', type: 'success' });
      onClose();
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Failed to delete site.';
      setNotification({ message: msg, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [field]: value }));
  };

  if (!open || !mounted) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center overflow-y-auto px-4 py-6 sm:px-0"
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-gray-500/75 dark:bg-gray-950/80 transition-opacity" />

      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-6 right-6 z-[110] px-4 py-2 rounded shadow-lg text-white text-sm ${
          notification.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'
        }`}>
          {notification.message}
        </div>
      )}

      {/* Modal Content */}
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-950 z-10">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Edit Site</h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            <IconMapper name="X" size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <IconMapper name="Loader2" size={24} className="animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Loading site data...</span>
            </div>
          ) : loadError ? (
            <div className="text-center py-12">
              <IconMapper name="AlertCircle" size={32} className="mx-auto text-red-500 mb-2" />
              <p className="text-sm text-red-500">{loadError}</p>
              <Button variant="outline" size="sm" onClick={handleClose} className="mt-4">Close</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-coin-500"
                  placeholder="Site name"
                />
                {errors.name && <div className="text-xs text-red-500 mt-1">{errors.name}</div>}
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => updateField('status', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-coin-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                {errors.status && <div className="text-xs text-red-500 mt-1">{errors.status}</div>}
              </div>

              {/* Site Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Site Type</label>
                <select
                  value={form.site_type}
                  onChange={(e) => updateField('site_type', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-coin-500"
                >
                  <option value="residential">Residential</option>
                  <option value="commercial">Commercial</option>
                  <option value="office">Office</option>
                </select>
                {errors.site_type && <div className="text-xs text-red-500 mt-1">{errors.site_type}</div>}
              </div>

              {/* Zone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Zone</label>
                <select
                  value={form.zone_id}
                  onChange={(e) => updateField('zone_id', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-coin-500"
                >
                  <option value="">Unassigned</option>
                  {zones.map(z => (<option key={z.id} value={z.id}>{z.name}</option>))}
                </select>
                {errors.zone_id && <div className="text-xs text-red-500 mt-1">{errors.zone_id}</div>}
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Address *</label>
                <input
                  value={form.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-coin-500"
                  placeholder="Site address"
                />
                {errors.address && <div className="text-xs text-red-500 mt-1">{errors.address}</div>}
              </div>

              {/* Contact */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Contact Person</label>
                <input
                  value={form.contact_person}
                  onChange={(e) => updateField('contact_person', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-coin-500"
                  placeholder="Contact person"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Phone</label>
                <input
                  value={form.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-coin-500"
                  placeholder="Phone number"
                />
              </div>

              {/* Required Guards */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Required Guards *</label>
                <input
                  type="number"
                  min={1}
                  value={form.required_guards}
                  onChange={(e) => updateField('required_guards', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-coin-500"
                />
                {errors.required_guards && <div className="text-xs text-red-500 mt-1">{errors.required_guards}</div>}
              </div>

              {/* Services Requested */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Services Requested</label>
                <input
                  value={form.services_requested}
                  onChange={(e) => updateField('services_requested', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-coin-500"
                  placeholder="Services requested"
                />
              </div>

              {/* Special Instructions */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Special Instructions</label>
                <textarea
                  value={form.special_instructions}
                  onChange={(e) => updateField('special_instructions', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-coin-500"
                  rows={3}
                  placeholder="Any special instructions..."
                />
              </div>

              {/* Location Section */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Location</label>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span>Use the map or enter coordinates manually.</span>
                    <button
                      type="button"
                      onClick={() => setShowMap(v => !v)}
                      className="px-3 py-1.5 text-xs font-medium border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-950 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                    >
                      {showMap ? 'Hide map' : 'Show map'}
                    </button>
                  </div>

                  {showMap && (
                    <LocationPicker
                      value={form.latitude && form.longitude ? { lat: Number(form.latitude), lng: Number(form.longitude) } : null}
                      onChange={(c) => {
                        setForm((prev: any) => ({
                          ...prev,
                          latitude: c.lat.toFixed(6),
                          longitude: c.lng.toFixed(6),
                        }));
                      }}
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
                    {/* Latitude */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Latitude</label>
                      <input
                        type="number"
                        step="0.000001"
                        min={-90}
                        max={90}
                        value={form.latitude}
                        onChange={(e) => updateField('latitude', e.target.value)}
                        onPaste={(e) => {
                          const text = e.clipboardData.getData('text') || '';
                          const matches = text.match(/-?\d+(?:\.\d+)?/g) || [];
                          if (matches.length >= 2) {
                            const lat = Number(matches[0]);
                            const lng = Number(matches[1]);
                            if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
                              e.preventDefault();
                              setForm((prev: any) => ({
                                ...prev,
                                latitude: Math.max(-90, Math.min(90, lat)).toFixed(6),
                                longitude: Math.max(-180, Math.min(180, lng)).toFixed(6),
                              }));
                            }
                          }
                        }}
                        onBlur={(e) => {
                          const v = e.target.value;
                          if (v === '') return;
                          let n = Number(v);
                          if (isNaN(n)) return;
                          updateField('latitude', Math.max(-90, Math.min(90, n)).toFixed(6));
                        }}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-coin-500"
                        placeholder="e.g. -13.962600"
                      />
                      {errors.latitude && <div className="text-xs text-red-500 mt-1">{errors.latitude}</div>}
                    </div>

                    {/* Longitude */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Longitude</label>
                      <input
                        type="number"
                        step="0.000001"
                        min={-180}
                        max={180}
                        value={form.longitude}
                        onChange={(e) => updateField('longitude', e.target.value)}
                        onPaste={(e) => {
                          const text = e.clipboardData.getData('text') || '';
                          const matches = text.match(/-?\d+(?:\.\d+)?/g) || [];
                          if (matches.length >= 2) {
                            const lat = Number(matches[0]);
                            const lng = Number(matches[1]);
                            if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
                              e.preventDefault();
                              setForm((prev: any) => ({
                                ...prev,
                                latitude: Math.max(-90, Math.min(90, lat)).toFixed(6),
                                longitude: Math.max(-180, Math.min(180, lng)).toFixed(6),
                              }));
                            }
                          }
                        }}
                        onBlur={(e) => {
                          const v = e.target.value;
                          if (v === '') return;
                          let n = Number(v);
                          if (isNaN(n)) return;
                          updateField('longitude', Math.max(-180, Math.min(180, n)).toFixed(6));
                        }}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-coin-500"
                        placeholder="e.g. 33.774100"
                      />
                      {errors.longitude && <div className="text-xs text-red-500 mt-1">{errors.longitude}</div>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && !loadError && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 rounded-b-2xl sticky bottom-0">
            <Button
              type="button"
              onClick={handleDelete}
              disabled={saving}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {saving ? (
                <>
                  <IconMapper name="Loader2" size={16} className="mr-2 animate-spin" />
                  Working...
                </>
              ) : (
                <>
                  <IconMapper name="Trash2" size={16} className="mr-2" />
                  Delete Site
                </>
              )}
            </Button>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={saving}
                className="dark:border-gray-600 dark:text-gray-200"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="bg-coin-600 hover:bg-coin-700 text-white"
              >
                {saving ? (
                  <>
                    <IconMapper name="Loader2" size={16} className="mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Use portal to render outside the parent Dialog's DOM tree
  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return null;
}
