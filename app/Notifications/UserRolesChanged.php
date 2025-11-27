<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class UserRolesChanged extends Notification
{
    use Queueable;

    public function __construct(
        public array $oldRoles,
        public array $newRoles,
        public ?int $changedById = null,
        public ?string $changedByName = null,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $added = array_values(array_diff($this->newRoles, $this->oldRoles));
        $removed = array_values(array_diff($this->oldRoles, $this->newRoles));

        $message = (new MailMessage)
            ->subject('Your access roles were updated')
            ->greeting('Hello ' . ($notifiable->name ?? ''))
            ->line('Your system roles have been updated.');

        if (!empty($added)) {
            $message->line('Added: ' . implode(', ', $added));
        }
        if (!empty($removed)) {
            $message->line('Removed: ' . implode(', ', $removed));
        }

        if ($this->changedByName) {
            $message->line('Changed by: ' . $this->changedByName);
        }

        return $message->action('Open Dashboard', url(route('dashboard')));
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'roles_changed',
            'old_roles' => $this->oldRoles,
            'new_roles' => $this->newRoles,
            'changed_by_id' => $this->changedById,
            'changed_by_name' => $this->changedByName,
        ];
    }
}
