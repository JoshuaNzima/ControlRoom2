import { Head, useForm, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/button';
import { Card } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Checkbox } from '@/Components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/Components/ui/select';
import { ArrowLeft, Save, Phone, MapPin, AlertCircle } from 'lucide-react';

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
  is_active: boolean;
  notes: string | null;
  display_order: number;
}

interface Props {
  contact: Contact;
  typeOptions: Record<string, string>;
}

export default function EditEmergencyContact({ contact, typeOptions }: Props) {
  const { data, setData, put, processing, errors } = useForm({
    name: contact.name,
    type: contact.type,
    phone: contact.phone || '',
    alternative_phone: contact.alternative_phone || '',
    email: contact.email || '',
    address: contact.address || '',
    latitude: contact.latitude?.toString() || '',
    longitude: contact.longitude?.toString() || '',
    notes: contact.notes || '',
    display_order: contact.display_order.toString(),
    is_active: contact.is_active,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    put(route('emergency-contacts.update', contact.id));
  };

  return (
    <AuthenticatedLayout>
      <Head title="Edit Emergency Contact" />

      <div className="min-h-screen bg-gray-950">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-900 via-red-800 to-red-900">
          <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <Link
                href={route('emergency-contacts.index')}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white">Edit Emergency Contact</h1>
                <p className="text-red-200 text-sm">Update emergency service contact information</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <Card className="bg-gray-900 border-gray-800 p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Active Status */}
              <div className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-lg">
                <Checkbox
                  id="is_active"
                  checked={data.is_active}
                  onCheckedChange={(checked) => setData('is_active', checked as boolean)}
                />
                <Label htmlFor="is_active" className="text-gray-300 cursor-pointer">
                  Contact is active and visible
                </Label>
              </div>

              {/* Name & Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-300">Contact Name *</Label>
                  <Input
                    id="name"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    className="bg-gray-800 border-gray-700 text-gray-100"
                  />
                  {errors.name && (
                    <p className="text-red-400 text-sm">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type" className="text-gray-300">Type *</Label>
                  <Select
                    value={data.type}
                    onValueChange={(value) => setData('type', value)}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-100">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(typeOptions).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.type && (
                    <p className="text-red-400 text-sm">{errors.type}</p>
                  )}
                </div>
              </div>

              {/* Phone Numbers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-gray-300 flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Primary Phone
                  </Label>
                  <Input
                    id="phone"
                    value={data.phone}
                    onChange={(e) => setData('phone', e.target.value)}
                    className="bg-gray-800 border-gray-700 text-gray-100"
                  />
                  {errors.phone && (
                    <p className="text-red-400 text-sm">{errors.phone}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alternative_phone" className="text-gray-300">
                    Alternative Phone
                  </Label>
                  <Input
                    id="alternative_phone"
                    value={data.alternative_phone}
                    onChange={(e) => setData('alternative_phone', e.target.value)}
                    className="bg-gray-800 border-gray-700 text-gray-100"
                  />
                  {errors.alternative_phone && (
                    <p className="text-red-400 text-sm">{errors.alternative_phone}</p>
                  )}
                </div>
              </div>

              {/* Email & Address */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={data.email}
                  onChange={(e) => setData('email', e.target.value)}
                  className="bg-gray-800 border-gray-700 text-gray-100"
                />
                {errors.email && (
                  <p className="text-red-400 text-sm">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-gray-300 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Physical Address
                </Label>
                <textarea
                  id="address"
                  value={data.address}
                  onChange={(e) => setData('address', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                {errors.address && (
                  <p className="text-red-400 text-sm">{errors.address}</p>
                )}
              </div>

              {/* GPS Coordinates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="latitude" className="text-gray-300">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    min="-90"
                    max="90"
                    value={data.latitude}
                    onChange={(e) => setData('latitude', e.target.value)}
                    className="bg-gray-800 border-gray-700 text-gray-100"
                  />
                  {errors.latitude && (
                    <p className="text-red-400 text-sm">{errors.latitude}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="longitude" className="text-gray-300">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    min="-180"
                    max="180"
                    value={data.longitude}
                    onChange={(e) => setData('longitude', e.target.value)}
                    className="bg-gray-800 border-gray-700 text-gray-100"
                  />
                  {errors.longitude && (
                    <p className="text-red-400 text-sm">{errors.longitude}</p>
                  )}
                </div>
              </div>

              {/* Display Order */}
              <div className="space-y-2">
                <Label htmlFor="display_order" className="text-gray-300">Display Order</Label>
                <Input
                  id="display_order"
                  type="number"
                  min="0"
                  value={data.display_order}
                  onChange={(e) => setData('display_order', e.target.value)}
                  className="bg-gray-800 border-gray-700 text-gray-100 w-32"
                />
                {errors.display_order && (
                  <p className="text-red-400 text-sm">{errors.display_order}</p>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-gray-300 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Notes
                </Label>
                <textarea
                  id="notes"
                  value={data.notes}
                  onChange={(e) => setData('notes', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                {errors.notes && (
                  <p className="text-red-400 text-sm">{errors.notes}</p>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-800">
                <Button
                  type="submit"
                  disabled={processing}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {processing ? 'Saving...' : 'Update Contact'}
                </Button>
                <Link href={route('emergency-contacts.index')}>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-gray-700 text-gray-300 hover:bg-gray-800 w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
