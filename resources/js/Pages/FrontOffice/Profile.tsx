import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import ProfilePage from '@/Components/Profile/ProfilePage';
import FrontOfficeLayout from '@/Layouts/FrontOfficeLayout';
import { PageProps } from '@/types';

interface UserData {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    department: string | null;
    role: string | { id: number; name: string };
    avatar?: string | null;
    created_at: string;
}

interface ProfileProps extends PageProps {
    user: UserData;
    roleLabel: string;
}

export default function FrontOfficeProfile() {
    const { user, roleLabel } = usePage<ProfileProps>().props;

    return (
        <>
            <Head title={`Profile - ${roleLabel}`} />
            <ProfilePage
                user={{
                    ...user,
                    phone: user.phone ?? undefined,
                    avatar: user.avatar ?? undefined,
                    role: typeof user.role === 'string' ? user.role : user.role.name,
                }}
                roleLabel={roleLabel}
                updateRoute="front-office.profile.update"
                passwordRoute="password.update"
                notificationOptions={[
                    { key: 'email', label: 'Email notifications', defaultChecked: true },
                    { key: 'visitors', label: 'Visitor alerts', defaultChecked: true },
                    { key: 'appointments', label: 'Appointment reminders', defaultChecked: true },
                ]}
                tabs={['overview', 'settings']}
                pageTitle={`Profile - ${roleLabel}`}
                renderLayout={(children) => (
                    <FrontOfficeLayout title="Profile">{children}</FrontOfficeLayout>
                )}
            />
        </>
    );
}
