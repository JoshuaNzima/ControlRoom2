import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import {
  Phone,
  MapPin,
  AlertCircle,
  Building2,
  Ambulance,
  Shield,
  Zap,
  ChevronDown,
  Plus,
  Pencil,
  Trash2,
  Save,
} from 'lucide-react';

interface Contact {
  id: number;
  name: string;
  type: string;
  phone: string | null;
  alternative_phone: string | null;
  email: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  type_label: string;
}

interface Props {
  contacts: Record<string, Contact[]>;
  typeOptions: Record<string, string>;
  auth: {
    user: {
      canManage?: boolean;
    };
  };
  show_add?: number;
}

const typeIcons: Record<string, any> = {
  police: Shield,
  hospital: Building2,
  fire_station: AlertCircle,
  ambulance: Ambulance,
  security: Shield,
  emergency: AlertCircle,
  utility: Zap,
  other: Phone,
};

const typeColors: Record<string, string> = {
  police: 'bg-blue-600',
  hospital: 'bg-emerald-600',
  fire_station: 'bg-red-600',
  ambulance: 'bg-amber-600',
  security: 'bg-indigo-600',
  emergency: 'bg-rose-600',
  utility: 'bg-yellow-600',
  other: 'bg-gray-600',
};

export default function EmergencyContactsIndex({ contacts, typeOptions, auth, show_add }: Props) {
  const [expandedTypes, setExpandedTypes] = useState<string[]>(Object.keys(contacts));
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  const { data, setData, post, processing, errors, reset } = useForm({
    name: '',
    type: '',
    phone: '',
    alternative_phone: '',
    email: '',
    address: '',
    latitude: '',
    longitude: '',
    notes: '',
    display_order: '0',
  });

  const editForm = useForm({
    name: '',
    type: '',
    phone: '',
    alternative_phone: '',
    email: '',
    address: '',
    latitude: '',
    longitude: '',
    notes: '',
    display_order: '0',
    is_active: true,
  });

  // Open add modal if show_add query param is present
  useEffect(() => {
    if (show_add) {
      setShowAddModal(true);
    }
  }, [show_add]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('emergency-contacts.store'), {
      onSuccess: () => {
        setShowAddModal(false);
        reset();
      },
    });
  };

  const openEditModal = (contact: Contact) => {
    setEditingContact(contact);
    editForm.setData({
      name: contact.name,
      type: contact.type,
      phone: contact.phone || '',
      alternative_phone: contact.alternative_phone || '',
      email: contact.email || '',
      address: contact.address || '',
      latitude: contact.latitude?.toString() || '',
      longitude: contact.longitude?.toString() || '',
      notes: contact.notes || '',
      display_order: '0',
      is_active: true,
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContact) return;
    
    router.put(route('emergency-contacts.update', editingContact.id), editForm.data, {
      onSuccess: () => {
        setShowEditModal(false);
        setEditingContact(null);
      },
    });
  };

  const toggleType = (type: string) => {
    setExpandedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const formatPhoneLink = (phone: string | null): string | null => {
    if (!phone) return null;
    return 'tel:' + phone.replace(/[^\d+]/g, '');
  };

  return (
    <AuthenticatedLayout>
      <Head title="Emergency Contacts" />

      <div className="min-h-screen bg-gray-950">
        {/* Emergency Header */}
        <div className="bg-gradient-to-r from-red-900 via-red-800 to-red-900">
          <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                  <AlertCircle className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">
                    Emergency Contacts
                  </h1>
                  <p className="text-red-200 text-sm mt-1">
                    Police, Hospitals, Fire Stations & More
                  </p>
                </div>
              </div>

              {auth.user?.canManage && (
                <Button onClick={() => setShowAddModal(true)} className="bg-white text-red-900 hover:bg-red-50 w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Contact
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          {/* Emergency Banner */}
          <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="font-semibold text-red-400">Emergency Numbers</h2>
                <p className="text-red-200/80 text-sm mt-1">
                  Click on any phone number to call directly from your mobile device.
                </p>
              </div>
            </div>
          </div>

          {/* Contact Groups */}
          <div className="space-y-4">
            {Object.entries(contacts).map(([type, typeContacts]) => {
              const Icon = typeIcons[type] || Phone;
              const isExpanded = expandedTypes.includes(type);
              const colorClass = typeColors[type] || 'bg-gray-600';

              return (
                <Card key={type} className="overflow-hidden bg-gray-900 border-gray-800">
                  {/* Section Header */}
                  <button
                    onClick={() => toggleType(type)}
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 ${colorClass} rounded-lg`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-gray-100">
                          {typeOptions[type]}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {typeContacts.length} contact{typeContacts.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <ChevronDown
                      className={`h-5 w-5 text-gray-400 transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Contact List */}
                  {isExpanded && (
                    <div className="border-t border-gray-800">
                      <div className="divide-y divide-gray-800">
                        {typeContacts.map((contact) => (
                          <div
                            key={contact.id}
                            className="p-4 sm:p-5 hover:bg-gray-800/50 transition-colors"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-100 text-lg">
                                  {contact.name}
                                </h4>

                                {contact.address && (
                                  <p className="text-sm text-gray-400 mt-1 flex items-start gap-1.5">
                                    <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                    <span className="line-clamp-2">{contact.address}</span>
                                  </p>
                                )}

                                {contact.notes && (
                                  <p className="text-sm text-gray-500 mt-2 italic">
                                    {contact.notes}
                                  </p>
                                )}
                              </div>

                              <div className="flex flex-col gap-2 sm:items-end">
                                {/* Primary Phone */}
                                {contact.phone && (
                                  <a
                                    href={formatPhoneLink(contact.phone) || '#'}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors"
                                  >
                                    <Phone className="h-4 w-4" />
                                    <span className="font-medium">{contact.phone}</span>
                                  </a>
                                )}

                                {/* Alternative Phone */}
                                {contact.alternative_phone && (
                                  <a
                                    href={formatPhoneLink(contact.alternative_phone) || '#'}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 text-sm rounded-lg transition-colors"
                                  >
                                    <Phone className="h-3.5 w-3.5" />
                                    <span>{contact.alternative_phone}</span>
                                  </a>
                                )}

                                {/* Edit/Delete for managers */}
                                {auth.user?.canManage && (
                                  <div className="flex items-center gap-2 mt-2">
                                    <button
                                      onClick={() => openEditModal(contact)}
                                      className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-400/10 rounded transition-colors"
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (confirm('Delete this contact?')) {
                                          router.delete(route('emergency-contacts.destroy', contact.id));
                                        }
                                      }}
                                      className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Empty State */}
          {Object.keys(contacts).length === 0 && (
            <div className="text-center py-12">
              <div className="inline-flex p-4 rounded-full bg-gray-900 mb-4">
                <Phone className="h-8 w-8 text-gray-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-400">No emergency contacts</h3>
              <p className="text-gray-500 mt-1">
                Emergency contacts will appear here once added.
              </p>
              {auth.user?.canManage && (
                <Button onClick={() => setShowAddModal(true)} className="mt-4 bg-red-600 hover:bg-red-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Contact
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Contact Modal */}
      <Modal show={showAddModal} onClose={() => setShowAddModal(false)} maxWidth="2xl">
        <div className="p-4 sm:p-6 bg-gray-900">
          <h2 className="text-lg font-semibold text-gray-100 mb-4">Add Emergency Contact</h2>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">Contact Name *</Label>
                <Input
                  value={data.name}
                  onChange={(e) => setData('name', e.target.value)}
                  placeholder="e.g., Kamuzu Central Hospital"
                  className="bg-gray-800 border-gray-700 text-gray-100 mt-1"
                />
                {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <Label className="text-gray-300">Type *</Label>
                <select
                  value={data.type}
                  onChange={(e) => setData('type', e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Select type</option>
                  {Object.entries(typeOptions).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                {errors.type && <p className="text-red-400 text-sm mt-1">{errors.type}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300 flex items-center gap-2">
                  <Phone className="h-4 w-4" /> Primary Phone
                </Label>
                <Input
                  value={data.phone}
                  onChange={(e) => setData('phone', e.target.value)}
                  placeholder="e.g., +265 1 234 567"
                  className="bg-gray-800 border-gray-700 text-gray-100 mt-1"
                />
              </div>

              <div>
                <Label className="text-gray-300">Alternative Phone</Label>
                <Input
                  value={data.alternative_phone}
                  onChange={(e) => setData('alternative_phone', e.target.value)}
                  placeholder="e.g., +265 9 876 543"
                  className="bg-gray-800 border-gray-700 text-gray-100 mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-gray-300">Email Address</Label>
              <Input
                type="email"
                value={data.email}
                onChange={(e) => setData('email', e.target.value)}
                placeholder="contact@example.com"
                className="bg-gray-800 border-gray-700 text-gray-100 mt-1"
              />
            </div>

            <div>
              <Label className="text-gray-300 flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Physical Address
              </Label>
              <textarea
                value={data.address}
                onChange={(e) => setData('address', e.target.value)}
                placeholder="Enter the full address..."
                rows={2}
                className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">Latitude</Label>
                <Input
                  type="number"
                  step="any"
                  min="-90"
                  max="90"
                  value={data.latitude}
                  onChange={(e) => setData('latitude', e.target.value)}
                  placeholder="-13.9626"
                  className="bg-gray-800 border-gray-700 text-gray-100 mt-1"
                />
              </div>

              <div>
                <Label className="text-gray-300">Longitude</Label>
                <Input
                  type="number"
                  step="any"
                  min="-180"
                  max="180"
                  value={data.longitude}
                  onChange={(e) => setData('longitude', e.target.value)}
                  placeholder="33.7741"
                  className="bg-gray-800 border-gray-700 text-gray-100 mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-gray-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> Notes
              </Label>
              <textarea
                value={data.notes}
                onChange={(e) => setData('notes', e.target.value)}
                placeholder="Additional information..."
                rows={2}
                className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowAddModal(false)} className="border-gray-700 text-gray-300 hover:bg-gray-800 w-full sm:w-auto">
                Cancel
              </Button>
              <Button type="submit" disabled={processing} className="bg-red-600 hover:bg-red-700 w-full sm:w-auto">
                <Save className="h-4 w-4 mr-2" />
                {processing ? 'Saving...' : 'Save Contact'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Edit Contact Modal */}
      <Modal show={showEditModal} onClose={() => setShowEditModal(false)} maxWidth="2xl">
        <div className="p-4 sm:p-6 bg-gray-900">
          <h2 className="text-lg font-semibold text-gray-100 mb-4">Edit Emergency Contact</h2>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">Contact Name *</Label>
                <Input
                  value={editForm.data.name}
                  onChange={(e) => editForm.setData('name', e.target.value)}
                  className="bg-gray-800 border-gray-700 text-gray-100 mt-1"
                />
              </div>

              <div>
                <Label className="text-gray-300">Type *</Label>
                <select
                  value={editForm.data.type}
                  onChange={(e) => editForm.setData('type', e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 focus:ring-2 focus:ring-red-500"
                >
                  {Object.entries(typeOptions).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300 flex items-center gap-2">
                  <Phone className="h-4 w-4" /> Primary Phone
                </Label>
                <Input
                  value={editForm.data.phone}
                  onChange={(e) => editForm.setData('phone', e.target.value)}
                  className="bg-gray-800 border-gray-700 text-gray-100 mt-1"
                />
              </div>

              <div>
                <Label className="text-gray-300">Alternative Phone</Label>
                <Input
                  value={editForm.data.alternative_phone}
                  onChange={(e) => editForm.setData('alternative_phone', e.target.value)}
                  className="bg-gray-800 border-gray-700 text-gray-100 mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-gray-300">Email Address</Label>
              <Input
                type="email"
                value={editForm.data.email}
                onChange={(e) => editForm.setData('email', e.target.value)}
                className="bg-gray-800 border-gray-700 text-gray-100 mt-1"
              />
            </div>

            <div>
              <Label className="text-gray-300 flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Physical Address
              </Label>
              <textarea
                value={editForm.data.address}
                onChange={(e) => editForm.setData('address', e.target.value)}
                rows={2}
                className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">Latitude</Label>
                <Input
                  type="number"
                  step="any"
                  min="-90"
                  max="90"
                  value={editForm.data.latitude}
                  onChange={(e) => editForm.setData('latitude', e.target.value)}
                  className="bg-gray-800 border-gray-700 text-gray-100 mt-1"
                />
              </div>

              <div>
                <Label className="text-gray-300">Longitude</Label>
                <Input
                  type="number"
                  step="any"
                  min="-180"
                  max="180"
                  value={editForm.data.longitude}
                  onChange={(e) => editForm.setData('longitude', e.target.value)}
                  className="bg-gray-800 border-gray-700 text-gray-100 mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-gray-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> Notes
              </Label>
              <textarea
                value={editForm.data.notes}
                onChange={(e) => editForm.setData('notes', e.target.value)}
                rows={2}
                className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowEditModal(false)} className="border-gray-700 text-gray-300 hover:bg-gray-800 w-full sm:w-auto">
                Cancel
              </Button>
              <Button type="submit" disabled={editForm.processing} className="bg-red-600 hover:bg-red-700 w-full sm:w-auto">
                <Save className="h-4 w-4 mr-2" />
                {editForm.processing ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </AuthenticatedLayout>
  );
}
