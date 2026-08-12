import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { format } from 'date-fns';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Badge } from '@/Components/ui/badge';
import Pagination from '@/Components/Pagination';
import DatePicker from '@/Components/DatePicker';
import ShiftFormModal from '@/Components/Shifts/ShiftFormModal';

export default function ShiftsIndex({ auth, shifts, filters, guards = [], sites = [] }: any) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedDate, setSelectedDate] = useState<Date | null>(filters.date ? new Date(filters.date) : null);
    const [openCreate, setOpenCreate] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const [currentShift, setCurrentShift] = useState<any | null>(null);

    const dateParam = selectedDate ? selectedDate.toISOString().slice(0, 10) : '';

    const handleSearch = (e: any) => {
        setSearchTerm(e.target.value);
        router.get(route('shifts.index'), { 
            search: e.target.value,
            date: dateParam,
        }, { preserveState: true });
    };

    const handleDateChange = (date: any) => {
        setSelectedDate(date || null);
        router.get(route('shifts.index'), { 
            search: searchTerm,
            date: date ? date.toISOString().slice(0, 10) : '',
        }, { preserveState: true });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Shifts" />

            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Shifts</h1>
                        <button
                            type="button"
                            onClick={() => setOpenCreate(true)}
                            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-coin-700 hover:bg-coin-600 focus:outline-none focus:ring-2 focus:ring-coin-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950"
                        >
                            <PlusIcon className="h-5 w-5 mr-2" />
                            New Shift
                        </button>
                    </div>

                    <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 shadow-sm shadow-black/5 dark:shadow-none rounded-lg">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                                <div className="w-full sm:max-w-xs sm:flex-1">
                                    <label htmlFor="search" className="sr-only">Search</label>
                                    <input
                                        type="search"
                                        name="search"
                                        id="search"
                                        value={searchTerm}
                                        onChange={handleSearch}
                                        className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm focus:border-coin-500 focus:ring-1 focus:ring-coin-500 sm:text-sm"
                                        placeholder="Search shifts..."
                                    />
                                </div>
                                <div className="w-full sm:w-72">
                                    <DatePicker
                                        selected={selectedDate}
                                        onChange={handleDateChange}
                                        placeholder="Filter by date"
                                        className="w-full sm:text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-[900px] w-full divide-y divide-gray-200 dark:divide-gray-800">
                                <thead className="bg-gray-50 dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
                                    <tr>
                                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Guard</th>
                                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Site</th>
                                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Date</th>
                                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Time</th>
                                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Type</th>
                                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                                    {shifts.data.map((shift: any) => (
                                        <tr key={shift.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                                            <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                {shift.guard_relation.name}
                                            </td>
                                            <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                {shift.client_site.name}
                                            </td>
                                            <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                {format(new Date(shift.date), 'MMM dd, yyyy')}
                                            </td>
                                            <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                {format(new Date(shift.start_time), 'HH:mm')} - {format(new Date(shift.end_time), 'HH:mm')}
                                            </td>
                                            <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 capitalize">
                                                {shift.shift_type}
                                            </td>
                                            <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
                                                <Badge className={shift.status_color}>{shift.status}</Badge>
                                            </td>
                                            <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-sm">
                                                <button
                                                    type="button"
                                                    onClick={() => { setCurrentShift(shift); setOpenEdit(true); }}
                                                    className="text-coin-700 hover:text-coin-600 mr-3"
                                                >
                                                    Edit
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800">
                            {shifts && shifts.links && (
                                <Pagination
                                    currentPage={shifts.current_page}
                                    totalPages={shifts.last_page}
                                    onPageChange={(page) => router.get(route('shifts.index'), { page, search: searchTerm, date: dateParam }, { preserveState: true })}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <ShiftFormModal
                open={openCreate}
                mode="create"
                onClose={() => setOpenCreate(false)}
                onSuccess={() => router.reload()}
                guards={guards}
                sites={sites}
            />
            <ShiftFormModal
                open={openEdit}
                mode="edit"
                onClose={() => { setOpenEdit(false); setCurrentShift(null); }}
                onSuccess={() => router.reload()}
                guards={guards}
                sites={sites}
                initial={currentShift}
            />
        </AuthenticatedLayout>
    );
}
