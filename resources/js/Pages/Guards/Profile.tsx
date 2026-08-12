import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import ProfilePage from '@/Components/Profile/ProfilePage';
import BaseShell from '@/Layouts/BaseShell';
import { PageProps } from '@/types';

interface UserData {
    id: number;
    name: string;
    email: string;
    phone?: string;
    avatar_url?: string;
    role: string;
    employee_id: string;
    created_at: string;
}

interface Assignment {
    id: number;
    site_name: string;
    client_name: string;
    shift: string;
    status: string;
    start_date: string;
}

interface AttendanceRecord {
    id: number;
    date: string;
    status: 'present' | 'absent' | 'late' | 'on_leave';
    check_in?: string;
    check_out?: string;
}

interface ProfilePageProps extends PageProps {
    user: UserData;
    current_assignment: Assignment | null;
    attendance: AttendanceRecord[];
    stats: {
        days_worked_this_month: number;
        total_shifts: number;
        on_time_percentage: number;
    };
}

export default function GuardProfile() {
    const { user, current_assignment, attendance, stats } = usePage<ProfilePageProps>().props;

    // Transform attendance data
    const attendanceData = attendance.map((item) => ({
        id: item.id,
        date: item.date,
        check_in: item.check_in ?? '',
        check_out: item.check_out ?? null,
        site_name: '',
        status: item.status,
        hours_worked: undefined,
    }));

    // Transform assignment data
    const assignmentData = current_assignment
        ? [
              {
                  id: current_assignment.id,
                  site_name: current_assignment.site_name,
                  site_address: current_assignment.client_name,
                  shift: current_assignment.shift,
                  status: current_assignment.status,
                  start_date: current_assignment.start_date,
              },
          ]
        : [];

    return (
        <>
            <Head title="Profile - Guard" />
            <ProfilePage
                user={{
                    ...user,
                    avatar: user.avatar_url,
                }}
                stats={stats}
                assignments={assignmentData}
                attendance={attendanceData}
                updateRoute="profile.update"
                passwordRoute="password.update"
                notificationOptions={[
                    { key: 'email', label: 'Email notifications', defaultChecked: true },
                    { key: 'shifts', label: 'Shift reminders', defaultChecked: true },
                    { key: 'attendance', label: 'Attendance updates', defaultChecked: true },
                ]}
                tabs={['overview', 'assignments', 'attendance', 'settings']}
                pageTitle="Profile - Guard"
                renderLayout={(children) => <BaseShell>{children}</BaseShell>}
            />
        </>
    );
}
