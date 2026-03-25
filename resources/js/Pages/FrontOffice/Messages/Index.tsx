import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import FrontOfficeLayout from '@/Layouts/FrontOfficeLayout';
import {
    MessageSquare,
    Send,
    Inbox,
    Mail,
    User,
    Clock,
    CheckCircle,
    AlertCircle,
    Search,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Badge } from '@/Components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import { Label } from '@/Components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import { cn } from '@/lib/utils';

interface Message {
    id: number;
    sender_id: number;
    recipient_id: number;
    subject: string;
    message: string;
    priority: string;
    read_at: string | null;
    created_at: string;
    sender?: { name: string } | null;
    recipient?: { name: string } | null;
}

interface Staff {
    id: number;
    name: string;
    email: string;
}

interface MessagesProps {
    received: Message[];
    sent: Message[];
    unreadCount: number;
    staff: Staff[];
}

export default function MessagesIndex({ received, sent, unreadCount, staff }: MessagesProps) {
    const [isComposeOpen, setIsComposeOpen] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [activeTab, setActiveTab] = useState('inbox');
    const [formData, setFormData] = useState({
        recipient_id: '',
        subject: '',
        message: '',
        priority: 'normal',
    });

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        router.post(route('front-office.messages.store'), formData, {
            onSuccess: () => {
                setIsComposeOpen(false);
                setFormData({ recipient_id: '', subject: '', message: '', priority: 'normal' });
            },
        });
    };

    const handleMarkRead = (id: number) => {
        router.put(route('front-office.messages.read', id));
    };

    const openMessage = (msg: Message) => {
        setSelectedMessage(msg);
        if (!msg.read_at && msg.recipient_id === (window as any).auth?.user?.id) {
            handleMarkRead(msg.id);
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'bg-red-500/10 text-red-400 border-red-500/20';
            case 'high': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
            default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
        }
    };

    return (
        <FrontOfficeLayout>
            <Head title="Messages" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <MessageSquare className="w-6 h-6 text-red-400" />
                        Messages
                    </h1>
                    <p className="text-gray-500 mt-1">Internal communications</p>
                </div>
                <Button
                    onClick={() => setIsComposeOpen(true)}
                    className="bg-red-600 hover:bg-red-700 text-white"
                >
                    <Send className="w-4 h-4 mr-2" />
                    Compose
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <Card className="bg-[#111111] border-[#222222]">
                    <CardContent className="p-4">
                        <p className="text-sm text-gray-500">Inbox</p>
                        <p className="text-2xl font-bold text-white">{received.length}</p>
                    </CardContent>
                </Card>
                <Card className="bg-[#111111] border-[#222222]">
                    <CardContent className="p-4">
                        <p className="text-sm text-gray-500">Unread</p>
                        <p className="text-2xl font-bold text-red-400">{unreadCount}</p>
                    </CardContent>
                </Card>
                <Card className="bg-[#111111] border-[#222222]">
                    <CardContent className="p-4">
                        <p className="text-sm text-gray-500">Sent</p>
                        <p className="text-2xl font-bold text-blue-400">{sent.length}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Messages Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-[#111111] border border-[#222222] mb-4">
                    <TabsTrigger value="inbox" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
                        <Inbox className="w-4 h-4 mr-2" />
                        Inbox
                        {unreadCount > 0 && (
                            <Badge className="ml-2 bg-red-500 text-white">{unreadCount}</Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="sent" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
                        <Mail className="w-4 h-4 mr-2" />
                        Sent
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="inbox">
                    <Card className="bg-[#111111] border-[#222222]">
                        <CardContent className="p-0">
                            {received.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    <Inbox className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>No messages in inbox</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-[#222222]">
                                    {received.map((msg) => (
                                        <div
                                            key={msg.id}
                                            onClick={() => openMessage(msg)}
                                            className={cn(
                                                "p-4 cursor-pointer hover:bg-[#1a1a1a] transition-colors",
                                                !msg.read_at && "bg-red-500/5"
                                            )}
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={cn(
                                                            "font-medium",
                                                            !msg.read_at ? "text-white" : "text-gray-300"
                                                        )}>
                                                            {msg.subject}
                                                        </span>
                                                        {msg.priority !== 'normal' && (
                                                            <Badge className={cn("text-xs", getPriorityColor(msg.priority))}>
                                                                {msg.priority}
                                                            </Badge>
                                                        )}
                                                        {!msg.read_at && (
                                                            <Badge className="bg-red-500 text-white text-xs">New</Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-500 truncate">{msg.message}</p>
                                                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
                                                        <span className="flex items-center gap-1">
                                                            <User className="w-3 h-3" />
                                                            From: {msg.sender?.name || 'Unknown'}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {new Date(msg.created_at).toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="sent">
                    <Card className="bg-[#111111] border-[#222222]">
                        <CardContent className="p-0">
                            {sent.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>No sent messages</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-[#222222]">
                                    {sent.map((msg) => (
                                        <div key={msg.id} className="p-4 hover:bg-[#1a1a1a]">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-gray-300 font-medium">{msg.subject}</span>
                                                        {msg.priority !== 'normal' && (
                                                            <Badge className={cn("text-xs", getPriorityColor(msg.priority))}>
                                                                {msg.priority}
                                                            </Badge>
                                                        )}
                                                        {msg.read_at && (
                                                            <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-xs">
                                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                                Read
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-500 truncate">{msg.message}</p>
                                                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
                                                        <span className="flex items-center gap-1">
                                                            <User className="w-3 h-3" />
                                                            To: {msg.recipient?.name || 'Unknown'}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {new Date(msg.created_at).toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Compose Modal */}
            <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
                <DialogContent className="bg-[#111111] border-[#222222] text-white max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Send className="w-5 h-5 text-red-400" />
                            New Message
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSend} className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label>To</Label>
                            <Select
                                value={formData.recipient_id}
                                onValueChange={v => setFormData({ ...formData, recipient_id: v })}
                            >
                                <SelectTrigger className="bg-[#1a1a1a] border-[#333333] text-white">
                                    <SelectValue placeholder="Select recipient" />
                                </SelectTrigger>
                                <SelectContent>
                                    {staff.map((s) => (
                                        <SelectItem key={s.id} value={String(s.id)} className="text-white">
                                            {s.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="subject">Subject</Label>
                            <Input
                                id="subject"
                                value={formData.subject}
                                onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                className="bg-[#1a1a1a] border-[#333333] text-white"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Priority</Label>
                            <Select
                                value={formData.priority}
                                onValueChange={v => setFormData({ ...formData, priority: v })}
                            >
                                <SelectTrigger className="bg-[#1a1a1a] border-[#333333] text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low" className="text-white">Low</SelectItem>
                                    <SelectItem value="normal" className="text-white">Normal</SelectItem>
                                    <SelectItem value="high" className="text-white">High</SelectItem>
                                    <SelectItem value="urgent" className="text-white">Urgent</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="message">Message</Label>
                            <textarea
                                id="message"
                                value={formData.message}
                                onChange={e => setFormData({ ...formData, message: e.target.value })}
                                className="w-full h-32 px-3 py-2 bg-[#1a1a1a] border border-[#333333] rounded-md text-white text-sm resize-none focus:outline-none focus:border-red-500/50"
                                required
                            />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <Button type="button" variant="outline" onClick={() => setIsComposeOpen(false)} className="flex-1">
                                Cancel
                            </Button>
                            <Button type="submit" className="flex-1 bg-red-600 hover:bg-red-700">
                                <Send className="w-4 h-4 mr-2" />
                                Send
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Message Detail Modal */}
            <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
                <DialogContent className="bg-[#111111] border-[#222222] text-white max-w-md">
                    {selectedMessage && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <Mail className="w-5 h-5 text-red-400" />
                                    {selectedMessage.subject}
                                </DialogTitle>
                            </DialogHeader>
                            <div className="mt-4 space-y-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">From:</span>
                                    <span className="text-white">{selectedMessage.sender?.name}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">Date:</span>
                                    <span className="text-white">
                                        {new Date(selectedMessage.created_at).toLocaleString()}
                                    </span>
                                </div>
                                {selectedMessage.priority !== 'normal' && (
                                    <Badge className={getPriorityColor(selectedMessage.priority)}>
                                        {selectedMessage.priority} priority
                                    </Badge>
                                )}
                                <div className="p-4 bg-[#1a1a1a] rounded-lg">
                                    <p className="text-white whitespace-pre-wrap">{selectedMessage.message}</p>
                                </div>
                                <Button
                                    onClick={() => setSelectedMessage(null)}
                                    className="w-full bg-red-600 hover:bg-red-700"
                                >
                                    Close
                                </Button>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </FrontOfficeLayout>
    );
}
