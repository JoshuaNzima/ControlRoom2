import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import ControlRoomLayout from '@/Layouts/ControlRoomLayout';
import { Card, CardContent, CardHeader } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/Components/ui/dialog';
import NewConversationForm from './NewConversationForm';
import ConversationList from './ConversationList';
import Echo from 'laravel-echo';

type Agent = {
  id: number;
  name: string;
  status: string;
  last_seen?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

type Conversation = any;

interface MessagingIndexProps {
  auth?: { user?: { name?: string } };
  conversations: Conversation[];
  agents: Agent[];
}

const MessagingIndex = ({ auth, conversations, agents }: MessagingIndexProps) => {
    const [showNewDialog, setShowNewDialog] = useState(false);
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
    const [onlineAgents, setOnlineAgents] = useState<Agent[]>(agents);

    useEffect(() => {
        const echo = new Echo({
            broadcaster: 'pusher',
            key: (window as any).appKey,
            cluster: (window as any).pusherCluster,
            forceTLS: true
        });

        (echo as any).private('emergencies')
            .listen('EmergencyAlert', (e: any) => {
                const notification = new Notification('Emergency Alert!', {
                    body: `${e.message.sender.name} has reported an emergency`,
                    icon: '/emergency-icon.png'
                });

                notification.onclick = () => {
                    router.visit(route('messaging.show', e.message.conversation_id));
                };
            });

        return () => {
            try {
                (echo as any).leave('emergencies');
            } catch (e) {
                // ignore if channel wasn't joined
            }
        };
    }, []);

    const handleAgentClick = (agent: Agent) => {
        router.post(route('control-room.messaging.store'), {
            type: 'direct',
            participants: [agent.id]
        });
    };

    return (
        <ControlRoomLayout title="Messaging" user={auth?.user as any}>
            <Head title="Messaging" />

            <div className="space-y-6">
                <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Messaging</h1>
                    <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
                        <DialogTrigger asChild>
                            <Button className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">
                                New Conversation
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Start New Conversation</DialogTitle>
                            </DialogHeader>
                            <NewConversationForm
                                onClose={() => setShowNewDialog(false)}
                                agents={agents}
                            />
                        </DialogContent>
                    </Dialog>
                </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Conversations and Agent List */}
                        <div className="lg:col-span-2">
                            <Card className="dark:bg-gray-800 dark:border-gray-700">
                                <CardHeader>
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Recent Conversations</h3>
                                </CardHeader>
                                <CardContent>
                                    <ConversationList conversations={conversations} />
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-6">
                        <Card className="dark:bg-gray-800 dark:border-gray-700">
                            <CardHeader>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Field Agents</h3>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {onlineAgents.map((agent) => (
                                        <div
                                            key={agent.id}
                                            className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer"
                                            onClick={() => handleAgentClick(agent)}
                                        >
                                            <div>
                                                <div className="font-medium text-gray-900 dark:text-gray-100">{agent.name}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quick Actions (agents list preserved) */}
                    </div>
                </div>
            </div>
        </ControlRoomLayout>
    );
};

export default MessagingIndex;


