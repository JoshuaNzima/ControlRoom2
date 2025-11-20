export interface GuardFormData {
    employee_id: string;
    name: string;
    phone: string;
    email: string;
    address: string;
    id_number: string;
    date_of_birth: string;
    gender: string;
    emergency_contact_name: string;
    emergency_contact_phone: string;
    supervisor_id: string;
    hire_date: string;
    guard_type: 'permanent' | 'standby' | 'reliever';
    notes: string;
    status: 'active' | 'inactive' | 'suspended';
    client_id?: string;
}