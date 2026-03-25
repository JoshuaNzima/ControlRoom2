import AppLayout from '@/Layouts/AppLayout';
import { Head, usePage } from '@inertiajs/react';
import RequisitionSummary from '@/Components/Requisitions/RequisitionSummary';
import WeeklyTasks from '@/Components/WeeklyTasks';

export default function Dashboard() {
    const { weeklyTasks, isExecutiveAssistant } = usePage().props as any;

    return (
        <AppLayout title="Dashboard">
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
        </AppLayout>
    );
}
