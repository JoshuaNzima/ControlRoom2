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
  onAdded?: () => void;
  zones?: Zone[];
};

const initialForm = {
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
  site_type: 'residential',
};

export default function AddSiteModal({ open, onClose, clientId, onAdded, zones = [] }: Props) {
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState(initialForm);
  const [showMap, setShowMap] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (open) {
      setForm(initialForm);
      setErrors({});
      setShowMap(true);
    }
  }, [open]);

  const handleClose = () => {
    if (!saving) onClose();
  };

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
        Object.entries(e.response.data.errors).forEach(([k, v]: any) => {
          errs[k] = Array.isArray(v) ? v[0] : String(v);
        });
        setErrors(errs);
      }
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof typeof form, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  if (!open || !mounted) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center overflow-y-auto px-4 py-6 sm:px-0"
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-gray-500/75 dark:bg-gray-950/80 transition-opacity" />
      
      {/* Modal Content */}
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-950 z-10">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Add Site</h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            <IconMapper name="X" size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Name *</label>
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Status</label>
            <select 
              value={form.status} 
              onChange={(e) => updateField('status', e.target.value)} 
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-coin-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Zone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Zone</label>
            <select 
              value={form.zone_id} 
              onChange={(e) => updateField('zone_id', e.target.value)} 
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-coin-500"
            >
              <option value="">Unassigned</option>
              {zones.map(z => (<option key={z.id} value={z.id}>{z.name}</option>))}
            </select>
          </div>

          {/* Site Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Site Type</label>
            <select 
              value={form.site_type} 
              onChange={(e) => updateField('site_type', e.target.value)} 
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-coin-500"
            >
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="office">Office</option>
            </select>
          </div>

          {/* Address */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Address *</label>
            <input 
              value={form.address} 
              onChange={(e) => updateField('address', e.target.value)} 
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-coin-500" 
              placeholder="Site address" 
            />
            {errors.address && <div className="text-xs text-red-500 mt-1">{errors.address}</div>}
          </div>

          {/* Contact Person */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Contact Person</label>
            <input 
              value={form.contact_person} 
              onChange={(e) => updateField('contact_person', e.target.value)} 
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-coin-500" 
              placeholder="Contact person" 
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Phone</label>
            <input 
              value={form.phone} 
              onChange={(e) => updateField('phone', e.target.value)} 
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-coin-500" 
              placeholder="Phone number" 
            />
          </div>

          {/* Required Guards */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Required Guards *</label>
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Services Requested</label>
            <input 
              value={form.services_requested} 
              onChange={(e) => updateField('services_requested', e.target.value)} 
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-coin-500" 
              placeholder="Services requested" 
            />
          </div>

          {/* Special Instructions */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Special Instructions</label>
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Location</label>
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
                    setForm(prev => ({ 
                      ...prev, 
                      latitude: c.lat.toFixed(6), 
                      longitude: c.lng.toFixed(6) 
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
                          setForm(prev => ({
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
                          setForm(prev => ({
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

        {/* Footer */}
        <div className="flex items-center gap-3 justify-end px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 rounded-b-2xl sticky bottom-0">
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
            onClick={handleAdd} 
            disabled={saving} 
            className="bg-coin-600 hover:bg-coin-700 text-white"
          >
            {saving ? (
              <>
                <IconMapper name="Loader2" size={16} className="mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              'Add Site'
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  // Use portal to render outside the parent Dialog's DOM tree
  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }
  
  return null;
}
