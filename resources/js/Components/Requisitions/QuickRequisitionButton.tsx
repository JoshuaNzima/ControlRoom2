import React from 'react';
import Modal from '@/Components/Modal';
import { useForm, usePage } from '@inertiajs/react';
import type { PageProps } from '@/types';
import { Plus, Trash2 } from 'lucide-react';
import { formatCurrencyMWK } from '@/Components/format';

type RequisitionCategory = 'general' | 'fuel' | 'vehicle_hire' | 'events' | 'k9' | 'utilities' | 'office_supplies' | 'stationery' | 'cleaning_supplies' | 'security_equipment' | 'uniforms' | 'training_materials' | 'vehicle_maintenance' | 'communications' | 'it_equipment' | 'medical_supplies';

type RequisitionItem = {
  id: string;
  description: string;
  category: RequisitionCategory;
  quantity: string;
  unit_price: string;
  amount: string;
};

type QuickRequisitionForm = {
  title: string;
  description: string;
  needed_by: string;
  category: RequisitionCategory;
  items: RequisitionItem[];
  attachments?: File[];
};

const generateId = () => Math.random().toString(36).substring(2, 9);

const categories = [
  { value: 'general', label: 'General' },
  { value: 'fuel', label: 'Fuel' },
  { value: 'vehicle_hire', label: 'Vehicle hire' },
  { value: 'vehicle_maintenance', label: 'Vehicle maintenance' },
  { value: 'events', label: 'Events' },
  { value: 'k9', label: 'K9' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'office_supplies', label: 'Office supplies' },
  { value: 'stationery', label: 'Stationery' },
  { value: 'cleaning_supplies', label: 'Cleaning supplies' },
  { value: 'security_equipment', label: 'Security equipment' },
  { value: 'uniforms', label: 'Uniforms' },
  { value: 'training_materials', label: 'Training materials' },
  { value: 'communications', label: 'Communications' },
  { value: 'it_equipment', label: 'IT equipment' },
  { value: 'medical_supplies', label: 'Medical supplies' },
];

export default function QuickRequisitionButton({
  label = 'New requisition',
  className = '',
}: {
  label?: string;
  className?: string;
}) {
  const page = usePage() as any;
  const auth = page?.props?.auth;
  const user = auth?.user;
  const roles: string[] = Array.isArray(user?.roles) ? user.roles : [];
  if (!user) return null;
  if (roles.includes('admin') || roles.includes('super_admin')) return null;

  const [open, setOpen] = React.useState(false);

  const { data, setData, post, processing, errors, reset } = useForm<QuickRequisitionForm>({
    title: '',
    description: '',
    needed_by: new Date().toISOString().slice(0, 10),
    category: 'general',
    items: [
      {
        id: generateId(),
        description: '',
        category: 'general',
        quantity: '1',
        unit_price: '',
        amount: '',
      },
    ],
    attachments: [],
  } as QuickRequisitionForm);

  const calculateItemAmount = (quantity: string, unitPrice: string): string => {
    const qty = parseFloat(quantity) || 0;
    const price = parseFloat(unitPrice) || 0;
    return (qty * price).toFixed(2);
  };

  const totalAmount = React.useMemo(() => {
    return data.items.reduce((sum, item) => {
      const amount = parseFloat(item.amount) || 0;
      return sum + amount;
    }, 0);
  }, [data.items]);

  const handleItemChange = (id: string, field: keyof RequisitionItem, value: string) => {
    setData('items', data.items.map((item) => {
      if (item.id !== id) return item;

      const updated = { ...item, [field]: value };

      if (field === 'quantity' || field === 'unit_price') {
        updated.amount = calculateItemAmount(
          field === 'quantity' ? value : item.quantity,
          field === 'unit_price' ? value : item.unit_price
        );
      }

      return updated;
    }));
  };

  const addItem = () => {
    setData('items', [
      ...data.items,
      {
        id: generateId(),
        description: '',
        category: data.category,
        quantity: '1',
        unit_price: '',
        amount: '',
      },
    ]);
  };

  const removeItem = (id: string) => {
    if (data.items.length <= 1) return;
    setData('items', data.items.filter((item) => item.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('requisitions.store'), {
      onSuccess: () => {
        reset();
        setOpen(false);
      },
      preserveScroll: true,
      forceFormData: true,
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center justify-center rounded-md bg-red-600 px-3 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-red-700 disabled:opacity-60 ${className}`}
      >
        {label}
      </button>

      <Modal show={open} onClose={() => setOpen(false)} maxWidth="2xl">
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 max-h-[80vh] overflow-y-auto">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">New requisition</h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Add line items for each thing you need. Admins will review and approve items individually.
            </p>
          </div>

          <div className="space-y-4">
            {/* Header Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Title</label>
                <input
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                  value={data.title}
                  onChange={(e) => setData('title', e.target.value)}
                  maxLength={255}
                  placeholder="Brief description of this requisition"
                  required
                />
                {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Default Category</label>
                <select
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                  value={data.category}
                  onChange={(e) => {
                    const newCat = e.target.value as QuickRequisitionForm['category'];
                    setData('category', newCat);
                    setData('items', data.items.map(item =>
                      item.category === data.category ? { ...item, category: newCat } : item
                    ));
                  }}
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Needed by</label>
                <input
                  type="date"
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                  value={data.needed_by}
                  onChange={(e) => setData('needed_by', e.target.value)}
                />
                {errors.needed_by && <p className="text-xs text-red-500">{errors.needed_by}</p>}
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Description (optional)</label>
                <textarea
                  className="min-h-[60px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                  value={data.description}
                  onChange={(e) => setData('description', e.target.value)}
                  placeholder="Additional details about this requisition"
                />
                {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
              </div>
            </div>

            {/* Items Header */}
            <div className="flex items-center justify-between pt-2">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Line Items</h3>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-1 rounded-md bg-red-600/10 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
              >
                <Plus className="h-3.5 w-3.5" />
                Add item
              </button>
            </div>

            {/* Items List */}
            <div className="space-y-3">
              {data.items.map((item, index) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-gray-200 bg-gray-50/50 p-3 dark:border-gray-700 dark:bg-gray-900/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Item {index + 1}
                    </span>
                    {data.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="rounded p-1 text-gray-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-6 space-y-1">
                      <label className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase">Description</label>
                      <input
                        className="w-full rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-gray-600 dark:bg-gray-950 dark:text-gray-100"
                        value={item.description}
                        onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                        placeholder="What you need"
                        required
                      />
                    </div>

                    <div className="sm:col-span-3 space-y-1">
                      <label className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase">Category</label>
                      <select
                        className="w-full rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-gray-600 dark:bg-gray-950 dark:text-gray-100"
                        value={item.category}
                        onChange={(e) => handleItemChange(item.id, 'category', e.target.value)}
                      >
                        {categories.map((cat) => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase">Qty</label>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min="0.01"
                        className="w-full rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-gray-600 dark:bg-gray-950 dark:text-gray-100"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                        required
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase">Unit Price</label>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min="0"
                        className="w-full rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-gray-600 dark:bg-gray-950 dark:text-gray-100"
                        value={item.unit_price}
                        onChange={(e) => handleItemChange(item.id, 'unit_price', e.target.value)}
                        placeholder="0.00"
                      />
                    </div>

                    <div className="sm:col-span-3 space-y-1">
                      <label className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase">Amount (MWK)</label>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min="0"
                        className="w-full rounded-md border border-gray-300 bg-gray-100 px-2.5 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                        value={item.amount}
                        onChange={(e) => handleItemChange(item.id, 'amount', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="flex items-center justify-between rounded-lg bg-red-600/5 p-3 dark:bg-red-500/5">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Amount</span>
              <span className="text-lg font-semibold text-red-600 dark:text-red-400">
                {formatCurrencyMWK(totalAmount)}
              </span>
            </div>

            {/* Attachments */}
            <div className="space-y-1 pt-2">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Attachments (optional)</label>
              <input
                type="file"
                multiple
                accept=".pdf,image/*,.doc,.docx,.xls,.xlsx"
                className="block w-full text-xs text-gray-700 dark:text-gray-200 file:mr-2 file:rounded-md file:border file:border-gray-300 file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-medium hover:file:bg-gray-50 dark:file:border-gray-700 dark:file:bg-gray-900"
                onChange={(e) => setData('attachments', Array.from(e.target.files || []))}
              />
              {data.attachments && data.attachments.length > 0 && (
                <ul className="mt-1 space-y-0.5 text-[11px] text-gray-600 dark:text-gray-400">
                  {data.attachments.map((f, i) => (
                    <li key={i}>{f.name}</li>
                  ))}
                </ul>
              )}
              {errors.attachments && <p className="text-xs text-red-500">{String(errors.attachments)}</p>}
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center rounded-md border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={processing || data.items.length === 0}
              className="inline-flex items-center justify-center rounded-md bg-red-600 px-3 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-red-700 disabled:opacity-60"
            >
              {processing ? 'Submitting…' : `Submit ${data.items.length} item${data.items.length === 1 ? '' : 's'}`}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
