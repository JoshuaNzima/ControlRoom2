import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import NavLink from '@/Components/NavLink';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import { Link, usePage } from '@inertiajs/react';
import { PageProps, User } from '@/types';
import { PropsWithChildren, ReactNode, useState } from 'react';
import NotificationBell from '@/Components/Common/NotificationBell';
import QuickRequisitionButton from '@/Components/Requisitions/QuickRequisitionButton';
import QuickBudgetButton from '@/Components/Budgets/QuickBudgetButton';
import { useRealtimeNotifications } from '@/Hooks/useRealtimeNotifications';
import AIAssistant from '@/Components/AI/AIAssistant';

export default function Authenticated({
    user,
    header,
    children,
}: PropsWithChildren<{ user?: User; header?: ReactNode }>) {
    const pageUser = user || usePage<PageProps>().props.auth.user;

    const roles = (((pageUser as any)?.roles ?? []) as any[]).map(String);
    const isAdminUser = roles.includes('admin') || roles.includes('super_admin');
    const isClientUser = roles.includes('client');

    // Initialize real-time notifications for messages and QR scans
    useRealtimeNotifications({
        userId: pageUser?.id,
        userRoles: roles,
    });

    const profileHref = (() => {
        try {
            const p = window.location.pathname;
            if (p.startsWith('/superadmin')) return route('superadmin.profile');
            if (p.startsWith('/admin/front-desk'))
                return route('admin.front-desk.profile');
            if (p.startsWith('/admin/marketing')) return route('admin.marketing.profile');
            if (p.startsWith('/admin/business-dev'))
                return route('admin.business-dev.profile');
            if (p.startsWith('/admin')) return route('admin.profile');
            if (p.startsWith('/control-room')) return route('control-room.profile');
            if (p.startsWith('/operations')) return route('operations.profile');
            if (p.startsWith('/finance')) return route('finance.profile') as unknown as string;
            if (p.startsWith('/hr')) return route('hr.profile');
            if (p.startsWith('/assets')) return route('assets.profile');
            if (p.startsWith('/training')) return route('training.profile');
            if (p.startsWith('/front-office')) return route('front-office.profile');
            if (p.startsWith('/zone')) return route('zone.profile');
            if (p.startsWith('/supervisor')) return route('supervisor.profile');
            return route('profile.dashboard');
        } catch {
            return '/me';
        }
    })();

    const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);

    return (
        <div className="min-h-screen bg-red-50 dark:bg-gray-900">
            <nav className="sticky top-0 z-30 bg-white border-b border-red-100 dark:bg-gray-800 dark:border-gray-800">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 justify-between">
                        <div className="flex">
                            <div className="flex shrink-0 items-center">
                                <Link href="/">
                                    <ApplicationLogo className="block h-9 w-auto fill-current text-gray-800 dark:text-gray-100" />
                                </Link>
                            </div>

                            <div className="hidden space-x-8 sm:-my-px sm:ms-10 sm:flex">
                                <NavLink
                                    href={route('dashboard')}
                                    active={window.location.pathname === route('dashboard')}
                                >
                                    Dashboard
                                </NavLink>
                                <NavLink
                                    href={route('messages.conversations.index')}
                                    active={window.location.pathname.startsWith(
                                        route('messages.conversations.index')
                                    )}
                                >
                                    Messaging
                                </NavLink>
                                {!isAdminUser && (
                                    <NavLink
                                        href={route('requisitions.index')}
                                        active={window.location.pathname.startsWith(
                                            route('requisitions.index')
                                        )}
                                    >
                                        Requisitions
                                    </NavLink>
                                )}
                                {!isClientUser && (
                                    <NavLink
                                        href={route('documents.index')}
                                        active={
                                            window.location.pathname === '/documents' ||
                                            window.location.pathname.startsWith('/documents/')
                                        }
                                    >
                                        Documents
                                    </NavLink>
                                )}
                                <NavLink
                                    href={route('guards.index')}
                                    active={window.location.pathname.startsWith(route('guards.index'))}
                                >
                                    Guards
                                </NavLink>
                            </div>
                        </div>

                        <div className="hidden sm:ms-6 sm:flex sm:items-center gap-4">
                            <NotificationBell />
                            <Link
                                href={route('emergency-contacts.index')}
                                className="p-2 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors shadow-lg shadow-red-900/30"
                                title="Emergency Contacts"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                                    />
                                </svg>
                            </Link>
                            <QuickBudgetButton />
                            <QuickRequisitionButton />
                            <div className="relative ms-3">
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <span className="inline-flex rounded-md">
                                            <button
                                                type="button"
                                                className="inline-flex items-center rounded-md border border-transparent bg-white px-3 py-2 text-sm font-medium leading-4 text-gray-500 transition duration-150 ease-in-out hover:text-gray-700 focus:outline-none dark:bg-gray-800 dark:text-gray-200 dark:hover:text-gray-100"
                                            >
                                                {pageUser.name}

                                                <svg
                                                    className="-me-0.5 ms-2 h-4 w-4"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </button>
                                        </span>
                                    </Dropdown.Trigger>

                                    <Dropdown.Content>
                                        <Dropdown.Link href={profileHref}>My Profile</Dropdown.Link>
                                        <Dropdown.Link
                                            href={route('logout')}
                                            method="post"
                                            as="button"
                                        >
                                            Log Out
                                        </Dropdown.Link>
                                    </Dropdown.Content>
                                </Dropdown>
                            </div>
                        </div>

                        <div className="-me-2 flex items-center gap-2 sm:hidden">
                            <NotificationBell />
                            <Link
                                href={route('emergency-contacts.index')}
                                className="p-2 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors"
                                title="Emergency Contacts"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                                    />
                                </svg>
                            </Link>
                            <button
                                onClick={() =>
                                    setShowingNavigationDropdown(
                                        (previousState) => !previousState
                                    )
                                }
                                className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 transition duration-150 ease-in-out hover:bg-gray-100 hover:text-gray-500 focus:bg-gray-100 focus:text-gray-500 focus:outline-none dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100 dark:focus:bg-gray-700 dark:focus:text-gray-100"
                            >
                                <svg
                                    className="h-6 w-6"
                                    stroke="currentColor"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        className={
                                            !showingNavigationDropdown ? 'inline-flex' : 'hidden'
                                        }
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                    <path
                                        className={
                                            showingNavigationDropdown ? 'inline-flex' : 'hidden'
                                        }
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div
                    className={
                        (showingNavigationDropdown ? 'block' : 'hidden') + ' sm:hidden'
                    }
                >
                    <div className="space-y-1 pb-3 pt-2">
                        <ResponsiveNavLink
                            href={route('dashboard')}
                            active={window.location.pathname === route('dashboard')}
                        >
                            Dashboard
                        </ResponsiveNavLink>
                        <ResponsiveNavLink
                            href={route('messages.conversations.index')}
                            active={window.location.pathname.startsWith(
                                route('messages.conversations.index')
                            )}
                        >
                            Messaging
                        </ResponsiveNavLink>
                        {!isAdminUser && (
                            <ResponsiveNavLink
                                href={route('requisitions.index')}
                                active={window.location.pathname.startsWith(
                                    route('requisitions.index')
                                )}
                            >
                                Requisitions
                            </ResponsiveNavLink>
                        )}
                        {!isClientUser && (
                            <ResponsiveNavLink
                                href={route('documents.index')}
                                active={
                                    window.location.pathname === '/documents' ||
                                    window.location.pathname.startsWith('/documents/')
                                }
                            >
                                Documents
                            </ResponsiveNavLink>
                        )}
                        <ResponsiveNavLink
                            href={route('guards.index')}
                            active={window.location.pathname.startsWith(route('guards.index'))}
                        >
                            Guards
                        </ResponsiveNavLink>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-800 pb-1 pt-4">
                        <div className="px-4">
                            <div className="text-base font-medium text-gray-800 dark:text-gray-100">
                                {pageUser.name}
                            </div>
                            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                {pageUser.email}
                            </div>
                        </div>

                        <div className="mt-3 space-y-1">
                            <ResponsiveNavLink href={profileHref}>
                                My Profile
                            </ResponsiveNavLink>
                            <ResponsiveNavLink
                                method="post"
                                href={route('logout')}
                                as="button"
                            >
                                Log Out
                            </ResponsiveNavLink>
                        </div>
                    </div>
                </div>
            </nav>

            {header && (
                <header className="bg-white border-b border-red-100 dark:bg-gray-800 dark:border-gray-800">
                    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                        {header}
                    </div>
                </header>
            )}

            <main>
                <main>
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 text-gray-900 dark:text-gray-100">
                        <div className="animate-slideUp transition-all-smooth">
                            {children}
                        </div>
                    </div>
                </main>
            </main>
            <AIAssistant context="dashboard" />
        </div>
    );
}
