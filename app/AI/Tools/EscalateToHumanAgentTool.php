<?php

namespace App\AI\Tools;

use App\Models\ChatMessage;
use App\Models\ChatSession;
use App\Notifications\ChatTransferRequest;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use LaravelAIAgent\Attributes\AsAITool;

class EscalateToHumanAgentTool
{
    #[AsAITool('Escalate the current chat to a human support agent (transfer the session)')]
    public function escalate(
        string $reason = 'User requested human assistance',
        ?string $conversation_id = null
    ): array {
        $userId = Auth::id();

        if ($userId === null) {
            return [
                'ok' => false,
                'reason' => 'Not authenticated. Cannot escalate to human agent.',
            ];
        }

        // Widget payload may use different parameter casing/naming depending on client/widget version.
        // Prefer tool argument, then common request keys, then fall back to random.
        $conversationId = $conversation_id
            ?: \request()->input('conversation_id')
            ?: \request()->input('conversationId')
            ?: \request()->input('session_id')
            ?: \request()->input('sessionId');

        if (empty($conversationId)) {
            $conversationId = 'chat_' . \Illuminate\Support\Str::random(16);
        }

        $session = ChatSession::firstOrCreate(
            ['session_id' => $conversationId],
            [
                'user_id' => $userId,
                'context' => 'general',
                'status' => ChatSession::STATUS_PENDING_TRANSFER,
            ]
        );

        if (!$session->isPendingTransfer()) {
            $session->update(['status' => ChatSession::STATUS_PENDING_TRANSFER]);
        }

        ChatMessage::createMessage(
            $session,
            ChatMessage::SENDER_ASSISTANT,
            'I understand you need human help. I’m connecting you to a support agent now—please wait a moment.',
            null,
            ['transfer_reason' => $reason]
        );

        // Notify super_admin/admin/control_room_operator users
        $agents = User::whereHas('roles', function ($q) {
            $q->whereIn('name', ['super_admin', 'control_room_operator', 'admin']);
        })->get();

        foreach ($agents as $agent) {
            $agent->notify(new ChatTransferRequest($session, $reason));
        }

        return [
            'ok' => true,
            'transferred' => false,
            'session_id' => $session->session_id,
            'message' => 'Human agent transfer requested',
        ];
    }
}
