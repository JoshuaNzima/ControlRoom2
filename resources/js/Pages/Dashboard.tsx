import AppLayout from '@/Layouts/AppLayout';
import { Head } from '@inertiajs/react';
import QuickRequisitionModal from '@/Components/Requisitions/QuickRequisitionModal';
import RequisitionSummary from '@/Components/Requisitions/RequisitionSummary';

export default function Dashboard() {
    return (
        <AppLayout title="Dashboard">
            <Head title="Dashboard" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-4">
                    <QuickRequisitionModal />
                    <RequisitionSummary />
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg dark:bg-gray-900 dark:border dark:border-gray-800">
                        <div className="p-6 text-gray-900 dark:text-gray-100">
                            You're logged in!
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
