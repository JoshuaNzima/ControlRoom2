import React from 'react';
import { Head } from '@inertiajs/react';
import ControlRoomLayout from '@/Layouts/ControlRoomLayout';
import AgentChats from '@/Components/Chat/AgentChats';

export default function Chats() {
  return (
    <ControlRoomLayout title="Support Chats">
      <Head title="Support Chats" />
      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        <AgentChats />
      </div>
    </ControlRoomLayout>
  );
}
