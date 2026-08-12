import React from 'react';
import IconMapper from '@/Components/IconMapper';
import Modal from '@/Components/Modal';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Card } from '@/Components/ui/card';

interface UserDetailsModalProps {
  open: boolean;
  onClose: () => void;
  user: UserDetails | null;
  onEdit?: () => void;
}

interface UserDetails {
  id: number;
  name: string;
  email: string;
  phone?: string;
  employee_id?: string;
  status?: string;
  avatar_url?: string;
  initials?: string;
  roles: { id?: number; name: string }[];
  zone?: { id: number; name: string } | null;
  created_at?: string;
  updated_at?: string;
  email_verified_at?: string;
  last_login_at?: string;
}

export default function UserDetailsModal({
  open,
  onClose,
  user,
  onEdit,
}: UserDetailsModalProps) {
  if (!user) {
    return (
      <Modal show={open} onClose={onClose} maxWidth="lg">
        <div className="p-6 text-center text-gray-500 dark:text-gray-400">
          <IconMapper name="Loader2" size={32} className="animate-spin mx-auto mb-2" />
          Loading user details...
        </div>
      </Modal>
    );
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getRoleColor = (roleName: string) => {
    const role = roleName.toLowerCase().replace(' ', '_');
    switch (role) {
      case 'super_admin': return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
      case 'admin': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300';
      case 'manager': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
      case 'supervisor': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
      case 'zone_commander': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300';
      case 'client': return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const InfoRow = ({ label, value, icon }: { label: string; value?: React.ReactNode; icon?: string }) => (
    <div className="flex items-start gap-3 py-2">
      {icon && <IconMapper name={icon} size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />}
      <div className="flex-1 min-w-0">
        <span className="text-xs text-gray-500 dark:text-gray-400 block">{label}</span>
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{value || 'N/A'}</span>
      </div>
    </div>
  );

  return (
    <Modal show={open} onClose={onClose} maxWidth="lg">
      <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-4">
            <div className="relative">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-red-200 dark:border-red-800"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white font-bold text-xl">
                  {user.initials || user.name?.charAt(0) || '?'}
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold">{user.name}</h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-sm text-gray-500 dark:text-gray-400">{user.email}</span>
                <Badge className={getStatusColor(user.status)}>
                  {user.status || 'Active'}
                </Badge>
              </div>
              <div className="flex items-center gap-1 mt-1 flex-wrap">
                {user.roles.map((role) => (
                  <Badge key={role.id} className={getRoleColor(role.name)}>
                    {role.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <Button variant="outline" size="sm" onClick={onEdit}>
                <IconMapper name="Pencil" size={16} className="mr-1.5" />
                Edit
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Contact Info */}
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <IconMapper name="Phone" size={16} />
                Contact Information
              </h3>
              <InfoRow label="Email" value={user.email} icon="Mail" />
              <InfoRow label="Phone" value={user.phone} icon="Phone" />
              <InfoRow label="Employee ID" value={user.employee_id} icon="IdCard" />
            </Card>

            {/* Assignment Info */}
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <IconMapper name="MapPin" size={16} />
                Assignment
              </h3>
              <InfoRow 
                label="Zone" 
                value={user.zone?.name || 'Unassigned'} 
                icon="Map" 
              />
              <InfoRow 
                label="Primary Role" 
                value={user.roles?.[0]?.name || 'No Role'} 
                icon="Shield" 
              />
            </Card>

            {/* Account Info */}
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <IconMapper name="User" size={16} />
                Account Details
              </h3>
              <InfoRow 
                label="Created" 
                value={formatDate(user.created_at)} 
                icon="CalendarPlus" 
              />
              <InfoRow 
                label="Last Updated" 
                value={formatDate(user.updated_at)} 
                icon="CalendarCheck" 
              />
              <InfoRow 
                label="Email Verified" 
                value={user.email_verified_at ? formatDate(user.email_verified_at) : 'Not Verified'} 
                icon="CheckCircle" 
              />
            </Card>

            {/* Security */}
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <IconMapper name="Shield" size={16} />
                Security & Access
              </h3>
              <InfoRow 
                label="Status" 
                value={
                  <Badge className={getStatusColor(user.status)}>
                    {user.status || 'Active'}
                  </Badge>
                } 
                icon="Activity" 
              />
              <InfoRow 
                label="Roles" 
                value={user.roles.map(r => r.name).join(', ') || 'No roles'} 
                icon="Users" 
              />
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-800">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
