import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import ProfilePage from '@/Components/Profile/ProfilePage';
import SupervisorLayout from '@/Layouts/SupervisorLayout';
import { PageProps } from '@/types';

interface UserData {
    id: number;
    name: string;
    email: string;
    phone?: string;
    avatar_url?: string;
    role: string;
    created_at: string;
}

interface Incentive {
    id: number;
    month: string;
    base_amount: number;
    penalties: number;
    final_amount: number;
    status: 'pending' | 'approved' | 'paid';
    unresolved_downs: number;
}

interface Assignment {
    id: number;
    site_name: string;
    client_name: string;
    shift: string;
    status: string;
}

interface GuardStats {
    total_guards: number;
    active_guards: number;
    on_duty: number;
    issues_today: number;
}

interface ProfilePageProps extends PageProps {
    user: UserData;
    incentives: { current: Incentive | null; history: Incentive[]; ytd_total: number };
    assignments: Assignment[];
    stats: GuardStats;
    isSergeant: boolean;
}

export default function SupervisorProfile() {
    const { user, incentives, assignments, stats, isSergeant } = usePage<ProfilePageProps>().props;

    // Transform incentives data
    const incentiveData = incentives.history.map((item) => ({
        id: item.id,
        amount: item.final_amount,
        reason: `${item.month} (${item.unresolved_downs} unresolved)`,
        date: item.month,
        status: item.status,
    }));

    // Transform assignments data
    const assignmentData = assignments.map((item) => ({
        id: item.id,
        site_name: item.site_name,
        site_address: item.client_name,
        shift: item.shift,
        status: item.status,
        start_date: '',
    }));

    return (
        <>
            <Head title={`Profile - ${isSergeant ? 'Sergeant' : 'Supervisor'}`} />
            <ProfilePage
                user={{
                    ...user,
                    avatar: user.avatar_url,
                }}
                stats={stats as unknown as Record<string, number | undefined | string>}
                incentives={incentiveData}
                assignments={assignmentData}
                isSergeant={isSergeant}
                updateRoute="profile.update"
                passwordRoute="password.update"
                notificationOptions={[
                    { key: 'email', label: 'Email notifications', defaultChecked: true },
                    { key: 'downs', label: 'Down report alerts', defaultChecked: true },
                    { key: 'incentives', label: 'Incentive notifications', defaultChecked: true },
                ]}
                tabs={['overview', 'incentives', 'assignments', 'settings']}
                pageTitle={`Profile - ${isSergeant ? 'Sergeant' : 'Supervisor'}`}
                renderLayout={(children) => (
                    <SupervisorLayout title="Profile">{children}</SupervisorLayout>
                )}
            />
        </>
    );
}
