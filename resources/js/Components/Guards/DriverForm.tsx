import React, { ChangeEvent, FormEvent } from 'react';
import { useForm } from '@inertiajs/react';

const DISTRICTS = [
  'Balaka','Blantyre','Chikwawa','Chiradzulu','Chitipa','Dedza','Dowa','Karonga','Kasungu','Likoma','Lilongwe','Machinga','Mangochi','Mchinji','Mulanje','Mwanza','Mzimba','Neno','Nkhata Bay','Nkhotakota','Nsanje','Ntcheu','Ntchisi','Phalombe','Rumphi','Salima','Thyolo','Zomba'
];

interface Supervisor {
  id: number;
  name: string;
}

interface DriverFormData {
  employee_id?: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  residence_address?: string;
  residence_district?: string;
  id_number?: string;
  date_of_birth?: string;
  gender?: string;
  marital_status?: string;
  spouse_name?: string;
  spouse_phone?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  next_of_kin_name?: string;
  next_of_kin_relationship?: string;
  next_of_kin_phone?: string;
  supervisor_id?: string | number;
  hire_date?: string;
  status: string;
  notes?: string;
  children_names?: string;
  home_village?: string;
  home_ta?: string;
  home_district?: string;
  education_level?: string;
  qualifications?: string | string[];
  languages?: string | string[];
  dependents_count?: number;
  photo?: File | null;
  employee_role: 'driver';
}

interface DriverFormProps {
  initialData: Partial<DriverFormData>;
  supervisors: Supervisor[];
  onSubmit: (data: DriverFormData & { photo?: File | null }) => void;
  canAssignSupervisor: boolean;
  processing?: boolean;
  errors?: Record<string, string>;
  hideCancel?: boolean;
  onCancel?: () => void;
}

export default function DriverForm({
  initialData,
  supervisors,
  onSubmit,
  canAssignSupervisor,
  processing = false,
  errors = {},
  hideCancel = false,
  onCancel,
}: DriverFormProps) {
  const normalizeDateInput = (input: any): string => {
    if (!input) return '';
    const s = String(input).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
    const sl = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (sl) {
      const dd = sl[1].padStart(2, '0');
      const mm = sl[2].padStart(2, '0');
      const yyyy = sl[3];
      return `${yyyy}-${mm}-${dd}`;
    }
    return '';
  };

  const { data, setData } = useForm<any>({
    ...initialData,
    employee_id: initialData.employee_id || '',
    name: initialData.name || '',
    phone: initialData.phone || '',
    email: initialData.email || '',
    address: initialData.address || '',
    residence_address: initialData.residence_address || '',
    residence_district: initialData.residence_district || '',
    id_number: initialData.id_number || '',
    date_of_birth: normalizeDateInput(initialData.date_of_birth || ''),
    gender: initialData.gender || '',
    marital_status: initialData.marital_status || '',
    spouse_name: initialData.spouse_name || '',
    spouse_phone: initialData.spouse_phone || '',
    emergency_contact_name: initialData.emergency_contact_name || '',
    emergency_contact_phone: initialData.emergency_contact_phone || '',
    next_of_kin_name: initialData.next_of_kin_name || '',
    next_of_kin_relationship: initialData.next_of_kin_relationship || '',
    next_of_kin_phone: initialData.next_of_kin_phone || '',
    supervisor_id: initialData.supervisor_id || '',
    hire_date: normalizeDateInput(initialData.hire_date || ''),
    status: initialData.status || 'active',
    employee_role: 'driver' as const,
    notes: initialData.notes || '',
    children_names: initialData.children_names || '',
    home_village: initialData.home_village || '',
    home_ta: initialData.home_ta || '',
    home_district: initialData.home_district || '',
    education_level: initialData.education_level || '',
    qualifications: initialData.qualifications || '',
    languages: initialData.languages || '',
    dependents_count: initialData.dependents_count || '',
  });

  const set = (field: string, value: any) => (setData as any)(field as any, value);
  const handleChange = (field: string) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    set(field, e.target.value);
    if (clientErrors[field]) {
      setClientErrors((prev) => {
        const { [field]: _omit, ...rest } = prev;
        return rest;
      });
    }
  };

  const [clientErrors, setClientErrors] = React.useState<Record<string, string>>({});
  const [submitted, setSubmitted] = React.useState(false);
  const err = (k: string) => (errors && (errors as any)[k]) || clientErrors[k];

  const missingProfileFields = React.useMemo(() => {
    const missing: string[] = [];
    if (!String(data.id_number || '').trim()) missing.push('ID Number');
    if (!String(data.emergency_contact_name || '').trim()) missing.push('Emergency Contact Name');
    if (!String(data.emergency_contact_phone || '').trim()) missing.push('Emergency Contact Phone');
    return missing;
  }, [data.id_number, data.emergency_contact_name, data.emergency_contact_phone]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const local: Record<string, string> = {};
    if (!String(data.name || '').trim()) local.name = 'Full Name is required';
    if (!String(data.phone || '').trim()) local.phone = 'Phone is required';

    setClientErrors(local);
    if (Object.keys(local).length > 0) return;

    const payload = { ...data };
    const normalizeDate = (input: any): any => {
      if (!input || typeof input !== 'string') return input;
      const s = input.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
      const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (m) {
        const dd = m[1].padStart(2, '0');
        const mm = m[2].padStart(2, '0');
        const yyyy = m[3];
        return `${yyyy}-${mm}-${dd}`;
      }
      return s;
    };
    const toArray = (val: any) => {
      if (Array.isArray(val)) return val;
      if (typeof val === 'string') {
        try {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed)) return parsed;
        } catch {}
        return val.split(',').map((s) => s.trim()).filter(Boolean);
      }
      return [];
    };
    payload.date_of_birth = normalizeDate(payload.date_of_birth);
    payload.hire_date = normalizeDate(payload.hire_date);
    if (payload.qualifications) payload.qualifications = toArray(payload.qualifications);
    if (payload.languages) payload.languages = toArray(payload.languages);
    payload.employee_role = 'driver';
    onSubmit(payload as DriverFormData);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {missingProfileFields.length > 0 && (
        <div className="rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 px-4 py-3">
          <div className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">Profile incomplete</div>
          <div className="mt-1 text-sm text-yellow-800 dark:text-yellow-200">
            Please add:
            <span className="font-medium"> {missingProfileFields.join(', ')}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Employee ID</label>
          <input
            type="text"
            value={data.employee_id}
            placeholder="Auto-generated"
            disabled
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 focus:ring-2 focus:ring-red-500"
          />
          {errors.employee_id && <p className="text-red-600 text-sm mt-1">{errors.employee_id}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name *</label>
          <input
            type="text"
            value={data.name}
            onChange={handleChange('name')}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 ${err('name') ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-red-500'} dark:bg-gray-900 dark:text-gray-100`}
            required
          />
          {err('name') && <p className="text-red-600 text-sm mt-1">{err('name')}</p>}
        </div>

        {canAssignSupervisor && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Supervisor</label>
            <select
              value={data.supervisor_id}
              onChange={handleChange('supervisor_id')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-900 dark:text-gray-100"
            >
              <option value="">Select a Supervisor</option>
              {supervisors.map((supervisor) => (
                <option key={supervisor.id} value={supervisor.id}>
                  {supervisor.name}
                </option>
              ))}
            </select>
            {errors.supervisor_id && <p className="text-red-600 text-sm mt-1">{errors.supervisor_id}</p>}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone *</label>
          <input
            type="tel"
            value={data.phone}
            onChange={handleChange('phone')}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 ${err('phone') ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-red-500'} dark:bg-gray-900 dark:text-gray-100`}
            required
          />
          {err('phone') && <p className="text-red-600 text-sm mt-1">{err('phone')}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
          <input
            type="email"
            value={data.email}
            onChange={handleChange('email')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-900 dark:text-gray-100"
          />
          {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ID Number</label>
          <input
            type="text"
            value={data.id_number}
            onChange={handleChange('id_number')}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 ${err('id_number') ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-red-500'} dark:bg-gray-900 dark:text-gray-100`}
          />
          {err('id_number') && <p className="text-red-600 text-sm mt-1">{err('id_number')}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date of Birth</label>
          <input
            type="date"
            value={data.date_of_birth}
            onChange={handleChange('date_of_birth')}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 ${err('date_of_birth') ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-red-500'} dark:bg-gray-900 dark:text-gray-100`}
          />
          {err('date_of_birth') && <p className="text-red-600 text-sm mt-1">{err('date_of_birth')}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Gender</label>
          <select
            value={data.gender}
            onChange={handleChange('gender')}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 ${err('gender') ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-red-500'} dark:bg-gray-900 dark:text-gray-100`}
          >
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
          {err('gender') && <p className="text-red-600 text-sm mt-1">{err('gender')}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Address</label>
          <textarea
            value={data.address}
            onChange={handleChange('address')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-900 dark:text-gray-100"
            rows={3}
          />
          {errors.address && <p className="text-red-600 text-sm mt-1">{errors.address}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Residence Address</label>
          <input
            type="text"
            value={data.residence_address}
            onChange={handleChange('residence_address')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-900 dark:text-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Residence District</label>
          <select
            value={data.residence_district}
            onChange={handleChange('residence_district')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-900 dark:text-gray-100"
          >
            <option value="">Select District</option>
            {DISTRICTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Marital Status</label>
          <select
            value={data.marital_status || ''}
            onChange={handleChange('marital_status')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-900 dark:text-gray-100"
          >
            <option value="">Select</option>
            <option value="single">Single</option>
            <option value="married">Married</option>
            <option value="divorced">Divorced</option>
            <option value="widowed">Widowed</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Spouse Name</label>
          <input
            type="text"
            value={data.spouse_name || ''}
            onChange={handleChange('spouse_name')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-900 dark:text-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Spouse Phone</label>
          <input
            type="text"
            value={data.spouse_phone || ''}
            onChange={handleChange('spouse_phone')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-900 dark:text-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Next of Kin Name</label>
          <input
            type="text"
            value={data.next_of_kin_name || ''}
            onChange={handleChange('next_of_kin_name')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-900 dark:text-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Relationship</label>
          <input
            type="text"
            value={data.next_of_kin_relationship || ''}
            onChange={handleChange('next_of_kin_relationship')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-900 dark:text-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Next of Kin Phone</label>
          <input
            type="text"
            value={data.next_of_kin_phone || ''}
            onChange={handleChange('next_of_kin_phone')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-900 dark:text-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Home Village</label>
          <input
            type="text"
            value={data.home_village || ''}
            onChange={handleChange('home_village')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-900 dark:text-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Home T/A</label>
          <input
            type="text"
            value={data.home_ta || ''}
            onChange={handleChange('home_ta')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-900 dark:text-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Home District</label>
          <select
            value={data.home_district || ''}
            onChange={handleChange('home_district')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-900 dark:text-gray-100"
          >
            <option value="">Select District</option>
            {DISTRICTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Education Level</label>
          <input
            type="text"
            value={data.education_level || ''}
            onChange={handleChange('education_level')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-900 dark:text-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Qualifications</label>
          <textarea
            value={Array.isArray(data.qualifications) ? JSON.stringify(data.qualifications) : data.qualifications || ''}
            onChange={(e) => set('qualifications', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-900 dark:text-gray-100"
            rows={2}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Languages</label>
          <textarea
            value={Array.isArray(data.languages) ? JSON.stringify(data.languages) : data.languages || ''}
            onChange={(e) => set('languages', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-900 dark:text-gray-100"
            rows={2}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Dependents</label>
          <input
            type="number"
            value={Number(data.dependents_count || 0)}
            onChange={(e) => set('dependents_count', Number(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-900 dark:text-gray-100"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Children Names</label>
          <textarea
            value={data.children_names}
            onChange={handleChange('children_names')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-900 dark:text-gray-100"
            rows={2}
            placeholder="List children names separated by commas"
          />
          {errors.children_names && <p className="text-red-600 text-sm mt-1">{errors.children_names}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Emergency Contact Name</label>
          <input
            type="text"
            value={data.emergency_contact_name}
            onChange={handleChange('emergency_contact_name')}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 ${err('emergency_contact_name') ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-red-500'} dark:bg-gray-900 dark:text-gray-100`}
          />
          {err('emergency_contact_name') && <p className="text-red-600 text-sm mt-1">{err('emergency_contact_name')}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Emergency Contact Phone</label>
          <input
            type="tel"
            value={data.emergency_contact_phone}
            onChange={handleChange('emergency_contact_phone')}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 ${err('emergency_contact_phone') ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-red-500'} dark:bg-gray-900 dark:text-gray-100`}
          />
          {err('emergency_contact_phone') && <p className="text-red-600 text-sm mt-1">{err('emergency_contact_phone')}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Hire Date</label>
          <input
            type="date"
            value={data.hire_date}
            onChange={handleChange('hire_date')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-900 dark:text-gray-100"
          />
          {errors.hire_date && <p className="text-red-600 text-sm mt-1">{errors.hire_date}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status *</label>
          <select
            value={data.status}
            onChange={handleChange('status')}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 ${err('status') ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-red-500'} dark:bg-gray-900 dark:text-gray-100`}
            required
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
          {err('status') && <p className="text-red-600 text-sm mt-1">{err('status')}</p>}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</label>
          <textarea
            value={data.notes}
            onChange={handleChange('notes')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-900 dark:text-gray-100"
            rows={4}
          />
          {errors.notes && <p className="text-red-600 text-sm mt-1">{errors.notes}</p>}
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={processing}
          className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold disabled:opacity-50"
        >
          {processing ? 'Saving...' : 'Save'}
        </button>
        {!hideCancel && (
          <button
            type="button"
            onClick={() => (onCancel ? onCancel() : window.history.back())}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-bold dark:bg-gray-700 dark:text-gray-200"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
