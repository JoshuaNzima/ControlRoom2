import React from 'react';
import { useForm } from '@inertiajs/react';
import {
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Textarea } from '@/Components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import { Label } from '@/Components/ui/label';

const CreateTicketForm = ({ onClose }) => {
    const { data, setData, post, processing, errors } = useForm({
        title: '',
        description: '',
        priority: '',
        category: '',
        assigned_to: '',
        due_date: '',
        attachments: [],
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('control-room.tickets.store'), {
            onSuccess: () => {
                onClose();
            },
        });
    };

    const handleFileChange = (e) => {
        setData('attachments', e.target.files);
    };

    return (
        <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
                <DialogTitle>Create New Ticket</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                        id="title"
                        value={data.title}
                        onChange={e => setData('title', e.target.value)}
                        error={errors.title}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                        id="description"
                        value={data.description}
                        onChange={e => setData('description', e.target.value)}
                        error={errors.description}
                        rows={4}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="priority">Priority</Label>
                        <Select
                            value={data.priority}
                            onValueChange={value => setData('priority', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="critical">Critical</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.priority && (
                            <p className="text-sm text-red-500">{errors.priority}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select
                            value={data.category}
                            onValueChange={value => setData('category', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="complaint">Complaint</SelectItem>
                                <SelectItem value="incident">Incident</SelectItem>
                                <SelectItem value="request">Request</SelectItem>
                                <SelectItem value="maintenance">Maintenance</SelectItem>
                                <SelectItem value="emergency">Emergency</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.category && (
                            <p className="text-sm text-red-500">{errors.category}</p>
                        )}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="due_date">Due Date</Label>
                    <Input
                        id="due_date"
                        type="date"
                        value={data.due_date}
                        onChange={e => setData('due_date', e.target.value)}
                        error={errors.due_date}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="attachments">Attachments</Label>
                    <Input
                        id="attachments"
                        type="file"
                        onChange={handleFileChange}
                        multiple
                        error={errors.attachments}
                    />
                </div>

                <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={onClose} type="button">
                        Cancel
                    </Button>
                    <Button type="submit" disabled={processing}>
                        Create Ticket
                    </Button>
                </div>
            </form>
        </DialogContent>
    );
};

export default CreateTicketForm;