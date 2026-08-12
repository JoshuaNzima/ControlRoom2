import { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import useNotification from '@/Providers/useNotifications';
import {
    CheckSquare,
    Plus,
    Search,
    Filter,
    CheckCircle,
    Clock,
    AlertCircle,
    Calendar,
    User,
    X,
    MessageSquare,
    Timer,
    Layers,
    MoreHorizontal,
    ChevronDown,
    Trash2,
    Edit3,
    FileText,
    FileDown,
    FileSpreadsheet,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Badge } from '@/Components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/Components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { Checkbox } from '@/Components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import { cn } from '@/lib/utils';

interface Comment {
    id: number;
    content: string;
    user: { name: string };
    created_at: string;
}

interface TimeEntry {
    id: number;
    hours: number;
    notes: string | null;
    user: { name: string };
    created_at: string;
}

interface Dependency {
    id: number;
    title: string;
    status: string;
}

interface Task {
    id: number;
    title: string;
    description: string | null;
    priority: string;
    status: string;
    due_date: string | null;
    category: string;
    time_estimate: number | null;
    comments_count: number;
    time_entries_count: number;
    creator?: { name: string } | null;
    assignee?: { name: string; id: number } | null;
    comments?: Comment[];
    timeEntries?: TimeEntry[];
    dependencies?: Dependency[];
}

interface TaskTemplate {
    id: number;
    name: string;
    description: string | null;
    items_count: number;
}

interface User {
    id: number;
    name: string;
    role?: string;
}

interface TasksProps {
    tasks?: {
        data: Task[];
        total: number;
    };
    users?: User[];
    templates?: TaskTemplate[];
    filters?: {
        status?: string;
        priority?: string;
        assigned_to?: string;
    };
    auth?: {
        user: {
            id: number;
            name: string;
            role?: string;
        };
    };
}

export default function TasksIndex({ tasks, users = [], templates = [], filters = {}, auth }: TasksProps) {
    const { push } = useNotification();
    const { props } = usePage();
    const currentUser = (auth?.user || props.auth?.user) as { id: number; name: string; role?: string } | undefined;
    const isExecutiveAssistant = currentUser?.role === 'executive_assistant' || currentUser?.role === 'super_admin';

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isTemplateOpen, setIsTemplateOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTasks, setSelectedTasks] = useState<number[]>([]);
    const [activeTab, setActiveTab] = useState('details');
    const [showFilters, setShowFilters] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'medium',
        due_date: '',
        category: 'general',
        assigned_to: '',
        time_estimate: '',
        template_id: '',
    });

    const [commentText, setCommentText] = useState('');
    const [timeEntry, setTimeEntry] = useState({ hours: '', notes: '' });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        router.post(route('front-office.tasks.store'), formData, {
            preserveScroll: true,
            onSuccess: () => {
                setIsCreateOpen(false);
                setFormData({
                    title: '',
                    description: '',
                    priority: 'medium',
                    due_date: '',
                    category: 'general',
                    assigned_to: '',
                    time_estimate: '',
                    template_id: '',
                });
                push('Task created', 'success');
            },
            onError: (errs) => push(Object.values(errs)[0] || 'Failed to create task', 'error'),
        });
    };

    const handleComplete = (id: number) => {
        if (confirm('Mark this task as completed?')) {
            router.put(route('front-office.tasks.complete', id), {}, {
                preserveScroll: true,
                onSuccess: () => push('Task completed', 'success'),
                onError: (errs) => push(Object.values(errs)[0] || 'Failed to complete task', 'error'),
            });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('Delete this task?')) {
            router.delete(route('front-office.tasks.destroy', id), {
                preserveScroll: true,
                onSuccess: () => push('Task deleted', 'success'),
                onError: (errs) => push(Object.values(errs)[0] || 'Failed to delete task', 'error'),
            });
        }
    };

    const handleAddComment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTask || !commentText.trim()) return;

        router.post(route('front-office.tasks.comments.store', selectedTask.id), {
            comment: commentText,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setCommentText('');
                push('Comment added', 'success');
            },
            onError: (errs) => push(Object.values(errs)[0] || 'Failed to add comment', 'error'),
        });
    };

    const handleLogTime = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTask || !timeEntry.hours) return;

        router.post(route('front-office.tasks.time.store', selectedTask.id), {
            hours: parseFloat(timeEntry.hours),
            notes: timeEntry.notes,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setTimeEntry({ hours: '', notes: '' });
                push('Time entry added', 'success');
            },
            onError: (errs) => push(Object.values(errs)[0] || 'Failed to add time entry', 'error'),
        });
    };

    const handleBulkComplete = () => {
        if (selectedTasks.length === 0) return;
        if (confirm(`Mark ${selectedTasks.length} tasks as completed?`)) {
            router.post(route('front-office.tasks.bulk'), {
                task_ids: selectedTasks,
                status: 'completed',
            }, {
                preserveScroll: true,
                onSuccess: () => {
                    push(`${selectedTasks.length} tasks completed`, 'success');
                    setSelectedTasks([]);
                },
                onError: (errs) => push(Object.values(errs)[0] || 'Failed to complete tasks', 'error'),
            });
        }
    };

    const handleBulkDelete = () => {
        if (selectedTasks.length === 0) return;
        if (confirm(`Delete ${selectedTasks.length} tasks?`)) {
            const promises = selectedTasks.map(id => 
                router.delete(route('front-office.tasks.destroy', id), { preserveScroll: true })
            );
            Promise.all(promises).then(() => {
                push(`${selectedTasks.length} tasks deleted`, 'success');
                setSelectedTasks([]);
            }).catch(() => {
                push('Some tasks failed to delete', 'error');
            });
        }
    };

    const toggleTaskSelection = (id: number) => {
        setSelectedTasks(prev =>
            prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
        );
    };

    const selectAll = () => {
        const allIds = (tasks?.data || []).map(t => t.id);
        setSelectedTasks(selectedTasks.length === allIds.length ? [] : allIds);
    };

    const openTaskDetail = (task: Task) => {
        setSelectedTask(task);
        setIsDetailOpen(true);
        setActiveTab('details');
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'bg-red-500/10 text-red-400 border-red-500/20';
            case 'high': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
            case 'medium': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
            default: return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20';
            case 'in_progress': return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
            case 'overdue': return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
            default: return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20';
        }
    };

    const filteredTasks = (tasks?.data || []).filter(t =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const pendingCount = (tasks?.data || []).filter(t => t.status !== 'completed' && t.status !== 'overdue').length;
    const overdueCount = (tasks?.data || []).filter(t => t.status === 'overdue').length;
    const completedCount = (tasks?.data || []).filter(t => t.status === 'completed').length;

    return (
        <AuthenticatedLayout>
            <Head title="Task Management" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <CheckSquare className="w-6 h-6 text-coin-500" />
                        Tasks
                    </h1>
                    <p className="text-muted-foreground mt-1">Manage and track front office tasks</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    {isExecutiveAssistant && selectedTasks.length > 0 && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="border-border">
                                    <MoreHorizontal className="w-4 h-4 mr-2" />
                                    Bulk ({selectedTasks.length})
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-popover border-border">
                                <DropdownMenuItem onClick={handleBulkComplete} className="text-foreground hover:bg-muted">
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Mark Complete
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleBulkDelete} className="text-destructive hover:bg-muted">
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                    <Button variant="outline" className="border-border" onClick={() => setShowFilters(!showFilters)}>
                        <Filter className="w-4 h-4 mr-2" />
                        Filters
                    </Button>
                    {isExecutiveAssistant && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="border-border">
                                    <FileDown className="w-4 h-4 mr-2" />
                                    Export
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-popover border-border">
                                <DropdownMenuItem
                                    onClick={() => window.open(route('front-office.tasks.export', { format: 'excel', ...filters }), '_blank')}
                                    className="text-foreground hover:bg-muted"
                                >
                                    <FileSpreadsheet className="w-4 h-4 mr-2 text-green-500" />
                                    Export to Excel
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => window.open(route('front-office.tasks.export', { format: 'pdf', ...filters }), '_blank')}
                                    className="text-foreground hover:bg-muted"
                                >
                                    <FileDown className="w-4 h-4 mr-2 text-red-500" />
                                    Export to PDF
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                    <Dialog open={isTemplateOpen} onOpenChange={setIsTemplateOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="border-border">
                                <Layers className="w-4 h-4 mr-2" />
                                Templates
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-background border-border text-foreground max-w-md">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <Layers className="w-5 h-5 text-coin-500" />
                                    Task Templates
                                </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-3 mt-4">
                                {templates.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-4">No templates available</p>
                                ) : (
                                    templates.map(template => (
                                        <div
                                            key={template.id}
                                            className="p-3 bg-muted rounded-lg border border-border cursor-pointer hover:border-coin-500/50"
                                            onClick={() => {
                                                setFormData(prev => ({ ...prev, template_id: template.id.toString() }));
                                                setIsTemplateOpen(false);
                                                setIsCreateOpen(true);
                                            }}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium">{template.name}</span>
                                                <Badge variant="outline" className="text-xs">
                                                    {template.items_count} items
                                                </Badge>
                                            </div>
                                            {template.description && (
                                                <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-coin-600 hover:bg-coin-700 text-white">
                                <Plus className="w-4 h-4 mr-2" />
                                New Task
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-background border-border text-foreground max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <CheckSquare className="w-5 h-5 text-coin-500" />
                                Create New Task
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreate} className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Task Title *</Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="bg-muted border-border text-foreground"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="bg-muted border-border text-foreground min-h-[80px]"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label>Priority</Label>
                                    <Select
                                        value={formData.priority}
                                        onValueChange={v => setFormData({ ...formData, priority: v })}
                                    >
                                        <SelectTrigger className="bg-muted border-border text-foreground">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">Low</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                            <SelectItem value="urgent">Urgent</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="due_date">Due Date</Label>
                                    <Input
                                        id="due_date"
                                        type="date"
                                        value={formData.due_date}
                                        onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                                        className="bg-muted border-border text-foreground"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label>Category</Label>
                                    <Select
                                        value={formData.category}
                                        onValueChange={v => setFormData({ ...formData, category: v })}
                                    >
                                        <SelectTrigger className="bg-muted border-border text-foreground">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="general">General</SelectItem>
                                            <SelectItem value="front_office">Front Office</SelectItem>
                                            <SelectItem value="executive">Executive</SelectItem>
                                            <SelectItem value="personal">Personal</SelectItem>
                                            <SelectItem value="ict">ICT</SelectItem>
                                            <SelectItem value="administration">Administration</SelectItem>
                                            <SelectItem value="marketing">Marketing</SelectItem>
                                            <SelectItem value="operations">Operations</SelectItem>
                                            <SelectItem value="accounts">Accounts</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="time_estimate">Time Estimate (hours)</Label>
                                    <Input
                                        id="time_estimate"
                                        type="number"
                                        step="0.5"
                                        value={formData.time_estimate}
                                        onChange={e => setFormData({ ...formData, time_estimate: e.target.value })}
                                        className="bg-muted border-border text-foreground"
                                        placeholder="e.g., 2.5"
                                    />
                                </div>
                            </div>
                            {users.length > 0 && (
                                <div className="space-y-2">
                                    <Label>Assign To</Label>
                                    <Select
                                        value={formData.assigned_to}
                                        onValueChange={v => setFormData({ ...formData, assigned_to: v })}
                                    >
                                        <SelectTrigger className="bg-muted border-border text-foreground">
                                            <SelectValue placeholder="Select user..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {users.map(user => (
                                                <SelectItem key={user.id} value={user.id.toString()}>
                                                    {user.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            <div className="flex gap-3 pt-2">
                                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="flex-1">
                                    Cancel
                                </Button>
                                <Button type="submit" className="flex-1 bg-coin-600 hover:bg-coin-700">
                                    Create
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
            </div>
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <Card className="bg-card border-border">
                    <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Total Tasks</p>
                        <p className="text-2xl font-bold text-foreground">{tasks?.total || 0}</p>
                    </CardContent>
                </Card>
                <Card className="bg-card border-border">
                    <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Pending</p>
                        <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{pendingCount}</p>
                    </CardContent>
                </Card>
                <Card className="bg-card border-border">
                    <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Overdue</p>
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">{overdueCount}</p>
                    </CardContent>
                </Card>
                <Card className="bg-card border-border">
                    <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Completed</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">{completedCount}</p>
                    </CardContent>
                </Card>
                <Card className="bg-card border-border">
                    <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Urgent</p>
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                            {(tasks?.data || []).filter(t => t.priority === 'urgent').length}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            {showFilters && (
                <Card className="bg-card border-border mb-4">
                    <CardContent className="p-4">
                        <div className="flex flex-wrap gap-3">
                            <Select value={filters?.status || ''} onValueChange={v => router.get(route('front-office.tasks.index'), { ...filters, status: v })}>
                                <SelectTrigger className="w-[180px] bg-muted border-border text-foreground">
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All Statuses</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="overdue">Overdue</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={filters?.priority || ''} onValueChange={v => router.get(route('front-office.tasks.index'), { ...filters, priority: v })}>
                                <SelectTrigger className="w-[180px] bg-muted border-border text-foreground">
                                    <SelectValue placeholder="Filter by priority" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All Priorities</SelectItem>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="urgent">Urgent</SelectItem>
                                </SelectContent>
                            </Select>
                            {users.length > 0 && (
                                <Select value={filters?.assigned_to || ''} onValueChange={v => router.get(route('front-office.tasks.index'), { ...filters, assigned_to: v })}>
                                    <SelectTrigger className="w-[180px] bg-muted border-border text-foreground">
                                        <SelectValue placeholder="Filter by assignee" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All Users</SelectItem>
                                        {users.map(user => (
                                            <SelectItem key={user.id} value={user.id.toString()}>
                                                {user.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search tasks..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-10 bg-card border-border text-foreground"
                    />
                </div>
                <Button variant="outline" size="sm" className="border-border text-muted-foreground">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                </Button>
            </div>

            {/* Tasks List */}
            <Card className="bg-card border-border">
                <CardContent className="p-0">
                    <div className="divide-y divide-border">
                        {isExecutiveAssistant && (
                            <div className="p-4 flex items-center gap-3">
                                <Checkbox
                                    checked={selectedTasks.length === (tasks?.data || []).length && (tasks?.data || []).length > 0}
                                    onCheckedChange={selectAll}
                                />
                                <span className="text-sm text-muted-foreground">
                                    {selectedTasks.length} selected
                                </span>
                            </div>
                        )}
                        {filteredTasks.length === 0 ? (
                            <div className="p-6 text-center text-muted-foreground">
                                No tasks found
                            </div>
                        ) : (
                            filteredTasks.map((task) => (
                                <div key={task.id} className="p-4 lg:p-6 hover:bg-muted/50 transition-colors">
                                    <div className="flex items-start gap-4">
                                        {isExecutiveAssistant && (
                                            <Checkbox
                                                checked={selectedTasks.includes(task.id)}
                                                onCheckedChange={() => toggleTaskSelection(task.id)}
                                            />
                                        )}
                                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openTaskDetail(task)}>
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className={cn(
                                                    "font-medium text-foreground",
                                                    task.status === 'completed' && "line-through text-muted-foreground"
                                                )}>
                                                    {task.title}
                                                </h3>
                                                <Badge className={cn("border", getPriorityColor(task.priority))}>
                                                    {task.priority}
                                                </Badge>
                                                <Badge className={cn("border", getStatusColor(task.status))}>
                                                    {task.status}
                                                </Badge>
                                            </div>
                                            {task.description && (
                                                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{task.description}</p>
                                            )}
                                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                                {task.due_date && (
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-4 h-4" />
                                                        Due {new Date(task.due_date).toLocaleDateString()}
                                                    </span>
                                                )}
                                                {task.time_estimate && (
                                                    <span className="flex items-center gap-1">
                                                        <Timer className="w-4 h-4" />
                                                        Est: {task.time_estimate}h
                                                    </span>
                                                )}
                                                {task.assignee && (
                                                    <span className="flex items-center gap-1">
                                                        <User className="w-4 h-4" />
                                                        {task.assignee.name}
                                                    </span>
                                                )}
                                                {task.creator && (
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-4 h-4" />
                                                        Created by {task.creator.name}
                                                    </span>
                                                )}
                                                {task.comments_count > 0 && (
                                                    <span className="flex items-center gap-1">
                                                        <MessageSquare className="w-4 h-4" />
                                                        {task.comments_count} comments
                                                    </span>
                                                )}
                                                {task.time_entries_count > 0 && (
                                                    <span className="flex items-center gap-1">
                                                        <Timer className="w-4 h-4" />
                                                        {task.time_entries_count} time entries
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {task.status !== 'completed' && task.status !== 'overdue' && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleComplete(task.id)}
                                                    className="flex-shrink-0 border-green-500/30 text-green-600 dark:text-green-400 hover:bg-green-500/10"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                </Button>
                                            )}
                                            {task.status === 'overdue' && (
                                                <Badge className="bg-red-500 text-white border-red-500">Overdue</Badge>
                                            )}
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent className="bg-popover border-border">
                                                    <DropdownMenuItem onClick={() => openTaskDetail(task)} className="text-foreground hover:bg-muted">
                                                        <FileText className="w-4 h-4 mr-2" />
                                                        View Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleDelete(task.id)} className="text-destructive hover:bg-muted">
                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Task Detail Modal */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="bg-background border-border text-foreground max-w-2xl max-h-[80vh] overflow-y-auto">
                    {selectedTask && (
                        <>
                            <DialogHeader>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <DialogTitle className="text-xl mb-2">{selectedTask.title}</DialogTitle>
                                        <div className="flex flex-wrap gap-2">
                                            <Badge className={cn("border", getPriorityColor(selectedTask.priority))}>
                                                {selectedTask.priority}
                                            </Badge>
                                            <Badge className={cn("border", getStatusColor(selectedTask.status))}>
                                                {selectedTask.status}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </DialogHeader>

                            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
                                <TabsList className="bg-muted border-border">
                                    <TabsTrigger value="details" className="data-[state=active]:bg-background">Details</TabsTrigger>
                                    <TabsTrigger value="comments" className="data-[state=active]:bg-background">
                                        Comments ({selectedTask.comments_count || 0})
                                    </TabsTrigger>
                                    <TabsTrigger value="time" className="data-[state=active]:bg-background">
                                        Time ({selectedTask.time_entries_count || 0})
                                    </TabsTrigger>
                                    <TabsTrigger value="dependencies" className="data-[state=active]:bg-background">Dependencies</TabsTrigger>
                                </TabsList>

                                <TabsContent value="details" className="space-y-4 mt-4">
                                    {selectedTask.description && (
                                        <div>
                                            <Label className="text-muted-foreground">Description</Label>
                                            <p className="text-foreground mt-1">{selectedTask.description}</p>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-2 gap-4">
                                        {selectedTask.assignee && (
                                            <div>
                                                <Label className="text-muted-foreground">Assigned To</Label>
                                                <p className="text-foreground mt-1">{selectedTask.assignee.name}</p>
                                            </div>
                                        )}
                                        {selectedTask.due_date && (
                                            <div>
                                                <Label className="text-muted-foreground">Due Date</Label>
                                                <p className="text-foreground mt-1">{new Date(selectedTask.due_date).toLocaleDateString()}</p>
                                            </div>
                                        )}
                                        {selectedTask.time_estimate && (
                                            <div>
                                                <Label className="text-muted-foreground">Time Estimate</Label>
                                                <p className="text-foreground mt-1">{selectedTask.time_estimate} hours</p>
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>

                                <TabsContent value="comments" className="space-y-4 mt-4">
                                    <form onSubmit={handleAddComment} className="space-y-3">
                                        <Textarea
                                            value={commentText}
                                            onChange={e => setCommentText(e.target.value)}
                                            placeholder="Add a comment..."
                                            className="bg-muted border-border text-foreground min-h-[80px]"
                                        />
                                        <Button type="submit" className="bg-coin-600 hover:bg-coin-700">
                                            <MessageSquare className="w-4 h-4 mr-2" />
                                            Add Comment
                                        </Button>
                                    </form>
                                    <div className="space-y-3">
                                        {(selectedTask.comments || []).length === 0 ? (
                                            <p className="text-muted-foreground text-center py-4">No comments yet</p>
                                        ) : (
                                            selectedTask.comments?.map(comment => (
                                                <div key={comment.id} className="p-3 bg-muted rounded-lg border border-border">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="font-medium text-foreground">{comment.user.name}</span>
                                                        <span className="text-xs text-muted-foreground">{new Date(comment.created_at).toLocaleString()}</span>
                                                    </div>
                                                    <p className="text-muted-foreground">{comment.content}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </TabsContent>

                                <TabsContent value="time" className="space-y-4 mt-4">
                                    <form onSubmit={handleLogTime} className="space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <Label>Hours</Label>
                                                <Input
                                                    type="number"
                                                    step="0.25"
                                                    value={timeEntry.hours}
                                                    onChange={e => setTimeEntry({ ...timeEntry, hours: e.target.value })}
                                                    className="bg-muted border-border text-foreground"
                                                    placeholder="e.g., 2.5"
                                                />
                                            </div>
                                            <div>
                                                <Label>Notes</Label>
                                                <Input
                                                    value={timeEntry.notes}
                                                    onChange={e => setTimeEntry({ ...timeEntry, notes: e.target.value })}
                                                    className="bg-muted border-border text-foreground"
                                                    placeholder="Optional notes..."
                                                />
                                            </div>
                                        </div>
                                        <Button type="submit" className="bg-coin-600 hover:bg-coin-700">
                                            <Timer className="w-4 h-4 mr-2" />
                                            Log Time
                                        </Button>
                                    </form>
                                    <div className="space-y-3">
                                        {(selectedTask.timeEntries || []).length === 0 ? (
                                            <p className="text-muted-foreground text-center py-4">No time entries yet</p>
                                        ) : (
                                            selectedTask.timeEntries?.map(entry => (
                                                <div key={entry.id} className="p-3 bg-muted rounded-lg border border-border">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-medium text-foreground">{entry.hours} hours</span>
                                                        <span className="text-xs text-muted-foreground">{new Date(entry.created_at).toLocaleString()}</span>
                                                    </div>
                                                    {entry.notes && <p className="text-muted-foreground text-sm mt-1">{entry.notes}</p>}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </TabsContent>

                                <TabsContent value="dependencies" className="space-y-4 mt-4">
                                    {(selectedTask.dependencies || []).length === 0 ? (
                                        <p className="text-muted-foreground text-center py-4">No dependencies</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {selectedTask.dependencies?.map(dep => (
                                                <div key={dep.id} className="p-3 bg-muted rounded-lg border border-border">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-foreground">{dep.title}</span>
                                                        <Badge className={cn("border", getStatusColor(dep.status))}>
                                                            {dep.status}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </TabsContent>
                            </Tabs>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    );
}
