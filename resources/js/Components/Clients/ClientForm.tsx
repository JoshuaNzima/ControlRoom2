import React from 'react';
import { useForm } from '@inertiajs/react';
import IconMapper from '@/Components/IconMapper';

interface Service {
  id: number;
  name: string;
  monthly_price: number;
  required_guards?: number;
}

interface ClientFormData {
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  contract_start_date: string;
  contract_end_date: string;
  monthly_rate: number;
  billing_start_date: string;
  notes: string;
  status: string;
  services: Array<{
    id: number;
    custom_price: number | null;
    quantity: number;
  }>;
}

interface ClientFormProps {
  initialData: Partial<ClientFormData>;
  services: Service[];
  onSubmit: (data: ClientFormData) => void;
  submitLabel?: string;
  processing?: boolean;
  errors?: Record<string, string>;
  /**
   * Optional id for the generated <form>. Useful when the submit button
   * is rendered outside the form (e.g. modal footer). If provided, the
   * external button can use form="<formId>" to trigger submit.
   */
  formId?: string;
  /**
   * If true, the component will not render its default footer (submit/cancel)
   * so a parent (modal) can render a sticky footer instead.
   */
  hideFooter?: boolean;
}

export default function ClientForm({
  initialData,
  services,
  onSubmit,
  submitLabel = 'Save',
  processing = false,
  errors = {},
  formId,
  hideFooter = false,
}: ClientFormProps) {
  const { data, setData } = useForm<ClientFormData>({
    name: initialData.name || '',
    contact_person: initialData.contact_person || '',
    phone: initialData.phone || '',
    email: initialData.email || '',
    address: initialData.address || '',
    contract_start_date: initialData.contract_start_date || '',
    contract_end_date: initialData.contract_end_date || '',
    monthly_rate: initialData.monthly_rate || 0,
    billing_start_date: initialData.billing_start_date || new Date().toISOString().split('T')[0],
    notes: initialData.notes || '',
    status: initialData.status || 'active',
    services: (initialData.services || []).map((s: any) => ({
      id: s.id,
      custom_price: s.pivot?.custom_price ?? null,
      quantity: s.pivot?.quantity ?? 1
    }))
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(data);
  };

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Client Name *</label>
        <input
          type="text"
          value={data.name}
          onChange={(e) => setData('name', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          required
        />
        {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Rate (MWK)</label>
          <input 
            type="number" 
            step="0.01" 
            value={data.monthly_rate} 
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50" 
            disabled 
            title="Monthly rate is automatically calculated based on selected services"
          />
          {errors.monthly_rate && <p className="text-red-600 text-sm mt-1">{errors.monthly_rate}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Billing Start Date</label>
          <input 
            type="date" 
            value={data.billing_start_date} 
            onChange={(e) => setData('billing_start_date', e.target.value)} 
            className="w-full px-4 py-2 border border-gray-300 rounded-lg" 
          />
          <p className="text-xs text-gray-500 mt-1">Defaults to today if not specified</p>
          {errors.billing_start_date && <p className="text-red-600 text-sm mt-1">{errors.billing_start_date}</p>}
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contact Person</label>
            <input 
              type="text" 
              value={data.contact_person} 
              onChange={(e) => setData('contact_person', e.target.value)} 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg" 
              placeholder="Primary contact name"
            />
            {errors.contact_person && <p className="text-red-600 text-sm mt-1">{errors.contact_person}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input 
              type="email" 
              value={data.email} 
              onChange={(e) => setData('email', e.target.value)} 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg" 
              placeholder="contact@example.com"
            />
            {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <input 
              type="tel" 
              value={data.phone} 
              onChange={(e) => setData('phone', e.target.value)} 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg" 
              placeholder="Phone number"
            />
            {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
            <input 
              type="text" 
              value={data.address} 
              onChange={(e) => setData('address', e.target.value)} 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg" 
              placeholder="Business address"
            />
            {errors.address && <p className="text-red-600 text-sm mt-1">{errors.address}</p>}
          </div>
        </div>
      </div>

      <div className="pt-4">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">Select Services *</label>
          <div className="text-sm text-gray-500">
            Total Monthly Rate: <span className="font-semibold">{new Intl.NumberFormat('en-MW', { style: 'currency', currency: 'MWK' }).format(data.monthly_rate)}</span>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
          {services.map((s) => {
            const selected = (data.services || []).some((ds: any) => ds.id === s.id);
            return (
              <div key={s.id} className="p-4 border rounded-lg flex items-center gap-4 bg-white hover:bg-gray-50 transition-colors">
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
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{s.name}</div>
                  <div className="text-sm text-gray-500 flex items-center gap-4">
                    <span>Base Rate: {new Intl.NumberFormat('en-MW', { style: 'currency', currency: 'MWK' }).format(s.monthly_price)}</span>
                  </div>
                </div>
                {selected && (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Custom Rate:</span>
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
                        className="w-32 px-3 py-1 border rounded-md focus:ring-1 focus:ring-red-500" 
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Quantity:</span>
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
                        className="w-20 px-3 py-1 border rounded-md focus:ring-1 focus:ring-red-500" 
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-sm text-gray-500 mt-2">* Monthly rate will be automatically calculated based on selected services</p>
      </div>

      {!hideFooter && (
        <div className="flex gap-4 mt-6">
          <button type="submit" disabled={processing} className="flex-1 btn btn-primary">
            <IconMapper name="Plus" className="w-4 h-4 mr-2" />
            {processing ? 'Saving...' : submitLabel}
          </button>
          <button type="button" onClick={() => window.history.back()} className="btn">
            Cancel
          </button>
        </div>
      )}
    </form>
  );
}