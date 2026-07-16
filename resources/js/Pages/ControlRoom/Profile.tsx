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

interface ActivityLog {
    id: number;
    action: string;
    description: string;
    created_at: string;
    type: 'guard_assignment' | 'down_report' | 'client_update' | 'scan';
}

interface ProfilePageProps extends PageProps {
    user: UserData;
    recent_activity: ActivityLog[];
    stats: {
        shifts_today: number;
        guards_assigned: number;
        downs_reported: number;
        scans_processed: number;
    };
}

export default function ControlRoomProfile() {
    const { user, recent_activity, stats } = usePage<ProfilePageProps>().props;

    // Transform activity data to match ProfilePage format
    const activity = recent_activity.map((item) => ({
        id: item.id,
        action: item.action,
        description: item.description,
        timestamp: item.created_at,
    }));

    return (
        <>
            <Head title="Profile - Control Room" />
            <ProfilePage
                user={{
                    ...user,
                    avatar: user.avatar_url,
                }}
                stats={stats}
                activity={activity}
                updateRoute="control-room.profile.update"
                passwordRoute="password.update"
                notificationOptions={[
                    { key: 'email', label: 'Email notifications', defaultChecked: true },
                    { key: 'downs', label: 'Down report alerts', defaultChecked: true },
                    { key: 'scans', label: 'Scan notifications', defaultChecked: false },
                ]}
                tabs={['overview', 'settings']}
                pageTitle="Profile - Control Room"
                renderLayout={(children) => (
                    <AuthenticatedLayout header="Profile">{children}</AuthenticatedLayout>
                )}
            />
        </>
    );
}
