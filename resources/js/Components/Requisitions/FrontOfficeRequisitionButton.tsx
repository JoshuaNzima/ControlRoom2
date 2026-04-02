import React from 'react';
import Modal from '@/Components/Modal';
import { router, useForm, usePage } from '@inertiajs/react';
import { Plus, Trash2, Package } from 'lucide-react';
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
  amount: string;
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

interface FrontOfficeRequisitionButtonProps {
  label?: string;
  className?: string;
}

export default function FrontOfficeRequisitionButton({
  label = 'New Requisition',
  className = '',
}: FrontOfficeRequisitionButtonProps) {
  const [open, setOpen] = React.useState(false);
  const [multiItemMode, setMultiItemMode] = React.useState(false);

  const { data, setData, post, processing, errors, reset, transform } = useForm<QuickRequisitionForm>({
    title: '',
    description: '',
    needed_by: new Date().toISOString().slice(0, 10),
    category: 'general',
    amount: '',
    items: [
      { id: generateId(), description: '', category: 'general', quantity: '1', unit_price: '', amount: '' },
    ],
    attachments: [],
  } as QuickRequisitionForm);

  const calculateItemAmount = (quantity: string, unitPrice: string): string => {
    const qty = parseFloat(quantity) || 0;
    const price = parseFloat(unitPrice) || 0;
    return (qty * price).toFixed(2);
  };

  const totalAmount = React.useMemo(() => {
    if (!multiItemMode) return parseFloat(data.amount) || 0;
    return data.items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  }, [data.amount, data.items, multiItemMode]);

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

    transform((data) => {
      if (multiItemMode) {
        return { ...data, items: data.items.filter(i => i.description.trim()) };
      } else {
        return {
          ...data,
          items: [{
            description: data.title,
            category: data.category,
            quantity: 1,
            unit_price: data.amount,
            amount: data.amount,
          }]
        };
      }
    });

    post(route('front-office.requisitions.store'), {
      onSuccess: () => {
        reset();
        setMultiItemMode(false);
        setOpen(false);
        router.reload();
      },
      forceFormData: true,
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center justify-center rounded-md bg-coin-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-coin-600/20 transition-all hover:bg-coin-700 hover:shadow-coin-600/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 ${className}`}
      >
        <Plus className="w-5 h-5 mr-2" />
        {label}
      </button>

      <Modal show={open} onClose={() => setOpen(false)} maxWidth="2xl">
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 max-h-[85vh] overflow-y-auto">
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">New Requisition</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Submit a request for funds or items.
                </p>
              </div>
              <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setMultiItemMode(false)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${!multiItemMode ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Simple
                </button>
                <button
                  type="button"
                  onClick={() => setMultiItemMode(true)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${multiItemMode ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <Package className="w-3.5 h-3.5 inline mr-1" />
                  Multi-item
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-foreground">Title *</label>
                <input
                  id="req-title"
                  name="title"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-coin-500 focus:border-transparent"
                  value={data.title}
                  onChange={(e) => setData('title', e.target.value)}
                  maxLength={255}
                  placeholder="What do you need?"
                  required
                />
                {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Category</label>
                <select
                  id="req-category"
                  name="category"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-coin-500 focus:border-transparent"
                  value={data.category}
                  onChange={(e) => setData('category', e.target.value as RequisitionCategory)}
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Needed by</label>
                <input
                  id="req-needed-by"
                  name="needed_by"
                  type="date"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-coin-500 focus:border-transparent"
                  value={data.needed_by}
                  onChange={(e) => setData('needed_by', e.target.value)}
                />
                {errors.needed_by && <p className="text-xs text-red-500">{errors.needed_by}</p>}
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-foreground">Description (optional)</label>
                <textarea
                  id="req-description"
                  name="description"
                  className="min-h-[60px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-coin-500 focus:border-transparent"
                  value={data.description}
                  onChange={(e) => setData('description', e.target.value)}
                  placeholder="Additional details..."
                  rows={2}
                />
                {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
              </div>
            </div>

            {!multiItemMode && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Amount (MWK) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">MK</span>
                  <input
                    id="req-amount"
                    name="amount"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="w-full rounded-lg border border-border bg-background pl-10 pr-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-coin-500 focus:border-transparent"
                    value={data.amount}
                    onChange={(e) => setData('amount', e.target.value)}
                    required={!multiItemMode}
                  />
                </div>
                {errors.amount && <p className="text-xs text-red-500">{errors.amount}</p>}
              </div>
            )}

            {multiItemMode && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">Line Items</h3>
                  <button
                    type="button"
                    onClick={addItem}
                    className="inline-flex items-center gap-1 rounded-md bg-coin-600/10 px-2.5 py-1.5 text-xs font-medium text-coin-600 hover:bg-coin-600/20"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add item
                  </button>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {data.items.map((item, index) => (
                    <div
                      key={item.id}
                      className="rounded-lg border border-border bg-muted/50 p-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-muted-foreground">Item {index + 1}</span>
                        {data.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="rounded p-1 text-muted-foreground hover:bg-red-100 hover:text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                        <div className="sm:col-span-7">
                          <input
                            className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-coin-500"
                            value={item.description}
                            onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                            placeholder="Description"
                            required={multiItemMode}
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <input
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            min="0.01"
                            className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-coin-500"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                            placeholder="Qty"
                            required={multiItemMode}
                          />
                        </div>
                        <div className="sm:col-span-3">
                          <input
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            min="0"
                            className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-coin-500"
                            value={item.unit_price}
                            onChange={(e) => handleItemChange(item.id, 'unit_price', e.target.value)}
                            placeholder="Unit price"
                          />
                        </div>
                      </div>
                      {item.amount && parseFloat(item.amount) > 0 && (
                        <p className="mt-1 text-xs text-right text-muted-foreground">
                          Subtotal: {formatCurrencyMWK(item.amount)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {totalAmount > 0 && (
              <div className="flex items-center justify-between rounded-lg bg-coin-600/5 border border-coin-600/10 p-3">
                <span className="text-sm font-medium text-foreground">Total Amount</span>
                <span className="text-lg font-bold text-coin-600">
                  {formatCurrencyMWK(totalAmount)}
                </span>
              </div>
            )}

            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-semibold text-foreground">Attachments (optional)</label>
              <input
                type="file"
                multiple
                accept=".pdf,image/*,.doc,.docx,.xls,.xlsx"
                className="block w-full text-xs text-foreground file:mr-2 file:rounded-md file:border file:border-border file:bg-background file:px-3 file:py-1.5 file:text-xs file:font-medium hover:file:bg-muted"
                onChange={(e) => setData('attachments', Array.from(e.target.files || []))}
              />
              {data.attachments && data.attachments.length > 0 && (
                <ul className="mt-1 space-y-0.5 text-[11px] text-muted-foreground">
                  {data.attachments.map((f, i) => (
                    <li key={i} className="flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      {f.name}
                    </li>
                  ))}
                </ul>
              )}
              {errors.attachments && <p className="text-xs text-red-500">{String(errors.attachments)}</p>}
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={processing || (multiItemMode && data.items.every(i => !i.description.trim()))}
              className="inline-flex items-center justify-center rounded-lg bg-coin-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-coin-700 disabled:opacity-60"
            >
              {processing ? 'Submitting…' : `Submit ${multiItemMode ? `${data.items.filter(i => i.description.trim()).length || ''} item${data.items.filter(i => i.description.trim()).length === 1 ? '' : 's'}` : 'Requisition'}`}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
