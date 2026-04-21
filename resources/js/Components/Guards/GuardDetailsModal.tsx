import React from 'react';
import { Link } from '@inertiajs/react';
import IconMapper from '@/Components/IconMapper';
import Modal from '@/Components/Modal';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Card } from '@/Components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/Components/ui/tabs';

interface GuardDetailsModalProps {
  open: boolean;
  onClose: () => void;
  guard: GuardDetails | null;
  onPrint?: () => void;
  onEdit?: () => void;
  onAssign?: () => void;
  scope?: 'admin' | 'superadmin' | 'control-room' | 'hr';
  onComplianceUpdate?: (guardId: number, data: { fingerprint_registered?: boolean; uniform_issued?: boolean; equipment_issued?: string[] }) => void;
}

interface GuardDetails {
  id: number;
  name: string;
  employee_id: string;
  phone?: string;
  email?: string;
  status?: string;
  position?: string;
  guard_type?: string;
  photo_url?: string;
  
  // Personal details
  date_of_birth?: string;
  gender?: string;
  marital_status?: string;
  id_number?: string;
  
  // Addresses
  address?: string;
  residence_address?: string;
  residence_city?: string;
  residence_district?: string;
  home_village?: string;
  home_ta?: string;
  home_district?: string;
  
  // Family/Emergency
  spouse_name?: string;
  spouse_phone?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  next_of_kin_name?: string;
  next_of_kin_relationship?: string;
  next_of_kin_phone?: string;
  
  // Employment
  hire_date?: string;
  education_level?: string;
  qualifications?: string[];
  languages?: string[];
  dependents_count?: number;
  
  // Relations
  supervisor?: { id: number; name: string } | null;
  zone?: { id: number; name: string } | null;
  grade?: { id: number; code: string; name: string } | null;
  
  // Assignment
  current_assignment?: {
    site?: { id: number; name: string; client?: { id: number; name: string } } | null;
    start_date?: string;
    end_date?: string;
    assignment_type?: string;
  } | null;
  
  // Attendance
  attendance_tally?: {
    range?: { start?: string; end?: string };
    by_status?: Record<string, number>;
    total?: number;
    hours_worked?: number;
    overtime_hours?: number;
    rate_percent?: number | null;
  };
  recent_attendance?: Array<{
    date: string;
    status: string;
    check_in?: string;
    check_out?: string;
    hours?: number;
  }>;
  
  // Infractions
  recent_infractions?: Array<{
    id: number;
    type: string;
    severity: string;
    description?: string;
    status: string;
    date: string;
  }>;
  
  // Documents
  documents?: Array<{
    id: number;
    type: string;
    name: string;
    verified: boolean;
    date: string;
  }>;
  
  // Flags
  is_profile_complete?: boolean;
  profile_missing_fields?: string[];
  notes?: string;
  
  // Compliance
  fingerprint_registered?: boolean;
  uniform_issued?: boolean;
  equipment_issued?: string[];
}

export default function GuardDetailsModal({
  open,
  onClose,
  guard,
  onPrint,
  onEdit,
  onAssign,
  scope = 'admin',
  onComplianceUpdate,
}: GuardDetailsModalProps) {
  const [activeTab, setActiveTab] = React.useState('overview');
  const [complianceLoading, setComplianceLoading] = React.useState<Record<string, boolean>>({});
  
  // Equipment checklist options
  const equipmentOptions = [
    'Boots',
    'Belt',
    'Cap/Hat',
    'Whistle',
    'Flashlight',
    'Radio',
    'Baton',
    'Pepper Spray',
    'Handcuffs',
    'Vest',
  ];
  
  const handleComplianceToggle = (field: 'fingerprint_registered' | 'uniform_issued', value: boolean) => {
    if (!guard || !onComplianceUpdate) return;
    const key = `${field}_${guard.id}`;
    setComplianceLoading(prev => ({ ...prev, [key]: true }));
    onComplianceUpdate(guard.id, { [field]: value });
    setTimeout(() => setComplianceLoading(prev => ({ ...prev, [key]: false })), 500);
  };
  
  const handleEquipmentToggle = (item: string, checked: boolean) => {
    if (!guard || !onComplianceUpdate) return;
    const currentEquipment = guard.equipment_issued || [];
    const newEquipment = checked
      ? [...currentEquipment, item]
      : currentEquipment.filter(e => e !== item);
    const key = `equipment_${guard.id}`;
    setComplianceLoading(prev => ({ ...prev, [key]: true }));
    onComplianceUpdate(guard.id, { equipment_issued: newEquipment });
    setTimeout(() => setComplianceLoading(prev => ({ ...prev, [key]: false })), 500);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
      case 'inactive': return 'bg-slate-100 text-slate-800 dark:bg-slate-900/40 dark:text-slate-300';
      case 'suspended': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300';
      case 'dismissed': return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
      case 'resigned': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300';
      case 'absconded': return 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getAttendanceStatusColor = (status?: string) => {
    switch (status) {
      case 'present': return 'text-green-600 dark:text-green-400';
      case 'absent': return 'text-red-600 dark:text-red-400';
      case 'late': return 'text-amber-600 dark:text-amber-400';
      case 'on_leave': return 'text-blue-600 dark:text-blue-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getInfractionSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
      case 'warning': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (!guard) {
    return (
      <Modal show={open} onClose={onClose} maxWidth="2xl">
        <div className="p-6 text-center text-gray-500 dark:text-gray-400">
          <IconMapper name="Loader2" size={32} className="animate-spin mx-auto mb-2" />
          Loading guard details...
        </div>
      </Modal>
    );
  }

  const InfoRow = ({ label, value, icon }: { label: string; value?: React.ReactNode; icon?: string }) => (
    <div className="flex items-start gap-3 py-2">
      {icon && <IconMapper name={icon} size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />}
      <div className="flex-1 min-w-0">
        <span className="text-xs text-gray-500 dark:text-gray-400 block">{label}</span>
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{value || '—'}</span>
      </div>
    </div>
  );

  return (
    <Modal show={open} onClose={onClose} maxWidth="2xl">
      <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-4">
            <div className="relative">
              {guard.photo_url ? (
                <img
                  src={guard.photo_url}
                  alt={guard.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-red-200 dark:border-red-800"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white font-bold text-xl">
                  {guard.name?.charAt(0) || '?'}
                </div>
              )}
              {guard.is_profile_complete === false && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                  <IconMapper name="AlertTriangle" size={12} className="text-white" />
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold">{guard.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-500 dark:text-gray-400">{guard.employee_id}</span>
                <Badge className={getStatusColor(guard.status)}>
                  {guard.status || 'Active'}
                </Badge>
                {guard.guard_type && (
                  <Badge variant="outline" className="text-xs">
                    {guard.guard_type}
                  </Badge>
                )}
              </div>
              {guard.position && (
                <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                  {guard.position}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onAssign && (
              <Button variant="outline" size="sm" onClick={onAssign}>
                <IconMapper name="MapPin" size={16} className="mr-1.5" />
                Assign Site
              </Button>
            )}
            {onEdit && (
              <Button variant="outline" size="sm" onClick={onEdit}>
                <IconMapper name="Pencil" size={16} className="mr-1.5" />
                Edit
              </Button>
            )}
            {onPrint && (
              <Button variant="outline" size="sm" onClick={onPrint}>
                <IconMapper name="Printer" size={16} className="mr-1.5" />
                Print
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="px-4 pt-2 bg-gray-50 dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 rounded-none justify-start">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="personal">Personal Info</TabsTrigger>
            <TabsTrigger value="employment">Employment</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="records">Records</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto p-4">
            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-0 space-y-4">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className="p-3 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2">
                    <IconMapper name="UserCheck" size={18} className="text-blue-600 dark:text-blue-400" />
                    <span className="text-xs text-blue-700 dark:text-blue-300">Attendance Rate</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                    {guard.attendance_tally?.rate_percent ?? 0}%
                  </p>
                </Card>
                <Card className="p-3 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2">
                    <IconMapper name="Clock" size={18} className="text-green-600 dark:text-green-400" />
                    <span className="text-xs text-green-700 dark:text-green-300">Hours This Month</span>
                  </div>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">
                    {guard.attendance_tally?.hours_worked?.toFixed(1) ?? 0}
                  </p>
                </Card>
                <Card className="p-3 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                  <div className="flex items-center gap-2">
                    <IconMapper name="AlertCircle" size={18} className="text-amber-600 dark:text-amber-400" />
                    <span className="text-xs text-amber-700 dark:text-amber-300">Infractions (3mo)</span>
                  </div>
                  <p className="text-2xl font-bold text-amber-900 dark:text-amber-100 mt-1">
                    {guard.recent_infractions?.length ?? 0}
                  </p>
                </Card>
                <Card className="p-3 bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-2">
                    <IconMapper name="Calendar" size={18} className="text-purple-600 dark:text-purple-400" />
                    <span className="text-xs text-purple-700 dark:text-purple-300">Days This Month</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100 mt-1">
                    {guard.attendance_tally?.total ?? 0}
                  </p>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Contact Info */}
                <Card className="p-4">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <IconMapper name="Phone" size={16} />
                    Contact Information
                  </h3>
                  <InfoRow label="Phone" value={guard.phone} icon="Phone" />
                  <InfoRow label="Email" value={guard.email} icon="Mail" />
                  <InfoRow label="Address" value={guard.address} icon="MapPin" />
                  <InfoRow 
                    label="Residence" 
                    value={[guard.residence_address, guard.residence_city, guard.residence_district].filter(Boolean).join(', ')} 
                    icon="Home" 
                  />
                </Card>

                {/* Assignment Info */}
                <Card className="p-4">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <IconMapper name="Briefcase" size={16} />
                    Current Assignment
                  </h3>
                  {guard.current_assignment?.site ? (
                    <>
                      <InfoRow 
                        label="Site" 
                        value={guard.current_assignment.site.name} 
                        icon="Building" 
                      />
                      <InfoRow 
                        label="Client" 
                        value={guard.current_assignment.site.client?.name} 
                        icon="Users" 
                      />
                      <InfoRow 
                        label="Assignment Type" 
                        value={guard.current_assignment.assignment_type} 
                        icon="FileText" 
                      />
                      <InfoRow 
                        label="Started" 
                        value={formatDate(guard.current_assignment.start_date)} 
                        icon="Calendar" 
                      />
                    </>
                  ) : (
                    <div className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2 py-2">
                      <IconMapper name="AlertCircle" size={16} />
                      Not assigned to any site
                    </div>
                  )}
                </Card>

                {/* Supervisor & Zone */}
                <Card className="p-4">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <IconMapper name="Users" size={16} />
                    Reporting Structure
                  </h3>
                  <InfoRow 
                    label="Supervisor" 
                    value={guard.supervisor?.name || 'Unassigned'} 
                    icon="UserCog" 
                  />
                  <InfoRow 
                    label="Zone" 
                    value={guard.zone?.name || 'Unassigned'} 
                    icon="Map" 
                  />
                  <InfoRow 
                    label="Grade" 
                    value={guard.grade ? `${guard.grade.code} - ${guard.grade.name}` : 'Ungraded'} 
                    icon="Award" 
                  />
                </Card>

                {/* Emergency Contact */}
                <Card className="p-4">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-red-600 dark:text-red-400">
                    <IconMapper name="AlertTriangle" size={16} />
                    Emergency Contacts
                  </h3>
                  <InfoRow 
                    label="Emergency Contact" 
                    value={`${guard.emergency_contact_name || '—'} ${guard.emergency_contact_phone ? `(${guard.emergency_contact_phone})` : ''}`}
                    icon="PhoneCall" 
                  />
                  <InfoRow 
                    label="Next of Kin" 
                    value={`${guard.next_of_kin_name || '—'} ${guard.next_of_kin_relationship ? `- ${guard.next_of_kin_relationship}` : ''}`}
                    icon="User" 
                  />
                  {guard.next_of_kin_phone && (
                    <InfoRow label="Next of Kin Phone" value={guard.next_of_kin_phone} icon="Phone" />
                  )}
                </Card>
              </div>

              {/* Profile Incomplete Warning */}
              {guard.is_profile_complete === false && guard.profile_missing_fields && guard.profile_missing_fields.length > 0 && (
                <Card className="p-4 border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800">
                  <div className="flex items-start gap-3">
                    <IconMapper name="AlertTriangle" size={20} className="text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Profile Incomplete</h4>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                        Missing fields: {guard.profile_missing_fields.join(', ').replace(/_/g, ' ')}
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Notes */}
              {guard.notes && (
                <Card className="p-4">
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <IconMapper name="FileText" size={16} />
                    Notes
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{guard.notes}</p>
                </Card>
              )}

              {/* Compliance Checklist */}
              <Card className="p-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <IconMapper name="ClipboardCheck" size={16} />
                  Compliance Checklist
                </h3>
                <div className="space-y-3">
                  {/* Fingerprint Registration */}
                  <label className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <IconMapper 
                        name={guard.fingerprint_registered ? "Fingerprint" : "Fingerprint"} 
                        size={18} 
                        className={guard.fingerprint_registered ? "text-green-600 dark:text-green-400" : "text-gray-400"} 
                      />
                      <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">Fingerprint Registered</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {complianceLoading[`fingerprint_registered_${guard.id}`] && (
                        <IconMapper name="Loader2" size={14} className="animate-spin text-gray-400" />
                      )}
                      <input
                        type="checkbox"
                        checked={guard.fingerprint_registered || false}
                        onChange={(e) => handleComplianceToggle('fingerprint_registered', e.target.checked)}
                        disabled={!onComplianceUpdate || complianceLoading[`fingerprint_registered_${guard.id}`]}
                        className="w-4 h-4 sm:w-5 sm:h-5 rounded border-gray-300 dark:border-gray-600 text-red-600 focus:ring-red-500 disabled:opacity-50 touch-target-min"
                      />
                    </div>
                  </label>

                  {/* Uniform Issued */}
                  <label className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <IconMapper 
                        name={guard.uniform_issued ? "Shirt" : "Shirt"} 
                        size={18} 
                        className={guard.uniform_issued ? "text-green-600 dark:text-green-400" : "text-gray-400"} 
                      />
                      <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">Uniform Issued</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {complianceLoading[`uniform_issued_${guard.id}`] && (
                        <IconMapper name="Loader2" size={14} className="animate-spin text-gray-400" />
                      )}
                      <input
                        type="checkbox"
                        checked={guard.uniform_issued || false}
                        onChange={(e) => handleComplianceToggle('uniform_issued', e.target.checked)}
                        disabled={!onComplianceUpdate || complianceLoading[`uniform_issued_${guard.id}`]}
                        className="w-4 h-4 sm:w-5 sm:h-5 rounded border-gray-300 dark:border-gray-600 text-red-600 focus:ring-red-500 disabled:opacity-50 touch-target-min"
                      />
                    </div>
                  </label>

                  {/* Equipment Issued */}
                  <div className="p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <IconMapper name="Briefcase" size={18} className="text-gray-400" />
                      <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">Equipment Issued</span>
                      {complianceLoading[`equipment_${guard.id}`] && (
                        <IconMapper name="Loader2" size={14} className="animate-spin text-gray-400" />
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-1 sm:gap-2">
                      {equipmentOptions.map((item) => {
                        const isChecked = (guard.equipment_issued || []).includes(item);
                        return (
                          <label 
                            key={item} 
                            className={`flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded cursor-pointer transition-colors text-xs sm:text-sm ${
                              isChecked 
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                                : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                            } ${!onComplianceUpdate ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => handleEquipmentToggle(item, e.target.checked)}
                              disabled={!onComplianceUpdate || complianceLoading[`equipment_${guard.id}`]}
                              className="w-3 h-3 sm:w-4 sm:h-4 rounded border-gray-300 dark:border-gray-500 text-red-600 focus:ring-red-500"
                            />
                            <span className="truncate">{item}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Personal Info Tab */}
            <TabsContent value="personal" className="mt-0 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <IconMapper name="User" size={16} />
                    Personal Details
                  </h3>
                  <InfoRow label="Date of Birth" value={formatDate(guard.date_of_birth)} icon="Calendar" />
                  <InfoRow label="Gender" value={guard.gender} icon="User" />
                  <InfoRow label="Marital Status" value={guard.marital_status} icon="Heart" />
                  <InfoRow label="ID Number" value={guard.id_number} icon="CreditCard" />
                </Card>

                <Card className="p-4">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <IconMapper name="Home" size={16} />
                    Home Address
                  </h3>
                  <InfoRow label="Village" value={guard.home_village} icon="MapPin" />
                  <InfoRow label="Traditional Authority" value={guard.home_ta} icon="Users" />
                  <InfoRow label="District" value={guard.home_district} icon="Map" />
                </Card>

                <Card className="p-4">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <IconMapper name="Heart" size={16} />
                    Family Information
                  </h3>
                  <InfoRow label="Spouse Name" value={guard.spouse_name} icon="User" />
                  <InfoRow label="Spouse Phone" value={guard.spouse_phone} icon="Phone" />
                  <InfoRow label="Dependents" value={guard.dependents_count} icon="Users" />
                </Card>

                <Card className="p-4">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <IconMapper name="PhoneCall" size={16} />
                    Emergency Contacts
                  </h3>
                  <InfoRow label="Emergency Contact Name" value={guard.emergency_contact_name} icon="User" />
                  <InfoRow label="Emergency Contact Phone" value={guard.emergency_contact_phone} icon="Phone" />
                  <InfoRow label="Next of Kin Name" value={guard.next_of_kin_name} icon="User" />
                  <InfoRow label="Relationship" value={guard.next_of_kin_relationship} icon="Link" />
                  <InfoRow label="Next of Kin Phone" value={guard.next_of_kin_phone} icon="Phone" />
                </Card>
              </div>
            </TabsContent>

            {/* Employment Tab */}
            <TabsContent value="employment" className="mt-0 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <IconMapper name="Briefcase" size={16} />
                    Employment Details
                  </h3>
                  <InfoRow label="Position" value={guard.position} icon="UserCog" />
                  <InfoRow label="Guard Type" value={guard.guard_type} icon="Shield" />
                  <InfoRow label="Hire Date" value={formatDate(guard.hire_date)} icon="Calendar" />
                  <InfoRow 
                    label="Grade" 
                    value={guard.grade ? `${guard.grade.code} - ${guard.grade.name}` : '—'} 
                    icon="Award" 
                  />
                  <InfoRow 
                    label="Education Level" 
                    value={guard.education_level} 
                    icon="GraduationCap" 
                  />
                </Card>

                <Card className="p-4">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <IconMapper name="Globe" size={16} />
                    Languages & Qualifications
                  </h3>
                  <div className="py-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400 block">Languages</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {guard.languages && guard.languages.length > 0 ? (
                        guard.languages.map((lang, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{lang}</Badge>
                        ))
                      ) : (
                        <span className="text-sm text-gray-500">—</span>
                      )}
                    </div>
                  </div>
                  <div className="py-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400 block">Qualifications</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {guard.qualifications && guard.qualifications.length > 0 ? (
                        guard.qualifications.map((q, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{q}</Badge>
                        ))
                      ) : (
                        <span className="text-sm text-gray-500">—</span>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Documents */}
                <Card className="p-4 md:col-span-2">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <IconMapper name="FileText" size={16} />
                    Documents
                  </h3>
                  {guard.documents && guard.documents.length > 0 ? (
                    <div className="space-y-2">
                      {guard.documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                          <div className="flex items-center gap-2">
                            <IconMapper name="File" size={16} className="text-gray-400" />
                            <span className="text-sm">{doc.name}</span>
                            <Badge variant="outline" className="text-xs">{doc.type}</Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            {doc.verified ? (
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 text-xs">
                                Verified
                              </Badge>
                            ) : (
                              <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 text-xs">
                                Pending
                              </Badge>
                            )}
                            <span className="text-xs text-gray-500">{formatDate(doc.date)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No documents on file</p>
                  )}
                </Card>
              </div>
            </TabsContent>

            {/* Attendance Tab */}
            <TabsContent value="attendance" className="mt-0 space-y-4">
              {/* Attendance Summary */}
              <Card className="p-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <IconMapper name="BarChart3" size={16} />
                  This Month&apos;s Attendance Summary
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {guard.attendance_tally?.by_status && Object.entries(guard.attendance_tally.by_status).map(([status, count]) => (
                    <div key={status} className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                      <p className={`text-2xl font-bold ${getAttendanceStatusColor(status)} capitalize`}>
                        {count}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">{status.replace('_', ' ')}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <span className="text-xs text-gray-500">Total Hours Worked</span>
                    <p className="text-lg font-semibold">{guard.attendance_tally?.hours_worked?.toFixed(1) ?? 0} hrs</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Overtime Hours</span>
                    <p className="text-lg font-semibold">{guard.attendance_tally?.overtime_hours?.toFixed(1) ?? 0} hrs</p>
                  </div>
                </div>
              </Card>

              {/* Recent Attendance */}
              <Card className="p-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <IconMapper name="CalendarDays" size={16} />
                  Recent Attendance (Last 7 Days)
                </h3>
                {guard.recent_attendance && guard.recent_attendance.length > 0 ? (
                  <div className="space-y-2">
                    {guard.recent_attendance.map((record, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium w-24">{formatDate(record.date)}</span>
                          <Badge className={getStatusColor(record.status)}>
                            {record.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          {record.check_in && <span>Check-in: {record.check_in}</span>}
                          {record.check_out && <span>Check-out: {record.check_out}</span>}
                          {record.hours && <span className="font-medium">{record.hours} hrs</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No recent attendance records</p>
                )}
              </Card>
            </TabsContent>

            {/* Records Tab */}
            <TabsContent value="records" className="mt-0 space-y-4">
              {/* Infractions */}
              <Card className="p-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-red-600 dark:text-red-400">
                  <IconMapper name="ShieldAlert" size={16} />
                  Recent Infractions (Last 3 Months)
                </h3>
                {guard.recent_infractions && guard.recent_infractions.length > 0 ? (
                  <div className="space-y-2">
                    {guard.recent_infractions.map((infraction) => (
                      <div key={infraction.id} className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-800 rounded">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm capitalize">{infraction.type}</span>
                              <Badge className={getInfractionSeverityColor(infraction.severity)}>
                                {infraction.severity}
                              </Badge>
                              <Badge className={getStatusColor(infraction.status)}>
                                {infraction.status}
                              </Badge>
                            </div>
                            {infraction.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{infraction.description}</p>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">{formatDate(infraction.date)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <IconMapper name="CheckCircle" size={16} />
                    <span className="text-sm">No infractions in the last 3 months</span>
                  </div>
                )}
              </Card>

              {/* Assignment History */}
              <Card className="p-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <IconMapper name="History" size={16} />
                  Assignment Information
                </h3>
                {guard.current_assignment ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-800 rounded">
                      <span className="text-xs text-green-700 dark:text-green-300 uppercase font-medium">Current Assignment</span>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm"><span className="font-medium">Site:</span> {guard.current_assignment.site?.name || '—'}</p>
                        <p className="text-sm"><span className="font-medium">Client:</span> {guard.current_assignment.site?.client?.name || '—'}</p>
                        <p className="text-sm"><span className="font-medium">Type:</span> {guard.current_assignment.assignment_type || '—'}</p>
                        <p className="text-sm"><span className="font-medium">Started:</span> {formatDate(guard.current_assignment.start_date)}</p>
                        {guard.current_assignment.end_date && (
                          <p className="text-sm"><span className="font-medium">Ends:</span> {formatDate(guard.current_assignment.end_date)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
                    <IconMapper name="AlertCircle" size={16} />
                    No active assignment
                  </div>
                )}
              </Card>
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer */}
        <div className="flex items-center justify-between gap-4 p-4 border-t border-gray-200 dark:border-gray-800">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            ID: {guard.id} • Employee ID: {guard.employee_id}
          </div>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
