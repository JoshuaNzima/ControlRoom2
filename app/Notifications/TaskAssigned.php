<?php

namespace App\Notifications;

use App\Models\Task;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class TaskAssigned extends Notification
{
    use Queueable;

    public Task $task;

    public function __construct(Task $task)
    {
        $this->task = $task;
    }

    public function via($notifiable)
    {
        return ['mail', 'database'];
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('New task assigned to you')
            ->line('A new task has been assigned to you: ' . $this->task->title)
            ->line('Module: ' . ($this->task->module ?? 'N/A'))
            ->line('Priority: ' . ($this->task->priority ?? 'medium'))
            ->line('Status: ' . ($this->task->status ?? 'pending'))
            ->action('View Task', url(route('tasks.my') . '?assigned_to=' . $notifiable->id))
            ->line('Please log in to manage your tasks.');
    }

    public function toDatabase($notifiable)
    {
        return [
            'task_id' => $this->task->id,
            'title' => $this->task->title,
            'assigned_by' => $this->task->created_by,
            'status' => $this->task->status,
        ];
    }
}
