import React from 'react';
import { formatDateMW } from '@/Components/format';
import { Link } from '@inertiajs/react';
import { Badge } from '@/Components/ui/badge';

const ConversationList = ({ conversations }) => {
    const getConversationName = (conversation) => {
        if (conversation.type === 'direct') {
            // For direct messages, show the other participant's name
            const otherParticipant = conversation.participants.find(
                p => p.id !== window.auth.user.id
            );
            return otherParticipant ? otherParticipant.name : 'Deleted User';
        }
        // For groups, use the group name
        return conversation.name;
    };

    const getLastMessagePreview = (conversation) => {
        if (!conversation.last_message) return 'No messages yet';

        const sender = conversation.last_message.sender_id === window.auth.user.id
            ? 'You'
            : conversation.last_message.sender.name;

        return `${sender}: ${conversation.last_message.content}`;
    };

    return (
        <div className="space-y-2">
            {conversations.map((conversation) => (
                <Link
                    key={conversation.id}
                    href={route('control-room.messaging.show', conversation.id)}
                    className="block"
                >
                    <div className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer">
                        <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                                {getConversationName(conversation)}
                            </span>
                            {conversation.unread_count > 0 && (
                                <Badge variant="destructive">
                                    {conversation.unread_count}
                                </Badge>
                            )}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {getLastMessagePreview(conversation)}
                        </div>
                        {conversation.last_message && (
                            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                {formatDateMW('en-MW', conversation.last_message.created_at)}
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