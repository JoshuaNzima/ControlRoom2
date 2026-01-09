import React, { useEffect, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardHeader } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/Components/ui/dialog';
import NewConversationForm, { Agent } from './NewConversationForm';
import ConversationList from './ConversationList';
import { PageProps } from '@/types';

interface Props {
  auth?: { user?: { name?: string } };
  conversations: any[];
  agents: Agent[];
}

const Index: React.FC<Props> = ({ auth, conversations = [], agents = [] }) => {
  const [showNewDialog, setShowNewDialog] = useState(false);
  const currentUserId = usePage<PageProps>().props.auth.user.id;

  useEffect(() => {
    try {
      // Optionally listen to a global channel for notifications
      const echo = (window as any).Echo;
      if (!echo) return;
      (echo as any).private('emergencies').listen('EmergencyAlert', (e: any) => {
        try {
          const notification = new Notification('Emergency Alert!', {
            body: `${e.message.sender.name} has reported an emergency`,
            icon: '/emergency-icon.png',
          });
          notification.onclick = () => {
            router.visit(route('messages.conversations.show', e.message.conversation_id));
          };
        } catch {}
      });
      return () => {
        try { (echo as any).leave('emergencies'); } catch {}
      };
    } catch {}
  }, []);

  return (
    <AuthenticatedLayout user={auth?.user as any}>
      <Head title="Messages" />

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Messages</h1>
          <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">New Conversation</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Start New Conversation</DialogTitle>
              </DialogHeader>
              <NewConversationForm onClose={() => setShowNewDialog(false)} agents={agents} />
            </DialogContent>
          </Dialog>
        </div>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Recent Conversations</h3>
          </CardHeader>
          <CardContent>
            <ConversationList conversations={conversations} currentUserId={currentUserId} />
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
};

export default Index;
