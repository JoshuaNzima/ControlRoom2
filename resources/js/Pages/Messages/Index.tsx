import React, { useEffect, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import MessagesLayout from '@/Layouts/MessagesLayout';
import { Card, CardContent, CardHeader } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/Components/ui/dialog';
import { Input } from '@/Components/ui/input';
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
  const [query, setQuery] = useState('');
  const currentUserId = usePage<PageProps>().props.auth.user.id;

  const q = query.trim().toLowerCase();
  const filteredConversations = !q
    ? conversations
    : (conversations || []).filter((c: any) => {
        const name = String(c?.title || c?.name || '').toLowerCase();
        const last = String(c?.last_message?.content || c?.messages?.[0]?.content || '').toLowerCase();
        const participants = Array.isArray(c?.participants)
          ? c.participants.map((p: any) => String(p?.name || '')).join(' ').toLowerCase()
          : '';
        return name.includes(q) || last.includes(q) || participants.includes(q);
      });

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
    <MessagesLayout title="Messages">
      <div className="space-y-4">
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

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          <div className="flex-1">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search conversations…"
              className="w-full dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
            />
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {filteredConversations.length} conversation{filteredConversations.length === 1 ? '' : 's'}
          </div>
        </div>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Recent Conversations</h3>
          </CardHeader>
          <CardContent>
            <ConversationList conversations={filteredConversations} currentUserId={currentUserId} />
          </CardContent>
        </Card>
      </div>
    </MessagesLayout>
  );
};

export default Index;
