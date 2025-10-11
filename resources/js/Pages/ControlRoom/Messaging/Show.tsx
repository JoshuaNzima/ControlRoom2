import React, { useState, useEffect, useRef } from 'react';
import { Head } from '@inertiajs/react';
import ControlRoomLayout from '@/Layouts/ControlRoomLayout';
import { Card, CardContent, CardHeader } from '@/Components/ui/card';
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
                        : 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100'
                } rounded-lg px-4 py-2 max-w-[70%] break-words`}
            >
                {!isOwnMessage && (
                    <div className="text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">
                        {message.sender.name}
                    </div>
                )}
                <div>
                    {message.is_emergency && '🚨 '}
                    {message.content}
                </div>
                <div
                    className={`text-xs ${
                        isOwnMessage ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
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

const Show = ({ auth, conversation }: ShowProps) => {
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
                route('control-room.messaging.messages.send', conversation.id),
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
        <ControlRoomLayout 
            title={`Chat - ${
                conversation.type === 'direct'
                    ? conversation.participants.find(p => p.id !== userId)?.name
                    : conversation.name
            }`} 
            user={auth?.user as any}
        >
            <Head title={`Chat - ${
                conversation.type === 'direct'
                    ? conversation.participants.find(p => p.id !== userId)?.name
                    : conversation.name
            }`} />

            <div className="max-w-4xl mx-auto">
                <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-gray-200 dark:border-gray-600">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                {conversation.type === 'direct'
                                    ? conversation.participants.find(p => p.id !== userId)?.name
                                    : conversation.name}
                            </h2>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                {conversation.participants.length} participants
                            </div>
                        </div>
                        {conversation.type === 'group' && (
                            <Badge variant="secondary" className="dark:bg-gray-600 dark:text-gray-100">
                                Group Chat
                            </Badge>
                        )}
                    </CardHeader>

                    <CardContent className="p-0">
                        {/* Messages */}
                        <ScrollArea className="h-[500px] p-4">
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
                        <form onSubmit={sendMessage} className="p-4 border-t border-gray-200 dark:border-gray-600">
                            <div className="flex items-center space-x-2">
                                <Button
                                    type="button"
                                    variant={isEmergency ? 'destructive' : 'outline'}
                                    size="icon"
                                    onClick={() => setIsEmergency(!isEmergency)}
                                    className={isEmergency ? '' : 'dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'}
                                >
                                    🚨
                                </Button>
                                <div className="flex-1">
                                    <Input
                                        value={newMessage}
                                        onChange={e => setNewMessage(e.target.value)}
                                        placeholder="Type your message..."
                                        className="w-full dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                                    />
                                </div>
                                <Button 
                                    type="submit"
                                    className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
                                >
                                    Send
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </ControlRoomLayout>
    );
};

export default Show;


