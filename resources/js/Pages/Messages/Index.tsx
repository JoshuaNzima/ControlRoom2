import React, { useEffect, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import MessagesLayout from '@/Layouts/MessagesLayout';
import { Button } from '@/Components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/Components/ui/dialog';
import NewConversationForm, { Agent } from './NewConversationForm';
import {
  MessageSquare,
  Hash,
  Plus,
  ArrowRight,
  Bell,
  Shield,
  Zap
} from 'lucide-react';

interface Conversation {
  id: number;
  type: 'direct' | 'group' | 'broadcast';
  title?: string;
  participants: { id: number; name: string }[];
  last_message?: {
    content: string;
    created_at: string;
    sender?: { name: string };
  };
  unread_count?: number;
  is_online?: boolean;
}

interface Forum {
  id: number;
  name: string;
  slug: string;
  description?: string;
  type: 'public' | 'private' | 'announcement';
  category: string;
  color: string;
  threads_count: number;
  members_count: number;
  unread_count?: number;
}

interface Props {
  conversations: Conversation[];
  forums?: Forum[];
  agents: Agent[];
}

const WelcomeCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  action: string;
  onClick: () => void;
  color: string;
}> = ({ icon, title, description, action, onClick, color }) => (
  <div
    onClick={onClick}
    className="group cursor-pointer bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 hover:shadow-lg transition-all duration-200 hover:border-red-200 dark:hover:border-red-800"
  >
    <div
      className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
      style={{ backgroundColor: color + '20' }}
    >
      <div style={{ color }}>{icon}</div>
    </div>
    <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-2">
      {title}
    </h3>
    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
      {description}
    </p>
    <div className="flex items-center text-sm font-medium" style={{ color }}>
      {action}
      <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
    </div>
  </div>
);

const Index: React.FC<Props> = ({ conversations = [], forums = [], agents = [] }) => {
  const [showNewDialog, setShowNewDialog] = useState(false);
  const currentUserId = (usePage().props.auth.user as any)?.id;
  const currentUserName = (usePage().props.auth.user as any)?.name;

  useEffect(() => {
    try {
      const echo = (window as any).Echo;
      if (!echo) return;
      echo.private('emergencies').listen('EmergencyAlert', (e: any) => {
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
        try { echo.leave('emergencies'); } catch {}
      };
    } catch {}
  }, []);

  const unreadConversations = conversations.filter(c => c.unread_count && c.unread_count > 0);
  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);

  return (
    <MessagesLayout title="Messages" conversations={conversations} forums={forums || []}>
      <div className="h-full flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-red-700 mb-4 shadow-lg">
              <MessageSquare className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Welcome back, {currentUserName?.split(' ')[0] || 'there'}!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              Stay connected with your team. Start a conversation or join a forum discussion.
            </p>
          </div>

          {totalUnread > 0 && (
            <div className="flex justify-center gap-4 mb-8">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-2 flex items-center gap-2">
                <Bell className="w-4 h-4 text-red-600 dark:text-red-400" />
                <span className="text-sm font-medium text-red-800 dark:text-red-300">
                  {totalUnread} unread in {unreadConversations.length} conversation{unreadConversations.length === 1 ? '' : 's'}
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <WelcomeCard
              icon={<Plus className="w-6 h-6" />}
              title="New Conversation"
              description="Start a direct message or group chat with your colleagues."
              action="Start Chat"
              onClick={() => setShowNewDialog(true)}
              color="#dc2626"
            />
            <WelcomeCard
              icon={<Hash className="w-6 h-6" />}
              title="Browse Forums"
              description="Join topic-based discussions and stay updated with team announcements."
              action="View Forums"
              onClick={() => router.visit(route('messages.forums.index'))}
              color="#2563eb"
            />
            <WelcomeCard
              icon={<Shield className="w-6 h-6" />}
              title="Emergency Alert"
              description="Send an urgent emergency message to all relevant personnel immediately."
              action="Send Alert"
              onClick={() => setShowNewDialog(true)}
              color="#ea580c"
            />
          </div>

          {conversations.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  Recent Conversations
                </h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {conversations.length} total
                </span>
              </div>
              <div className="space-y-2">
                {conversations.slice(0, 3).map((conv) => {
                  const isDirect = conv.type === 'direct';
                  const otherParticipant = isDirect
                    ? conv.participants?.find(p => p.id !== currentUserId)
                    : null;
                  const displayName = isDirect
                    ? otherParticipant?.name
                    : conv.title || 'Group Chat';

                  return (
                    <button
                      key={conv.id}
                      onClick={() => router.visit(route('messages.conversations.show', conv.id))}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-sm font-semibold text-white flex-shrink-0">
                        {displayName?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {displayName}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {conv.last_message
                            ? `${conv.last_message.sender?.name === currentUserName ? 'You: ' : ''}${conv.last_message.content}`
                            : 'No messages yet'}
                        </p>
                      </div>
                      {conv.unread_count && conv.unread_count > 0 && (
                        <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">
                          {conv.unread_count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-lg dark:bg-gray-900 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-gray-100">Start New Conversation</DialogTitle>
          </DialogHeader>
          <NewConversationForm onClose={() => setShowNewDialog(false)} agents={agents} />
        </DialogContent>
      </Dialog>
    </MessagesLayout>
  );
};

export default Index;
