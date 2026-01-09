import React from 'react';
import { formatDateMW } from '@/Components/format';
import { Link } from '@inertiajs/react';
import { Badge } from '@/Components/ui/badge';

type Participant = { id: number | string; name?: string };

type Conversation = {
  id: number | string;
  type?: string;
  participants?: Participant[];
  title?: string | null;
  name?: string | null;
  unread_count?: number;
  last_message?: { sender_id?: number | string; sender?: { name?: string }; content?: string; created_at?: string } | null;
  messages?: Array<{ sender_id?: number | string; sender?: { name?: string }; content?: string; created_at?: string }>;
};

interface Props {
  conversations?: Conversation[];
  currentUserId?: number | string;
}

const ConversationList: React.FC<Props> = ({ conversations = [], currentUserId }) => {
  const getConversationName = (conversation: Conversation) => {
    if (conversation.type === 'direct') {
      const other = (conversation.participants || []).find(
        p => (currentUserId != null ? p.id !== currentUserId : true)
      );
      return other ? other.name : 'Deleted User';
    }
    return conversation.title || conversation.name || 'Group';
  };

  const getLastMessagePreview = (conversation: Conversation) => {
    const last = conversation.last_message || (conversation.messages && conversation.messages[0]);
    if (!last) return 'No messages yet';

    const sender = currentUserId != null && last.sender_id === currentUserId
      ? 'You'
      : last.sender?.name;

    return `${sender}: ${last.content}`;
  };

  return (
    <div className="space-y-2">
      {(conversations || []).map((conversation) => (
        <Link
          key={conversation.id}
          href={route('messages.conversations.show', conversation.id)}
          className="block"
        >
          <div className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {getConversationName(conversation)}
              </span>
              {conversation.unread_count && conversation.unread_count > 0 && (
                <Badge variant="destructive">
                  {conversation.unread_count}
                </Badge>
              )}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {getLastMessagePreview(conversation)}
            </div>
            {(conversation.last_message || (conversation.messages && conversation.messages[0])) && (
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {formatDateMW('en-MW', (conversation.last_message || (conversation.messages && conversation.messages[0]))?.created_at)}
              </div>
            )}
          </div>
        </Link>
      ))}

      {conversations.length === 0 && (
        <div className="text-center text-gray-500 dark:text-gray-400 py-4">
          No conversations yet
        </div>
      )}
    </div>
  );
};

export default ConversationList;
