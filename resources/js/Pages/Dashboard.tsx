import { Head, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import AppShellLayout from '@/Layouts/AppShellLayout';
import { getNavConfig, getProfileRoute, getRoleDisplay, getAIContext, LayoutContext } from '@/config/navigation';
import useCounters from '@/Hooks/useCounters';
import RequisitionSummary from '@/Components/Requisitions/RequisitionSummary';
import WeeklyTasks from '@/Components/WeeklyTasks';

export default function Dashboard() {
    const page = usePage<any>();
    const { counters } = useCounters();
    const { weeklyTasks, isExecutiveAssistant } = page.props;
    const user = page?.props?.auth?.user;

    const rawRoles: any[] = (user as any)?.roles ?? page?.props?.auth?.user?.roles ?? [];
    const roles: string[] = rawRoles.map((r: any) => (typeof r === 'string' ? r : r.name));

    const ctx: LayoutContext = {
        roles,
        isSuperAdmin: roles.includes('super_admin'),
        isAdminUser: roles.includes('admin') || roles.includes('super_admin'),
        isClientUser: roles.includes('client'),
        isOpsManager: roles.includes('operations_manager'),
        counters,
    };

    const content = (
        <>
            <Head title="Dashboard" />
            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="lg:col-span-2 space-y-4">
                            <RequisitionSummary />
                            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg dark:bg-gray-900 dark:border dark:border-gray-800">
                                <div className="p-6 text-gray-900 dark:text-gray-100">
                                    You're logged in!
                                </div>
                            </div>
                        </div>
                        <div className="lg:col-span-1">
                            <WeeklyTasks
                                tasks={weeklyTasks || []}
                                showModule={true}
                                isExecutiveAssistant={isExecutiveAssistant}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );

    if (roles.includes('super_admin')) return <AuthenticatedLayout header="Dashboard" user={user}>{content}</AuthenticatedLayout>;
    if (roles.includes('admin')) return <AuthenticatedLayout header="Dashboard" user={user}>{content}</AuthenticatedLayout>;
    if (roles.includes('control_room_operator') || roles.includes('operations_officer')) {
        if (!roles.includes('operations_manager')) return <AuthenticatedLayout header="Dashboard" user={user}>{content}</AuthenticatedLayout>;
    }
    if (roles.includes('finance_officer') || roles.includes('accountant') || roles.includes('finance') || roles.includes('accounting')) return <AuthenticatedLayout header="Dashboard" user={user}>{content}</AuthenticatedLayout>;
    if (roles.includes('hr') || roles.includes('human_resources') || roles.includes('hr_manager')) return <AuthenticatedLayout header="Dashboard" user={user}>{content}</AuthenticatedLayout>;
    if (roles.includes('operations_manager')) return <AuthenticatedLayout header="Dashboard" user={user}>{content}</AuthenticatedLayout>;
    if (roles.includes('asset_manager') || roles.includes('assets_manager')) return <AuthenticatedLayout header="Dashboard" user={user}>{content}</AuthenticatedLayout>;
    if (roles.includes('supervisor') || roles.includes('sergeant')) return <AuthenticatedLayout header="Dashboard">{content}</AuthenticatedLayout>;
    if (roles.includes('zone_commander')) return <AuthenticatedLayout header="Dashboard">{content}</AuthenticatedLayout>;
    if (roles.includes('training')) return <AuthenticatedLayout header="Dashboard" user={user}>{content}</AuthenticatedLayout>;
    if (roles.includes('front_desk') || roles.includes('assistant')) return <AuthenticatedLayout header="Dashboard" user={user}>{content}</AuthenticatedLayout>;
    if (roles.includes('marketing')) return <AuthenticatedLayout header="Dashboard" user={user}>{content}</AuthenticatedLayout>;
    if (roles.includes('business_dev') || roles.includes('business_development')) return <AuthenticatedLayout header="Dashboard" user={user}>{content}</AuthenticatedLayout>;
    if (roles.includes('front_office') || roles.includes('executive_assistant') || roles.includes('receptionist')) return <AuthenticatedLayout header="Dashboard">{content}</AuthenticatedLayout>;
    if (roles.includes('client')) {
        return (
            <AppShellLayout title="Dashboard" user={user} sidebarTitle="Client Portal" sidebarIcon="Building2"
                navSections={getNavConfig(ctx)} profileRoute={getProfileRoute(roles)} roleDisplay={getRoleDisplay(roles)} aiContext={getAIContext(roles)}
                showBudget={false} showRequisition={false} showTasks={false} showScanner={false}>
                {content}
            </AppShellLayout>
        );
    }

    return (
        <AppShellLayout title="Dashboard" user={user} sidebarTitle="Dashboard" sidebarIcon="LayoutDashboard"
            navSections={getNavConfig(ctx)} profileRoute={getProfileRoute(roles)} roleDisplay={getRoleDisplay(roles)} aiContext={getAIContext(roles)}>
            {content}
        </AppShellLayout>
    );
}
