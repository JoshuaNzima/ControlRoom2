<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\DatabaseMessage;
use Illuminate\Notifications\Messages\MailMessage;
use App\Models\User;

class ZoneCommanderUnassigned extends Notification
{
    use Queueable;

    protected $zoneCommander;

    public function __construct(User $user)
    {
        $this->zoneCommander = $user;
    }

    public function via($notifiable)
    {
        return ['database'];
    }

    public function toDatabase($notifiable)
    {
        return [
            'message' => "Zone Commander {$this->zoneCommander->name} ({$this->zoneCommander->email}) has no zone assigned.",
            'user_id' => $this->zoneCommander->id,
        ];
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('Zone Commander without Zone Assigned')
            ->line("Zone Commander {$this->zoneCommander->name} has been assigned the role but does not have a zone set.")
            ->action('Manage Users', url(route('admin.users.index')))
            ->line('Please assign a zone or contact support.');
    }
}
