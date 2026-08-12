import React, { useEffect, Suspense } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Button } from '@/Components/ui/button';
import { useForm, router } from '@inertiajs/react';
import IconMapper from '@/Components/IconMapper';

// Lazy load LocationPicker to reduce main bundle size
const LocationPicker = React.lazy(() => import('@/Components/Map/LocationPicker'));

// Loading fallback for map component
const MapLoadingFallback = () => (
  <div className="w-full h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
    <span className="text-gray-500">Loading map...</span>
  </div>
);

interface Service {
  id: number;
  name: string;
  monthly_price: number;
  required_guards?: number;
}

interface AddClientModalProps {
  open: boolean;
  onClose: () => void;
  services?: Service[];
}

interface Zone { id: number; name: string }

interface AddClientModalPropsExtended extends AddClientModalProps {
  zones?: Zone[];
}

const clientFieldClassName =
  'w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-coin-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950';

const clientInlineFieldClassName =
  'rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 px-3 py-1 focus:outline-none focus:ring-2 focus:ring-coin-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950';

export default function AddClientModal({ open, onClose, services = [], zones = [] }: AddClientModalPropsExtended) {
  const { data, setData, post, processing, errors, reset, transform } = useForm({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    contract_start_date: '',
    contract_end_date: '',
    monthly_rate: 0,
    billing_start_date: new Date().toISOString().split('T')[0],
    notes: '',
    status: 'active',
      site: {
      name: 'Home',
      address: '',
      status: 'active',
      site_type: 'residential',
      contact_person: '',
      phone: '',
      special_instructions: '',
      latitude: '',
      longitude: '',
      required_guards: 1,
      zone_id: '',
    },
    services: [] as Array<{ id: number; custom_price: number | null; quantity: number }>,
    create_user: false,
    user_name: '',
    user_email: '',
    user_phone: '',
    user_role: 'primary' as 'primary' | 'contact' | 'viewer',
  });
  const [showSiteMap, setShowSiteMap] = React.useState(true);

  useEffect(() => {
    const selectedServices = data.services || [];
    let totalMonthlyRate = 0;

    selectedServices.forEach((selectedService: { id: number; custom_price: number | null; quantity: number }) => {
      const service = services.find(s => s.id === selectedService.id);
      if (service) {
        const serviceRate = selectedService.custom_price ?? service.monthly_price;
        const quantity = selectedService.quantity || 1;
        totalMonthlyRate += serviceRate * quantity;
      }
    });

    setData('monthly_rate', totalMonthlyRate);
  }, [data.services]);

  // Transform data before submission to convert empty strings to null
  transform((data) => ({
    ...data,
    site: {
      ...data.site,
      zone_id: data.site.zone_id === '' ? null : data.site.zone_id,
      latitude: data.site.latitude === '' ? null : data.site.latitude,
      longitude: data.site.longitude === '' ? null : data.site.longitude,
    },
  }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting client form...', data);
    post(route('admin.clients.store'), {
      onSuccess: () => {
        console.log('Client created successfully');
        reset();
        onClose();
        router.reload({ only: ['clients'] });
      },
      onError: (err) => {
        console.error('Client creation error:', err);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={() => !processing && onClose()}>
      <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800">
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Client Name *</label>
            <input
              type="text"
              value={data.name}
              onChange={(e) => setData('name', e.target.value)}
              className={clientFieldClassName}
              required
            />
            {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Monthly Rate (MWK)</label>
              <input 
                type="number" 
                step="0.01" 
                value={data.monthly_rate} 
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100" 
                disabled 
                title="Monthly rate is automatically calculated based on selected services"
              />
              {errors.monthly_rate && <p className="text-red-600 text-sm mt-1">{errors.monthly_rate}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Billing Start Date</label>
              <input 
                type="date" 
                value={data.billing_start_date} 
                onChange={(e) => setData('billing_start_date', e.target.value)} 
                className={clientFieldClassName}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Defaults to today if not specified</p>
              {errors.billing_start_date && <p className="text-red-600 text-sm mt-1">{errors.billing_start_date}</p>}
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Contact Person</label>
                <input 
                  type="text" 
                  value={data.contact_person} 
                  onChange={(e) => setData('contact_person', e.target.value)} 
                  className={clientFieldClassName}
                  placeholder="Primary contact name"
                />
                {errors.contact_person && <p className="text-red-600 text-sm mt-1">{errors.contact_person}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Email</label>
                <input 
                  type="email" 
                  value={data.email} 
                  onChange={(e) => setData('email', e.target.value)} 
                  className={clientFieldClassName}
                  placeholder="contact@example.com"
                />
                {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Phone</label>
                <input 
                  type="tel" 
                  value={data.phone} 
                  onChange={(e) => setData('phone', e.target.value)} 
                  className={clientFieldClassName}
                  placeholder="Phone number"
                />
                {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Address</label>
                <input 
                  type="text" 
                  value={data.address} 
                  onChange={(e) => setData('address', e.target.value)} 
                  className={clientFieldClassName}
                  placeholder="Business address"
                />
                {errors.address && <p className="text-red-600 text-sm mt-1">{errors.address}</p>}
              </div>
            </div>
          </div>
          <div className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Select Services *</label>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Total Monthly Rate: <span className="font-semibold">{new Intl.NumberFormat('en-MW', { style: 'currency', currency: 'MWK' }).format(data.monthly_rate)}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
              {services.map((s) => {
                const selected = (data.services || []).some((ds: any) => ds.id === s.id);
                return (
                  <div key={s.id} className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg flex items-center gap-4 bg-white dark:bg-gray-950 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={selected} 
                      onChange={(e) => {
                        let list = Array.isArray(data.services) ? [...data.services] : [];
                        if (e.target.checked) {
                          list.push({ id: s.id, custom_price: null, quantity: 1 });
                        } else {
                          list = list.filter((it: any) => it.id !== s.id);
                        }
                        setData('services', list);
                      }}
                      className="h-4 w-4 text-coin-600 focus:ring-coin-500 border-gray-300 dark:border-gray-700 rounded"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-gray-100">{s.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-4">
                        <span>Base Rate: {new Intl.NumberFormat('en-MW', { style: 'currency', currency: 'MWK' }).format(s.monthly_price)}</span>
                      </div>
                    </div>
                    {selected && (
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Custom Rate:</span>
                          <input 
                            type="number" 
                            step="0.01" 
                            placeholder="Optional" 
                            value={(data.services.find((it: any) => it.id === s.id)?.custom_price ?? '') as any} 
                            onChange={(e) => {
                              const list = (data.services || []).map((it: any) => 
                                it.id === s.id ? ({ ...it, custom_price: e.target.value === '' ? null : Number(e.target.value) }) : it
                              );
                              setData('services', list);
                            }} 
                            className={`w-32 ${clientInlineFieldClassName}`}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Quantity:</span>
                          <input 
                            type="number" 
                            min="1"
                            value={data.services.find((it: any) => it.id === s.id)?.quantity || 1} 
                            onChange={(e) => {
                              const quantity = Math.max(1, parseInt(e.target.value) || 1);
                              const list = (data.services || []).map((it: any) => 
                                it.id === s.id ? ({ ...it, quantity }) : it
                              );
                              setData('services', list);
                            }} 
                            className={`w-20 ${clientInlineFieldClassName}`}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">* Monthly rate and required guards will be automatically calculated based on selected services</p>
          </div>

          <div className="pt-6 border-t">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Site Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Site Name</label>
                <input 
                  type="text" 
                  value={data.site.name} 
                  onChange={(e) => setData('site', { ...data.site, name: e.target.value })} 
                  className={clientFieldClassName}
                  placeholder="Home/Residence"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Defaults to Home/Residence if not specified</p>
                {errors['site.name'] && <p className="text-red-600 text-sm mt-1">{(errors as any)['site.name']}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Site Type</label>
                <select 
                  value={data.site.site_type || 'residential'} 
                  onChange={(e) => setData('site', { ...data.site, site_type: e.target.value })} 
                  className={clientFieldClassName}
                >
                  <option value="residential">Residential</option>
                  <option value="commercial">Commercial</option>
                  <option value="office">Office</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Status</label>
                <select 
                  value={data.site.status} 
                  onChange={(e) => setData('site', { ...data.site, status: e.target.value })} 
                  className={clientFieldClassName}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Address</label>
                <textarea 
                  value={data.site.address} 
                  onChange={(e) => setData('site', { ...data.site, address: e.target.value })} 
                  className={clientFieldClassName}
                  placeholder="Enter site address (defaults to client address if empty)"
                />
                {errors['site.address'] && <p className="text-red-600 text-sm mt-1">{(errors as any)['site.address']}</p>}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Location</label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
                    <span>Use the map or enter coordinates manually.</span>
                    <button
                      type="button"
                      onClick={() => setShowSiteMap((v) => !v)}
                      className="px-2 py-1 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-950 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-coin-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950"
                    >
                      {showSiteMap ? 'Hide map' : 'Show map'}
                    </button>
                  </div>
                  {showSiteMap && (
                    <Suspense fallback={<MapLoadingFallback />}>
                      <LocationPicker
                        value={data.site.latitude && data.site.longitude ? { lat: Number(data.site.latitude), lng: Number(data.site.longitude) } : null}
                        onChange={(coords) => setData('site', { ...data.site, latitude: coords.lat.toFixed(6), longitude: coords.lng.toFixed(6) })}
                        heightClassName="h-64"
                      />
                    </Suspense>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Tap the map to set exact coordinates or enter them manually below.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Latitude</label>
                    <input
                      type="number"
                      step="0.000001"
                      min={-90}
                      max={90}
                      value={data.site.latitude}
                      onChange={(e) => setData('site', { ...data.site, latitude: e.target.value })}
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
                            setData('site', {
                              ...data.site,
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
                        setData('site', { ...data.site, latitude: n.toFixed(6) });
                      }}
                      className={`mt-1 ${clientFieldClassName}`}
                      placeholder="e.g. -13.962600"
                    />
                    {(errors as any)['site.latitude'] && <p className="text-red-600 text-sm mt-1">{(errors as any)['site.latitude']}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Longitude</label>
                    <input
                      type="number"
                      step="0.000001"
                      min={-180}
                      max={180}
                      value={data.site.longitude}
                      onChange={(e) => setData('site', { ...data.site, longitude: e.target.value })}
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
                            setData('site', {
                              ...data.site,
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
                        setData('site', { ...data.site, longitude: n.toFixed(6) });
                      }}
                      className={`mt-1 ${clientFieldClassName}`}
                      placeholder="e.g. 33.774100"
                    />
                    {(errors as any)['site.longitude'] && <p className="text-red-600 text-sm mt-1">{(errors as any)['site.longitude']}</p>}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Zone</label>
                <select value={data.site.zone_id ?? ''} onChange={(e) => setData('site', { ...data.site, zone_id: e.target.value })} className={clientFieldClassName}>
                  <option value="">Select zone (optional)</option>
                  {zones.map(z => (
                    <option key={z.id} value={z.id}>{z.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Site Contact</label>
                <input 
                  type="text" 
                  value={data.site.contact_person} 
                  onChange={(e) => setData('site', { ...data.site, contact_person: e.target.value })} 
                  className={clientFieldClassName}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Site Phone</label>
                <input 
                  type="tel" 
                  value={data.site.phone} 
                  onChange={(e) => setData('site', { ...data.site, phone: e.target.value })} 
                  className={clientFieldClassName}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Special Instructions</label>
                <textarea 
                  value={data.site.special_instructions} 
                  onChange={(e) => setData('site', { ...data.site, special_instructions: e.target.value })} 
                  className={clientFieldClassName}
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Client Portal Account</h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.create_user}
                  onChange={(e) => setData('create_user', e.target.checked)}
                  className="h-4 w-4 text-coin-600 focus:ring-coin-500 border-gray-300 dark:border-gray-700 rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-200">Create client portal account</span>
              </label>
            </div>
            
            {data.create_user && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">User Name *</label>
                  <input
                    type="text"
                    value={data.user_name}
                    onChange={(e) => setData('user_name', e.target.value)}
                    className={clientFieldClassName}
                    placeholder="Full name"
                    required={data.create_user}
                  />
                  {errors.user_name && <p className="text-red-600 text-sm mt-1">{errors.user_name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Email *</label>
                  <input
                    type="email"
                    value={data.user_email}
                    onChange={(e) => setData('user_email', e.target.value)}
                    className={clientFieldClassName}
                    placeholder="client@example.com"
                    required={data.create_user}
                  />
                  {errors.user_email && <p className="text-red-600 text-sm mt-1">{errors.user_email}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={data.user_phone}
                    onChange={(e) => setData('user_phone', e.target.value)}
                    className={clientFieldClassName}
                    placeholder="Phone number"
                  />
                  {errors.user_phone && <p className="text-red-600 text-sm mt-1">{errors.user_phone}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Role</label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    A password reset email will be sent to set their password.
                  </p>
                  <select
                    value={data.user_role}
                    onChange={(e) => setData('user_role', e.target.value as 'primary' | 'contact' | 'viewer')}
                    className={clientFieldClassName}
                  >
                    <option value="primary">Primary Contact (Full Access)</option>
                    <option value="contact">Contact (Standard Access)</option>
                    <option value="viewer">Viewer (Read Only)</option>
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Primary: full access | Contact: standard | Viewer: view only
                  </p>
                  {errors.user_role && <p className="text-red-600 text-sm mt-1">{errors.user_role}</p>}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button type="submit" disabled={processing} className="w-full sm:flex-1">
              <IconMapper name="Plus" className="w-4 h-4 mr-2" />
              {processing ? 'Creating...' : 'Create Client'}
            </Button>
            <Button type="button" variant="outline" onClick={() => !processing && onClose()} disabled={processing} className="w-full sm:w-auto">
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

