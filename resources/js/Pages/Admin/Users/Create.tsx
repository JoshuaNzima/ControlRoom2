import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/Components/ui/card';
import { Form, FormField, FormLabel, FormMessage } from '@/Components/ui/form';
import { Input } from '@/Components/ui/input';
import { Button } from '@/Components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';

interface Role {
  id: number;
  name: string;
}

interface Zone {
  id: number;
  name: string;
}

interface CreateUserProps {
  roles: Role[];
  zones: Zone[];
}

interface UserFormData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone?: string;
  employee_id?: string;
  role?: string;
  zone_id?: number | null;
  status: 'active' | 'inactive';
}

export default function CreateUser({ roles, zones }: CreateUserProps) {
  const { data, setData, post, processing, errors } = useForm<UserFormData>({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    phone: '',
    employee_id: '',
    role: roles?.[0]?.name || '',
    zone_id: null,
    status: 'active'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('admin.users.store'));
  };

  const isZoneCommanderSelected = data.role?.toLowerCase() === 'zone_commander' || 
                                 data.role?.toLowerCase() === 'zone commander';

  return (
    <AdminLayout title="Add User">
      <Head title="Add User" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card>
          <CardHeader>
            <CardTitle>Add New User</CardTitle>
            <CardDescription>Create a new user account with role-based access.</CardDescription>
          </CardHeader>

          <Form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name Field */}
                <FormField>
                  <FormLabel>Name</FormLabel>
                  <Input
                    id="name"
                    name="name"
                    value={data.name}
                    onChange={e => setData('name', e.target.value)}
                    required
                  />
                  {errors.name && <FormMessage>{errors.name}</FormMessage>}
                </FormField>

                {/* Employee ID Field */}
                <FormField>
                  <FormLabel>Employee ID</FormLabel>
                  <Input
                    id="employee_id"
                    name="employee_id"
                    value={data.employee_id}
                    onChange={e => setData('employee_id', e.target.value)}
                  />
                  {errors.employee_id && <FormMessage>{errors.employee_id}</FormMessage>}
                </FormField>

                {/* Email Field */}
                <FormField>
                  <FormLabel>Email</FormLabel>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    value={data.email}
                    onChange={e => setData('email', e.target.value)}
                    required
                  />
                  {errors.email && <FormMessage>{errors.email}</FormMessage>}
                </FormField>

                {/* Phone Field */}
                <FormField>
                  <FormLabel>Phone</FormLabel>
                  <Input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={data.phone}
                    onChange={e => setData('phone', e.target.value)}
                  />
                  {errors.phone && <FormMessage>{errors.phone}</FormMessage>}
                </FormField>

                {/* Password Field */}
                <FormField>
                  <FormLabel>Password</FormLabel>
                  <Input
                    type="password"
                    id="password"
                    name="password"
                    value={data.password}
                    onChange={e => setData('password', e.target.value)}
                    required
                  />
                  {errors.password && <FormMessage>{errors.password}</FormMessage>}
                </FormField>

                {/* Password Confirmation Field */}
                <FormField>
                  <FormLabel>Confirm Password</FormLabel>
                  <Input
                    type="password"
                    id="password_confirmation"
                    name="password_confirmation"
                    value={data.password_confirmation}
                    onChange={e => setData('password_confirmation', e.target.value)}
                    required
                  />
                  {errors.password_confirmation && <FormMessage>{errors.password_confirmation}</FormMessage>}
                </FormField>

                {/* Role Field */}
                <FormField>
                  <FormLabel>Role</FormLabel>
                  <Select
                    value={data.role}
                    onValueChange={(value) => setData('role', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.name}>
                          {role.name.replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.role && <FormMessage>{errors.role}</FormMessage>}
                </FormField>

                {/* Status Field */}
                <FormField>
                  <FormLabel>Status</FormLabel>
                  <Select
                    value={data.status}
                    onValueChange={(value) => setData('status', value as 'active' | 'inactive')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.status && <FormMessage>{errors.status}</FormMessage>}
                </FormField>

                {/* Zone Field - Only shown for Zone Commanders */}
                {isZoneCommanderSelected && (
                  <FormField>
                    <FormLabel>Assigned Zone</FormLabel>
                    <Select
                      value={data.zone_id?.toString() || ''}
                      onValueChange={(value) => setData('zone_id', value ? parseInt(value) : null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a zone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No Zone Assigned</SelectItem>
                        {zones.map((zone) => (
                          <SelectItem key={zone.id} value={zone.id.toString()}>
                            {zone.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.zone_id && <FormMessage>{errors.zone_id}</FormMessage>}
                  </FormField>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => window.history.back()}
                disabled={processing}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={processing}>
                Create User
              </Button>
            </CardFooter>
          </Form>
        </Card>
      </div>
    </AdminLayout>
  );
}
