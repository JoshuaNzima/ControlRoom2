<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $notifications = $user->notifications()
            ->latest()
            ->limit(25)
            ->get()
            ->map(function ($n) {
                return [
                    'id' => $n->id,
                    'type' => class_basename($n->type),
                    'data' => $n->data,
                    'read_at' => $n->read_at,
                    'created_at' => $n->created_at,
                ];
            });

        return response()->json(['success' => true, 'notifications' => $notifications]);
    }

    public function unreadCount(Request $request)
    {
        $count = $request->user()->unreadNotifications()->count();
        return response()->json(['success' => true, 'count' => $count]);
    }

    public function markAsRead(Request $request, string $id)
    {
        $notification = $request->user()->notifications()->where('id', $id)->firstOrFail();
        $notification->markAsRead();
        return $this->successResponse([], 'Notification marked as read.');
    }

    public function markAllAsRead(Request $request)
    {
        $request->user()->unreadNotifications->markAsRead();
        return $this->successResponse([], 'Notification marked as read.');
    }
}
