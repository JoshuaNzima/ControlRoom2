import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import ProfilePage from '@/Components/Profile/ProfilePage';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { PageProps } from '@/types';

interface UserData {
    id: number;
    name: string;
    email: string;
    phone?: string;
    avatar_url?: string;
    role: string | { id: number; name: string; guard_name?: string };
    created_at: string;
}

interface Commission {
    id: number;
    source: string;
    amount: number;
    status: 'pending' | 'claimed' | 'rejected';
    created_at: string;
    client_name?: string;
}

interface Incentive {
    id: number;
    month: string;
    base_amount: number;
    penalties: number;
    final_amount: number;
    status: 'pending' | 'approved' | 'paid';
}

interface ProfilePageProps extends PageProps {
    user: UserData;
    commissions: { pending: Commission[]; recent: Commission[]; total_claimed: number };
    incentives: { current: Incentive | null; history: Incentive[]; ytd_total: number };
    stats: { total_commissions: number; total_incentives: number; active_clients: number };
}

export default function AdminProfile() {
    const { user, commissions, incentives, stats } = usePage<ProfilePageProps>().props;

    // Transform incentives data
    const incentiveData = incentives.history.map((item) => ({
        id: item.id,
        amount: item.final_amount,
        reason: item.month,
        date: item.month,
        status: item.status,
    }));

    return (
        <>
            <Head title="Profile - Admin" />
            <ProfilePage
                user={{
                    ...user,
                    avatar: typeof user.avatar_url === 'string' ? user.avatar_url : undefined,
                    role: typeof user.role === 'string' ? user.role : user.role.name,
                }}
                stats={stats}
                incentives={incentiveData}
                updateRoute="profile.update"
                passwordRoute="password.update"
                notificationOptions={[
                    { key: 'email', label: 'Email notifications', defaultChecked: true },
                    { key: 'commissions', label: 'Commission updates', defaultChecked: true },
                    { key: 'incentives', label: 'Incentive notifications', defaultChecked: true },
                ]}
                tabs={['overview', 'earnings', 'settings']}
                pageTitle="Profile - Admin"
                renderLayout={(children) => (
                    <AuthenticatedLayout header="Profile">{children}</AuthenticatedLayout>
                )}
            />
        </>
    );
}
