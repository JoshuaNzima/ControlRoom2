<?php

use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Auth;
use App\Models\Communication\Conversation;

// Authorize users to join a conversation presence channel if they are participants
Broadcast::channel('conversation.{conversationId}', function ($user, $conversationId) {
    try {
        return Conversation::whereKey($conversationId)
            ->whereHas('participants', fn($q) => $q->where('user_id', $user->id))
            ->exists()
            ? ['id' => $user->id, 'name' => $user->name]
            : false;
    } catch (Throwable $e) {
        return false;
    }
});

// Allow authenticated users to listen for emergency alerts
Broadcast::channel('emergencies', function ($user) {
    return (bool) $user?->id;
});

Broadcast::channel('control-room', function ($user) {
    if (!$user) return false;
    return method_exists($user, 'hasAnyRole')
        ? $user->hasAnyRole(['super_admin', 'admin', 'control_room_operator', 'operations_officer', 'manager'])
        : true;
});

Broadcast::channel('admins', function ($user) {
    if (!$user) return false;
    return method_exists($user, 'hasAnyRole')
        ? $user->hasAnyRole(['super_admin', 'admin', 'manager'])
        : true;
});

Broadcast::channel('user.{id}', function ($user, $id) {
    return $user && (int) $user->id === (int) $id;
});

Broadcast::channel('gps-alerts', function ($user) {
    if (!$user) return false;
    return method_exists($user, 'hasAnyRole')
        ? $user->hasAnyRole(['super_admin', 'admin', 'control_room_operator', 'operations_officer', 'manager'])
        : true;
});
