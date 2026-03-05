import React, { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import FrontOfficeLayout from '@/Layouts/FrontOfficeLayout';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import IconMapper from '@/Components/IconMapper';

interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
}

interface Assignment {
  id: number;
  assistant_id: number;
  assigned_to_id: number;
  assignment_type: 'executive' | 'personal' | 'both';
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  is_primary: boolean;
  status: 'active' | 'inactive' | 'suspended';
  assistant: User;
  assigned_to: User;
}

interface PageProps {
  auth: {
    user: User;
  };
  assistants: User[];
  assignableUsers: User[];
  assignments: Assignment[];
  [key: string]: any;
}

export default function AssistantAssignments() {
  const { auth, assistants, assignableUsers, assignments } = usePage<PageProps>().props;
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    assistant_id: '',
    assigned_to_id: '',
    assignment_type: 'both',
    start_date: '',
    end_date: '',
    notes: '',
    is_primary: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.post(route('front-office.assignments.store'), formData, {
      onSuccess: () => {
        setShowForm(false);
        setFormData({
          assistant_id: '',
          assigned_to_id: '',
          assignment_type: 'both',
          start_date: '',
          end_date: '',
          notes: '',
          is_primary: false,
        });
      },
    });
  };

  const handleUpdate = (assignment: Assignment, updates: Record<string, any>) => {
    router.put(route('front-office.assignments.update', assignment.id), updates);
  };

  const handleDelete = (assignment: Assignment) => {
    if (confirm('Are you sure you want to remove this assignment?')) {
      router.delete(route('front-office.assignments.destroy', assignment.id));
    }
  };

  const getTypeBadge = (type: string) => {
    const badges: Record<string, string> = {
      executive: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      personal: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      both: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    };
    return badges[type] || badges.both;
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      inactive: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
      suspended: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };
    return badges[status] || badges.inactive;
  };

  return (
    <FrontOfficeLayout title="Assistant Assignments" user={auth.user}>
      <Head title="Assistant Assignments" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Assistant Assignments</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Manage which assistants are assigned to which users
            </p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <IconMapper name={showForm ? 'X' : 'Plus'} size={16} className="mr-2" />
            {showForm ? 'Cancel' : 'New Assignment'}
          </Button>
        </div>

        {/* Add Assignment Form */}
        {showForm && (
          <Card className="p-6 mb-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Create New Assignment
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="assistant">Assistant *</Label>
                  <Select
                    value={formData.assistant_id}
                    onValueChange={(value) => setFormData({ ...formData, assistant_id: value })}
                  >
                    <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700">
                      <SelectValue placeholder="Select an assistant" />
                    </SelectTrigger>
                    <SelectContent>
                      {assistants.map((assistant) => (
                        <SelectItem key={assistant.id} value={assistant.id.toString()}>
                          {assistant.name} ({assistant.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assigned_to">Assign To *</Label>
                  <Select
                    value={formData.assigned_to_id}
                    onValueChange={(value) => setFormData({ ...formData, assigned_to_id: value })}
                  >
                    <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700">
                      <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                    <SelectContent>
                      {assignableUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Assignment Type *</Label>
                  <Select
                    value={formData.assignment_type}
                    onValueChange={(value) => setFormData({ ...formData, assignment_type: value as 'executive' | 'personal' | 'both' })}
                  >
                    <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="executive">Executive Only</SelectItem>
                      <SelectItem value="personal">Personal Only</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="dark:bg-gray-800 dark:border-gray-700"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="dark:bg-gray-800 dark:border-gray-700"
                  />
                </div>

                <div className="space-y-2 flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_primary}
                      onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Set as Primary Assistant</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes about this assignment..."
                  className="dark:bg-gray-800 dark:border-gray-700"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  Create Assignment
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Assignments List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Current Assignments ({assignments.length})
          </h2>

          {assignments.length === 0 ? (
            <Card className="p-8 text-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <IconMapper name="Users" size={48} className="mx-auto mb-4 opacity-50 text-gray-400" />
              <p className="text-gray-500 dark:text-gray-400">No assignments yet.</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Click &quot;New Assignment&quot; to assign an assistant to a user.
              </p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {assignments.map((assignment) => (
                <Card
                  key={assignment.id}
                  className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
                            <IconMapper name="UserCircle" size={20} className="text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                              {assignment.assistant.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Assistant</p>
                          </div>
                        </div>

                        <IconMapper name="ArrowRight" size={16} className="text-gray-400" />

                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
                            <IconMapper name="User" size={20} className="text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                              {assignment.assigned_to.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Assigned To</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${getTypeBadge(assignment.assignment_type)}`}>
                          {assignment.assignment_type}
                        </span>
                        <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${getStatusBadge(assignment.status)}`}>
                          {assignment.status}
                        </span>
                        {assignment.is_primary && (
                          <span className="px-2 py-0.5 text-xs rounded-full font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                            Primary
                          </span>
                        )}
                        {assignment.start_date && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            From: {new Date(assignment.start_date).toLocaleDateString()}
                          </span>
                        )}
                        {assignment.end_date && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Until: {new Date(assignment.end_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {assignment.notes && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                          {assignment.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Select
                        value={assignment.status}
                        onValueChange={(value) =>
                          handleUpdate(assignment, { status: value as 'active' | 'inactive' | 'suspended' })
                        }
                      >
                        <SelectTrigger className="w-32 text-xs dark:bg-gray-800 dark:border-gray-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="suspended">Suspended</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(assignment)}
                        className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
                      >
                        <IconMapper name="Trash2" size={16} />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </FrontOfficeLayout>
  );
}
