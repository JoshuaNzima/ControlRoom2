import { useState } from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Inertia } from '@inertiajs/inertia';
import { format } from 'date-fns';
import { CalendarIcon, PlusIcon } from '@heroicons/react/24/outline';
import Badge from '@/Components/Badge';
import Pagination from '@/Components/Pagination';
import DatePicker from '@/Components/DatePicker';

export default function Index({ auth, shifts, filters }) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedDate, setSelectedDate] = useState(filters.date || '');

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        Inertia.get(route('shifts.index'), { 
            search: e.target.value,
            date: selectedDate,
        }, { preserveState: true });
    };

    const handleDateChange = (date) => {
        setSelectedDate(date);
        Inertia.get(route('shifts.index'), { 
            search: searchTerm,
            date: date,
        }, { preserveState: true });
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Shifts" />

            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold text-gray-900">Shifts</h1>
                        <a
                            href={route('shifts.create')}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                            <PlusIcon className="h-5 w-5 mr-2" />
                            New Shift
                        </a>
                    </div>

                    <div className="bg-white shadow rounded-lg">
                        <div className="p-4 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
                            <div className="sm:flex-1 flex items-center gap-4">
                                <div className="max-w-xs flex-1">
                                    <label htmlFor="search" className="sr-only">Search</label>
                                    <input
                                        type="search"
                                        name="search"
                                        id="search"
                                        value={searchTerm}
                                        onChange={handleSearch}
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        placeholder="Search shifts..."
                                    />
                                </div>
                                <div className="w-72">
                                    <DatePicker
                                        selected={selectedDate}
                                        onChange={handleDateChange}
                                        placeholderText="Filter by date"
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guard</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {shifts.data.map((shift) => (
                                        <tr key={shift.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {shift.guard_relation.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {shift.client_site.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {format(new Date(shift.date), 'MMM dd, yyyy')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {format(new Date(shift.start_time), 'HH:mm')} - {format(new Date(shift.end_time), 'HH:mm')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                                                {shift.shift_type}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge color={shift.status_color}>{shift.status}</Badge>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <a
                                                    href={route('shifts.edit', shift.id)}
                                                    className="text-indigo-600 hover:text-indigo-900 mr-3"
                                                >
                                                    Edit
                                                </a>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="px-4 py-3 border-t border-gray-200">
                            <Pagination links={shifts.links} />
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}