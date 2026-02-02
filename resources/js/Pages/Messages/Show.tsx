import React, { useEffect, useRef, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import MessagesLayout from '@/Layouts/MessagesLayout';
import { Card, CardContent, CardHeader } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import axios from 'axios';
import { PageProps } from '@/types';

type Message = {
  id: number;
  sender_id: number;
  sender: { id: number; name: string };
  type?: string;
  content: string;
  is_emergency?: boolean;
  created_at: string;
};

type Conversation = {
  id: number;
  type: 'direct' | 'group' | 'broadcast';
  title?: string | null;
  name?: string | null;
  participants: Array<{ id: number; name: string }>;
  messages: Message[];
};

const MessageBubble = ({ message, isOwnMessage }: { message: Message; isOwnMessage: boolean }) => {
  const isEmergency = !!message.is_emergency || message.type === 'emergency';
  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`${
          isOwnMessage
            ? 'bg-red-600 text-white'
            : 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100'
        } rounded-lg px-4 py-2 max-w-[78%] break-words`}
      >
        {!isOwnMessage && (
          <div className="text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">
            {message.sender.name}
          </div>
        )}
        <div>
          {isEmergency && '🚨 '}
          {message.content}
        </div>
        <div
          className={`text-xs ${
            isOwnMessage ? 'text-red-100' : 'text-gray-500 dark:text-gray-400'
          } mt-1`}
        >
          {new Date(message.created_at).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

interface ShowProps {
  auth?: { user?: { name?: string } };
  conversation: Conversation;
}

const Show: React.FC<ShowProps> = ({ auth, conversation }) => {
  const [messages, setMessages] = useState<Message[]>(conversation.messages || []);
  const [newMessage, setNewMessage] = useState('');
  const [isEmergency, setIsEmergency] = useState(false);
  const scrollViewportRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const userId = usePage<PageProps>().props.auth.user.id;

  const markRead = async () => {
    try {
      await axios.post(route('messages.conversations.read', conversation.id));
    } catch {}
  };

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    try {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
        return;
      }
      if (scrollViewportRef.current) {
        scrollViewportRef.current.scrollTop = scrollViewportRef.current.scrollHeight;
      }
    } catch {}
  };

  useEffect(() => {
    scrollToBottom('auto');

    try {
      const echo = (window as any).Echo;
      if (!echo) return;
      const channel = (echo as any).join(`conversation.${conversation.id}`);

      channel.listen('MessageSent', (e: any) => {
        setMessages((current: Message[]) => [...current, e.message]);
        if (e?.message?.sender_id && Number(e.message.sender_id) !== Number(userId)) {
          markRead();
        }
        scrollToBottom('auto');
      });

      return () => {
        (echo as any).leave(`conversation.${conversation.id}`);
      };
    } catch {}
  }, [conversation.id, userId]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const { data } = await axios.post(
        route('messages.conversations.messages.store', conversation.id),
        {
          content: newMessage,
          is_emergency: isEmergency,
        }
      );

      setMessages((current: Message[]) => [...current, data]);
      setNewMessage('');
      setIsEmergency(false);
      scrollToBottom('auto');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const title = conversation.type === 'direct'
    ? (conversation.participants || []).find(p => String(p.id) !== String(userId))?.name
    : (conversation.title || conversation.name || 'Group');

  return (
    <MessagesLayout title={`Chat - ${title}`}>
      <div className="max-w-4xl mx-auto">
        <Card className="dark:bg-gray-800 dark:border-gray-700 overflow-hidden">
          <CardHeader className="p-0">
            <div className="sticky top-0 z-10 border-b border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/80 backdrop-blur">
              <div className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      href={route('messages.conversations.index')}
                      className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                      aria-label="Back"
                    >
                      ←
                    </Link>
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">{title}</h2>
                    {conversation.type === 'group' && (
                      <Badge variant="secondary" className="dark:bg-gray-700 dark:text-gray-100">Group</Badge>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {conversation.participants.length} participant{conversation.participants.length === 1 ? '' : 's'}
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="flex flex-col h-[calc(100vh-14rem)] sm:h-[70vh]">
              <div
                ref={scrollViewportRef}
                className="flex-1 overflow-auto px-4 py-3 bg-white dark:bg-gray-900"
              >
                {messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwnMessage={String(message.sender_id) === String(userId)}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={sendMessage} className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={isEmergency ? 'destructive' : 'outline'}
                    size="icon"
                    onClick={() => setIsEmergency(!isEmergency)}
                    className={isEmergency ? '' : 'dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800'}
                    aria-pressed={isEmergency}
                    aria-label={isEmergency ? 'Emergency message enabled' : 'Toggle emergency message'}
                  >
                    🚨
                  </Button>

                  <div className="flex-1">
                    <Input
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      placeholder={isEmergency ? 'Type an emergency message…' : 'Type your message…'}
                      className="w-full dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                    />
                  </div>

                  <Button type="submit" className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">
                    Send
                  </Button>
                </div>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </MessagesLayout>
  );
};

export default Show;
