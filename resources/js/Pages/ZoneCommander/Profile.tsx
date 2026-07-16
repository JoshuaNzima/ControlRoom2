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

interface Zone {
    id: number;
    name: string;
    supervisor_count: number;
    guard_count: number;
    status: string;
}

interface DownResolution {
    id: number;
    guard_name: string;
    site_name: string;
    resolved_at: string;
    incentive_preserved: boolean;
}

interface ProfilePageProps extends PageProps {
    user: UserData;
    zones: Zone[];
    recent_resolutions: DownResolution[];
    stats: {
        total_zones: number;
        active_supervisors: number;
        total_guards: number;
        downs_resolved_today: number;
        incentives_preserved: number;
    };
}

export default function ZoneCommanderProfile() {
    const { user, zones, recent_resolutions, stats } = usePage<ProfilePageProps>().props;

    // Transform zones data
    const zoneData = zones.map((item) => ({
        id: item.id,
        name: item.name,
        site_count: 0,
        guard_count: item.guard_count,
        status: item.status,
    }));

    // Transform resolutions data
    const resolutionData = recent_resolutions.map((item) => ({
        id: item.id,
        down_id: item.id,
        resolved_at: item.resolved_at,
        resolution_time: '',
        status: item.incentive_preserved ? 'preserved' : 'resolved',
    }));

    return (
        <>
            <Head title="Profile - Zone Commander" />
            <ProfilePage
                user={{
                    ...user,
                    avatar: user.avatar_url,
                }}
                stats={stats}
                zones={zoneData}
                resolutions={resolutionData}
                updateRoute="profile.update"
                passwordRoute="password.update"
                notificationOptions={[
                    { key: 'email', label: 'Email notifications', defaultChecked: true },
                    { key: 'downs', label: 'Down report alerts', defaultChecked: true },
                    { key: 'zones', label: 'Zone updates', defaultChecked: true },
                ]}
                tabs={['overview', 'zones', 'resolutions', 'settings']}
                pageTitle="Profile - Zone Commander"
                renderLayout={(children) => (
                    <AuthenticatedLayout header="Profile">{children}</AuthenticatedLayout>
                )}
            />
        </>
    );
}
