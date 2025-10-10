import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Card } from '@/Components/ui/card';
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
import AgentStatusMap from './AgentStatusMap';
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

const MessagingIndex = ({ conversations, agents }: { conversations: Conversation[]; agents: Agent[] }) => {
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

        (echo as any).private('agent-statuses')
            .listen('AgentStatusUpdated', (e: any) => {
                setOnlineAgents((current) =>
                    current.map((agent) =>
                        agent.id === e.agent.id
                            ? { ...agent, ...e.agent }
                            : agent
                    )
                );
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
            (echo as any).leave('agent-statuses');
            (echo as any).leave('emergencies');
        };
    }, []);

    const handleAgentClick = (agent: Agent) => {
        router.post(route('messaging.store'), {
            type: 'direct',
            participants: [agent.id]
        });
    };

    return (
        <AppLayout>
            <Head title="Messaging & Agent Status" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-semibold text-gray-900">
                            Messaging & Agent Status
                        </h2>
                        <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
                            <DialogTrigger asChild>
                                <Button>New Conversation</Button>
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
                        {/* Agent Status Map */}
                        <div className="lg:col-span-2">
                            <Card>
                                <AgentStatusMap
                                    agents={onlineAgents}
                                    onAgentClick={setSelectedAgent}
                                />
                            </Card>
                        </div>

                        {/* Agent List and Quick Actions */}
                        <div className="space-y-6">
                            <Card className="p-4">
                                <h3 className="text-lg font-medium mb-4">Field Agents</h3>
                                <div className="space-y-3">
                                    {onlineAgents.map((agent) => (
                                        <div
                                            key={agent.id}
                                            className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                                            onClick={() => handleAgentClick(agent)}
                                        >
                                            <div>
                                                <div className="font-medium">{agent.name}</div>
                                                <div className="text-sm text-gray-500">
                                                    Last seen: {agent.last_seen
                                                        ? new Date(agent.last_seen).toLocaleTimeString()
                                                        : 'Never'}
                                                </div>
                                            </div>
                                            <Badge
                                                className={
                                                    agent.status === 'available'
                                                        ? 'bg-green-100 text-green-800'
                                                        : agent.status === 'on_duty'
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : agent.status === 'emergency'
                                                        ? 'bg-red-100 text-red-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                }
                                            >
                                                {agent.status.replace('_', ' ')}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </Card>

                            {/* Conversations List */}
                            <Card className="p-4">
                                <h3 className="text-lg font-medium mb-4">Recent Conversations</h3>
                                <ConversationList conversations={conversations} />
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};

export default MessagingIndex;


