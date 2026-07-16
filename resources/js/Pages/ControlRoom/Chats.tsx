import React from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import AgentChats from '@/Components/Chat/AgentChats';

export default function Chats() {
  return (
    <AuthenticatedLayout header="Support Chats">
      <Head title="Support Chats" />
      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        <AgentChats />
      </div>
    </AuthenticatedLayout>
  );
}
