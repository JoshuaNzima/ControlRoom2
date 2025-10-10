<?php

namespace App\Policies;

use App\Models\Ticket;
use App\Models\User;

class TicketPolicy
{
    public function viewAny(User $user): bool
    {
        return true; // All authenticated users can view tickets
    }

    public function view(User $user, Ticket $ticket): bool
    {
        return true; // All authenticated users can view individual tickets
    }

    public function create(User $user): bool
    {
        return true; // All authenticated users can create tickets
    }

    public function update(User $user, Ticket $ticket): bool
    {
        return $user->hasAnyRole(['supervisor', 'manager', 'control_room_operator'])
            || $ticket->assigned_to === $user->id
            || $ticket->reported_by === $user->id;
    }

    public function delete(User $user, Ticket $ticket): bool
    {
        return $user->hasRole(['supervisor', 'manager']);
    }

    public function manage(User $user, Ticket $ticket): bool
    {
        return $user->hasAnyRole(['supervisor', 'manager', 'control_room_operator'])
            || $ticket->assigned_to === $user->id;
    }

    public function escalate(User $user, Ticket $ticket): bool
    {
        return $user->hasAnyRole(['supervisor', 'manager', 'control_room_operator']);
    }
}