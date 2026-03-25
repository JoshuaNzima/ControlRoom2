import { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import FrontOfficeLayout from '@/Layouts/FrontOfficeLayout';
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Plus,
    Clock,
    MapPin,
    Users,
    X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import { Label } from '@/Components/ui/label';
import { Input } from '@/Components/ui/input';
import { cn } from '@/lib/utils';

interface CalendarEvent {
    id: number;
    title: string;
    start: string;
    end: string | null;
    allDay: boolean;
    description: string | null;
    location: string | null;
    attendees: number[] | null;
    color: string;
}

export default function CalendarIndex() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        start_time: '',
        end_time: '',
        all_day: false,
        location: '',
        type: 'meeting',
    });

    useEffect(() => {
        fetchEvents();
    }, [currentDate]);

    const fetchEvents = () => {
        const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        fetch(route('front-office.calendar.events', {
            start: start.toISOString(),
            end: end.toISOString(),
        }))
            .then(res => res.json())
            .then(data => setEvents(data));
    };

    const getDaysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    };

    const handleDayClick = (day: number) => {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        setSelectedDate(date);
        setSelectedEvent(null);
        setFormData({
            ...formData,
            start_time: date.toISOString().slice(0, 16),
            end_time: '',
        });
        setIsModalOpen(true);
    };

    const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedEvent(event);
        setFormData({
            title: event.title,
            description: event.description || '',
            start_time: event.start.slice(0, 16),
            end_time: event.end?.slice(0, 16) || '',
            all_day: event.allDay,
            location: event.location || '',
            type: 'meeting',
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            ...formData,
            start_time: new Date(formData.start_time).toISOString(),
            end_time: formData.end_time ? new Date(formData.end_time).toISOString() : null,
        };

        if (selectedEvent) {
            router.put(route('front-office.calendar.update', selectedEvent.id), payload, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    fetchEvents();
                },
            });
        } else {
            router.post(route('front-office.calendar.store'), payload, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    fetchEvents();
                },
            });
        }
    };

    const handleDelete = () => {
        if (selectedEvent && confirm('Delete this event?')) {
            router.delete(route('front-office.calendar.destroy', selectedEvent.id), {
                onSuccess: () => {
                    setIsModalOpen(false);
                    fetchEvents();
                },
            });
        }
    };

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const today = new Date();

    const getEventsForDay = (day: number) => {
        const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
        return events.filter(e => new Date(e.start).toDateString() === dateStr);
    };

    return (
        <FrontOfficeLayout title="Calendar">
            <Head title="Calendar" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <CalendarIcon className="w-6 h-6 text-red-500" />
                        Calendar
                    </h1>
                    <p className="text-muted-foreground mt-1">Manage appointments and events</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={handlePrevMonth} className="border-border text-muted-foreground">
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <h2 className="text-lg font-semibold text-foreground min-w-[140px] text-center">
                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </h2>
                    <Button variant="outline" onClick={handleNextMonth} className="border-border text-muted-foreground">
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Calendar Grid */}
            <Card className="bg-card border-border">
                <CardContent className="p-4 lg:p-6">
                    {/* Day Headers */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {dayNames.map(day => (
                            <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Days */}
                    <div className="grid grid-cols-7 gap-1">
                        {/* Empty cells for days before start of month */}
                        {Array.from({ length: firstDay }).map((_, i) => (
                            <div key={`empty-${i}`} className="h-24 lg:h-32 bg-muted/50 rounded-lg" />
                        ))}

                        {/* Days */}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const isToday = today.getDate() === day &&
                                today.getMonth() === currentDate.getMonth() &&
                                today.getFullYear() === currentDate.getFullYear();
                            const dayEvents = getEventsForDay(day);

                            return (
                                <div
                                    key={day}
                                    onClick={() => handleDayClick(day)}
                                    className={cn(
                                        "h-24 lg:h-32 bg-muted rounded-lg p-2 cursor-pointer transition-colors hover:bg-muted/80",
                                        isToday && "ring-2 ring-red-500/50 bg-red-500/5"
                                    )}
                                >
                                    <div className={cn(
                                        "text-sm font-medium mb-1",
                                        isToday ? "text-red-500" : "text-muted-foreground"
                                    )}>
                                        {day}
                                    </div>
                                    <div className="space-y-1 overflow-hidden">
                                        {dayEvents.slice(0, 3).map((event, idx) => (
                                            <div
                                                key={idx}
                                                onClick={(e) => handleEventClick(event, e)}
                                                className="text-xs px-2 py-1 rounded truncate cursor-pointer hover:opacity-80"
                                                style={{ backgroundColor: event.color + '20', color: event.color }}
                                            >
                                                {event.title}
                                            </div>
                                        ))}
                                        {dayEvents.length > 3 && (
                                            <div className="text-xs text-muted-foreground px-2">
                                                +{dayEvents.length - 3} more
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Event Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="bg-background border-border text-foreground max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CalendarIcon className="w-5 h-5 text-red-500" />
                            {selectedEvent ? 'Edit Event' : 'New Event'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title *</Label>
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
                            <Input
                                id="description"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="bg-muted border-border text-foreground"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="start_time">Start *</Label>
                                <Input
                                    id="start_time"
                                    type="datetime-local"
                                    value={formData.start_time}
                                    onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                                    className="bg-muted border-border text-foreground"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="end_time">End</Label>
                                <Input
                                    id="end_time"
                                    type="datetime-local"
                                    value={formData.end_time}
                                    onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                                    className="bg-muted border-border text-foreground"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="location">Location</Label>
                            <Input
                                id="location"
                                value={formData.location}
                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                                className="bg-muted border-border text-foreground"
                                placeholder="e.g., Conference Room A"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="all_day"
                                checked={formData.all_day}
                                onChange={e => setFormData({ ...formData, all_day: e.target.checked })}
                                className="rounded bg-muted border-border"
                            />
                            <Label htmlFor="all_day" className="text-sm">All day event</Label>
                        </div>
                        <div className="flex gap-3 pt-2">
                            {selectedEvent && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={handleDelete}
                                    className="bg-red-600 hover:bg-red-700"
                                >
                                    <X className="w-4 h-4 mr-2" />
                                    Delete
                                </Button>
                            )}
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button type="submit" className="flex-1 bg-red-600 hover:bg-red-700">
                                {selectedEvent ? 'Update' : 'Create'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </FrontOfficeLayout>
    );
}
