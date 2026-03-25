import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import FrontOfficeLayout from '@/Layouts/FrontOfficeLayout';
import {
    Users,
    Calendar,
    CheckSquare,
    MessageSquare,
    Clock,
    TrendingUp,
    Briefcase,
    LogOut,
    UserCheck,
    Plus,
    CheckCircle,
    Trash2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { cn } from '@/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/Components/ui/dialog';
import { Label } from '@/Components/ui/label';
import { Input } from '@/Components/ui/input';

interface DashboardProps {
    stats: {
        today_visitors: number;
        pending_visitors: number;
        today_events: number;
        unread_messages: number;
    };
    recentVisitors: Array<{
        id: number;
        name: string;
        company: string | null;
        purpose: string;
        badge_number: string | null;
        host?: { name: string } | null;
    }>;
    todayEvents: Array<{
        id: number;
        title: string;
        start_time: string;
        location: string | null;
        creator?: { name: string } | null;
    }>;
    tasks: Array<{
        id: number;
        title: string;
        priority: string;
        status: string;
        due_date: string | null;
    }>;
    role: string;
    can: {
        manage_calendar: boolean;
        manage_tasks: boolean;
        view_reports: boolean;
        export_data: boolean;
    };
    duties?: Array<{
        title: string;
        description: string;
        priority: string;
    }>;
}

export default function Dashboard({ stats, recentVisitors, todayEvents, tasks, role, can, duties }: DashboardProps) {
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [taskForm, setTaskForm] = useState({
        title: '',
        description: '',
        priority: 'medium',
        due_date: '',
        category: 'front_office',
    });

    const handleCreateTask = (e: React.FormEvent) => {
        e.preventDefault();
        router.post(route('tasks.store'), taskForm, {
            onSuccess: () => {
                setIsTaskModalOpen(false);
                setTaskForm({ title: '', description: '', priority: 'medium', due_date: '', category: 'front_office' });
            },
        });
    };

    const handleCompleteTask = (taskId: number) => {
        if (confirm('Mark this task as complete?')) {
            router.post(route('tasks.complete', taskId));
        }
    };

    const handleDeleteTask = (taskId: number) => {
        if (confirm('Delete this task?')) {
            router.delete(route('tasks.destroy', taskId));
        }
    };

    const getDutyIcon = (title: string) => {
        if (title.toLowerCase().includes('calendar') || title.toLowerCase().includes('schedule') || title.toLowerCase().includes('diary')) return Calendar;
        if (title.toLowerCase().includes('communication') || title.toLowerCase().includes('message') || title.toLowerCase().includes('call')) return MessageSquare;
        if (title.toLowerCase().includes('meeting')) return Users;
        if (title.toLowerCase().includes('travel') || title.toLowerCase().includes('transport')) return TrendingUp;
        if (title.toLowerCase().includes('document') || title.toLowerCase().includes('report')) return CheckSquare;
        if (title.toLowerCase().includes('cash') || title.toLowerCase().includes('finance') || title.toLowerCase().includes('errand')) return Briefcase;
        if (title.toLowerCase().includes('confidential')) return LogOut;
        return Briefcase;
    };

    const getRoleDuties = (r: string) => {
        if (r === 'executive_assistant') {
            return [
                { title: 'Calendar and Schedule Management', description: 'Organizing and maintaining the executive\'s meetings, appointments, and events.', priority: 'high' },
                { title: 'Communication Management', description: 'Screening phone calls, emails, and correspondence on behalf of the executive.', priority: 'high' },
                { title: 'Meeting Coordination', description: 'Preparing meeting agendas, taking minutes, and following up on action points.', priority: 'high' },
                { title: 'Travel Arrangements', description: 'Booking flights, accommodation, and preparing travel itineraries.', priority: 'medium' },
                { title: 'Report and Document Preparation', description: 'Preparing reports, presentations, and official documents.', priority: 'medium' },
                { title: 'Managing Petty Cash', description: 'Overseeing petty cash funds, recording expenditures, and reconciling balances.', priority: 'medium' },
                { title: 'Confidential Information Handling', description: 'Managing sensitive information with high levels of confidentiality.', priority: 'urgent' },
                { title: 'Office and Administrative Support', description: 'Acting as a link between the executive and staff.', priority: 'medium' },
                { title: 'Event Planning', description: 'Organizing executive meetings, board meetings, corporate events, and functions.', priority: 'medium' },
            ];
        }
        if (r === 'personal_assistant') {
            return [
                { title: 'Diary Management', description: 'Managing the employer\'s daily schedule and appointments.', priority: 'high' },
                { title: 'Handling Calls and Messages', description: 'Receiving calls, taking messages, and responding when necessary.', priority: 'high' },
                { title: 'Travel and Transport Arrangements', description: 'Organizing travel plans, bookings, and transportation.', priority: 'medium' },
                { title: 'Personal Errands', description: 'Running errands such as shopping, paying bills, or arranging services.', priority: 'low' },
                { title: 'Document Organization', description: 'Filing, organizing, and maintaining important documents.', priority: 'medium' },
                { title: 'Meeting and Appointment Preparation', description: 'Scheduling and preparing materials for meetings.', priority: 'medium' },
                { title: 'Household or Personal Task Coordination', description: 'Managing personal commitments such as family events or home services.', priority: 'medium' },
                { title: 'Correspondence Management', description: 'Writing and responding to emails, letters, and other communication.', priority: 'medium' },
                { title: 'Reminders and Follow-ups', description: 'Reminding the employer about important deadlines or commitments.', priority: 'high' },
                { title: 'General Administrative Support', description: 'Performing clerical tasks and maintaining records.', priority: 'low' },
            ];
        }
        return [];
    };

    const roleDuties = duties || getRoleDuties(role);

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'text-red-400 bg-red-500/10 border-red-500/20';
            case 'high': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
            case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
            default: return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
        }
    };

    const getRoleLabel = (r: string) => {
        switch (r) {
            case 'executive_assistant': return 'Executive Assistant';
            case 'receptionist': return 'Receptionist';
            case 'personal_assistant': return 'Personal Assistant';
            default: return 'Staff';
        }
    };

    return (
        <FrontOfficeLayout title="Dashboard">
            <Head title="Front Office Dashboard" />

            {/* Welcome Header */}
            <div className="mb-8">
                <h1 className="text-2xl lg:text-3xl font-bold text-red-900 dark:text-white">
                    Welcome back, {getRoleLabel(role)}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Here's what's happening at the front office today
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card className="bg-white dark:bg-gray-800 border-red-100 dark:border-gray-700">
                    <CardContent className="p-4 lg:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Today's Visitors</p>
                                <p className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.today_visitors}</p>
                            </div>
                            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <Users className="w-5 h-5 lg:w-6 lg:h-6 text-blue-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-gray-800 border-red-100 dark:border-gray-700">
                    <CardContent className="p-4 lg:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Checked In</p>
                                <p className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.pending_visitors}</p>
                            </div>
                            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                                <UserCheck className="w-5 h-5 lg:w-6 lg:h-6 text-green-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-gray-800 border-red-100 dark:border-gray-700">
                    <CardContent className="p-4 lg:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Today's Events</p>
                                <p className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.today_events}</p>
                            </div>
                            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                <Calendar className="w-5 h-5 lg:w-6 lg:h-6 text-purple-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-gray-800 border-red-100 dark:border-gray-700">
                    <CardContent className="p-4 lg:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Messages</p>
                                <p className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.unread_messages}</p>
                            </div>
                            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg bg-red-500/10 flex items-center justify-center">
                                <MessageSquare className="w-5 h-5 lg:w-6 lg:h-6 text-red-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Role Duties & Responsibilities */}
            {(role === 'executive_assistant' || role === 'personal_assistant') && roleDuties.length > 0 && (
                <Card className="bg-white dark:bg-gray-800 border-red-100 dark:border-gray-700 mb-8">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-red-500" />
                            Key Duties & Responsibilities
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {roleDuties.map((duty, index) => {
                                const DutyIcon = getDutyIcon(duty.title);
                                return (
                                    <div
                                        key={index}
                                        className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 hover:border-red-200 dark:hover:border-red-500/30 transition-colors"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                                                <DutyIcon className="w-4 h-4 text-red-500" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-medium text-gray-900 dark:text-white text-sm">{duty.title}</h4>
                                                    <span className={cn(
                                                        "px-1.5 py-0.5 rounded text-xs border",
                                                        getPriorityColor(duty.priority)
                                                    )}>
                                                        {duty.priority}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{duty.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Main Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Recent Visitors */}
                <Card className="bg-white dark:bg-gray-800 border-red-100 dark:border-gray-700 lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <Users className="w-5 h-5 text-red-500" />
                            Today's Visitors
                        </CardTitle>
                        <Button variant="ghost" size="sm" className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20">
                            View All
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        {recentVisitors.length === 0 ? (
                            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                                No visitors today
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                {recentVisitors.slice(0, 5).map((visitor) => (
                                    <div key={visitor.id} className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500/20 to-red-600/10 flex items-center justify-center">
                                                <span className="text-red-600 dark:text-red-400 font-medium">
                                                    {visitor.name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">{visitor.name}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {visitor.company || 'No company'} • {visitor.purpose}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {visitor.badge_number && (
                                                <p className="text-xs text-gray-400 dark:text-gray-500">{visitor.badge_number}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <div className="space-y-6">
                    {/* Today's Events */}
                    <Card className="bg-white dark:bg-gray-800 border-red-100 dark:border-gray-700">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-red-500" />
                                Today's Schedule
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {todayEvents.length === 0 ? (
                                <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                                    No events scheduled
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {todayEvents.slice(0, 3).map((event) => (
                                        <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                                            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                                                <Clock className="w-5 h-5 text-purple-500" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium text-gray-900 dark:text-white truncate">{event.title}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                                {event.location && (
                                                    <p className="text-xs text-gray-400 dark:text-gray-500">{event.location}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Quick Tasks */}
                    <Card className="bg-white dark:bg-gray-800 border-red-100 dark:border-gray-700">
                        <CardHeader className="flex flex-row items-center justify-between pb-4">
                            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <CheckSquare className="w-5 h-5 text-red-500" />
                                Pending Tasks ({tasks.length})
                            </CardTitle>
                            {can.manage_tasks && (
                                <Dialog open={isTaskModalOpen} onOpenChange={setIsTaskModalOpen}>
                                    <DialogTrigger asChild>
                                        <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white">
                                            <Plus className="w-4 h-4 mr-1" />
                                            Add
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-white dark:bg-gray-800 border-red-100 dark:border-gray-700 text-gray-900 dark:text-white max-w-md">
                                        <DialogHeader>
                                            <DialogTitle className="flex items-center gap-2">
                                                <CheckSquare className="w-5 h-5 text-red-500" />
                                                New Task
                                            </DialogTitle>
                                        </DialogHeader>
                                        <form onSubmit={handleCreateTask} className="space-y-4 mt-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="title">Title *</Label>
                                                <Input
                                                    id="title"
                                                    value={taskForm.title}
                                                    onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                                                    className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="description">Description</Label>
                                                <Input
                                                    id="description"
                                                    value={taskForm.description}
                                                    onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                                                    className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-2">
                                                    <Label htmlFor="priority">Priority</Label>
                                                    <select
                                                        id="priority"
                                                        value={taskForm.priority}
                                                        onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}
                                                        className="w-full rounded-md bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white px-3 py-2"
                                                    >
                                                        <option value="low">Low</option>
                                                        <option value="medium">Medium</option>
                                                        <option value="high">High</option>
                                                        <option value="urgent">Urgent</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="due_date">Due Date</Label>
                                                    <Input
                                                        id="due_date"
                                                        type="date"
                                                        value={taskForm.due_date}
                                                        onChange={e => setTaskForm({ ...taskForm, due_date: e.target.value })}
                                                        className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex gap-3 pt-2">
                                                <Button type="button" variant="outline" onClick={() => setIsTaskModalOpen(false)} className="flex-1">
                                                    Cancel
                                                </Button>
                                                <Button type="submit" className="flex-1 bg-red-600 hover:bg-red-700">
                                                    Create Task
                                                </Button>
                                            </div>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            )}
                        </CardHeader>
                        <CardContent>
                            {tasks.length === 0 ? (
                                <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                                    No pending tasks
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {tasks.slice(0, 4).map((task) => (
                                        <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm text-gray-900 dark:text-white truncate">{task.title}</p>
                                                {task.due_date && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        Due {new Date(task.due_date).toLocaleDateString()}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={cn(
                                                    "px-2 py-1 rounded text-xs border",
                                                    getPriorityColor(task.priority)
                                                )}>
                                                    {task.priority}
                                                </span>
                                                {can.manage_tasks && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleCompleteTask(task.id)}
                                                            className="border-green-500/30 text-green-400 hover:bg-green-500/10 p-1 h-7 w-7"
                                                        >
                                                            <CheckCircle className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleDeleteTask(task.id)}
                                                            className="border-red-500/30 text-red-400 hover:bg-red-500/10 p-1 h-7 w-7"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </FrontOfficeLayout>
    );
}
