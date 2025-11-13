import React from 'react';
import { Head } from '@inertiajs/react';
import FlagList from '@/Components/Flags/FlagList';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import type { Flag } from '@/types/index';
import { useForm } from '@inertiajs/react';
import toast from 'react-hot-toast';

interface Props {
  auth: {
    user: any;
  };
  flags: Flag[];
}

export default function Flags({ auth, flags }: Props) {
  const { post } = useForm();

  const handleFlagClick = (flag: Flag) => {
    // Navigate to flag details or open modal
    post(route('flags.show', flag.id));
  };

  const handleStatusChange = async (flag: Flag, newStatus: string) => {
    try {
      await post(route('flags.update-status', { id: flag.id, status: newStatus }));
      toast.success('Flag status updated successfully');
    } catch (error) {
      toast.error('Failed to update flag status');
    }
  };

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title="Flags" />
      
      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold">Flags</h1>
                <button
                  onClick={() => post(route('flags.create'))}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Create New Flag
                </button>
              </div>
              
              <FlagList 
                flags={flags} 
                onFlagClick={handleFlagClick} 
              />
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}