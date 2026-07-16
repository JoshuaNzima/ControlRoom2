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
    role: string;
    created_at: string;
}

interface SystemStats {
    total_users: number;
    active_modules: number;
    system_status: string;
    last_backup: string;
}

interface ProfilePageProps extends PageProps {
    user: UserData;
    stats: SystemStats;
}

export default function SuperAdminProfile() {
    const { user, stats } = usePage<ProfilePageProps>().props;

    return (
        <>
            <Head title="Profile - Super Admin" />
            <ProfilePage
                user={{
                    ...user,
                    avatar: user.avatar_url,
                }}
                stats={stats as unknown as Record<string, number | undefined | string>}
                updateRoute="profile.update"
                passwordRoute="password.update"
                notificationOptions={[
                    { key: 'email', label: 'Email notifications', defaultChecked: true },
                    { key: 'system', label: 'System alerts', defaultChecked: true },
                    { key: 'security', label: 'Security notifications', defaultChecked: true },
                ]}
                tabs={['overview', 'system', 'settings']}
                pageTitle="Profile - Super Admin"
                renderLayout={(children) => (
                    <AuthenticatedLayout header="Profile">{children}</AuthenticatedLayout>
                )}
            />
        </>
    );
}
