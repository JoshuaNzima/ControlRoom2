import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
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

export default function EmergencyContactsIndex({ contacts, typeOptions, auth }: Props) {
  const [expandedTypes, setExpandedTypes] = useState<string[]>(Object.keys(contacts));

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
                <Link href={route('emergency-contacts.create')}>
                  <Button className="bg-white text-red-900 hover:bg-red-50 w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Contact
                  </Button>
                </Link>
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
                                    <Link
                                      href={route('emergency-contacts.edit', contact.id)}
                                      className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-400/10 rounded transition-colors"
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Link>
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
                <Link href={route('emergency-contacts.create')} className="mt-4 inline-block">
                  <Button className="bg-red-600 hover:bg-red-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Contact
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
