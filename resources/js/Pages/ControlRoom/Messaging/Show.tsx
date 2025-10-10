import React, { useState, useEffect, useRef } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Card } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { ScrollArea } from '@/Components/ui/scroll-area';
import Echo from 'laravel-echo';
import axios from 'axios';

type Message = {
  id: number;
  sender_id: number;
  sender: { id: number; name: string };
  content: string;
  is_emergency?: boolean;
  created_at: string;
};

type Conversation = {
  id: number;
  type: 'direct' | 'group';
  name?: string | null;
  participants: Array<{ id: number; name: string }>;
  messages: Message[];
};

const MessageBubble = ({ message, isOwnMessage }: { message: Message; isOwnMessage: boolean }) => {
    return (
        <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}>
            <div
                className={`${
                    isOwnMessage
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                } rounded-lg px-4 py-2 max-w-[70%] break-words`}
            >
                {!isOwnMessage && (
                    <div className="text-sm font-medium mb-1">
                        {message.sender.name}
                    </div>
                )}
                <div>
                    {message.is_emergency && '🚨 '}
                    {message.content}
                </div>
                <div
                    className={`text-xs ${
                        isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                    } mt-1`}
                >
                    {new Date(message.created_at).toLocaleTimeString()}
                </div>
            </div>
        </div>
    );
};

const Show = ({ conversation }: { conversation: Conversation }) => {
    const [messages, setMessages] = useState<Message[]>(conversation.messages);
    const [newMessage, setNewMessage] = useState('');
    const [isEmergency, setIsEmergency] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const userId = (window as any).auth.user.id as number;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();

        const echo = new Echo({
            broadcaster: 'pusher',
            key: (window as any).appKey,
            cluster: (window as any).pusherCluster,
            forceTLS: true
        });

        const channel = (echo as any).join(`conversation.${conversation.id}`);

        channel.listen('MessageSent', (e: any) => {
            setMessages((current: Message[]) => [...current, e.message]);
            scrollToBottom();
        });

        return () => {
            (echo as any).leave(`conversation.${conversation.id}`);
        };
    }, [conversation.id]);

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newMessage.trim()) return;

        try {
            const { data } = await axios.post(
                route('messaging.messages.send', conversation.id),
                {
                    content: newMessage,
                    is_emergency: isEmergency,
                }
            );

            setMessages((current: Message[]) => [...current, data]);
            setNewMessage('');
            setIsEmergency(false);
            scrollToBottom();
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    return (
        <AppLayout>
            <Head title={`Chat - ${
                conversation.type === 'direct'
                    ? conversation.participants.find(p => p.id !== userId)?.name
                    : conversation.name
            }`} />

            <div className="py-6">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Card className="p-4">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b pb-4 mb-4">
                            <div>
                                <h2 className="text-xl font-semibold">
                                    {conversation.type === 'direct'
                                        ? conversation.participants.find(p => p.id !== userId)?.name
                                        : conversation.name}
                                </h2>
                                <div className="text-sm text-gray-500">
                                    {conversation.participants.length} participants
                                </div>
                            </div>
                            {conversation.type === 'group' && (
                                <Badge variant="secondary">
                                    Group Chat
                                </Badge>
                            )}
                        </div>

                        {/* Messages */}
                        <ScrollArea className="h-[500px] pr-4">
                            <div className="space-y-4">
                                {messages.map((message) => (
                                    <MessageBubble
                                        key={message.id}
                                        message={message}
                                        isOwnMessage={message.sender_id === userId}
                                    />
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                        </ScrollArea>

                        {/* Message Input */}
                        <form onSubmit={sendMessage} className="mt-4">
                            <div className="flex items-center space-x-2">
                                <Button
                                    type="button"
                                    variant={isEmergency ? 'destructive' : 'outline'}
                                    size="icon"
                                    onClick={() => setIsEmergency(!isEmergency)}
                                >
                                    🚨
                                </Button>
                                <div className="flex-1">
                                    <Input
                                        value={newMessage}
                                        onChange={e => setNewMessage(e.target.value)}
                                        placeholder="Type your message..."
                                        className="w-full"
                                    />
                                </div>
                                <Button type="submit">
                                    Send
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
};

export default Show;


