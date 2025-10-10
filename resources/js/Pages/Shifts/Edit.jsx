import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ShiftForm from '@/Components/ShiftForm';

export default function Edit({ auth, shift, guards, sites }) {
    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Edit Shift" />

            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-900">Edit Shift</h1>
                    </div>

                    <div className="bg-white shadow rounded-lg">
                        <div className="p-6">
                            <ShiftForm 
                                shift={shift} 
                                guards={guards} 
                                sites={sites} 
                            />
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}