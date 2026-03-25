<?php

namespace App\Http\Controllers\FrontOffice;

use App\Http\Controllers\Controller;
use App\Models\FrontOfficeMessage;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class MessageController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $role = $this->getRole($user);

        $received = FrontOfficeMessage::with('sender')
            ->where('recipient_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->take(20)
            ->get();

        $sent = FrontOfficeMessage::with('recipient')
            ->where('sender_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->take(20)
            ->get();

        $unreadCount = FrontOfficeMessage::where('recipient_id', $user->id)
            ->whereNull('read_at')
            ->count();

        // Staff list for sending messages
        $staff = User::whereHas('roles', function($q) {
            $q->whereIn('name', [
                'executive_assistant',
                'receptionist',
                'personal_assistant',
                'admin',
                'super_admin',
            ]);
        })
        ->select('id', 'name', 'email')
        ->orderBy('name')
        ->get();

        return inertia('FrontOffice/Messages/Index', [
            'received' => $received,
            'sent' => $sent,
            'unreadCount' => $unreadCount,
            'staff' => $staff,
            'role' => $role,
            'can' => [
                'manage_calendar' => in_array($role, ['executive_assistant', 'personal_assistant', 'admin', 'super_admin']),
                'manage_tasks' => in_array($role, ['executive_assistant', 'personal_assistant', 'admin', 'super_admin']),
                'view_reports' => in_array($role, ['executive_assistant', 'admin', 'super_admin']),
                'export_data' => in_array($role, ['executive_assistant', 'admin', 'super_admin']),
            ],
        ]);
    }

    private function getRole($user): string
    {
        $roles = $user->roles->pluck('name')->toArray();

        foreach (['executive_assistant', 'personal_assistant', 'receptionist', 'super_admin', 'admin'] as $r) {
            if (in_array($r, $roles)) {
                return $r;
            }
        }

        return 'receptionist';
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'recipient_id' => 'required|exists:users,id',
            'subject' => 'required|string|max:255',
            'message' => 'required|string',
            'priority' => 'nullable|string|in:low,normal,high,urgent',
        ]);

        FrontOfficeMessage::create([
            ...$validated,
            'sender_id' => Auth::id(),
        ]);

        return back()->with('success', 'Message sent successfully.');
    }

    public function markRead(FrontOfficeMessage $message)
    {
        if ($message->recipient_id !== Auth::id()) {
            abort(403);
        }

        $message->update([
            'read_at' => now(),
        ]);

        return back()->with('success', 'Message marked as read.');
    }
}
