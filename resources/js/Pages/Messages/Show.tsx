import React, { useEffect, useRef, useState } from 'react';
import { usePage } from '@inertiajs/react';
import MessagesLayout from '@/Layouts/MessagesLayout';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Badge } from '@/Components/ui/badge';
import axios from 'axios';
import { cn } from '@/lib/utils';
import {
  MoreVertical,
  Paperclip,
  Send,
  Check,
  CheckCheck,
  Loader2,
  Phone,
  Video,
  Info,
  MessageSquare
} from 'lucide-react';

// Types
interface Attachment {
  id: number;
  file_name: string;
  file_type: string;
  file_size: number;
  url: string;
}

interface Reaction {
  id: number;
  reaction: string;
  user: { id: number; name: string };
}

interface Message {
  id: number;
  sender_id: number;
  sender: { id: number; name: string };
  type: string;
  content: string;
  created_at: string;
  updated_at?: string;
  status?: 'sent' | 'delivered' | 'read';
  is_edited?: boolean;
  reactions?: Reaction[];
  attachments?: Attachment[];
  reply_to?: Message | null;
}

interface Participant {
  id: number;
  name: string;
  is_online?: boolean;
  last_seen?: string;
}

interface Conversation {
  id: number;
  type: 'direct' | 'group' | 'broadcast';
  title?: string;
  name?: string;
  participants: Participant[];
  created_by: number;
}

interface ShowProps {
  conversation: Conversation;
  messages: Message[];
}

const MessageStatus: React.FC<{ status?: string }> = ({ status }) => {
  if (!status || status === 'sent') {
    return <Check className="w-3.5 h-3.5 text-gray-400" />;
  }
  if (status === 'delivered') {
    return <CheckCheck className="w-3.5 h-3.5 text-gray-400" />;
  }
  return <CheckCheck className="w-3.5 h-3.5 text-blue-500" />;
};

const Show: React.FC<ShowProps> = ({ conversation, messages: initialMessages }) => {
  const page = usePage();
  const currentUserId = (page.props.auth.user as any)?.id;
  const currentUserName = (page.props.auth.user as any)?.name;

  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [isEmergency, setIsEmergency] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const otherParticipant = conversation.type === 'direct'
    ? conversation.participants.find(p => p.id !== currentUserId)
    : null;
  const chatTitle = conversation.type === 'direct'
    ? otherParticipant?.name
    : conversation.title || conversation.name || 'Group Chat';

  const scrollToBottom = () => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Subscribe to real-time updates
  useEffect(() => {
    const echo = (window as any).Echo;
    if (!echo) return;

    const channel = echo.join(`conversation.${conversation.id}`);

    channel.listen('MessageSent', (e: any) => {
      setMessages(prev => [...prev, e.message]);
      if (e.message.sender_id !== currentUserId) {
        markRead();
      }
    });

    channel.listen('UserTyping', (e: any) => {
      if (e.user_id !== currentUserId) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
      }
    });

    markRead();

    return () => {
      echo.leave(`conversation.${conversation.id}`);
    };
  }, [conversation.id, currentUserId]);

  const markRead = async () => {
    try {
      await axios.post(route('messages.conversations.read', conversation.id));
    } catch {}
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && attachments.length === 0) || isSending) return;

    setIsSending(true);

    try {
      const { data } = await axios.post(
        route('messages.conversations.messages.store', conversation.id),
        {
          content: newMessage,
          is_emergency: isEmergency,
          reply_to_id: replyTo?.id,
        }
      );

      if (attachments.length > 0) {
        for (const file of attachments) {
          const formData = new FormData();
          formData.append('file', file);
          await axios.post(
            route('messages.attachments.store', data.id),
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
          );
        }
      }

      setMessages(prev => [...prev, data]);
      setNewMessage('');
      setReplyTo(null);
      setAttachments([]);
      setIsEmergency(false);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleReact = async (messageId: number, emoji: string) => {
    try {
      await axios.post(route('messages.messages.react', messageId), { reaction: emoji });
      setMessages(prev => prev.map(m => {
        if (m.id !== messageId) return m;
        const existingReaction = m.reactions?.find(r =>
          r.user.id === currentUserId && r.reaction === emoji
        );
        if (existingReaction) {
          return { ...m, reactions: m.reactions?.filter(r => r.id !== existingReaction.id) };
        }
        return {
          ...m,
          reactions: [...(m.reactions || []), { id: Date.now(), reaction: emoji, user: { id: currentUserId, name: 'You' } }]
        };
      }));
    } catch (error) {
      console.error('Failed to react:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(Array.from(e.target.files));
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleTyping = () => {
    const echo = (window as any).Echo;
    if (echo) {
      axios.post(route('messages.conversations.typing', conversation.id)).catch(() => {});
    }
  };

  const getReadByText = (message: Message) => {
    if (message.sender_id !== currentUserId || message.status !== 'read') return null;
    const otherParticipants = conversation.participants.filter(p => p.id !== currentUserId);
    if (otherParticipants.length === 0) return null;
    return `Read by ${otherParticipants.length}`;
  };

  return (
    <MessagesLayout title={`Chat - ${chatTitle}`} conversations={[]} forums={[]}>
      <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-sm font-semibold text-white">
                {chatTitle?.charAt(0).toUpperCase()}
              </div>
              {otherParticipant?.is_online && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
              )}
            </div>

            <div>
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">{chatTitle}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isTyping ? (
                  <span className="text-red-600 dark:text-red-400">typing...</span>
                ) : otherParticipant?.is_online ? (
                  'Online'
                ) : conversation.type === 'group' ? (
                  `${conversation.participants.length} participants`
                ) : (
                  otherParticipant?.last_seen ? `Last seen ${new Date(otherParticipant.last_seen).toLocaleTimeString()}` : 'Offline'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="hidden sm:flex">
              <Phone className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </Button>
            <Button variant="ghost" size="icon" className="hidden sm:flex">
              <Video className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </Button>
            <Button variant="ghost" size="icon">
              <Info className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
              <MessageSquare className="w-16 h-16 mb-4 opacity-30" />
              <p>No messages yet</p>
              <p className="text-sm mt-1">Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwnMessage = message.sender_id === currentUserId;
              const isEmergency = message.type === 'emergency';

              return (
                <div
                  key={message.id}
                  className={cn(
                    'group flex gap-3 mb-4',
                    isOwnMessage ? 'flex-row-reverse' : 'flex-row'
                  )}
                >
                  {!isOwnMessage && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-xs font-semibold text-white">
                      {message.sender.name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className={cn(
                    'max-w-[75%] sm:max-w-[70%]',
                    isOwnMessage ? 'items-end' : 'items-start'
                  )}>
                    {!isOwnMessage && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-1 mb-1 block">
                        {message.sender.name}
                      </span>
                    )}

                    <div
                      className={cn(
                        'relative rounded-2xl px-4 py-2.5',
                        isEmergency
                          ? 'bg-red-600 text-white'
                          : isOwnMessage
                            ? 'bg-red-600 text-white rounded-br-md'
                            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-bl-md'
                      )}
                    >
                      {message.reply_to && (
                        <div className={cn(
                          'mb-2 pl-3 border-l-2 text-sm',
                          isOwnMessage ? 'border-red-400/50 text-red-100' : 'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400'
                        )}>
                          <p className="font-medium text-xs">{message.reply_to.sender.name}</p>
                          <p className="truncate">{message.reply_to.content}</p>
                        </div>
                      )}

                      {isEmergency && (
                        <div className="flex items-center gap-1 mb-1 text-red-100">
                          <span className="text-lg">🚨</span>
                          <span className="font-semibold text-xs uppercase tracking-wide">Emergency</span>
                        </div>
                      )}

                      <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{message.content}</p>

                      {message.attachments?.map(attachment => (
                        <a
                          key={attachment.id}
                          href={attachment.url}
                          download={attachment.file_name}
                          className="mt-2 flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors block"
                        >
                          <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                            <Paperclip className="w-5 h-5 text-red-600 dark:text-red-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {attachment.file_name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {(attachment.file_size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </a>
                      ))}

                      {/* Reactions picker on hover */}
                      <div className={cn(
                        'absolute bottom-full mb-2 hidden group-hover:flex items-center gap-1 p-1.5 rounded-full shadow-lg border bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700',
                        isOwnMessage ? 'right-0' : 'left-0'
                      )}>
                        {['👍', '❤️', '😂', '😢', '😠', '🎉'].map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => handleReact(message.id, emoji)}
                            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Reactions */}
                    {message.reactions && message.reactions.length > 0 && (
                      <div className={cn('flex flex-wrap gap-1 mt-1', isOwnMessage ? 'mr-1' : 'ml-1')}>
                        {Object.entries(
                          message.reactions.reduce((acc, r) => {
                            acc[r.reaction] = (acc[r.reaction] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)
                        ).map(([emoji, count]) => (
                          <button
                            key={emoji}
                            onClick={() => handleReact(message.id, emoji)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700"
                          >
                            <span>{emoji}</span>
                            <span>{count}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Meta */}
                    <div className={cn(
                      'flex items-center gap-2 mt-1 text-xs',
                      isOwnMessage ? 'justify-end mr-1' : 'justify-start ml-1'
                    )}>
                      <span className={isEmergency ? 'text-red-200' : 'text-gray-400 dark:text-gray-500'}>
                        {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {message.is_edited && (
                        <span className={isEmergency ? 'text-red-200' : 'text-gray-400 dark:text-gray-500'}>
                          Edited
                        </span>
                      )}
                      {isOwnMessage && <MessageStatus status={message.status} />}
                      {getReadByText(message) && (
                        <span className="text-gray-400 dark:text-gray-500">{getReadByText(message)}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={scrollRef} />
        </div>

        {/* Reply indicator */}
        {replyTo && (
          <div className="mx-4 mb-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400">Replying to {replyTo.sender.name}</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{replyTo.content}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setReplyTo(null)}>
              ×
            </Button>
          </div>
        )}

        {/* Attachments preview */}
        {attachments.length > 0 && (
          <div className="mx-4 mb-2 flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <div key={index} className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <Paperclip className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[150px]">{file.name}</span>
                <button onClick={() => removeAttachment(index)} className="text-gray-400 hover:text-red-500">
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSend} className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-end gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              className="hidden"
            />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              className="flex-shrink-0"
            >
              <Paperclip className="w-5 h-5 text-gray-500" />
            </Button>

            <Button
              type="button"
              variant={isEmergency ? 'destructive' : 'ghost'}
              size="icon"
              onClick={() => setIsEmergency(!isEmergency)}
              className="flex-shrink-0"
            >
              🚨
            </Button>

            <div className="flex-1 relative">
              <Input
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleTyping();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
                placeholder={isEmergency ? 'Type an emergency message...' : 'Type a message...'}
                className="pr-10 min-h-[44px] bg-gray-100 dark:bg-gray-800 border-0 dark:text-gray-100"
              />
            </div>

            <Button
              type="submit"
              disabled={(!newMessage.trim() && attachments.length === 0) || isSending}
              className="flex-shrink-0 bg-red-600 hover:bg-red-700"
            >
              {isSending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </form>
      </div>
    </MessagesLayout>
  );
};

export default Show;
