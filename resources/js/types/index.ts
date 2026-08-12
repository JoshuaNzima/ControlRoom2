export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string;
    phone?: string | null;
    employee_id?: string | null;
    roles?: string[];
    permissions?: string[];
    avatar_url?: string | null;
}

export interface Location {
    lat: number;
    lng: number;
}

export interface Flag {
    id: number;
    title: string;
    description: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    category: string;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    created_at: string;
    updated_at: string;
    reporter_name: string;
    location?: Location;
    repeat_occurrence: number;
    last_occurred_at?: string;
    incident_date: string;
    evidence_urls?: string[];
    witnesses?: string[];
    resolution_notes?: string;
    assigned_to?: number;
    site?: {
        id: number;
        name: string;
    };
}

export type { AuthenticatedLayoutProps } from './layout-types';

export interface Guard {
    id: number;
    name: string;
    status: 'active' | 'inactive' | 'on_break' | 'off_duty';
    location: Location;
    lastCheckIn: string;
    currentSite?: string;
    currentShift?: {
        started_at: string;
        ends_at: string;
    };
    lastActivity: string;
}

export interface Event {
    type: string;
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    title: string;
    description: string;
    location?: Location;
    site?: string;
    timestamp: string;
    guard?: {
        id: number;
        name: string;
        status: string;
    };
}

export interface Site {
    id: number;
    name: string;
    status: 'active' | 'inactive';
    location: Location;
    guards: number;
    alerts: number;
    lastUpdate: string;
}

export type PageProps<T extends Record<string, unknown> = Record<string, unknown>> = T & {
    auth: {
        user: User;
    };
};